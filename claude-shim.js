/* claude-shim.js: atkuria window.claude.use('db'|'sample'|'dictation'|'downloads'),
   kurį programa gaudavo iš claude.ai artifact'o. Veikia su server.py. */
(function(){
  const J=async(url,opt)=>{const r=await fetch(url,opt);let b=null;try{b=await r.json()}catch(e){}
    if(!r.ok)throw new Error((b&&b.error)||('HTTP '+r.status));return b};
  const dataUrl=f=>new Promise((res,rej)=>{if(typeof f==='string')return res(f);const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(new Error('Nepavyko perskaityti nuotraukos'));fr.readAsDataURL(f)});

  /* ---- db: collection().onSnapshot(), doc('kolekcija/id').set()/delete() ---- */
  const subs={};   // kolekcija -> {cbs:[], last:'', timer}
  async function pull(c){const s=subs[c];if(!s)return;
    try{const rows=await J('/api/db/'+c);const sig=JSON.stringify(rows);
      if(sig!==s.last){s.last=sig;s.cbs.forEach(cb=>{try{cb(rows)}catch(e){console.error(e)}})}}
    catch(e){s.errs.forEach(f=>{try{f(e)}catch(_){}})}}
  const db={
    collection(c){return {onSnapshot(cb,err){
      const s=subs[c]||(subs[c]={cbs:[],errs:[],last:null,timer:null});
      s.cbs.push(cb);if(err)s.errs.push(err);
      if(s.last!==null){try{cb(JSON.parse(s.last))}catch(e){}}else pull(c);
      if(!s.timer)s.timer=setInterval(()=>{if(!document.hidden)pull(c)},4000);
      return ()=>{s.cbs=s.cbs.filter(x=>x!==cb)}}}},
    doc(path){const [c,id]=path.split('/');return {
      async set(o){await J('/api/db/'+c+'/'+encodeURIComponent(id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(o)});await pull(c)},
      async delete(){await J('/api/db/'+c+'/'+encodeURIComponent(id),{method:'DELETE'});await pull(c)}}}
  };

  /* ---- sample: s(prompt,{images}) -> {text}; s.limits() ---- */
  const sample=async(prompt,opts)=>{
    const imgs=opts&&opts.images?await Promise.all(opts.images.map(dataUrl)):[];
    return J('/api/sample',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt,images:imgs})})};
  sample.limits=()=>J('/api/limits');

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

  window.claude={async use(name){
    if(name==='db')return db;
    if(name==='sample')return sample;
    if(name==='dictation')return makeDictation();
    if(name==='downloads')return downloads;
    return null}};
})();
