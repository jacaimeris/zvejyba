"""Trijų šaltinių suderinimas: ežerų atitikimas, dublikatai, palyginimas, parinkimas, validuotas kešas."""
import os,json,re,unicodedata,warnings,datetime;warnings.filterwarnings('ignore')
import geopandas as gpd,pandas as pd,numpy as np,shapely
from scipy.spatial import cKDTree
from sources import *
OUT=os.path.join(CACHE,'validated');os.makedirs(OUT,exist_ok=True)
TOL=dict(offset_m=25.0,depth_abs=1.0,depth_rel=0.15,mirror=0.90,snap=150.0,supp_dup_m=5.0)
AUTH={'zip':3,'geoportal':2,'arcgis_leu':1}  # lygių atveju pirmenybė (ZIP turi metus ir autorių)
import difflib
def name_ok(a,b):
    if not a or not b:return True
    return a==b or difflib.SequenceMatcher(None,a,b).ratio()>=0.7 or (len(a)>=4 and len(b)>=4 and a[:4]==b[:4])
def key(s):
    s=unicodedata.normalize('NFKD',str(s or '').lower());s=''.join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r'\(.*?\)',' ',s);s=re.sub(r'\b(ezeras|ez|tv|tvenkinys|ezerelis|ezerai|marios)\b',' ',s);return ' '.join(re.sub(r'[^a-z0-9]+',' ',s).split())
# ---------- 1) ežerų registras iš oficialių kontūrų (ZIP + Geoportal), vienodi pavadinimai skiriami geometrija
def registry(S):
    zl=S['zip']['lakes'].reset_index(drop=True);gl=S['geoportal']['lakes'].reset_index(drop=True)
    zl['uid']=['Z%04d'%i for i in range(len(zl))];zl['k']=zl.name.map(key);gl['k']=gl.name.map(key)
    # Geoportal poligonų sutapimas su ZIP poligonais (IoU) ir pavadinimu
    jj=gpd.sjoin(gl[['k','name','geometry']].reset_index().rename(columns={'index':'gi'}),zl[['uid','k','geometry']],how='left',predicate='intersects')
    best={}
    for r in jj.itertuples():
        if r.uid is None or r.uid!=r.uid:continue
        a=gl.geometry[r.gi];b=zl.geometry[zl.index[zl.uid==r.uid][0]]
        iou=a.intersection(b).area/max(a.union(b).area,1e-9)
        if iou>best.get(r.gi,(0,))[0]:best[r.gi]=(iou,r.uid)
    gl['zip_uid']=[best.get(i,(0,None))[1] if best.get(i,(0,))[0]>=0.5 else None for i in gl.index];gl['iou']=[best.get(i,(0,))[0] for i in gl.index]
    zl['geo_idx']=None
    for i,r in gl.iterrows():
        if r.zip_uid:zl.loc[zl.uid==r.zip_uid,'geo_idx']=i
    extra=gl[gl.zip_uid.isna()].copy();extra['uid']=['G%04d'%i for i in extra.index]
    lakes=pd.concat([zl[['uid','name','k','year','author','geometry']].assign(boundary_src='zip'),extra[['uid','name','k','geometry']].assign(boundary_src='geoportal')],ignore_index=True)
    lakes=gpd.GeoDataFrame(lakes,geometry='geometry',crs=3346);lakes['area_ha']=lakes.geometry.area/1e4
    lakes['geo_name']=lakes.uid.map(dict(zip(gl.zip_uid,gl.name)));lakes['geo_iou']=lakes.uid.map(dict(zip(gl.zip_uid,gl.iou)))
    lakes['dup_name']=lakes.name.duplicated(keep=False)
    return lakes
