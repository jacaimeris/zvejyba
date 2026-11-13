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
