/* ---------- views ---------- */
const TABS=[['today','Išvyka'],['trip','Žurnalas'],['more','Daugiau']];
function renderTabs(){$('#tabs').innerHTML=TABS.map(([k,n])=>`<button data-act="tab" data-v="${k}" aria-current="${S.tab===k}">${n}</button>`).join('')}
function renderAll(){S._anim=true;renderTabs();renderMain()}
function renderLive(){if(S.tab==='more'&&S.more==='guide')return;const a=document.activeElement;if(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&$('#main').contains(a))return;renderMain()}
function renderMain(){const v=S.who?whoBar()+VIEWS[S.tab]():whoChooser();const m=$('#main');if(S._anim){m.classList.remove('enter');void m.offsetWidth;m.classList.add('enter');S._anim=false}m.innerHTML=(S.dbOK===false?'<div class="banner">Duomenų bazė šiame lange nepasiekiama, todėl viskas dings uždarius puslapį. Atidaryk įrankį per claude.ai, kad duomenys išliktų.</div>':'')+v}

/* šaltinio žymė su patikimumu */
function srcChip(id){const s=SRC[id];if(!s)return '';return `<button class="src g-${s.g.replace('-','m')}" data-act="srcgo" data-v="${id}" title="${esc(s.t)}">${id} · ${s.g}</button>`}
function srcChips(ids){return (ids||[]).map(srcChip).join('')}
const waterById=id=>S.waters.find(w=>w.id===id);
const statusPill=w=>{const s=(w.legal&&w.legal.status)||'';if(!s)return '<span class="pill warn">statusas nežinomas</span>';
  const cls={'neišnuomotas':'good','ekologinis':'good','išnuomotas':'bad','limituota':'bad','uždraustas':'bad'}[s]||'warn';return `<span class="pill ${cls}">${esc(s)}</span>`};