# ---------- 2) objektų priskyrimas ežerams (geometrija; pavadinimas tik kryžminiam patikrinimui)
def assign(lakes,gdf,kind,src):
    g=gdf.copy().reset_index(drop=True);L=lakes[['uid','k','geometry']]
    if kind=='pt':probe=gpd.GeoDataFrame(geometry=g.geometry,crs=3346)
    else:probe=gpd.GeoDataFrame(geometry=g.geometry.map(lambda m:m.interpolate(0.5,normalized=True) if m.geom_type=='LineString' else shapely.line_merge(m).interpolate(0.5,normalized=True) if shapely.line_merge(m).geom_type=='LineString' else m.representative_point()),crs=3346)
    Lb=L.copy();Lb['geometry']=Lb.geometry.buffer(0 if kind=='pt' else 25)
    j=gpd.sjoin(probe,Lb,how='left',predicate='within')
    area=lakes.set_index('uid').area_ha
    g['uid']=None;g['assign']='nepriskirtas'
    for idx,grp in j.groupby(level=0):
        c=grp.dropna(subset=['uid'])
        if c.empty:continue
        nm=key(g.at[idx,'name']) if g.at[idx,'name'] else None
        c0=c;c=c[[name_ok(nm,k) for k in c.k]];soft=False
        if c.empty:
            if src=='arcgis_leu':
                g.at[idx,'assign']='vardas nesutampa su geometrijos kandidatu (nepriskirta)';continue
            c=c0;soft=True  # ZIP/Geoportal: poligonai ir izolinijos iš to paties rinkinio, vardų variantai
        sel=c[c.k==nm] if nm and (c.k==nm).any() else c
        u=sel.uid.iloc[int(np.argmin([area[x] for x in sel.uid]))]
        g.at[idx,'uid']=u;g.at[idx,'assign']=('geometrija (vardo variantas skiriasi)' if soft else 'geometrija+vardas' if nm and (sel.k==nm).any() else ('geometrija' if len(c)==1 else 'geometrija (daug kandidatų, mažiausias poligonas)'))
    miss=g[g.uid.isna()&~g['assign'].str.startswith('vardas nesutampa')]
    if len(miss):
        pr=gpd.GeoDataFrame(geometry=probe.geometry[miss.index],crs=3346)
        nn=gpd.sjoin_nearest(pr,L[['uid','geometry']],how='left',max_distance=TOL['snap'],distance_col='d');nn=nn[~nn.index.duplicated()]
        ok=nn.uid.notna()
        if src=='arcgis_leu':ok=ok&pd.Series([name_ok(key(g.at[i,'name']) if g.at[i,'name'] else None,lakes.set_index('uid').k.get(u)) if u==u and u else False for i,u in zip(nn.index,nn.uid)],index=nn.index)
        for i in nn.index[ok]:g.at[i,'uid']=nn.at[i,'uid'];g.at[i,'assign']=f'artimiausias poligonas ≤{int(TOL["snap"])} m'
    g['name_check']=[None if (not n or not u) else (key(n)==lakes.set_index('uid').k.get(u)) for n,u in zip(g.name,g.uid)]
    return g
def load_all(refresh=False):
    S=dict(zip=load_zip(),geoportal=load_geoportal(),arcgis_leu=load_leu())
    return S

def _verts(C):
    xs=[];ys=[];ds=[]
    for g,d in zip(C.geometry,C.depth_m):
        if g is None or d!=d:continue
        for part in g.geoms:
            a=np.asarray(part.coords)[:,:2];xs.append(a[:,0]);ys.append(a[:,1]);ds.append(np.full(len(a),round(d,2)))
    if not xs:return np.empty((0,2)),np.empty(0)
    return np.column_stack([np.concatenate(xs),np.concatenate(ys)]),np.concatenate(ds)
def metrics(uid,src,P,C,area_ha,lake_year=None):
    P=P[P.depth_m.notna()];C=C[C.depth_m.notna()]
    lv=sorted(C.depth_m.round(2).unique());md=max([P.depth_m.max() if len(P) else 0,C.depth_m.max() if len(C) else 0])
    V,_=_verts(C[C.depth_m>0]);pp=np.asarray([[p.x,p.y] for p in P.geometry[P.depth_m>0]]) if len(P) else np.empty((0,2))
    allp=np.vstack([V,pp]) if len(V)+len(pp) else np.empty((0,2));cover=None
    if len(allp)>=3 and area_ha:
        try:cover=min(1.0,shapely.MultiPoint(allp).convex_hull.area/1e4/area_ha)
        except Exception:cover=None
    yr=pd.to_numeric(pd.concat([P.get('year',pd.Series(dtype=float)),C.get('year',pd.Series(dtype=float))]),errors='coerce')
    return dict(uid=uid,source=src,n_points=len(P),n_contour_lines=len(C),n_levels=len(lv),has_shoreline=bool((C.depth_m==0).any()),max_depth_m=float(md) if md else None,
      min_level_step_m=float(np.median(np.diff([l for l in lv if l>=0]))) if len(lv)>2 else None,pts_per_ha=(len(P)/area_ha if area_ha else None),hull_cover=cover,
      year=int(yr.max()) if yr.notna().any() else (int(lake_year) if lake_year==lake_year and lake_year else None),has_depth=bool((md or 0)>0 and (len(P[P.depth_m>0])>0 or (C.depth_m>0).any())))
