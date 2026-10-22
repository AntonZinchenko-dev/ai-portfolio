import type { CSSProperties } from 'react';

interface ChainStep {
  title: string;
  text: string;
  model?: boolean;
}

/** Конвейер: шаги-станции на одной линии слева направо, шаг с моделью выделен янтарём. */
export function Chain({ steps, label }: { steps: ChainStep[]; label: string }) {
  // Номер шага и длина цепочки уходят в CSS: по ним «пакет данных» проходит шаги по очереди.
  const olStyle = { '--n': steps.length } as CSSProperties;
  return (
    <figure className="chain" aria-label={label} data-chain>
      <ol style={olStyle}>
        {steps.map((s, i) => (
          <li key={s.title} className={s.model ? 'is-model' : undefined} style={{ '--i': i } as CSSProperties}>
            <span className="chain__node" aria-hidden="true">
              {i + 1}
            </span>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      <figcaption className="chain__legend">
        <i aria-hidden="true" />
        Шаг, где работает модель. Остальное — проверяемый код.
      </figcaption>
    </figure>
  );
}
