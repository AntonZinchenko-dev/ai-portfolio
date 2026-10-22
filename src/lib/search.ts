/**
 * Поиск по фрагментам сайта — честный «R» из RAG без «G».
 *
 * Каждый блок страницы разбит на фрагменты с якорем. На вопрос ищем самые
 * подходящие фрагменты по BM25 (классическая формула полнотекстового поиска:
 * редкие слова весят больше частых, длинные фрагменты не получают преимущества
 * только за длину). Генерации здесь нет — ответ собирается из найденного дословно.
 */

export interface Fragment {
  id: string;
  /** Якорь блока на странице, куда ведёт источник */
  anchor: string;
  /** Короткое имя блока для подписи источника */
  title: string;
  text: string;
}

export interface Hit {
  fragment: Fragment;
  score: number;
}

/** Слова-синонимы, которые на сайте записаны иначе, чем в вопросе. */
const SYNONYMS: Record<string, string[]> = {
  питон: ['python'],
  пайтон: ['python'],
  ллм: ['llm'],
  ии: ['llm', 'ai'],
  нейросет: ['llm'],
  агент: ['агент', 'оркестр'],
  sql: ['sql', 'postgres', 'баз'],
  бд: ['sql', 'баз'],
  rag: ['rag', 'поиск', 'баз', 'знани'],
  офис: ['очно'],
  переезд: ['екатеринбург', 'очно'],
  бурени: ['бурени', 'скважин', 'drilltrace'],
  склад: ['склад'],
  еда: ['кухн', 'фабрик'],
  кухн: ['кухн', 'фабрик'],
  качеств: ['провер', 'выдум', 'кейс'],
  выдумыва: ['выдум', 'цитат'],
  интеграц: ['интеграц', 'api'],
  опыт: ['опыт', 'лет'],
};

const STOP = new Set(
  'и в во на с со к ко по о об от до за из у а но или ли же бы не ни то что это как так для при про над под вы вас ваш ваши вами мы мне меня мой есть был была были быть какие какой какая каким чем где когда ли уже ещё еще тоже также'.split(
    ' ',
  ),
);

/** Окончания, которые срезаем: грубый стеммер, но для поиска по одной странице его хватает. */
const ENDINGS = [
  'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ией', 'иями', 'ость', 'ости',
  'ать', 'ять', 'ить', 'ете', 'ешь', 'ует', 'уют', 'ают', 'яют', 'ах', 'ях', 'ов', 'ев',
  'ей', 'ий', 'ый', 'ой', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ую', 'юю', 'ам', 'ям',
  'ом', 'ем', 'им', 'ым', 'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'ь',
].sort((x, y) => y.length - x.length);

export function stem(word: string): string {
  if (/^[a-z0-9.+#-]+$/.test(word)) return word; // латиницу и технические имена не трогаем
  for (const end of ENDINGS) {
    if (word.length - end.length >= 4 && word.endsWith(end)) return word.slice(0, -end.length);
  }
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^a-zа-я0-9+#.]+/i)
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);
}

function expand(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) {
    for (const [key, extra] of Object.entries(SYNONYMS)) {
      if (t.startsWith(key)) extra.forEach((e) => out.add(e));
    }
  }
  return [...out];
}

export class FragmentIndex {
  private readonly docs: Array<{ fragment: Fragment; tokens: string[] }>;
  private readonly df = new Map<string, number>();
  private readonly avgLen: number;

  constructor(fragments: readonly Fragment[]) {
    this.docs = fragments.map((fragment) => ({
      fragment,
      tokens: tokenize(`${fragment.title} ${fragment.text}`),
    }));
    for (const doc of this.docs) {
      for (const t of new Set(doc.tokens)) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
    const total = this.docs.reduce((sum, d) => sum + d.tokens.length, 0);
    this.avgLen = this.docs.length ? total / this.docs.length : 1;
  }

  search(query: string, limit = 3): Hit[] {
    const terms = expand(tokenize(query));
    if (!terms.length) return [];
    const n = this.docs.length;
    const k1 = 1.4;
    const b = 0.7;

    const hits: Hit[] = [];
    for (const doc of this.docs) {
      let score = 0;
      for (const term of terms) {
        // Совпадение по началу слова: «складск» найдёт «складской» и «складского».
        const tf = doc.tokens.filter((t) => t === term || (term.length >= 4 && t.startsWith(term))).length;
        if (!tf) continue;
        const df = this.df.get(term) ?? 1;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.tokens.length) / this.avgLen)));
      }
      if (score > 0) hits.push({ fragment: doc.fragment, score });
    }
    return hits.sort((x, y) => y.score - x.score).slice(0, limit);
  }
}