def compare(A,B,tol=TOL):
    (PA,CA),(PB,CB)=A,B;out=dict(offset_m=None,common_levels=0,pt_pairs=0,pt_dd_median=None,pt_dd_p90=None,dup_pts_frac=None,dup_vtx_frac=None)
    # tiksliai sutampantys objektai (veidrodis)
    ka={(round(p.x,2),round(p.y,2),round(d,2)) for p,d in zip(PA.geometry,PA.depth_m) if d==d};kb={(round(p.x,2),round(p.y,2),round(d,2)) for p,d in zip(PB.geometry,PB.depth_m) if d==d}
    if ka and kb:out['dup_pts_frac']=len(ka&kb)/min(len(ka),len(kb))
    VA,dA=_verts(CA);VB,dB=_verts(CB)
    if len(VA) and len(VB):
        sa={(round(x,2),round(y,2),d) for (x,y),d in zip(VA,dA)};sb={(round(x,2),round(y,2),d) for (x,y),d in zip(VB,dB)}
        out['dup_vtx_frac']=len(sa&sb)/min(len(sa),len(sb))
        lv=sorted(set(dA)&set(dB));meds=[]
        for l in lv:
            a=VA[dA==l];b=VB[dB==l]
            if len(a)<2 or len(b)<2:continue
            meds.append(np.median(cKDTree(b).query(a)[0]));meds.append(np.median(cKDTree(a).query(b)[0]))
        out['common_levels']=len(lv)
        if meds:out['offset_m']=float(np.median(meds))
    pa=np.asarray([[p.x,p.y,d] for p,d in zip(PA.geometry,PA.depth_m) if d==d]);pb=np.asarray([[p.x,p.y,d] for p,d in zip(PB.geometry,PB.depth_m) if d==d])
    if len(pa) and len(pb):
        dd,ix=cKDTree(pb[:,:2]).query(pa[:,:2]);m=dd<=15
        if m.sum():
            diff=np.abs(pa[m,2]-pb[ix[m],2]);out['pt_pairs']=int(m.sum());out['pt_dd_median']=float(np.median(diff));out['pt_dd_p90']=float(np.percentile(diff,90))
    return out
def verdict(cmp_,mA,mB,tol=TOL):
    mir=max(cmp_['dup_pts_frac'] or 0,cmp_['dup_vtx_frac'] or 0)>=tol['mirror']
    md=abs((mA['max_depth_m'] or 0)-(mB['max_depth_m'] or 0));lim=max(tol['depth_abs'],tol['depth_rel']*max(mA['max_depth_m'] or 0,mB['max_depth_m'] or 0))
    off=cmp_['offset_m'];ok_off=(off is None) or off<=tol['offset_m'];ok_d=md<=lim
    if mir:return 'veidrodis (tie patys duomenys, ne nepriklausomas patvirtinimas)'
    if ok_off and ok_d:return 'suderinami'
    return 'KONFLIKTAS ('+('; '.join(x for x,b in (('erdvinis poslinkis %.0f m'%(off or 0),not ok_off),('max gylių skirtumas %.1f m'%md,not ok_d)) if b))+')'
def score(m):
    return (10 if m['has_shoreline'] else 0)+2*min(m['n_levels'],20)+min(m['n_points'],500)/10+20*(m['hull_cover'] or 0)+((m['year'] or 2000)-2000)/5
