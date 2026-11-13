import warnings;warnings.filterwarnings('ignore')
import pickle,geopandas as gpd,pandas as pd,numpy as np,json,difflib,hashlib,os,re,unicodedata,datetime,shutil
from shapely import to_wkb
st=pickle.load(open('/tmp/master_stage.pkl','rb'));ZL,zp,zc,ap,ac,amatch=[st[k] for k in ('ZL','zp','zc','ap','ac','amatch')]
OUT='data/master/'
def key(s):
    s=unicodedata.normalize('NFKD',str(s or '').lower());s=''.join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r'\(.*?\)',' ',s);s=re.sub(r'\b(ezeras|ez|tv|tvenkinys|ezerelis|ezerai)\b',' ',s);return ' '.join(re.sub(r'[^a-z0-9]+',' ',s).split())
# 1) ArcGIS -> master ežero ID
gk=lambda a:a if isinstance(a,str) else ''
amap={}
for g,v in amatch.items():
    nm=v['zip_name'] if isinstance(v['zip_name'],str) else ''
    ok=v['status']=='vardas+erdvė' or (v['lake_id'] and nm and difflib.SequenceMatcher(None,key(nm),key(g[1])).ratio()>=0.8)
    k=(gk(g[0]),g[1])
    if ok:amap[k]=dict(lake_id=v['lake_id'],how='vardas+erdvė' if v['status']=='vardas+erdvė' else 'panašus vardas+erdvė (rašyba)',zip_name=nm)
    else:amap[k]=dict(lake_id='A_'+(k[0] or key(k[1]).replace(' ','_')),how='ArcGIS-only'+(f" (erdvė sutampa su ZIP '{nm}', pavadinimai skiriasi, nesujungta)" if v['lake_id'] else ''),zip_name='')
ap['lake_id']=[amap[(gk(a),b)]['lake_id'] for a,b in zip(ap.GRAKTAS,ap.Telkinys)]
ac['lake_id']=[amap[(gk(a),b)]['lake_id'] for a,b in zip(ac.GRAKTAS,ac.Telkinys)]
print('ArcGIS be lake_id:',ap.lake_id.isna().sum(),ac.lake_id.isna().sum())

# 2) vienodinti stulpelius
SRC_ZIP='Batimetrija_gdb.zip (Batimetrija.gdb, FileGDB)';SRC_AG='ArcGIS FeatureServer Lietuvos_ezeru_batimetrija'
zl=ZL.set_index('lake_id')
def js(d):return json.dumps({k:(None if (isinstance(v,float) and np.isnan(v)) else v) for k,v in d.items()},ensure_ascii=False,default=str)
# --- taškai
Z=zp.copy();Z['lake_id']=Z.lake_id;Z['depth_m']=Z.GYLIS.abs()
Z['year']=Z.lake_id.map(zl.METAI);Z['contributor']=Z.lake_id.map(zl.KONTRIBUTORIUS)
P1=pd.DataFrame(dict(obs_id=['PZ%06d'%i for i in Z.oid],lake_id=Z.lake_id.values,depth_m=Z.depth_m.values,source='ZIP',src_file=SRC_ZIP,src_layer='Depth_points',src_oid=Z.oid.values,
  year=Z.year.values,contributor=Z.contributor.values,plan_source=None,note=Z.PASTABA.values,ground_h=Z.ZEMES_H.values,x_lks94=Z.geometry.x.values,y_lks94=Z.geometry.y.values,assignment=Z['assign'].values,
  attrs=[js({'PASTABA_GISC':a,'ZEMES_H':b}) for a,b in zip(Z.PASTABA_GISC,Z.ZEMES_H)]),)
