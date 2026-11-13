/* ---------- stats ---------- */
function barRows(rows,labelFn){
  rows=rows.filter(r=>r.hours>0);if(!rows.length)return '<div class="muted small">Dar nėra duomenų (reikia žvejybų su pradžios ir pabaigos laiku).</div>';
  const mx=Math.max(...rows.map(r=>r.fish/r.hours))||1;
  return `<div class="bars">${rows.map(r=>{const rt=r.fish/r.hours;const cf=confLabel(r.trips,r.fish,r.hours);return `<div class="bar-row"><span>${esc(labelFn(r.k))}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,rt/mx*100)}%"></div></div><span class="small"><b>${fmt1(rt)}</b>/val. <span class="muted">(${r.fish} ž., ${r.trips} žv., ${fmt1(r.hours)} val.)</span> <span class="pill ${cf==='žemas'?'warn':cf==='vidutinis'?'':'good'}" ${cf==='vidutinis'?'style="background:var(--muted)"':''}>${cf}</span></span></div>`}).join('')}</div>`}
function grp(keyFn){const m={};S.trips.forEach(t=>{const k=keyFn(t);if(k==null||k==='')return;const o=m[k]||(m[k]={k,trips:0,hours:0,fish:0});o.trips++;o.hours+=tripHours(t);o.fish+=(t.catches||[]).length});return Object.values(m)}
const fmtRR=r=>fmt1(r);
function hypCard(h){
  const r=evalHyp(h,S.trips,S.waters);const snaps=S.hyp.filter(x=>x.hid===h.id).sort((a,b)=>b.date.localeCompare(a.date)||(b.created||0)-(a.created||0));
  const vcls={'palaiko':'good','prieštarauja':'bad','neapibrėžta':'warn','nepakanka duomenų':'warn'}[r.verdict];
  const body=r.res.ok?`Santykis (RR) ${fmtRR(r.res.rr)}, 95% intervalas ${fmtRR(r.res.lo)}–${fmtRR(r.res.hi)}. ${esc(r.labA)}: ${r.fishA} ž. per ${fmt1(r.hA)} val. (${fmt1(r.fishA/r.hA)}/val.). ${esc(r.labB)}: ${r.fishB} ž. per ${fmt1(r.hB)} val. (${fmt1(r.fishB/r.hB)}/val.).`
    :`${esc(r.res.why||'')}. Šiuo metu: ${r.n.A||0} ir ${r.n.B||0} žvejybų, ${r.fishA+r.fishB} žuvų.`;
  return `<details class="card hyp"><summary><span class="grow">${h.id} · ${esc(h.text.length>70?h.text.slice(0,68)+'…':h.text)}</span><span class="pill ${vcls}">${r.verdict}</span></summary>
   <p style="margin:10px 0 6px">${esc(h.text)}</p>
   <div class="small muted">Pagrindas: ${h.ev.map(e=>{const ev=EVID.find(x=>x.id===e);return e+' ('+ev.src.join(', ')+')'}).join('; ')}. Tikėtina kryptis: ${h.exp==='+'?'daugiau pirmoje grupėje':'mažiau pirmoje grupėje'}.</div>
   <div class="small" style="margin:6px 0">${body}</div>
   ${snaps.length?`<div class="small muted">Įrašyta ${snaps.length} kart. Paskutinis: ${esc(snaps[0].date)}, ${esc(snaps[0].verdict)}${snaps[0].fishA!=null?' ('+(snaps[0].fishA+snaps[0].fishB)+' ž.)':''}${snaps.length>1&&snaps[1].verdict!==snaps[0].verdict?'; anksčiau: '+esc(snaps[1].verdict):''}.</div>`:''}
   <button class="btn sm" data-act="hypSave" data-v="${h.id}">Įvertinti ir įrašyti</button></details>`}
