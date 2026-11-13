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
