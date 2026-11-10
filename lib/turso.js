// Minimal D1-compatible adapter for the queries used by Wave, over Turso's HTTP API.
// It avoids bundling a database driver and stores all data in a persistent remote database.
function arg(value) {
  if (value == null) return { type: 'null' };
  if (typeof value === 'number') return Number.isInteger(value)
    ? { type: 'integer', value: String(value) }
    : { type: 'float', value };
  return { type: 'text', value: String(value) };
}
function value(cell) {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer' || cell.type === 'float') return Number(cell.value);
  return cell.value;
}
export function createDatabase(url, token) {
  const endpoint = url.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '') + '/v2/pipeline';
  async function execute(sql, args) {
    const r = await fetch(endpoint, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: args.map(arg) } }, { type: 'close' }] }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`Ошибка базы данных (${r.status})`);
    const data = await r.json();
    const item = data.results?.[0];
    if (!item || item.type === 'error') throw new Error(item?.error?.message || 'Ошибка базы данных');
    const result = item.response.result;
    const names = result.cols.map(c => c.name);
    const results = result.rows.map(row => Object.fromEntries(row.map((cell, i) => [names[i], value(cell)])));
    return { results, meta: { last_row_id: Number(result.last_insert_rowid || 0), changes: result.affected_row_count } };
  }
  function prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async run() { return execute(sql, args); },
      async all() { return execute(sql, args); },
      async first() { return (await execute(sql, args)).results[0] || null; },
    };
  }
  return { prepare, batch: statements => Promise.all(statements.map(statement => statement.run())) };
}
