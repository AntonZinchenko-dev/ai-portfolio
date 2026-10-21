/**
 * Картинка превью ссылки (Telegram, VK, почта): 1200×630 → public/og.png.
 * Рисуется из HTML браузером Playwright. Запускать после правки текста:
 *   node scripts/og.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: Onest, Inter, system-ui, sans-serif; color: #1b2430;
    background: #f2f4f5; position: relative; overflow: hidden; }
  .grid { position: absolute; inset: 0;
    background-image: linear-gradient(rgba(27,36,48,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,36,48,.07) 1px, transparent 1px);
    background-size: 40px 40px;
    -webkit-mask-image: radial-gradient(ellipse 70% 80% at 80% 40%, #000 15%, transparent 75%); }
  .wrap { position: absolute; inset: 64px 72px; display: flex; flex-direction: column; }
  .who { font-size: 26px; color: #5a6472; }
  .who b { color: #1b2430; font-weight: 600; }
  h1 { margin-top: 28px; font-size: 60px; line-height: 1.06; letter-spacing: -0.025em; font-weight: 600; max-width: 720px; }
  .facts { margin-top: auto; display: flex; gap: 0; border-top: 2px solid #d4dadf; }
  .facts div { padding: 22px 36px 0 0; margin-right: 36px; font-size: 22px; color: #5a6472; }
  .facts div + div { padding-left: 36px; border-left: 2px solid #d4dadf; }
  .facts b { display: block; font-size: 34px; color: #1b2430; font-weight: 600; }
  .chain { position: absolute; right: 72px; top: 132px; display: flex; flex-direction: column; gap: 10px; width: 250px; }
  .chain span { display: block; padding: 10px 14px; border: 2px solid #d4dadf; background: #fff; border-radius: 10px; font-size: 19px; }
  .chain .m { border-color: #c98618; background: #fbecd1; }
</style></head><body><div class="grid"></div>
<div class="chain"><span>Документ</span><span class="m">Модель извлекает</span><span>Код проверяет</span><span>Человек подтверждает</span></div>
<div class="wrap">
  <p class="who"><b>Антон Зинченко</b>, AI-инженер, Екатеринбург</p>
  <h1>LLM в рабочих процессах: без выдумок, с проверкой</h1>
  <div class="facts"><div><b>6+ лет</b>системы для заводов и складов</div><div><b>PipePass</b>данные бурения</div><div><b>Агенты и RAG</b>последний год</div></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: path.join(root, 'public', 'og.png') });
await browser.close();
console.log('public/og.png готов');
