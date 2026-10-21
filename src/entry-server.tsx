import { renderToString } from 'react-dom/server';
import { App, type AppProps } from './App';

/** Вызывается при сборке: превращает страницу в готовый HTML. */
export function render(props: AppProps): string {
  return renderToString(<App {...props} />);
}
