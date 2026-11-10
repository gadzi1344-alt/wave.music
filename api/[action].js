import { onRequestGet } from '../lib/music.js';
import { handle } from '../lib/vercel.js';
export default function (req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end(); }
  return handle(req, res, onRequestGet, process.env);
}
