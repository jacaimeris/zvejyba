#!/usr/bin/env python3
"""bathy_ingest CLI.
  ingest [--all | --lake VARDAS ...] [--refresh]   surinkti iš kešo (arba iš API su --refresh), validuoti, įrašyti validuotą kešą
  lake VARDAS|UID                                   parodyti validuotą ežero įrašą iš lokalaus kešo (API nekviečiamas)
  missing                                           ežerai be patikrintos batimetrijos"""
import sys,os,json,argparse,sqlite3;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
GP=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','cache','validated','bathymetry_validated.gpkg')
def main():
    ap=argparse.ArgumentParser();sp=ap.add_subparsers(dest='c')
    i=sp.add_parser('ingest');i.add_argument('--all',action='store_true');i.add_argument('--lake',nargs='*');i.add_argument('--refresh',action='store_true')
    l=sp.add_parser('lake');l.add_argument('q',nargs='+');sp.add_parser('missing')
    a=ap.parse_args()
    if a.c=='ingest':
        if a.refresh:
            import fetch_all  # noqa  (pakartotinai kviečia API ir perrašo kešą)
        import pipeline as p
        only=None if a.all or not a.lake else a.lake
        R=p.run(only=only);p.export(R,None if not only else os.path.join(p.OUT,'bathymetry_validated_subset.gpkg'))
    elif a.c=='lake':
        import unicodedata,re
        k=lambda x:' '.join(re.sub(r'[^a-z0-9]+',' ',''.join(c for c in unicodedata.normalize('NFKD',x.lower()) if not unicodedata.combining(c))).split())
        q=' '.join(a.q);c=sqlite3.connect(GP);c.row_factory=sqlite3.Row
        rows=c.execute("select * from lakes where uid=? or lower(name) like ? or graktas like ?",(q,'%'+q.lower()+'%','%'+q+'%')).fetchall()
        if not rows:
            import pipeline as p;rows=[r for r in c.execute('select * from lakes') if k(q) in p.key(r['name'])]
        if not rows:sys.exit('Nerasta jokiame šaltinyje. Gylių nėra, nieko negalima išgalvoti.')
        for r in rows:
            d=dict(r);d.pop('geom',None)
            print(json.dumps({k:v for k,v in d.items() if v is not None and not k.endswith('__has_depth')},ensure_ascii=False,indent=1,default=str))
            for t in ('depth_points','depth_contours'):
                print(t,c.execute(f"select role,source,count(*) from {t} where uid=? group by 1,2",(r['uid'],)).fetchall())
    elif a.c=='missing':
        c=sqlite3.connect(GP)
        for r in c.execute("select uid,name,sources_present,reason from lakes where status='no_verified_bathymetry' order by name"):print(*r,sep=' | ')
    else:ap.print_help()
if __name__=='__main__':main()
