import { useEffect, useRef, useState } from 'react';
import { evolution } from '../content/site';
import { irisHue, isDark, prefersReducedMotion, seeded } from '../lib/iris';

/**
 * Первый экран: одна и та же сетка треугольников собирается в лампочку (идея),
 * коробку (MVP), окно продукта и людей (клиенты). При переходе каждая грань
 * летит на своё место в новой фигуре по дуге и с поворотом.
 */

const W = 480;
const H = 400;
const STEP = 17;
const HOLD = 2.8; // секунд фигура стоит
const FLY = 1.15; // секунд летит одна грань
const SPREAD = 0.75; // разброс старта граней

interface Tri {
  cx: number;
  cy: number;
  /** вершины относительно центра */
  o: [number, number, number, number, number, number];
  shade: number;
  accent: number;
  alpha: number;
}

type Draw = (g: CanvasRenderingContext2D) => void;

const poly = (g: CanvasRenderingContext2D, pts: number[]) => {
  g.beginPath();
  g.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!);
  g.closePath();
  g.fill();
};
const circle = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
};
const rrect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
};
/** Красный канал — светлота грани, зелёный — тёплый акцент */
const fill = (g: CanvasRenderingContext2D, shade: number, accent = 0) => {
  g.fillStyle = `rgb(${Math.round(shade * 255)},${Math.round(accent * 255)},0)`;
};

const SCENES: Draw[] = [
  // Идея: лампочка с лучами
  (g) => {
    fill(g, 0.72);
    circle(g, 240, 160, 100);
    poly(g, [178, 230, 302, 230, 282, 292, 198, 292]);
    fill(g, 1);
    circle(g, 212, 128, 44);
    fill(g, 0.42);
    rrect(g, 196, 298, 88, 18, 6);
    rrect(g, 202, 322, 76, 18, 6);
    rrect(g, 220, 346, 40, 16, 6);
    fill(g, 0.9, 1);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.92 + i * 0.193);
      const c = Math.cos(a);
      const s = Math.sin(a);
      const n = 9;
      poly(g, [240 + c * 122 - s * n, 160 + s * 122 + c * n, 240 + c * 122 + s * n, 160 + s * 122 - c * n, 240 + c * 165, 160 + s * 165]);
    }
  },
  // MVP: коробка с лентой
  (g) => {
    fill(g, 1);
    poly(g, [240, 62, 385, 136, 240, 210, 95, 136]);
    fill(g, 0.68);
    poly(g, [95, 136, 240, 210, 240, 360, 95, 286]);
    fill(g, 0.44);
    poly(g, [240, 210, 385, 136, 385, 286, 240, 360]);
    fill(g, 0.86, 1);
    poly(g, [158, 104, 182, 92, 327, 166, 303, 178]);
    poly(g, [303, 178, 327, 166, 327, 220, 303, 232]);
  },
  // Продукт: окно приложения с графиком
  (g) => {
    fill(g, 0.26);
    rrect(g, 56, 70, 368, 260, 18);
    fill(g, 0.62);
    rrect(g, 56, 70, 368, 40, 18);
    fill(g, 0.55);
    rrect(g, 80, 132, 112, 74, 10);
    rrect(g, 80, 222, 112, 84, 10);
    fill(g, 1);
    rrect(g, 216, 246, 30, 60, 6);
    rrect(g, 256, 214, 30, 92, 6);
    rrect(g, 296, 182, 30, 124, 6);
    fill(g, 0.95, 1);
    rrect(g, 336, 140, 30, 166, 6);
    fill(g, 0.85);
    poly(g, [350, 92, 372, 92, 361, 74]);
  },
  // Клиенты: трое людей и сердце
  (g) => {
    fill(g, 0.6);
    circle(g, 116, 178, 34);
    circle(g, 364, 178, 34);
    g.beginPath();
    g.ellipse(116, 318, 70, 92, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.ellipse(364, 318, 70, 92, 0, Math.PI, 0);
    g.fill();
    fill(g, 1);
    circle(g, 240, 150, 46);
    g.beginPath();
    g.ellipse(240, 332, 92, 128, 0, Math.PI, 0);
    g.fill();
    fill(g, 0.95, 1);
    g.beginPath();
    g.moveTo(240, 92);
    g.bezierCurveTo(200, 66, 196, 22, 222, 18);
    g.bezierCurveTo(232, 16, 238, 24, 240, 32);
    g.bezierCurveTo(242, 24, 248, 16, 258, 18);
    g.bezierCurveTo(284, 22, 280, 66, 240, 92);
    g.fill();
  },
];

