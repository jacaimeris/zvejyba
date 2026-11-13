/* ---------- rytojaus išvyka: prognozė, dosjė, greitas įvedimas, spintos įkėlimas ---------- */
const wkey=w=>String((w&&w.name)||'').toLowerCase().replace(/[^a-ząčęėįšųūž]/g,'');
const fcFor=(w,date)=>w?S.forecasts.find(f=>f.date===date&&wkey(w).startsWith(String(f.waterId||'~')))||null:null;
const dosFor=w=>w?S.dossiers.find(d=>wkey(w).startsWith(String(d.waterId||'~')))||null:null;
function fcText(p,w){const f=fcFor(w,p.date);if(!f)return '(prognozės šiai dienai bazėje nėra)';
  return `šaltinis ${f.source}; t ${f.tMin}..${f.tMax} °C; debesys ${f.cloud}; vėjas ${f.windDir}, ${f.windMs} m/s, gūsiai ${f.gustMs}; slėgis ${f.pressure}; krituliai ${f.precip}; matomumas ${f.visibility}; saulėtekis ${f.sunrise}, saulėlydis ${f.sunset}; vandens temp. ${f.waterTempEst}. ${f.notes||''}`}
function dosText(w){const d=dosFor(w);if(!d)return '(dosjė nesurinkta)';
  return JSON.stringify({faktai:d.facts,teisė:d.legal,žuvys:d.fish,gyliai:d.bathymetry,vietos:d.spots,vėjoPlanas:d.windPlan,ribos:d.limits})}
function prefillFromFc(p,w){const f=fcFor(w,p.date);if(!f||!f.plan)return;Object.entries(f.plan).forEach(([k,v])=>{if(!p[k])p[k]=v})}
function fcHTML(b){const f=fcFor(b.water,b.p.date);if(!f)return `<div class="panel muted small">Šiai dienai prognozės bazėje nėra. Paprašyk Claude jos atnaujinti.</div>`;
  const cell=(k,v)=>`<div class="pick"><div class="small muted">${k}</div><b>${esc(v)}</b></div>`;
  return `<div class="panel"><h3>Prognozė · ${esc(b.p.date)}</h3><div class="grid2">${cell('Temperatūra',f.tMin+'…'+f.tMax+' °C')}${cell('Vėjas',f.windDir+', '+f.windMs+' m/s')}${cell('Gūsiai',f.gustMs+' m/s')}${cell('Debesuotumas',f.cloud)}${cell('Slėgis',f.pressure)}${cell('Matomumas',f.visibility)}${cell('Saulė',f.sunrise+' – '+f.sunset)}${cell('Vanduo',f.waterTempEst)}</div><div class="small muted" style="margin-top:8px">${esc(f.source)}. ${esc(f.notes||'')}</div></div>`}
function extrasHTML(b){const r=b.rec;if(!r||r.error)return '';
  const blk=(t,x)=>x?`<details class="fold" open><summary>${t}</summary><div class="small" style="margin-top:8px">${x}</div></details>`:'';
  return blk('Vėjas ir vietos šiandien',esc(r.windPlan||''))+blk('Kaip vesti masalus',(r.retrieves||[]).map(x=>'• '+esc(x)).join('<br>'))+blk('Planas B',esc(r.planB||''))+blk('Claude patarimai',(r.tips||[]).map(x=>'• '+esc(x)).join('<br>'))}
function dosHTML(b){const d=dosFor(b.water);if(!d)return '';const f=d.facts||{},l=d.legal||{};
  return `<details class="fold"><summary>Telkinio dosjė: ${esc(d.name)}</summary><div class="small" style="margin-top:8px">
  <p><b>Faktai.</b> ${f.area_ha} ha, vid. gylis ${f.depthMean_m} m, didž. ${f.depthMax_m} m, krantas ${f.shore_km} km. ${esc(f.shores||'')}. Dugnas: ${esc(f.bottom||'')}. ${esc(f.flow||'')} <span class="muted">(${esc(f.source||'')})</span></p>
  <p><b>Teisė.</b> ${esc(l.ticket||'')}. ${esc(l.boats||'')}. ${esc(l.vehicles||'')}</p>
  <p><b>Žuvys.</b> ${esc((d.fish||{}).known||'')}</p>
  <p><b>Gyliai.</b> ${esc(d.bathymetry||'')}</p>
  ${(d.spots||[]).map(s=>`<div class="pick"><b>${esc(s.name)}</b><div class="small">${esc(s.why)}</div><span class="pill warn">${esc(s.basis)}</span></div>`).join('')}
  <p><b>Ko nežinau.</b> ${(d.limits||[]).map(esc).join('; ')}</p></div></details>`}
function quickBox(){return `<div class="panel list"><label class="f big">Papasakok, kur ir ko žvejosi<textarea id="quickText" rows="3" placeholder="Pvz.: rytoj važiuoju į Viesus ešerių, atsarginė lydeka, iš valties su elektra" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--surface)"></textarea></label>
  <div class="small muted">Telefone paspausk klaviatūros mikrofoną ir padiktuok.</div><button class="btn hot big" data-act="quickGo">Parengti brifą</button></div>`}
