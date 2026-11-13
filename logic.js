/* ============ GRYNA LOGIKA (testuojama be naršyklės) ============ */
const toMin=t=>{if(!t||!/^\d{1,2}:\d{2}/.test(t))return null;const[h,m]=t.split(':').map(Number);return h*60+m};
const fromMin=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const DEF_LL={lat:54.69,lon:25.28}; // Vilnius, kai vandens koordinatės nežinomos

function tzOffsetMin(ds){ // Europe/Vilnius poslinkis nuo UTC tą dieną
  try{const h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Vilnius',hour:'2-digit',hour12:false}).format(new Date(ds+'T12:00:00Z'));return ((h%24)-12)*60}catch(e){return 120}}
function sunTimes(ds,lat,lon){ // NOAA apytikslis metodas. Grąžina minutes vietiniu laiku.
  const d=new Date(ds+'T12:00:00Z');const y0=Date.UTC(d.getUTCFullYear(),0,0);const doy=Math.round((d-y0)/864e5);
  const g=2*Math.PI/365*(doy-1);
  const eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  const la=lat*Math.PI/180;const c=(Math.cos(90.833*Math.PI/180)/(Math.cos(la)*Math.cos(dec)))-Math.tan(la)*Math.tan(dec);
  if(c>1||c<-1)return null;const ha=Math.acos(c)*180/Math.PI;
  const off=tzOffsetMin(ds);
  return {rise:720-4*(lon+ha)-eq+off,set:720-4*(lon-ha)-eq+off}}
function llFrom(coords){const m=String(coords||'').match(/(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)/);return m?{lat:+m[1],lon:+m[2]}:DEF_LL}
/* prieblandos langai: 60 min prieš ir po saulėtekio / saulėlydžio (mano operacinis apibrėžimas) */
const TW=60;
function twilightWindows(ds,ll){const s=sunTimes(ds,ll.lat,ll.lon);if(!s)return [];return [[s.rise-TW,s.rise+TW],[s.set-TW,s.set+TW]]}
function overlap(a0,a1,b0,b1){return Math.max(0,Math.min(a1,b1)-Math.max(a0,b0))}
function tripSpan(t){const a=toMin(t.start),b0=toMin(t.end);if(a==null||b0==null)return null;let b=b0;if(b<a)b+=1440;return [a,b]}
function twilightMinutes(t,ll){const sp=tripSpan(t);if(!sp||!t.date)return null;let tw=0;
  for(const off of [0,1440]){const w=twilightWindows(t.date,ll).map(([x,y])=>[x+off,y+off]);w.forEach(([x,y])=>tw+=overlap(sp[0],sp[1],x,y))}
  return {tw,total:sp[1]-sp[0]}}
function inTwilight(ds,min,ll){return twilightWindows(ds,ll).some(([x,y])=>min>=x&&min<=y)}

function moonAge(ds){const d=new Date(ds+'T12:00:00Z');const syn=29.530588853;let a=((d-Date.UTC(2000,0,6,18,14))/864e5)%syn;if(a<0)a+=syn;return a}
function moonNewFull(ds,tol=2){const a=moonAge(ds),syn=29.530588853;const dn=Math.min(a,syn-a),df=Math.abs(a-syn/2);return Math.min(dn,df)<=tol}

/* ---- EXIF (JPEG): DateTimeOriginal ir GPS ---- */
function parseExif(buf){
  try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return {};let p=2;
    while(p<v.byteLength-4){const m=v.getUint16(p);if(m===0xFFE1){const len=v.getUint16(p+2);const s=p+4;
        if(v.getUint32(s)!==0x45786966)return {};const t=s+6;const le=v.getUint16(t)===0x4949;const g16=o=>v.getUint16(o,le),g32=o=>v.getUint32(o,le);
        const ifd0=t+g32(t+4);const out={};
        const readIfd=(off,cb)=>{const n=g16(off);for(let i=0;i<n;i++){const e=off+2+i*12;cb(g16(e),g16(e+2),g32(e+4),e+8)}};
        const str=(type,cnt,vo)=>{const o=cnt>4?t+g32(vo):vo;let r='';for(let i=0;i<cnt-1;i++)r+=String.fromCharCode(v.getUint8(o+i));return r};
        const rat=(o)=>g32(o)/(g32(o+4)||1);
        let exifOff=null,gpsOff=null;
        readIfd(ifd0,(tag,ty,cnt,vo)=>{if(tag===0x8769)exifOff=g32(vo);if(tag===0x8825)gpsOff=g32(vo);if(tag===0x0132&&!out.dt)out.dt=str(ty,cnt,vo)});
        if(exifOff!=null)readIfd(t+exifOff,(tag,ty,cnt,vo)=>{if(tag===0x9003)out.dt=str(ty,cnt,vo)});
        if(gpsOff!=null){const gp={};readIfd(t+gpsOff,(tag,ty,cnt,vo)=>{if(tag===1||tag===3)gp[tag]=String.fromCharCode(v.getUint8(vo));
          if(tag===2||tag===4){const o=t+g32(vo);gp[tag]=rat(o)+rat(o+8)/60+rat(o+16)/3600}});
          if(gp[2]!=null&&gp[4]!=null){out.lat=(gp[1]==='S'?-1:1)*gp[2];out.lon=(gp[3]==='W'?-1:1)*gp[4]}}
        if(out.dt){const m2=out.dt.match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/);if(m2){out.date=`${m2[1]}-${m2[2]}-${m2[3]}`;out.time=`${m2[4]}:${m2[5]}`}}
        return out}
      if((m&0xFF00)!==0xFF00)break;p+=2+v.getUint16(p+2)}
  }catch(e){}
  return {}}

