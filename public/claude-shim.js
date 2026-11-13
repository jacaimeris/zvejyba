/* claude-shim.js: atkuria window.claude.use('db'|'sample'|'dictation'|'downloads'),
   kurį programa gaudavo iš claude.ai artifact'o. Veikia su server.py (lokaliai)
   ir su netlify/functions/api.mjs (Netlify). Jei /api/* nėra, db ir sample = null. */
(function(){
  const PIN_KEY='zz_pin';
  const getPin=()=>{try{return localStorage.getItem(PIN_KEY)||''}catch(e){return ''}};
  const setPin=v=>{try{v?localStorage.setItem(PIN_KEY,v):localStorage.removeItem(PIN_KEY)}catch(e){}};
  const J=async(url,opt={})=>{
    const go=()=>fetch(url,{...opt,headers:{...(opt.headers||{}),'x-zvejo-pin':getPin()}});
    let r=await go();
    if(r.status===401&&await askPin())r=await go();
    let b=null;try{b=await r.json()}catch(e){}
    if(!r.ok)throw new Error((b&&b.error)||('HTTP '+r.status));return b};
  let pinAsk=null;
  function askPin(){ // vienas klausimas vienu metu; tuščias/atšauktas = nepavyko
    if(!pinAsk)pinAsk=Promise.resolve().then(()=>{const v=window.prompt('Įvesk žvejo žurnalo PIN:');if(v){setPin(v.trim());return true}return false}).finally(()=>{pinAsk=null});
    return pinAsk}
  const dataUrl=f=>new Promise((res,rej)=>{if(typeof f==='string')return res(f);const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(new Error('Nepavyko perskaityti nuotraukos'));fr.readAsDataURL(f)});

  /* ---- db: viena bendra užklausa /api/db visoms kolekcijoms (mažiau iškvietimų Netlify) ---- */
  const subs={};   // kolekcija -> {cbs:[], errs:[], last:string|null}
  let timer=null,inflight=null;
  const POLL_MS=(location.hostname==='127.0.0.1'||location.hostname==='localhost')?4000:30000;
  function pullAll(){
    if(inflight)return inflight;
    inflight=(async()=>{try{
      const all=await J('/api/db');
      for(const c of Object.keys(subs)){const s=subs[c],rows=all[c]||[],sig=JSON.stringify(rows);
        if(sig!==s.last){s.last=sig;s.cbs.forEach(cb=>{try{cb(rows)}catch(e){console.error(e)}})}}
    }catch(e){Object.values(subs).forEach(s=>s.errs.forEach(f=>{try{f(e)}catch(_){}}))}
    finally{inflight=null}})();
    return inflight}
  function startPolling(){
    if(timer)return;
    timer=setInterval(()=>{if(!document.hidden)pullAll()},POLL_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)pullAll()})}
  const db={
    collection(c){return {onSnapshot(cb,err){
      const s=subs[c]||(subs[c]={cbs:[],errs:[],last:null});
      s.cbs.push(cb);if(err)s.errs.push(err);
      if(s.last!==null){try{cb(JSON.parse(s.last))}catch(e){}}else pullAll();
      startPolling();
      return ()=>{s.cbs=s.cbs.filter(x=>x!==cb)}}}},
    doc(path){const [c,id]=path.split('/');return {
      async set(o){await J('/api/db/'+c+'/'+encodeURIComponent(id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(o)});await pullAll()},
      async delete(){await J('/api/db/'+c+'/'+encodeURIComponent(id),{method:'DELETE'});await pullAll()}}}
  };

  /* ---- sample: s(prompt,{images}) -> {text}; s.limits() ---- */
  const sample=async(prompt,opts)=>{
    const imgs=opts&&opts.images?await Promise.all(opts.images.map(dataUrl)):[];
    return J('/api/sample',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt,images:imgs})})};
  sample.limits=()=>fetch('/api/limits').then(r=>r.json());

  /* ---- dictation: naršyklės SpeechRecognition (lt-LT); Chrome/Safari ---- */
  function makeDictation(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;
    let rec=null,p=()=>{},f=()=>{},st=()=>{};
    return {
      onPartial(cb){p=cb},onFinal(cb){f=cb},onState(cb){st=cb},
      start(){return new Promise((res,rej)=>{
        rec=new SR();rec.lang='lt-LT';rec.interimResults=true;rec.continuous=true;
        rec.onstart=()=>{st({state:'listening'});res()};
        rec.onerror=e=>{st({state:'idle'});if(e.error==='not-allowed'||e.error==='service-not-allowed')rej(new Error('mic'))};
        rec.onend=()=>st({state:'idle'});
        rec.onresult=e=>{let part='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];
          if(r.isFinal)f({text:r[0].transcript.trim()});else part+=r[0].transcript}
          if(part)p({text:part})};
        try{rec.start()}catch(err){rej(err)}})},
      stop(){try{rec&&rec.stop()}catch(e){}}}}

  /* ---- downloads: save({filename,data}) per naršyklės atsisiuntimą ---- */
  const downloads={async save({filename,data}){
    const url=URL.createObjectURL(new Blob([data]));const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}};

  /* Statiniame hostinge /api/* nėra, o Netlify be PIN jis uždarytas: tada db ir sample = null,
     programa rodo savo "nepasiekiama" pranešimą. Jei PIN reikalingas, paklausiame vieną kartą. */
  let up=null;
  const backend=()=>up||(up=(async()=>{
    try{const r=await fetch('/api/limits');if(!r.ok)return false;const l=await r.json();
      if(l.ready===false)return false;
      if(l.pin){try{await J('/api/db')}catch(e){return false}}
      return true}catch(e){return false}})());
  window.claude={async use(name){
    if(name==='db')return (await backend())?db:null;
    if(name==='sample')return (await backend())?sample:null;
    if(name==='dictation')return makeDictation();
    if(name==='downloads')return downloads;
    return null}};
})();
