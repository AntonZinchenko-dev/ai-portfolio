/**
 * Режим разработки: пересобирает сайт при изменении файлов и обновляет вкладку браузера.
 * Полная сборка занимает около секунды, поэтому отдельный dev-сервер не нужен.
 */
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build.mjs';
import { serve } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT ?? 5173);
const clients = new Set();

const RELOAD = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;

async function rebuild() {
  try {
    await buildSite({ quiet: true });
    const { readFile, writeFile } = await import('node:fs/promises');
    const file = path.join(root, 'dist', 'index.html');
    await writeFile(file, (await readFile(file, 'utf8')).replace('</body>', `${RELOAD}</body>`));
    clients.forEach((res) => res.write('data: reload\n\n'));
    console.log(`[${new Date().toLocaleTimeString('ru-RU')}] пересобрано`);
  } catch (err) {
    console.error(err.message);
  }
}

await rebuild();
await serve(path.join(root, 'dist'), port, {
  onRequest(req, res) {
    if (req.url !== '/__reload') return false;
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return true;
  },
});
console.log(`http://localhost:${port}`);

let timer;
for (const dir of ['src', 'public']) {
  watch(path.join(root, dir), { recursive: true }, (_, file) => {
    if (file?.includes('generated') && !file.endsWith('.json')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  });
}
