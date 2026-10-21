-- Таблица фрагментов сайта. {dim} подставляет build.py по размерности модели эмбеддингов.
create extension if not exists vector;

drop table if exists fragments;

create table fragments (
  id        text primary key,
  anchor    text not null,
  title     text not null,
  body      text not null,
  -- Полнотекстовый индекс по-русски считается сам из заголовка и текста.
  tsv       tsvector generated always as (
              setweight(to_tsvector('russian', title), 'A') ||
              setweight(to_tsvector('russian', body), 'B')
            ) stored,
  embedding vector({dim}) not null
);

create index fragments_tsv_idx on fragments using gin (tsv);
-- Фрагментов меньше сотни, поэтому точный перебор быстрее любого приближённого индекса.
