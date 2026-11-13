# bathy_ingest: 3 šaltinių batimetrijos surinkimas ir validacija

Šaltiniai: ZIP (`data/originals/Batimetrija_gdb.zip`), Geoportal MapServer `gisc_batimetrija` (sluoksniai 5 ežerai, 0 taškai, 3+2 izobatos, 4 gylio poligonai), LEU ArcGIS FeatureServer (0 taškai, 1 izobatos).
- `fetch_all.py` / `arcgis.py`: nuskaito sluoksnius per OBJECTID partijas, žalius atsakymus ir manifestus (URL, laikas, kiekiai, SHA-256) saugo `data/cache/<šaltinis>/`. Po to API nereikia.
- `sources.py`: įkelia į EPSG:3346, originalūs laukai lieka `attrs` JSON.
- `pipeline.py`: ežerų registras iš oficialių poligonų (vienodi pavadinimai skiriami geometrija), objektų priskyrimas (geometrija; LEU papildomai pagal vardą), metrikos, poriniai palyginimai, veidrodžių ir konfliktų aptikimas, parinkimas, eksportas.
- `cli.py`: `ingest --all|--lake VARDAS [--refresh]`, `lake VARDAS|UID`, `missing`. Rezultatas: `data/cache/validated/bathymetry_validated.gpkg` (+ `lake_registry.csv`, `validated_manifest.json`).
- `test_viesai.py [--live]`: Viesų testas (be --live tinklas užblokuotas).

Taisyklės: gylis teigiamas; atvaizdavimas WGS84, originalios LKS94 koordinatės taškuose (`x_lks94`,`y_lks94`). Šaltiniai laikomi veidrodžiais, jei ≥90% tiksliai sutampa (nėra nepriklausomo patvirtinimo). Suderinami: erdvinis poslinkis ≤25 m ir max gylių skirtumas ≤max(1 m, 15 %). Konfliktuojantys neliečiami: naudojamas tik parinktas šaltinis. Papildomi šaltiniai prideda tik taškus (be ≤5 m dublikatų), niekada izobatų. Balas parinkimui: kranto linija, izobatų lygiai, taškai, aprėptis, metai (euristika).
Statusai: `bathymetry_available` (confidence `single_source` arba `cross_validated`), `no_verified_bathymetry`.
