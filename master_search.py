#!/usr/bin/env python3
"""Paieška vidinėje DB: python3 master_search.py viesai  |  python3 master_search.py Z0320"""
import sqlite3,sys,os,unicodedata,re
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'data','master','bathymetry_master.gpkg')
k=lambda x:' '.join(re.sub(r'[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFKD',x.lower()) if not unicodedata.combining(c))).split())
q=' '.join(sys.argv[1:]);c=sqlite3.connect(D)
r=c.execute("select distinct lake_id,name,graktas,in_zip,in_arcgis,maxdepth_zip,maxdepth_arcgis,preferred_source from v_lake_search where name_key like ? or lake_id=? or graktas like ?",('%'+k(q)+'%',q,'%'+q+'%')).fetchall()
if not r:sys.exit('Nerasta. Nieko negalima išgalvoti.')
for x in r:
    n=c.execute("select source,count(*) from depth_points where lake_id=? group by source",(x[0],)).fetchall();m=c.execute("select source,count(*) from depth_contours where lake_id=? group by source",(x[0],)).fetchall()
    print(x,'taškai',n,'izolinijos',m)
