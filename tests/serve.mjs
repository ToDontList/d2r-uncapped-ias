import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
// Serve only the real application files, including versioned module requests.
const files = new Map([
  ['index.html', 'text/html'], ['style.css', 'text/css'],
  ...['main.js', 'core.js', 'data.js', 'summons.js', 'wereforms.js']
    .map(name => [name, 'text/javascript']),
]);
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const name = path === '/' ? 'index.html' : path.slice(1);
  if (!files.has(name)) {
    response.writeHead(path === '/favicon.ico' ? 204 : 404).end();
    return;
  }
  try {
    const body = await readFile(new URL(name, root));
    response.writeHead(200, {
      'Content-Type': `${files.get(name)}; charset=utf-8`,
      'Cache-Control': 'no-store',
    }).end(body);
  } catch {
    response.writeHead(500).end('Unable to read application file');
  }
});
server.listen(4173, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
