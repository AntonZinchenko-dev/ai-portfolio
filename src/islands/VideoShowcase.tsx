import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '../components/Icons';

export interface Chapter {
  at: number;
  title: string;
}

interface Props {
  name: string;
  title: string;
  label: string;
  width: number;
  height: number;
  chapters: Chapter[];
}

const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

/**
 * Витрина проекта: запись настоящего интерфейса.
 * Видео играет без звука, только пока его видно; главы перематывают к нужному месту.
 * Без JavaScript остаются обычное видео с заставкой и список глав.
 */
export default function VideoShowcase({ name, title, label, width, height, chapters }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(0);
  const userPaused = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const loop = () => {
      const d = video.duration || 1;
      if (barRef.current) barRef.current.style.transform = `scaleX(${video.currentTime / d})`;
      let idx = 0;
      chapters.forEach((c, i) => {
        if (video.currentTime >= c.at) idx = i;
      });
      setActive((prev) => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(loop);
    };

    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    // Играем, только когда видео на экране, и не мешаем, если человек сам поставил паузу.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !reduce && !userPaused.current) {
          video.play().catch(() => setPlaying(false));
        } else if (!entry.isIntersecting) {
          video.pause();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(video);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [chapters]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      void video.play();
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const seek = (c: Chapter, i: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = c.at + 0.05;
    setActive(i);
    userPaused.current = false;
    void video.play();
  };

  const base = `./media/${name}`;

  return (
    <figure className="showcase">
      <div className="showcase__frame">
        <div className="showcase__bar">
          <span className="showcase__title">{title}</span>
          <span className="showcase__tag">{label}</span>
        </div>
        <div className="showcase__screen">
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            width={width}
            height={height}
            poster={`${base}-poster.webp`}
            aria-label={`Запись экрана: ${title}`}
          >
            <source src={`${base}-960.webm`} type="video/webm" media="(max-width: 820px)" />
            <source src={`${base}-960.mp4`} type="video/mp4" media="(max-width: 820px)" />
            <source src={`${base}-1600.webm`} type="video/webm" />
            <source src={`${base}-1600.mp4`} type="video/mp4" />
          </video>
          <button
            type="button"
            className="showcase__play"
            onClick={toggle}
            aria-label={playing ? 'Пауза' : 'Смотреть запись'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
        <div className="showcase__progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </div>
      <ol className="showcase__chapters showcase__controls" aria-label="Главы записи">
        {chapters.map((c, i) => (
          <li key={c.at}>
            <button
              type="button"
              className="showcase__chapter"
              aria-current={i === active ? 'step' : undefined}
              onClick={() => seek(c, i)}
            >
              <span className="showcase__time">{fmt(c.at)}</span>
              {c.title}
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}