def run(S=None,only=None,log=print):
    S=S or load_all();lakes=registry(S)
    A={};
    for src,d in S.items():
        A[src]=dict(P=assign(lakes,d['points'],'pt',src),C=assign(lakes,d['contours'],'ln',src))
        log(src,'taškai',len(A[src]['P']),'priskirti',int(A[src]['P'].uid.notna().sum()),'| izolinijos',len(A[src]['C']),'priskirtos',int(A[src]['C'].uid.notna().sum()))
    # LEU objektai be poligono (upės ir kt.): atskiri įrašai
    extra=[]
    for kname in ('P','C'):
        g=A['arcgis_leu'][kname];m=g.uid.isna()
        for (gr,nm),grp in g[m].groupby([g[m].graktas.fillna(''),g[m].name.fillna('')]):
            u='A_'+(gr or key(nm).replace(' ','_'));g.loc[grp.index,'uid']=u;g.loc[grp.index,'assign']='ArcGIS: be poligono, pagal GRAKTAS/vardą'
            if u not in {e['uid'] for e in extra}:extra.append(dict(uid=u,name=nm,k=key(nm),year=None,author=None,boundary_src=None,geometry=None,area_ha=None,geo_name=None,geo_iou=None,dup_name=False,graktas=gr))
    lakes=pd.concat([lakes,gpd.GeoDataFrame(extra,geometry='geometry',crs=3346)],ignore_index=True) if extra else lakes
    gr=A['arcgis_leu']['P'].dropna(subset=['uid']).groupby('uid').graktas.agg(lambda s:'; '.join(sorted({x for x in s.dropna()})))
    gr2=A['arcgis_leu']['C'].dropna(subset=['uid']).groupby('uid').graktas.agg(lambda s:'; '.join(sorted({x for x in s.dropna()})))
    lakes['graktas']=lakes.uid.map(lambda u:'; '.join(sorted({*(gr.get(u,'').split('; ')),*(gr2.get(u,'').split('; '))}-{''})) or None)
    if only:
        ks=[key(o) for o in only];lakes=lakes[lakes.k.isin(ks)|lakes.uid.isin(only)].reset_index(drop=True)
    rows=[];comps=[];reg=[]
    sub=lambda g,u:g[g.uid==u]
    for lk in lakes.itertuples():
        ms={};data={}
        for s in A:
            P=sub(A[s]['P'],lk.uid);C=sub(A[s]['C'],lk.uid);data[s]=(P,C)
            if len(P) or len(C):ms[s]=metrics(lk.uid,s,P,C,lk.area_ha,(lk.year if s=='zip' else None));rows.append(ms[s])
        pair={}
        srcs=list(ms)
        for i in range(len(srcs)):
            for j in range(i+1,len(srcs)):
                a,b=srcs[i],srcs[j];c=compare(data[a],data[b]);v=verdict(c,ms[a],ms[b]);pair[(a,b)]=v
                comps.append(dict(uid=lk.uid,name=lk.name,a=a,b=b,**c,verdict=v))
        usable=[s for s in ms if ms[s]['has_depth']]
        rec=dict(uid=lk.uid,name=lk.name,graktas=lk.graktas,area_ha=lk.area_ha,boundary_src=lk.boundary_src,dup_name=bool(lk.dup_name),sources_present=','.join(srcs),sources_with_depth=','.join(usable))
        if not usable:
            rec.update(status='no_verified_bathymetry',confidence='none',selected_source=None,reason='nė viename šaltinyje nėra gylio duomenų (tik kranto linija arba nieko)' if srcs else 'nė viename šaltinyje duomenų nėra',supplementary_sources=None,independent_sources=0)
        else:
            best=max(usable,key=lambda s:(round(score(ms[s]),3),AUTH[s]));supp=[]
            pv=lambda a,b:pair.get((a,b)) or pair.get((b,a)) or ''
            groups=[{best}|{s for s in usable if pv(best,s).startswith('veidrodis')}]
            for s in sorted([x for x in usable if x not in groups[0]],key=lambda x:-AUTH[x]):
                if pv(best,s)!='suderinami':continue
                mir=[g for g in groups if any(pv(s,x).startswith('veidrodis') for x in g)]
                if mir:mir[0].add(s);continue
                groups.append({s});supp.append(s)
            indep=groups
            rec.update(status='bathymetry_available',selected_source=best,supplementary_sources=','.join(supp) or None,independent_sources=len(indep),
              confidence='cross_validated' if supp else 'single_source',reason=f"parinktas pagal išsamumą: balas {score(ms[best]):.1f}; "+'; '.join(f'{s}={score(ms[s]):.1f}' for s in usable if s!=best))
            rec['conflicts']='; '.join(f'{a}~{b}: {v}' for (a,b),v in pair.items() if v.startswith('KONFLIKTAS')) or None
            rec['mirrors']='; '.join(f'{a}~{b}' for (a,b),v in pair.items() if v.startswith('veidrodis')) or None
        for s,m in ms.items():
            for k,v in m.items():
                if k not in ('uid','source'):rec[f'{s}__{k}']=v
        reg.append(rec)
    return dict(lakes=lakes,A=A,metrics=pd.DataFrame(rows),comps=pd.DataFrame(comps),registry=pd.DataFrame(reg),S=S)