/** Общая сетка: у всех фигур одни и те же вершины, поэтому они похожи на одну скульптуру */
function lattice() {
  const rnd = seeded(7);
  const h = (STEP * Math.sqrt(3)) / 2;
  const rows = Math.ceil(H / h) + 2;
  const cols = Math.ceil(W / STEP) + 2;
  const pts: Array<Array<[number, number]>> = [];
  for (let r = 0; r < rows; r++) {
    const row: Array<[number, number]> = [];
    for (let c = 0; c < cols; c++) {
      const j = STEP * 0.3;
      row.push([c * STEP + (r % 2 ? STEP / 2 : 0) - STEP + (rnd() - 0.5) * j, r * h - h + (rnd() - 0.5) * j]);
    }
    pts.push(row);
  }
  const tris: Array<[number, number, number, number, number, number]> = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = pts[r]![c]!;
      const b = pts[r]![c + 1]!;
      const d = pts[r + 1]![c]!;
      const e = pts[r + 1]![c + 1]!;
      if (r % 2 === 0) {
        tris.push([...a, ...b, ...d], [...b, ...e, ...d]);
      } else {
        tris.push([...a, ...e, ...d], [...a, ...b, ...e]);
      }
    }
  }
  return tris;
}

function buildScenes(): Tri[][] {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const grid = lattice();
  const rnd = seeded(42);
  const scenes = SCENES.map((draw) => {
    g.clearRect(0, 0, W, H);
    draw(g);
    const px = g.getImageData(0, 0, W, H).data;
    const out: Tri[] = [];
    for (const t of grid) {
      const cx = (t[0] + t[2] + t[4]) / 3;
      const cy = (t[1] + t[3] + t[5]) / 3;
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
      const i = (Math.floor(cy) * W + Math.floor(cx)) * 4;
      if (px[i + 3]! < 128) continue;
      out.push({
        cx,
        cy,
        o: [t[0] - cx, t[1] - cy, t[2] - cx, t[3] - cy, t[4] - cx, t[5] - cy],
        shade: px[i]! / 255,
        accent: px[i + 1]! / 255,
        alpha: 1,
      });
    }
    return out;
  });
  const n = Math.max(...scenes.map((s) => s.length));
  // Лишние грани превращаются в пыль вокруг фигуры — им тоже есть куда лететь.
  return scenes.map((s) => {
    const all = s.slice();
    while (all.length < n) {
      const a = rnd() * Math.PI * 2;
      const r = 175 + rnd() * 70;
      const k = 0.18 + rnd() * 0.22;
      const base = grid[Math.floor(rnd() * grid.length)]!;
      const cx = (base[0] + base[2] + base[4]) / 3;
      const cy = (base[1] + base[3] + base[5]) / 3;
      all.push({
        cx: 240 + Math.cos(a) * r,
        cy: 200 + Math.sin(a) * r * 0.82,
        o: [(base[0] - cx) * k, (base[1] - cy) * k, (base[2] - cx) * k, (base[3] - cy) * k, (base[4] - cx) * k, (base[5] - cy) * k],
        shade: 0.7,
        accent: 0,
        alpha: 0.45,
      });
    }
    // Порядок по углу вокруг центра: соседние грани летят к соседним местам — получается вихрь
    return all.sort((p, q) => Math.atan2(p.cy - 200, p.cx - 240) - Math.atan2(q.cy - 200, q.cx - 240));
  });
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export default function Evolution() {
  const stages = evolution.stages;
  const [cur, setCur] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const goRef = useRef<(i: number) => void>(() => undefined);

  useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    root.setAttribute('data-hydrated', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = prefersReducedMotion();
    const scenes = buildScenes();
    const n = scenes[0]!.length;
    const rnd = seeded(3);
    const per = Array.from({ length: n }, (_, i) => ({
      delay: (i / n) * SPREAD * 0.7 + rnd() * SPREAD * 0.3,
      arc: (rnd() - 0.5) * 120,
      spin: (rnd() < 0.5 ? -1 : 1) * Math.PI * 2 * (rnd() < 0.3 ? 2 : 1),
      phase: rnd() * Math.PI * 2,
      facet: (rnd() - 0.5) * 9,
    }));

    let from = 0;
    let to = 0;
    let changedAt = -100; // время начала перехода
    let visible = true;
    let raf = 0;
    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(((w * H) / W) * dpr);
      ctx.setTransform((canvas.width / W), 0, 0, canvas.height / H, 0, 0);
      if (reduce || !visible) frame();
    };

    const go = (i: number) => {
      if (i === to) return;
      from = to;
      to = i;
      changedAt = reduce ? -100 : now();
      setCur(i);
      if (reduce) frame();
    };
    goRef.current = go;

    function frame() {
      const t = now();
      const since = t - changedAt;
      const dark = isDark();
      const sat = dark ? 72 : 64;
      const lBase = dark ? 14 : 22;
      const lRange = dark ? 62 : 52;
      ctx!.clearRect(0, 0, W, H);

      // Мягкое свечение под фигурой
      const glow = ctx!.createRadialGradient(240, 200, 10, 240, 200, 230);
      glow.addColorStop(0, `hsla(${irisHue(240, 200, t)}, 80%, ${dark ? 45 : 60}%, ${dark ? 0.22 : 0.18})`);
      glow.addColorStop(1, 'hsla(200, 80%, 50%, 0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, W, H);

      const A = scenes[from]!;
      const B = scenes[to]!;
      for (let i = 0; i < n; i++) {
        const p = per[i]!;
        const a = A[i]!;
        const b = B[i]!;
        const raw = Math.min(1, Math.max(0, (since - p.delay) / FLY));
        const e = ease(raw);
        const fly = Math.sin(Math.PI * e);
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const len = Math.hypot(dx, dy) || 1;
        const cx = a.cx + dx * e - (dy / len) * p.arc * fly;
        const cy = a.cy + dy * e + (dx / len) * p.arc * fly;
        const rot = p.spin * e;
        const wob = reduce ? 1 : 1 + 0.035 * Math.sin(t * 2.1 + p.phase);
        const k = (1 - 0.35 * fly) * 1.06 * wob;
        const cs = Math.cos(rot) * k;
        const sn = Math.sin(rot) * k;
        const shade = a.shade + (b.shade - a.shade) * e;
        const accent = a.accent + (b.accent - a.accent) * e;
        const alpha = a.alpha + (b.alpha - a.alpha) * e;
        const sparkle = !reduce && Math.sin(t * 0.8 + p.phase * 9) > 0.992 ? 16 : 0;
        // Внутри фигуры оттенок плывёт мягче, чтобы грани читались по светлоте
        const iris = 206 + (irisHue(cx, cy, reduce ? 0 : t, p.phase) - 206) * (0.5 + 0.5 * fly);
        const hue = iris * (1 - accent) + (322 + 18 * Math.sin(t * 0.7)) * accent;
        const light = lBase + Math.pow(shade, 1.15) * lRange + p.facet + sparkle;
        ctx!.fillStyle = `hsla(${hue.toFixed(1)}, ${sat}%, ${light.toFixed(1)}%, ${alpha})`;
        ctx!.beginPath();
        for (let v = 0; v < 3; v++) {
          const ox = a.o[v * 2]! + (b.o[v * 2]! - a.o[v * 2]!) * e;
          const oy = a.o[v * 2 + 1]! + (b.o[v * 2 + 1]! - a.o[v * 2 + 1]!) * e;
          const x = cx + ox * cs - oy * sn;
          const y = cy + ox * sn + oy * cs;
          if (v === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.closePath();
        ctx!.fill();
      }
    }

    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      const since = now() - changedAt;
      if (since > FLY + SPREAD + HOLD) go((to + 1) % scenes.length);
      frame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!reduce && !raf) raf = requestAnimationFrame(loop);
    };

    changedAt = reduce ? -100 : now() - FLY - SPREAD; // первая фигура уже собрана
    resize();
    frame();
    start();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = !!en?.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => !document.hidden && start();
    document.addEventListener('visibilitychange', onVis);
    const mo = new MutationObserver(() => frame());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const stage = stages[cur]!;
  return (
    <div className="evo" ref={rootRef}>
      <div className="evo__stage">
        <canvas ref={canvasRef} className="evo__canvas" role="img" aria-label={`${stage.title}: ${stage.text}`} />
      </div>
      <ol className="evo__steps">
        {stages.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`evo__step${i === cur ? ' is-active' : ''}${i < cur ? ' is-past' : ''}`}
              aria-current={i === cur ? 'step' : undefined}
              onClick={() => goRef.current(i)}
            >
              <span className="evo__bar" aria-hidden="true" key={i === cur ? `on-${cur}` : 'off'} />
              <span className="evo__name">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="evo__text" aria-live="polite">
        {stage.text}
      </p>
    </div>
  );
}
