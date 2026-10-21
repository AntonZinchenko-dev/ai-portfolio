"""Индексация: фрагменты сайта и их векторы → Postgres + pgvector.

Запуск из корня репозитория:
    npm run corpus
    docker compose up -d
    python -m rag.build
"""

from __future__ import annotations

from .common import SQL, connect, embed, load_corpus, to_vector, EMBED_MODEL


def main() -> None:
    corpus = load_corpus()
    fragments = corpus["fragments"]
    texts = [f'{f["title"]}. {f["text"]}' for f in fragments]

    print(f"Считаю векторы моделью {EMBED_MODEL} для {len(texts)} фрагментов…")
    vectors: list[list[float]] = []
    for i in range(0, len(texts), 16):
        vectors.extend(embed(texts[i : i + 16]))
    dim = len(vectors[0])

    with connect() as conn:
        schema = (SQL / "schema.sql").read_text(encoding="utf-8").replace("{dim}", str(dim))
        conn.execute(schema)
        with conn.cursor() as cur:
            cur.executemany(
                """
                insert into fragments (id, anchor, title, body, embedding)
                values (%(id)s, %(anchor)s, %(title)s, %(body)s, %(embedding)s::vector)
                on conflict (id) do update
                  set anchor = excluded.anchor, title = excluded.title,
                      body = excluded.body, embedding = excluded.embedding
                """,
                [
                    {
                        "id": f["id"],
                        "anchor": f["anchor"],
                        "title": f["title"],
                        "body": f["text"],
                        "embedding": to_vector(v),
                    }
                    for f, v in zip(fragments, vectors)
                ],
            )
        count = conn.execute("select count(*) from fragments").fetchone()[0]
    print(f"Готово: в таблице fragments {count} строк, размерность векторов {dim}")


if __name__ == "__main__":
    main()
