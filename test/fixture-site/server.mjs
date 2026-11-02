import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  const file = join(import.meta.dirname, 'app', path === '/' ? 'index.html' : path.endsWith('/') ? `${path}index.html` : path);
  try {
    const body = await readFile(extname(file) ? file : `${file}.html`);
    res.setHeader('content-type', types[extname(file) || '.html'] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('not found');
  }
}).listen(process.env.PORT ?? 4174);
