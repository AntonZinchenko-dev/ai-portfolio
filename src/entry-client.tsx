import './styles/global.css';
import { islands } from './islands/registry';

/* ---------- Тема ---------- */
const THEME_KEY = 'theme';

function effectiveTheme(): 'light' | 'dark' {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setupTheme() {
  const root = document.documentElement;
  // Явно проставляем тему, чтобы иконка кнопки соответствовала тому, что на экране.
  root.dataset.theme = effectiveTheme();
  const button = document.getElementById('theme-toggle');
  button?.addEventListener('click', (event) => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Хранилище недоступно (приватный режим) — тема просто не запомнится.
      }
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    if (!doc.startViewTransition || reduce) {
      apply();
      return;
    }
    // Новая тема расходится кругом от кнопки.
    const x = event.clientX || window.innerWidth - 40;
    const y = event.clientY || 32;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 560, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => undefined);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      stored = null;
    }
    if (!stored) root.dataset.theme = e.matches ? 'dark' : 'light';
  });
}

/* ---------- Шапка: линия при прокрутке, прогресс чтения, текущий раздел ---------- */
function setupHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const progress = header.querySelector<HTMLElement>('.header__progress');
  // Там, где нет CSS scroll-timeline, прогресс считаем сами.
  const manual = !CSS.supports('animation-timeline: scroll()');
  const sync = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (manual && progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }
  };
  sync();
  window.addEventListener('scroll', sync, { passive: true });

  const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('.header__nav a'));
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const sections = links
    .map((a) => document.getElementById(a.hash.slice(1)))
    .filter((el): el is HTMLElement => Boolean(el));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- Схемы цепочек оживают, только пока их видно ---------- */
function setupChains() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
    { threshold: 0.3 },
  );
  document.querySelectorAll('[data-chain]').forEach((el) => io.observe(el));
}

/* ---------- Острова ---------- */
async function hydrate(el: HTMLElement) {
  const name = el.dataset.island ?? '';
  const load = islands[name];
  if (!load) return;
  const [{ mount }, mod] = await Promise.all([import('./islands/mount'), load()]);
  mount(el, name, mod.default);
}

function setupIslands() {
  const all = Array.from(document.querySelectorAll<HTMLElement>('[data-island]'));
  const lazy: HTMLElement[] = [];
  for (const el of all) {
    if (el.dataset.eager === 'true') void hydrate(el);
    else lazy.push(el);
  }
  if (!('IntersectionObserver' in window)) {
    lazy.forEach((el) => void hydrate(el));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        void hydrate(entry.target as HTMLElement);
      }
    },
    { rootMargin: '300px 0px' },
  );
  lazy.forEach((el) => io.observe(el));
}

setupTheme();
setupHeader();
setupChains();
setupIslands();
