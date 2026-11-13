/* ---------- vizualiosios skiltys: žuvys, mazgai, perėjimai ---------- */
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
const SEASONS=['Pavasaris','Vasara','Ruduo','Žiema'];
const curSeason=()=>{const m=new Date().getMonth()+1;return m>=3&&m<=5?'Pavasaris':m>=6&&m<=8?'Vasara':m>=9&&m<=11?'Ruduo':'Žiema'};
const MON=['sau','vas','kov','bal','geg','birž','liep','rugp','rugs','spal','lapkr','gruod'];
const idOfName=n=>Object.keys(FISH_NAME).find(k=>FISH_NAME[k]===n);
const fishWater=id=>`style="--a:${FISH_BG[id][0]};--b:${FISH_BG[id][1]}"`;
const catchesOfSpecies=name=>{const out=[];S.trips.forEach(t=>(t.catches||[]).forEach(c=>{if(c.species===name)out.push({c,t})}));return out};

function ruleChips(name){
  const r=SPECIES_RULES[name];if(!r)return '';
  const chips=[];
  const closed=(r.closed||[]).map(([m1,d1,m2,d2])=>`${MON[m1-1]}. ${d1} – ${MON[m2-1]}. ${d2}`);
  const isClosed=(r.closed||[]).some(rg=>dInRange(today(),rg));
  chips.push(`<span class="pill ${isClosed?'bad':'good'}">šiandien ${isClosed?'draudžiama':'galima'}</span>`);
  if(closed.length)chips.push(`<span class="chip-lite">draudimas ${closed.join(', ')}</span>`);
  if(r.limit)chips.push(`<span class="chip-lite">limitas ${r.limit}</span>`);
  if(r.min)chips.push(`<span class="chip-lite">${r.min}${r.max?'–'+r.max:'+'} cm</span>`);
  return chips.join('');
}

