# Batimetrijos šaltinių palyginimas ir sujungimas (2026-11-13)

Šaltiniai: (A) oficialus ZIP `Batimetrija_gdb.zip` (FileGDB), (B) LEU ArcGIS FeatureServer `Lietuvos_ezeru_batimetrija`.
Originalai nekeisti: `data/originals/Batimetrija_gdb.zip`, `data/bathy/raw_*`. DB: `bathymetry_master.gpkg` (WGS84). Paieška: `python3 master_search.py viesai`.

| | ZIP | ArcGIS |
|---|---|---|
| Ežerų/telkinių | 362 poligonai (339 pavadinimai) | 72 GRAKTAS (74 pavadinimai) |
| Gylio taškai | 17 682 | 1 070 |
| Izobatos (linijos) | 10 628 (+9 219 gylio poligonai, į DB neįtraukti) | 1 132 |
| Metai | 2017-2025 (258 ežerai 2017) | 2010-2016 |
| Autoriai | VDU 192, GTC 151, GIS-Centras 13, AAA 5, KU-ŽNP 1 | LEU studentai (M. Pileckas) |
| Gylio ženklas | teigiamas | neigiamas (DB: teigiamas) |

Sutapimas: 67 ežerai abiejuose šaltiniuose (65 pagal vardą ir erdvę, 2 su skirtinga rašyba: Gilūšis~Gilužis, Mažasis Gulbinų~Mažasis Gulbinas), 295 tik ZIP, 6 tik ArcGIS (Verknė, Šventoji, Juškų upelis, Balžis, Bevardis ež., Tamašiavos tv.). Nesujungta, nes tik erdvė sutampa, bet vardai skiriasi: Balžis~Bildžių, Tamašiavos~Čižiūnų, Bevardis, Juškų upelis (žr. `arcgis_to_zip_match.csv`).

Tikslumas/atitikimas bendruose 67: maksimalių gylių skirtumo mediana 0, vidurkis 0,02 m, didžiausi skirtumai 2,6 m (Platelių) ir -1,3 m; nė vienas neviršija konflikto ribos (>1 m ir >20 %). Taškų tankis ha: ZIP 0,121, ArcGIS 0,113. Izobatų žingsnis ~1,7-1,8 m abiejuose. ZIP ir ArcGIS dalis taškų sutampa: 688 ArcGIS taškai (≤1 m, ≤0,1 m gylio) yra ZIP dublikatai, DB pažymėti `superseded=1`, nėra dubliuojami views. Šaltinių tikslumo metrikos (paklaida) nei viename nepateiktos; skiriasi tik metai ir plano šaltinis (ArcGIS laukas `Saltinis`).

Padengimas: ežerų su gylio duomenimis 367/368. Be gylio: Z0181 (be pavadinimo, 0,47 ha). 37 ZIP ežerai turi tik izobatas, be taškų. Priskyrimas ežeram: 17 489 ZIP taškai poligone, 172 ≤150 m nuo poligono, 21 nepriskirtas (lieka su lake_id NULL); 481 ZIP izolinija be ežero (lieka su NULL).
Viesai: yra tik ZIP (Z0320, 45,4 ha, max 20,9 m, 38 taškai, 33 izobatos, žingsnis 1 m, VDU 2021), ArcGIS jų neturi.

Dublikatų politika: nieko netrinta (18 752 taškai = 17 682 + 1 070; 11 760 linijų = 10 628 + 1 132). Tiksliems dublikatams `superseded=1`, `also_in`=ZIP obs_id. Ežerui, esančiam abiejuose šaltiniuose, `preferred_source` = šaltinis su daugiau taškų+izolinijų (ArcGIS 36, ZIP 31); `is_preferred` žymi, kuri versija rodoma views `v_points_best`, `v_contours_best`. Kilmė: kiekvienas įrašas turi source, src_file, src_layer, src_oid, year, contributor, plan_source, attrs (visi originalūs laukai JSON).
Licencija: nenurodyta abiejuose šaltiniuose, platinant klausk autorių.
