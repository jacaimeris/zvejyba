/* ---------- Batimetrija: LEU / ArcGIS "Lietuvos ežerų batimetrija" (bathy.json), ežerų skiltis, vietos brifui ---------- */
const BATHY={lakes:null,err:'',loading:false};
async function loadBathy(){
  if(BATHY.lakes||BATHY.loading)return;BATHY.loading=true;
  try{const r=await fetch('bathy.json');if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();BATHY.lakes=j.lakes||[];BATHY.src=j.src||''}
  catch(e){BATHY.err=String(e.message||e)}
  BATHY.loading=false;if(S.tab==='more'&&S.more==='lakes'||S.tab==='trip')renderMain()}
const bkey=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/\b(ezeras|ez|tv|ezerelis)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
function bathyFor(w){if(!BATHY.lakes||!w)return null;const k=bkey(w.name);if(!k)return null;
  return BATHY.lakes.find(l=>l.k===k)||BATHY.lakes.find(l=>l.k&&(k.startsWith(l.k+' ')||l.k.startsWith(k+' ')))||null}
const SPCOL={'Lydeka':'#c0392b','Ešerys':'#e08a00','Starkis':'#2e8b57','Žiema':'#34495e'};
function spotsFor(lk,p){if(!lk)return [];
  const want=new Set((p&&p.species||[]).filter(x=>SPCOL[x]));const ice=p&&/žiemin/i.test(p.type||'');
  let s=lk.spots.filter(x=>x.sp==='Žiema'?ice:(!want.size||want.has(x.sp)));
  s=s.filter((x,i,a)=>a.findIndex(y=>y.sp===x.sp&&Math.abs(y.lon-x.lon)<1e-5&&Math.abs(y.lat-x.lat)<1e-5)===i);
  return s.map((x,i)=>({...x,n:i+1}))}
const spotWhy=s=>s.sp==='Žiema'?`giliausia žinoma vieta (${fmt1(s.d)} m)`
  :s.sp==='Lydeka'?`gylio kritimas ties ${fmt1(s.d)} m izobata, krantas ${s.shore} m: pasalos vieta tarp seklumos ir gilesnio vandens`
  :s.sp==='Ešerys'?`${fmt1(s.d)} m kraštas su kritimu (~${s.slope}°): ešerių sekimo juosta prie nuolydžio`
  :`${fmt1(s.d)} m kritimo kraštas (~${s.slope}°): starkio/gilesnė briauna`;
