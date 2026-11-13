/* ---------- naujos pagrindinės kortelės ---------- */
const fmtDay=ds=>{try{const d=new Date(ds+'T12:00:00');return d.toLocaleDateString('lt-LT',{weekday:'long'})+', '+d.toLocaleDateString('lt-LT',{month:'long'})+' '+d.getDate()+' d.'}catch(e){return ds}};
const TYPESHORT={'Spiningas iš kranto':'Iš kranto','Spiningas iš valties':'Iš valties','Trolingas':'Trolingas','Žieminė žvejyba':'Žiema'};
const optHTML=(arr,v)=>arr.map(x=>`<option${x===v?' selected':''}>${esc(x)}</option>`).join('');
const sortedWaters=()=>S.waters.slice().sort((a,b)=>a.name.localeCompare(b.name));
const waterSelect=()=>`<label class="f big">Kur žvejosi<select data-p="waterId"><option value="">Pasirink vandenį</option>${sortedWaters().map(x=>`<option value="${x.id}"${x.id===S.plan.waterId?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`;
const typeChips=()=>`<div class="chips">${TRIPTYPES.map(x=>`<button class="chip" data-act="ptype" data-v="${x}" aria-pressed="${S.plan.type===x}">${TYPESHORT[x]||x}</button>`).join('')}</div>`;
function noWatersHTML(){return `<div class="panel"><h3>Pradėk nuo vandens</h3><p class="muted" style="margin:6px 0 12px">Brifo taisyklės priklauso nuo telkinio statuso, todėl pirmiausia įkelk bent vieną vandenį.</p>
  <div class="list"><button class="btn primary big" data-act="kbImport" data-v="Viesai">Pridėti Viesus (Trakų r.)</button><button class="btn big" data-act="newWater">Pridėti kitą vandenį</button></div></div>`}

VIEWS.today=function(){
  const p=S.plan;const open=!S.brief||S.planOpen;
  const head=`<div class="hero"><div class="eyebrow">${esc(fmtDay(p.date))}</div><h1>Šiandien</h1>${wavesSVG()}</div>`;
  if(!S.waters.length&&open)return head+quickBox()+noWatersHTML();
  if(!open){const b=S.brief;
    return head+`<div class="summary"><div class="mini">${(b.p.species||[]).slice(0,3).map(n=>idOfName(n)?fishSVG(idOfName(n),'mini'):'').join('')}</div><div class="grow"><b>${esc(b.water?b.water.name:'')}</b><div class="muted small">${esc(b.p.type)} · ${esc(b.p.date)}</div></div><button class="btn sm" data-act="planOpen">Keisti</button></div>`+briefHTML(b)}
  return head+quickBox()+`<div class="panel list">
    ${waterSelect()}${typeChips()}
    <div><div class="sect" style="margin-bottom:8px">Ko ieškai</div><div class="ftiles">${Object.entries(FISH_NAME).map(([id,n])=>`<button class="ftile" data-act="tgt" data-v="${n}" aria-pressed="${p.species.includes(n)}" ${fishWater(id)}>${fishSVG(id)}<span>${n}</span></button>`).join('')}</div></div>
    <details class="fold"><summary>Sąlygos <span class="muted small">neprivaloma</span></summary><div class="list" style="margin-top:10px">
     <div class="grid3"><label class="f">Data<input type="date" data-p="date" value="${esc(p.date)}"></label>
      <label class="f">Pradžia<input type="time" data-p="time" value="${esc(p.time)}"></label>
      <label class="f">Pabaiga<input type="time" data-p="end" value="${esc(p.end)}"></label></div>
     <div class="small muted">Prognozės puslapis pats nepasiima, įvesk skaičius.</div>
     <div class="grid2"><label class="f">Oras °C<input inputmode="decimal" data-p="temp" value="${esc(p.temp)}"></label>
      <label class="f">Vėjas m/s<input inputmode="decimal" data-p="wind" value="${esc(p.wind)}"></label>
      <label class="f">Vėjo kryptis<select data-p="dir">${optHTML(DIRS,p.dir)}</select></label>
      <label class="f">Dangus<select data-p="sky">${optHTML(SKY,p.sky)}</select></label>
      <label class="f">Vandens temp. °C<input inputmode="decimal" data-p="wtemp" value="${esc(p.wtemp)}"></label>
      <label class="f">Žvejota paskutines 2 d.<select data-p="recent">${['','daug','mažai','nežinau'].map(x=>`<option value="${x}"${x===p.recent?' selected':''}>${x||'nežinau'}</option>`).join('')}</select></label></div>
    </div></details>
    <button class="btn hot big" data-act="briefGo">Parengti brifą</button></div>
    ${S.brief?'<button class="btn" data-act="planClose">Atgal į brifą</button>':''}`};

function elapsedStr(t){try{const ms=Date.now()-new Date(t.date+'T'+t.start).getTime();const m=Math.max(0,Math.floor(ms/60000));return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')}catch(e){return '0:00'}}
const camSvg='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

VIEWS.trip=function(){
  const A=S.activeTrip;
  if(A){const c=A.catches||[];const rec=S.brief&&S.brief.rec&&S.brief.rec.sets?S.brief.rec.sets.slice(0,3).map(x=>{const g=S.gear.find(y=>y.id===x.lureId);return g?glFull(g):(x.lureText||'')}).filter(Boolean):[];
    return `<div class="live">${wavesSVG('inlive')}<div class="eyebrow">Žvejoji dabar</div><h1>${esc(A.waterName||'Be vietos')}</h1>
      <div class="elapsed" id="elapsed">${elapsedStr(A)}</div><div class="muted small">pradėta ${esc(A.start)} · ${esc(A.type||'')} · laimikių ${c.length}</div></div>
     <button class="btn hot big cam" data-act="catchNow">${camSvg}<span>Laimikis</span></button>
     <div class="small muted" style="margin-top:-6px">Nufotografuok žuvį su masalu. Laikas, vieta ir rūšis paimami iš nuotraukos.</div>
     ${c.length?`<div class="list">${c.slice().reverse().slice(0,6).map(x=>`<div class="item static">${x.thumb?`<img class="thumb" src="${x.thumb}" alt="">`:`<div class="thumb">?</div>`}<div class="grow"><b>${esc(x.species||'Žuvis')}</b>${x.len?' '+esc(x.len)+' cm':''}<div class="muted small">${esc(x.time||'')} ${esc(lureLabel(x)||'masalas nenurodytas')}</div></div></div>`).join('')}</div>`:''}
     ${rec.length?`<div class="small muted">Pagal brifą: ${rec.map(esc).join(', ')}</div>`:''}
     <div class="row"><button class="btn" data-act="editTrip" data-v="${A.id}">Redaguoti</button><button class="btn" data-act="endTrip">Baigti žvejybą</button></div>`}
  const ts=[...S.trips].sort((a,b)=>(b.date+(b.start||'')).localeCompare(a.date+(a.start||'')));
  const hrs=S.trips.reduce((a,t)=>a+tripHours(t),0),fish=tripsFish();
  return `<div class="hero"><div class="eyebrow">Žvejyba</div><h1>Pradėk žvejybą</h1></div>
   <div class="panel list">${S.waters.length?waterSelect()+typeChips():'<div class="muted">Pirmiausia pridėk vandenį skiltyje Daugiau.</div>'}
   <button class="btn hot big" data-act="startTrip">Pradėti dabar</button>
   <button class="btn" data-act="newTrip">Įrašyti jau įvykusią žvejybą</button></div>
   ${ts.length?`<div class="sect">Anksčiau <span class="muted small" style="font-family:var(--body);font-weight:400">· ${ts.length} žvejybų · ${fish} žuvų · ${fmt1(hrs)} val.</span></div>
   <div class="list">${ts.map(t=>{const c=t.catches||[];
    return `<button class="item" data-act="editTrip" data-v="${t.id}"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>${esc(t.waterName||'be vietos')}</b><span class="badge">${c.length} ${c.length===1?'žuvis':'žuvų'}</span></div>
     <div class="muted small">${esc(t.date)}${t.start?' · '+esc(t.start)+'–'+esc(t.end||'?'):''}${tripHours(t)?' · '+fmt1(tripHours(t))+' val.':''} · ${esc(t.type||'')}</div>
     ${c.length?`<div class="thumbs">${c.slice(0,6).map(x=>x.thumb?`<img src="${x.thumb}" alt="">`:'').join('')}</div>`:''}</div></button>`}).join('')}</div>`:''}`};

VIEWS.more=function(){
  if(S.more&&VIEWS[S.more])return `<button class="btn sm" data-act="more" data-v="">← Daugiau</button>`+VIEWS[S.more]();
  const rows=[['waters','Vandenys',S.waters.length+' telkinių','Teisinis statusas, bilietai, ežerų duomenys'],['gear','Spinta',S.gear.length+' daiktų','Masalai ir įranga, kurią brifas gali rekomenduoti'],
    ['stats','Analizė',S.trips.length+' žvejybų','Statistika ir hipotezės iš šaltinių'],['guide','Žinynas','','Šaltiniai, taisyklės, metodika, žuvų rūšys']];
  return `<div class="hero"><div class="eyebrow">Daugiau</div><h1>Nustatymai ir žinios</h1></div>
   <div class="list">${rows.map(([k,n,c,d])=>`<button class="item more" data-act="more" data-v="${k}"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>${n}</b><span class="muted small">${c}</span></div><div class="muted small">${d}</div></div></button>`).join('')}</div>
   <button class="btn sm" data-act="exportData" style="align-self:flex-start">Eksportuoti duomenis</button>`};

async function startTrip(){
  if(S.activeTrip){S.tab='today';renderAll();return}
  const b=S.brief,p=b?b.p:S.plan;
  if(!p.waterId){S.tab='today';renderAll();toast('Pasirink vandenį');return}
  const w=waterById(p.waterId);const t=newTrip();const bid=S.brief&&S.brief.id;if(bid)t.briefId=bid;
  t.active=true;t.date=today();t.start=nowHM();t.type=p.type;t.waterId=w?w.id:'';t.waterName=w?w.name:'';t.recent=p.recent||'';
  ['temp','wind','dir','sky','wtemp','pressure'].forEach(k=>{if(p[k])t.w[k]=p[k]});
  const r=await save('trips',t);if(!r)return;S.activeTrip=r;S.tab='today';
  if(bid){S._actBrief=S.brief;S._used.add(bid);const raw=S.briefs.find(x=>x.id===bid);if(raw)save('briefs',{...raw,status:'active'});S.brief=null}
  renderAll();window.scrollTo(0,0)}
async function endTrip(btn){
  const t=S.activeTrip;if(!t)return;if(!confirm_('Baigti žvejybą?',btn))return;
  const T=JSON.parse(JSON.stringify(t));T.end=nowHM();T.active=false;T.needsDebrief=true;
  const w=S.waters.find(x=>x.id===T.waterId);{const f=w&&fcFor(w,T.date);if(f)T.wxSnap={src:f.source,wind:f.windDir+' '+f.windMs+' m/s',cloud:f.cloud,pressure:f.pressure,temp:f.tMin+'..'+f.tMax}}
  const g=(T.catches||[]).filter(c=>c.lat);
  if(w&&!w.coords&&g.length){await save('waters',{...w,coords:median(g.map(c=>c.lat)).toFixed(6)+', '+median(g.map(c=>c.lon)).toFixed(6),coordsSrc:'nuotraukų EXIF'})}
  const r=await save('trips',T);if(!r)return;
  setColl('trips',[...rawColl('trips').filter(x=>x.id!==r.id),r]);S.tab='today';renderAll();window.scrollTo(0,0)}
