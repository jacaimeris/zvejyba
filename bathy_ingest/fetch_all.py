import sys,os,json;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from arcgis import *
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','cache')
GEO='https://www.geoportal.lt/mapproxy/gisc_batimetrija/MapServer';AG='https://services3.arcgis.com/G9UFYDnivWeZc6i4/ArcGIS/rest/services/Lietuvos_ezeru_batimetrija/FeatureServer'
for name,base,layers in (('geoportal',GEO,[5,0,3,2,4]),('arcgis_leu',AG,[0,1])):
    os.makedirs(f'{ROOT}/{name}',exist_ok=True);json.dump(service_info(base),open(f'{ROOT}/{name}/service.json','w'),ensure_ascii=False,indent=1)
    for i in layers:
        m=fetch_layer(base,i,f'{ROOT}/{name}');print(name,i,m['layer_name'],m['features_fetched'],'/',m['expected_ids'],m['complete'],flush=True)
