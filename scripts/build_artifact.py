#!/usr/bin/env python3
"""Surenka public/ į claude.ai artifact'ui tinkamą aplanką (be shim, mažai failų).

Artifact'e window.claude (db, sample, dictation, downloads) teikia pati claude.ai,
todėl claude-shim.js išmetamas. Ežerų failai sujungiami į vieną lakes-all.json
(artifact'o publikavimas riboja failų skaičių, o 363 mažų failų nepatogu).

  python3 scripts/build_artifact.py <išvesties katalogas>
Išvestis: index.html, forecast.json, lakes-index.json, lakes-all.json
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"


def sub(s, old, new):
    if old not in s:
        sys.exit(f"Nerasta pakeitimui: {old[:60]!r}")
    return s.replace(old, new, 1)


def main(out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    h = (PUB / "index.html").read_text(encoding="utf-8")
    h = sub(h, '<script src="claude-shim.js"></script>\n', "")
    h = sub(h, "<title>Žvejo žurnalas</title>", "<title>Žvejyba</title>")
    h = sub(h, "const LAKE_P={};",
            "let _la=null;const lakesAll=()=>_la||(_la=fetch('lakes-all.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).catch(e=>{_la=null;throw e}));\nconst LAKE_P={};")
    h = sub(h, "fetch('lakes/'+encodeURIComponent(l.id)+'.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})",
            "lakesAll().then(a=>{if(!a[l.id])throw new Error('nėra duomenų');return a[l.id]})")
    (out / "index.html").write_text(h, encoding="utf-8")
    shutil.copy(PUB / "forecast.json", out / "forecast.json")
    shutil.copy(PUB / "lakes-index.json", out / "lakes-index.json")
    allm = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((PUB / "lakes").glob("*.json"))}
    (out / "lakes-all.json").write_text(json.dumps(allm, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for f in sorted(out.iterdir()):
        print(f"{f.name:20} {f.stat().st_size/1024:9.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
