import json,math,collections,unicodedata,numpy as np
from scipy.spatial import cKDTree
D='data/bathy/'
fold=lambda s:' '.join(''.join(c for c in unicodedata.normalize('NFKD',(s or '').lower()) if not unicodedata.combining(c)).replace('(',' ').replace(')',' ').replace('.',' ').split())
def key(s):
    k=fold(s)
    for w in ('ezeras','ez','tv'):k=' '.join(x for x in k.split() if x!=w)
    return k
pts=json.load(open(D+'gylio_taskai.geojson'))['features'];con=json.load(open(D+'izolinijos.geojson'))['features']
lakes=collections.OrderedDict()
def L(p):
    k=(str(p['GRAKTAS']),p['Telkinys'] if p['Telkinys']!='ež.Šamukas' else 'ež. Šamukas')
    return lakes.setdefault(k,dict(id=k[0] if k[0]!='None' else 'x'+key(k[1]).replace(' ','_'),name=k[1],m=p['SAV_PAV'],pts=[],con=[],src=set(),yr=set()))
for f in pts:
    p=f['properties'];l=L(p);l['pts'].append(f['geometry']['coordinates']+[p['Gylis']])
    if p['Saltinis']:l['src'].add(p['Saltinis']);
    if p['Metai']:l['yr'].add(p['Metai'])
for f in con:
    p=f['properties'];l=L(p);l['con'].append((p['Gylis'],f['geometry']['coordinates'][0]))
    if p['Saltinis']:l['src'].add(p['Saltinis'])
    if p['Metai']:l['yr'].add(p['Metai'])
# merge duplicate ids (Šamukas variants, Ilgis has 2 ids -> separate by graktas already)
merged=collections.OrderedDict()
for l in lakes.values():
    m=merged.get(l['id'])
    if m:m['pts']+=l['pts'];m['con']+=l['con'];m['src']|=l['src'];m['yr']|=l['yr']
    else:merged[l['id']]=l
def dp(c,tol):
    if len(c)<3:return c
    a=np.array(c);keep=np.zeros(len(a),bool);keep[0]=keep[-1]=True;st=[(0,len(a)-1)]
    while st:
        i,j=st.pop()
        if j<=i+1:continue
        s,e=a[i],a[j];d=e-s;n=np.hypot(*d)
        seg=a[i+1:j]-s
        dist=np.hypot(*(seg.T))if n==0 else np.abs(d[0]*seg[:,1]-d[1]*seg[:,0])/n
        k=int(np.argmax(dist))
        if dist[k]>tol:keep[i+1+k]=True;st+=[(i,i+1+k),(i+1+k,j)]
    return a[keep].tolist()
def dens(c,step):
    out=[]
    for a,b in zip(c,c[1:]):
        n=max(1,int(math.hypot(*(np.array(b)-np.array(a)))//step))
        for t in range(n):out.append((a[0]+(b[0]-a[0])*t/n,a[1]+(b[1]-a[1])*t/n))
    out.append(tuple(c[-1]));return out
SP={'Lydeka':'Lydeka','Ešerys':'Ešerys','Starkis':'Starkis'}
app=[]
for l in merged.values():
    lat0=np.mean([c[1] for _,cc in l['con'] for c in cc]+[p[1] for p in l['pts']]);lon0=np.mean([c[0] for _,cc in l['con'] for c in cc]+[p[0] for p in l['pts']])
    kx=111320*math.cos(math.radians(lat0));ky=110540
    toM=lambda c:((c[0]-lon0)*kx,(c[1]-lat0)*ky)
    levels=sorted({d for d,_ in l['con']},reverse=True) # 0, -1, ...
    byl={}
    for d,cc in l['con']:
        m=[toM(c) for c in cc];byl.setdefault(d,[]).extend(dens(m,25))
    trees={d:cKDTree(np.array(v)) for d,v in byl.items()}
    shore=byl.get(0,[]);st=cKDTree(np.array(shore)) if shore else None
    cand=[]
    for i,d in enumerate(levels):
        if d>=0:continue
        vs=np.array(byl[d]);nb=[levels[j] for j in (i-1,i+1) if 0<=j<len(levels)]
        if not nb:continue
        best=np.zeros(len(vs))
        for e in nb:
            dist,_=trees[e].query(vs);dist=np.maximum(dist,8)
            best=np.maximum(best,abs(d-e)/dist)
        nbr=trees[d].query_ball_point(vs,75);best=np.array([best[j].mean() for j in nbr])
        dsh=st.query(vs)[0] if st else np.full(len(vs),9e9)
        for v,s,ds in zip(vs,best,dsh):cand.append((d,v[0],v[1],s,ds))
    spots=[]
    def pick(sp,lo,hi,need,fn,k):
        c=[x for x in cand if lo<=-x[0]<=hi and x[3]>=need]
        c.sort(key=lambda x:-fn(x));chosen=[]
        for x in c:
            if all(math.hypot(x[1]-y[1],x[2]-y[2])>=130 for y in chosen):chosen.append(x)
            if len(chosen)>=k:break
        for x in chosen:
            ang=math.degrees(math.atan(x[3]))
            spots.append(dict(sp=sp,lon=round(lon0+x[1]/kx,5),lat=round(lat0+x[2]/ky,5),d=abs(x[0]),slope=round(ang,1),shore=int(min(x[4],9999))))
    # pike: 1-4 m contour, steep, close to shore/shallow shelf
    pick('Lydeka',1,4,0.025,lambda x:x[3]*(1.5 if x[4]<120 else 1),5)
    pick('Ešerys',3,8,0.025,lambda x:x[3],5)
    pick('Starkis',4,12,0.025,lambda x:x[3]*min(-x[0],8),4)
    # deepest hole (winter)
    dp_=[p for p in l['pts']]+[(c[0],c[1],d) for d,cc in l['con'] for c in cc if d<0]
    holes=[]
    if dp_:
        z=min(dp_,key=lambda p:p[2]);holes.append(dict(sp='Žiema',lon=round(z[0],5),lat=round(z[1],5),d=abs(z[2]),slope=0,shore=0))
    spots+=holes
    # geometry out
    cont=[];tol=3.0
    for d,cc in l['con']:
        m=[toM(c) for c in cc];s=dp(m,tol)
        cont.append([d,[[round(lon0+x/kx,5),round(lat0+y/ky,5)] for x,y in s]])
    allc=[c for _,cc in cont for c in cc]+[p[:2] for p in l['pts']]
    xs=[c[0] for c in allc];ys=[c[1] for c in allc]
    dvals=[p[2] for p in l['pts'] if p[2] is not None]+[d for d,_ in l['con']]
    app.append(dict(id=l['id'],name=l['name'],k=key(l['name']),m=l['m'],bbox=[min(xs),min(ys),max(xs),max(ys)],maxd=abs(min(dvals)),np=len(l['pts']),nc=len(l['con']),
      yr=sorted(l['yr']),src=sorted(l['src']),pts=[[round(p[0],5),round(p[1],5),p[2]] for p in l['pts']],cont=cont,spots=spots))
json.dump(dict(v=1,src='LEU Geografijos ir turizmo katedra (M. Pileckas), ArcGIS FeatureServer Lietuvos_ezeru_batimetrija; WGS84',lakes=app),open('bathy.json','w'),ensure_ascii=False,separators=(',',':'))
import os;print(len(app),os.path.getsize('bathy.json')//1024,'KB')
print([(a['name'],len(a['spots'])) for a in app][:8])
