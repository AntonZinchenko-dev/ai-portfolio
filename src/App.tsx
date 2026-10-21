import type { ReactNode } from 'react';
import {
  aiCases,
  approach,
  commercial,
  education,
  experience,
  flagship,
  hero,
  heroDemo,
  levelText,
  person,
  processes,
  productCase,
  stack,
  tools,
  type CaseStudy,
} from './content/site';
import { Island } from './components/Island';
import { Picture, hasImage } from './components/Picture';
import { Chain } from './components/Chain';
import { FileIcon, GithubIcon, MailIcon, MoonIcon, SunIcon, TelegramIcon } from './components/Icons';
import IntakeDemo from './islands/IntakeDemo';
import Evolution from './islands/Evolution';
import VideoShowcase from './islands/VideoShowcase';
import FitMatrix from './islands/FitMatrix';
import AskWidget from './islands/AskWidget';

export interface AppProps {
  hasResume: boolean;
  repoUrl: string;
}

const NAV = [
  { href: '#cases', text: 'Проекты' },
  { href: '#fit', text: 'Под вакансию' },
  { href: '#processes', text: 'Процессы' },
  { href: '#work', text: 'Опыт' },
  { href: '#ask', text: 'Спросить' },
  { href: '#contacts', text: 'Контакты' },
];

const CHAINS: Record<string, Array<{ title: string; text: string; model?: boolean }>> = {
  agentyard: [
    { title: 'Цель', text: 'обычными словами' },
    { title: 'План', text: 'этапы и маленькие задачи' },
    { title: 'Агент', text: 'правка локальной моделью', model: true },
    { title: 'Проверки', text: 'синтаксис, линтер, типы, тесты' },
    { title: 'Разбор неудачи', text: 'следующий шаг или подсказка' },
    { title: 'Применить', text: 'одной кнопкой, с откатом' },
  ],
  rag: [
    { title: 'Документы', text: 'вики, регламенты' },
    { title: 'Фрагменты', text: 'нарезка и индекс' },
    { title: 'Поиск', text: 'самое подходящее' },
    { title: 'Ответ', text: 'только по найденному', model: true },
    { title: 'Источник', text: 'ссылка на пункт' },
  ],
  freight: [
    { title: 'Чтение', text: 'txt, eml, docx, pdf, xlsx' },
    { title: 'Извлечение', text: 'JSON-схема, t = 0', model: true },
    { title: 'Проверка цитат', text: 'нет цитаты — не подтверждено' },
    { title: 'Справочники', text: 'станции, грузы, правила' },
    { title: 'Вопросы', text: 'варианты из справочника' },
    { title: 'Черновик сделки', text: 'подтверждает человек' },
  ],
};

const SHOTS: Record<string, Array<{ name: string; caption: string }>> = {
  pipepass: [{ name: 'pipepass-passport', caption: 'Паспорт трубы: износ по сечениям' }],
  agentyard: [
    { name: 'agentyard-dark', caption: 'Панель застрявшей задачи: ошибка с файлом и строкой, что пробовали, поле для подсказки' },
    { name: 'agentyard-plan', caption: 'План: как понята цель, этапы, задачи и пакеты для установки' },
    { name: 'agentyard-progress', caption: 'Ход работы: что каждая модель делает прямо сейчас, журнал' },
  ],
  rag: [{ name: 'pipewiki-answer', caption: 'pipewiki: ответ со ссылками на источники' }],
  freight: [
    { name: 'freight-overview', caption: 'Экран разбора: примеры заявок, шаги, документ с цитатами, уточнения и черновик сделки' },
    { name: 'freight-quotes', caption: 'Каждое значение подсвечено в тексте: зелёное подтверждено цитатой, оранжевое неоднозначно' },
    { name: 'freight-clarify', caption: 'Неоднозначное становится вопросом с вариантами из справочника' },
  ],
};

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <div className="wrap section__grid">
        <div className="section__rail">
          <h2 className="section__title" id={`${id}-title`}>
            {title}
          </h2>
          {intro && <p className="section__intro">{intro}</p>}
        </div>
        <div className="section__body">{children}</div>
      </div>
    </section>
  );
}

