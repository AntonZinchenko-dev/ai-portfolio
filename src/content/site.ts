/**
 * Всё содержимое страницы. Вёрстка берёт тексты отсюда, поиск «Спросите
 * резюме» строит фрагменты отсюда же — поэтому на сайте и в ответах
 * одни и те же формулировки.
 */

export const person = {
  name: 'Антон Зинченко',
  role: 'AI-инженер',
  city: 'Екатеринбург',
  telegram: 'https://t.me/AntonZinch',
  telegramHandle: '@AntonZinch',
  email: 'antonzinch3nko@yandex.ru',
  github: 'https://github.com/AntonZinchenko-dev',
};

export const hero = {
  title: 'Встраиваю LLM в рабочие процессы так, чтобы модель не выдумывала, а человек подтверждал результат',
  lead:
    '6 лет делал интерфейсы для систем логистики, складов, производства и бурения. Последний год строю на тех же процессах LLM-системы: агентов, ассистентов по базе знаний, разбор документов.',
  facts: [
    { value: '6+ лет', label: 'коммерческой разработки систем для производства, складов и логистики' },
    { value: '6 складов', label: 'работают на системе, где я делал фронтенд' },
    { value: '25 заявок', label: 'в размеченном наборе, на котором я проверяю LLM-проект' },
  ],
};

/** Иллюстрация для первого экрана: как freight-intake разбирает заявку. */
export const heroDemo = {
  message:
    'Добрый день! Нужно 12 цистерн дизтоплива из Ангарска до станции Октябрьская, отгрузка в ноябре. Ставку обсудим.',
  fields: [
    { label: 'Груз', value: 'Дизельное топливо', quote: 'дизтоплива', status: 'ok' },
    { label: 'Объём', value: '12 цистерн', quote: '12 цистерн', status: 'ok' },
    { label: 'Откуда', value: 'Ангарск', quote: 'из Ангарска', status: 'ok' },
    { label: 'Куда', value: 'Октябрьская — в справочнике три станции', quote: 'станции Октябрьская', status: 'ask' },
    { label: 'Период', value: '01.11–30.11.2026, по цитате', quote: 'в ноябре', status: 'ok' },
    { label: 'Ставка', value: 'Не указана', quote: '', status: 'ask' },
  ] as const,
  caption:
    'Так работает freight-intake: модель извлекает поля, код проверяет, что у каждого значения есть цитата в тексте, и задаёт менеджеру вопросы. Сделку создаёт человек.',
};

export type CaseBadge = 'client' | 'own' | 'test' | 'nda';

export interface CaseLink {
  label: string;
  href: string;
}

export interface CaseStudy {
  id: string;
  anchor: string;
  badge: CaseBadge;
  badgeText: string;
  title: string;
  summary: string;
  problem: string;
  did: string[];
  why: string;
  facts?: Array<{ value: string; label: string }>;
  stack: string[];
  links: CaseLink[];
  note?: string;
}

export const flagship: CaseStudy = {
  id: 'pipepass',
  anchor: 'pipepass',
  badge: 'client',
  badgeText: 'Решение на данных заказчика',
  title: 'PipePass — цифровой паспорт бурильной трубы',
  summary:
    'Интерфейс, где инженер видит износ каждой бурильной трубы по сечениям, фактическую траекторию скважины в 3D и ход рейса по журналу операций.',
  problem:
    'У заказчика есть расчёт усталости труб и данные бурения, но нет места, где их можно прочитать: какая труба выбрала ресурс, где она стояла в колонне и что происходило в скважине.',
  did: [
    'Фронтенд на контракте боевого Drill Pipe Fatigue API 1.1.0: паспортная часть повторяет его до имени поля и переключается на настоящий сервер одной переменной окружения.',
    'Ствол скважины в 3D по инклинометрии методом минимальной кривизны, окрашен по интенсивности искривления. Труба в 3D окрашена по сечениям из профиля повреждений.',
    'Проигрывание рейса: кривая «время — глубина», табло и 3D-сцена идут за одним временем, мимо перерисовки React.',
    'Честная граница данных: боевой контур и демо-контур разделены в коде и в интерфейсе, а то, чего нет в API, собрано в список пробелов для заказчика.',
    'Промысловые единицы и локали: СИ или футы, русский или китайский, с правильной записью чисел.',
  ],
  why:
    'Это ровно «управлять бизнесом на основе данных»: превратить сырой поток телеметрии и расчётов в экран, по которому человек принимает решение, и не нарисовать того, чего в данных нет.',
  facts: [
    { value: '400', label: 'труб в парке заказчика' },
    { value: '11', label: 'сечений на трубу, у каждого своя доля ресурса' },
    { value: '≈70', label: 'событий журнала на рейс' },
    { value: '≈13 900', label: 'строк TypeScript' },
  ],
  stack: ['React 19', 'TypeScript', 'three.js', 'Zustand', 'TanStack Query', 'MSW', 'Vitest', 'FSD'],
  links: [],
  note: 'Репозиторий не публичный — работает на контракте заказчика.',
};

