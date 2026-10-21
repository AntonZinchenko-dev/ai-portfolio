/**
 * Общая «переливающаяся» палитра для анимаций из треугольников.
 * Как плёнка нефти на воде: оттенок плывёт от бирюзы через синий к фиолетовому
 * и зависит от места и времени, поэтому соседние грани чуть разного цвета.
 * Бирюза — тот же петрольный, что и акцент сайта.
 */

export function isDark(): boolean {
  return document.documentElement.dataset.theme !== 'light';
}

/** Оттенок в точке (x, y) в момент t (секунды); phase — личный сдвиг частицы */
export function irisHue(x: number, y: number, t: number, phase = 0): number {
  return (
    206 +
    42 * Math.sin(t * 0.55 + (x * 0.9 + y) * 0.0085 + phase * 0.25) +
    26 * Math.sin(t * 0.33 - x * 0.012 + y * 0.004 + phase)
  );
}

/** Псевдослучайные числа с зерном — у всех посетителей одинаковая сетка */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
