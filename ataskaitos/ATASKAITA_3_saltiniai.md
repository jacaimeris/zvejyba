# 3 šaltinių batimetrijos validacija (2026-11-13)

| | ZIP (FileGDB) | Geoportal MapServer | LEU ArcGIS |
|---|---|---|---|
| Ežerų poligonai | 362 | 362 | nėra |
| Gylio taškai | 17 682 | 17 630 | 1 070 |
| Izobatos | 10 628 | 10 330 | 1 132 |
| Gylio poligonai | 9 219 | 8 572 | nėra |
| Atributai | pavadinimas, metai, autorius, pastabos | tik pavadinimas, gylis | GRAKTAS, metai, planas, autorius |
| Datos | 2017-2025 pagal ežerą | nėra | 2010-2016 (digitizavimas) |

Rezultatas (367 telkiniai): 366 su batimetrija, 1 be patikrintos batimetrijos (Z0181, be pavadinimo, 0,47 ha, jokio šaltinio objektų nėra).
- Geoportal yra tiksliai ZIP veidrodis: visuose 361 bendrame ežere ≥90 % objektų koordinatės ir gyliai sutampa (poslinkis 0 m). Todėl jis nėra nepriklausomas patvirtinimas; trūksta jam dalies objektų (52 taškų, 298 izobatų, 647 gylio poligonų) ir visų metaduomenų.
- LEU turi duomenis 68 ežeruose. 42 iš jų yra ZIP kopijos (veidrodis). 24 suderinami nepriklausomi (kryžminis patvirtinimas), 2 konfliktuoja (ež. Stervas 66 m, ež. Lūkstas 88 m poslinkis). Dar vienas konfliktas su Geoportal: Platelių ež. (58 m). Konfliktai nesujungti.
- Patikimumas: cross_validated 24 ežerai, single_source 342, none 1. Parinktas ZIP 350, LEU 16 ežerų (kur jo balas didesnis).
- 5 LEU telkiniai be poligono (Tamašiavos tv., Balžis, Verknė, Šventoji, Juškų upelis) laikomi atskirais įrašais; vardų neatitikimai (pvz. Verknė, einanti per Gilužį) neprijungti prie ežerų.
- Vienodų pavadinimų: 35 poligonai su dubliuotu pavadinimu skiriami geometrija (UID), kiekvienas turi savo objektus.
- Priskyrimas ZIP taškams: 17 411 geometrija, 340 geometrija+vardas, 172 artimiausias poligonas ≤150 m, 21 nepriskirtas (lieka kešo be uid).

Viesai (Z0320): yra ZIP ir Geoportal, nėra LEU. 45,4 ha, centroidas 54,63343 N, 24,79643 E, 38 taškai, 33 izobatos, 22 lygiai (žingsnis 1 m), max 20,9 m, VDU 2021. ZIP~Geoportal veidrodis, nepriklausomų šaltinių 1, pasitikėjimas single_source. Gyvas Geoportal užklausos rezultatas (38 taškai) atitinka kešą. „Trakų r." šaltiniuose nenurodyta: savivaldybės atributo nei ZIP, nei Geoportal neturi, tik centroidas (Trakų apylinkės pagal koordinates tikėtinos, bet formaliai nepatikrinta).

Ko nėra: nė vienas šaltinis neskelbia matavimo datų ar paklaidos, tik metus (ZIP) arba digitizavimo metus (LEU), todėl „erdvinis tikslumas" vertintas tik tarpusavio sutapimu. Licencijos nenurodytos nė viename šaltinyje.
