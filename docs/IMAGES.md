# Картинки для сайта

Сайт выглядит цельным и без картинок: слоты, для которых нет файла, просто не выводятся.

## Как добавить

1. Положите файл в `images/source/` с именем слота, например `shibatube-studio.png`.
   Размер любой, лучше от 1600 px по длинной стороне.
2. При необходимости поправьте в `images/focal.json` пропорцию (`desktop`) и точку фокуса `focus: [x, y]` (0…1).
3. Выполните `npm run images` — скрипт сделает AVIF и WebP нескольких ширин и обновит манифест.
4. `npm run build` — картинки появятся на странице.

## Слоты

| Слот | Что на нём | Есть |
| --- | --- | --- |
| `portrait` | Портрет | да |
| `agentyard-dark`, `agentyard-plan`, `agentyard-progress` | Скриншоты AgentYard | да |
| `drilltrace-passport` | Паспорт трубы DrillTrace | да |
| `archforge-schema`, `archforge-tco`, `archforge-code` | Скриншоты ArchForge из описания функционала | да |
| `kobo-home`, `kobo-builder`, `kobo-catalog` | KŌBŌ Keys | да |
| `shibatube-studio` | ShibaTube, вкладка «Студия»: персонаж, справа настройки | да |
| `shibatube-wizard` | ShibaTube, «Мастер модели»: детали из PSD, превью, проверка нарезки | да |

Снимайте окно программы целиком, без чужих вкладок и личных данных, ширина 1600–1920 px, тёмная тема.