/* perėjimas: kortelė išsiskleidžia į visą ekraną */
function openStage(html,fromEl,after){
  const st=$('#stage');
  const show=()=>{if(fromEl)fromEl.style.viewTransitionName='';st.innerHTML=html;st.hidden=false;document.body.classList.add('noscroll');requestAnimationFrame(()=>st.classList.add('open'));initReveal();st.scrollTop=0;if(after)after()};
  if(document.startViewTransition&&fromEl&&!reduceMotion()){fromEl.style.viewTransitionName='hero';const vt=document.startViewTransition(show);vt.finished.finally(()=>{const h=st.querySelector('[data-hero]');if(h)h.style.viewTransitionName=''})}
  else show();
}
function closeStage(){const st=$('#stage');stopKnot();st.classList.remove('open');setTimeout(()=>{st.hidden=true;st.innerHTML='';document.body.classList.remove('noscroll')},reduceMotion()?0:260)}
function initReveal(){
  const els=[...document.querySelectorAll('#stage .rv')];
  if(!('IntersectionObserver' in window)||reduceMotion()){els.forEach(e=>e.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{root:$('#stage'),threshold:.12});
  els.forEach(e=>io.observe(e));
}
const bubbles=()=>Array.from({length:7},(_,i)=>`<i class="bub" style="left:${8+i*13}%;animation-delay:${(i*.7)%3}s;width:${5+(i%3)*4}px;height:${5+(i%3)*4}px"></i>`).join('');

/* ---------- žuvys ---------- */
VIEWS.fishes=function(){
  const ids=Object.keys(FISH_NAME);
  return `<div class="hero"><div class="eyebrow">Žinynas</div><h1>Žuvys</h1><div class="muted small" style="margin-top:4px">Paspausk žuvį ir pamatysi, kur jos ieškoti, kada kimba ir kokios taisyklės galioja.</div></div>
  <div class="fgrid">${ids.map((id,i)=>{const n=catchesOfSpecies(FISH_NAME[id]);const last=n.length?n[n.length-1].c.thumb:'';
   return `<button class="fcard ${i===0?'wide':''}" data-act="fishOpen" data-v="${id}" ${fishWater(id)}>
     <i class="shine"></i><div class="fart">${fishSVG(id)}</div>
     <div class="fmeta"><b>${FISH_NAME[id]}</b><span>${esc((FISH.find(f=>f.id===id)||{}).lat||'')}</span></div>
     ${n.length?`<span class="fbadge">pagauta ${n.length}</span>`:''}${last?`<img class="fthumb" src="${last}" alt="">`:''}</button>`}).join('')}</div>`};

function fishStage(id,fromEl){
  const f=FISH.find(x=>x.id===id);if(!f)return;const name=FISH_NAME[id];
  const caught=catchesOfSpecies(name);const lens=caught.map(x=>num(x.c.len)).filter(Boolean);
  const sec=(t,body,cls='')=>`<section class="sec rv ${cls}"><h3>${t}</h3>${body}</section>`;
  const season=curSeason();
  const unv='<span class="chip-lite warn">bendra praktika, nepatikrinta šaltiniais</span>';
  const html=`<div class="stage-scroll"><article class="fstage">
   <header class="fs-hero" ${fishWater(id)}><button class="xbtn" data-act="stageClose" aria-label="Uždaryti">×</button><div class="bubs">${bubbles()}</div>
     <div class="fs-art" data-hero style="view-transition-name:hero">${fishSVG(id,'big')}</div>
     <h1>${name}</h1><div class="lat">${esc(f.lat)}</div><div class="chips2">${ruleChips(name)}</div></header>
   <div class="fs-body">
    ${sec('Apie',`<p>${f.intro}</p><div style="margin-top:8px">${unv}</div>`)}
    ${sec('Kur ieškoti',`<p>${f.where}</p>`)}
    ${sec('Pagal sezoną',`<div class="seg2" id="segS">${SEASONS.map(s=>`<button data-act="season" data-v="${s}" data-f="${id}" aria-pressed="${s===season}">${s}</button>`).join('')}</div><p class="swap" id="seasonBox">${f.seasons[season]}</p>`)}
    ${sec('Masalai ir įranga',`<h4>Masalai</h4><p>${f.lures}</p><h4 style="margin-top:12px">Įranga</h4><p>${f.tackle}</p>`)}
    ${sec('Oras',`<p>${f.weather}</p>`)}
    ${sec('Patarimai ir klaidos',`<h4>Patarimai</h4><p>${f.tips}</p><h4 style="margin-top:12px">Dažnos klaidos</h4><p>${f.mistakes}</p>`)}
    ${SPECIES_RULES[name]?sec('Taisyklės',`<div class="chips2 dark">${ruleChips(name)}</div>${SPECIES_RULES[name].note?`<p class="small muted" style="margin-top:8px">${esc(SPECIES_RULES[name].note)}</p>`:''}<p class="small" style="margin-top:8px">${srcChip(SPECIES_RULES[name].src)}</p>`):''}
    ${sec('Tavo pagavimai',caught.length?`<div class="tiles"><div class="tile"><b>${caught.length}</b><span>pagauta</span></div><div class="tile"><b>${lens.length?Math.max(...lens):'–'}</b><span>didžiausia, cm</span></div></div><div class="thumbs big">${caught.slice(-8).reverse().map(x=>x.c.thumb?`<img src="${x.c.thumb}" alt="">`:'').join('')}</div>`:`<p class="muted">Dar nepagavai. Pirmoji nuotrauka su šia žuvimi atsiras čia.</p>`)}
   </div></article></div>`;
  openStage(html,fromEl);
}

/* ---------- mazgai ---------- */
let KN=null;let knotTimer=null;
function stopKnot(){clearInterval(knotTimer);knotTimer=null;KN=null}
VIEWS.knots=function(){
  return `<div class="hero"><div class="eyebrow">Žinynas</div><h1>Mazgai</h1><div class="muted small" style="margin-top:4px">Pasirink mazgą ir pažiūrėk, kaip jis veda žingsnis po žingsnio. Tai schemos, ne nuotraukos.</div></div>
  <div class="list">${KNOTS.map((k,i)=>`<button class="item kcard" data-act="knotOpen" data-v="${i}" style="--d:${i*.06}s"><div class="kthumb">${(KNOT_ART[k.name]||[''])[ (KNOT_ART[k.name]||[]).length-1 ].replace('class="kscene"','class="kscene still"')}</div>
   <div class="grow"><b>${k.name}</b><div class="muted small">${k.use}</div><div class="small" style="margin-top:6px"><span class="badge">${k.steps.length} žingsniai</span></div></div></button>`).join('')}</div>`};
function knotStage(i,fromEl){
  const k=KNOTS[i];if(!k)return;KN={i,s:0,play:true};
  openStage(`<div class="stage-scroll"><article class="kstage"><header class="ks-top"><button class="xbtn dark" data-act="stageClose" aria-label="Uždaryti">×</button><div class="eyebrow">Mazgas</div><h1 data-hero style="view-transition-name:hero">${k.name}</h1><div class="muted small">${k.use}</div></header><div id="kbody"></div></article></div>`,fromEl,()=>{renderKnot();startKnotTimer()});
}
function renderKnot(){
  if(!KN)return;const k=KNOTS[KN.i],art=KNOT_ART[k.name]||[];const n=k.steps.length;
  const sc=art[Math.min(KN.s,art.length-1)]||'';
  $('#kbody').innerHTML=`<div class="kstageBox">${sc}<div class="kprog">${k.steps.map((_,j)=>`<button data-act="knotGo" data-v="${j}" class="kdot ${j===KN.s?'on':j<KN.s?'done':''}" aria-label="Žingsnis ${j+1}"></button>`).join('')}</div></div>
   <div class="kcap" key="${KN.s}"><div class="knum">${KN.s+1}<span>/${n}</span></div><p>${k.steps[KN.s]}</p></div>
   <div class="row kctl"><button class="btn" data-act="knotStep" data-v="-1" ${KN.s===0?'disabled':''}>Atgal</button>
   <button class="btn" data-act="knotPlay">${KN.play?'Sustabdyti':'Leisti'}</button>
   <button class="btn primary" data-act="knotStep" data-v="1" ${KN.s===n-1?'disabled':''}>Toliau</button></div>`;
}
function startKnotTimer(){clearInterval(knotTimer);knotTimer=setInterval(()=>{if(!KN||!KN.play)return;const n=KNOTS[KN.i].steps.length;if(KN.s<n-1){KN.s++;renderKnot()}else{KN.play=false;renderKnot()}},3600)}

/* ---------- Daugiau: meniu su vizualais ---------- */
VIEWS.more=function(){
  if(S.more&&VIEWS[S.more])return `<button class="btn sm" data-act="more" data-v="">← Daugiau</button>`+VIEWS[S.more]();
  const rows=[['waters','Vandenys',S.waters.length+' telkinių','Teisinis statusas, bilietai, ežerų duomenys'],['gear','Spinta',S.gear.length+' daiktų','Masalai ir įranga, kurią brifas gali rekomenduoti'],
    ['stats','Analizė',S.trips.length+' žvejybų','Statistika ir hipotezės iš šaltinių'],['guide','Žinynas','','Šaltiniai, taisyklės, metodika']];
  return `<div class="hero"><div class="eyebrow">Daugiau</div><h1>Žinios ir nustatymai</h1></div>
  <div class="duo"><button class="tile-big" data-act="more" data-v="fishes" ${fishWater('lydeka')}><div class="tart">${fishSVG('lydeka')}</div><b>Žuvys</b><span>7 rūšys</span></button>
   <button class="tile-big knots" data-act="more" data-v="knots"><div class="tart">${KNOT_ART['Uni'][1].replace('class="kscene"','class="kscene still"')}</div><b>Mazgai</b><span>${KNOTS.length} mazgai</span></button></div>
  <div class="list">${rows.map(([k,n,c,d])=>`<button class="item more" data-act="more" data-v="${k}"><div class="grow"><div class="row between" style="flex-wrap:nowrap"><b>${n}</b><span class="muted small">${c}</span></div><div class="muted small">${d}</div></div></button>`).join('')}</div>
  <button class="btn sm" data-act="exportData" style="align-self:flex-start">Eksportuoti duomenis</button>`};

/* vandens bangos */
const _wp=y=>'M0 '+y+' '+Array.from({length:16},(_,i)=>(i===0?'Q50 '+(y-16)+' 100 '+y:'T'+(i+1)*100+' '+y)).join(' ')+' V40 H0Z';
const wavesSVG=(cls='')=>`<div class="wavebox ${cls}"><svg class="waves" viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="${_wp(20)}"/><path class="w2" d="${_wp(26)}"/></svg></div>`;
