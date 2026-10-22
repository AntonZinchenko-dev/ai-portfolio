import { useEffect, useRef, useState } from 'react';
import { evolution } from '../content/site';
import { irisHue, isDark, prefersReducedMotion, seeded } from '../lib/iris';
import { MESHES, rotate } from '../lib/poly';

/**
 * Первый экран: каркасная полигональная сетка собирается в лампочку (идея),
 * коробку (MVP), окно продукта и людей (клиенты). Рисуются только рёбра и узлы,
 * как у многогранников по краям страницы. При переходе каждая грань летит на
 * своё место по дуге, переворачиваясь в воздухе, а вся фигура слегка
 * покачивается в объёме, как голограмма.
 *
 * Второй вариант — те же фигуры складываются из названий технологий разного
 * размера: на светлых гранях слова крупнее и плотнее. Вариант выбирается
 * случайно при открытии страницы; ?evo=poly или ?evo=tags задаёт его явно.
 */

type Mode = 'poly' | 'tags';
const DUST_CHARS = ['{', '}', '<', '>', '/', '[', ']', '(', ')', '=', ';', '0', '1', '#', '*', '+', '·'];

function pickMode(): Mode {
  const forced = new URLSearchParams(window.location.search).get('evo');
  if (forced === 'poly' || forced === 'tags') return forced;
  return Math.random() < 0.5 ? 'poly' : 'tags';
}

const W = 480;
const H = 400;
/** Шаг сетки: мельче — плотнее каркас и точнее силуэт */
const STEP = 14;
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
  /** 1 — грань на краю фигуры: её рисуем ярче, чтобы читался силуэт */
  edge: number;
  /** Вариант со словами: слово, кегль и поворот (0 или −90°) */
  word?: string;
  size?: number;
  rot0?: number;
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
  // Идея: лампочка с лучами. Колба, плавное горлышко, тёмный цоколь и светлый контакт —
  // разная светлота нужна, чтобы низ читался как цоколь, а не продолжение колбы
  (g) => {
    fill(g, 0.74);
    circle(g, 240, 150, 100);
    poly(g, [170, 205, 310, 205, 280, 288, 200, 288]);
    fill(g, 1);
    circle(g, 210, 118, 40);
    fill(g, 0.4);
    rrect(g, 196, 288, 88, 54, 8);
    fill(g, 0.85);
    poly(g, [212, 342, 268, 342, 254, 366, 226, 366]);
    fill(g, 0.9, 1);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.92 + i * 0.193);
      const c = Math.cos(a);
      const s = Math.sin(a);
      const n = 9;
      poly(g, [240 + c * 122 - s * n, 150 + s * 122 + c * n, 240 + c * 122 + s * n, 150 + s * 122 - c * n, 240 + c * 165, 150 + s * 165]);
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
    // Верх окна сдвинут на ряд сетки ниже, чтобы над шапкой не торчали одиночные грани
    fill(g, 0.26);
    rrect(g, 56, 76, 368, 254, 18);
    fill(g, 0.62);
    rrect(g, 56, 76, 368, 40, 18);
    fill(g, 0.55);
    rrect(g, 80, 132, 112, 74, 10);
    rrect(g, 80, 222, 112, 84, 10);
    fill(g, 1);
    rrect(g, 216, 246, 30, 60, 6);
    rrect(g, 256, 214, 30, 92, 6);
    rrect(g, 296, 182, 30, 124, 6);
    fill(g, 0.95, 1);
    rrect(g, 336, 140, 30, 166, 6);
  },
  // Клиенты: трое людей и сердце над центральным
  (g) => {
    fill(g, 0.6);
    circle(g, 116, 206, 32);
    circle(g, 364, 206, 32);
    g.beginPath();
    g.ellipse(116, 352, 68, 98, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.ellipse(364, 352, 68, 98, 0, Math.PI, 0);
    g.fill();
    fill(g, 1);
    circle(g, 240, 182, 42);
    g.beginPath();
    g.ellipse(240, 364, 90, 132, 0, Math.PI, 0);
    g.fill();
    // Сердце из двух кругов и треугольника — крупное, чтобы сетка его не съела
    fill(g, 0.95, 1);
    circle(g, 210, 48, 32);
    circle(g, 270, 48, 32);
    poly(g, [180, 60, 300, 60, 240, 124]);
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
      // Край фигуры: за серединой хотя бы одного ребра — пустота
      const inside = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < W && y < H && px[(Math.floor(y) * W + Math.floor(x)) * 4 + 3]! >= 128;
      let edge = 0;
      for (let v = 0; v < 3; v++) {
        const mx = (t[v * 2]! + t[((v + 1) % 3) * 2]!) / 2;
        const my = (t[v * 2 + 1]! + t[((v + 1) % 3) * 2 + 1]!) / 2;
        if (!inside(mx + (mx - cx) * 0.9, my + (my - cy) * 0.9)) edge = 1;
      }
      out.push({
        cx,
        cy,
        o: [t[0] - cx, t[1] - cy, t[2] - cx, t[3] - cy, t[4] - cx, t[5] - cy],
        shade: px[i]! / 255,
        accent: px[i + 1]! / 255,
        alpha: 1,
        edge,
      });
    }
    return out;
  });
  const n = Math.max(...scenes.map((s) => s.length));
  // Лишние грани превращаются в пыль вокруг фигуры — им тоже есть куда лететь.
  return scenes.map((s) => {
    const all = s.slice();
    // Лишние грани в покое невидимы: их видно только в полёте, кольца вокруг фигуры нет
    while (all.length < n) {
      const a = rnd() * Math.PI * 2;
      const r = 60 + rnd() * 170;
      const k = 0.18 + rnd() * 0.22;
      const base = grid[Math.floor(rnd() * grid.length)]!;
      const cx = (base[0] + base[2] + base[4]) / 3;
      const cy = (base[1] + base[3] + base[5]) / 3;
      all.push({
        cx: 240 + Math.cos(a) * r * 0.98,
        cy: 200 + Math.sin(a) * r * 0.84,
        o: [(base[0] - cx) * k, (base[1] - cy) * k, (base[2] - cx) * k, (base[3] - cy) * k, (base[4] - cx) * k, (base[5] - cy) * k],
        shade: 0.7,
        accent: 0,
        alpha: 0,
        edge: 0,
      });
    }
    // Порядок по углу вокруг центра: соседние грани летят к соседним местам — получается вихрь
    return all.sort((p, q) => Math.atan2(p.cy - 200, p.cx - 240) - Math.atan2(q.cy - 200, q.cx - 240));
  });
}