async function quickGo(btn){
  const txt=(($('#quickText')||{}).value||'').trim();if(txt.length<4){toast('Parašyk ar padiktuok, kur važiuoji');return}
  btn.disabled=true;btn.textContent='Skaitau…';
  try{
    const names=[...S.waters.map(w=>w.name),...KB_WATERS.map(k=>k.name)];
    const o=parseJSON(await ai(`Iš žvejo sakinio ištrauk planą. Grąžink TIK JSON. Šiandien ${today()}. "rytoj"/"šeštadienį" paversk data YYYY-MM-DD. Nespėliok: ko nėra, palik "".
Schema: {"date":"","waterName":"vienas iš: ${names.join(', ')}","type":"${TRIPTYPES.join('|')}","species":["${TARGETS.join('|')}"],"time":"HH:MM","end":"HH:MM"}
Tekstas: """${txt}"""`));
    if(o.waterName&&!S.waters.some(w=>w.name===o.waterName)){const k=KB_WATERS.find(x=>x.name===o.waterName);if(k){await save('waters',JSON.parse(JSON.stringify({...k,kbSeed:true})))}}
    const w=S.waters.find(x=>x.name===o.waterName);
    if(w)S.plan.waterId=w.id;if(o.date)S.plan.date=o.date;if(TRIPTYPES.includes(o.type))S.plan.type=o.type;
    if((o.species||[]).length)S.plan.species=o.species.filter(x=>TARGETS.includes(x));if(o.time)S.plan.time=o.time;if(o.end)S.plan.end=o.end;
    if(!S.plan.waterId){toast('Nepavyko atpažinti vandens, pasirink žemiau',5000);btn.disabled=false;btn.textContent='Parengti brifą';renderMain();return}
    S.plan.note=txt;await briefGo(btn);
  }catch(err){toast(err.message||String(err),6000);btn.disabled=false;btn.textContent='Parengti brifą'}}
function bulkModal(){openModal(`<div class="bar"><h3>Įkelk visą inventorių</h3><button class="btn sm" data-act="mclose">Uždaryti</button></div>
  <p class="small muted">Surašyk arba padiktuok viską: meškeres, rites, valus, masalus, valtį, variklį, akumuliatorių, echolotą, aksesuarus. Nereikia tvarkos. Prieš išsaugant galėsi pataisyti.</p>
  <textarea id="bulkText" rows="12" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--surface)" placeholder="Pvz.: Meškerė Shimano 2.4 m, 7-28 g; ritė Daiwa 2500; pintas valas 0.10; 8 vobleriai ~7 cm, 6 gumytės 5 cm; guminė valtis 3 m, elektrinis variklis 55 lb, akumuliatorius 100 Ah..."></textarea>
  <button class="btn primary big" data-act="gearBulkGo">Išskaidyti į daiktus</button>`)}
async function bulkGo(btn){
  const txt=(($('#bulkText')||{}).value||'').trim();if(txt.length<10){toast('Parašyk daugiau');return}
  btn.disabled=true;btn.textContent='Skaitau…';
  try{
    const cats=Object.entries(CATS).map(([k,v])=>`${k} (${v.one}; tipai: ${v.types.join('/')})`).join('; ');
    const items=parseJSON(await ai(`Iš žvejo sąrašo sukurk atskirus daiktus. Grąžink TIK JSON masyvą. Nespėliok: ko nepasakyta, palik "". Jei pasakyta "8 vobleriai", vienas įrašas su qty 8. Kategorijos (cat): ${cats}.
Laukai: {"cat":"","type":"","brand":"","model":"","size":"","weight":"","color":"","qty":1,"specs":"","notes":""}
Sąrašas: """${txt}"""`));
    closeModal();M={kind:'gear',data:(items||[]).map(x=>newGear(x))};renderBatch();toast('Atpažinta: '+M.data.length+'. Patikrink ir išsaugok.');
  }catch(err){toast(err.message||String(err),6000);btn.disabled=false;btn.textContent='Išskaidyti į daiktus'}}

/* ---------- du žmonės: Arnas ir Rokas ---------- */
function rawColl(c){return [...(ALL[c]||S[c]||[])]}
function setColl(c,list){ALL[c]=list;
  if(OWNED.includes(c)){const mine=list.filter(x=>(x.owner||'Arnas')===S.who);
    if(c==='trips'){S.activeTrip=mine.find(t=>t.active)||null;S.trips=mine.filter(t=>!t.active)}else S[c]=mine}
  else S[c]=list}
function setWho(v){if(!PEOPLE.includes(v))return;S.who=v;try{localStorage.setItem('zz_who',v)}catch(e){}
  S.brief=null;S.planOpen=false;S.plan.waterId='';OWNED.forEach(c=>setColl(c,ALL[c]||[]));renderAll()}
function whoChooser(){return `<div class="hero"><h1>Kas žvejoja?</h1></div><div class="panel list"><p class="muted">Kiekvienas turi savo inventorių, žurnalą ir brifus. Vandenys, dosjė ir prognozės bendri.</p>${PEOPLE.map(n=>`<button class="btn primary big" data-act="who" data-v="${n}">${n}</button>`).join('')}</div>`}
function whoBar(){return `<div class="chips" style="margin-bottom:8px">${PEOPLE.map(n=>`<button class="chip" data-act="who" data-v="${n}" aria-pressed="${S.who===n}">${n}</button>`).join('')}</div>`}
