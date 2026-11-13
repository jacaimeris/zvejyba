/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return isNaN(n)?null:n};
const fmt1=n=>n==null?'–':(Math.round(n*10)/10).toString().replace('.',',');
const MONTHS=['sausis','vasaris','kovas','balandis','gegužė','birželis','liepa','rugpjūtis','rugsėjis','spalis','lapkritis','gruodis'];
function toast(m,ms=3500){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast._t);toast._t=setTimeout(()=>t.style.display='none',ms)}
function md(s){let h=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.split('\n').map(l=>/^#{1,4} /.test(l)?'<h4>'+l.replace(/^#{1,4} /,'')+'</h4>':l.replace(/^[-*] /,'• ')).join('\n');return h}

/* ---------- constants ---------- */
const CATS={
 rod:{n:'Meškerės',one:'Meškerė',types:['Spiningas','Ultralight spiningas','Jig / gumytės','Trolingo','Žieminė','Kita'],size:'Ilgis',weight:'Metimo svoris (g)'},
 reel:{n:'Ritės',one:'Ritė',types:['Bekotė','Multiplikatorius','Žieminė','Kita'],size:'Dydis (pvz. 2500)',weight:'Perdavimo skaičius'},
 line:{n:'Valai ir pavadėliai',one:'Valas',types:['Pintas','Monofilis','Fluorokarbonas','Plieninis pavadėlis','Kita'],size:'Skersmuo (mm)',weight:'Testas (kg / lb)'},
 lure:{n:'Masalai',one:'Masalas',types:['Vobleris','Gumytė','Šadas','Blizgė','Sukriukė','Spinnerbait','Paviršinis','Jig galvutė','Kita'],size:'Ilgis (cm)',weight:'Svoris (g)'},
 terminal:{n:'Kabliukai ir smulkmenos',one:'Smulkmena',types:['Kabliukas','Offset kabliukas','Trigubas','Sukutis','Karabinas','Lenktas žiedas','Pasvaras','Kita'],size:'Dydis',weight:'Svoris (g)'},
 ice:{n:'Žieminė įranga',one:'Žieminis daiktas',types:['Mormyška','Balansyras','Žieminė blizgutė','Žieminė meškerė','Žieminė ritė','Grąžtas','Kita'],size:'Dydis / ilgis',weight:'Svoris (g)'},
 boat:{n:'Valtis',one:'Valtis',types:['Guminė','PVC','Aliuminio','Kita'],size:'Ilgis (m)',weight:'Svoris / talpa'},
 motor:{n:'Varikliai',one:'Variklis',types:['Elektrinis','Benzininis','Kita'],size:'Galia (AG / lb thrust)',weight:'Svoris (kg)'},
 sonar:{n:'Echolotai',one:'Echolotas',types:['Echolotas','Su GPS','Kita'],size:'Ekrano dydis',weight:'Daviklis'},
 tool:{n:'Įrankiai ir aksesuarai',one:'Daiktas',types:['Žnyplės','Graibštas','Svarstyklės','Matuoklė','Dėžė','Kita'],size:'Dydis',weight:'Svoris'},
 clothing:{n:'Apranga',one:'Apranga',types:['Kostiumas','Batai','Liemenė','Kita'],size:'Dydis',weight:'—'},
 other:{n:'Kita',one:'Daiktas',types:['Kita'],size:'Dydis',weight:'Svoris'}
};
const TRIPTYPES=['Spiningas iš kranto','Spiningas iš valties','Trolingas','Žieminė žvejyba'];
const SPECIES=['Lydeka','Ešerys','Starkis','Šamas','Upėtakis','Šapalas','Vėgėlė','Kuoja','Karšis','Kita'];
const DIRS=['','Š','ŠR','R','PR','P','PV','V','ŠV'];
const SKY=['','Giedra','Dalinai debesuota','Debesuota','Lietus','Sniegas','Rūkas'];
const TREND=['','Kyla','Stabilus','Krenta'];

/* ---------- state & data layer ---------- */
const TARGETS=['Lydeka','Ešerys','Starkis','Šamas','Vėgėlė','Kuoja','Karšis'];
const S={tab:'today',more:'',activeTrip:null,gear:[],trips:[],waters:[],hyp:[],briefs:[],forecasts:[],dossiers:[],cat:'all',q:'',sub:'fish',fish:'lydeka',gsub:'src',
  plan:{date:today(),time:'',end:'',type:TRIPTYPES[0],waterId:'',species:['Lydeka'],recent:'',temp:'',pressure:'',trend:'',wind:'',dir:'',sky:'',wtemp:''},
  brief:null,_used:new Set(),out:{},dbOK:null};
let db=null;
const OWNED=['gear','trips','briefs','hyp'],PEOPLE=['Arnas','Rokas'];const ALL={};
try{S.who=localStorage.getItem('zz_who')||''}catch(e){S.who=''}
if(!PEOPLE.includes(S.who))S.who='';
const COLL=['gear','trips','waters','hyp','briefs','forecasts','dossiers'];

function norm(d){const x=typeof d.data==='function'?d.data():(d.data&&typeof d.data==='object'?d.data:d);return {...x,id:d.id||x.id}}
function rows(s){if(!s)return[];if(Array.isArray(s))return s.map(norm);const out=[];if(s.docs)s.docs.forEach(d=>out.push(norm(d)));else if(s.forEach)s.forEach(d=>out.push(norm(d)));return out}
function rawColl(c){return c==='trips'?[...S.trips,...(S.activeTrip?[S.activeTrip]:[])]:[...S[c]]}
function setColl(c,list){if(c==='trips'){S.activeTrip=list.find(t=>t.active)||null;S.trips=list.filter(t=>!t.active)}else S[c]=list}
async function initDb(){
  try{db=await (window.claude&&claude.use?claude.use('db'):null)}catch(e){db=null}
  if(!db){S.dbOK=false;$('#sync').textContent='tik šiam seansui';renderAll();return}
  S.dbOK=true;$('#sync').textContent='saugoma';
  COLL.forEach(c=>{try{db.collection(c).onSnapshot(s=>{setColl(c,rows(s));renderLive()},()=>{})}catch(e){}});
  setTimeout(renderAll,50);
}
async function save(c,o){
  o.id=o.id||uid();if(OWNED.includes(c)&&!o.owner)o.owner=S.who||'Arnas';o.updated=Date.now();if(!o.created)o.created=o.updated;
  const clean=JSON.parse(JSON.stringify(o));
  if(db){try{await db.doc(c+'/'+clean.id).set(clean)}catch(e){toast('Nepavyko išsaugoti: '+(e.message||e));return false}}
  else{const a=rawColl(c);const i=a.findIndex(x=>x.id===clean.id);if(i>=0)a[i]=clean;else a.push(clean);setColl(c,a);renderLive()}
  return clean;
}
async function removeDoc(c,id){
  if(db){try{await db.doc(c+'/'+id).delete()}catch(e){toast('Nepavyko ištrinti');return}}
  else{setColl(c,rawColl(c).filter(x=>x.id!==id));renderLive()}
}
/* ---------- AI ---------- */
async function ai(prompt,images){
  const s=await (window.claude&&claude.use?claude.use('sample'):null);
  if(!s)throw new Error('Claude funkcija šiame lange nepasiekiama. Atidaryk puslapį per claude.ai.');
  const opts={modelTier:'default',cache:false};
  if(images&&images.length){let lim=null;try{lim=await s.limits()}catch(e){}
    if(!lim||!lim.images)throw new Error('Nuotraukų atpažinimas šiame lange nepasiekiamas.');opts.images=images}
  const r=await s(prompt,opts);return r.text||'';
}
function parseJSON(t){const a=Math.min(...['[','{'].map(c=>{const i=t.indexOf(c);return i<0?1e9:i}));
  const b=Math.max(t.lastIndexOf(']'),t.lastIndexOf('}'));if(a>=1e9||b<0)throw new Error('Atsakymas be duomenų, bandyk dar kartą.');return JSON.parse(t.slice(a,b+1))}

/* ---------- derived data ---------- */
const gl=g=>[g.brand,g.model,g.name].filter(Boolean).join(' ')||g.type||'Daiktas';
function glFull(g){return gl(g)+[g.size,g.weight,g.color].filter(Boolean).map(x=>' '+x).join('')}
function dur(t){if(!t.start||!t.end)return 0;const [a,b]=[t.start,t.end].map(x=>{const[h,m]=x.split(':').map(Number);return h*60+(m||0)});let d=b-a;if(d<0)d+=1440;return d/60}
function moon(ds){const d=new Date(ds+'T12:00:00Z');const syn=29.530588853;let a=((d-Date.UTC(2000,0,6,18,14))/864e5)%syn;if(a<0)a+=syn;
  const names=['Jaunatis','Jaunas, auga','Pirmas ketvirtis','Auga','Pilnatis','Senėja','Paskutinis ketvirtis','Senas, senėja'];
  return {name:names[Math.round(a/syn*8)%8],ill:Math.round((1-Math.cos(2*Math.PI*a/syn))/2*100)}}
function lureLabel(c){const g=S.gear.find(x=>x.id===c.lureId);return g?gl(g):(c.lureText||'')}
const wline=w=>w?[w.temp!==''&&w.temp!=null?w.temp+'°C':'',w.pressure?w.pressure+' hPa'+(w.trend?' ('+w.trend.toLowerCase()+')':''):'',w.wind?(w.dir||'')+' '+w.wind+' m/s':'',w.sky].filter(Boolean).join(' · '):'';
function tripsFish(){return S.trips.reduce((a,t)=>a+(t.catches||[]).length,0)}

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

/* ---------- brifas ---------- */
const LVL={stop:['draudimas','bad'],warn:['patikrinti','warn'],ok:['galima','good'],info:['taisyklė','']};
function legalHTML(items){
  const order=['stop','warn','ok','info'];const stops=items.filter(i=>i.lvl==='stop');
  const head=stops.length?`<div class="banner" style="border-left-color:var(--bad)"><b>Yra draudimų (${stops.length}).</b> Nežvejok, kol jų nepatikrinai.</div>`:'';
  return head+order.flatMap(l=>items.filter(i=>i.lvl===l)).map(i=>`<div class="lrow"><span class="pill ${LVL[i.lvl][1]}" ${i.lvl==='info'?'style="background:var(--muted)"':''}>${LVL[i.lvl][0]}</span><span>${esc(i.text)} ${i.src?srcChip(i.src):''}</span></div>`).join('')}
function condHTML(rows){
  if(!rows.length)return '<div class="muted small">Įvesk datą, pradžios laiką ir prognozę, tada pamatysi, ką apie jas sako šaltiniai.</div>';
  const st={'+':['palaiko','good'],'-':['nepalankus','bad'],'0':['neutralu',''],'info':['info','']};
  return rows.map(r=>`<div class="lrow"><span class="pill ${st[r.state][1]}" ${!st[r.state][1]?'style="background:var(--muted)"':''}>${st[r.state][0]}</span><span><b>${esc(r.e.f)}.</b> ${esc(r.txt)} <span class="muted small">Šaltinio teiginys: ${esc(r.e.claim)} (pasitikėjimas ${r.e.conf}).</span> ${srcChips(r.e.src)}</span></div>`).join('')}
function recHTML(r){
  if(!r)return '<div class="muted small">Masalų ir sistemos rekomendacija dar neparuošta.</div>';
  if(r.error)return `<div class="banner">${esc(r.error)}</div>`;
  const lab=id=>{const g=S.gear.find(x=>x.id===id);return g?glFull(g):''};
  const basis=x=>{const ev=(x.evid||[]).filter(e=>EVID.some(v=>v.id===e));
    const chips=ev.map(e=>{const v=EVID.find(q=>q.id===e);return `<span class="src g-${v.conf==='vidutinis'?'A':'C'}" title="${esc(v.claim)}">${e}</span> ${srcChips(v.src)}`}).join(' ');
    const b=x.basis==='pagavimai'?'<span class="pill" style="background:var(--muted)">tavo pagavimai</span>':x.basis==='metodinis'?'<span class="pill" style="background:var(--muted)">metodinis sprendimas, ne literatūra</span>':'';
    const none=!ev.length&&!b?'<span class="pill warn">nepatvirtinta šaltiniu</span>':'';return `<div class="row" style="margin-top:6px">${chips}${b}${none}</div>`};
  const roleN={'pagrindinis':'Pagrindinis','atsarginis':'Atsarginis','tyrimui':'Duomenims rinkti'};
  return `${(r.sets||[]).map(x=>{const nm=lab(x.lureId)||x.lureText||'?';const inGear=!!lab(x.lureId);
     const gg=S.gear.find(y=>y.id===x.lureId);return `<div class="card">${gg?lureShow(gg,'lureimg big'):''}<div class="row between"><b>${esc(nm)}</b><span class="row"><span class="badge">${roleN[x.role]||esc(x.role||'')}</span>${inGear?'':'<span class="pill warn">nėra spintoje</span>'}</span></div>
     ${x.target?`<div class="small muted">Tikslas: ${esc(x.target)}</div>`:''}
     ${x.presentation?`<div class="small">${esc(x.presentation)}</div>`:''}
     <div class="small" style="margin-top:4px">${esc(x.why||'')}</div>
     <div class="small muted">Pasitikėjimas: ${esc(x.confidence||'žemas')}</div>${basis(x)}</div>`}).join('')}
   ${(r.rig||[]).length?`<h3>Sistema</h3>`+r.rig.map(x=>`<div class="card"><b>${esc(x.item||'')}</b><div class="small" style="margin-top:4px">${esc(x.why||'')}</div>${basis(x)}</div>`).join(''):''}
   ${(r.gaps||[]).length?`<h3>Ko trūksta spintoje šiai išvykai</h3><div class="card">${r.gaps.map(g=>`<div class="small">• ${esc(g)}</div>`).join('')}</div>`:''}
   ${(r.unknowns||[]).length?`<h3>Ko nežinau</h3><div class="card">${r.unknowns.map(g=>`<div class="small">• ${esc(g)}</div>`).join('')}</div>`:''}`}
function verdictHTML(b){
  const stops=b.legal.filter(i=>i.lvl==='stop'),warns=b.legal.filter(i=>i.lvl==='warn');
  const cls=stops.length?'bad':warns.length?'warn':'good';
  const title=stops.length?'Yra draudimų':warns.length?'Galima, bet patikrink':'Teisiškai kliūčių nerasta';
  const sub=stops.length?'Nežvejok, kol jų nepatikrinai.':warns.length?'Šie dalykai priklauso nuo tavo bilieto ar vandens statuso.':'Pagal įvestus duomenis ir AAD atmintines.';
  const lines=(stops.length?stops:warns).slice(0,3);
  return `<div class="verdict ${cls}"><div class="vt">${title}</div><div class="small">${sub}</div>
   ${lines.map(i=>`<div class="vl">${esc(i.text)} ${i.src?srcChip(i.src):''}</div>`).join('')}
   <details><summary>Visos taisyklės (${b.legal.length})</summary><div class="small muted" style="margin:6px 0">Skaičiuojama taisyklėmis iš AAD atmintinių, ne dirbtiniu intelektu.</div>${legalHTML(b.legal)}</details></div>`}
function recSumHTML(b){
  if(b.loading)return '<div class="panel muted">Renku masalus iš tavo spintos…</div>';
  const r=b.rec;if(!r)return '';
  if(r.error)return `<div class="banner">${esc(r.error)}</div>`;
  const lab=id=>{const g=S.gear.find(x=>x.id===id);return g?glFull(g):''};
  const roleN={'pagrindinis':'pagrindinis','atsarginis':'atsarginis','tyrimui':'duomenims'};
  const sets=(r.sets||[]);
  return `<div class="panel"><h3>Ką imti</h3>${sets.map(x=>{const nm=lab(x.lureId)||x.lureText||'?';
    const gg=S.gear.find(y=>y.id===x.lureId);return `<div class="pick" style="display:flex;gap:12px;align-items:center">${gg?lureShow(gg,'lureimg'):''}<div style="flex:1;min-width:0"><div class="row between" style="flex-wrap:nowrap"><b>${esc(nm)}</b><span class="badge">${roleN[x.role]||esc(x.role||'')}</span></div>
    <div class="small muted clamp">${esc(x.why||'')}</div></div></div>`}).join('')||'<div class="muted small">Rekomendacijos nėra.</div>'}
   ${(r.rig||[]).length?`<h3 style="margin-top:14px">Sistema</h3>${r.rig.map(x=>`<div class="pick"><b>${esc(x.item||'')}</b></div>`).join('')}`:''}
   ${(r.gaps||[]).length?`<div class="small" style="margin-top:12px"><span class="pill warn">spintoje trūksta</span> ${r.gaps.map(esc).join('; ')}</div>`:''}</div>`}
function briefHTML(b){
  return `${verdictHTML(b)}${fcHTML(b)}${bathyHTML(b)}<div id="recSum">${recSumHTML(b)}</div>${extrasHTML(b)}${dosHTML(b)}
  ${b.rec&&!b.rec.error?`<details class="fold"><summary>Kodėl šie masalai, pagrindas ir ko nežinau</summary><div class="list" style="margin-top:10px">${recHTML(b.rec)}</div></details>`:''}
  <details class="fold"><summary>Sąlygos pagal šaltinius</summary><div style="margin-top:8px">${condHTML(b.cond)}</div></details>
`}

function briefPrompt(p,w,cond){
  const cats=/žiemin/i.test(p.type)?['ice','lure','terminal','line']:['lure','terminal','line'];
  const ev=EVID.map(e=>`${e.id} [${e.f}; pasitikėjimas ${e.conf}; taikomumas: ${e.ap}] ${e.claim} (šaltiniai ${e.src.join(',')||'nėra'})`).join('\n');
  return `Tu padedi ${S.who==="Rokas"?"Rokui":"Arnui"} paruošti žvejybos brifo dalį "masalų komplektas ir sistema". Grąžink TIK JSON, be kito teksto.
GRIEŽTOS TAISYKLĖS:
1. Masalus renkiesi TIK iš žemiau pateiktos spintos, naudok jų id. Jei reikiamo nėra, įrašyk į "gaps" (tipas ir parametrai, ne prekės ženklas).
2. Kiekvienas pasirinkimas privalo turėti "evid" (įrodymų ID iš sąrašo žemiau) arba "basis". Jei įrodymo nėra, "evid":[] ir nieko nerašyk apie veiksmingumą.
3. Konkretaus masalo veiksmingumui (spalva, tipas, dydis) literatūros įrodymų NĖRA (EV13). Todėl masalų parinkimo pagrindas yra: "pagavimai" (jo paties pagavimai šiame vandenyje, žemiau) arba "metodinis" (komplektas turi apimti skirtingus pateikimo būdus: skirtingą greitį ir gylį, kad jo duomenys sužinotų daugiau). Neteigk, kad konkretus masalas "kimba geriau" be duomenų.
4. Nespėliok gylių, vedimo greičių ar sezoninių taisyklių, kurių nepagrindžia pateikti įrodymai. Jei nežinai, įrašyk į "unknowns".
5. "confidence" yra "vidutinis" tik jei evid įrašo pasitikėjimas vidutinis; visais kitais atvejais "žemas".
6. Sistemai (rig) lydekai ir kietiesiems masalams naudok EV8. Atsižvelk į teisinius apribojimus: iš viso iki 6 kabliukų, gumos iki 40 cm, jei ledas ir žvejoji su žuvele, tik iki 2 įrankių su žuvele.
7. Rekomenduok 5-7 masalų (jei spintoje tiek yra), prioriteto tvarka: pirmas "pagrindinis", toliau "atsarginis", "tyrimui" (kitoks pateikimas). Skirtingi masalai turi apimti skirtingus gylius/greičius/siluetus/kontrastą; pagal prognozę (debesuotumas, matomumas, vėjas, vandens drumstumas) pasirink kontrastingesnius ar natūralesnius, bet aiškiai pažymėk, kad tai metodinis sprendimas, o ne įrodymas (EV13). Jei tikslas ešeriai, o lydeka nurodyta kaip atsarginė, 1-2 masalus parink lydekai iš lydekinio komplekto ir pažymėk kaip plano B dalį (target: Lydeka).
8. SPALVA: kiekvienam pasirinkimui nurodyk KONKREČIĄ spalvą iš spintos (pagal spalvos lauką) ir kodėl ji tinka šioms sąlygoms: debesuota/prastas matomumas/drumsčiau/silpna šviesa → tamsesnis siluetas arba ryškesnis kontrastas; giedra ir skaidru → natūralios, permatomos; nežinai vandens skaidrumo → sakyk tai ir pasiūlyk bent vieną natūralią ir vieną kontrastingą. Tai bendra žvejų praktika, ne įrodymas (basis "metodinis"), nežadėk procentų ir pranašumo. Jei spintoje yra kelios to paties modelio skirtingų spalvų gumytės, aiškiai nurodyk, kuri iš jų pirma.
9. Atsižvelk į meškerės metimo svorį (pvz. UL 1-7 g): gumytė turi turėti jai tinkamą svarelį/jig galvutę/kabliuką iš spintos; jei nėra, įrašyk į "gaps".
SCHEMA: {"sets":[{"role":"pagrindinis|atsarginis|tyrimui","lureId":"id iš spintos arba ''","lureText":"jei lureId tuščias","target":"rūšis","presentation":"trumpai, tik jei pagrįsta","why":"1-2 sakiniai","evid":["EV.."],"basis":"pagavimai|metodinis|''","confidence":"žemas|vidutinis"}],"rig":[{"item":"","why":"","evid":["EV8"],"basis":""}],"gaps":[""],"unknowns":[""],"retrieves":["kaip vesti pagrindinius masalus: lt, trumpai, tik jei pagrįsta; kitaip pažymėk (nepatvirtinta)"],"windPlan":"kur pradėti ir kaip kasti, remiantis DOSJE ir vėjo kryptimi; aiškiai atskirk žinomą nuo išvados","planB":"kada ir kaip pereiti prie lydekos / kitos vietos","tips":["papildomi patarimai iš tavęs; kiekvienas su (šaltinis/išvada/nepatvirtinta)"]}

IŠVYKA: ${p.date} ${p.time||'?'}-${p.end||'?'}, ${p.type}, tikslas: ${(p.species||[]).join(', ')||'nenurodyta'}.
VANDUO: ${w?`${w.name}, ${w.kind||''}, ${w.area||'?'} ha, didž. gylis ${w.maxDepth||'?'} m, vid. gylis ${w.meanDepth||'?'} m. ${w.notes||''}`:'nepasirinktas'}
JO PAGAVIMAI ŠIAME VANDENYJE: ${w?waterHistory(w):'—'}
PROGNOZĖ (programos įvestis): oras ${p.temp||'?'}°C, vėjas ${p.dir||''} ${p.wind||'?'} m/s, ${p.sky||''}, vandens temp. ${p.wtemp||'?'}°C. Žvejotas paskutines 2 d.: ${p.recent||'nežinoma'}.
PROGNOZĖ IŠ DUOMENŲ BAZĖS (Open-Meteo, Claude gauta):\n${fcText(p,w)}
TELKINIO DOSJĖ (Claude surinkta; faktai su šaltiniais, vietos - išvados):\n${dosText(w)}
BATIMETRIJA (LEU planas; vietos apskaičiuotos iš reljefo):
${bathyText(w,p)}
SĄLYGŲ VERTINIMAS (programos): ${cond.map(c=>c.ev+':'+c.state).join(', ')||'—'}
ĮRODYMAI:\n${ev}
SPINTA (id | daiktas):\n${gearSummary(cats)}`}

async function briefGo(btn){
  const p={...S.plan,species:[...S.plan.species]};
  if(!p.waterId){toast('Pirmiausia pasirink vandenį');return}
  if(!p.date)p.date=today();
  const w=waterById(p.waterId);
  prefillFromFc(p,w);
  const br={id:(S.brief&&S.brief.id)||uid(),p,water:w,legal:legal(w,p.type,p.date,p.species),cond:condEval(p,w),rec:null,loading:true,ts:Date.now()};
  S.brief=br;S.planOpen=false;renderMain();window.scrollTo(0,0);
  try{
    const t=await ai(briefPrompt(p,w,br.cond));const r=parseJSON(t);
    r.sets=(r.sets||[]).map(x=>({...x,lureId:S.gear.some(g=>g.id===x.lureId)?x.lureId:'',evid:(x.evid||[]).filter(e=>EVID.some(v=>v.id===e))}));
    r.rig=(r.rig||[]).map(x=>({...x,evid:(x.evid||[]).filter(e=>EVID.some(v=>v.id===e))}));
    br.rec=r;
  }catch(e){br.rec={error:e.message||String(e)}}
  br.loading=false;
  if(S.brief===br&&S.tab==='today')renderMain();
  if(br.rec&&!br.rec.error){const slim={date:p.date,time:p.time,end:p.end,type:p.type,waterId:p.waterId,species:p.species,recent:p.recent,wx:{temp:p.temp,wind:p.wind,dir:p.dir,sky:p.sky,wtemp:p.wtemp,pressure:p.pressure},
      recLures:(br.rec.sets||[]).map(x=>({role:x.role,lureId:x.lureId,lureText:x.lureText,evid:x.evid,basis:x.basis,confidence:x.confidence})),legalStops:br.legal.filter(i=>i.lvl==='stop').map(i=>i.text)};
    await save('briefs',{...slim,id:br.id,p,rec:br.rec,status:'planned'})}
}

/* ---------- modal ---------- */
let M=null; // {kind, data}
function openModal(html){const m=$('#modal');m.innerHTML=`<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;m.hidden=false;document.body.style.overflow='hidden'}
function closeModal(){M=null;$('#modal').hidden=true;$('#modal').innerHTML='';document.body.style.overflow=''}

/* gear batch */
function gfld(i,f,label,v,extra=''){return `<label class="f">${label}<input data-g="${i}.${f}" value="${esc(v)}" ${extra}></label>`}
function gearFormHTML(g,i){const c=CATS[g.cat]||CATS.other;
  return `<div class="card list" data-gi="${i}"><div class="row between">${g.thumb?`<img class="thumb" src="${g.thumb}" alt="">`:''}<div class="grow"></div>${g.confidence&&g.confidence!=='high'?`<span class="pill warn">${g.confidence==='low'?'netikra':'patikrink'}</span>`:''}<button class="btn sm danger" data-act="gdrop" data-v="${i}">Išmesti</button></div>
  <div class="grid2"><label class="f">Kategorija<select data-g="${i}.cat" data-recat="1">${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${k===g.cat?' selected':''}>${v.n}</option>`).join('')}</select></label>
  <label class="f">Tipas<input data-g="${i}.type" list="dl_${g.cat}" value="${esc(g.type)}"><datalist id="dl_${g.cat}">${c.types.map(t=>`<option>${t}</option>`).join('')}</datalist></label>
  ${gfld(i,'brand','Gamintojas',g.brand)}${gfld(i,'model','Modelis',g.model)}${gfld(i,'size',c.size,g.size)}${gfld(i,'weight',c.weight,g.weight)}
  ${gfld(i,'color','Spalva',g.color)}${gfld(i,'qty','Kiekis',g.qty||1,'inputmode="numeric"')}</div>
  <label class="f">Specifikacijos (veikimas, gylis, galia, perdavimai)<input data-g="${i}.specs" value="${esc(g.specs)}"></label>
  <label class="f">Pastabos (kur pirkta, kaina, būklė)<input data-g="${i}.notes" value="${esc(g.notes)}"></label></div>`}
function renderBatch(){const b=M.data;
  openModal(`<div class="bar"><h3>${b.length===1&&b[0].id?'Redaguoti daiktą':'Nauji daiktai spintai'}</h3><button class="btn sm" data-act="mclose">Uždaryti</button></div>
  ${b.map(gearFormHTML).join('')||'<div class="muted">Nėra daiktų.</div>'}
  <div class="row"><button class="btn" data-act="gphoto2">Pridėti nuotrauką</button><button class="btn" data-act="gmore">Dar vienas ranka</button>${b.length===1&&b[0].id?'<button class="btn danger" data-act="gdel">Ištrinti iš spintos</button>':''}</div>
  <button class="btn primary" data-act="gsave" ${b.length?'':'disabled'}>Išsaugoti ${b.length>1?b.length+' daiktus':''}</button>`)}
function newGear(o={}){return {cat:'lure',type:'',brand:'',model:'',size:'',weight:'',color:'',qty:1,specs:'',notes:'',...o}}

async function prep(file){
  const img=await new Promise((res,rej)=>{const u=URL.createObjectURL(file);const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Nepavyko atidaryti nuotraukos'));i.src=u});
  const sc=mx=>{const r=Math.min(1,mx/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c};
  const blob=await new Promise(r=>sc(1400).toBlob(r,'image/jpeg',.85));
  return {blob,thumb:sc(160).toDataURL('image/jpeg',.7)}}
async function recognize(files){
  const found=[];
  for(let n=0;n<files.length;n++){
    toast(`Atpažįstu ${n+1} iš ${files.length}…`,60000);
    const {blob,thumb}=await prep(files[n]);
    const t=await ai(`Tu atpažįsti žvejybos įrangą nuotraukoje (pakuotė, masalas, meškerė, ritė, valas, valtis, variklis ir t.t.). Perskaityk visą tekstą ant pakuotės. Grąžink TIK JSON masyvą, be jokio kito teksto. Kiekvienas elementas:
{"cat":"rod|reel|line|lure|terminal|ice|boat|motor|sonar|tool|clothing|other","type":"lietuviškai, pvz. Vobleris, Gumytė, Blizgė, Pintas, Mormyška","brand":"","model":"","size":"ilgis cm / dydis / skersmuo, kaip parašyta","weight":"g ar kitas svoris, kaip parašyta","color":"spalva ar spalvos kodas","qty":1,"specs":"veikimas (plūduriuojantis/skęstantis), nardymo gylis, galia, testas ir kita, kas parašyta","notes":"","confidence":"high|medium|low"}
Jei nuotraukoje keli skirtingi daiktai, grąžink kiekvienam atskirą elementą. Jei lauko ant daikto nematyti, palik "" ir nespėliok. qty yra kiekis pakuotėje, jei matyti.`,[blob]);
    parseJSON(t).forEach(x=>found.push(newGear({...x,thumb})));
  }
  return found}
/* trip modal */
function newTrip(){return {date:today(),start:'',end:'',waterName:'',type:TRIPTYPES[0],recent:'',w:{temp:'',pressure:'',trend:'',wind:'',dir:'',sky:'',wtemp:'',clarity:'',level:'',ice:''},catches:[],misses:'',notes:'',rating:''}}
function setPath(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++)x=x[k[i]]=x[k[i]]||{};x[k[k.length-1]]=v}
function catchHTML(c,i){const lures=S.gear.filter(g=>['lure','ice'].includes(g.cat));
  return `<div class="catchrow"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">${c.thumb?`<img class="thumb big" src="${c.thumb}" alt="">`:''}
  <div class="grow list" style="gap:8px;min-width:0">
   <div class="grid2"><label class="f">Rūšis<select data-c="${i}.species">${SPECIES.map(s=>`<option${s===c.species?' selected':''}>${s}</option>`).join('')}</select></label>
   <label class="f">Masalas<select data-c="${i}.lureId"><option value="">${c.lureText?esc(c.lureText):'nenurodyta'}</option>${lures.map(g=>`<option value="${g.id}"${g.id===c.lureId?' selected':''}>${esc(glFull(g))}</option>`).join('')}</select></label></div>
   ${c.conf&&c.conf!=='high'?`<div class="small"><span class="pill warn">${c.conf==='low'?'atpažinimas netikras':'patikrink atpažinimą'}</span></div>`:''}
   <details><summary>Laikas, ilgis, pastaba</summary><div class="grid2" style="margin-top:8px">
   <label class="f">Laikas${c.exif?' (iš nuotraukos)':''}<input type="time" data-c="${i}.time" value="${esc(c.time)}"></label>
   <label class="f">Ilgis cm<input inputmode="decimal" data-c="${i}.len" value="${esc(c.len)}"></label>
   <label class="f">Masalas tekstu<input data-c="${i}.lureText" value="${esc(c.lureText)}"></label>
   <label class="f">Pastaba<input data-c="${i}.note" value="${esc(c.note)}"></label></div>
   ${c.lat?`<div class="small muted">Vieta iš nuotraukos: ${fmt1(c.lat)}, ${fmt1(c.lon)}</div>`:''}</details></div></div>
  <div class="row between"><label class="check"><input type="checkbox" data-c="${i}.released"${c.released?' checked':''}> Paleista</label><button class="btn sm danger" data-act="cdrop" data-v="${i}">Pašalinti</button></div></div>`}
function tripBody(){const T=M.data,w=T.w||{};const sel=(p,arr,v)=>`<select data-t="${p}">${arr.map(x=>`<option${x===v?' selected':''}>${esc(x)}</option>`).join('')}</select>`;
  const mo=T.date?moon(T.date):null;
  return `<label class="f">Vandens telkinys<input data-t="waterName" list="wl2" value="${esc(T.waterName)}"><datalist id="wl2">${S.waters.map(x=>`<option>${esc(x.name)}</option>`).join('')}</datalist></label>
  <div class="grid3"><label class="f">Data<input type="date" data-t="date" value="${esc(T.date)}"></label>
  <label class="f">Pradžia<input type="time" data-t="start" value="${esc(T.start)}"></label>
  <label class="f">Pabaiga<input type="time" data-t="end" value="${esc(T.end)}"></label></div>
  <div class="sect">Laimikiai</div>
  <div class="list" id="catches">${(T.catches||[]).map(catchHTML).join('')}</div>
  <div class="row"><button class="btn primary" data-act="cphoto">Pridėti nuotrauka</button><button class="btn" data-act="cadd">Be nuotraukos</button></div>
  <details class="fold"><summary>Sąlygos ir pastabos</summary><div class="list" style="margin-top:10px">
  <label class="f">Žvejybos tipas${sel('type',TRIPTYPES,T.type)}</label>
  <label class="f">Žvejota paskutines 2 dienas (kitų žvejų spaudimas)${sel('recent',['','daug','mažai','nežinau'],T.recent)}</label>
  <div class="grid2"><label class="f">Oras °C<input inputmode="decimal" data-t="w.temp" value="${esc(w.temp)}"></label>
  <label class="f">Vėjas m/s<input inputmode="decimal" data-t="w.wind" value="${esc(w.wind)}"></label>
  <label class="f">Vėjo kryptis${sel('w.dir',DIRS,w.dir)}</label>
  <label class="f">Dangus${sel('w.sky',SKY,w.sky)}</label>
  <label class="f">Vandens temp. °C<input inputmode="decimal" data-t="w.wtemp" value="${esc(w.wtemp)}"></label>
  <label class="f">Slėgis hPa<input inputmode="decimal" data-t="w.pressure" value="${esc(w.pressure)}"></label>
  <label class="f">Skaidrumas${sel('w.clarity',['','Skaidrus','Šiek tiek drumstas','Drumstas'],w.clarity)}</label>
  <label class="f">Ledo storis cm<input inputmode="decimal" data-t="w.ice" value="${esc(w.ice)}"></label></div>
  <div class="small muted" id="moonL">${mo?'Mėnulis: '+mo.name+', '+mo.ill+'%':''}</div>
  <label class="f">Papasakok laisvu tekstu${M.mic?' arba balsu':''}, užpildysiu sąlygas
   <textarea id="freeText" rows="2" placeholder="Pvz. vėjas pietvakarių 4, vanduo 7 laipsnių, ežeras tuščias"></textarea></label>
  <div class="row">${M.mic?'<button class="btn" id="micBtn" data-act="mic">Diktuoti</button>':''}<button class="btn" data-act="tripAI">Užpildyti sąlygas</button></div>
  <label class="f">Pastabos<textarea data-t="notes" rows="2">${esc(T.notes)}</textarea></label></div></details>`}
function renderTrip(){const T=M.data;openModal(`<div class="bar"><h3>${T.id?'Žvejyba':'Nauja žvejyba'}</h3><button class="btn sm" data-act="mclose">Uždaryti</button></div><div id="tripBody" class="list">${tripBody()}</div>
  <button class="btn primary" data-act="tsave">Išsaugoti</button>${T.id?'<button class="btn danger" data-act="tdel">Ištrinti žvejybą</button>':''}`)}

/* nuotraukos laimikis: EXIF + atpažinimas */
async function prepCatch(file){
  const buf=await file.arrayBuffer();const ex=parseExif(buf);
  const {blob}=await prep(file);
  const img=await new Promise((res,rej)=>{const u=URL.createObjectURL(file);const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Nepavyko atidaryti nuotraukos'));i.src=u});
  const r=Math.min(1,220/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return {blob,thumb:c.toDataURL('image/jpeg',.7),ex}}
async function addCatchPhotos(files){
  const T=M.data;const lures=S.gear.filter(g=>['lure','ice'].includes(g.cat));
  for(let n=0;n<files.length;n++){
    toast(`Skaitau nuotrauką ${n+1} iš ${files.length}…`,60000);
    const {blob,thumb,ex}=await prepCatch(files[n]);
    const c={time:ex.time||'',date:ex.date||'',exif:!!ex.time,species:'Lydeka',len:'',lureId:'',lureText:'',note:'',released:true,thumb,lat:ex.lat||null,lon:ex.lon||null,conf:'medium'};
    try{
      const t=await ai(`Nuotraukoje žvejo laimikis. Grąžink TIK JSON objektą be kito teksto: {"species":"${SPECIES.join('|')}","lureId":"id iš sąrašo, tik jei nuotraukoje aiškiai matomas būtent tas masalas","lureText":"jei masalas matomas, bet jo nėra sąraše, aprašyk trumpai (tipas, spalva, dydis); kitaip ''","len":"ilgis cm TIK jei nuotraukoje matyti matuoklė ar liniuotė su skale; kitaip ''","conf":"high|medium|low"}
Nespėliok: jei masalo nematyti, palik lureId ir lureText tuščius. Žuvies ilgio iš akies NEVERTINK.
Masalai spintoje (id = pavadinimas):\n${lures.map(g=>g.id+' = '+glFull(g)).join('\n')||'(nėra)'}`,[blob]);
      const o=parseJSON(t);if(SPECIES.includes(o.species))c.species=o.species;if(o.lureId&&lures.some(g=>g.id===o.lureId))c.lureId=o.lureId;else if(o.lureText)c.lureText=String(o.lureText);
      if(o.len)c.len=String(o.len);c.conf=['high','medium','low'].includes(o.conf)?o.conf:'medium';
    }catch(e){c.conf='low';c.note='Atpažinimas nepavyko: '+(e.message||e)}
    T.catches.push(c);
    if(c.date&&T.date&&c.date!==T.date)toast('Nuotraukos data '+c.date+' skiriasi nuo žvejybos datos '+T.date,6000);
  }
  toast('Pridėta '+files.length+'. Patikrink rūšį ir masalą.');
  if($('#catches'))$('#catches').innerHTML=T.catches.map(catchHTML).join('')}

/* vandens langas */
function waterModal(w){M={kind:'water',data:w};w.legal=w.legal||{};
  const f=(k,l,ph='')=>`<label class="f">${l}<input data-w="${k}" value="${esc(k.split('.').reduce((o,x)=>o&&o[x],w)??'')}" placeholder="${ph}"></label>`;
  const L=w.legal;
  openModal(`<div class="bar"><h3>${w.id?'Vanduo':'Naujas vanduo'}</h3><button class="btn sm" data-act="mclose">Uždaryti</button></div>
  <div class="grid2">${f('name','Pavadinimas')}<label class="f">Tipas<select data-w="kind">${['Ežeras','Upė','Tvenkinys','Kūdra','Kita'].map(x=>`<option${x===w.kind?' selected':''}>${x}</option>`).join('')}</select></label>
  ${f('region','Rajonas / vieta')}${f('area','Plotas ha')}${f('maxDepth','Didžiausias gylis m')}${f('meanDepth','Vidutinis gylis m')}${f('bottom','Dugnas / struktūra')}${f('coords','Koordinatės (lat, lon)','54.633432, 24.796452')}</div>
  <div class="sect">Teisinis statusas (nuo jo priklauso brifas)</div>
  <div class="grid2"><label class="f">Statusas<select data-w="legal.status">${['','neišnuomotas','išnuomotas','limituota','ekologinis','uždraustas'].map(x=>`<option value="${x}"${x===(L.status||'')?' selected':''}>${x||'nežinomas'}</option>`).join('')}</select></label>
  ${f('legal.tenant','Nuomininkas / leidimo davėjas')}${f('legal.ticket','Reikalingas dokumentas')}${f('legal.boat','Valtis ir variklis')}
  <label class="f">Statusas patikrintas<input type="date" data-w="legal.checked" value="${esc(L.checked||'')}"></label>
  <label class="f">Šaltinis<select data-w="legal.src">${['','A3','A5','B1','A6'].map(x=>`<option${x===(L.src||'')?' selected':''}>${x}</option>`).join('')}</select></label></div>
  <label class="check"><input type="checkbox" data-w="legal.verifiedPrimary"${L.verifiedPrimary?' checked':''}> Patikrinta pirminiame teisės akte ar ALIS</label>
  <label class="f">Dar reikia patikrinti<input data-w="legal.todo" value="${esc(L.todo||'')}"></label>
  <label class="f">Pastabos (kur ką pagavai, geriausios vietos, ko vengti)<textarea data-w="notes" rows="3">${esc(w.notes)}</textarea></label>
  <div class="sect">Teisinė suvestinė šiandien (spiningas)</div><div id="wLegal">${legalHTML(legal(w,'Spiningas iš kranto',today(),['Lydeka','Starkis']))}</div>
  <button class="btn primary" data-act="wsave">Išsaugoti</button>${w.id?'<button class="btn danger" data-act="wdel">Ištrinti</button>':''}`)}

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

/* ---------- events ---------- */
let pendingFiles='';
const nowHM=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  switch(a){
   case 'tab':S.tab=v;if(v==='more')S.more='';S._anim=true;renderAll();window.scrollTo(0,0);break;
   case 'more':S.more=v;S._anim=true;renderMain();window.scrollTo(0,0);break;
   case 'ptype':S.plan.type=v;if(/žiemin/i.test(v)){if(!S.plan.species.length)S.plan.species=['Ešerys']}renderMain();break;
   case 'fishOpen':fishStage(v,b);break;
   case 'stageClose':closeStage();break;
   case 'season':{const f=FISH.find(x=>x.id===b.dataset.f);const box=$('#seasonBox');if(f&&box){document.querySelectorAll('#segS button').forEach(x=>x.setAttribute('aria-pressed',x===b));box.classList.remove('swap');void box.offsetWidth;box.textContent=f.seasons[v];box.classList.add('swap')}break}
   case 'knotOpen':knotStage(+v,b);break;
   case 'knotStep':if(KN){KN.s=Math.max(0,Math.min(KNOTS[KN.i].steps.length-1,KN.s+ +v));KN.play=false;renderKnot()}break;
   case 'knotGo':if(KN){KN.s=+v;KN.play=false;renderKnot()}break;
   case 'knotPlay':if(KN){const n=KNOTS[KN.i].steps.length;if(!KN.play&&KN.s>=n-1)KN.s=0;KN.play=!KN.play;renderKnot()}break;
   case 'planClose':S.planOpen=false;renderMain();break;
   case 'planOpen':if(S.brief&&S.brief.p)S.plan={...S.plan,...S.brief.p,species:[...(S.brief.p.species||[])]};S.planOpen=true;renderMain();break;
   case 'startTrip':startTrip();break;
   case 'endTrip':endTrip(b);break;
   case 'catchNow':window._camTarget='active';$('#cfile').click();break;
   case 'cat':S.cat=v;renderMain();break;
   case 'gsub':S.sub=v;renderMain();break;
   case 'fish':S.fish=v;renderMain();window.scrollTo(0,0);break;
   case 'srcgo':{S.tab='more';S.more='guide';S.sub='src';renderAll();const el=$('#src_'+v);if(el){el.scrollIntoView({block:'center'});el.style.outline='2px solid var(--hot)'}break}
   case 'tgt':{const s=S.plan.species;const i=s.indexOf(v);i>=0?s.splice(i,1):s.push(v);b.setAttribute('aria-pressed',i<0);break}
   case 'mclose':closeModal();break;
   case 'gearPhoto':pendingFiles='new';$('#file').click();break;
   case 'gphoto2':pendingFiles='add';$('#file').click();break;
   case 'debriefGo':debriefGo(b,false);break;
   case 'debriefSkip':debriefGo(b,true);break;
   case 'newPlan':newPlan();break;
   case 'who':setWho(v);break;
   case 'gearBulk':bulkModal();break;
   case 'gearBulkGo':bulkGo(b);break;
   case 'quickGo':quickGo(b);break;
   case 'gearManual':M={kind:'gear',data:[newGear()]};renderBatch();break;
   case 'gmore':M.data.push(newGear());renderBatch();break;
   case 'gdrop':M.data.splice(+v,1);if(!M.data.length)closeModal();else renderBatch();break;
   case 'editGear':{const g=S.gear.find(x=>x.id===v);if(g){M={kind:'gear',data:[{...g}]};renderBatch()}break}
   case 'gsave':{b.disabled=true;let n=0;for(const g of M.data){if(!g.brand&&!g.model&&!g.type&&!g.name)continue;const r=await save('gear',{...g,qty:num(g.qty)||1});if(r)n++}closeModal();toast(n+' išsaugota');break}
   case 'gdel':if(confirm_('Ištrinti šį daiktą iš spintos?',b)){await removeDoc('gear',M.data[0].id);closeModal()}break;
   case 'newTrip':{const t=newTrip();const pl=S.plan;if(S.brief&&S.brief.p){t.date=S.brief.p.date||t.date;t.type=S.brief.p.type||t.type;t.waterName=S.brief.water?S.brief.water.name:'';t.recent=S.brief.p.recent||'';
       ['temp','wind','dir','sky','wtemp','pressure'].forEach(k=>{if(S.brief.p[k])t.w[k]=S.brief.p[k]})}
     M={kind:'trip',data:t,mic:false};initMic();renderTrip();break}
   case 'editTrip':{const t=S.trips.find(x=>x.id===v)||(S.activeTrip&&S.activeTrip.id===v?S.activeTrip:null);if(t){M={kind:'trip',data:JSON.parse(JSON.stringify({...newTrip(),...t,w:{...newTrip().w,...(t.w||{})}})),mic:false};initMic();renderTrip()}break}
   case 'now':{M.data[v]=nowHM();const i=$(`[data-t="${v}"]`);if(i)i.value=M.data[v];break}
   case 'cphoto':$('#cfile').click();break;
   case 'cadd':{const T=M.data;T.catches=T.catches||[];T.catches.push({time:'',species:'Lydeka',len:'',lureId:'',lureText:'',note:'',released:true,exif:false});$('#catches').innerHTML=T.catches.map(catchHTML).join('');break}
   case 'cdrop':M.data.catches.splice(+v,1);$('#catches').innerHTML=M.data.catches.map(catchHTML).join('');break;
   case 'tsave':{const T=M.data;if(!T.date){toast('Įrašyk datą');return}b.disabled=true;
     let w=S.waters.find(x=>normName(x.name)===normName(T.waterName));
     if(!w&&T.waterName&&T.waterName.trim()){w=await save('waters',{name:T.waterName.trim(),kind:'Ežeras'})}
     if(w){T.waterId=w.id;T.waterName=w.name;
       const g=(T.catches||[]).filter(c=>c.lat);if(!w.coords&&g.length){const lat=median(g.map(c=>c.lat)),lon=median(g.map(c=>c.lon));await save('waters',{...w,coords:lat.toFixed(6)+', '+lon.toFixed(6),coordsSrc:'nuotraukų EXIF'})}}
     const r=await save('trips',T);closeModal();if(r)toast('Žvejyba išsaugota');break}
   case 'tdel':if(confirm_('Ištrinti šią žvejybą?',b)){await removeDoc('trips',M.data.id);closeModal()}break;
   case 'newWater':waterModal({name:'',kind:'Ežeras',region:'',area:'',maxDepth:'',meanDepth:'',bottom:'',coords:'',notes:'',legal:{}});break;
   case 'editWater':{const w=S.waters.find(x=>x.id===v);if(w)waterModal(JSON.parse(JSON.stringify(w)));break}
   case 'wsave':{if(!M.data.name.trim()){toast('Įrašyk pavadinimą');return}await save('waters',M.data);closeModal();break}
   case 'wdel':if(confirm_('Ištrinti vandenį? Žvejybos išliks.',b)){await removeDoc('waters',M.data.id);closeModal()}break;
   case 'kbImport':{const k=KB_WATERS.find(x=>x.name===v);if(k){await save('waters',JSON.parse(JSON.stringify({...k,kbSeed:true})));toast(k.name+' įkeltas. Statusą prieš žvejybą patikrink ALIS.',6000)}break}
   case 'tripAI':tripFromText(b);break;
   case 'mic':toggleMic(b);break;
   case 'briefGo':briefGo(b);break;
   case 'hypSave':{const h=HYP.find(x=>x.id===v);const r=evalHyp(h,S.trips,S.waters);
     await save('hyp',{hid:h.id,date:today(),verdict:r.verdict,rr:r.res.ok?r.res.rr:null,lo:r.res.ok?r.res.lo:null,hi:r.res.ok?r.res.hi:null,fishA:r.fishA,fishB:r.fishB,hA:r.hA,hB:r.hB,nA:r.n.A,nB:r.n.B,labA:r.labA||'',labB:r.labB||''});toast(h.id+' įrašyta');break}
   case 'exportData':{const dump=JSON.stringify({exported:new Date().toISOString(),gear:S.gear.map(({thumb,...g})=>g),waters:S.waters,trips:S.trips.map(t=>({...t,catches:(t.catches||[]).map(({thumb,...c})=>c)})),hyp:S.hyp,briefs:S.briefs},null,1);
     openModal(`<div class="bar"><h3>Duomenų eksportas</h3><button class="btn sm" data-act="mclose">Uždaryti</button></div><textarea id="dump" rows="14" readonly style="width:100%;font-family:monospace;font-size:.75rem">${esc(dump)}</textarea><button class="btn primary" data-act="dumpCopy">Pažymėti viską ir kopijuoti</button><div class="small muted">Nuotraukų miniatiūros į eksportą neįtraukiamos.</div>`);break}
   case 'dumpCopy':{const t=$('#dump');t.select();try{await navigator.clipboard.writeText(t.value);toast('Nukopijuota')}catch(e){toast('Pažymėta, nukopijuok rankiniu būdu (Ctrl+C)')}break}
   case 'shopGo':runAI(b,'shopOut','shop',()=>SYS+`Išanalizuok mano spintą ir žurnalą ir pasakyk, ko galiu pirkti. Kiekvienai rekomendacijai privalai nurodyti PAGRINDĄ iš trijų: "taisyklės" (pvz. teisinis reikalavimas, smaigai ant ledo), "tavo duomenys" (pagal žurnalą ir spintą), arba "bendra praktika (nepatvirtinta)". Neišgalvok prekių: nurodyk tipą ir parametrus, ne modelį. Jei duomenų neužtenka, pasakyk. Žiemos ir saugos daiktus rašyk pirmiausia. Atsižvelk į teisinius apribojimus (iki 6 kabliukų, gumos iki 40 cm, ledui du smaigai).\n\nMANO SPINTA:\n${gearSummary()}\n\nŽURNALAS:\n${tripsSummary()}`);break;
  }
});
function confirm_(msg,btn){if(btn.dataset.sure==='1')return true;btn.dataset.sure='1';btn.textContent='Paspausk dar kartą';setTimeout(()=>{btn.dataset.sure='';},3000);return false}

document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('#stage').hidden)closeStage()});
document.addEventListener('input',e=>{
  const el=e.target;const val=el.type==='checkbox'?el.checked:el.value;
  if(el.id==='gq'){S.q=el.value;const list=S.gear.filter(g=>(S.cat==='all'||g.cat===S.cat)&&(!S.q||JSON.stringify(g).toLowerCase().includes(S.q.toLowerCase())));$('#gearList').innerHTML=gearListHTML(list);return}
  if(el.dataset.p){S.plan[el.dataset.p]=val;return}
  if(!M)return;
  if(el.dataset.g){const[i,f]=el.dataset.g.split('.');M.data[+i][f]=val;if(el.dataset.recat)renderBatch();return}
  if(el.dataset.t){setPath(M.data,el.dataset.t,val);if(el.dataset.t==='date'&&val){const m=moon(val);$('#moonL').textContent='· mėnulis: '+m.name+', '+m.ill+'%'}return}
  if(el.dataset.c){const[i,f]=el.dataset.c.split('.');M.data.catches[+i][f]=val;return}
  if(el.dataset.w){setPath(M.data,el.dataset.w,val);if(el.dataset.w.startsWith('legal.')||el.dataset.w==='kind'||el.dataset.w==='name'){const x=$('#wLegal');if(x)x.innerHTML=legalHTML(legal(M.data,'Spiningas iš kranto',today(),['Lydeka','Starkis']))}}
});
$('#file').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';if(!files.length)return;
  try{const items=await recognize(files);toast(items.length?'Atpažinta: '+items.length+'. Patikrink ir išsaugok.':'Nieko neatpažinau, įvesk ranka.');
    if(pendingFiles==='add'&&M&&M.kind==='gear')M.data.push(...items);else M={kind:'gear',data:items.length?items:[newGear()]};renderBatch()}
  catch(err){toast(err.message||String(err),6000)}
});
$('#cfile').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';if(!files.length)return;
  try{
    if(M&&M.kind==='trip'){await addCatchPhotos(files);return}
    if(S.activeTrip){const keep=M;M={kind:'trip',data:JSON.parse(JSON.stringify(S.activeTrip))};
      await addCatchPhotos(files);const r=await save('trips',M.data);M=keep;if(r&&!db){renderMain()}}
  }catch(err){toast(err.message||String(err),6000)}
});
/* aprašymas -> sąlygos */
async function tripFromText(btn){
  const txt=($('#freeText')||{}).value||'';if(txt.trim().length<5){toast('Parašyk ar padiktuok, kokios buvo sąlygos');return}
  btn.disabled=true;btn.textContent='Skaitau…';
  try{
    const t=await ai(`Iš žvejo aprašymo ištrauk žvejybos sąlygas. Grąžink TIK JSON objektą, be teksto. Nespėliok: ko neminėta, palik "". Šiandien ${today()}. Laikus rašyk 24 val. formatu HH:MM.
Schema: {"date":"YYYY-MM-DD","start":"","end":"","waterName":"","type":"${TRIPTYPES.join('|')}","recent":"daug|mažai|nežinau|","w":{"temp":"","pressure":"","wind":"","dir":"${DIRS.filter(Boolean).join('|')}","sky":"${SKY.filter(Boolean).join('|')}","wtemp":"","clarity":"Skaidrus|Šiek tiek drumstas|Drumstas","ice":""},"notes":""}
Vandenys: ${S.waters.map(w=>w.name).join(', ')||'(nėra)'}
Aprašymas: """${txt}"""`);
    const o=parseJSON(t);const T=M.data;
    ['date','start','end','waterName','type','recent','notes'].forEach(k=>{if(o[k])T[k]=String(o[k])});
    Object.entries(o.w||{}).forEach(([k,v])=>{if(v!==''&&v!=null)T.w[k]=String(v)});
    $('#tripBody').innerHTML=tripBody();toast('Užpildyta. Patikrink laukus ir išsaugok.');
  }catch(err){toast(err.message||String(err),6000);btn.disabled=false;btn.textContent='Užpildyti sąlygas iš aprašymo'}
}

/* dictation */
let dict=null;
async function initMic(){try{dict=await (window.claude&&claude.use?claude.use('dictation'):null)}catch(e){dict=null}
  if(dict&&M&&M.kind==='trip'){M.mic=true;const tb=$('#tripBody');if(tb){const ft=$('#freeText')?.value;tb.innerHTML=tripBody();if($('#freeText'))$('#freeText').value=ft||''}}}
function toggleMic(b){
  if(!dict)return;
  if(b.dataset.on==='1'){dict.stop();return}
  const ta=$('#freeText');let base=ta.value?ta.value+' ':'';
  dict.onPartial(({text})=>{ta.value=base+text});
  dict.onFinal(({text})=>{base+=text+' ';ta.value=base});
  dict.onState(({state})=>{b.dataset.on=state==='listening'?'1':'';b.textContent=state==='listening'?'Sustabdyti':'Diktuoti'});
  dict.start().catch(()=>toast('Mikrofono leidimas nesuteiktas, rašyk ranka.'));
}

/* ---------- boot ---------- */
renderAll();
initDb();
setInterval(()=>{const el=$('#elapsed');if(el&&S.activeTrip)el.textContent=elapsedStr(S.activeTrip)},20000);

