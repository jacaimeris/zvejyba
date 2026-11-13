"""Trijų šaltinių įkėlimas į vieningą (EPSG:3346) formą. Visi originalūs laukai lieka stulpelyje attrs (JSON)."""
import json,os,glob,warnings;warnings.filterwarnings('ignore')
import geopandas as gpd,pandas as pd,numpy as np,shapely
from shapely.geometry import Point,MultiLineString,Polygon,MultiPolygon
HERE=os.path.dirname(os.path.abspath(__file__));CACHE=os.path.join(HERE,'..','data','cache')
ZIP=os.path.join(HERE,'..','data','originals','Batimetrija_gdb.zip')
def _pages(d):
    m=json.load(open(os.path.join(d,'manifest.json')));out=[]
    for p in m['pages']:out+=json.load(open(os.path.join(d,p['file'])))['features']
    return m,out
def _ring_area(r):return 0.5*sum(r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1] for i in range(len(r)-1))
def _poly(rings):
    ext=[r for r in rings if _ring_area(r)<0];hol=[r for r in rings if _ring_area(r)>=0]  # Esri: išorė pagal laikrodį
    polys=[Polygon(e) for e in ext if len(e)>=4]
    for h in hol:
        hp=Polygon(h)
        for i,p in enumerate(polys):
            if p.contains(hp.representative_point()):polys[i]=Polygon(p.exterior,list(p.interiors)+[h]);break
    polys=[p if p.is_valid else p.buffer(0) for p in polys]
    return MultiPolygon([q for p in polys for q in (p.geoms if p.geom_type=='MultiPolygon' else [p])]) if polys else None
def _geom(g,kind):
    if not g:return None
    if kind=='esriGeometryPoint':return Point(g['x'],g['y'])
    if kind=='esriGeometryPolyline':return MultiLineString([p for p in g['paths'] if len(p)>1])
    return _poly(g['rings'])
def _clean(attrs):return json.dumps({k:(None if (isinstance(v,float) and np.isnan(v)) else v) for k,v in attrs.items()},ensure_ascii=False,default=str)
def from_cache(src,layer):
    m,fs=_pages(os.path.join(CACHE,src,f'layer{layer}'));kind=m['geometry_type']
    rows=[dict(src_oid=f['attributes'].get('OBJECTID'),attrs=_clean(f['attributes']),**{k:v for k,v in f['attributes'].items() if k!='OBJECTID'},geometry=_geom(f.get('geometry'),kind)) for f in fs]
    g=gpd.GeoDataFrame(rows,geometry='geometry',crs=3346);g['source']=src;g['src_layer']=f"layer{layer}:{m['layer_name']}";g=g[~g.geometry.isna()]
    return g,m
def _std(g,depth_col,name_col=None):
    g=g.copy();g['depth_m']=pd.to_numeric(g[depth_col],errors='coerce').abs();g['name']=g[name_col] if name_col else None;return g
def load_geoportal():
    L,mL=from_cache('geoportal',5);P,mP=from_cache('geoportal',0);C3,m3=from_cache('geoportal',3);C2,m2=from_cache('geoportal',2)
    C=pd.concat([C3,C2],ignore_index=True)
    L['name']=L.PAVADINIMAS;P=_std(P,'GYLIS');C=_std(C,'GYLIS','PAVADINIMAS')
    meta=dict(source='geoportal',url='https://www.geoportal.lt/mapproxy/gisc_batimetrija/MapServer',crs='EPSG:3346 (ArcGIS wkid 2600, vcs 5705)',fetched_utc=mP['fetched_utc'],
      copyright='(c) VšĮ SSVA',measurement_dates=None,note='Be GRAKTAS, metų ir šaltinio planų atributų; tik pavadinimas ir gylis')
    return dict(lakes=L[['name','src_oid','source','attrs','geometry']],points=P,contours=C,meta=meta)
def load_leu():
    P,mP=from_cache('arcgis_leu',0);C,mC=from_cache('arcgis_leu',1)
    P=_std(P,'Gylis','Telkinys');C=_std(C,'Gylis','Telkinys')
    for g in (P,C):g['graktas']=g.GRAKTAS;g['year']=pd.to_numeric(g.Metai,errors='coerce');g['plan_source']=g.Saltinis;g['author']=g.Braize
    meta=dict(source='arcgis_leu',url='https://services3.arcgis.com/G9UFYDnivWeZc6i4/ArcGIS/rest/services/Lietuvos_ezeru_batimetrija/FeatureServer',crs='EPSG:3346 (ArcGIS wkid 2600)',fetched_utc=mP['fetched_utc'],
      copyright=None,measurement_dates='Metai 2010-2016 (digitizavimo metai pagal sluoksnio lauką Metai; ne matavimo data)',last_edit=mP.get('last_edit'),note='Turi GRAKTAS ir šaltinio planą; be ežerų poligonų')
    return dict(lakes=None,points=P,contours=C,meta=meta)
def load_zip():
    p='/vsizip/'+os.path.abspath(ZIP)+'/Batimetrija.gdb'
    L=gpd.read_file(p,layer='Lakes');P=gpd.read_file(p,layer='Depth_points');C=gpd.read_file(p,layer='Countours_L')
    L,P,C=[g.set_crs(3346,allow_override=True) for g in (L,P,C)]
    for g,ln in ((L,'Lakes'),(P,'Depth_points'),(C,'Countours_L')):
        g['src_oid']=np.arange(len(g));g['geometry']=g.geometry.map(shapely.force_2d);g['source']='zip';g['src_layer']=ln
        g['attrs']=[_clean({k:v for k,v in r.items() if k!='geometry'}) for r in g.drop(columns='geometry').to_dict('records')]
    L['name']=L.PAVADINIMAS;L['year']=L.METAI;L['author']=L.KONTRIBUTORIUS
    P=_std(P,'GYLIS');C=_std(C,'GYLIS','PAVADINIMAS')
    meta=dict(source='zip',url='Batimetrija_gdb.zip (vartotojo įkeltas oficialus FileGDB)',crs='EPSG:3346 (LKS94; taškai su Baltic 1977 height)',fetched_utc='2026-11-13T13:47:00Z (failo įkėlimas)',
      copyright=None,measurement_dates='Lakes.METAI 2017-2025 (poligono lygmuo); FileGDB failų datos 2021-2026',note='Be GRAKTAS; taškai be pavadinimo; autorius=KONTRIBUTORIUS')
    return dict(lakes=L,points=P,contours=C,meta=meta)