/* ---- Teisinė dalis: taisyklių variklis ---- */
const dInRange=(ds,[m1,d1,m2,d2])=>{const m=+ds.slice(5,7),d=+ds.slice(8,10),x=m*100+d,a=m1*100+d1,b=m2*100+d2;return a<=b?(x>=a&&x<=b):(x>=a||x<=b)};
const normName=s=>String(s||'').toLowerCase().replace(/\b(ežeras|ež\.|upė|tvenkinys|kūdra)\b/g,'').replace(/[^\p{L}\d]+/gu,' ').trim();
function legal(w,type,ds,species){
  const out=[];const L=(lvl,text,src,ver)=>out.push({lvl,text,src,ver:ver||'antrinis'});
  const lg=(w&&w.legal)||{};const isIce=/žiemin/i.test(type||'');const isBoat=/valt|trol/i.test(type||'');
  const kind=(w&&w.kind)||'';const nm=normName(w&&w.name);
  if(!w){L('warn','Vandens telkinys nepasirinktas, teisinė suvestinė negalima.','');return out}
  /* 1. bilietas / leidimas */
  const st=lg.status||'nežinoma';
  if(st==='uždraustas')L('stop','Šiame telkinyje mėgėjų žvejyba uždrausta.',lg.src||'A5');
  else if(st==='neišnuomotas')L('ok','Valstybinis neišnuomotas telkinys: pakanka žvejo mėgėjo bilieto (L05.1). Metinis bilietas tinka. '+(lg.ticket&&!/L05\.1/.test(lg.ticket)?lg.ticket:''),'A3');
  else if(st==='išnuomotas')L('stop','Išnuomotas telkinys: metinio bilieto NEPAKANKA, reikia nuomininko leidimo'+(lg.tenant?' ('+lg.tenant+')':'')+'. Leidimą pirk iš nuomininko arba ALIS.','A3');
  else if(st==='limituota')L('stop','Limituota žvejyba: reikia žvejo mėgėjo kortelės (ir bilieto sąlygų pagal telkinio limitą).','A3');
  else if(st==='ekologinis')L('ok','Ekologinės būklės gerinimo telkinys: plėšrūnams galioja speciali tvarka (žemiau). Bilieto reikalavimas pagal A5 skiriasi tik karpinėms žuvims.','A5');
  else L('warn','Telkinio statusas nežinomas. Prieš išvykstant ALIS sistemoje patikrink, ar jis išnuomotas ar limituotas.','A3');
  if(lg.checked){const age=(new Date(ds)-new Date(lg.checked))/864e5;
    if(age>30)L('warn','Statusas paskutinį kartą tikrintas '+lg.checked+' (prieš '+Math.round(age)+' d.). Nuoma gali būti pasikeitusi, patikrink ALIS.','');
    else L('info','Statusas tikrintas '+lg.checked+' šaltinyje '+(lg.src||'?')+(lg.verifiedPrimary?'.':'. Pirminis teisės aktas NEPERSKAITYTAS.'),lg.src||'')}
  if(lg.todo)L('warn','Neišspręsta: '+lg.todo,'');
  /* 2. ekologinis sąrašas ir draudžiami vandenys */
  const eco=Object.keys(ECO_WATERS).find(k=>normName(k)===nm);
  if(eco&&kind!=='Upė'){L('info',ECO_RULES,'A5');if(ECO_WATERS[eco])L('warn',ECO_WATERS[eco],'A5')}
  /* 3. sezoniniai upių draudimai */
  if(kind==='Upė'){
    if(dInRange(ds,[10,1,12,31])){
      const hit=RIVER_BAN_OCT_DEC.find(r=>normName(r)===nm||nm.startsWith(normName(r)+' '));
      if(hit)L('stop','Ši upė ('+hit+') yra sąraše, kuriame mėgėjų žvejyba uždrausta spalio 1 d. - gruodžio 31 d.','A5');
      else L('warn','Spalio 1 d. - gruodžio 31 d. daugelyje upių žvejyba uždrausta. Šios upės mano dalinis sąrašas neįvardija, bet pilną sąrašą (A5) reikia patikrinti.','A5')}
    if(/nemun/.test(nm)&&dInRange(ds,[7,1,12,1]))L('warn',NEMUNAS_BAN_JUL_DEC,'A5');
  }
  /* 4. rūšys */
  (species||[]).forEach(sp=>{const r=SPECIES_RULES[sp];if(!r)return;
    const closed=r.closed.some(x=>dInRange(ds,x));
    if(closed)L('stop',sp+': šiuo laikotarpiu žvejoti draudžiama (nerštas / draudimo laikotarpis). Pagautą paleisk.',r.src);
    const bits=[];if(r.min)bits.push('mažiausias dydis '+r.min+' cm');if(r.max)bits.push('didžiausias '+r.max+' cm (nesuvartoti didesnių)');if(r.limit)bits.push('iki '+r.limit+' vnt. per dieną');
    if(bits.length&&!closed)L('info',sp+': '+bits.join(', ')+'. '+(r.note||''),r.src);
    else if(!bits.length&&!closed&&r.note)L('info',sp+': '+r.note,r.src);
    if(sp==='Lydeka'&&!closed&&kind==='Upė')L('warn','Lydekos dydžio ribojimas netaikomas 2 priede nurodytose upėse. Ar ši upė ten įrašyta, nepatikrinta (priedas neperskaitytas).','A1')});
  /* 5. įrankiai ir būdai */
  L('info','Vienu metu iki 4 meškerių (įrankių), iš jų ne daugiau kaip 2 su žuvele kaip masalu; iš valties žvejojant judant ne daugiau kaip 2 meškerės (inkaru sustojus galioja bendros sąlygos). Kabliukų iš viso iki 6; dvišakis ir trišakis skaičiuojamas kaip 1.','A2');
  L('info','Draudžiamos gumos ilgesnės nei 40 cm, nepritvirtinti plūdriniai įrankiai (popkės), išskyrus žvejybą nuo ledo.','A2');
  L('info','Būti prie vandens (arčiau nei 25 m) su žvejybos įrankiais be teisės žvejoti draudžiama.','A2');
  L('info',WEIGHT_RULE,'A1');L('info',YEAR_BAN,'A1');
  if(dInRange(ds,[1,2,4,30]))L('warn','Nuo sausio 2 d. iki balandžio 30 d. draudžiama žvejoti naudojant žuvelę kaip masalą (išskyrus žuvies gabalėlį). Tai liečia ir ledo žvejybą su gyvu ar negyvu žuvele.','A2');
  if(isIce){L('warn','Ant ledo privaloma turėti du lanksčia jungtimi sujungtus smaigus lengvai pasiekiamoje vietoje. Draudžiama eiti ant ledo, kai LHMT paskelbė ledo pavojų.','A4');
    L('info','AAD: ledas žmogui saugus nuo 7 cm, grupei nuo 12 cm. Tai minimumai, o ne rekomenduojama riba.','A4')}
  if(isBoat&&lg.boat)L('warn','Valtis/variklis: '+lg.boat,lg.src||'');
  return out}

