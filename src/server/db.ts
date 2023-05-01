import { Client, ClientConfig, Pool } from "pg";
import { AuthToken } from "./auth";
import { StoredAction } from "@/common/model";
import { PoolConfig } from "pg";

/** Credentials automatically come from env.PGUSER etc */
const dbConfig: ClientConfig = {
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
  database: "zucast",
};

const poolConfig: PoolConfig = {
  ...dbConfig,
  max: 8,
  idleTimeoutMillis: 60000,
};

interface AuthTokenRow {
  id: number;
  token: AuthToken;
}

interface StoredActionRow {
  id: number;
  action: StoredAction;
}

export class DB {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
  }

  async createTables() {
    console.log(`[DB] connecting`);
    const client = new Client(dbConfig);
    await client.connect();

    console.log("[DB] connected, creating tables if necessary");
    await client.query(`
          CREATE TABLE IF NOT EXISTS authToken (
              id SERIAL PRIMARY KEY,
              token JSONB NOT NULL
          );
      `);
    await client.query(`
          CREATE TABLE IF NOT EXISTS storedAction (
              id INTEGER PRIMARY KEY,
              action JSONB NOT NULL
          );
      `);
    await client.end();
  }

  async loadAuthTokens(): Promise<AuthToken[]> {
    console.log(`[DB] loading auth tokens`);
    const client = await this.pool.connect();
    const result = await client.query<AuthTokenRow>("SELECT * FROM authToken");
    client.release();

    console.log(`[DB] ${result.rows.length} auth tokens`);
    return result.rows.map((row) => row.token);
  }

  async saveAuthToken(token: AuthToken) {
    console.log(`[DB] inserting auth token`);
    const client = await this.pool.connect();
    await client.query("INSERT INTO authToken (token) VALUES ($1)", [token]);
    client.release();
  }

  async loadStoredActions(): Promise<StoredAction[]> {
    console.log(`[DB] loading stored action log`);
    const client = await this.pool.connect();
    const result = await client.query<StoredActionRow>(
      "SELECT * FROM storedAction"
    );
    client.release();

    // Keep a contiguous log, ensuring DB ID = array index
    const ret: StoredAction[] = [];
    for (const row of result.rows) {
      ret[row.id] = row.action;
    }
    let numActions;
    for (numActions = 0; numActions < ret.length; numActions++) {
      if (ret[numActions] == null) break;
    }
    console.log(`[DB] ${numActions} valid / ${ret.length} total actions`);
    ret.length = numActions;

    return ret;
  }

  async saveStoredAction(id: number, action: StoredAction) {
    console.log(`[DB] saving stored action ${id}: ${action.type}`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO storedAction (id, action) VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET action = $2`,
      [id, action]
    );
    client.release();
  }
}