export const aiCases: CaseStudy[] = [
  {
    id: 'agentyard',
    anchor: 'agentyard',
    badge: 'own',
    badgeText: 'Свой проект, 2026',
    title: 'AgentYard — оркестратор агентов на открытых моделях',
    summary:
      'Указываешь папку и пишешь цель обычными словами. AgentYard разбивает работу на этапы и маленькие задачи, гоняет открытые модели на видеокарте через Ollama и проверяет каждую правку типами, тестами и линтером. Без облака и ключей API.',
    problem:
      'Небольшие локальные модели умеют писать код, но в настоящем проекте без присмотра ошибаются одинаково: бродят по файлам, по кругу присылают одну и ту же неверную правку и отдают человеку простыню вывода вместо понятного вопроса.',
    did: [
      'Всё, что можно без модели, делает программа: находит место правки, повторяет одно решение во всех однотипных файлах, запускает проверки. Моделям достаются маленькие конкретные шаги.',
      'Цель превращается в план из 3–5 этапов, большой план ждёт утверждения человеком.',
      'Каждую правку проверяют синтаксис, линтер, типы и тесты той части проекта, где лежат её файлы, — в сравнении с исходным кодом, чтобы задача отвечала только за новые ошибки.',
      'Перед повтором — разбор неудачи и следующий шаг: повтор, другой подход, дробление, модель сильнее. Если не вышло — панель «На чём споткнулись» с файлом, строкой и полем для подсказки.',
      'Работа идёт в отдельной git-ветке: результат применяется одной кнопкой и откатывается.',
    ],
    why: 'Агенты, оркестрация, выбор модели под железо и задачу — то, что в вакансии названо «внедрять и адаптировать готовые AI-инструменты». И честная передача человеку там, где модель не справилась.',
    facts: [
      { value: '184', label: 'теста, включая повторы настоящих неудачных прогонов' },
      { value: '0', label: 'сторонних зависимостей для работы' },
      { value: '16 ГБ', label: 'видеокарта, на которой проверено: qwen3.6 и gpt-oss:20b' },
    ],
    stack: ['Node.js 22', 'TypeScript', 'Electron', 'Ollama', 'JS без фреймворков'],
    links: [{ label: 'Код и описание', href: 'https://github.com/AntonZinchenko-dev/agentyard' }],
    note: 'Лицензия закрытая: код открыт для просмотра.',
  },
  {
    id: 'rag',
    anchor: 'rag',
    badge: 'nda',
    badgeText: 'Корпоративный проект и открытая версия',
    title: 'Ассистенты по базе знаний (RAG)',
    summary:
      'Ассистент, который отвечает по внутренней вики со ссылкой на источник. Делаю корпоративный — он под NDA. Подход показываю на открытой версии pipewiki.',
    problem:
      'Ответ на вопрос сотрудника лежит где-то в вики, но искать его дольше, чем спросить коллегу.',
    did: [
      'Корпоративный ассистент по вики компании — под NDA, подробностей не раскрываю.',
      'pipewiki — открытая версия того же подхода на вымышленном корпусе «ГеоСтек» про геологию и бурение: Python-бэкенд, React-фронтенд, модели локально через Ollama.',
      'Ответ строится только по найденным фрагментам и показывает, откуда взят.',
    ],
    why: 'В вакансии — «интегрировать ИИ-решения с базами знаний». Техкарты, стандарты и регламенты кухни — такая же база знаний.',
    stack: ['Python', 'Ollama', 'RAG', 'React'],
    links: [],
  },
  {
    id: 'freight',
    anchor: 'freight',
    badge: 'test',
    badgeText: 'Тестовое задание, 2026',
    title: 'Freight Intake — разбор заявок на ж/д перевозку',
    summary:
      'Принимает заявку в любом виде — текст, письмо, Word, PDF, Excel — извлекает поля локальной моделью и сверяет их со справочниками. Чего не хватает, система не придумывает, а спрашивает.',
    problem:
      'Заявки приходят в свободной форме. Менеджер переносит их в CRM руками и уточняет недостающее в переписке.',
    did: [
      'Цепочка, а не агент: шаги известны заранее, вероятностный шаг один — извлечение. Остальное — детерминированный код.',
      'Форма ответа задана JSON-схемой и проверяется Pydantic. Значение без дословной цитаты в тексте получает статус «не подтверждено».',
      'Неоднозначное — станция «Октябрьская», которых три, — превращается в вопрос с вариантами из справочника.',
      'Деградация: основная модель → запасная → правила без LLM → честная ошибка.',
      'Защита от инъекций: текст заявки передаётся модели как данные, сделку всё равно подтверждает человек.',
    ],
    why: 'Пилот под конкретную задачу с измеримым результатом: размеченный набор заявок, метрики «выдумано» и «полнота вопросов», история прогонов.',
    facts: [
      { value: '25', label: 'размеченных заявок: полные, неполные, неоднозначные, не-заявки и инъекции' },
      { value: '40 + 16', label: 'тестов: pytest на бэкенде, Vitest на фронтенде' },
      { value: '5', label: 'форматов на входе: txt, eml, docx, pdf, xlsx' },
    ],
    stack: ['Python', 'FastAPI', 'LangChain', 'Ollama', 'qwen2.5:7b', 'Pydantic', 'React', 'MSW'],
    links: [{ label: 'Код и описание', href: 'https://github.com/AntonZinchenko-dev/freight-intake-demo' }],
  },
];

