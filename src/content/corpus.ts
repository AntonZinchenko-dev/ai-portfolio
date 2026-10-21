/**
 * Фрагменты для поиска «Спросите резюме». Собираются из того же содержимого,
 * что и страница, поэтому ответы не расходятся с текстом сайта.
 */

import type { Fragment } from '../lib/search';
import {
  aiCases,
  approach,
  commercial,
  education,
  experience,
  fit,
  flagship,
  hero,
  person,
  processes,
  productCase,
  stack,
  tools,
  levelText,
} from './site';

export function buildCorpus(): Fragment[] {
  const out: Fragment[] = [];
  const add = (id: string, anchor: string, title: string, text: string) => out.push({ id, anchor, title, text });

  add('about', 'top', 'Кратко обо мне', hero.lead);
  add(
    'llm-honest',
    'top',
    'Опыт с LLM',
    'С LLM работаю последний год. Рабочий проект — корпоративный ассистент по вики, он под NDA. Остальное — свои и тестовые проекты: Freight Intake, AgentYard, pipewiki. До этого шесть лет коммерческой фронтенд-разработки.',
  );
  add(
    'onsite',
    'contacts',
    'Где работаю',
    `Живу в городе ${person.city}, готов работать очно, гибридно или удалённо. Удобнее всего писать в Telegram ${person.telegramHandle}.`,
  );

  for (const c of [flagship, ...aiCases, productCase]) {
    add(`${c.id}-summary`, c.anchor, c.title, `${c.summary} ${c.problem}`);
    c.did.forEach((d, i) => add(`${c.id}-did-${i}`, c.anchor, c.title, d));
    add(`${c.id}-why`, c.anchor, c.title, c.why);
    if (c.facts) add(`${c.id}-facts`, c.anchor, c.title, c.facts.map((f) => `${f.value} — ${f.label}`).join('; '));
  }

  for (const t of tools) add(`tool-${t.id}`, 'tools', t.title, `${t.text} Стек: ${t.stack}.`);
  for (const w of commercial) add(`work-${w.id}`, 'work', `${w.title}, ${w.company}`, `${w.task} ${w.result}`);
  for (const f of fit) add(`fit-${f.id}`, 'fit', f.requirement, f.evidence);
  for (const p of processes) {
    add(
      `process-${p.id}`,
      'processes',
      p.mine,
      `${p.mine} (${p.source}). У вас это ${p.theirs.toLowerCase()}. Пилот, который я бы проверил: ${p.pilot.toLowerCase()}.`,
    );
  }
  approach.forEach((s, i) => add(`approach-${i}`, 'approach', s.title, `${s.text} Пример: ${s.example}`));
  for (const g of stack) {
    add(
      `stack-${g.group}`,
      'stack',
      g.group,
      g.items.map((it) => `${it.name} — ${levelText[it.level]}${it.where ? ` (${it.where})` : ''}`).join('; '),
    );
  }
  for (const e of experience) add(`exp-${e.id}`, 'experience', `${e.place}, ${e.period}`, `${e.role}. ${e.text}`);
  add('education', 'experience', 'Образование', education.map((e) => `${e.title}: ${e.detail}`).join('; '));

  return out;
}
