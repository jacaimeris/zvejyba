import warnings;warnings.filterwarnings('ignore')
import geopandas as gpd,pandas as pd,numpy as np,unicodedata,json,re,hashlib,sqlite3,os,datetime
from shapely.geometry import MultiLineString
G='data/gdb_zip/x/Batimetrija.gdb';A='data/bathy/';OUT='data/master/';os.makedirs(OUT,exist_ok=True)
def key(s):
    s=unicodedata.normalize('NFKD',str(s or '').lower());s=''.join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r'\(.*?\)',' ',s);s=re.sub(r'\b(ezeras|ez|tv|tvenkinys|ezerelis|ezerai)\b',' ',s);return ' '.join(re.sub(r'[^a-z0-9]+',' ',s).split())
ZL=gpd.read_file(G,layer='Lakes').reset_index(drop=True);ZC=gpd.read_file(G,layer='Countours_L');ZP=gpd.read_file(G,layer='Depth_points')
ZC['oid']=range(len(ZC));ZP['oid']=range(len(ZP));ZL['oid']=range(len(ZL))
AP=gpd.read_file(A+'gylio_taskai.geojson').to_crs(3346);AC=gpd.read_file(A+'izolinijos.geojson').to_crs(3346)
ZL['k']=ZL.PAVADINIMAS.map(key);ZL['lake_id']=['Z%04d'%i for i in ZL.oid]
LL=ZL[['lake_id','PAVADINIMAS','geometry']]
# --- ZIP taškai/linijos -> ežerai (erdviškai)
zp=gpd.GeoDataFrame(ZP.drop(columns='geometry'),geometry=gpd.points_from_xy(ZP.geometry.x,ZP.geometry.y),crs=3346)
j=gpd.sjoin(zp,LL,how='left',predicate='within');j=j[~j.index.duplicated()]
zp['lake_id']=j.lake_id;zp['assign']=np.where(j.lake_id.notna(),'erdvinis (taškas poligone)','nepriskirtas')
# nepriskirtus taškus: artimiausias poligonas iki 150 m
un=zp[zp.lake_id.isna()]
if len(un):
    nn=gpd.sjoin_nearest(un[['geometry']],LL,how='left',max_distance=150,distance_col='d');nn=nn[~nn.index.duplicated()]
    ok=nn.lake_id.notna();zp.loc[nn.index[ok],'lake_id']=nn.lake_id[ok];zp.loc[nn.index[ok],'assign']='artimiausias poligonas ≤150 m'
zc=ZC.copy()
byname=ZL.groupby('PAVADINIMAS').lake_id.apply(list).to_dict()
def cassign(r):
    ids=byname.get(r.PAVADINIMAS)
    if ids and len(ids)==1:return ids[0],'pagal pavadinimą'
    return None,None
res=zc.apply(cassign,axis=1);zc['lake_id']=[a for a,b in res];zc['assign']=[b for a,b in res]
need=zc[zc.lake_id.isna()]
if len(need):
    cen=gpd.GeoDataFrame(need[['oid']],geometry=need.geometry.representative_point(),crs=3346)
    jj=gpd.sjoin(cen,LL,how='left',predicate='within');jj=jj[~jj.index.duplicated()]
    zc.loc[jj.index,'lake_id']=jj.lake_id;zc.loc[jj.index[jj.lake_id.notna()],'assign']='erdvinis (linija poligone)'
# --- ArcGIS -> ežerai (atitikimas: pavadinimas + erdvė)
ap=AP.copy();ac=AC.copy()
def amap(df):
    out={}
    for gid,g in df.groupby(['GRAKTAS','Telkinys'],dropna=False):
        pts=gpd.GeoDataFrame(geometry=g.geometry.representative_point(),crs=3346)
        jj=gpd.sjoin(pts,LL,how='left',predicate='within');out[gid]=jj.lake_id.value_counts()
    return out
M={}
for df in (ap,ac):
    for gid,vc in amap(df).items():M.setdefault(gid,[]).append(vc)
lake_match={}
for gid,vcs in M.items():
    tot=pd.concat(vcs).groupby(level=0).sum().sort_values(ascending=False)
    n=sum(v.sum() for v in vcs)+sum(0 for _ in vcs)
    lake_match[gid]=(tot.index[0] if len(tot) else None,int(tot.iloc[0]) if len(tot) else 0)
# pavadinimų tikrinimas
amatch={}
for gid,(lid,cnt) in lake_match.items():
    nm=ZL.set_index('lake_id').PAVADINIMAS.get(lid) if lid else None
    nk=key(gid[1]);status='nesutampa' if not lid else ('vardas+erdvė' if key(nm)==nk else 'tik erdvė (vardai skiriasi)')
    amatch[gid]=dict(lake_id=lid,zip_name=nm,status=status,hits=cnt)
pd.DataFrame([dict(graktas=g[0],arcgis_name=g[1],**v) for g,v in amatch.items()]).to_csv(OUT+'arcgis_to_zip_match.csv',index=False)
print(pd.Series([v['status'] for v in amatch.values()]).value_counts())
for g,v in amatch.items():
    if v['status']!='vardas+erdvė':print(g,v)
import pickle;pickle.dump(dict(ZL=ZL,zp=zp,zc=zc,ap=ap,ac=ac,amatch=amatch),open('/tmp/master_stage.pkl','wb'))