export interface ToolRow {
  id: string;
  title: string;
  text: string;
  stack: string;
  links: CaseLink[];
}

export const tools: ToolRow[] = [
  {
    id: 'taktgrid',
    title: 'TaktGrid',
    text: 'Матрица планирования производства: перенос заказов между станками с проверкой занятости, поиск свободных слотов, конфликты простоев и назначений.',
    stack: 'React, MobX, TanStack Virtual, MSW',
    links: [{ label: 'Код', href: 'https://github.com/AntonZinchenko-dev/takt-grid' }],
  },
  {
    id: 'inventory',
    title: 'Inventory Analytics',
    text: 'Прогноз остатков по 1248 позициям: дефицит и избыток, пересчёт прогноза в Web Worker, очередь дозаказа.',
    stack: 'React, TanStack Query, Recharts, MSW',
    links: [
      { label: 'Демо', href: 'https://antonzinchenko-dev.github.io/inventory-forecasting-dashboard/' },
      { label: 'Код', href: 'https://github.com/AntonZinchenko-dev/inventory-forecasting-dashboard' },
    ],
  },
  {
    id: 'archforge',
    title: 'ArchForge',
    text: 'Десктоп-приложение, которое превращает требования к системе в архитектуру. Работает без ИИ.',
    stack: 'Electron, React, FSD, ядро на Go',
    links: [],
  },
];

export interface WorkCase {
  id: string;
  company: string;
  period: string;
  title: string;
  task: string;
  result: string;
}

export const commercial: WorkCase[] = [
  {
    id: 'varrant-warehouse',
    company: 'Varrant IT',
    period: '2022–2026',
    title: 'Производственно-складской комплекс',
    task: 'Интерфейсы нескольких связанных сервисов: планирование и этапы производства, отгрузка, приёмка, деление, комплектование, перемещение, инвентаризация, списание, бронирование продукции.',
    result: 'Коробочное решение на полный цикл от производства до продажи, внедрено на 6 складах и развивается.',
  },
  {
    id: 'varrant-rfid',
    company: 'Varrant IT',
    period: '2022–2026',
    title: 'CRM для металлургического завода',
    task: 'Отслеживание жизненного цикла продукции по RFID-меткам и локаторам в реальном времени: живые обновления через WebSocket, частые события без просадки скорости.',
    result: 'Система обкатана на заводе.',
  },
  {
    id: 'papelly-freight',
    company: 'Papelly',
    period: '2021–2022',
    title: 'Агрегатор заявок на грузоперевозку',
    task: 'Взятие и бронирование заявок, документооборот, отчётность, рассылки, интерфейсы под интеграцию с 1С и системами клиента.',
    result: 'Продукт около 3 лет на рынке, вырос в полноценный агрегатор.',
  },
  {
    id: 'papelly-fuel',
    company: 'Papelly',
    period: '2021–2022',
    title: 'Единый топливный сервис',
    task: 'Сервис над API Газпрома, Роснефти, Лукойла и Башнефти: выпуск топливных карт, оплата на АЗС по QR-коду, лимиты и географические ограничения.',
    result: 'Вырос из MVP в самостоятельный сервис.',
  },
];