P1['geometry']=Z.geometry.values
A=ap.copy()
P2=pd.DataFrame(dict(obs_id=['PA%06d'%i for i in A.OBJECTID],lake_id=A.lake_id.values,depth_m=A.Gylis.abs().values,source='ArcGIS',src_file=SRC_AG+'/0',src_layer='gylio_taskai',src_oid=A.OBJECTID.values,
  year=pd.to_numeric(A.Metai,errors='coerce').values,contributor=A.Braize.values,plan_source=A.Saltinis.values,note=A.Pastaba.values,ground_h=np.nan,x_lks94=A.geometry.x.values,y_lks94=A.geometry.y.values,assignment='pagal GRAKTAS/pavadinimą',
  attrs=[js({k:r[k] for k in ('GRAKTAS','Telkinys','VH_BAS77','VH_LAS07','VH_info','SAV_PAV','ST_PAV','Tikrino','Redaguota','Red_info','GlobalID')}) for _,r in A.iterrows()]))
P2['geometry']=A.geometry.values
pts=pd.concat([P1,P2],ignore_index=True)
pts['kx']=pts.x_lks94.round(0);pts['ky']=pts.y_lks94.round(0);pts['kd']=pts.depth_m.round(1)
pts['dupkey']=pts.lake_id.astype(str)+'|'+pts.kx.astype(str)+'|'+pts.ky.astype(str)+'|'+pts.kd.astype(str)
pts['also_in']=None;pts['superseded']=0
zk=pts[pts.source=='ZIP'].drop_duplicates('dupkey').set_index('dupkey').obs_id
agm=pts.source.eq('ArcGIS')&pts.dupkey.isin(zk.index)
pts.loc[agm,'superseded']=1;pts.loc[agm,'also_in']=pts.loc[agm,'dupkey'].map(zk)
ndup=int(agm.sum());print('ArcGIS taškų, kurie tiksliai dubliuoja ZIP tašką (≤1 m, ≤0.1 m gylis):',ndup)
# --- izolinijos
Cz=zc.copy();Cz['depth_m']=Cz.GYLIS.abs()
C1=pd.DataFrame(dict(obs_id=['CZ%06d'%i for i in Cz.oid],lake_id=Cz.lake_id.values,depth_m=Cz.depth_m.values,source='ZIP',src_file=SRC_ZIP,src_layer='Countours_L',src_oid=Cz.oid.values,
  year=Cz.lake_id.map(zl.METAI).values,contributor=Cz.lake_id.map(zl.KONTRIBUTORIUS).values,plan_source=None,note=Cz.PASTABA.values,kind=Cz.TIPAS.values,
  attrs=[js({'PAVADINIMAS':a,'GRUPE':b,'ISVISIBLE':c,'PASTABA_GISC':d}) for a,b,c,d in zip(Cz.PAVADINIMAS,Cz.GRUPE,Cz.ISVISIBLE,Cz.PASTABA_GISC)]));C1['geometry']=Cz.geometry.values
Ca=ac.copy()
C2=pd.DataFrame(dict(obs_id=['CA%06d'%i for i in Ca.OBJECTID],lake_id=Ca.lake_id.values,depth_m=Ca.Gylis.abs().values,source='ArcGIS',src_file=SRC_AG+'/1',src_layer='izolinijos',src_oid=Ca.OBJECTID.values,
  year=pd.to_numeric(Ca.Metai,errors='coerce').values,contributor=Ca.Braize.values,plan_source=Ca.Saltinis.values,note=Ca.Pastaba.values,kind=None,
  attrs=[js({k:r[k] for k in ('GRAKTAS','Telkinys','VH_BAS77','VH_LAS07','VH_info','SAV_PAV','ST_PAV','Tikrino','Redaguota','Red_info','GlobalID')}) for _,r in Ca.iterrows()]));C2['geometry']=Ca.geometry.values
