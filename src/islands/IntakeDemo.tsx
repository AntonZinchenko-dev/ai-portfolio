import { useCallback, useEffect, useRef, useState } from 'react';
import { heroDemo } from '../content/site';

/** Разбивает текст заявки на куски так, чтобы каждая цитата была отдельным <mark>. */
function segments(message: string, quotes: string[]) {
  const out: Array<{ text: string; quote: number }> = [];
  let rest = message;
  let offset = 0;
  const found = quotes
    .map((q, i) => ({ q, i, at: q ? message.indexOf(q) : -1 }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at);
  for (const { q, i, at } of found) {
    const local = at - offset;
    if (local > 0) out.push({ text: rest.slice(0, local), quote: -1 });
    out.push({ text: q, quote: i });
    rest = rest.slice(local + q.length);
    offset = at + q.length;
  }
  if (rest) out.push({ text: rest, quote: -1 });
  return out;
}

const STATUS_TEXT = { ok: 'Готово', ask: 'Спросить' } as const;

export default function IntakeDemo() {
  const fields = heroDemo.fields;
  const parts = segments(
    heroDemo.message,
    fields.map((f) => f.quote),
  );

  // Начальное состояние совпадает с серверным HTML: поля скрыты, пока не сыграет анимация.
  const [shown, setShown] = useState(0);
  const [lit, setLit] = useState(-1);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = useCallback(() => {
    clear();
    setStarted(true);
    setDone(false);
    setShown(0);
    setLit(-1);
    fields.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(i);
          setShown(i + 1);
        }, 500 + i * 520),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setLit(-1);
        setDone(true);
      }, 500 + fields.length * 520 + 400),
    );
  }, [fields]);

  useEffect(() => {
    rootRef.current?.setAttribute('data-hydrated', 'true');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(fields.length);
      setDone(true);
    } else {
      play();
    }
    return clear;
  }, [fields.length, play]);

  const visible = done ? fields.length : shown;

  return (
    <div className={`intake${done ? ' is-done' : ''}${started && !done ? ' is-scanning' : ''}`} ref={rootRef}>
      <div className="intake__head">
        <span>Входящая заявка</span>
        <button type="button" className="intake__replay" onClick={play}>
          Показать ещё раз
        </button>
      </div>
      <p className="intake__msg">
        {parts.map((p, i) =>
          p.quote >= 0 ? (
            <mark key={i} className={lit === p.quote ? 'is-lit' : undefined}>
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </p>
      <div className="intake__step">
        <i aria-hidden="true" />
        <span>Модель извлекает поля, код сверяет цитаты и справочники</span>
      </div>
      <ul className="intake__fields" aria-live="polite">
        {fields.map((f, i) => (
          <li
            key={f.label}
            className={`intake__field${i >= visible ? ' is-hidden' : ''}`}
            onMouseEnter={() => done && setLit(i)}
            onMouseLeave={() => done && setLit(-1)}
          >
            <span className="intake__label">{f.label}</span>
            <span>{f.value}</span>
            <span className={`intake__status intake__status--${f.status}`}>{STATUS_TEXT[f.status]}</span>
          </li>
        ))}
      </ul>
      <p className="intake__foot">Два вопроса уходят менеджеру. Сделка появится в CRM только после его подтверждения.</p>
    </div>
  );
}