export type Strength = 'strong' | 'has' | 'gap';

export interface FitRow {
  id: string;
  requirement: string;
  evidence: string;
  anchor: string;
  strength: Strength;
}

export const fit: FitRow[] = [
  {
    id: 'find',
    requirement: 'Искать процессы, которые можно автоматизировать с ИИ',
    evidence:
      'Шесть лет делал интерфейсы систем для складов, производства и логистики и разбирал ТЗ с заказчиком. До IT три года работал инженером-электроником на заводе. Где люди теряют время на однотипной работе, вижу по опыту.',
    anchor: 'processes',
    strength: 'has',
  },
  {
    id: 'build',
    requirement: 'Ассистенты, агенты, чат-боты, внутренние инструменты',
    evidence:
      'Freight Intake разбирает заявки, AgentYard оркестрирует агентов, pipewiki отвечает по базе знаний. Внутренние инструменты: TaktGrid и Inventory Analytics.',
    anchor: 'cases',
    strength: 'has',
  },
  {
    id: 'integrate',
    requirement: 'Интеграции с внутренними системами, данными и базами знаний',
    evidence:
      'PipePass на контракте API заказчика, топливный сервис над API четырёх нефтекомпаний, интерфейсы под 1С, RAG по вики.',
    anchor: 'pipepass',
    strength: 'strong',
  },
  {
    id: 'pilot',
    requirement: 'Запускать и проверять пилоты',
    evidence:
      'В Freight Intake модель сравнивается с базовой линией «правила без LLM» на размеченном наборе. В коммерческих проектах участвовал в запусках как фронтенд-разработчик. AI-пилотов внутри компании пока не вёл.',
    anchor: 'freight',
    strength: 'has',
  },
  {
    id: 'measure',
    requirement: 'Оценивать результат внедрения',
    evidence:
      'Золотой набор из 25 заявок, метрики «выдумано», «полнота вопросов», доля неподтверждённых цитат, история прогонов в файле.',
    anchor: 'freight',
    strength: 'has',
  },
  {
    id: 'teach',
    requirement: 'Обучать команды работе с ИИ-инструментами',
    evidence: 'Код-ревью, техническая документация, README «с нуля» в каждом проекте, разбор ТЗ с заказчиком.',
    anchor: 'approach',
    strength: 'has',
  },
  {
    id: 'python',
    requirement: 'Уверенный Python',
    evidence:
      'Бэкенд Freight Intake на FastAPI и Pydantic с 40 тестами pytest, бэкенд pipewiki. Коммерческого опыта на Python нет.',
    anchor: 'freight',
    strength: 'has',
  },
  {
    id: 'sql',
    requirement: 'Уверенный SQL',
    evidence:
      'Базовый уровень: Prisma и миграции Supabase в своём проекте, запросы к pgvector в скриптах этого сайта. Подтягиваю.',
    anchor: 'stack',
    strength: 'gap',
  },
  {
    id: 'api',
    requirement: 'Уверенная работа с API',
    evidence: 'Шесть лет REST, GraphQL и WebSocket в продакшене, JWT-аутентификация, контракт боевого API в PipePass.',
    anchor: 'work',
    strength: 'strong',
  },
  {
    id: 'llm',
    requirement: 'Опыт с LLM, агентами, RAG',
    evidence: 'Последний год: Freight Intake, AgentYard, pipewiki и корпоративный ассистент по вики.',
    anchor: 'cases',
    strength: 'has',
  },
  {
    id: 'arch',
    requirement: 'Самостоятельно проектировать архитектуру и доводить до запуска',
    evidence:
      'Feature-Sliced Design с линтером границ во всех проектах, ArchForge — инструмент «требования → архитектура», фронтенд коробочного решения на 6 складах.',
    anchor: 'work',
    strength: 'strong',
  },
  {
    id: 'plus',
    requirement: 'Плюс: MCP, LangChain и LangGraph, векторные БД',
    evidence: 'LangChain — в Freight Intake. MCP, LangGraph и векторные БД изучаю.',
    anchor: 'stack',
    strength: 'gap',
  },
  {
    id: 'edu',
    requirement: 'Плюс: техническое образование',
    evidence: 'Инженер, Технологический институт НИЯУ МИФИ, 2015. Курс «Машинное обучение, продвинутый уровень», 2026.',
    anchor: 'experience',
    strength: 'strong',
  },
];

