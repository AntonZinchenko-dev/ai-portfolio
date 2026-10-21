"""Запись ответов модели на готовые вопросы → public/ask-recorded.json.

Сайт на GitHub Pages живую модель не вызывает: ответы записываются заранее,
и виджет «Спросите резюме» показывает их с подписью модели и даты.
Запуск: python -m rag.record
"""

from __future__ import annotations

import json
from datetime import date

from .common import CHAT_MODEL, ROOT, chat_json, connect, load_corpus, search

OUT = ROOT.parent / "public" / "ask-recorded.json"


def main() -> None:
    presets = load_corpus()["presets"]
    recorded: dict[str, dict] = {}
    with connect() as conn:
        for p in presets:
            hits = search(conn, p["question"])
            data = chat_json(p["question"], hits)
            if not data["sources"]:
                print(f"  ! {p['id']}: модель не сослалась ни на один найденный фрагмент — ответ не записан")
                continue
            recorded[p["id"]] = {
                "answer": data["answer"].strip(),
                "sources": data["sources"],
                "model": CHAT_MODEL,
                "recordedAt": date.today().isoformat(),
            }
            print(f"  ✓ {p['id']}: {len(data['sources'])} источн.")
    OUT.write_text(json.dumps(recorded, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Записано {len(recorded)} из {len(presets)} → {OUT.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
