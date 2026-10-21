import { irisHue, isDark, prefersReducedMotion, seeded } from './iris';

/**
 * Фон по краям страницы: треугольники медленно всплывают и вращаются в полях
 * слева и справа от текста. Ближние (крупные) сильнее сдвигаются при прокрутке,
 * а быстрая прокрутка ненадолго раскручивает их. К центру фон гаснет маской,
 * поэтому тексту не мешает. Кадры не рисуются, когда вкладка скрыта.
 */

const CONTENT = 1176; // ширина колонки текста
const MIN_SIDE = 64; // уже — фон не показываем

interface Shard {
  side: -1 | 1;
  /** 0…1 — положение внутри поля */
  u: number;
  y: number;
  size: number;
  z: number;
  rot: number;
  vr: number;
  vy: number;
  phase: number;
  outline: boolean;
  shape: [number, number, number, number, number, number];
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
  const shards: Shard[] = Array.from({ length: 46 }, (_, i) => {
    const z = 0.25 + rnd() * 0.75;
    // Неправильные треугольники выглядят живее равносторонних
    const a = rnd() * Math.PI * 2;
    const pts = [0, 1, 2].flatMap((k) => {
      const ang = a + (k * Math.PI * 2) / 3 + (rnd() - 0.5) * 0.9;
      const r = 0.7 + rnd() * 0.5;
      return [Math.cos(ang) * r, Math.sin(ang) * r];
    }) as Shard['shape'];
    return {
      side: i % 2 ? 1 : -1,
      u: rnd(),
      y: rnd(),
      size: 10 + z * 46 + rnd() * 18,
      z,
      rot: rnd() * Math.PI * 2,
      vr: (rnd() - 0.5) * 0.5,
      vy: 0.006 + rnd() * 0.012,
      phase: rnd() * 10,
      outline: rnd() < 0.32,
      shape: pts,
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
        s.rot += s.vr * dt * (1 + boost * s.z * 3);
      }
      const x = s.side < 0 ? s.u * band - 20 : w - s.u * band + 20;
      // Параллакс: ближние сдвигаются при прокрутке сильнее
      const span = h + 240;
      let y = (s.y * span - scroll * s.z * 0.35) % span;
      if (y < 0) y += span;
      y -= 120;
      const hue = irisHue(x, y + scroll * 0.2, t, s.phase);
      const r = s.size;
      const cs = Math.cos(s.rot) * r;
      const sn = Math.sin(s.rot) * r;
      const p = s.shape;
      ctx!.beginPath();
      for (let k = 0; k < 3; k++) {
        const px = x + p[k * 2]! * cs - p[k * 2 + 1]! * sn;
        const py = y + p[k * 2]! * sn + p[k * 2 + 1]! * cs;
        if (k === 0) ctx!.moveTo(px, py);
        else ctx!.lineTo(px, py);
      }
      ctx!.closePath();
      const alpha = (dark ? 0.18 : 0.16) + s.z * (dark ? 0.42 : 0.34);
      const l = dark ? 58 : 46;
      if (s.outline) {
        ctx!.lineWidth = 1.2 + s.z;
        ctx!.strokeStyle = `hsla(${hue}, 78%, ${l}%, ${alpha})`;
        ctx!.stroke();
      } else {
        // Переливание: градиент поперёк грани, два соседних оттенка
        const g = ctx!.createLinearGradient(x - r, y - r, x + r, y + r);
        g.addColorStop(0, `hsla(${hue - 30}, 80%, ${l + 8}%, ${alpha})`);
        g.addColorStop(1, `hsla(${hue + 40}, 75%, ${l - 6}%, ${alpha * 0.7})`);
        ctx!.fillStyle = g;
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