/* ---- Sąlygų vertinimas pagal EVID ---- */
function condEval(p,w){
  const ds=p.date,ll=llFrom(w&&w.coords);const out=[];const E=id=>EVID.find(e=>e.id===id);
  const A=(ev,state,txt)=>out.push({ev,state,txt});
  const sp=tripSpan({date:ds,start:p.time,end:p.end||p.time});
  const targets=p.species||[];const pike=!targets.length||targets.includes('Lydeka'),zander=targets.includes('Starkis');
  const ice=/žiemin/i.test(p.type||'');
  if(ds&&p.time){const tw=twilightMinutes({date:ds,start:p.time,end:p.end||fromMin(toMin(p.time)+240)},ll);
    const s=sunTimes(ds,ll.lat,ll.lon);
    const sunTxt=s?` Saulėtekis ${fromMin(s.rise)}, saulėlydis ${fromMin(s.set)}.`:'';
    if(tw){const share=Math.round(tw.tw/tw.total*100);
      if(pike)A('EV1',share>=30?'+':share>0?'0':'-',`Prieblandoje praleisi ${tw.tw} min iš ${tw.total} (${share}%).${sunTxt}`);
      if(zander)A('EV7',share>=30?'+':share>0?'0':'-',`Prieblandoje praleisi ${tw.tw} min iš ${tw.total} (${share}%).${sunTxt}`)}}
  if(ds){const mn=moonNewFull(ds,2);if(pike)A('EV3',mn?'+':'0',mn?'Data patenka į ±2 d. nuo jaunaties ar pilnaties.':'Data ne šalia jaunaties ar pilnaties.')}
  const wind=num(p.wind);if(pike&&wind!=null)A('EV2','info',`Vėjas ${fmt1(wind)} m/s. Šaltinis tvirtina, kad stipresnis vėjas = geresni pagavimai, bet slenksčio nenurodo. Palyginsiu su tavo duomenimis, kai jų bus.`);
  const wt=num(p.wtemp);if(pike&&wt!=null&&!ice)A('EV4','info',`Vandens temperatūra ${fmt1(wt)} °C. Šaltinis: aukštesnė temperatūra = mažiau pagavimų; tyrimo temperatūrų intervalo nežinau, todėl skaičiaus nevertinu.`);
  if(pike){if(p.recent==='daug')A('EV5','-','Ežeras intensyviai žvejotas paskutines 2 d. Tai stipriausias iš tirtų veiksnių, tikėtini prastesni pagavimai.');
    else if(p.recent==='mažai')A('EV5','+','Paskutines 2 d. ežeras buvo mažai žvejotas. Palanku pagal šaltinį.');
    else A('EV5','info','Nenurodei, ar ežeras buvo žvejotas paskutines 2 d. Tai svarbiausias iš žinomų veiksnių, jei gali, sužinok.')}
  if(num(p.pressure)!=null)A('EV6','info',`Slėgis ${p.pressure} hPa${p.trend?' ('+p.trend.toLowerCase()+')':''}: šaltiniai nesutaria, įtaka neįrodyta, todėl neįvertinta.`);
  if(ice){const small=w&&((num(w.area)!=null&&num(w.area)<10)||(num(w.maxDepth)!=null&&num(w.maxDepth)<4));
    A('EV11',small?'-':'info',small?'Mažas arba seklus telkinys: po ledu deguonies stygiaus rizika didesnė (mano slenkstis: <10 ha arba <4 m, ne iš šaltinio). Ieškok įtekančių upelių ir gilesnių vietų.':'Telkinys nėra mažas ir seklus pagal mano slenkstį (<10 ha ar <4 m), bet deguonies po ledu pamatuoti negali.');
    A('EV12','info','Specializuotos spaudos hipotezė apie šviesą po ledu: nepatvirtinta, nenaudojama sprendimui.')}
  return out.map(o=>({...o,e:E(o.ev)}))}

