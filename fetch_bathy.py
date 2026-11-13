import json,urllib.request,urllib.parse,sys
B="https://services3.arcgis.com/G9UFYDnivWeZc6i4/ArcGIS/rest/services/Lietuvos_ezeru_batimetrija/FeatureServer"
def get(layer,srs,off):
    q=urllib.parse.urlencode(dict(where="1=1",outFields="*",outSR=srs,f="json",resultOffset=off,resultRecordCount=1000,orderByFields="OBJECTID"))
    return json.load(urllib.request.urlopen(f"{B}/{layer}/query?{q}",timeout=120))
for layer in (0,1):
    for srs in (3346,4326):
        feats=[];off=0
        while True:
            r=get(layer,srs,off);fs=r.get('features',[]);feats+=fs
            if not fs or not r.get('exceededTransferLimit'):break
            off+=len(fs)
        json.dump(dict(spatialReference=r.get('spatialReference'),features=feats),open(f"raw_layer{layer}_{srs}.json","w"),ensure_ascii=False)
        print(layer,srs,len(feats),r.get('spatialReference'))
