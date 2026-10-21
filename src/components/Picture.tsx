import manifest from '../generated/images.json';

/**
 * Картинка из конвейера scripts/images.mjs: AVIF и WebP нескольких ширин,
 * отдельная нарезка под телефон и под широкий экран.
 * Если картинки ещё нет в манифесте, компонент ничего не рисует —
 * страница остаётся цельной и без неё.
 */

interface Variant {
  media: string | null;
  avif: string;
  webp: string;
  src: string;
  width: number;
  height: number;
}

interface Entry {
  alt: string;
  variants: Variant[];
}

const images = manifest as unknown as Record<string, Entry>;

export function hasImage(name: string): boolean {
  return Boolean(images[name]);
}

interface PictureProps {
  name: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}

export function Picture({ name, sizes, className, eager }: PictureProps) {
  const entry = images[name];
  if (!entry) return null;
  // Последний вариант — общий запасной (без media), он же уходит в <img>.
  const fallback = entry.variants[entry.variants.length - 1]!;
  return (
    <picture className={className}>
      {entry.variants.map((v) => (
        <source key={`${v.media}-avif`} type="image/avif" srcSet={v.avif} sizes={sizes} media={v.media ?? undefined} width={v.width} height={v.height} />
      ))}
      {entry.variants.map((v) => (
        <source key={`${v.media}-webp`} type="image/webp" srcSet={v.webp} sizes={sizes} media={v.media ?? undefined} width={v.width} height={v.height} />
      ))}
      <img
        src={fallback.src}
        alt={entry.alt}
        width={fallback.width}
        height={fallback.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
