import { NextApiResponse } from "next";
import { server } from "@/server";

export default function handler(_: unknown, res: NextApiResponse<any>) {
  return res.status(200).json(server.getStatus());
}
