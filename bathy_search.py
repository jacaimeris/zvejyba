#!/usr/bin/env python3
"""Paieška pagal ežero pavadinimą ar GRAKTAS: python3 bathy_search.py viesai | 12130510"""
import json,sys,os,unicodedata
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'data','bathy')
fold=lambda s:' '.join(''.join(c for c in unicodedata.normalize('NFKD',(s or '').lower()) if not unicodedata.combining(c)).replace('.',' ').split())
q=fold(' '.join(sys.argv[1:]))
if not q:sys.exit(__doc__)
L=json.load(open(os.path.join(D,'index.json')))['lakes']
hit=[l for l in L if q in l['search'] or q==str(l['graktas'])]
if not hit:print('Nerasta. Šiame šaltinyje nėra telkinio:',q,'(nieko negalima išgalvoti).');sys.exit(1)
for l in hit:print(f"{l['name']} | GRAKTAS {l['graktas']} | {l['municipality']} | taškai {l['points']}, izolinijos {l['contours']} | gylis {l['depth_min']}..{l['depth_max']} m | {l['year']} | {'; '.join(l['source'])}")
