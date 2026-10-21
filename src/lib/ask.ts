/**
 * Контракт POST /api/ask и его демо-реализация.
 *
 * В браузере проверяющего сервера нет, поэтому запрос обрабатывает функция
 * с той же сигнатурой, что у сервера: принимает Request, отдаёт Response
 * с потоком SSE. Если задан адрес живого API, тот же клиент ходит туда —
 * код виджета не меняется, меняется только транспорт.
 */

import { FragmentIndex, type Fragment } from './search';
import { createSseParser, formatSse } from './sse';

export interface AskRequest {
  question: string;
  presetId?: string;
}

export type AskMode = 'search' | 'generated';

export interface AskMeta {
  mode: AskMode;
  /** Для режима generated — какая модель записала ответ и когда */
  model?: string;
  recordedAt?: string;
}

export interface AskSource {
  id: string;
  anchor: string;
  title: string;
  quote: string;
}

/** Ответ, заранее записанный моделью скриптом rag/record.py */
export interface RecordedAnswer {
  answer: string;
  sources: string[];
  model: string;
  recordedAt: string;
}

export type RecordedAnswers = Record<string, RecordedAnswer>;

interface HandlerOptions {
  fragments: readonly Fragment[];
  recorded?: RecordedAnswers;
  /** Пауза между кусками потока, мс — чтобы ответ печатался, как у живой модели */
  delayMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shorten(text: string, max = 260): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function createAskHandler({ fragments, recorded = {}, delayMs = 14 }: HandlerOptions) {
  const index = new FragmentIndex(fragments);
  const byId = new Map(fragments.map((f) => [f.id, f]));

  return async function handle(request: Request): Promise<Response> {
    let body: AskRequest;
    try {
      body = (await request.json()) as AskRequest;
    } catch {
      return new Response(JSON.stringify({ error: 'Ожидается JSON с полем question' }), { status: 400 });
    }
    const question = (body.question ?? '').trim();
    if (!question) {
      return new Response(JSON.stringify({ error: 'Пустой вопрос' }), { status: 400 });
    }

    const saved = body.presetId ? recorded[body.presetId] : undefined;
    let meta: AskMeta;
    let text: string;
    let sources: AskSource[];

    if (saved) {
      meta = { mode: 'generated', model: saved.model, recordedAt: saved.recordedAt };
      text = saved.answer;
      sources = saved.sources
        .map((id) => byId.get(id))
        .filter((f): f is Fragment => Boolean(f))
        .map((f) => ({ id: f.id, anchor: f.anchor, title: f.title, quote: shorten(f.text, 160) }));
    } else {
      meta = { mode: 'search' };
      const hits = index.search(question, 3);
      sources = hits.map(({ fragment: f }) => ({
        id: f.id,
        anchor: f.anchor,
        title: f.title,
        quote: shorten(f.text, 160),
      }));
      text = hits.length
        ? hits.map(({ fragment: f }) => `${f.title}. ${shorten(f.text)}`).join('\n\n')
        : 'На сайте нет ответа на этот вопрос. Напишите в Telegram — отвечу сам.';
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(formatSse('meta', meta)));
        // Режем по словам, сохраняя пробелы и переносы: так поток выглядит как токены модели.
        const pieces = text.match(/\S+\s*/g) ?? [];
        for (const piece of pieces) {
          controller.enqueue(encoder.encode(formatSse('token', JSON.stringify(piece))));
          if (delayMs) await sleep(delayMs);
        }
        controller.enqueue(encoder.encode(formatSse('sources', sources)));
        controller.enqueue(encoder.encode(formatSse('done', '{}')));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/event-stream; charset=utf-8' },
    });
  };
}

export interface AskCallbacks {
  onMeta?: (meta: AskMeta) => void;
  onToken?: (piece: string) => void;
  onSources?: (sources: AskSource[]) => void;
}

export type AskTransport = (request: Request) => Promise<Response>;

/** Клиент: одинаково читает поток и из демо-обработчика, и из живого сервера. */
export async function askStream(
  transport: AskTransport,
  payload: AskRequest,
  callbacks: AskCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await transport(
    new Request('https://local.demo/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }),
  );
  if (!response.ok || !response.body) {
    throw new Error(`Сервер ответил ${response.status}`);
  }

  const parser = createSseParser(({ event, data }) => {
    if (event === 'meta') callbacks.onMeta?.(JSON.parse(data) as AskMeta);
    else if (event === 'token') callbacks.onToken?.(JSON.parse(data) as string);
    else if (event === 'sources') callbacks.onSources?.(JSON.parse(data) as AskSource[]);
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    if (signal?.aborted) {
      await reader.cancel();
      return;
    }
    const { value, done } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.end();
}

/** Транспорт к живому серверу rag/api.py */
export function httpTransport(baseUrl: string): AskTransport {
  return async (request) =>
    fetch(`${baseUrl.replace(/\/$/, '')}/api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await request.text(),
      signal: request.signal,
    });
}
