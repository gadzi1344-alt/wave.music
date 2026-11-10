import { onRequest } from '../../lib/users.js';
import { handle } from '../../lib/vercel.js';
import { createDatabase } from '../../lib/turso.js';
export default function (req, res) {
  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
  const DB = TURSO_DATABASE_URL && TURSO_AUTH_TOKEN ? createDatabase(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN) : null;
  return handle(req, res, onRequest, { ...process.env, DB });
}
