// Convert Vercel's Node.js request/response to the Web API used by the original handlers.
export async function handle(req, res, handler, env) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, `${protocol}://${req.headers.host || 'localhost'}`);
  const action = String(req.query?.action || url.pathname.split('/').pop());
  const options = { method: req.method, headers: req.headers };
  if (!['GET', 'HEAD'].includes(req.method)) {
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }
  try {
    const response = await handler({ request: new Request(url, options), params: { action }, env });
    res.statusCode = response.status;
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Ошибка серверной функции' }));
  }
}
