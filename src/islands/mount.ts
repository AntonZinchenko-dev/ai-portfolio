import { createElement, type ComponentType } from 'react';
import { hydrateRoot } from 'react-dom/client';

/**
 * React грузится отдельным чанком только вместе с первым островом.
 * Статический импорт здесь, а не динамический в entry-client: React — CommonJS-пакет,
 * и при динамическом импорте его именованные экспорты недоступны.
 */
export function mount(el: HTMLElement, name: string, Component: ComponentType<Record<string, unknown>>) {
  const props = JSON.parse(el.dataset.props || '{}') as Record<string, unknown>;
  hydrateRoot(el, createElement(Component, props), {
    onRecoverableError: (error) => console.warn(`Остров «${name}»:`, error),
  });
}
