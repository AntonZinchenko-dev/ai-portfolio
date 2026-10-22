/**
 * Сквозная проверка собранного сайта в настоящем браузере (Playwright, Chromium).
 * Запускается после npm run build: npm run e2e
 *
 * Проверяет на телефоне и на компьютере: страница открывается без ошибок в консоли,
 * острова оживают, «Спросите резюме» отвечает потоком и ведёт к источнику,
 * нет горизонтальной прокрутки, у картинок есть alt, якоря навигации существуют.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { serve } from '../scripts/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = path.join(root, 'e2e', 'screens');
await mkdir(shots, { recursive: true });

const PORT = 4321;
const server = await serve(path.join(root, 'dist'), PORT);
const browser = await chromium.launch();
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
  console.log(`${ok ? '✓' : '✗'} ${message}`);
};

for (const vp of [
  { name: 'телефон', width: 390, height: 844 },
  { name: 'компьютер', width: 1440, height: 900 },
]) {
  console.log(`\n— ${vp.name}, ${vp.width}×${vp.height}`);
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    // Шрифт из Google Fonts в закрытой сети CI может не загрузиться — это не ошибка сайта.
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !m.text().includes('net::ERR')) {
      errors.push(m.text());
    }
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  check((await page.locator('h1').count()) === 1, 'на странице ровно один h1');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 1, `нет горизонтальной прокрутки (лишние ${overflow} px)`);

  const navOk = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="#"]')).every((a) => {
      const id = a.getAttribute('href').slice(1);
      return !id || document.getElementById(id);
    }),
  );
  check(navOk, 'все якорные ссылки ведут на существующие блоки');

  const noAlt = await page.locator('img:not([alt])').count();
  check(noAlt === 0, 'у всех картинок есть alt');

  await page.waitForSelector('.evo[data-hydrated]', { timeout: 8000 });
  const evoW = await page.evaluate(() => document.querySelector('.evo__canvas')?.width ?? 0);
  check(evoW > 0, 'анимация первого экрана рисуется');
  await page.locator('.evo__step').nth(2).click();
  check((await page.locator('.evo__step.is-active .evo__name').innerText()) === 'Продукт', 'этапы анимации переключаются по клику');

  const mode = await page.locator('.evo').getAttribute('data-mode');
  check(mode === 'poly' || mode === 'tags', `вариант анимации выбран (${mode})`);

  await page.locator('#freight').scrollIntoViewIfNeeded();
  await page.waitForSelector('.intake[data-hydrated]', { timeout: 8000 });
  check(true, 'демо разбора заявки ожило в кейсе Freight Intake');

  await page.locator('#ask').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Что у вас с Python и SQL?' }).click();
  await page.waitForSelector('.ask__source', { timeout: 10000 });
  const answer = await page.locator('.ask__answer').innerText();
  check(answer.length > 40, 'виджет «Спросите резюме» ответил');
  await page.locator('.ask__source').first().click();
  await page.waitForTimeout(400);
  check((await page.evaluate(() => location.hash)).length > 1, 'клик по источнику ведёт к блоку страницы');

  await page.locator('.showcase').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  check((await page.locator('.showcase video source').count()) >= 2, 'видео PipePass на месте');

  await page.screenshot({ path: path.join(shots, `${vp.width}.png`), fullPage: false });
  check(errors.length === 0, `без ошибок в консоли${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\nНе прошло: ${failures.length}`);
  process.exit(1);
}
console.log('\nВсё прошло');
