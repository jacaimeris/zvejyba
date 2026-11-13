/* ---------- Išvyka: planas -> pasiruošęs -> žvejoju -> debrief ---------- */
const planForm=VIEWS.today;
function hydrateBrief(r){const p=r.p,w=waterById(p.waterId);if(!w)return null;
  return {id:r.id,p,water:w,legal:legal(w,p.type,p.date,p.species),cond:condEval(p,w),rec:r.rec||null,loading:false,ts:r.updated}}
function curBrief(){if(S.brief)return S.brief;
  const r=S.briefs.filter(x=>x.status==='planned'&&x.p&&!S._used.has(x.id)).sort((a,b)=>(b.updated||0)-(a.updated||0))[0];
  if(r){const h=hydrateBrief(r);if(h)S.brief=h}return S.brief}
function actBrief(A){const r=A.briefId&&S.briefs.find(x=>x.id===A.briefId);return (r&&r.p&&hydrateBrief(r))||S._actBrief||null}
const pendingDebrief=()=>S.trips.filter(t=>t.needsDebrief).sort((a,b)=>(b.date+(b.end||'')).localeCompare(a.date+(a.end||'')))[0]||null;
function newPlan(){if(S.brief)S._used.add(S.brief.id);S.brief=null;S.planOpen=true;renderMain()}
const dayWord=ds=>{const d=Math.round((new Date(ds+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5);return d===0?'Šiandien':d===1?'Rytoj':d===-1?'Vakar':fmtDay(ds)};

function hubReady(b){
  return `<div class="hero"><div class="eyebrow">Išvyka paruošta</div><h1>${esc(b.water.name)}</h1>${wavesSVG()}</div>
  <div class="summary"><div class="mini">${(b.p.species||[]).slice(0,3).map(n=>idOfName(n)?fishSVG(idOfName(n),'mini'):'').join('')}</div><div class="grow"><b>${esc(dayWord(b.p.date))}${b.p.time?', '+esc(b.p.time):''}</b><div class="muted small">${esc(b.p.type)} · ${esc((b.p.species||[]).join(', '))}</div></div><button class="btn sm" data-act="planOpen">Keisti</button></div>
  <button class="btn hot big" data-act="startTrip">Pradėti žvejybą</button>
  <div class="small muted" style="margin-top:-4px">Paspausk, kai būsi prie vandens. Brifas lieka čia ir žvejojant.</div>
  ${briefHTML(b)}
  <button class="btn sm" data-act="newPlan" style="align-self:flex-start">Nauja išvyka</button>`}

function hubActive(A){
  const b=actBrief(A);const c=A.catches||[];
  return `<div class="live">${wavesSVG('inlive')}<div class="eyebrow"><span class="livedot" aria-hidden="true"></span>Žvejoji dabar</div><h1>${esc(A.waterName||'Be vietos')}</h1>
   <div class="elapsed" id="elapsed">${elapsedStr(A)}</div><div class="muted small">pradėta ${esc(A.start)} · ${esc(A.type||'')} · laimikių <span id="catchN">${c.length}</span></div></div>
  <button class="btn hot big cam${S.scanning?' scan':''}" data-act="catchNow"${S.scanning?' disabled':''}>${camSvg}<span>${S.scanning?'Atpažįstu…':'Laimikis'}</span></button>
  <div class="small muted" style="margin-top:-6px">Nufotografuok žuvį su masalu. Laikas, vieta ir rūšis paimami iš nuotraukos.</div>
  ${c.length?`<div class="list">${c.slice().reverse().slice(0,6).map(x=>`<div class="item static">${x.thumb?`<img class="thumb" src="${x.thumb}" alt="">`:`<div class="thumb">?</div>`}<div class="grow"><b>${esc(x.species||'Žuvis')}</b>${x.len?' '+esc(x.len)+' cm':''}<div class="muted small">${esc(x.time||'')} ${esc(lureLabel(x)||'masalas nenurodytas')}</div></div></div>`).join('')}</div>`:''}
  ${b?`<details class="fold"><summary>Brifas: masalai, vėjas, planas B</summary><div style="margin-top:10px" class="list">${recSumHTML(b)}${extrasHTML(b)}${dosHTML(b)}</div></details>`:''}
  <div class="row"><button class="btn" data-act="editTrip" data-v="${A.id}">Redaguoti</button><button class="btn hot" data-act="endTrip">Baigti ir debrief</button></div>`}

function hubDebrief(T){
  const c=T.catches||[];
  setTimeout(()=>{if(!dict&&!S._micTried){S._micTried=1;initMic().then(()=>{if(dict&&pendingDebrief())renderMain()})}},50);
  return `<div class="hero"><div class="eyebrow">Žvejyba baigta</div><h1>Debrief</h1>${wavesSVG()}</div>
  <div class="summary"><div class="grow"><b>${esc(T.waterName||'be vietos')}</b><div class="muted small">${esc(T.date)} ${esc(T.start||'')}–${esc(T.end||'')} · ${c.length} ${c.length===1?'žuvis':'žuvų'}</div></div><button class="btn sm" data-act="editTrip" data-v="${T.id}">Pataisyti laimikius</button></div>
  ${c.length?`<div class="thumbs">${c.slice(0,8).map(x=>x.thumb?`<img src="${x.thumb}" alt="">`:'').join('')}</div>`:''}
  <div class="panel list"><label class="f big">Kaip sekėsi? Papasakok laisvai<textarea id="freeText" rows="7" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--surface)" placeholder="Kur žvejojai, kas kibo ir ant ko, kas nekibo, kaip keitėsi vėjas ir šviesa, ar sutiko planą, ką darytum kitaip..."></textarea></label>
   <div class="row">${dict?'<button class="btn" data-act="mic">Diktuoti</button>':''}<span class="small muted">Telefone gali naudoti klaviatūros mikrofoną.</span></div>
   <button class="btn hot big" data-act="debriefGo">Išsaugoti debrief</button>
   <button class="btn sm" data-act="debriefSkip" style="align-self:flex-start">Praleisti</button></div>`}

async function debriefGo(btn,skip){
  const T0=pendingDebrief();if(!T0)return;
  const text=(($('#freeText')||{}).value||'').trim();
  if(!skip&&text.length<5){toast('Parašyk bent kelis žodžius arba paspausk Praleisti');return}
  btn.disabled=true;if(!skip)btn.textContent='Analizuoju…';
  const T=JSON.parse(JSON.stringify(T0));delete T.needsDebrief;
  if(skip)T.debriefSkipped=true;
  else{T.debrief={text,ts:Date.now()};
    try{
      const cl=(T.catches||[]).map(x=>`${x.time||'?'} ${x.species||'?'} ${x.len?x.len+' cm':''} masalas: ${lureLabel(x)||'?'}`).join('\n')||'(laimikių neužfiksuota)';
      const br=(T.briefId&&S.briefs.find(x=>x.id===T.briefId))||null;
      const plan=br&&br.rec?JSON.stringify({masalai:(br.rec.sets||[]).map(s=>(S.gear.find(g=>g.id===s.lureId)?glFull(S.gear.find(g=>g.id===s.lureId)):s.lureText)),vejoPlanas:br.rec.windPlan,planB:br.rec.planB}):'(brifo nėra)';
      const o=parseJSON(await ai(`Žvejas po žvejybos papasakojo, kaip sekėsi. Iš jo teksto ir užfiksuotų laimikių sudaryk debrief. Grąžink TIK JSON. TAISYKLĖS: nieko neišgalvok, naudok tik tai, ką pasakė žvejas ar yra laimikių sąraše; ko nežinai, palik tuščią. Nedaryk priežastinių išvadų iš vienos žvejybos, rašyk "pastebėjimas", ne "taisyklė".
Schema: {"summary":"2-3 sakiniai","worked":["kas veikė (masalas/vieta/laikas/vedimas)"],"didnt":["kas neveikė"],"planVsReality":"kuo skyrėsi nuo brifo, jei pasakyta","conditions":"faktinės sąlygos pagal žvejo tekstą","lessons":["pastebėjimai kitai kartai, pažymėti kaip pastebėjimas iš vienos žvejybos"]}
Vanduo: ${T.waterName}, ${T.date} ${T.start}-${T.end}, ${T.type}.
Prognozė brife: ${T.wxSnap?JSON.stringify(T.wxSnap):'(nėra)'}
Brifo planas: ${plan}
Laimikiai:\n${cl}
Žvejo tekstas: """${text}"""`));
      T.debrief.ai=o}catch(e){toast('Debrief išsaugotas be analizės: '+(e.message||e),5000)}}
  const r=await save('trips',T);if(!r){btn.disabled=false;return}
  setColl('trips',[...rawColl('trips').filter(x=>x.id!==r.id),r]);
  if(T.briefId){const raw=S.briefs.find(x=>x.id===T.briefId);if(raw)save('briefs',{...raw,status:'done'});S._used.add(T.briefId)}
  S.brief=null;S._actBrief=null;S.planOpen=false;S.plan.waterId='';
  toast(skip?'Praleista':'Debrief išsaugotas');renderAll();window.scrollTo(0,0)}

VIEWS.trip=function(){
  if(S.activeTrip)return hubActive(S.activeTrip);
  const D=pendingDebrief();if(D)return hubDebrief(D);
  const b=curBrief();
  if(b&&!S.planOpen&&b.loading)return `<div class="hero"><div class="eyebrow">Ruošiu brifą</div><h1>${esc(b.water?b.water.name:'')}</h1></div>${recSumHTML(b)}`;
  if(b&&!S.planOpen)return hubReady(b);
  return planForm()};

/* ---------- Žurnalas ---------- */
VIEWS.today=function(){
  const ts=[...S.trips].sort((a,b)=>(b.date+(b.start||'')).localeCompare(a.date+(a.start||'')));
  const hrs=S.trips.reduce((a,t)=>a+tripHours(t),0),fish=tripsFish();
  const byLure={};S.trips.forEach(t=>(t.catches||[]).forEach(c=>{const k=lureLabel(c)||'masalas nenurodytas';(byLure[k]=byLure[k]||{n:0,sp:{}}).n++;byLure[k].sp[c.species||'?']=1}));
  const lures=Object.entries(byLure).sort((a,b)=>b[1].n-a[1].n).slice(0,6);
  const tile=(k,v)=>`<div class="pick" style="text-align:center"><b style="font-size:22px">${v}</b><div class="small muted">${k}</div></div>`;
  if(!ts.length)return `<div class="hero"><div class="eyebrow">Žurnalas</div><h1>Dar tuščia</h1></div><div class="panel list"><p class="muted">Čia kaupsis tavo žvejybos, laimikiai ir debrief. Pirmą žvejybą pradėk skiltyje Išvyka.</p><button class="btn" data-act="newTrip">Įrašyti jau įvykusią žvejybą</button></div>`;
  return `<div class="hero"><div class="eyebrow">Žurnalas</div><h1>${S.who||'Tavo'} žvejybos</h1></div>
  <div class="grid3">${tile('žvejybų',ts.length)}${tile('žuvų',fish)}${tile('valandų',fmt1(hrs))}</div>
  ${lures.length?`<div class="panel"><h3>Ant ko kibo</h3><div class="small muted" style="margin:4px 0 8px">Tik tavo laimikiai, be pastangų normalizavimo. Dar per mažai duomenų išvadoms. Analizė su pastangomis yra skiltyje Daugiau.</div>${lures.map(([k,v])=>`<div class="lrow"><span class="badge">${v.n}</span><span>${esc(k)} <span class="muted small">${Object.keys(v.sp).map(esc).join(', ')}</span></span></div>`).join('')}</div>`:''}
  <div class="sect">Žvejybos</div>
  <div class="list">${ts.map(t=>{const c=t.catches||[],d=t.debrief&&t.debrief.ai;
   return `<button class="item" data-act="editTrip" data-v="${t.id}"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>${esc(t.waterName||'be vietos')}</b><span class="badge">${c.length} ${c.length===1?'žuvis':'žuvų'}</span></div>
    <div class="muted small">${esc(t.date)}${t.start?' · '+esc(t.start)+'–'+esc(t.end||'?'):''}${tripHours(t)?' · '+fmt1(tripHours(t))+' val.':''} · ${esc(t.type||'')}</div>
    ${t.wxSnap?`<div class="small muted">Prognozė: ${esc(t.wxSnap.wind)}, ${esc(t.wxSnap.temp)} °C</div>`:''}
    ${d&&d.summary?`<div class="small" style="margin-top:4px">${esc(d.summary)}</div>`:t.debrief?`<div class="small" style="margin-top:4px">${esc(t.debrief.text.slice(0,140))}</div>`:''}
    ${c.length?`<div class="thumbs">${c.slice(0,6).map(x=>x.thumb?`<img src="${x.thumb}" alt="">`:'').join('')}</div>`:''}</div></button>`}).join('')}</div>
  <button class="btn" data-act="newTrip">Įrašyti jau įvykusią žvejybą</button>`};