export interface ProcessRow {
  id: string;
  mine: string;
  source: string;
  theirs: string;
  pilot: string;
}

export const processes: ProcessRow[] = [
  {
    id: 'intake',
    mine: 'Приёмка и списание на складе',
    source: 'Складской комплекс, Varrant IT',
    theirs: 'Приёмка сырья на фабрике-кухне и в магазинах',
    pilot: 'Разбор накладных и УПД из фото и PDF, сверка с заказом, вопросы по расхождениям',
  },
  {
    id: 'planning',
    mine: 'Планирование производства',
    source: 'Производственный модуль, TaktGrid',
    theirs: 'План выпуска фабрики-кухни',
    pilot: 'Черновик плана по прогнозу продаж, который утверждает технолог',
  },
  {
    id: 'tracking',
    mine: 'Отслеживание продукции по RFID в реальном времени',
    source: 'CRM металлургического завода',
    theirs: 'Партии готовой еды от цеха до полки',
    pilot: 'Найти партию и все точки, куда она ушла, по вопросу обычным языком',
  },
  {
    id: 'orders',
    mine: 'Заявки и документооборот перевозчика',
    source: 'Агрегатор Papelly, Freight Intake',
    theirs: 'Заказы поставщикам и их ответы',
    pilot: 'Собрать предложения поставщиков из писем и прайсов в одну таблицу сравнения',
  },
  {
    id: 'knowledge',
    mine: 'Ассистент по вики компании',
    source: 'RAG-ассистенты, pipewiki',
    theirs: 'Техкарты, стандарты, инструкции для персонала',
    pilot: 'Ассистент «спроси стандарт» для поваров и продавцов со ссылкой на пункт документа',
  },
  {
    id: 'telemetry',
    mine: 'Телеметрия бурения и износ оборудования',
    source: 'PipePass',
    theirs: 'Датчики холодильного и кухонного оборудования',
    pilot: 'Сводка отклонений за смену простым текстом, с графиком и ссылкой на датчик',
  },
];

export const approach = [
  {
    title: 'Найти процесс',
    text: 'Где люди тратят часы на однотипную работу с текстом и данными, а ошибка стоит денег.',
    example: 'Заявки на перевозку в свободной форме, которые менеджер переносит в CRM руками.',
  },
  {
    title: 'Замерить, как есть',
    text: 'Сколько времени и ошибок сейчас. Без этого результат пилота не с чем сравнить.',
    example: 'Базовая линия «правила без LLM» в Freight Intake.',
  },
  {
    title: 'Собрать прототип на реальных данных',
    text: 'Цепочка, где модель делает один вероятностный шаг, а всё остальное — проверяемый код.',
    example: 'PipePass сразу работал на контракте боевого API заказчика.',
  },
  {
    title: 'Проверить пилот метрикой',
    text: 'Размеченный набор случаев, метрика «выдумано», критичные случаи поимённо.',
    example: '25 заявок, включая инъекции и не-заявки.',
  },
  {
    title: 'Запустить и обучить',
    text: 'Результат подтверждает человек. Инструкция простым языком и разбор с командой.',
    example: 'README «с нуля» и разбор ТЗ с заказчиком.',
  },
  {
    title: 'Наблюдать',
    text: 'История прогонов, понятные отказы, запасной путь, если модель недоступна.',
    example: 'Деградация до правил и плашка в интерфейсе, когда ответила не основная модель.',
  },
];

export type Level = 'prod' | 'own' | 'learn';

export const levelText: Record<Level, string> = {
  prod: 'в коммерческих проектах',
  own: 'в своих проектах',
  learn: 'изучаю',
};

