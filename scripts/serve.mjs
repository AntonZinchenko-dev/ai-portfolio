/**
 * Простой статический сервер для dist/ — для предпросмотра и e2e-тестов.
 * Использование: node scripts/serve.mjs dist 4173
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

export function serve(dir, port, { onRequest } = {}) {
  const base = path.resolve(dir);
  const server = createServer(async (req, res) => {
    if (onRequest && onRequest(req, res)) return;
    const url = new URL(req.url ?? '/', 'http://local');
    let file = path.join(base, decodeURIComponent(url.pathname));
    if (!file.startsWith(base)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await readFile(file);
      const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
      // Отдача по частям (Range) нужна видео: без неё браузер не умеет перематывать.
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
      if (range) {
        const start = range[1] ? Number(range[1]) : body.length - Number(range[2]);
        const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
        res.writeHead(206, {
          'content-type': type,
          'content-range': `bytes ${start}-${end}/${body.length}`,
          'accept-ranges': 'bytes',
          'content-length': end - start + 1,
        });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': body.length });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Не найдено');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] ?? 'dist';
  const port = Number(process.argv[3] ?? 4173);
  const here = path.dirname(fileURLToPath(import.meta.url));
  await serve(path.resolve(here, '..', dir), port);
  console.log(`http://localhost:${port}`);
}
