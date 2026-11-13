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