const VIEWS={
gear(){
  const cats=Object.keys(CATS);const q=S.q.toLowerCase();
  const list=S.gear.filter(g=>(S.cat==='all'||g.cat===S.cat)&&(!q||JSON.stringify(g).toLowerCase().includes(q)));
  return `<div class="row between"><h2>Žvejybos spinta</h2><span class="badge">${S.gear.length} daiktų</span></div>
  <div class="row"><button class="btn primary" data-act="gearPhoto">Nufotografuoti</button><button class="btn" data-act="gearManual">Įvesti ranka</button><button class="btn hot" data-act="gearBulk">Įkelti viską tekstu</button></div>
  <input id="gq" type="search" placeholder="Ieškoti spintoje" value="${esc(S.q)}" style="border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:9px 12px;width:100%">
  <div class="chips"><button class="chip" data-act="cat" data-v="all" aria-pressed="${S.cat==='all'}">Viskas</button>${cats.map(c=>{const n=S.gear.filter(g=>g.cat===c).length;return n?`<button class="chip" data-act="cat" data-v="${c}" aria-pressed="${S.cat===c}">${CATS[c].n} ${n}</button>`:''}).join('')}</div>
  <div class="list" id="gearList">${gearListHTML(list)}</div>
  ${gapsHTML()}`},
waters(){
  const missing=KB_WATERS.filter(k=>!S.waters.some(w=>normName(w.name)===normName(k.name)));
  return `<div class="row between"><h2>Vandenys</h2><button class="btn primary" data-act="newWater">Pridėti</button></div>
  ${missing.map(k=>`<div class="card row between"><div><b>${esc(k.name)}</b><div class="muted small">Žinių bazėje yra profilis su šaltiniais (${esc(k.region)})</div></div><button class="btn primary" data-act="kbImport" data-v="${esc(k.name)}">Įkelti</button></div>`).join('')}
  ${S.waters.length?`<div class="list">${S.waters.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(w=>{const n=S.trips.filter(t=>t.waterId===w.id||t.waterName===w.name).length;
   return `<button class="item" data-act="editWater" data-v="${w.id}"><div class="grow"><div class="row between"><b>${esc(w.name)}</b><span class="row">${statusPill(w)}<span class="badge">${n} žvej.</span></span></div>
   <div class="muted small">${[w.kind,w.region,w.area&&w.area+' ha',w.maxDepth&&'iki '+w.maxDepth+' m'].filter(Boolean).map(esc).join(' · ')}</div>
   ${w.legal&&w.legal.checked?`<div class="small muted">Statusas tikrintas ${esc(w.legal.checked)}${w.legal.src?' ('+esc(w.legal.src)+')':''}</div>`:''}</div></button>`}).join('')}</div>`
  :'<div class="card">Čia sudėk ežerus, upes ir tvenkinius, kuriuose žvejoji. Brifas teisinę dalį skaičiuoja iš telkinio statuso, todėl statusą (išnuomotas, neišnuomotas, limituotas) reikia nurodyti ir patikrinti ALIS.</div>'}`},

stats(){return statsHTML()},

guide(){
  const subs=[['src','Šaltiniai'],['rules','Taisyklės'],['proc','Metodika'],['rules2','Principai']];
  let body='';
  const unv='<div class="banner">Šis skyrius yra bendra žvejybos praktika, o ne šaltiniais pagrįsta žinių bazė. Brifas jo nenaudoja. Šaltiniais pagrįsta dalis yra skyriai Šaltiniai, Taisyklės ir Metodika.</div>';
  if(S.sub==='src'){
    body=`<div class="small muted">Patikimumas: A recenzuotas ar oficialus teisės aktas, A- oficiali atmintinė, B institucijos pranešimas ar agregatorius, C magistro darbas ar spauda, D nepatikrinta. Taikomumas rodo, ar tyrimas tinka Lietuvos sąlygoms.</div>`+
    Object.entries(SRC).map(([id,s])=>`<div class="card" id="src_${id}"><div class="row between"><b>${id}</b><span class="row"><span class="src g-${s.g.replace('-','m')}">patikimumas ${s.g}</span><span class="badge">taikomumas: ${s.ap}</span></span></div>
      <p style="margin:6px 0">${esc(s.t)}</p><div class="small muted">${esc(s.n)}</div><a class="small" href="${esc(s.url)}" target="_blank" rel="noopener">Atidaryti šaltinį</a></div>`).join('')+
    `<h3 style="margin-top:8px">Įrodymų lentelė, kuria remiasi brifas</h3>`+
    EVID.map(e=>`<div class="card"><div class="row between"><b>${e.id} · ${esc(e.f)}</b><span class="badge">pasitikėjimas: ${e.conf}</span></div><p style="margin:6px 0">${esc(e.claim)}</p><div class="small muted">Taikomumas: ${esc(e.ap)}</div><div class="row" style="margin-top:6px">${srcChips(e.src)}</div></div>`).join('')}
  else if(S.sub==='rules'){
    body=`<div class="banner">Taisyklės įkeltos iš AAD atmintinių (${srcChips(['A1','A2','A3','A4','A5'])}). Pirminis teisės aktas (A6) NEPERSKAITYTAS. Prieš sprendimą dėl baudos ar ginčo remkis tik pirminiu tekstu.</div>
    <div class="card scroll-x"><table><tr><th>Rūšis</th><th>Draudimas</th><th>Dydis cm</th><th>Per dieną</th></tr>${Object.entries(SPECIES_RULES).map(([k,r])=>`<tr><td>${k}</td><td>${r.closed.length?r.closed.map(c=>`${c[1]} ${MONTHS[c[0]-1].slice(0,3)}. – ${c[3]} ${MONTHS[c[2]-1].slice(0,3)}.`).join('; '):'–'}</td><td>${r.min?r.min+(r.max?'–'+r.max:''):'–'}</td><td>${r.limit||'–'}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>Bendros ribos</h3><p>${esc(WEIGHT_RULE)}</p><p>${esc(YEAR_BAN)}</p></div>
    <div class="card"><h3>Draudžiami vandenys</h3><p>${esc(BANNED_WATERS)}</p><p>${esc(NEMUNAS_BAN_JUL_DEC)}</p></div>
    <div class="card"><h3>Upės, uždraustos spalio 1 d. - gruodžio 31 d.</h3><p class="small">Mano įkeltas dalinis sąrašas (Vilniaus ir Trakų regionas): ${RIVER_BAN_OCT_DEC.join(', ')}. Pilnas sąrašas AAD puslapyje ${srcChip('A5')}.</p></div>
    <div class="card"><h3>Ekologinės būklės gerinimo telkiniai</h3><p>${esc(ECO_RULES)}</p><p class="small">${Object.keys(ECO_WATERS).join(', ')}</p></div>`}
  else if(S.sub==='proc')body=PROC.map(([a,b])=>`<div class="card"><h3>${a}</h3><p style="margin:6px 0 0">${esc(b)}</p></div>`).join('');
  else if(S.sub==='fish'){const f=FISH.find(x=>x.id===S.fish)||FISH[0];
    body=unv+`<div class="chips">${FISH.map(x=>`<button class="chip" data-act="fish" data-v="${x.id}" aria-pressed="${x.id===f.id}">${x.name}</button>`).join('')}</div>
    <div class="card"><h3>${f.name} <span class="muted small" style="font-family:var(--body);font-style:italic">${f.lat}</span></h3><p>${f.intro}</p>
    <div class="sect">Kur ieškoti</div><p>${f.where}</p>
    <div class="sect">Pagal sezoną</div>${Object.entries(f.seasons).map(([k,v])=>`<p style="margin:4px 0"><b>${k}.</b> ${v}</p>`).join('')}
    <div class="sect">Masalai</div><p>${f.lures}</p>
    <div class="sect">Įranga</div><p>${f.tackle}</p>
    <div class="sect">Oras ir slėgis</div><p>${f.weather}</p>
    <div class="sect">Patarimai</div><p>${f.tips}</p>
    <div class="sect">Dažnos klaidos</div><p>${f.mistakes}</p></div>`}
  else if(S.sub==='knots')body=unv+KNOTS.map(k=>`<div class="card"><h3>${k.name}</h3><p class="muted" style="margin:2px 0 8px">${k.use}</p>${k.steps.map((s,i)=>`<div class="step"><b>${i+1}</b><span>${s}</span></div>`).join('')}</div>`).join('');
  else body=unv+PRINCIPLES.map(([a,b])=>`<div class="card"><h3>${a}</h3><p style="margin:6px 0 0">${b}</p></div>`).join('');
  return `<h2>Žinynas</h2><div class="chips">${subs.map(([k,n])=>`<button class="chip" data-act="gsub" data-v="${k}" aria-pressed="${S.sub===k}">${n}</button>`).join('')}</div>${body}`}
};

function gearListHTML(list){
  if(!list.length)return '<div class="card muted">Nieko nerasta. Nufotografuok naują masalų pakuotę ar kitą daiktą, aš atpažinsiu ir įdėsiu į spintą.</div>';
  return list.map(g=>`<button class="item" data-act="editGear" data-v="${g.id}">${(g.cat==='lure'||g.cat==='terminal'||gimg(g))?lureVisual(g):g.thumb?`<img class="thumb" src="${g.thumb}" alt="">`:`<div class="thumb">${esc((g.brand||CATS[g.cat]?.one||'?')[0])}</div>`}
   <div class="grow"><div class="row between"><b>${esc(gl(g))}</b>${(g.qty&&g.qty!=1)?`<span class="badge">×${esc(g.qty)}</span>`:''}</div>
   <div class="muted small">${esc(CATS[g.cat]?.one||'')}${[g.type,g.size,g.weight,g.color].filter(Boolean).map(x=>' · '+esc(x)).join('')}</div>
   ${g.specs?`<div class="small">${esc(g.specs)}</div>`:''}</div></button>`).join('')}
function gapsHTML(){
  const all=S.gear.map(g=>[g.brand,g.model,g.name,g.type,g.specs,g.notes].join(' ')).join(' | ');
  const groups=[['Spiningavimas','spin'],['Žieminė žvejyba','ice'],['Žvejyba iš valties','boat']];
  return `<div class="card"><h3>Ko gali trūkti</h3><p class="muted small" style="margin:4px 0 8px">Bazinis sąrašas, tikrinamas pagal tai, ką įrašei į spintą. Tai nėra šaltiniais pagrįstas sąrašas.</p>
  ${groups.map(([n,k])=>`<div class="sect">${n}</div>${BASICS[k].map(([l,re])=>{const ok=re.test(all);return `<div class="check"><span class="pill ${ok?'good':'warn'}">${ok?'yra':'trūksta'}</span> ${l}</div>`}).join('')}`).join('')}
  <div class="row" style="margin-top:12px"><button class="btn primary" data-act="shopGo">Pirkimų rekomendacijos su pagrindu</button></div>
  <div class="prose" id="shopOut" style="margin-top:10px">${S.out.shop?md(S.out.shop):''}</div></div>`}
