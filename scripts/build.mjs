/**
 * Сборка сайта в dist/.
 *
 * 1. Клиентский бандл: entry-client + острова отдельными чанками + CSS.
 * 2. Серверный бандл: та же страница, собранная для Node.
 * 3. Пререндер: страница превращается в готовый HTML и вставляется в шаблон.
 *    Поэтому первый экран виден сразу, а превью ссылки в Telegram и поисковики
 *    видят настоящий текст, а не пустой <div id="root">.
 * 4. Копирование public/ (фавикон, og-картинка, резюме, нарезанные изображения).
 *
 * Все пути в HTML относительные — сайт работает и в корне домена,
 * и в подпапке репозитория на GitHub Pages.
 */
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const cache = path.join(root, '.cache');

const SITE_URL = ensureSlash(process.env.SITE_URL || 'https://antonzinchenko-dev.github.io/ai-portfolio/');
const REPO_URL = process.env.REPO_URL || 'https://github.com/AntonZinchenko-dev/ai-portfolio';
const ASK_API = process.env.ASK_API_URL || '';
const NOINDEX = process.env.NOINDEX === '1';
const DESCRIPTION =
  'AI-инженер из Екатеринбурга: LLM-системы для производства, складов и данных. Шесть лет интерфейсов для промышленных систем, последний год — агенты, RAG и разбор документов.';

function ensureSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export async function buildSite({ quiet = false } = {}) {
  const started = Date.now();
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  // 1. Клиент
  const client = await build({
    absWorkingDir: root,
    entryPoints: { app: 'src/entry-client.tsx' },
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: 'dist/assets',
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[hash]',
    assetNames: '[name]-[hash]',
    minify: true,
    metafile: true,
    target: ['es2022', 'safari16'],
    jsx: 'automatic',
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'warning',
  });

  const outputs = Object.entries(client.metafile.outputs);
  const entry = outputs.find(([, o]) => o.entryPoint === 'src/entry-client.tsx');
  if (!entry) throw new Error('Не нашёл клиентский бандл в metafile');
  const jsFile = path.relative(dist, path.join(root, entry[0])).split(path.sep).join('/');
  const cssFile = path.relative(dist, path.join(root, entry[1].cssBundle ?? '')).split(path.sep).join('/');

  // 2. Сервер
  const serverOut = path.join(cache, 'server.mjs');
  await build({
    absWorkingDir: root,
    entryPoints: ['src/entry-server.tsx'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: serverOut,
    jsx: 'automatic',
    packages: 'external',
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'warning',
  });

  // 3. Пререндер
  const { render } = await import(`${pathToFileURL(serverOut).href}?t=${Date.now()}`);
  const hasResume = existsSync(path.join(root, 'public', 'resume.pdf'));
  const appHtml = render({ hasResume, repoUrl: REPO_URL });

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Антон Зинченко',
    jobTitle: 'AI-инженер',
    address: { '@type': 'PostalAddress', addressLocality: 'Екатеринбург', addressCountry: 'RU' },
    url: SITE_URL,
    sameAs: ['https://github.com/AntonZinchenko-dev', 'https://t.me/AntonZinch'],
  }).replace(/</g, '\\u003c');

  const template = await readFile(path.join(root, 'src', 'index.html'), 'utf8');
  const html = template
    .replaceAll('%DESCRIPTION%', escapeAttr(DESCRIPTION))
    .replaceAll('%SITE_URL%', escapeAttr(SITE_URL))
    .replaceAll('%ASK_API%', escapeAttr(ASK_API))
    .replaceAll('%ROBOTS%', NOINDEX ? 'noindex, nofollow' : 'index, follow')
    .replace('%CSS%', `./${cssFile}`)
    .replace('%JS%', `./${jsFile}`)
    .replace('%JSONLD%', () => jsonLd)
    .replace('%APP%', () => appHtml);
  await writeFile(path.join(dist, 'index.html'), html);

  // 4. Статика
  await cp(path.join(root, 'public'), dist, { recursive: true });
  await writeFile(path.join(dist, '.nojekyll'), '');

  if (!quiet) {
    const sizes = await Promise.all(
      outputs.map(async ([file]) => [file.replace('dist/', ''), (await stat(path.join(root, file))).size]),
    );
    const total = sizes.reduce((s, [, n]) => s + n, 0);
    const htmlSize = Buffer.byteLength(html);
    console.log(`Собрано за ${Date.now() - started} мс → dist/`);
    console.log(`  index.html  ${(htmlSize / 1024).toFixed(1)} КБ`);
    for (const [f, n] of sizes.sort((a, b) => b[1] - a[1])) console.log(`  ${f}  ${(n / 1024).toFixed(1)} КБ`);
    console.log(`  JS и CSS всего: ${(total / 1024).toFixed(1)} КБ до сжатия`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildSite().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