def export(R,path=None,log=print):
    import pyogrio
    path=path or os.path.join(OUT,'bathymetry_validated.gpkg')
    if os.path.exists(path):os.remove(path)
    reg=R['registry'];A=R['A'];S=R['S'];meta={s:S[s]['meta'] for s in S}
    sel=dict(zip(reg.uid,reg.selected_source));sup={u:(s.split(',') if isinstance(s,str) else []) for u,s in zip(reg.uid,reg.supplementary_sources)}
    pts=[];cons=[]
    for s in A:
        P=A[s]['P'];C=A[s]['C'];P=P[P.uid.notna()&P.depth_m.notna()];C=C[C.uid.notna()&C.depth_m.notna()]
        for tag,g,out in (('P',P,pts),('C',C,cons)):
            g=g.copy();g['role']=[('selected' if sel.get(u)==s else ('supplementary' if s in sup.get(u,[]) else None)) for u in g.uid]
            if tag=='C':g=g[g.role=='selected']
            else:g=g[g.role.notna()]
            out.append(g)
    P=pd.concat(pts,ignore_index=True) if pts else None;C=pd.concat(cons,ignore_index=True)
    # papildomų šaltinių taškai: be dublikatų su parinktuoju (≤5 m ir gylis ±0.1)
    keep=np.ones(len(P),bool)
    for u,grp in P.groupby('uid'):
        s0=grp[grp.role=='selected'];s1=grp[grp.role=='supplementary']
        if len(s1) and len(s0):
            a=np.asarray([[p.x,p.y] for p in s0.geometry]);d0=s0.depth_m.values;t=cKDTree(a)
            for i,(p,d) in zip(s1.index,zip(s1.geometry,s1.depth_m)):
                dd,ix=t.query([p.x,p.y])
                if dd<=TOL['supp_dup_m'] and abs(d0[ix]-d)<=0.1:keep[i]=False
    P=P[keep].reset_index(drop=True)
    def finish(g,pts=False):
        g=gpd.GeoDataFrame(g,geometry='geometry',crs=3346)
        for k,col in (('crs_original','crs'),('fetched_utc','fetched_utc'),('known_measurement_dates','measurement_dates')):g[k]=g.source.map(lambda s:meta[s].get(col))
        if pts:g['x_lks94']=g.geometry.x.round(3);g['y_lks94']=g.geometry.y.round(3)
        g=g.to_crs(4326)
        if pts:g['lon']=g.geometry.x.round(7);g['lat']=g.geometry.y.round(7)
        return g
    cols=['uid','role','source','src_layer','src_oid','depth_m','data_year','assign','name','attrs','geometry']
    yr={u:(reg.set_index('uid').at[u,f'{s}__year'] if isinstance(s,str) and f'{s}__year' in reg else None) for u,s in sel.items()}
    P['data_year']=P.uid.map(lambda u:None);C['data_year']=None
    for df in (P,C):df['data_year']=[(reg.set_index('uid').at[u,f'{s}__year'] if isinstance(s,str) and f'{s}__year' in reg.columns else None) for u,s in zip(df.uid,df.source)]
    Pg=finish(P[[c for c in cols+['year','plan_source','author'] if c in P.columns]],True);Cg=finish(C[[c for c in cols+['year','plan_source','author'] if c in C.columns]])
    L=R['lakes'].merge(reg.drop(columns=['name','graktas','area_ha','boundary_src','dup_name']),on='uid',how='left')
    L['area_ha']=R['lakes'].area_ha.values;Lg=gpd.GeoDataFrame(L,geometry='geometry',crs=3346).to_crs(4326)
    pyogrio.write_dataframe(Lg,path,layer='lakes',driver='GPKG');pyogrio.write_dataframe(Pg,path,layer='depth_points',driver='GPKG',append=True);pyogrio.write_dataframe(Cg,path,layer='depth_contours',driver='GPKG',append=True)
    for n,df in (('source_metrics',R['metrics']),('source_pairs',R['comps']),('sources',pd.DataFrame([{**v,'last_edit':json.dumps(v.get('last_edit'),default=str)} for v in meta.values()]))):
        if len(df):pyogrio.write_dataframe(df,path,layer=n,driver='GPKG',append=True)
    man=dict(generated_utc=datetime.datetime.utcnow().isoformat()+'Z',tolerances=TOL,lakes=len(reg),status=reg.status.value_counts().to_dict(),confidence=reg.confidence.value_counts().to_dict(),
      selected=reg.selected_source.value_counts().to_dict(),sources=meta,points_written=len(Pg),contours_written=len(Cg))
    json.dump(man,open(os.path.join(os.path.dirname(path),'validated_manifest.json'),'w'),ensure_ascii=False,indent=1,default=str)
    reg.to_csv(os.path.join(os.path.dirname(path),'lake_registry.csv'),index=False);log('įrašyta',path,man['status'])
    return man
