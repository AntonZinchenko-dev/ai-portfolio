/**
 * Нарезка картинок под адаптив.
 *
 * Положите исходники любого размера в images/source/ (jpg, png, webp, avif).
 * Имя файла без расширения — это имя слота на странице (ops-warehouse, ops-kitchen…).
 * В images/focal.json для каждого слота можно задать:
 *   focus   — точка интереса [x, y] от 0 до 1, вокруг неё режется кадр;
 *   desktop — пропорция для широких экранов, например "3:2";
 *   mobile  — пропорция для телефона, например "4:5";
 *   alt     — описание для незрячих и на случай, если картинка не загрузится;
 *   widths  — свои ширины нарезки, например [96, 192] для маленькой аватарки.
 *
 * Скрипт режет кадр под каждую пропорцию, делает AVIF и WebP нескольких ширин
 * и пишет манифест src/generated/images.json — по нему компонент <Picture>
 * собирает <picture> с srcset и media. Слота нет в манифесте — на странице его просто нет.
 *
 * Запуск: npm run images
 */
import sharp from 'sharp';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'images', 'source');
const OUT = path.join(root, 'public', 'img');
const MANIFEST = path.join(root, 'src', 'generated', 'images.json');
const FOCAL = path.join(root, 'images', 'focal.json');

const WIDTHS = { desktop: [640, 960, 1440, 1920], mobile: [480, 768, 1080] };
const MOBILE_MEDIA = '(max-width: 767px)';

function ratio(text, fallback) {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(text ?? '');
  return m ? Number(m[1]) / Number(m[2]) : fallback;
}

/** Самый большой прямоугольник нужной пропорции, сдвинутый к точке фокуса и не вылезающий за края. */
function cropRect(w, h, r, [fx, fy]) {
  let cw = w;
  let ch = Math.round(w / r);
  if (ch > h) {
    ch = h;
    cw = Math.round(h * r);
  }
  const left = Math.min(Math.max(Math.round(fx * w - cw / 2), 0), w - cw);
  const top = Math.min(Math.max(Math.round(fy * h - ch / 2), 0), h - ch);
  return { left, top, width: cw, height: ch };
}

async function main() {
  const focal = existsSync(FOCAL) ? JSON.parse(await readFile(FOCAL, 'utf8')) : {};
  const files = existsSync(SRC)
    ? (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    : [];

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const manifest = {};
  for (const file of files) {
    const name = path.parse(file).name;
    const conf = focal[name] ?? {};
    const focus = conf.focus ?? [0.5, 0.5];
    const input = sharp(path.join(SRC, file)).rotate(); // учитываем EXIF-поворот
    const meta = await input.metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    const desktopR = ratio(conf.desktop, W / H);
    const mobileR = ratio(conf.mobile, desktopR);

    const plans = [];
    if (Math.abs(mobileR - desktopR) > 0.01) plans.push({ kind: 'mobile', r: mobileR, media: MOBILE_MEDIA });
    plans.push({ kind: 'desktop', r: desktopR, media: null });

    const variants = [];
    for (const plan of plans) {
      const rect = cropRect(W, H, plan.r, focus);
      const widths = (conf.widths ?? WIDTHS[plan.kind]).filter((w) => w <= rect.width);
      if (!widths.length) widths.push(rect.width);
      const avif = [];
      const webp = [];
      let largest = null;
      for (const w of widths) {
        const h = Math.round(w / plan.r);
        const base = `${name}-${plan.kind}-${w}`;
        const pipeline = sharp(path.join(SRC, file)).rotate().extract(rect).resize(w, h);
        await pipeline.clone().avif({ quality: 52, effort: 5 }).toFile(path.join(OUT, `${base}.avif`));
        await pipeline.clone().webp({ quality: 76 }).toFile(path.join(OUT, `${base}.webp`));
        avif.push(`./img/${base}.avif ${w}w`);
        webp.push(`./img/${base}.webp ${w}w`);
        largest = { src: `./img/${base}.webp`, width: w, height: h };
      }
      variants.push({ media: plan.media, avif: avif.join(', '), webp: webp.join(', '), ...largest });
    }
    manifest[name] = { alt: conf.alt ?? '', variants };
    console.log(`${name}: ${W}×${H} → ${variants.map((v) => `${v.media ? 'телефон' : 'экран'} ${v.width}×${v.height}`).join(', ')}`);
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(files.length ? `Готово: ${files.length} шт. → public/img, манифест обновлён` : 'В images/source пусто — манифест очищен');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
