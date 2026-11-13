import re,sys
O=open('app_old.js',encoding='utf-8').read().split('\n')
def L(a,b): return '\n'.join(O[a-1:b])+'\n'
def rd(f): return open(f,encoding='utf-8').read()+'\n'
core=L(38,57)+L(59,81)
core=core.replace("db.collection(c).onSnapshot(s=>{S[c]=rows(s);renderLive()},()=>{})","db.collection(c).onSnapshot(s=>{setColl(c,rows(s));renderLive()},()=>{})")
core=core.replace("else{const i=S[c].findIndex(x=>x.id===clean.id);if(i>=0)S[c][i]=clean;else S[c].push(clean);renderLive()}","else{const a=rawColl(c);const i=a.findIndex(x=>x.id===clean.id);if(i>=0)a[i]=clean;else a.push(clean);setColl(c,a);renderLive()}")
core=core.replace("else{S[c]=S[c].filter(x=>x.id!==id);renderLive()}","else{setColl(c,rawColl(c).filter(x=>x.id!==id));renderLive()}")
core=core.replace("async function initDb(){","function rawColl(c){return c==='trips'?[...S.trips,...(S.activeTrip?[S.activeTrip]:[])]:[...S[c]]}\nfunction setColl(c,list){if(c==='trips'){S.activeTrip=list.find(t=>t.active)||null;S.trips=list.filter(t=>!t.active)}else S[c]=list}\nasync function initDb(){",1)
core=core.replace("o.id=o.id||uid();","o.id=o.id||uid();if(OWNED.includes(c)&&!o.owner)o.owner=S.who||'Arnas';",1)
app=L(1,33)+rd('p_state.js')+core+rd('p_views.js')+rd('p_today.js')+rd('p_visual.js')+rd('p_stats.js')+rd('p_brief.js')+L(226,263)+rd('p_modals.js')+rd('p_trip2.js')+rd('p_hub2.js')+rd('p_bathy.js')+rd('p_events.js')
open('app.js','w',encoding='utf-8').write(app)
html=rd('head.html')+'<script>\n'+rd('data.js')+rd('kb.js')+rd('logic.js')+rd('art.js')+rd('imgs.js')+app+'</script></body></html>\n'
open('index.html','w',encoding='utf-8').write(html)
