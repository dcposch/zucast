import { Client, ClientConfig, Pool } from "pg";
import { AuthToken } from "./auth";
import { Transaction } from "@/common/model";
import { PoolConfig } from "pg";

/** Credentials automatically come from env.PGUSER etc, or from PGURL. */
const dbConfig: ClientConfig = {
  connectionString: process.env.PGURL,
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

interface TransactionRow {
  id: number;
  tx: Transaction;
}

export class DB {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(poolConfig);
  }

  getStatus() {
    const { idleCount, totalCount, waitingCount } = this.pool;
    return {
      idleCount,
      totalCount,
      waitingCount,
    };
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
          CREATE TABLE IF NOT EXISTS tx (
              id INTEGER PRIMARY KEY,
              tx JSONB NOT NULL
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

  async loadTransactions(): Promise<Transaction[]> {
    console.log(`[DB] loading stored action log`);
    const client = await this.pool.connect();
    const result = await client.query<TransactionRow>("SELECT * FROM tx");
    client.release();

    // Keep a contiguous log, ensuring DB ID = array index
    const ret: Transaction[] = [];
    for (const row of result.rows) {
      ret[row.id] = row.tx;
    }
    let numActions;
    for (numActions = 0; numActions < ret.length; numActions++) {
      if (ret[numActions] == null) break;
    }
    console.log(`[DB] ${numActions} valid / ${ret.length} total actions`);
    ret.length = numActions;

    return ret;
  }

  async saveTransaction(id: number, tx: Transaction) {
    console.log(`[DB] saving stored action ${id}: ${tx.type}`);
    const client = await this.pool.connect();
    await client.query(
      `INSERT INTO tx (id, tx) VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET tx = $2`,
      [id, tx]
    );
    client.release();
  }
}
