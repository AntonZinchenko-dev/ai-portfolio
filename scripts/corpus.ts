/**
 * Выгружает фрагменты страницы и готовые вопросы в rag/corpus.json —
 * это вход для rag/build.py и rag/record.py. Запуск: npm run corpus
 */
import { writeFileSync } from 'node:fs';
import { buildCorpus } from '../src/content/corpus.ts';
import { askPresets } from '../src/content/site.ts';

const out = { fragments: buildCorpus(), presets: askPresets };
writeFileSync(new URL('../rag/corpus.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`rag/corpus.json: ${out.fragments.length} фрагментов, ${out.presets.length} вопросов`);
