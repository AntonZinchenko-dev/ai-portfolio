import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSseParser, formatSse, type SseEvent } from '../src/lib/sse.ts';
import { FragmentIndex, stem, tokenize } from '../src/lib/search.ts';
import { askStream, createAskHandler, type AskMeta, type AskSource } from '../src/lib/ask.ts';
import { buildCorpus } from '../src/content/corpus.ts';
import { askPresets } from '../src/content/site.ts';

test('SSE: поток, порезанный по одному символу, разбирается целиком, включая разорванный \\r\\n', () => {
  const raw = 'event: meta\r\ndata: {"a":1}\r\n\r\n' + formatSse('token', 'привет\nмир') + ': комментарий\n\n';
  const events: SseEvent[] = [];
  const parser = createSseParser((e) => events.push(e));
  for (const ch of raw) parser.push(ch);
  parser.end();
  assert.deepEqual(events, [
    { event: 'meta', data: '{"a":1}' },
    { event: 'token', data: 'привет\nмир' },
  ]);
});

test('стеммер сводит формы слова к одной основе', () => {
  assert.equal(stem('складского'), stem('складской'));
  assert.equal(stem('python'), 'python');
  assert.deepEqual(tokenize('Что у вас с Python?'), ['python']);
});

const corpus = buildCorpus();

test('у каждого фрагмента есть якорь и уникальный id', () => {
  const ids = new Set(corpus.map((f) => f.id));
  assert.equal(ids.size, corpus.length);
  assert.ok(corpus.every((f) => f.anchor && f.text.length > 20));
});

test('поиск: вопрос про SQL находит честный ответ о базовом уровне', () => {
  const hits = new FragmentIndex(corpus).search('Что у вас с SQL?');
  assert.ok(hits.some((h) => h.fragment.id === 'fit-sql'));
});

test('поиск: вопрос о бурении находит DrillTrace', () => {
  const hits = new FragmentIndex(corpus).search('Делали что-то для бурения?');
  assert.ok(hits[0]?.fragment.anchor === 'drilltrace');
});

test('каждый готовый вопрос находит хотя бы один фрагмент', () => {
  const index = new FragmentIndex(corpus);
  for (const p of askPresets) assert.ok(index.search(p.question).length > 0, p.question);
});

test('обработчик /api/ask отдаёт поток: meta → токены → источники', async () => {
  const handler = createAskHandler({ fragments: corpus, delayMs: 0 });
  let meta: AskMeta | undefined;
  let text = '';
  let sources: AskSource[] = [];
  await askStream(handler, { question: 'Как вы проверяете, что модель не выдумывает?' }, {
    onMeta: (m) => (meta = m),
    onToken: (t) => (text += t),
    onSources: (s) => (sources = s),
  });
  assert.equal(meta?.mode, 'search');
  assert.ok(text.length > 40);
  assert.ok(sources.length > 0 && sources.every((s) => s.anchor));
});

test('записанный моделью ответ отдаётся для готового вопроса с подписью модели', async () => {
  const handler = createAskHandler({
    fragments: corpus,
    delayMs: 0,
    recorded: {
      onsite: { answer: 'Да, готов.', sources: ['onsite', 'нет-такого'], model: 'qwen2.5:7b', recordedAt: '2026-10-21' },
    },
  });
  let meta: AskMeta | undefined;
  let text = '';
  let sources: AskSource[] = [];
  await askStream(handler, { question: 'Готовы очно?', presetId: 'onsite' }, {
    onMeta: (m) => (meta = m),
    onToken: (t) => (text += t),
    onSources: (s) => (sources = s),
  });
  assert.equal(meta?.mode, 'generated');
  assert.equal(meta?.model, 'qwen2.5:7b');
  assert.equal(text, 'Да, готов.');
  assert.deepEqual(sources.map((s) => s.id), ['onsite']);
});

test('пустой вопрос — 400 с понятной ошибкой', async () => {
  const handler = createAskHandler({ fragments: corpus });
  const res = await handler(new Request('https://x/api/ask', { method: 'POST', body: '{"question":"  "}' }));
  assert.equal(res.status, 400);
});
