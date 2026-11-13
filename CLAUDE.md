# Žvejo žurnalas — projekto būsena (perkėlimas iš Claude pokalbio)

Savininkai: Arnas (Vilnius) ir Rokas. Kalba: lietuvių. Vartotojas rašo trumpai, nori padaryto darbo, ne aiškinimų.

## Kas tai
Dviejų žmonių žvejybos programa. Vienas HTML failas (`index.html`, surenkamas `build.py` iš dalių), papildomi `bathy.json` (363 ežerai) ir `forecast.json`.
Skirtukai: **Išvyka** (paruošimas -> paruoštas brief'as -> "Pradėti žvejybą" -> debrief), **Žurnalas** (istorija, peržiūra, papildymas, be dubliavimo), **Daugiau**.
Savininko modelis: kolekcijos gear, trips, briefs, hyp priklauso Arnas/Rokas (S.who).

## DĖMESIO: tai nėra identiška gyvai versijai
- Surinktas `index.html` atitinka gyvą programą iš dalies. Gyvoje yra papildomai Anime.js "Motion" animacijos ir forecast.json, kuriuos pridėjo kitas rašytojas (neaišku kas). Jų čia nėra.
- Gyvos versijos failo man nepavyko išgauti per įrankius (per didelis). Jei reikia tikslios kopijos, atsidaryk artifact'ą ir eksportuok pats.
- Duomenų (išvykos, įranga, hipotezės, brief'ai) čia NĖRA: jie vartotojo artifact DB. Programoje: Daugiau -> Eksportuoti duomenis.

## Runtime priklausomybės, kurias reikia pakeisti Claude Code'e
- `window.claude` db (kolekcijos) -> SQLite arba JSON failai
- dictation -> naršyklės SpeechRecognition arba išmesti
- sample{images} (nuotraukų analizė) -> Anthropic API (vision)
- forecast.json gaunamas iš artifact -> naujas fetch į orų API / cron
- user -> paprastas profilio pasirinkimas Arnas/Rokas

## Taisyklės (išlaikyti)
- Negalima žurnale registruoti masalo keitimų.
- Hipotezes formuoja Claude, ne vartotojas.
- Šaltiniai vertinami patikimumu; spalvos/masalo pasirinkimas pateikiamas kaip "metodinis", be įrodymų (EV13).
- Sakyti, ko trūksta. Niekada nefabrikuoti gylių ar duomenų.
- Viesai: tikrinti nuomos statusą ALIS. Vandens temperatūra tik kaip įvertis.
- Batimetrijos "spot'ai" yra apskaičiuotos hipotezės (statiausias izolinijų nuolydis gylio juostose), ne įrodymas. Nuolydis prisotinamas ~7,1° dėl 8 m minimalaus atstumo.

## Batimetrija
- Šaltiniai: oficialus ZIP (Batimetrija.gdb), Geoportal MapServer (tik pavadinimas + gylis), LEU ArcGIS FeatureServer.
- CRS EPSG:3346 (LKS94), išvestis WGS84. Gylis ArcGIS yra neigiamas, saugomas teigiamas.
- Veidrodžiai (>=90 % sutampančių koordinačių) nelaikomi nepriklausomais šaltiniais. Konfliktai nejungiami. Papildymai tik taškai.
- `bathy_ingest/` (cli.py, pipeline.py, sources.py, fetch_all.py, arcgis.py, test_viesai.py) — 3 šaltinių įkėlimas ir validacija. Testuota su Viesai.
- Rezultatas: 367 ežerai, 366 su batimetrija, 1 "no verified bathymetry"; 24 kryžmiškai patvirtinti. Žr. `data/cache/validated/`.
- Didžiųjų failų čia nėra (ZIP 288 MB, bathymetry_validated.gpkg 100 MB). Atkurti: parsisiųsk oficialų ZIP į data/originals ir paleisk `python bathy_ingest/cli.py` (žr. bathy_ingest/README.md).
- Atviri klausimai: Viesai "Trakų r." nepatikrinta; programos ežerų sluoksnis dar iš ankstesnio master sujungimo, ne iš naujo validated (galima perrinkti `build_app_bathy2.py`).

## Pirmas promptas Claude Code'ui
"Perskaityk CLAUDE.md. Paleisk `python build.py`, atidaryk index.html. Tada pakeisk window.claude db/sample/dictation į SQLite + Anthropic API ir importuok data/export.json (jei yra)."

## Failai
build.py + head.html, data.js, kb.js, logic.js, art.js, imgs.js, app.js, p_*.js (dalys; hub = p_hub2.js), bathy.json, mokslo-saltiniai-v1.md, taisykles-*.md, ataskaitos/.

## Repo ir gyva versija (pridėta perkeliant į GitHub)
- Repo: https://github.com/jacaimeris/zvejyba (privatus). Nuo šiol visas darbas vyksta čia.
- Gyvas Claude artifact: https://claude.ai/artifact/UY7Zzfmh3EjPfoKLJuHj9Y (savininkas Arnas).
- `live/` = tikslus gyvo artifact'o eksportas (2026-11-13): `live/index.html` (su Anime.js "Motion"), `live/forecast.json`. `bathy.json` šakniniame kataloge identiškas gyvam (tas pats sha256).
- Šakniniai `index.html` + dalys (`build.py`...) = senesnis surinkimas be Motion/forecast. Tikslui "kaip gyva" naudok `live/index.html`.
- `build.py` reikalauja `app_old.js`, kurio pakete nėra: iš naujo surinkti negalima, kol jo nėra (arba kol dalys neperrašytos).
- `archive/zvejo-zurnalas-old.html` = ankstesnė pirmo importo versija, tik istorijai.

## Vietinis paleidimas (įgyvendinta, vietoj artifact runtime)
- `python3 server.py` -> http://127.0.0.1:8765 (tik Python 3 stdlib). Rodo `live/index.html` (nekeičiamas; serveris įterpia `claude-shim.js`), `bathy.json`, `forecast.json`.
- `claude-shim.js` atkuria `claude.use('db'|'sample'|'dictation'|'downloads')`:
  - db -> `/api/db/<kolekcija>[/<id>]`, saugoma `data/store/<kolekcija>.json` (gitignore: tai gyvi vartotojų duomenys). Kolekcijos: gear, trips, waters, hyp, briefs, forecasts, dossiers.
  - sample (tekstas + nuotraukų atpažinimas) -> `/api/sample` -> Anthropic Messages API. Reikia `ANTHROPIC_API_KEY` (`.env`, žr. `.env.example`). Modelis `ZVEJO_MODEL`, numatytasis claude-sonnet-5-5.
  - dictation -> naršyklės SpeechRecognition (lt-LT), tik Chrome/Safari.
  - downloads -> naršyklės atsisiuntimas.
- Patikrinta 2026-11-13: puslapis kraunasi, db išsaugo/ištrina/išlieka po perkrovimo. NEPATIKRINTA: AI atsakymai (nėra rakto), nuotraukų atpažinimas, diktavimas.
- Atviri: forecast.json vis dar statinis (reikia naujo fetch į LHMT/Open-Meteo arba cron); duomenų importas iš artifact eksporto (`data/export.json`) dar nesukurtas; macOS: jei paleidžiant iš Claude programos pasirodo "Operation not permitted", paleisk `python3 server.py` savo terminale.

## Peržiūra Claude programoje (visada testuoti čia)
1. Terminalo skydelyje: `python3 server.py` (Claude programos paleistas procesas negali skaityti ~/Desktop: "Operation not permitted").
2. `.claude/launch.json` konfigūracija `zvejo-preview` prisijungia prie veikiančio serverio (http://127.0.0.1:8765) naršyklės skydelyje.

## Struktūra diegimui (GitHub -> Netlify), 2026-11-13
- `public/` = tai, ką publikuoja Netlify (`netlify.toml`: publish = "public", be build žingsnio) ir ką rodo `server.py`. Čia redaguojama programa: `public/index.html`, `public/claude-shim.js`, `public/forecast.json`.
- `live/` = tik nuotrauka to, kas buvo gyvame artifact'e. Neberedaguoti.
- Ežerų duomenys: `bathy.json` (šaknyje, 4,45 MB) yra ŠALTINIS, į Netlify nekeliamas. `python3 scripts/split_bathy.py` sugeneruoja `public/lakes-index.json` (79 KB, ~16 KB gzip) ir `public/lakes/<id>.json` (vid. 12 KB, kontūrai/taškai/vietos). Programa kraunasi indeksą iškart, o ežerą tik jį atidarius (`loadLake`). Pakeitus `bathy.json` paleisk skriptą iš naujo ir commit'ink.
- Neskaityk `bathy.json` ar `public/lakes/*` visų: žiūrėk `public/lakes-index.json` arba vieną ežero failą.
- Be backend'o (Netlify dabar) veikia tik skaitymas: db ir AI grąžina null, programa rodo savo "nepasiekiama" pranešimą. Toliau: Netlify Functions (/api/sample su raktu ir PIN, /api/weather), Netlify Blobs vietoj `data/store`, tada shim rodys į juos.

- Versija rodoma viršuje (`#appVer` public/index.html antraštėje, pvz. "v0.4 · 2026-11-13"). Keisk ranka prieš kiekvieną reikšmingą push.

## Backend Netlify'ui (netlify/functions/api.mjs)
- Viena funkcija `/api/*` (Functions v2): `GET /api/limits` (viešas), `GET /api/db` (visos kolekcijos viena užklausa), `PUT|DELETE /api/db/<kolekcija>/<id>`, `POST /api/sample` (Anthropic). Duomenys: Netlify Blobs, saugyklos `zvejo-<kolekcija>`.
- Viskas, išskyrus limits, reikalauja antraštės `x-zvejo-pin` = env `ZVEJO_PIN`. Be `ZVEJO_PIN` API uždarytas (fail closed). Env kintamuosius (`ZVEJO_PIN`, `ANTHROPIC_API_KEY`, nebūtinai `ZVEJO_MODEL`) įveda tik Arnas: Netlify -> zvejybele -> Project configuration -> Environment variables. Po pakeitimo reikia naujo deploy.
- `public/claude-shim.js`: viena bendra apklausa (lokaliai 4 s, Netlify 30 s + atnaujinimas grįžus į skirtuką), PIN klausiama per `prompt()` ir laikoma localStorage `zz_pin`.
- Patikrinta: funkcijos logika su imituotomis Blobs/Anthropic (PIN, id/kolekcijų validacija, nuotraukų filtras). NEPATIKRINTA realiame Netlify: Blobs, deploy su function'u, tikras Anthropic. Lokaliame `server.py` PIN nereikia (127.0.0.1).
- Netlify Functions apribojimai: nėra node lokaliai, todėl funkcijos negalima paleisti čia; testuoti deploy'intą.
