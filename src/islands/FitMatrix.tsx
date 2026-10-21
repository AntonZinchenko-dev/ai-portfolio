import { useState } from 'react';
import { fit, type Strength } from '../content/site';
import { ChevronIcon } from '../components/Icons';

const LABEL: Record<Strength, string> = {
  strong: 'Сильная сторона',
  has: 'Есть опыт',
  gap: 'Подтягиваю',
};

type Filter = 'all' | Strength;

const FILTERS: Array<{ id: Filter; text: string }> = [
  { id: 'all', text: 'Все' },
  { id: 'strong', text: LABEL.strong },
  { id: 'has', text: LABEL.has },
  { id: 'gap', text: LABEL.gap },
];

export default function FitMatrix() {
  const [filter, setFilter] = useState<Filter>('all');
  const count = (f: Filter) => (f === 'all' ? fit.length : fit.filter((r) => r.strength === f).length);

  return (
    <div className="fit">
      <div className="fit__filters" role="group" aria-label="Показать требования">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="fit__filter"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.text}
            <span>{count(f.id)}</span>
          </button>
        ))}
      </div>
      <ul className="fit__list">
        {fit.map((row) => (
          <li key={row.id} hidden={filter !== 'all' && row.strength !== filter} className="fit__row-wrap">
            <details className="fit__row">
              <summary>
                <span className="fit__req">{row.requirement}</span>
                <span className={`strength strength--${row.strength}`}>{LABEL[row.strength]}</span>
                <ChevronIcon className="fit__chev" />
              </summary>
              <div className="fit__body">
                <p>{row.evidence}</p>
                <a href={`#${row.anchor}`}>Где это на странице</a>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
