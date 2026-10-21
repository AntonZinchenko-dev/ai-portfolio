-- Гибридный поиск: два списка кандидатов, слитые по рангам (Reciprocal Rank Fusion).
-- Полнотекстовый поиск хорош на точных словах (Python, SQL, RFID),
-- векторный — на перефразировках («с базами данных» ≈ «SQL»).
with
q as (
  select websearch_to_tsquery('russian', %(q)s) as tsq,
         %(vec)s::vector as vec
),
by_text as (
  select f.id, row_number() over (order by ts_rank_cd(f.tsv, q.tsq) desc) as rnk
  from fragments f, q
  where f.tsv @@ q.tsq
  limit 20
),
by_vector as (
  select f.id, row_number() over (order by f.embedding <=> q.vec) as rnk
  from fragments f, q
  order by f.embedding <=> q.vec
  limit 20
),
fused as (
  select id, sum(1.0 / (60 + rnk)) as score
  from (select * from by_text union all select * from by_vector) s
  group by id
)
select f.id, f.anchor, f.title, f.body, fused.score
from fused
join fragments f using (id)
order by fused.score desc
limit %(limit)s;