/* ---- Statistika ir hipotezių testai ---- */
function tripHours(t){const sp=tripSpan(t);return sp?(sp[1]-sp[0])/60:0}
function catchesOf(t,sp){return (t.catches||[]).filter(c=>!sp||!sp.length||sp.includes(c.species))}
function median(a){const s=[...a].sort((x,y)=>x-y);if(!s.length)return null;const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2}
function rateRatio(a,ta,b,tb,minTrips){ // a,b = žuvų skaičiai, ta,tb = valandos
  if(!(ta>0&&tb>0))return {ok:false,why:'trūksta valandų (reikia pradžios ir pabaigos laiko)'};
  if(a<1||b<1)return {ok:false,why:'vienoje grupėje nulis žuvų, santykio apskaičiuoti negalima'};
  const rr=(a/ta)/(b/tb);const se=Math.sqrt(1/a+1/b)*1.5;
  return {ok:true,rr,lo:Math.exp(Math.log(rr)-1.96*se),hi:Math.exp(Math.log(rr)+1.96*se),ra:a/ta,rb:b/tb}}
function verdict(res,exp){if(!res.ok)return 'nepakanka duomenų';
  const up=res.lo>1,down=res.hi<1;
  if(exp==='+')return up?'palaiko':down?'prieštarauja':'neapibrėžta';
  return down?'palaiko':up?'prieštarauja':'neapibrėžta'}