function bathyMapSVG(lk,spots,opt={}){
  const [x0,y0,x1,y1]=lk.bbox,c=Math.cos((y0+y1)/2*Math.PI/180),W=640,pad=14;
  const sx=(W-2*pad)/((x1-x0)*c||1e-6),sy=sx;const H=Math.round(((y1-y0)*sy)+2*pad);
  const X=lon=>(pad+(lon-x0)*c*sx).toFixed(1),Y=lat=>(pad+(y1-lat)*sy).toFixed(1);
  const md=lk.maxd||1;
  const col=d=>{const t=Math.min(1,Math.abs(d)/md);return `hsl(${200-8*t} ${55+15*t}% ${74-48*t}%)`};
  const cons=[...lk.cont].sort((a,b)=>a[0]-b[0]); // giliausios pirma
  const paths=cons.map(([d,c])=>{const pd='M'+c.map(p=>X(p[0])+' '+Y(p[1])).join('L');
    return `<path d="${pd}" fill="none" stroke="${d===0?'#1b4f72':col(d)}" stroke-width="${d===0?1.8:1}" stroke-linejoin="round"><title>${fmt1(Math.abs(d))} m</title></path>`}).join('');
  const dots=lk.pts.length<=140?lk.pts.map(p=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="1.8" fill="#16425b" opacity=".55"><title>${p[2]==null?'':fmt1(Math.abs(p[2]))+' m'}</title></circle>`).join(''):'';
  const mk=(spots||[]).map(s=>`<g><circle cx="${X(s.lon)}" cy="${Y(s.lat)}" r="9" fill="${SPCOL[s.sp]}" stroke="#fff" stroke-width="2"/><text x="${X(s.lon)}" y="${(+Y(s.lat)+3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${s.n}</text></g>`).join('');
  const my=(opt.mine||[]).map(p=>`<path d="M${X(p.lon)} ${(+Y(p.lat)-7).toFixed(1)}l5 7-5 7-5-7z" fill="#111" stroke="#fff" stroke-width="1.2"><title>${esc(p.t||'laimikis')}</title></path>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(lk.name)} gylių žemėlapis" style="width:100%;height:auto;background:#eef6fa;border-radius:10px;display:block">${paths}${dots}${my}${mk}<g font-size="11" fill="#16425b"><text x="${W-pad}" y="${H-pad+4}" text-anchor="end">šiaurė ↑ · tamsiau = giliau · max ${fmt1(md)} m</text></g></svg>`}
function mineOn(w,lk){ // jo paties laimikiai su GPS (iš nuotraukų EXIF)
  const out=[];S.trips.forEach(t=>{if(w&&(t.waterId===w.id||bkey(t.waterName)===bkey(w.name)))(t.catches||[]).forEach(c=>{if(c.lat&&c.lon)out.push({lat:+c.lat,lon:+c.lon,t:`${t.date} ${c.species||''}`})})});return out}
function bathyHTML(b){
  if(!b||!b.water)return '';
  if(!BATHY.lakes){loadBathy();return ''}
  const lk=bathyFor(b.water);
  if(!lk)return `<div class="panel"><h3>Gylių žemėlapis</h3><div class="small muted">Šio telkinio (${esc(b.water.name)}) nėra LEU batimetrijos duomenyse, todėl vietų pagal reljefą nesiūlau ir jų neišgalvoju. Jei turi echolotą ar gylių planą, atsiųsk nuotrauką ir pridėsiu.</div></div>`;
  const sp=spotsFor(lk,b.p);
  return `<div class="panel"><h3>Gylių žemėlapis ir vietos</h3>${bathyMapSVG(lk,sp,{mine:mineOn(b.water,lk)})}
  <div class="list" style="margin-top:10px">${sp.map(s=>`<div class="pick" style="display:flex;gap:10px;align-items:flex-start"><span class="badge" style="background:${SPCOL[s.sp]};color:#fff">${s.n}</span><div class="small"><b>${esc(s.sp)}</b> · ${esc(spotWhy(s))}<div class="muted">${s.lat}, ${s.lon}</div></div></div>`).join('')||'<div class="muted small">Pagal pasirinktas rūšis vietų nėra.</div>'}</div>
  <div class="small muted" style="margin-top:8px">Vietos išvestos iš izobatų (gylio kritimas, atstumas iki kranto), tai hipotezė, ne įrodymas, kad ten laikosi žuvis. Planas ${esc((lk.yr||[]).join(', ')||'?')} m., dažnai senas ir netikslus, patikrink echolotu.</div></div>`}
function bathyText(w,p){
  if(!BATHY.lakes)return '(batimetrija dar neužkrauta)';
  const lk=bathyFor(w);if(!lk)return '(šio telkinio batimetrijos nėra, vietų pagal reljefą nesiūlyk ir neišgalvok)';
  const sp=spotsFor(lk,p);
  return `Max gylis plane ${fmt1(lk.maxd)} m, planas ${(lk.yr||[]).join(',')}, tikslumas priklauso nuo seno plano. VIETOS (numeruotos, tik iš reljefo, ne iš pagavimų): ${sp.map(s=>`V${s.n} ${s.sp} ${fmt1(s.d)} m, ${s.lat},${s.lon}, ${spotWhy(s)}`).join(' | ')||'nėra'}. Vėjo planą (windPlan) susiek su šiomis vietomis numeriais (V1...), nurodyk, kuri pavėjinė/privėjinė, ir pažymėk, kad vietos yra hipotezė.`}

/* ---------- Ežerai: paieška, žemėlapis, visa informacija apie telkinį ---------- */
S.lake=S.lake||'';S.lq=S.lq||'';
VIEWS.lakes=function(){
  if(!BATHY.lakes&&!BATHY.err)loadBathy();
  if(S.lake)return lakePage(S.lake);
  const q=bkey(S.lq);
  const mine=S.waters.map(w=>({w,lk:bathyFor(w)}));
  const rest=(BATHY.lakes||[]).filter(l=>!mine.some(m=>m.lk===l));
  const ok=n=>!q||bkey(n).includes(q);
  const mineF=mine.filter(m=>ok(m.w.name)),restF=rest.filter(l=>ok(l.name));
  const row=(id,name,sub,badge)=>`<button class="item" data-act="lakeOpen" data-v="${esc(id)}"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>${esc(name)}</b><span class="badge">${badge}</span></div><div class="muted small">${sub}</div></div></button>`;
  return `<div class="hero"><div class="eyebrow">Daugiau</div><h1>Ežerai</h1></div>
  <input id="lq" placeholder="Ieškoti ežero…" value="${esc(S.lq)}" autocomplete="off" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface)">
  ${BATHY.err?`<div class="banner">Batimetrijos failas neužsikrovė: ${esc(BATHY.err)}</div>`:''}
  ${mineF.length?`<div class="sect">Tavo vandenys</div><div class="list">${mineF.map(m=>row('w:'+m.w.id,m.w.name,m.lk?`gylių duomenys yra, max ${fmt1(m.lk.maxd)} m`:'LEU gylių duomenų nėra',m.lk?'žemėlapis':'be gylių')).join('')}</div>`:''}
  <div class="sect">Visi ežerai su batimetrija (${rest.length}${q?'':''})</div>
  <div class="list" id="lakeList">${restF.map(l=>row('b:'+l.id,l.name,esc(l.m||'')+` · max ${fmt1(l.maxd)} m`,l.np+' t. / '+l.nc+' iz.')).join('')||(q?`<div class="muted small panel">Šiame šaltinyje tokio telkinio nėra. Nieko negalima išgalvoti: jei turi echolotą ar planą, pridėk.</div>`:'')}</div>
  <div class="small muted">Šaltinis: LEU Geografijos ir turizmo katedra (M. Pileckas), ArcGIS FeatureServer „Lietuvos ežerų batimetrija“, duomenys 2010-2016 m., atnaujinami kartą per metus. Šaltinio licencijos sąlygų nėra nurodyta: naudok asmeniniam planavimui, platinant klausk autorių.</div>`};
function lakePage(id){
  const isW=id.startsWith('w:'),rid=id.slice(2);
  const w=isW?S.waters.find(x=>x.id===rid):null;
  const lk=isW?bathyFor(w):(BATHY.lakes||[]).find(l=>l.id===rid);
  const wat=w||S.waters.find(x=>lk&&bathyFor(x)===lk)||null;
  const name=w?w.name:(lk?lk.name:'?');
  const trips=S.trips.filter(t=>wat&&(t.waterId===wat.id||bkey(t.waterName)===bkey(wat.name))).sort((a,b)=>b.date.localeCompare(a.date));
  const fish=trips.reduce((a,t)=>a+(t.catches||[]).length,0);
  const sp=lk?spotsFor(lk,{species:['Lydeka','Ešerys','Starkis'],type:'Žiemos žūklė'}):[];
  const pseudoB=wat?{water:wat,p:{date:today(),species:[]}}:null;
  return `<button class="btn sm" data-act="lakeBack">← Ežerai</button>
  <div class="hero"><div class="eyebrow">${esc((wat&&wat.region)||(lk&&lk.m)||'')}</div><h1>${esc(name)}</h1></div>
  ${lk?`<div class="panel">${bathyMapSVG(lk,sp,{mine:mineOn(wat,lk)})}
    <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${['Lydeka','Ešerys','Starkis','Žiema'].map(k=>`<span class="pill" style="background:${SPCOL[k]};color:#fff">${k}</span>`).join('')}<span class="pill">◆ tavo laimikiai</span></div>
    <div class="grid3" style="margin-top:10px">${[['max gylis',fmt1(lk.maxd)+' m'],['gylio taškų',lk.np],['izobatų',lk.nc]].map(([k,v])=>`<div class="pick" style="text-align:center"><b style="font-size:20px">${v}</b><div class="small muted">${k}</div></div>`).join('')}</div>
    <div class="small muted" style="margin-top:8px">Planas ${esc((lk.yr||[]).join(', ')||'?')} m. Šaltinis: ${esc((lk.src||[]).join('; ')||'?')}. Plano tikslumas priklauso nuo seno šaltinio, daug planų seni ir abejotini.</div></div>
    <div class="panel"><h3>Galimos vietos pagal reljefą</h3><div class="small muted" style="margin:4px 0 8px">Hipotezė iš izobatų, ne įrodymas. Tikrink echolotu. Brife rodomos tik pasirinktai žuviai.</div>
    ${sp.map(s=>`<div class="pick" style="display:flex;gap:10px;align-items:flex-start"><span class="badge" style="background:${SPCOL[s.sp]};color:#fff">${s.n}</span><div class="small"><b>${esc(s.sp)}</b> · ${esc(spotWhy(s))}<div class="muted">${s.lat}, ${s.lon}</div></div></div>`).join('')||'<div class="muted small">Vietų išvesti nepavyko.</div>'}</div>`
   :`<div class="panel"><h3>Gylių žemėlapis</h3><div class="small muted">${BATHY.lakes?`LEU batimetrijos duomenyse šio telkinio nėra, todėl gylių nerodau ir neišgalvoju. Kas liko: ${esc((wat&&wat.maxDepth)?'didž. gylis pagal tavo įrašą '+wat.maxDepth+' m':'gylio duomenų nėra')}. Jei turi echolotą ar gylių plano nuotrauką, atsiųsk.`:'Kraunasi…'}</div></div>`}
  <div class="panel"><h3>Tavo žvejybos čia</h3>${trips.length?`<div class="small muted" style="margin:4px 0 8px">${trips.length} žvejybų, ${fish} žuvų.</div><div class="list">${trips.slice(0,8).map(t=>`<button class="item" data-act="editTrip" data-v="${t.id}"><div class="grow"><b>${esc(t.date)}</b> <span class="muted small">${(t.catches||[]).length} žuvų · ${esc(t.type||'')}</span>${t.debrief&&t.debrief.ai&&t.debrief.ai.summary?`<div class="small">${esc(t.debrief.ai.summary)}</div>`:''}</div></button>`).join('')}</div>`:'<div class="muted small">Dar nėra įrašų šiame vandenyje.</div>'}</div>
  ${wat?dosHTML(pseudoB)||'':''}
  ${wat?`<div class="panel list"><div class="small"><b>Teisinė informacija:</b> ${esc((wat.legal&&Object.values(wat.legal).filter(Boolean).join('; '))||'nenurodyta, tikrink ALIS')}</div><button class="btn hot big" data-act="lakeBrief" data-v="${wat.id}">Sudaryti brifą šiam ežerui</button></div>`
     :`<div class="panel list"><button class="btn hot big" data-act="lakeAdd" data-v="${esc(lk?lk.id:'')}">Pridėti į mano vandenis ir sudaryti brifą</button></div>`}`}
async function lakeAdd(b,id){const lk=(BATHY.lakes||[]).find(l=>l.id===id);if(!lk)return;b.disabled=true;
  const [x0,y0,x1,y1]=lk.bbox;const r=await save('waters',{name:lk.name,kind:'Ežeras',region:lk.m||'',maxDepth:String(Math.round(lk.maxd*10)/10),coords:((y0+y1)/2).toFixed(5)+', '+((x0+x1)/2).toFixed(5),notes:'Pridėta iš LEU batimetrijos sąrašo. Teisinį statusą patikrink ALIS.',legal:{}});
  if(r)lakeBrief(r.id)}
function lakeBrief(wid){S.plan.waterId=wid;S.brief=null;S.planOpen=true;S.tab='trip';S.more='';S.lake='';renderAll();window.scrollTo(0,0)}
document.addEventListener('input',e=>{if(e.target.id==='lq'){S.lq=e.target.value;const p=e.target.selectionStart;renderMain();const el=$('#lq');if(el){el.focus();try{el.setSelectionRange(p,p)}catch(_){}}}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='more')S.lake='';
  if(a==='lakeOpen'){S.lake=v;renderMain();window.scrollTo(0,0)}
  else if(a==='lakeBack'){S.lake='';renderMain()}
  else if(a==='lakeBrief')lakeBrief(v);
  else if(a==='lakeAdd')lakeAdd(b,v)},true);
/* Daugiau: papildoma eilutė "Ežerai" */
const _moreV=VIEWS.more;
VIEWS.more=function(){const h=_moreV();if(S.more)return h;
  const row=`<button class="item more" data-act="more" data-v="lakes"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>Ežerai</b><span class="muted small">${BATHY.lakes?BATHY.lakes.length+' su gyliais':''}</span></div><div class="muted small">Paieška, gylių žemėlapis, vietos žuviai, tavo žvejybos</div></div></button>`;
  return h.replace('<div class="list"><button class="item more"','<div class="list">'+row+'<button class="item more"')};
loadBathy();
