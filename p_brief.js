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
