import { useEffect, useRef, useState, type FormEvent } from 'react';
import { askPresets } from '../content/site';
import { buildCorpus } from '../content/corpus';
import {
  askStream,
  createAskHandler,
  httpTransport,
  type AskMeta,
  type AskSource,
  type AskTransport,
  type RecordedAnswers,
} from '../lib/ask';

type Status = 'idle' | 'streaming' | 'done' | 'error';

let transportPromise: Promise<AskTransport> | null = null;

/**
 * Транспорт выбирается один раз: если в <meta name="ask-api"> задан адрес
 * живого сервера — ходим туда, иначе отвечает демо-обработчик в браузере.
 * Записанные моделью ответы (rag/record.py) подхватываются из ask-recorded.json, если он есть.
 */
function getTransport(): Promise<AskTransport> {
  if (!transportPromise) {
    transportPromise = (async () => {
      const api = document.querySelector<HTMLMetaElement>('meta[name="ask-api"]')?.content.trim();
      if (api) return httpTransport(api);
      let recorded: RecordedAnswers = {};
      try {
        const res = await fetch('./ask-recorded.json', { cache: 'no-cache' });
        if (res.ok) recorded = (await res.json()) as RecordedAnswers;
      } catch {
        // Файла нет — работаем поиском по фрагментам.
      }
      return createAskHandler({ fragments: buildCorpus(), recorded });
    })();
  }
  return transportPromise;
}

function jumpTo(anchor: string) {
  const el = document.getElementById(anchor);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  el.classList.remove('flash');
  // Перезапуск анимации подсветки.
  void el.offsetWidth;
  el.classList.add('flash');
  history.replaceState(null, '', `#${anchor}`);
}

export default function AskWidget() {
  const [question, setQuestion] = useState('');
  const [presetId, setPresetId] = useState<string | null>(null);
  const [asked, setAsked] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [answer, setAnswer] = useState('');
  const [meta, setMeta] = useState<AskMeta | null>(null);
  const [sources, setSources] = useState<AskSource[]>([]);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async (text: string, preset: string | null) => {
    const q = text.trim();
    if (!q) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAsked(q);
    setPresetId(preset);
    setStatus('streaming');
    setAnswer('');
    setMeta(null);
    setSources([]);
    setError('');

    try {
      const transport = await getTransport();
      await askStream(
        transport,
        { question: q, presetId: preset ?? undefined },
        {
          onMeta: setMeta,
          onToken: (piece) => setAnswer((prev) => prev + piece),
          onSources: setSources,
        },
        controller.signal,
      );
      if (!controller.signal.aborted) setStatus('done');
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : 'Не удалось получить ответ');
      setStatus('error');
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(question, null);
  };

  return (
    <div className="ask">
      <div className="ask__presets" role="group" aria-label="Готовые вопросы">
        {askPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="ask__preset"
            aria-pressed={presetId === p.id && status !== 'idle'}
            onClick={() => void run(p.question, p.id)}
          >
            {p.question}
          </button>
        ))}
      </div>
      <form className="ask__form" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor="ask-input">
          Свой вопрос
        </label>
        <input
          id="ask-input"
          className="ask__input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Или задайте свой вопрос"
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" className="btn btn--primary" disabled={status === 'streaming'}>
          Спросить
        </button>
      </form>
      <div className="ask__output" aria-live="polite" aria-busy={status === 'streaming'}>
        {status === 'idle' ? (
          <p className="ask__empty">
            Выберите вопрос или задайте свой. Ответ собирается из текста этой страницы, ничего сверх него не
            придумывается.
          </p>
        ) : (
          <>
            <p className="ask__q">{asked}</p>
            {meta && (
              <p className={`ask__mode ask__mode--${meta.mode}`}>
                <i aria-hidden="true" />
                {meta.mode === 'generated'
                  ? `Ответ сгенерирован моделью ${meta.model ?? ''}${meta.recordedAt ? ` и записан ${meta.recordedAt}` : ''}`
                  : 'Найдено поиском по фрагментам страницы, без генерации'}
              </p>
            )}
            {status === 'error' ? (
              <p className="ask__error">Не получилось ответить: {error}. Попробуйте ещё раз или напишите в Telegram.</p>
            ) : (
              <p className="ask__answer">
                {answer}
                {status === 'streaming' && <span className="ask__cursor" aria-hidden="true" />}
              </p>
            )}
            {sources.length > 0 && (
              <ul className="ask__sources" aria-label="Источники на странице">
                {sources.map((s) => (
                  <li key={s.id}>
                    <button type="button" className="ask__source" onClick={() => jumpTo(s.anchor)}>
                      <b>{s.title}</b>
                      <span>{s.quote}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <p className="ask__note">
        Как это устроено: виджет шлёт запрос POST /api/ask и читает ответ потоком. На GitHub Pages сервера нет, поэтому
        запрос обрабатывает функция прямо в браузере — по тому же контракту, что и сервер в папке rag/ репозитория.
      </p>
    </div>
  );
}