function Shots({ id }: { id: string }) {
  const list = (SHOTS[id] ?? []).filter((s) => hasImage(s.name));
  if (!list.length) return null;
  return (
    <div className={`shots shots--${Math.min(list.length, 2)}${list.length >= 3 ? ' shots--feature' : ''}`}>
      {list.map((s) => (
        <figure className="shot" key={s.name}>
          <Picture name={s.name} sizes="(min-width: 1240px) 880px, (min-width: 768px) 70vw, 92vw" zoom />
          <figcaption>{s.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Facts({ facts }: { facts: NonNullable<CaseStudy['facts']> }) {
  return (
    <dl className={`case__facts case__facts--${facts.length >= 4 ? 4 : 3}`}>
      {facts.map((f) => (
        <div key={f.label}>
          <dt>{f.value}</dt>
          <dd>{f.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function CaseBody({ c }: { c: CaseStudy }) {
  return (
    <>
      <div className="case__block">
        <p className="case__label">Задача</p>
        <p className="case__problem">{c.problem}</p>
      </div>
      <div className="case__block">
        <p className="case__label">Что сделал</p>
        <ul className="case__did">
          {c.did.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
      <div className="case__block">
        <p className="case__label">Почему это про вашу вакансию</p>
        <p className="case__why">{c.why}</p>
      </div>
    </>
  );
}

function CaseFoot({ c }: { c: CaseStudy }) {
  return (
    <>
      <div className="case__stack">
        {c.stack.map((s) => (
          <span className="chip" key={s}>
            {s}
          </span>
        ))}
      </div>
      {(c.links.length > 0 || c.note) && (
        <div className="case__foot">
          {c.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener">
              {l.label}
            </a>
          ))}
          {c.note && <span className="case__note">{c.note}</span>}
        </div>
      )}
    </>
  );
}

function CaseCard({ c }: { c: CaseStudy }) {
  return (
    <article className="case" id={c.anchor} aria-labelledby={`${c.anchor}-title`}>
      <span className={`badge badge--${c.badge}`}>{c.badgeText}</span>
      <h3 className="case__title" id={`${c.anchor}-title`}>
        {c.title}
      </h3>
      <p className="case__summary">{c.summary}</p>
      {CHAINS[c.id] && <Chain steps={CHAINS[c.id]!} label={`Как устроен ${c.title}`} />}
      {c.id === 'freight' && (
        <div className="case__viz">
          <Island name="intake-demo" component={IntakeDemo} props={{}} />
          <p className="showcase__caption">{heroDemo.caption}</p>
        </div>
      )}
      <div className="case__cols">
        <div>
          <CaseBody c={c} />
          {c.facts && <Facts facts={c.facts} />}
        </div>
      </div>
      <Shots id={c.id} />
      <CaseFoot c={c} />
    </article>
  );
}

export function App({ hasResume, repoUrl }: AppProps) {
  const [agentyard, rag, freight] = aiCases as [CaseStudy, CaseStudy, CaseStudy];
  const opsPhotos = [
    { name: 'ops-warehouse', caption: 'Склад' },
    { name: 'ops-kitchen', caption: 'Фабрика-кухня' },
    { name: 'ops-drilling', caption: 'Буровая' },
  ].filter((p) => hasImage(p.name));

  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержанию
      </a>
      <header className="header" id="header">
        <span className="header__progress" aria-hidden="true" />
        <div className="wrap header__inner">
          <a className="header__name" href="#top">
            {person.name}
          </a>
          <nav className="header__nav" aria-label="Разделы">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.text}
              </a>
            ))}
          </nav>
          <div className="header__actions">
            <a className="btn btn--primary header__tg" href={person.telegram} target="_blank" rel="noopener">
              <TelegramIcon />
              Telegram
            </a>
            <button type="button" className="theme-toggle" id="theme-toggle" aria-label="Переключить тему">
              <SunIcon className="theme-toggle__sun" />
              <MoonIcon className="theme-toggle__moon" />
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="wrap hero__grid">
            <div>
              <p className="hero__who">
                <Picture name="portrait" className="hero__avatar" sizes="56px" eager />
                <span>
                  <strong>{person.name}</strong>, {person.role}, {person.city}
                </span>
              </p>
              <h1 className="hero__title" id="hero-title">
                {hero.title}
              </h1>
              <p className="hero__lead">{hero.lead}</p>
              <div className="hero__cta">
                <a className="btn btn--primary" href={person.telegram} target="_blank" rel="noopener">
                  <TelegramIcon />
                  Написать в Telegram
                </a>
                <a className="btn" href="#cases">
                  Смотреть проекты
                </a>
                <a className="btn" href={person.github} target="_blank" rel="noopener">
                  <GithubIcon />
                  GitHub
                </a>
                {hasResume && (
                  <a className="btn" href="./resume.pdf" download>
                    <FileIcon />
                    Резюме, PDF
                  </a>
                )}
              </div>
              <dl className="facts">
                {hero.facts.map((f) => (
                  <div key={f.value}>
                    <dt>{f.value}</dt>
                    <dd>{f.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Island name="evolution" component={Evolution} props={{}} eager className="hero__evo" />
          </div>
        </section>

        <Section
          id="cases"
          title="Проекты"
          intro="Решения на данных заказчика, LLM-системы и продукт, доведённый до конца. Над каждым проектом подписано, чей он: заказчика, мой или тестовое задание."
        >
          <article className="case case--flagship" id={flagship.anchor} aria-labelledby="pipepass-title">
            <span className={`badge badge--${flagship.badge}`}>{flagship.badgeText}</span>
            <h3 className="case__title" id="pipepass-title">
              {flagship.title}
            </h3>
            <p className="case__summary">{flagship.summary}</p>
            <div className="case__viz">
              <Island
                name="video-showcase"
                component={VideoShowcase}
                props={{
                  name: 'pipepass',
                  title: 'PipePass, вьюер рейса RUN-012',
                  label: 'Демо-контур',
                  width: 1600,
                  height: 786,
                }}
              />
              <p className="showcase__caption">
                Запись настоящего интерфейса на демо-контуре: данные сгенерированы, контракт — как у боевого API
                заказчика.
              </p>
            </div>
            <div className="case__cols case__cols--split">
              <div>
                <div className="case__block">
                  <p className="case__label">Задача</p>
                  <p className="case__problem">{flagship.problem}</p>
                </div>
                <div className="case__block">
                  <p className="case__label">Что сделал</p>
                  <ul className="case__did">
                    {flagship.did.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <div className="case__block">
                  <p className="case__label">Почему это про вашу вакансию</p>
                  <p className="case__why">{flagship.why}</p>
                </div>
                {flagship.facts && <Facts facts={flagship.facts} />}
              </div>
            </div>
            <Shots id="pipepass" />
            <CaseFoot c={flagship} />
          </article>

          <CaseCard c={agentyard} />
          <CaseCard c={rag} />
          <CaseCard c={freight} />
          <CaseCard c={productCase} />

          <h3 className="subhead" id="tools">
            Внутренние инструменты
          </h3>
          <ul className="tools">
            {tools.map((t) => (
              <li className="tool" key={t.id} id={`tool-${t.id}`}>
                <span className="tool__title">{t.title}</span>
                <span>
                  {t.text}
                  {t.stack && <span className="tool__stack">{t.stack}</span>}
                </span>
                <span className="tool__links">
                  {t.links.length ? (
                    t.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener">
                        {l.label}
                      </a>
                    ))
                  ) : (
                    <span className="tool__private">Не публичный</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="fit"
          title="Под вашу вакансию"
          intro="Требования вакансии и чем я их подтверждаю. Смотрю на них как разработчик продукта: что проверить быстро, что довести до боевой версии. Где опыта мало, так и написано."
        >
          <Island name="fit-matrix" component={FitMatrix} props={{}} />
        </Section>

        <Section
          id="processes"
          title="Знаю, как устроены процессы"
          intro="Что я делал в системах, где похожий процесс есть у сети кухонь и магазинов, и какую идею я бы первой проверил как MVP."
        >
          {opsPhotos.length > 0 && (
            <div className="ops-photos">
              {opsPhotos.map((p) => (
                <figure key={p.name}>
                  <Picture name={p.name} sizes="(min-width: 1240px) 300px, (min-width: 640px) 30vw, 92vw" />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <table className="bridge">
            <thead>
              <tr>
                <th scope="col">Что я делал</th>
                <th scope="col">Где это у вас</th>
                <th scope="col">Пилот, который я бы проверил</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.id}>
                  <td data-label="Что я делал">
                    {p.mine}
                    <small>{p.source}</small>
                  </td>
                  <td data-label="Где это у вас">{p.theirs}</td>
                  <td data-label="Пилот" className="bridge__pilot">
                    {p.pilot}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bridge-note">
            Пилоты — гипотезы со стороны. Какой из них нужен на самом деле, решается после разговора с теми, кто делает
            эту работу каждый день.
          </p>
        </Section>

        <Section
          id="work"
          title="Коммерческий опыт"
          intro="Шесть лет интерфейсов для систем, которыми пользуются на складах, заводах и в логистике. Скриншотов нет — проекты под NDA."
        >
          <div className="work">
            {commercial.map((w) => (
              <article className="work__item" key={w.id} id={`work-${w.id}`}>
                <p className="work__meta">
                  {w.company}, {w.period}
                </p>
                <h3 className="work__title">{w.title}</h3>
                <p className="work__task">{w.task}</p>
                <p className="work__result">{w.result}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="approach"
          title="От идеи до продукта"
          intro="Как идея становится MVP, а MVP — продуктом, которым пользуются. У каждого шага — пример из моих проектов."
        >
          <ol className="steps">
            {approach.map((s) => (
              <li className="step" key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <p className="step__example">{s.example}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="ask"
          title="Спросите резюме"
          intro="Маленький пример поиска по базе знаний: база — эта страница."
        >
          <Island name="ask-widget" component={AskWidget} props={{}} />
        </Section>

        <Section id="stack" title="Стек" intro="С уровнем: где технология работала у заказчиков, где только в моих проектах, а что изучаю.">
          <div className="stack-legend">
            <span>
              <i className="level level--prod" aria-hidden="true" />
              {levelText.prod}
            </span>
            <span>
              <i className="level level--own" aria-hidden="true" />
              {levelText.own}
            </span>
            <span>
              <i className="level level--learn" aria-hidden="true" />
              {levelText.learn}
            </span>
          </div>
          <div className="stack">
            {stack.map((g) => (
              <div key={g.group}>
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name}>
                      <i className={`level level--${it.level}`} aria-hidden="true" />
                      <span>
                        {it.name}
                        <span className="visually-hidden">, {levelText[it.level]}</span>
                        {it.where && <small>{it.where}</small>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="experience" title="Опыт и образование">
          <ol className="timeline">
            {experience.map((e) => (
              <li key={e.id}>
                <span className="timeline__period">{e.period}</span>
                <div>
                  <p className="timeline__place">
                    {e.place} <span className="timeline__role">— {e.role}</span>
                  </p>
                  <p className="timeline__text">{e.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <h3 className="subhead">Образование</h3>
          <ul className="edu">
            {education.map((e) => (
              <li key={e.title}>
                {e.title}
                <small>{e.detail}</small>
              </li>
            ))}
          </ul>
        </Section>

        <section className="contacts" id="contacts" aria-labelledby="contacts-title">
          <div className="wrap contacts__grid">
            <Picture name="portrait" className="contacts__photo" sizes="(min-width: 768px) 160px, 112px" />
            <div>
            <h2 className="contacts__title" id="contacts-title">
              Обсудим, какую идею проверить первой
            </h2>
            <p className="contacts__text">
              Живу в Екатеринбурге, готов работать очно. Быстрее всего отвечаю в Telegram.
            </p>
            <div className="contacts__list">
              <a className="btn btn--primary" href={person.telegram} target="_blank" rel="noopener">
                <TelegramIcon />
                {person.telegramHandle}
              </a>
              <a className="btn" href={`mailto:${person.email}`}>
                <MailIcon />
                {person.email}
              </a>
              <a className="btn" href={person.github} target="_blank" rel="noopener">
                <GithubIcon />
                GitHub
              </a>
              {hasResume && (
                <a className="btn" href="./resume.pdf" download>
                  <FileIcon />
                  Резюме, PDF
                </a>
              )}
            </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer__inner">
          <span>© 2026 {person.name}</span>
          <span>
            <a href={repoUrl} target="_blank" rel="noopener">
              Исходный код сайта
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
