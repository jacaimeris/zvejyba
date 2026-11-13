import warnings;warnings.filterwarnings('ignore')
import pickle,geopandas as gpd,pandas as pd,numpy as np,hashlib,os,shutil,sqlite3,datetime,pyogrio,shapely
s=pickle.load(open('/tmp/master_stage2.pkl','rb'));pts,con,cmp_,ZL,amap=s['pts'],s['con'],s['cmp'],s['ZL'],s['amap']
OUT='data/master/';DB=OUT+'bathymetry_master.gpkg'
if os.path.exists(DB):os.remove(DB)
f2=lambda g:shapely.force_2d(g)
P=gpd.GeoDataFrame(pts.drop(columns=['kx','ky','kd','dupkey']),geometry=gpd.GeoSeries(pts.geometry.map(f2),crs=3346)).to_crs(4326)
C=gpd.GeoDataFrame(con,geometry=gpd.GeoSeries(con.geometry.map(f2),crs=3346)).to_crs(4326)
P['lon']=P.geometry.x.round(7);P['lat']=P.geometry.y.round(7)
# ežerai su ZIP poligonu (ArcGIS-only: geometrijos nėra, nieko neišgalvojama)
Lz=ZL.set_index('lake_id');geom=[]
for lid in cmp_.lake_id:geom.append(f2(Lz.geometry[lid]) if lid in Lz.index else None)
Lk=gpd.GeoDataFrame(cmp_,geometry=gpd.GeoSeries(geom,crs=3346)).to_crs(4326)
Lk['pavadinimas_orig']=[Lz.PAVADINIMAS.get(l) if l in Lz.index else None for l in Lk.lake_id]
Lk['zip_pastaba']=[Lz.PASTABA.get(l) if l in Lz.index else None for l in Lk.lake_id]
pyogrio.write_dataframe(Lk,DB,layer='lakes',driver='GPKG')
pyogrio.write_dataframe(P,DB,layer='depth_points',driver='GPKG',append=True)
pyogrio.write_dataframe(C,DB,layer='depth_contours',driver='GPKG',append=True)
# vardai / sinonimai
names=[]
for r in cmp_.itertuples():
    if isinstance(r.name,str) and r.name.strip():names.append((r.lake_id,r.name,'ZIP' if r.in_zip else 'ArcGIS'))
    if isinstance(r.arcgis_name,str):
        for n in r.arcgis_name.split('; '):names.append((r.lake_id,n,'ArcGIS'))
nm=pd.DataFrame(sorted(set(names)),columns=['lake_id','name','source'])
import unicodedata,re
def key(x):
    x=unicodedata.normalize('NFKD',str(x).lower());x=''.join(c for c in x if not unicodedata.combining(c));return ' '.join(re.sub(r'[^a-z0-9]+',' ',re.sub(r'\b(ezeras|ez|tv|tvenkinys)\b',' ',x)).split())
nm['name_key']=nm.name.map(key)
sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
os.makedirs('data/originals',exist_ok=True)
zsrc='data/gdb_zip/Batimetrija_gdb.zip';shutil.copy(zsrc,'data/originals/Batimetrija_gdb.zip')
rawfiles=sorted(f for f in os.listdir('data/bathy') if f.startswith(('raw_','service','layer')))
src=pd.DataFrame([
 dict(source='ZIP',description='Oficialus Lietuvos batimetrijos FileGDB (Lakes, Countours_L, Countours_P, Depth_points)',file='data/originals/Batimetrija_gdb.zip',sha256=sha(zsrc),bytes=os.path.getsize(zsrc),acquired='2026-11-13 (vartotojo įkeltas)',crs_original='EPSG:3346 LKS94 (+ Baltic 1977 height taškuose)',data_dates='METAI 2017-2025 (poligono lygmuo); failų datos 2021-2026',licence='nenurodyta; naudoti pagal šaltinio savininko sąlygas',notes='Taškai neturi pavadinimo: priskirti ežerui erdviškai (taškas poligone). Gylis teigiamas. Countours_P (9219 gylio poligonų) į DB neįtraukti, originale lieka.'),
 dict(source='ArcGIS',description='LEU Geografijos ir turizmo katedra, FeatureServer Lietuvos_ezeru_batimetrija (sluoksniai 0 ir 1)',file='data/bathy/raw_layer*_3346.json, raw_layer*_4326.json',sha256='; '.join(f'{f}:{sha(os.path.join("data/bathy",f))[:12]}' for f in rawfiles if f.startswith('raw_')),bytes=sum(os.path.getsize(os.path.join('data/bathy',f)) for f in rawfiles),
  acquired='2026-11-13 (API)',crs_original='EPSG:3346 LKS94 (ArcGIS wkid 2600)',data_dates='duomenys 2010-2016, serverio redakcija 2019-10-04; atnaujinami kartą per metus',licence='nenurodyta (copyrightText tuščias)',notes='Gylis neigiamas, DB paverstas teigiamu. Šaltinio planų tikslumas priklauso nuo seno plano.')])
for t,df in (('lake_names',nm),('sources',src)):
    pyogrio.write_dataframe(df,DB,layer=t,driver='GPKG',append=True)
con_=sqlite3.connect(DB)
con_.executescript('''
CREATE VIEW v_points_best AS SELECT * FROM depth_points WHERE is_preferred=1 AND superseded=0;
CREATE VIEW v_contours_best AS SELECT * FROM depth_contours WHERE is_preferred=1;
CREATE VIEW v_lake_search AS SELECT n.name,n.name_key,l.lake_id,l.graktas,l.in_zip,l.in_arcgis,l.has_depth,l.maxdepth_zip,l.maxdepth_arcgis,l.preferred_source FROM lake_names n JOIN lakes l USING(lake_id);
CREATE INDEX idx_pts_lake ON depth_points(lake_id);CREATE INDEX idx_con_lake ON depth_contours(lake_id);CREATE INDEX idx_names_key ON lake_names(name_key);
''');con_.commit()
for t in ('lakes','depth_points','depth_contours','lake_names','sources'):print(t,con_.execute(f'select count(*) from {t}').fetchone()[0])
print('best pts',con_.execute('select count(*) from v_points_best').fetchone()[0],'best contours',con_.execute('select count(*) from v_contours_best').fetchone()[0],'superseded',con_.execute('select count(*) from depth_points where superseded=1').fetchone()[0])
print(os.path.getsize(DB)//2**20,'MB')