con=pd.concat([C1,C2],ignore_index=True)
# --- ežerų palyginimas
rows=[]
ids=list(ZL.lake_id)+sorted({v['lake_id'] for v in amap.values() if v['lake_id'].startswith('A_')})
amap_by_lake={}
for (g,n),v in amap.items():amap_by_lake.setdefault(v['lake_id'],[]).append((g,n,v))
for lid in ids:
    z=lid in zl.index;ag=amap_by_lake.get(lid,[])
    pz=pts[(pts.lake_id==lid)&(pts.source=='ZIP')];pa=pts[(pts.lake_id==lid)&(pts.source=='ArcGIS')]
    cz=con[(con.lake_id==lid)&(con.source=='ZIP')];ca=con[(con.lake_id==lid)&(con.source=='ArcGIS')]
    md=lambda p,c:(max(list(p.depth_m.dropna())+list(c.depth_m.dropna())) if len(p) or len(c) else None)
    lev=lambda c:sorted(c.depth_m.dropna().unique())
    def step(c):
        l=lev(c);return float(np.median(np.diff(l))) if len(l)>2 else None
    r=dict(lake_id=lid,name=zl.PAVADINIMAS.get(lid) if z else ag[0][1],arcgis_name='; '.join(sorted({n for _,n,_ in ag})) or None,graktas='; '.join(sorted({g for g,_,_ in ag if g})) or None,
      in_zip=z,in_arcgis=bool(ag),match=('; '.join(sorted({v['how'] for _,_,v in ag})) if ag else None),
      area_ha=round(zl.SHAPE_Area.get(lid)/1e4,2) if z else None,year_zip=zl.METAI.get(lid) if z else None,contributor_zip=zl.KONTRIBUTORIUS.get(lid) if z else None,
      year_arcgis='; '.join(sorted({str(y) for y in pa.year.dropna().astype(int)}|{str(y) for y in ca.year.dropna().astype(int)})) or None,
      plan_source_arcgis='; '.join(sorted({s for s in list(pa.plan_source.dropna())[:1]+list(ca.plan_source.dropna())[:1]})) or None,
      pts_zip=len(pz),pts_arcgis=len(pa),lines_zip=len(cz),lines_arcgis=len(ca),
      maxdepth_zip=md(pz,cz),maxdepth_arcgis=md(pa,ca),levels_zip=len(lev(cz)),levels_arcgis=len(lev(ca)),step_zip_m=step(cz),step_arcgis_m=step(ca))
    sz=r['pts_zip']+r['lines_zip'];sa=r['pts_arcgis']+r['lines_arcgis']
    r['preferred_source']='ZIP' if sz>=sa and sz>0 else ('ArcGIS' if sa>0 else None)
    r['preferred_reason']=('vienintelis šaltinis' if (sz==0)!=(sa==0) else ('daugiau taškų+izolinijų' if sz!=sa else 'lygiai, naujesnis ZIP')) if (sz or sa) else 'gylio duomenų nėra'
    d=None
    if r['maxdepth_zip'] and r['maxdepth_arcgis']:d=round(r['maxdepth_zip']-r['maxdepth_arcgis'],2)
    r['maxdepth_diff_m']=d;r['depth_conflict']=bool(d is not None and abs(d)>max(1.0,0.2*max(r['maxdepth_zip'],r['maxdepth_arcgis'])))
    r['has_depth']=bool((r['maxdepth_zip'] or 0)>0 or (r['maxdepth_arcgis'] or 0)>0)
    rows.append(r)
cmp_=pd.DataFrame(rows)
pref=dict(zip(cmp_.lake_id,cmp_.preferred_source))
pts['is_preferred']=[(1 if pref.get(l)==s else 0) for l,s in zip(pts.lake_id,pts.source)]
con['is_preferred']=[(1 if pref.get(l)==s else 0) for l,s in zip(con.lake_id,con.source)]
pickle.dump(dict(pts=pts,con=con,cmp=cmp_,ZL=ZL,amap=amap),open('/tmp/master_stage2.pkl','wb'))
cmp_.to_csv(OUT+'lake_comparison.csv',index=False)
print(cmp_.shape,cmp_.in_zip.sum(),cmp_.in_arcgis.sum(),(cmp_.in_zip&cmp_.in_arcgis).sum(),'depth_conflict',cmp_.depth_conflict.sum(),'be gylio',(~cmp_.has_depth).sum())