export const stack: Array<{ group: string; items: Array<{ name: string; level: Level; where?: string }> }> = [
  {
    group: 'LLM и данные',
    items: [
      { name: 'Извлечение по JSON-схеме', level: 'own', where: 'Freight Intake' },
      { name: 'LangChain', level: 'own', where: 'Freight Intake' },
      { name: 'Ollama, открытые модели', level: 'own', where: 'Freight Intake, pipewiki, AgentYard' },
      { name: 'RAG', level: 'own', where: 'pipewiki, корпоративный ассистент' },
      { name: 'Агенты и оркестрация', level: 'own', where: 'AgentYard' },
      { name: 'Наборы для оценки качества', level: 'own', where: 'Freight Intake' },
      { name: 'SQL, pgvector', level: 'learn' },
      { name: 'MCP, LangGraph', level: 'learn' },
    ],
  },
  {
    group: 'Бэкенд',
    items: [
      { name: 'Python', level: 'own', where: 'Freight Intake, pipewiki' },
      { name: 'FastAPI, Pydantic', level: 'own', where: 'Freight Intake' },
      { name: 'pytest', level: 'own', where: 'Freight Intake' },
      { name: 'Go', level: 'own', where: 'ArchForge' },
    ],
  },
  {
    group: 'Интерфейсы',
    items: [
      { name: 'React, TypeScript', level: 'prod' },
      { name: 'Redux Toolkit, TanStack Query', level: 'prod' },
      { name: 'Next.js, Vue, Nuxt', level: 'prod' },
      { name: 'Feature-Sliced Design', level: 'prod' },
      { name: 'three.js', level: 'prod', where: 'PipePass' },
      { name: 'Electron', level: 'own', where: 'AgentYard, ArchForge' },
    ],
  },
  {
    group: 'Интеграции и качество',
    items: [
      { name: 'REST, GraphQL, WebSocket', level: 'prod' },
      { name: 'Интерфейсы под 1С', level: 'prod' },
      { name: 'Playwright, Vitest, MSW', level: 'prod' },
      { name: 'Docker, Git, CI', level: 'prod' },
    ],
  },
];

export const experience = [
  {
    id: 'ai',
    period: '2025–2026',
    place: 'Свои и тестовые проекты',
    role: 'LLM-системы',
    text: 'Freight Intake, AgentYard, pipewiki, корпоративный ассистент по вики.',
  },
  {
    id: 'varrant',
    period: '2022–2026',
    place: 'Varrant IT, Екатеринбург',
    role: 'Frontend-разработчик',
    text: 'Интерфейсы систем автоматизации производства, складов и логистики на React и TypeScript, CRM для металлургического завода.',
  },
  {
    id: 'papelly',
    period: '2021–2022',
    place: 'Papelly',
    role: 'Frontend-разработчик',
    text: 'Агрегатор заявок на грузоперевозку и единый топливный сервис.',
  },
  {
    id: 'mediaten',
    period: '2020–2021',
    place: 'МЕДИАТЕН, Екатеринбург',
    role: 'Frontend',
    text: 'Лендинги, SPA и SSR на React, Next.js, Vue и Nuxt.',
  },
  {
    id: 'plant',
    period: '2016–2019',
    place: 'Комбинат «Электрохимприбор»',
    role: 'Инженер-электроник',
    text: 'Контроллеры теплопроизводства, сервер SCADA, сеть. Отсюда понимание, как устроены заводы, для которых я потом делал интерфейсы.',
  },
];

export const education = [
  { title: 'Технологический институт НИЯУ МИФИ', detail: 'Инженер, 2015' },
  { title: 'Машинное обучение, продвинутый уровень', detail: 'Сертификат Минцифры, 2026' },
];

export const askPresets = [
  { id: 'last-years', question: 'Чем вы занимались последние годы?' },
  { id: 'llm-commercial', question: 'Есть ли у вас коммерческий опыт с LLM?' },
  { id: 'python-sql', question: 'Что у вас с Python и SQL?' },
  { id: 'no-hallucinations', question: 'Как вы проверяете, что модель не выдумывает?' },
  { id: 'integrations', question: 'Какие интеграции вы делали?' },
  { id: 'warehouse', question: 'Что вы знаете о складских и производственных процессах?' },
  { id: 'first-pilot', question: 'Какой пилот с ИИ вы бы предложили первым?' },
  { id: 'onsite', question: 'Готовы работать очно в Екатеринбурге?' },
];
