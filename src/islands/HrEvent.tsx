import { useEffect, useRef, useState } from 'react';
import { hrPhrases } from '../content/hr-phrases';

/**
 * Пасхалка внизу страницы: эйчар ходит по нижнему краю экрана, говорит
 * фразу с собеседования, и после каждой прибегает сиба-ину и бонькает её
 * битой по голове — со звуком «бонк».
 * Цикл бесконечный, поверх всего контента, но клики не перехватывает —
 * кроме кнопки «убрать». При prefers-reduced-motion не запускается вовсе.
 *
 * Сцена — конечный автомат: walk → talk → bonk → walk. Положения задаются
 * переходами CSS: компонент только выставляет цель и длительность.
 */

type Phase = 'walk' | 'talk' | 'bonk';

const HR_W = 84;
const DOG_W = 96;
const SPEED = 110; // px/s
const TALK_MS = 2800;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}

export default function HrEvent() {
  const [on, setOn] = useState(false);
  const [closed, setClosed] = useState(false);
  const [phase, setPhase] = useState<Phase>('walk');
  const [hr, setHr] = useState({ x: 40, dir: 1 as 1 | -1, ms: 0 });
  const [dog, setDog] = useState({ x: -200, y: 0, dir: 1 as 1 | -1, ms: 0, jump: false, swing: false, show: false });
  const sound = useRef<HTMLAudioElement | null>(null);
  const [phrase, setPhrase] = useState('');
  const [boom, setBoom] = useState(false);
  const order = useRef<string[]>([]);
  const timers = useRef<number[]>([]);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = new Audio('./media/bonk.mp3');
    a.preload = 'auto';
    a.volume = 0.7;
    sound.current = a;
    setOn(true);
    return () => timers.current.forEach((t) => clearTimeout(t));
  }, []);

  /* сцена: каждая фаза сама планирует следующую */
  useEffect(() => {
    if (!on || closed) return;
    const vw = window.innerWidth;

    if (phase === 'walk') {
      // идём в случайную точку; у края разворачиваемся
      const min = 16;
      const max = vw - HR_W - 16;
      let target = hr.x + hr.dir * (180 + Math.random() * 260);
      let dir = hr.dir;
      if (target > max || target < min) {
        dir = (dir * -1) as 1 | -1;
        target = Math.min(max, Math.max(min, hr.x + dir * (180 + Math.random() * 220)));
      }
      const ms = (Math.abs(target - hr.x) / SPEED) * 1000;
      setHr({ x: target, dir, ms });
      later(ms + 80, () => setPhase('talk'));
    }

    if (phase === 'talk') {
      if (!order.current.length) order.current = shuffle(hrPhrases);
      setPhrase(order.current.pop() ?? '');
      later(TALK_MS, () => setPhase('bonk'));
    }

    if (phase === 'bonk') {
      // сиба прибегает с битой из-за края, к которому эйчар стоит спиной,
      // встаёт сзади на расстоянии биты и подпрыгивает для удара
      const dir = (hr.dir === 1 ? 1 : -1) as 1 | -1;
      const from = dir === 1 ? -DOG_W - 60 : vw + 60;
      const stop = dir === 1 ? hr.x - 96 : hr.x + 84;
      const run = (Math.abs(stop - from) / 520) * 1000;
      setDog({ x: from, y: 0, dir, ms: 0, jump: false, swing: false, show: true });
      later(30, () => setDog((d) => ({ ...d, x: stop, ms: run })));
      later(run + 60, () => setDog((d) => ({ ...d, y: -74, ms: 220, jump: true })));
      later(run + 280, () => setDog((d) => ({ ...d, swing: true })));
      later(run + 380, () => {
        setBoom(true);
        setPhrase('');
        const a = sound.current;
        if (a) {
          a.currentTime = 0;
          // браузер не даёт играть звук, пока человек ничего не нажимал на странице
          a.play().catch(() => undefined);
        }
      });
      later(run + 620, () => setDog((d) => ({ ...d, y: 0, ms: 260, jump: false })));
      later(run + 980, () => {
        setBoom(false);
        const out = dir === 1 ? -DOG_W - 60 : vw + 60;
        setDog((d) => ({ ...d, dir: (dir * -1) as 1 | -1, swing: false, x: out, ms: (Math.abs(out - d.x) / 600) * 1000 }));
        setPhase('walk');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, on, closed]);

  if (!on || closed) return null;

  return (
    <div className="hr-event" aria-hidden="false">
      <button
        type="button"
        className="hr-event__close"
        onClick={() => {
          timers.current.forEach((t) => clearTimeout(t));
          setClosed(true);
        }}
        aria-label="Убрать эйчара"
        title="Убрать эйчара"
      >
        ×
      </button>

      <div
        className={`hr-event__hr${phase === 'walk' ? ' is-walking' : ''}${boom ? ' is-bonked' : ''}`}
        style={{ transform: `translateX(${hr.x}px)`, transitionDuration: `${hr.ms}ms` }}
      >
        {phrase && (
          <p className={`hr-event__bubble${hr.x > window.innerWidth - 300 ? ' is-left' : ''}`} role="status">
            {phrase}
          </p>
        )}
        {boom && <span className="hr-event__boom">БОНЬК!</span>}
        <div style={{ transform: `scaleX(${hr.dir})` }}>
          <HrSvg />
        </div>
      </div>

      {dog.show && (
        <div
          className={`hr-event__dog${dog.jump ? ' is-jumping' : ' is-running'}${dog.swing ? ' is-swinging' : ''}`}
          style={{
            transform: `translate(${dog.x}px, ${dog.y}px)`,
            transitionDuration: `${dog.ms}ms`,
          }}
        >
          <div style={{ transform: `scaleX(${dog.dir})` }}>
            <ShibaSvg />
          </div>
        </div>
      )}
    </div>
  );
}

/** Эйчар: пиджак, бейдж на шнурке, планшет с бумагами. Смотрит вправо. */
function HrSvg() {
  return (
    <svg width={HR_W} height="140" viewBox="0 0 84 140" role="img" aria-label="Эйчар">
      {/* ноги */}
      <g className="hr-leg hr-leg--a">
        <rect x="34" y="96" width="7" height="34" rx="3" fill="#2a2f3a" />
        <ellipse cx="39" cy="131" rx="7" ry="3.2" fill="#14171d" />
      </g>
      <g className="hr-leg hr-leg--b">
        <rect x="43" y="96" width="7" height="34" rx="3" fill="#353b48" />
        <ellipse cx="48" cy="131" rx="7" ry="3.2" fill="#1b1f26" />
      </g>
      {/* юбка */}
      <path d="M28 82 L56 82 L60 102 L24 102 Z" fill="#2c3550" />
      {/* пиджак */}
      <path d="M26 48 Q42 42 58 48 L60 86 L24 86 Z" fill="#c2185b" />
      <path d="M37 48 L42 64 L47 48 Z" fill="#fff" />
      {/* шнурок и бейдж HR */}
      <path d="M36 49 L42 70 L48 49" fill="none" stroke="#2bb5a5" strokeWidth="1.6" />
      <rect x="35.5" y="69" width="13" height="10" rx="1.5" fill="#fff" stroke="#2bb5a5" />
      <text x="42" y="76.6" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#c2185b" fontFamily="sans-serif">
        HR
      </text>
      {/* рука с планшетом */}
      <path d="M57 52 Q66 64 62 74" fill="none" stroke="#c2185b" strokeWidth="7" strokeLinecap="round" />
      <rect x="58" y="62" width="16" height="21" rx="2" fill="#8d6e63" transform="rotate(10 66 72)" />
      <rect x="60.5" y="65" width="11" height="15" rx="1" fill="#fff" transform="rotate(10 66 72)" />
      <path d="M62 69h8M62 72h8M62 75h6" stroke="#9aa3b2" strokeWidth="1" transform="rotate(10 66 72)" />
      {/* голова */}
      <rect x="38" y="38" width="8" height="8" fill="#f1c7a3" />
      <circle cx="42" cy="27" r="13" fill="#f6d2b4" />
      {/* волосы и пучок */}
      <path d="M29 26 Q30 12 43 12 Q56 13 55 27 Q50 18 40 19 Q33 20 29 26 Z" fill="#5d3a1a" />
      <circle cx="40" cy="9" r="6.5" fill="#5d3a1a" />
      {/* очки и лицо */}
      <circle cx="46" cy="27" r="3.6" fill="none" stroke="#222" strokeWidth="1.3" />
      <circle cx="53.5" cy="27" r="3.2" fill="none" stroke="#222" strokeWidth="1.3" />
      <path d="M49.6 27h0.8" stroke="#222" strokeWidth="1.3" />
      <circle cx="46.6" cy="27.3" r="1" fill="#222" />
      <circle cx="53.8" cy="27.3" r="1" fill="#222" />
      <path d="M46 34 Q50 37.5 54 34" fill="none" stroke="#b0413e" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="44" cy="32" r="2" fill="#f28b82" opacity=".55" />
    </svg>
  );
}

/** Мемная сиба: рыжая, с подкрученным хвостом и взглядом искоса. Смотрит вправо. */
function ShibaSvg() {
  return (
    <svg width={DOG_W} height="76" viewBox="0 0 96 76" role="img" aria-label="Сиба-ину с битой" overflow="visible">
      {/* хвост бубликом */}
      <path d="M14 34 Q2 26 8 16 Q16 8 22 18 Q24 26 16 28" fill="none" stroke="#d9823b" strokeWidth="7" strokeLinecap="round" />
      <path d="M14 22 Q16 20 18 22" fill="none" stroke="#fbe9d0" strokeWidth="2.4" strokeLinecap="round" />
      {/* лапы */}
      <g className="dog-leg dog-leg--a">
        <rect x="22" y="48" width="8" height="20" rx="4" fill="#d9823b" />
        <rect x="22" y="62" width="8" height="7" rx="3.5" fill="#fbe9d0" />
      </g>
      <g className="dog-leg dog-leg--b">
        <rect x="56" y="48" width="8" height="20" rx="4" fill="#c97432" />
        <rect x="56" y="62" width="8" height="7" rx="3.5" fill="#fbe9d0" />
      </g>
      {/* тело */}
      <ellipse cx="42" cy="44" rx="28" ry="15" fill="#e08e45" />
      <ellipse cx="46" cy="50" rx="18" ry="7" fill="#fbe9d0" />
      {/* голова */}
      <path d="M58 12 L64 26 L54 24 Z" fill="#d9823b" />
      <path d="M80 12 L82 27 L72 24 Z" fill="#d9823b" />
      <path d="M59.5 16 L62 24 L57 23 Z" fill="#f5c9a0" />
      <ellipse cx="70" cy="32" rx="16" ry="14" fill="#e08e45" />
      <ellipse cx="74" cy="38" rx="12" ry="8" fill="#fbe9d0" />
      {/* взгляд искоса */}
      <ellipse cx="66" cy="29" rx="3.6" ry="2.6" fill="#fff" />
      <ellipse cx="77" cy="29" rx="3.6" ry="2.6" fill="#fff" />
      <circle cx="68.4" cy="29.4" r="1.6" fill="#222" />
      <circle cx="79.3" cy="29.4" r="1.6" fill="#222" />
      <path d="M62.5 25 Q66 23.2 69.5 25" fill="none" stroke="#7a4a20" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M73.5 25 Q77 23.4 80.5 25.4" fill="none" stroke="#7a4a20" strokeWidth="1.4" strokeLinecap="round" />
      {/* нос и ухмылка */}
      <ellipse cx="84.5" cy="35" rx="3" ry="2.2" fill="#2b1d14" />
      <path d="M74 41 Q78.5 43.5 84 40" fill="none" stroke="#2b1d14" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="64" cy="37" r="2.6" fill="#f2a07b" opacity=".6" />
      {/* бита в зубах: в покое смотрит вверх, при ударе опускается вперёд */}
      <g className="dog-bat">
        <path d="M80 38.5 L84 38.5 L138 35 Q142 38 138 43 L84 41.5 L80 41.5 Z" fill="#c8954f" stroke="#8a5a26" strokeWidth="1" />
        <rect x="78" y="37" width="9" height="6" rx="2" fill="#3a2a1c" />
        <path d="M98 39.5 L134 37.5" stroke="#e0b679" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