/**
 * Облако слов в форме фигуры: слова не налезают друг на друга и целиком лежат
 * внутри силуэта. Сначала крупные слова на светлых гранях, потом всё мельче —
 * они заполняют промежутки, поэтому плотность и размер повторяют светотень.
 */
function buildTagScenes(tags: string[], font: string): Tri[][] {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  const rnd = seeded(77);
  const scenes = SCENES.map((draw) => {
    g.clearRect(0, 0, W, H);
    draw(g);
    const px = g.getImageData(0, 0, W, H).data;
    const shadeAt = (x: number, y: number) => {
      const i = (Math.floor(y) * W + Math.floor(x)) * 4;
      return px[i + 3]! >= 128 ? px[i]! / 255 : -1;
    };
    const used = new Uint8Array(W * H);
    // Слово целиком внутри одной грани: на стыках граней (рёбра коробки, шапка окна,
    // столбики) остаются пустые швы — по ним и читается форма
    const free = (x0: number, y0: number, w: number, h: number, sh: number) => {
      if (x0 < 0 || y0 < 0 || x0 + w >= W || y0 + h >= H) return false;
      for (let y = y0 - 1.5; y <= y0 + h + 1.5; y += 1.5)
        for (let x = x0 - 1.5; x <= x0 + w + 1.5; x += 1.5) {
          const yy = Math.min(H - 1, Math.max(0, y));
          const xx = Math.min(W - 1, Math.max(0, x));
          if (used[Math.floor(yy) * W + Math.floor(xx)] || Math.abs(shadeAt(xx, yy) - sh) > 0.03) return false;
        }
      return true;
    };
    const mark = (x0: number, y0: number, w: number, h: number) => {
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, y0 + h); y++)
        for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(W - 1, x0 + w); x++) used[y * W + x] = 1;
    };
    const cand: Array<[number, number, number]> = [];
    for (let y = 2; y < H; y += 2)
      for (let x = 2; x < W; x += 2) {
        const sh = shadeAt(x, y);
        if (sh >= 0) cand.push([x, y, sh + rnd() * 0.35]);
      }
    cand.sort((p, q) => q[2] - p[2]);
    const out: Tri[] = [];
    // Проходы от крупного кегля к мелкому
    for (const scale of [1.35, 1, 0.75, 0.58, 0.46, 0.38]) {
      for (const [x, y] of cand) {
        const sh = shadeAt(x, y);
        if (sh < 0 || used[y * W + x]) continue;
        const size = (7 + sh * 9) * scale;
        if (size < 4.2) continue;
        let word = tags[Math.floor(rnd() * tags.length)]!;
        // Короткие теги (Go, CI, 1С) лезут в каждую щель — даём им шанс пореже
        if (word.length <= 2 && rnd() < 0.75) word = tags[Math.floor(rnd() * tags.length)]!;
        g.font = `600 ${size}px ${font}`;
        const tw = g.measureText(word).width;
        const vertical = rnd() < 0.22;
        const w = vertical ? size * 0.9 : tw;
        const h = vertical ? tw : size * 0.9;
        const x0 = x - w / 2;
        const y0 = y - h / 2;
        if (!free(x0, y0, w, h, sh)) continue;
        mark(x0, y0, w, h);
        const i = (y * W + x) * 4;
        out.push({ cx: x, cy: y, o: [0, 0, 0, 0, 0, 0], shade: sh, accent: px[i + 1]! / 255, alpha: 1, edge: 0, word, size, rot0: vertical ? -Math.PI / 2 : 0 });
      }
    }
    return out;
  });
  const n = Math.max(...scenes.map((s) => s.length));
  return scenes.map((s) => {
    const all = s.slice();
    while (all.length < n) {
      const a = rnd() * Math.PI * 2;
      const r = 60 + rnd() * 170;
      all.push({ cx: 240 + Math.cos(a) * r, cy: 200 + Math.sin(a) * r * 0.84, o: [0, 0, 0, 0, 0, 0], shade: 0.7, accent: 0, alpha: 0, edge: 0, size: 8, rot0: 0 });
    }
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
    const mode = pickMode();
    root.dataset.mode = mode;
    const tags = evolution.tags;
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    const scenes = mode === 'tags' ? buildTagScenes(tags, font) : buildScenes();
    const n = scenes[0]!.length;
    const rnd = seeded(3);
    const per = Array.from({ length: n }, (_, i) => ({
      delay: (i / n) * SPREAD * 0.7 + rnd() * SPREAD * 0.3,
      arc: (rnd() - 0.5) * 120,
      spin: (rnd() < 0.5 ? -1 : 1) * Math.PI * 2 * (rnd() < 0.3 ? 2 : 1),
      phase: rnd() * Math.PI * 2,
      facet: (rnd() - 0.5) * 9,
      mesh: MESHES[Math.floor(rnd() * MESHES.length)]!,
      size: 4 + rnd() * 6,
      axis: [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3] as [number, number, number],
      spinRate: 0.4 + rnd() * 0.8,
      char: DUST_CHARS[Math.floor(rnd() * DUST_CHARS.length)]!,
    }));
    let baseX = 1;
    let baseY = 1;

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
      baseX = canvas.width / W;
      baseY = canvas.height / H;
      ctx.setTransform(baseX, 0, 0, baseY, 0, 0);
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
      const sat = dark ? 78 : 70;
      ctx!.clearRect(0, 0, W, H);

      // Мягкое свечение под фигурой
      const glow = ctx!.createRadialGradient(240, 200, 10, 240, 200, 230);
      glow.addColorStop(0, `hsla(${irisHue(240, 200, t)}, 80%, ${dark ? 45 : 60}%, ${dark ? 0.22 : 0.18})`);
      glow.addColorStop(1, 'hsla(200, 80%, 50%, 0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, W, H);

      // Покачивание всей фигуры вокруг вертикальной оси с перспективой
      const sway = reduce ? 0 : 0.3 * Math.sin(t * 0.45);
      const swc = Math.cos(sway);
      const sws = Math.sin(sway);
      const tilt = reduce ? 0 : 0.08 * Math.sin(t * 0.31);
      const breath = reduce ? 1 : 1 + 0.012 * Math.sin(t * 1.4);
      const proj = (x: number, y: number): [number, number] => {
        const dx = x - 240;
        const dy = y - 200;
        const z = dx * sws + dy * tilt;
        const k = (720 / (720 + z)) * breath;
        return [240 + dx * swc * k, 200 + dy * k];
      };

      ctx!.lineJoin = 'round';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      const A = scenes[from]!;
      const B = scenes[to]!;
      const nodes: Array<[number, number, string]> = [];


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
        // Переворот грани в воздухе: она становится ребром и снова раскрывается
        const flip = raw > 0 && raw < 1 ? Math.cos(Math.PI * 2 * e) : 1;
        // В покое грани точно стыкуются рёбрами — получается цельная сетка
        const k = 1 - 0.25 * fly;
        const cs = Math.cos(rot) * k;
        const sn = Math.sin(rot) * k;
        const shade = a.shade + (b.shade - a.shade) * e;
        const accent = a.accent + (b.accent - a.accent) * e;
        const alpha = a.alpha + (b.alpha - a.alpha) * e;
        const sparkle = !reduce && Math.sin(t * 0.8 + p.phase * 9) > 0.99 ? 18 : 0;
        const iris = 206 + (irisHue(cx, cy, reduce ? 0 : t, p.phase) - 206) * (0.6 + 0.4 * fly);
        const hue = iris * (1 - accent) + (322 + 18 * Math.sin(t * 0.7)) * accent;
        const light = (dark ? 40 : 30) + Math.pow(shade, 1.1) * (dark ? 36 : 26) + p.facet * 0.6 + sparkle;
        const color = `hsla(${hue.toFixed(1)}, ${sat}%, ${light.toFixed(1)}%,`;
        const edge = a.edge + (b.edge - a.edge) * e;
        if (mode === 'tags') {
          const dust = alpha < 0.75;
          if (dust && fly < 0.05) continue;
          const [px, py] = proj(cx, cy);
          // До середины полёта — старое слово, после — новое
          const word = dust ? p.char : (e < 0.5 ? a.word : b.word) ?? b.word ?? a.word ?? p.char;
          const size = dust ? 9 : a.size! + (b.size! - a.size!) * e;
          const ang = rot + a.rot0! + (b.rot0! - a.rot0!) * e;
          const sx = flip * k;
          const c = Math.cos(ang);
          const sn2 = Math.sin(ang);
          // Слово в своей системе координат: поворот, переворот в полёте, масштаб холста
          ctx!.setTransform(baseX * c * sx, baseY * sn2 * sx, -baseX * sn2 * k, baseY * c * k, baseX * px, baseY * py);
          ctx!.font = `${shade > 0.75 ? 650 : 520} ${size.toFixed(1)}px ${font}`;
          // Грани различаются светлотой сильнее, чем в каркасе: светлая — почти белые слова, тёмная — приглушённые
          const tl = (dark ? 34 : 24) + Math.pow(shade, 2) * (dark ? 56 : 40);
          const th = 206 + (hue - 206) * 0.55;
          const op = dust ? 0.85 * fly : alpha * (0.4 + 0.6 * Math.pow(shade, 2.2));
          ctx!.fillStyle = `hsla(${th.toFixed(1)}, ${accent > 0.5 ? 75 : 62}%, ${tl.toFixed(1)}%, ${op.toFixed(3)})`;
          ctx!.fillText(word, 0, 0);
          continue;
        }
        // Пыль вокруг фигуры — маленькие каркасные многогранники, как по краям страницы
        if (alpha < 0.75) {
          if (fly < 0.05) continue;
          const ang = reduce ? p.axis : ([p.axis[0] + t * p.spinRate, p.axis[1] + t * p.spinRate * 0.7, p.axis[2]] as [number, number, number]);
          const [px, py] = proj(cx, cy);
          const sz = p.size * (1 + 0.6 * fly);
          const pts = p.mesh.v.map((v) => rotate(v, ang));
          ctx!.lineWidth = 0.7;
          ctx!.strokeStyle = `${color} ${(0.85 * fly).toFixed(2)})`;
          ctx!.beginPath();
          for (const [u, w] of p.mesh.e) {
            ctx!.moveTo(px + pts[u]![0] * sz, py + pts[u]![1] * sz);
            ctx!.lineTo(px + pts[w]![0] * sz, py + pts[w]![1] * sz);
          }
          ctx!.stroke();
          continue;
        }
        ctx!.beginPath();
        let vx = 0;
        let vy = 0;
        for (let v = 0; v < 3; v++) {
          const ox = (a.o[v * 2]! + (b.o[v * 2]! - a.o[v * 2]!) * e) * flip;
          const oy = a.o[v * 2 + 1]! + (b.o[v * 2 + 1]! - a.o[v * 2 + 1]!) * e;
          const [x, y] = proj(cx + ox * cs - oy * sn, cy + ox * sn + oy * cs);
          if (v === 0) {
            ctx!.moveTo(x, y);
            vx = x;
            vy = y;
          } else ctx!.lineTo(x, y);
        }
        ctx!.closePath();
        // Еле заметная заливка держит силуэт, главное — рёбра
        ctx!.fillStyle = `${color} ${(alpha * (0.03 + 0.17 * shade * shade)).toFixed(3)})`;
        ctx!.fill();
        ctx!.lineWidth = 0.45 + shade * 0.55 + edge * 0.8;
        ctx!.strokeStyle = `${color} ${(alpha * Math.min(1, 0.16 + 0.84 * Math.pow(shade, 1.6) + edge * 0.45)).toFixed(3)})`;
        ctx!.stroke();
        if (i % 5 === 0 && shade > 0.45 && alpha > 0.9) nodes.push([vx, vy, `hsla(${hue.toFixed(1)}, 90%, ${Math.min(92, light + 18).toFixed(1)}%, ${(0.55 + 0.45 * shade).toFixed(2)})`]);
      }
      ctx!.setTransform(baseX, 0, 0, baseY, 0, 0);
      // Узлы сетки поверх рёбер
      for (const [x, y, c] of nodes) {
        ctx!.fillStyle = c;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.2, 0, Math.PI * 2);
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