function evalHyp(h,trips,waters){
  const sp=h.sp;const base=trips.filter(t=>tripHours(t)>0);
  const mk=(A,B,labA,labB,extra)=>{
    const a=A.reduce((s,t)=>s+catchesOf(t,sp).length,0),b=B.reduce((s,t)=>s+catchesOf(t,sp).length,0);
    const ta=A.reduce((s,t)=>s+tripHours(t),0),tb=B.reduce((s,t)=>s+tripHours(t),0);
    const info={n:{A:A.length,B:B.length},fishA:a,fishB:b,hA:ta,hB:tb,labA,labB,extra};
    if(A.length<5||B.length<5||a+b<10)return {...info,res:{ok:false,why:'mažiausia imtis: 5 žvejybos kiekvienoje grupėje ir 10 žuvų iš viso'},verdict:'nepakanka duomenų'};
    const res=rateRatio(a,ta,b,tb);return {...info,res,verdict:verdict(res,h.exp)}};
  const open=base.filter(t=>!/žiemin/i.test(t.type||''));
  switch(h.test){
   case 'twilight':{let a=0,b=0,ta=0,tb=0,nt=0;
     base.forEach(t=>{const w=waters.find(x=>x.id===t.waterId||x.name===t.waterName);const ll=llFrom(w&&w.coords);
       const cs=catchesOf(t,sp);if(cs.some(c=>!c.time))return;const x=twilightMinutes(t,ll);if(!x)return;nt++;
       ta+=x.tw/60;tb+=(x.total-x.tw)/60;cs.forEach(c=>{const m=toMin(c.time);const mm=(m<toMin(t.start)?m+1440:m);const tw=twilightWindows(t.date,ll).some(([p,q])=>mm>=p&&mm<=q||mm-1440>=p&&mm-1440<=q);tw?a++:b++})});
     const info={n:{A:nt,B:nt},fishA:a,fishB:b,hA:ta,hB:tb,labA:'prieblanda',labB:'kitas laikas'};
     if(nt<5||a+b<10)return {...info,res:{ok:false,why:'mažiausia imtis: 5 žvejybos su laikais ir 10 žuvų iš viso'},verdict:'nepakanka duomenų'};
     const res=rateRatio(a,ta,b,tb);return {...info,res,verdict:verdict(res,h.exp)}}
   case 'wind':{const v=base.map(t=>num(t.w&&t.w.wind)).filter(x=>x!=null);const m=median(v);if(m==null)return mk([],[],'','');
     return mk(base.filter(t=>num(t.w&&t.w.wind)>m),base.filter(t=>num(t.w&&t.w.wind)!=null&&num(t.w.wind)<=m),'vėjas > '+fmt1(m)+' m/s','vėjas ≤ '+fmt1(m)+' m/s')}
   case 'moon':return mk(base.filter(t=>t.date&&moonNewFull(t.date,2)),base.filter(t=>t.date&&!moonNewFull(t.date,2)),'jaunatis/pilnatis ±2 d.','kitos dienos');
   case 'wtemp':{const v=open.map(t=>num(t.w&&t.w.wtemp)).filter(x=>x!=null);const m=median(v);if(m==null)return mk([],[],'','');
     return mk(open.filter(t=>num(t.w&&t.w.wtemp)!=null&&num(t.w.wtemp)<=m),open.filter(t=>num(t.w&&t.w.wtemp)>m),'vanduo ≤ '+fmt1(m)+' °C','vanduo > '+fmt1(m)+' °C')}
   case 'pressure2d':return mk(base.filter(t=>t.recent==='daug'),base.filter(t=>t.recent==='mažai'),'intensyviai žvejota','mažai žvejota');
   case 'airpressure':return mk(base.filter(t=>num(t.w&&t.w.pressure)!=null&&num(t.w.pressure)<1010),base.filter(t=>num(t.w&&t.w.pressure)>=1015),'<1010 hPa','≥1015 hPa');
  }
  return {res:{ok:false,why:'nežinomas testas'},verdict:'nepakanka duomenų',n:{A:0,B:0},fishA:0,fishB:0,hA:0,hB:0}}
function confLabel(trips,fish,hours){return (trips<5||fish<10||hours<10)?'žemas':(fish<30||trips<10)?'vidutinis':'aukštesnis'}