function statsHTML(){
  const n=S.trips.length;
  if(n<1)return '<h2>Analizė</h2><div class="card">Analizė atsiras, kai įrašysi pirmas žvejybas su pradžios ir pabaigos laiku bei laimikių nuotraukomis. Hipotezės (žemiau) neįvertinamos, kol imtis nepasiekia mažiausios ribos.</div><h3>Hipotezės</h3>'+HYP.map(hypCard).join('');
  const fish=tripsFish(),hrs=S.trips.reduce((a,t)=>a+tripHours(t),0);
  const mn=t=>t.date?MONTHS[+t.date.slice(5,7)-1]:null;
  const lureMap={};S.trips.forEach(t=>(t.catches||[]).forEach(c=>{const k=lureLabel(c)||'(masalas nenurodytas)';lureMap[k]=(lureMap[k]||0)+1}));
  const lures=Object.entries(lureMap).sort((a,b)=>b[1]-a[1]);
  const hist={};S.trips.forEach(t=>(t.catches||[]).forEach(c=>{if(!c.time)return;const h=+c.time.split(':')[0];hist[h]=(hist[h]||0)+1}));
  const hk=Object.keys(hist).map(Number);let hh='';
  if(hk.length){const a=Math.min(...hk),b=Math.max(...hk),mx=Math.max(...Object.values(hist));
    hh='<div class="hist">'+Array.from({length:b-a+1},(_,i)=>{const h=a+i,v=hist[h]||0;return `<div><span>${v||''}</span><i style="height:${v/mx*80}%"></i><span>${h}</span></div>`}).join('')+'</div>'}
  const sp={};S.trips.forEach(t=>(t.catches||[]).forEach(c=>{if(c.species)sp[c.species]=(sp[c.species]||0)+1}));
  const sec=(t,b)=>`<div class="card"><h3>${t}</h3><div style="margin-top:10px">${b}</div></div>`;
  const cf=confLabel(n,fish,hrs);
  return `<h2>Analizė</h2>
  <div class="banner">Imtis: ${n} žvejybų, ${fish} žuvų, ${fmt1(hrs)} valandų. Bendras pasitikėjimas: <b>${cf}</b>. Žemas reiškia mažiau nei 5 žvejybų, 10 žuvų ar 10 valandų, vidutinis mažiau nei 10 žvejybų ar 30 žuvų (mano slenksčiai, ne iš literatūros).</div>
  <h3>Hipotezės iš šaltinių</h3>${HYP.map(hypCard).join('')}
  ${sec('Ant ko kimba (tik pagavimai)',lures.length?`<div class="small muted" style="margin-bottom:8px">Čia nėra bandymų skaičiaus, nes masalų keitimo neloguoji. Lentelė rodo, ką naudoji ir kas pagavo, bet NERODO, kuris masalas efektyvesnis.</div><div class="scroll-x"><table><tr><th>Masalas</th><th>Pagavimai</th></tr>${lures.map(l=>`<tr><td>${esc(l[0])}</td><td>${l[1]}</td></tr>`).join('')}</table></div>`:'<div class="muted small">Dar nėra pagavimų.</div>')}
  ${sec('Rūšys',Object.keys(sp).length?`<div class="chips">${Object.entries(sp).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span class="badge">${esc(k)} ${v}</span>`).join('')}</div>`:'<div class="muted small">Dar nėra pagautų žuvų.</div>')}
  ${sec('Kibimai pagal valandą',hh||'<div class="muted small">Pagavimų laikas paimamas iš nuotraukų EXIF.</div>')}
  ${sec('Pagal mėnesį',barRows(grp(mn).sort((a,b)=>MONTHS.indexOf(a.k)-MONTHS.indexOf(b.k)),k=>k))}
  ${sec('Pagal vandenį',barRows(grp(t=>t.waterName).sort((a,b)=>b.fish/(b.hours||1)-a.fish/(a.hours||1)),k=>k))}
  ${sec('Pagal žvejybos tipą',barRows(grp(t=>t.type),k=>k))}
  <div class="row"><button class="btn" data-act="exportData">Eksportuoti duomenis (JSON)</button></div>`}

/* ---------- compact data for AI ---------- */
function gearSummary(cats){return S.gear.filter(g=>!cats||cats.includes(g.cat)).map(g=>`${g.id} | ${CATS[g.cat]?.one||g.cat}: ${glFull(g)}${g.type?' ['+g.type+']':''}${g.qty&&g.qty!=1?' x'+g.qty:''}${g.specs?' ('+g.specs+')':''}`).join('\n')||'(spinta tuščia)'}
function waterHistory(w){
  const ts=S.trips.filter(t=>t.waterId===w.id||t.waterName===w.name);if(!ts.length)return 'Šiame vandenyje žvejybų žurnale dar nėra.';
  const sp={},lu={};ts.forEach(t=>(t.catches||[]).forEach(c=>{sp[c.species]=(sp[c.species]||0)+1;const k=lureLabel(c);if(k)lu[k]=(lu[k]||0)+1}));
  const h=ts.reduce((a,t)=>a+tripHours(t),0);
  return `${ts.length} žvejybų, ${fmt1(h)} val.; pagavimai pagal rūšį: ${Object.entries(sp).map(([k,v])=>k+' '+v).join(', ')||'nėra'}; pagavimai pagal masalą: ${Object.entries(lu).map(([k,v])=>k+' '+v).join(', ')||'nėra'}`}
function tripsSummary(){return S.trips.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map(t=>`${t.date} ${t.waterName||''} | ${t.type||''} ${t.start||''}-${t.end||''} | ${wline(t.w)} | vand. ${t.w?.wtemp||'?'}°C | kibimai: ${(t.catches||[]).map(c=>[c.species,c.len&&c.len+'cm',c.time,lureLabel(c)].filter(Boolean).join(' ')).join('; ')||'nieko'}`).join('\n')||'(žurnalas tuščias)'}
const SYS='Tu padedi Lietuvos žvejui. Atsakyk lietuviškai, tiesmukai, be įžangos, be emoji ir be tuščių frazių. Nespėliok faktų ir skaičių; jei duomenų ar šaltinio nėra, taip ir pasakyk.\n';

async function runAI(btn,outId,key,promptFn){
  const out=$('#'+outId);btn.disabled=true;const old=btn.textContent;btn.textContent='Galvoju…';out.hidden=false;out.textContent='';
  try{const t=await ai(promptFn());S.out[key]=t;out.innerHTML=md(t)}catch(e){out.textContent=e.message||String(e)}
  btn.disabled=false;btn.textContent=old}
