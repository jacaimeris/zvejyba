import warnings;warnings.filterwarnings('ignore')
import geopandas as gpd,pandas as pd,numpy as np,unicodedata,json,re
G='data/gdb_zip/x/Batimetrija.gdb';A='data/bathy/'
def key(s):
    s=unicodedata.normalize('NFKD',str(s or '').lower());s=''.join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r'\(.*?\)',' ',s);s=re.sub(r'\b(ezeras|ez|tv|tvenkinys|ezerelis|ezerai)\b',' ',s);return ' '.join(re.sub(r'[^a-z0-9]+',' ',s).split())
ZL=gpd.read_file(G,layer='Lakes');ZC=gpd.read_file(G,layer='Countours_L');ZP=gpd.read_file(G,layer='Depth_points')
AP=gpd.read_file(A+'gylio_taskai.geojson').to_crs(3346);AC=gpd.read_file(A+'izolinijos.geojson').to_crs(3346)
ZL['k']=ZL.PAVADINIMAS.map(key)
# priskirti ZIP taškus ir linijas ežerams erdviškai
ZP2=gpd.GeoDataFrame(ZP.drop(columns='geometry'),geometry=gpd.points_from_xy(ZP.geometry.x,ZP.geometry.y),crs=3346)
LL=ZL.reset_index().rename(columns={'index':'zl'})[['zl','PAVADINIMAS','geometry']]
j=gpd.sjoin(ZP2,LL,how='left',predicate='within').drop_duplicates(subset=ZP2.index.name or None) if False else gpd.sjoin(ZP2,LL,how='left',predicate='within')
j=j[~j.index.duplicated(keep='first')]
print('ZIP taškų:',len(ZP),'priskirta ežerui:',j.PAVADINIMAS.notna().sum(),'nepriskirta:',j.PAVADINIMAS.isna().sum())
ZPn=j.PAVADINIMAS
print('ZIP linijų su vardu:',ZC.PAVADINIMAS.notna().sum(),'be vardo:',ZC.PAVADINIMAS.isna().sum())
zk=set(ZL.k);ak={}
for df,name in ((AP,'p'),(AC,'c')):
    for n,g in df.groupby('Telkinys'):ak.setdefault(key(n),{'names':set(),'graktas':set()});ak[key(n)]['names'].add(n);ak[key(n)]['graktas'].update(map(str,g.GRAKTAS.unique()))
print('ArcGIS pavadinimų (key):',len(ak),'ZIP key:',len(zk))
both=sorted(zk&set(ak));print('abu šaltiniai:',len(both),'tik ZIP:',len(zk-set(ak)),'tik ArcGIS:',len(set(ak)-zk))
print('tik ArcGIS:',sorted(set(ak)-zk))
print('Viesai: ZIP',[k for k in zk if 'viesai' in k],'ArcGIS',[k for k in ak if 'viesai' in k])
