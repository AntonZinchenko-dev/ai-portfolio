# Картинки для сайта

Сайт выглядит цельным и без картинок: слоты, для которых нет файла, просто не выводятся.
Картинки добавляют атмосферы в блок «Знаю, как устроены процессы» и скриншоты в кейсы.

Уже добавлены: портрет (`portrait`), склад, фабрика-кухня, буровая три кадра AgentYard и три кадра Freight Intake.

## Как добавить

1. Положите файл в `images/source/` с именем слота: `ops-warehouse.jpg`, `ops-kitchen.png` и т. д.
   Размер любой, лучше от 2000 px по длинной стороне.
2. При необходимости поправьте в `images/focal.json` точку фокуса `focus: [x, y]` (0…1):
   вокруг неё режутся кадры. Например, `[0.5, 0.3]` — интересное в верхней трети.
3. Выполните `npm run images`. Скрипт нарежет кадр под телефон (16:10) и экран (4:3),
   сделает AVIF и WebP нескольких ширин и обновит манифест.
4. `npm run build` — картинки появятся на странице.

## Промпты для генерации

Общий стиль для всех трёх, чтобы картинки смотрелись одной серией:
документальная фотография, естественный холодный дневной свет, приглушённая палитра
сине-серых и бетонных тонов с одним тёплым акцентом, реалистичная Россия, без логотипов
и читаемых надписей, без лиц крупным планом, без постановочных улыбок.

**ops-warehouse — склад**
> Documentary photo inside a Russian distribution warehouse, tall metal pallet racks with cardboard boxes, a worker in a dark work jacket scanning a box with a handheld barcode scanner, seen from behind at mid distance, cold daylight from skylights mixed with warm lamp, muted blue-grey and concrete palette, one warm amber accent, shallow depth of field, no logos, no readable text, 35mm, realistic

**ops-kitchen — фабрика-кухня**
> Documentary photo of an industrial food production kitchen in Russia, stainless steel worktables, cooks in white uniforms and caps portioning ready meals into containers on a line, seen from the side at mid distance, faces not in focus, bright even daylight, muted cool palette with warm food colors as the only accent, clean and orderly, no logos, no readable text, 35mm, realistic

**ops-drilling — буровая**
> Documentary photo of an onshore drilling rig in the Western Siberian taiga at blue hour, snow on the ground, rig lights glowing warm amber against a cold blue sky, drill pipes stacked on the pipe rack in the foreground, workers as small silhouettes, muted palette, atmospheric, no logos, no readable text, 50mm, realistic

## Скриншоты своих проектов

Те же правила: файл с именем слота в `images/source/`, затем `npm run images`.

| Слот | Что снять |
| --- | --- |
| `drilltrace-passport` | Паспорт трубы DrillTrace: труба в 3D по сечениям, тёмная тема |
| `freight-overview`, `freight-quotes`, `freight-clarify` | Freight Intake: уже нарезаны из скриншота экрана разбора |
| `agentyard-dark`, `agentyard-plan`, `agentyard-progress` | AgentYard: уже взяты из `docs/screenshots` его репозитория |
| `pipewiki-answer` | pipewiki: ответ со ссылками на источники |

Снимайте окно браузера без вкладок и закладок, ширина 1600–1920 px.
