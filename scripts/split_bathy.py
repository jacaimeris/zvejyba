#!/usr/bin/env python3
"""Suskaido bathy.json į mažą indeksą + po failą kiekvienam ežerui (greitesnis krovimas).

  public/lakes-index.json   id, pavadinimas, bbox, max gylis, metai, šaltiniai (be kontūrų)
  public/lakes/<id>.json    cont (izobatos), pts (gylio taškai), spots (siūlomos vietos)

Duomenys nekeičiami (jokio apvalinimo ar supaprastinimo), tik išskaidomi ir
sutankinami (be tarpų). Paleisti iš repo šaknies:  python3 scripts/split_bathy.py
"""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "bathy.json"
OUT = ROOT / "public"
HEAVY = ("cont", "pts", "spots")


def dump(obj, path):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    j = json.loads(SRC.read_text(encoding="utf-8"))
    lakes = j["lakes"]
    ids = [l["id"] for l in lakes]
    bad = [i for i in ids if not re.fullmatch(r"[A-Za-z0-9_-]{1,40}", str(i))]
    if bad or len(set(ids)) != len(ids):
        sys.exit(f"Blogi arba pasikartojantys id: {bad[:5]}")

    d = OUT / "lakes"
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)

    index = []
    for l in lakes:
        index.append({k: v for k, v in l.items() if k not in HEAVY})
        dump({k: l.get(k, []) for k in HEAVY}, d / f"{l['id']}.json")
    dump({"v": j.get("v"), "src": j.get("src"), "lakes": index}, OUT / "lakes-index.json")

    sizes = [p.stat().st_size for p in d.glob("*.json")]
    print(f"{len(lakes)} ežerų | indeksas {(OUT / 'lakes-index.json').stat().st_size/1024:.1f} KB | "
          f"ežerų failai vid. {sum(sizes)/len(sizes)/1024:.1f} KB, didžiausias {max(sizes)/1024:.1f} KB | "
          f"originalas {SRC.stat().st_size/1024/1024:.2f} MB")


if __name__ == "__main__":
    main()
