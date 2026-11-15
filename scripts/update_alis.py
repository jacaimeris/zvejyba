#!/usr/bin/env python3
"""Ežerų nuomos ir limituotos žvejybos būsena iš ALIS (alisas.lt viešasis API) -> public/alis.json.

ALIS kiekvienam savivaldybės vandens telkiniui duoda:
  isnuomotas  - telkinys išnuomotas (žvejybos plotą naudoja nuomininkas, reikia jo leidimo)
  licencija   - limituota (licencinė) žvejyba, reikia kortelės
Galiojančių nuomos leidimų sąrašas (L03) duoda nuomos pabaigos datą.

Su programos ežerais (public/lakes-index.json) jungiama pagal pavadinimą. Jei tas pats pavadinimas
yra keliose savivaldybėse ir jų būsenos skiriasi, ežeras praleidžiamas (nespėliojame).
Asmenų (nuomininkų) vardai NEsaugomi.

Tik Python 3 standartinė biblioteka. Paleidimas: python3 scripts/update_alis.py
"""
import json, os, re, sys, time, unicodedata, urllib.request
from datetime import datetime, timezone, timedelta

API = "https://alisas.lt/api/public/v1"
ROOT = os.path.join(os.path.dirname(__file__), "..")
IDX = os.path.join(ROOT, "public", "lakes-index.json")
OUT = os.path.join(ROOT, "public", "alis.json")


def get(path):
    for i in range(4):
        try:
            req = urllib.request.Request(API + path, headers={"User-Agent": "zvejo-zurnalas/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception as e:
            if i == 3:
                raise
            time.sleep(2 * (i + 1))


def key(s):
    s = unicodedata.normalize("NFKD", str(s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"\b(ezeras|ez|tv|ezerelis|tvenkinys)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def main():
    lakes = json.load(open(IDX, encoding="utf-8"))["lakes"]
    savs = get("/cl/savivaldybes")
    by = {}  # key -> list of entries
    for sv in savs:
        sid, sname = sv["id"], sv["pavadinimas"]
        try:
            vt = get(f"/cl/vandensTelkiniai?savivaldybe={sid}")
            lease = get(f"/stats/l03/{sid}/true")
        except Exception as e:
            print("praleidžiu", sname, e, file=sys.stderr)
            continue
        until = {}
        for x in lease or []:
            t = x.get("vandensTelkinys") or {}
            if t.get("kodas") and x.get("galiojaIki"):
                until[t["kodas"]] = x["galiojaIki"].replace(".", "-")
        for t in vt or []:
            tip = (t.get("telkinioTipas") or {}).get("pavadinimas", "")
            if "Ežer" not in tip:
                continue
            by.setdefault(key(t["pavadinimas"]), []).append({
                "name": t["pavadinimas"], "code": t.get("kodas"), "sav": sname,
                "leased": bool(t.get("isnuomotas")), "limited": bool(t.get("licencija")),
                "until": until.get(t.get("kodas"), "")})
        time.sleep(0.3)

    out, amb, miss = {}, 0, 0
    for l in lakes:
        c = by.get(key(l["name"]))
        if not c:
            miss += 1
            continue
        if l.get("m"):
            m = [x for x in c if key(l["m"]).split(" ")[0] in key(x["sav"])]
            c = m or c
        states = {(x["leased"], x["limited"]) for x in c}
        if len(states) > 1:
            amb += 1
            continue
        x = c[0]
        out[l["id"]] = {"leased": x["leased"], "limited": x["limited"], "until": x["until"] if len(c) == 1 else "",
                        "alis": x["name"], "code": x["code"] if len(c) == 1 else "",
                        "sav": x["sav"] if len(c) == 1 else ", ".join(sorted({y["sav"] for y in c}))}
    now = datetime.now(timezone.utc) + timedelta(hours=2)
    json.dump({"fetched": now.strftime("%Y-%m-%d"), "source": "ALIS (alisas.lt), viešoji informacija L03 ir vandens telkinių sąrašas",
               "note": "isnuomotas = reikia nuomininko leidimo; limituota = reikia kortelės. Ežerai sujungti pagal pavadinimą; dviprasmiški praleisti.",
               "lakes": out}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"{len(out)} ežerų su ALIS būsena, {amb} dviprasmiški praleisti, {miss} nerasti ALIS -> {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
