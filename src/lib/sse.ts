/**
 * Разбор потока Server-Sent Events.
 *
 * Сервер шлёт события блоками «event: …\ndata: …\n\n». По сети они приходят
 * кусками произвольной длины: блок может разрезаться посередине, даже между \r и \n.
 * Поэтому копим буфер и отдаём событие, только когда встретили пустую строку.
 */

export interface SseEvent {
  event: string;
  data: string;
}

export function createSseParser(onEvent: (e: SseEvent) => void) {
  let buffer = '';

  const flush = (block: string) => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
    }
    if (data.length) onEvent({ event, data: data.join('\n') });
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      // \r приходит отдельным куском — нормализуем только то, что уже точно не оборвано.
      const safeEnd = buffer.endsWith('\r') ? buffer.length - 1 : buffer.length;
      const ready = buffer.slice(0, safeEnd).replace(/\r\n?/g, '\n');
      const tail = buffer.slice(safeEnd);
      const parts = ready.split('\n\n');
      buffer = (parts.pop() ?? '') + tail;
      parts.forEach(flush);
    },
    end() {
      const rest = buffer.replace(/\r\n?/g, '\n').trim();
      buffer = '';
      if (rest) flush(rest);
    },
  };
}

export function formatSse(event: string, data: unknown): string {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\n${payload
    .split('\n')
    .map((l) => `data: ${l}`)
    .join('\n')}\n\n`;
}
