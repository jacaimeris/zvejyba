"""Viešų (ež. Viesai) ingestijos testas. Be --live API nekviečiamas (kešas); su --live papildomai lygina su gyvu Geoportal."""
import sys,os,json,sqlite3,urllib.request;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import pipeline as p,pyogrio,geopandas as gpd,numpy as np
live='--live' in sys.argv
if not live:
    def _no(*a,**k):raise AssertionError('tinklas neturi būti naudojamas')
    urllib.request.urlopen=_no
R=p.run(only=['Viesai'],log=lambda *a:None);reg=R['registry'];assert len(reg)==1,reg.shape;r=reg.iloc[0]
ok=lambda c,m:print(('PASS ' if c else 'FAIL ')+m) or c
res=[]
res.append(ok(r['uid']=='Z0320' and abs(r.area_ha-45.4)<0.1,f"ežeras rastas pagal geometriją, {r.area_ha:.1f} ha"))
res.append(ok(r.sources_present=='zip,geoportal' and r.sources_with_depth=='zip,geoportal',f"šaltiniai: {r.sources_present} (ArcGIS LEU neturi)"))
res.append(ok(r.status=='bathymetry_available' and r.selected_source=='zip',f"statusas {r.status}, parinktas {r.selected_source}"))
res.append(ok(r['zip__n_points']==38 and r['zip__n_contour_lines']==33 and r['zip__n_levels']==22 and abs(r['zip__max_depth_m']-20.9)<1e-6,"ZIP: 38 taškų, 33 izolinijos, 22 lygiai, max 20.9 m"))
res.append(ok(r['geoportal__n_points']==38 and r['geoportal__n_contour_lines']==33,"Geoportal: tie patys kiekiai"))
res.append(ok('zip~geoportal' in str(r.mirrors) and r.independent_sources==1 and r.confidence=='single_source',"ZIP~Geoportal atpažinti kaip veidrodis, nepriklausomų šaltinių 1 (nepateikiama kaip kryžminis patvirtinimas)"))
c=R['comps'];res.append(ok(float(c.offset_m.iloc[0])==0.0 and float(c.pt_dd_median.iloc[0])==0.0,"poslinkis 0 m, taškų gylių skirtumas 0"))
lk=R['lakes'].iloc[0];cen=gpd.GeoSeries([lk.geometry.centroid],crs=3346).to_crs(4326).iloc[0]
print(f"INFO centroidas WGS84: {cen.y:.5f}, {cen.x:.5f}; savivaldybės šaltiniai neturi, 'Trakų r.' nepatikrinta")
G=os.path.join(p.OUT,'bathymetry_validated.gpkg');c2=sqlite3.connect(G)
n=c2.execute("select count(*) from depth_points where uid='Z0320' and role='selected'").fetchone()[0];m=c2.execute("select count(*) from depth_contours where uid='Z0320'").fetchone()[0]
res.append(ok(n==38 and m==33,f"validuotame kešo GPKG: {n} taškų, {m} izolinijų, be dublikatų"))
row=c2.execute("select crs_original,fetched_utc,known_measurement_dates,src_layer from depth_points where uid='Z0320' limit 1").fetchone();print('INFO provenance:',row)
if live:
    sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import arcgis
    b=lk.geometry.bounds;U='https://www.geoportal.lt/mapproxy/gisc_batimetrija/MapServer/0/query'
    j=arcgis._get(U,{'geometry':f'{b[0]},{b[1]},{b[2]},{b[3]}','geometryType':'esriGeometryEnvelope','inSR':3346,'spatialRel':'esriSpatialRelIntersects','outFields':'GYLIS','returnGeometry':'false','f':'json'})
    live_n=len(j['features']);cache_n=int(((R['A']['geoportal']['P'].uid=='Z0320')).sum());print('INFO gyvas Geoportal taškai poligono apgaubtyje:',live_n,'kešas (poligone):',cache_n)
    res.append(ok(live_n>=cache_n and live_n-cache_n<=5,'gyvas Geoportal atsakymas atitinka kešą'))
print('VISKAS GERAI' if all(res) else 'YRA KLAIDŲ');sys.exit(0 if all(res) else 1)
