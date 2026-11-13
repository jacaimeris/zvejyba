"""ArcGIS REST klientas: nuskaito sluoksnį per OBJECTID partijas, kešuoja žalią atsakymą su kontroline suma."""
import json,hashlib,os,time,urllib.request,urllib.parse,datetime
def _get(url,params=None,post=False,retries=4):
    data=urllib.parse.urlencode(params or {}).encode() if params is not None else None
    for i in range(retries):
        try:
            req=urllib.request.Request(url+('' if post or not params else '?'+urllib.parse.urlencode(params)),data=data if post else None,headers={'User-Agent':'curl/8.5.0','Accept':'*/*'})
            with urllib.request.urlopen(req,timeout=120) as r:return json.load(r)
        except Exception as e:
            err=e;time.sleep(2*(i+1))
    raise RuntimeError(f'{url}: {err}')
def service_info(base):return _get(base,{'f':'json'})
def layer_info(base,i):return _get(f'{base}/{i}',{'f':'json'})
def fetch_layer(base,i,cache_dir,batch=500,out_sr=3346,force=False):
    """Grąžina kešo katalogą; jei jau yra manifest.json ir nevertinama force, API nekviečiamas."""
    d=os.path.join(cache_dir,f'layer{i}');man=os.path.join(d,'manifest.json')
    if os.path.exists(man) and not force:return json.load(open(man))
    os.makedirs(d,exist_ok=True)
    info=layer_info(base,i);ids=_get(f'{base}/{i}/query',{'where':'1=1','returnIdsOnly':'true','f':'json'}).get('objectIds') or []
    ids=sorted(ids);files=[];total=0
    for n in range(0,len(ids),batch):
        chunk=ids[n:n+batch]
        r=_get(f'{base}/{i}/query',{'objectIds':','.join(map(str,chunk)),'outFields':'*','returnGeometry':'true','outSR':out_sr,'f':'json'},post=True)
        if 'error' in r:raise RuntimeError(r['error'])
        fn=f'page_{n//batch:04d}.json';raw=json.dumps(r,ensure_ascii=False).encode();open(os.path.join(d,fn),'wb').write(raw)
        files.append(dict(file=fn,n=len(r.get('features',[])),sha256=hashlib.sha256(raw).hexdigest()));total+=len(r.get('features',[]))
    man_=dict(source_url=f'{base}/{i}',layer_name=info.get('name'),geometry_type=info.get('geometryType'),fetched_utc=datetime.datetime.utcnow().isoformat()+'Z',
      crs_requested=out_sr,crs_native=(info.get('extent') or {}).get('spatialReference'),expected_ids=len(ids),features_fetched=total,complete=total==len(ids),
      copyright=info.get('copyrightText'),description=info.get('description'),last_edit=(info.get('editingInfo') or {}),fields=[f['name'] for f in info.get('fields',[])],pages=files)
    json.dump(man_,open(man,'w'),ensure_ascii=False,indent=1);return man_
