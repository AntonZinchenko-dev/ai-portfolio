import type { ComponentType } from 'react';

/**
 * «Остров» — интерактивный кусок статичной страницы.
 * На сервере компонент рендерится в HTML как обычно, а в браузере
 * entry-client находит обёртку по data-island, подгружает код компонента,
 * когда до него доскроллили, и «оживляет» уже готовую разметку (hydrate).
 * Остальная страница остаётся простым HTML без JavaScript.
 */
interface IslandProps<P extends object> {
  name: string;
  component: ComponentType<P>;
  props: P;
  /** Оживить сразу, не дожидаясь прокрутки (для первого экрана) */
  eager?: boolean;
  className?: string;
}

export function Island<P extends object>({ name, component: Component, props, eager, className }: IslandProps<P>) {
  return (
    <div
      data-island={name}
      data-props={JSON.stringify(props)}
      data-eager={eager ? 'true' : undefined}
      className={className}
    >
      <Component {...props} />
    </div>
  );
}
