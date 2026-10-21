import { irisHue, isDark, prefersReducedMotion, seeded } from './iris';

/**
 * Фон по краям страницы: каркасные многогранники (тетраэдры, октаэдры,
 * икосаэдры) из тонких переливающихся линий — полигональная графика.
 * Они медленно всплывают и вращаются в трёх осях в полях слева и справа от
 * текста. Ближние сильнее сдвигаются при прокрутке, быстрая прокрутка ненадолго
 * раскручивает их. К центру фон гаснет маской, поэтому тексту не мешает.
 * Кадры не рисуются, когда вкладка скрыта.
 */

const CONTENT = 1176; // ширина колонки текста
const MIN_SIDE = 64; // уже — фон не показываем

type V3 = [number, number, number];
interface Mesh {
  v: V3[];
  e: Array<[number, number]>;
}

/** Рёбра — пары вершин на минимальном расстоянии друг от друга */
function mesh(v: V3[]): Mesh {
  const len = Math.hypot(...v[0]!);
  const norm = v.map((p) => p.map((c) => c / len) as V3);
  let min = Infinity;
  const d = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < norm.length; i++) for (let j = i + 1; j < norm.length; j++) min = Math.min(min, d(norm[i]!, norm[j]!));
  const e: Mesh['e'] = [];
  for (let i = 0; i < norm.length; i++)
    for (let j = i + 1; j < norm.length; j++) if (d(norm[i]!, norm[j]!) < min * 1.01) e.push([i, j]);
  return { v: norm, e };
}

const PHI = (1 + Math.sqrt(5)) / 2;
const MESHES: Mesh[] = [
  mesh([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  mesh([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  mesh(
    [
      [0, 1, PHI],
      [0, 1, -PHI],
      [0, -1, PHI],
      [0, -1, -PHI],
      [1, PHI, 0],
      [1, -PHI, 0],
      [-1, PHI, 0],
      [-1, -PHI, 0],
      [PHI, 0, 1],
      [PHI, 0, -1],
      [-PHI, 0, 1],
      [-PHI, 0, -1],
    ] as V3[],
  ),
];

interface Shard {
  side: -1 | 1;
  /** 0…1 — положение внутри поля */
  u: number;
  y: number;
  size: number;
  z: number;
  rot: V3;
  vr: V3;
  vy: number;
  phase: number;
  mesh: Mesh;
}

export function setupEdges() {
  const canvas = document.createElement('canvas');
  canvas.className = 'edges';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduce = prefersReducedMotion();
  const rnd = seeded(11);
  const shards: Shard[] = Array.from({ length: 26 }, (_, i) => {
    const z = 0.25 + rnd() * 0.75;
    const r = rnd();
    return {
      side: i % 2 ? 1 : -1,
      u: rnd(),
      y: rnd(),
      size: 14 + z * 40 + rnd() * 14,
      z,
      rot: [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3],
      vr: [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.3],
      vy: 0.006 + rnd() * 0.012,
      phase: rnd() * 10,
      mesh: MESHES[r < 0.35 ? 0 : r < 0.65 ? 1 : 2]!,
    };
  });

  let w = 0;
  let h = 0;
  let side = 0;
  let raf = 0;
  let last = performance.now();
  let lastScroll = window.scrollY;
  let boost = 0;
  const t0 = last;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = document.documentElement.clientWidth;
    h = window.innerHeight;
    side = Math.max(0, (w - CONTENT) / 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.setProperty('--side', `${side}px`);
    canvas.hidden = side < MIN_SIDE;
    draw(0);
  };

  function draw(dt: number) {
    ctx!.clearRect(0, 0, w, h);
    if (side < MIN_SIDE) return;
    const t = (performance.now() - t0) / 1000;
    const dark = isDark();
    const scroll = window.scrollY;
    const band = side + 40;
    for (const s of shards) {
      if (!reduce) {
        s.y -= s.vy * s.z * dt;
        if (s.y < -0.15) s.y += 1.3;
        const spin = dt * (1 + boost * s.z * 3);
        s.rot[0] += s.vr[0] * spin;
        s.rot[1] += s.vr[1] * spin;
        s.rot[2] += s.vr[2] * spin;
      }
      const x = s.side < 0 ? s.u * band - 20 : w - s.u * band + 20;
      // Параллакс: ближние сдвигаются при прокрутке сильнее
      const span = h + 240;
      let y = (s.y * span - scroll * s.z * 0.35) % span;
      if (y < 0) y += span;
      y -= 120;
      const [ax, ay, az] = s.rot;
      const ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), cc = Math.cos(az), sc = Math.sin(az);
      // Поворот в трёх осях и лёгкая перспектива
      const pts = s.mesh.v.map(([vx, vy, vz]) => {
        let y1 = vy * ca - vz * sa;
        let z1 = vy * sa + vz * ca;
        const x2 = vx * cb + z1 * sb;
        z1 = -vx * sb + z1 * cb;
        const x3 = x2 * cc - y1 * sc;
        y1 = x2 * sc + y1 * cc;
        const k = 3 / (3 + z1);
        return [x + x3 * s.size * k, y + y1 * s.size * k, z1] as V3;
      });
      const alpha = (dark ? 0.22 : 0.2) + s.z * (dark ? 0.5 : 0.42);
      const l = dark ? 62 : 44;
      ctx!.lineWidth = 0.8 + s.z * 0.9;
      ctx!.lineCap = 'round';
      s.mesh.e.forEach(([i, j], n) => {
        const p = pts[i]!;
        const q = pts[j]!;
        // Задние рёбра бледнее — так читается объём
        const front = 0.35 + 0.65 * (1 - (p[2] + q[2] + 2) / 4);
        const hue = irisHue((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + scroll * 0.2, t, s.phase + n * 0.4);
        ctx!.strokeStyle = `hsla(${hue.toFixed(1)}, 80%, ${l}%, ${(alpha * front).toFixed(3)})`;
        ctx!.beginPath();
        ctx!.moveTo(p[0], p[1]);
        ctx!.lineTo(q[0], q[1]);
        ctx!.stroke();
      });
      // Узлы сетки — маленькие точки на передних вершинах
      for (const p of pts) {
        if (p[2] > 0.2) continue;
        ctx!.fillStyle = `hsla(${irisHue(p[0], p[1], t, s.phase).toFixed(1)}, 85%, ${l + 10}%, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p[0], p[1], 1.1 + s.z * 1.2, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
  }

  const loop = (now: number) => {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const sy = window.scrollY;
    boost = Math.min(4, boost * 0.92 + Math.abs(sy - lastScroll) * 0.004);
    lastScroll = sy;
    draw(dt);
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (reduce || raf || canvas.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };

  resize();
  start();
  window.addEventListener('resize', () => {
    resize();
    start();
  });
  document.addEventListener('visibilitychange', start);
  if (reduce) window.addEventListener('scroll', () => draw(0), { passive: true });
  new MutationObserver(() => draw(0)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
