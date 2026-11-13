/* ---------- iliustracijos: žuvys (vektorinės, originalios) ---------- */
/* Kiekviena žuvis žiūri į dešinę. Klasės: .fa-body (siūbuoja), .fa-tail, .fa-fin. Animacijas valdo CSS. */
let _artN=0;
function fishSVG(id,cls=''){
  const u='g'+(++_artN);
  const defs=(top,mid,bot)=>`<defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs>`;
  const eye=(x,y,r,iris)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${iris}"/><circle cx="${x}" cy="${y}" r="${r*.55}" fill="#10130f"/><circle cx="${x-r*.25}" cy="${y-r*.3}" r="${r*.2}" fill="#fff" opacity=".85"/>`;
  const A={
  lydeka:()=>`${defs('#2f4a22','#6a8a3c','#e3dfb0')}
   <g class="fa-body">
    <path class="fa-tail" d="M74 64 L26 36 Q40 64 26 94 L74 72Z" fill="#59773a"/>
    <path class="fa-fin" d="M92 52 L108 28 L142 30 L152 50Z" fill="#4c6a30"/>
    <path class="fa-fin" d="M96 82 L112 104 L140 100 L150 84Z" fill="#6f8c3f"/>
    <path class="fa-fin" d="M176 86 L168 106 L192 94Z" fill="#8aa04c"/>
    <path d="M70 62 C100 46 170 42 236 50 C266 54 290 58 308 63 L308 69 C290 73 266 80 238 84 C170 94 100 88 70 72Z" fill="url(#${u}b)"/>
    <g fill="#e9e6b5" opacity=".85"><circle cx="110" cy="60" r="3"/><circle cx="130" cy="56" r="3.4"/><circle cx="152" cy="62" r="3"/><circle cx="174" cy="57" r="3.4"/><circle cx="196" cy="62" r="3"/><circle cx="218" cy="58" r="3"/><circle cx="120" cy="72" r="2.6"/><circle cx="144" cy="74" r="2.8"/><circle cx="168" cy="72" r="2.6"/><circle cx="192" cy="75" r="2.8"/><circle cx="214" cy="72" r="2.4"/><circle cx="96" cy="66" r="2.4"/></g>
    <path d="M296 66 L250 67" stroke="#1d2a14" stroke-width="1.4" fill="none" opacity=".6"/>
    <path d="M238 52 C246 62 246 74 238 84" stroke="#1d2a14" stroke-width="1.6" fill="none" opacity=".45"/>
    ${eye(270,57,5,'#e0b840')}
   </g>`,
  eserys:()=>`${defs('#2f4a24','#8fa23a','#f0e9a4')}
   <g class="fa-body">
    <path class="fa-tail" d="M84 66 L38 44 Q48 66 38 90 L84 70Z" fill="#d9772a"/>
    <path class="fa-fin" d="M150 36 L156 8 L172 14 L184 6 L198 14 L212 8 L218 38Z" fill="#46603a"/>
    <path class="fa-fin" d="M220 40 L228 22 L254 26 L250 46Z" fill="#6e8a3c"/>
    <path class="fa-fin" d="M118 94 L112 114 L142 102Z" fill="#e4552b"/>
    <path class="fa-fin" d="M176 98 L168 120 L204 104Z" fill="#e4552b"/>
    <path id="${u}p" d="M82 64 C110 30 180 26 242 40 C272 46 292 58 302 66 C292 76 270 90 240 98 C180 110 110 100 82 72Z" fill="url(#${u}b)"/>
    <clipPath id="${u}c"><use href="#${u}p"/></clipPath>
    <g clip-path="url(#${u}c)" fill="#26361b" opacity=".62"><path d="M118 20 Q134 66 124 118 L140 118 Q150 66 134 20Z"/><path d="M152 20 Q168 66 158 118 L174 118 Q184 66 168 20Z"/><path d="M186 20 Q202 66 192 118 L208 118 Q218 66 202 20Z"/><path d="M220 24 Q234 66 226 118 L240 118 Q248 66 236 24Z"/><path d="M90 40 Q104 66 96 110 L108 110 Q118 66 104 40Z"/></g>
    <path d="M240 42 C250 62 250 82 240 98" stroke="#1d2a14" stroke-width="1.6" fill="none" opacity=".4"/>
    ${eye(274,58,5.5,'#e8892f')}
   </g>`,
  starkis:()=>`${defs('#4c5a40','#9aa386','#e9ebdc')}
   <g class="fa-body">
    <path class="fa-tail" d="M72 66 L22 40 Q36 68 22 98 L72 72Z" fill="#7d8770"/>
    <path class="fa-fin" d="M130 54 L138 28 L190 30 L200 55Z" fill="#79836b"/>
    <path class="fa-fin" d="M206 56 L214 38 L248 40 L250 58Z" fill="#8a9479"/>
    <path class="fa-fin" d="M100 80 L112 98 L146 90 L150 80Z" fill="#8a9479"/>
    <path id="${u}p" d="M68 64 C110 52 180 50 242 54 C270 56 290 62 306 68 C290 76 268 82 242 84 C180 90 110 82 68 72Z" fill="url(#${u}b)"/>
    <clipPath id="${u}c"><use href="#${u}p"/></clipPath>
    <g clip-path="url(#${u}c)" fill="#3b4430" opacity=".4"><path d="M110 40 L124 90 L136 90 L124 40Z"/><path d="M150 40 L164 90 L176 90 L164 40Z"/><path d="M190 40 L204 90 L216 90 L204 40Z"/></g>
    <g fill="#27301f" opacity=".6"><circle cx="146" cy="40" r="1.8"/><circle cx="160" cy="38" r="1.8"/><circle cx="174" cy="40" r="1.8"/><circle cx="224" cy="48" r="1.6"/><circle cx="236" cy="48" r="1.6"/></g>
    <path d="M300 68 L256 69" stroke="#1d2a14" stroke-width="1.4" opacity=".6"/>
    <path d="M244 56 C252 66 252 76 244 84" stroke="#1d2a14" stroke-width="1.6" fill="none" opacity=".4"/>
    <circle cx="272" cy="60" r="8.5" fill="#dfe6c7"/>${eye(272,60,6.5,'#dfe6c7')}
   </g>`,
  samas:()=>`${defs('#2a2d1e','#4e5030','#c3b27c')}
   <g class="fa-body">
    <path class="fa-tail" d="M66 70 C42 58 28 62 20 70 C28 80 44 84 66 78Z" fill="#363922"/>
    <path class="fa-fin" d="M96 80 C140 112 206 112 236 90 L236 82Z" fill="#3a3d26"/>
    <path class="fa-fin" d="M200 50 L208 38 L224 52Z" fill="#363922"/>
    <path d="M62 68 C110 52 180 50 224 52 C258 52 286 58 304 72 C304 84 262 94 224 94 C180 98 110 86 62 76Z" fill="url(#${u}b)"/>
    <g fill="#1f2216" opacity=".45"><circle cx="110" cy="64" r="5"/><circle cx="150" cy="60" r="6"/><circle cx="190" cy="64" r="5"/><circle cx="130" cy="74" r="4"/><circle cx="170" cy="76" r="5"/><circle cx="214" cy="68" r="4"/></g>
    <path d="M304 76 C290 80 270 82 252 80" stroke="#15170e" stroke-width="1.6" fill="none"/>
    <g class="fa-fin" stroke="#2b2e1a" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M302 70 C306 96 280 108 244 106"/><path d="M300 68 C312 90 296 112 270 116"/><path d="M296 82 C298 92 288 98 276 98"/><path d="M290 84 C290 92 284 96 274 96"/></g>
    <circle cx="276" cy="60" r="3.4" fill="#d6c27a"/><circle cx="276" cy="60" r="1.7" fill="#0f100a"/>
   </g>`,
  upetakis:()=>`${defs('#4b5a3a','#a39a72','#efe9d0')}
   <g class="fa-body">
    <path class="fa-tail" d="M66 66 L20 42 Q32 66 20 94 L66 72Z" fill="#8d8760"/>
    <path class="fa-fin" d="M150 46 L160 24 L196 28 L196 48Z" fill="#8a8a5c"/>
    <path class="fa-fin" d="M118 52 L124 44 L134 52Z" fill="#7b7a4f"/>
    <path class="fa-fin" d="M122 88 L132 106 L160 94Z" fill="#c68b4a"/>
    <path id="${u}p" d="M62 66 C100 46 170 40 234 48 C266 52 290 58 304 66 C290 74 266 86 234 92 C170 100 100 90 62 72Z" fill="url(#${u}b)"/>
    <clipPath id="${u}c"><use href="#${u}p"/></clipPath>
    <g clip-path="url(#${u}c)" fill="none" stroke="#c9382b" stroke-width="2"><circle cx="150" cy="72" r="3.4"/><circle cx="182" cy="76" r="3.4"/><circle cx="212" cy="70" r="3.4"/><circle cx="130" cy="68" r="3"/></g>
    <g fill="#2a2a1c" opacity=".7"><circle cx="110" cy="58" r="2.6"/><circle cx="140" cy="54" r="2.8"/><circle cx="170" cy="56" r="2.6"/><circle cx="200" cy="58" r="2.8"/><circle cx="228" cy="60" r="2.4"/><circle cx="124" cy="78" r="2.2"/><circle cx="164" cy="82" r="2.4"/><circle cx="196" cy="84" r="2.2"/><circle cx="252" cy="62" r="2"/><circle cx="96" cy="66" r="2.2"/></g>
    <path d="M298 68 L256 69" stroke="#1d2a14" stroke-width="1.3" opacity=".6"/>
    <path d="M238 50 C248 62 248 78 238 92" stroke="#1d2a14" stroke-width="1.5" fill="none" opacity=".35"/>
    ${eye(272,58,5,'#d8c58a')}
   </g>`,
  sapalas:()=>`${defs('#4d5a38','#b3b58b','#f2eed8')}
   <g class="fa-body">
    <path class="fa-tail" d="M76 66 L30 42 Q42 66 30 92 L76 70Z" fill="#7a5a3a"/>
    <path class="fa-fin" d="M160 40 L168 20 L206 24 L204 42Z" fill="#6a7048"/>
    <path class="fa-fin" d="M100 90 C110 108 146 108 156 94Z" fill="#d46a2a"/>
    <path class="fa-fin" d="M184 94 L178 114 L212 100Z" fill="#d46a2a"/>
    <path id="${u}p" d="M74 66 C104 38 180 34 240 44 C268 48 290 58 300 66 C290 76 268 90 240 94 C180 104 104 96 74 70Z" fill="url(#${u}b)"/>
    <clipPath id="${u}c"><use href="#${u}p"/></clipPath>
    <defs><pattern id="${u}s" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 Q7 0 14 12" fill="none" stroke="#3d4a2a" stroke-width="1.1" opacity=".5"/></pattern></defs>
    <rect x="70" y="30" width="190" height="80" fill="url(#${u}s)" clip-path="url(#${u}c)"/>
    <path d="M296 68 L262 68" stroke="#1d2a14" stroke-width="1.3" opacity=".6"/>
    <path d="M246 46 C256 62 256 78 246 94" stroke="#1d2a14" stroke-width="1.5" fill="none" opacity=".35"/>
    ${eye(274,58,5.5,'#e5d9a0')}
   </g>`,
  vegele:()=>`${defs('#4a3a1f','#8b7233','#d9c98a')}
   <g class="fa-body">
    <path class="fa-tail" d="M58 70 C34 58 20 66 18 72 C22 80 36 86 58 76Z" fill="#6b5a2a"/>
    <path class="fa-fin" d="M96 56 C130 40 190 40 214 54Z" fill="#6f5c2b"/>
    <path class="fa-fin" d="M222 54 L228 42 L252 44 L252 56Z" fill="#6f5c2b"/>
    <path class="fa-fin" d="M100 86 C140 108 200 106 232 88Z" fill="#7a6630"/>
    <path id="${u}p" d="M54 70 C96 56 170 54 232 56 C266 58 290 64 306 70 C290 78 264 84 232 86 C170 92 96 84 54 76Z" fill="url(#${u}b)"/>
    <clipPath id="${u}c"><use href="#${u}p"/></clipPath>
    <g clip-path="url(#${u}c)" fill="#2e2412" opacity=".5"><circle cx="100" cy="66" r="9"/><circle cx="144" cy="62" r="11"/><circle cx="190" cy="66" r="9"/><circle cx="120" cy="80" r="7"/><circle cx="170" cy="82" r="8"/><circle cx="220" cy="70" r="7"/></g>
    <path d="M304 72 L268 73" stroke="#1d150a" stroke-width="1.4" opacity=".6"/>
    <path class="fa-fin" d="M290 78 C292 92 284 100 272 102" stroke="#6b5a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="276" cy="64" r="3.6" fill="#d6c27a"/><circle cx="276" cy="64" r="1.8" fill="#0f0c06"/>
   </g>`
  };
  const f=A[id];if(!f)return '';
  return `<svg class="fish ${cls}" viewBox="0 0 330 130" role="img" aria-label="${id}" xmlns="http://www.w3.org/2000/svg">${f()}</svg>`;
}
const FISH_BG={lydeka:['#12392c','#2f6b4b'],eserys:['#10353b','#2c7a74'],starkis:['#162b3a','#3b6a86'],samas:['#14201c','#3a4d3a'],upetakis:['#14344a','#3d86a5'],sapalas:['#1b3a30','#4a8a64'],vegele:['#1c2a2e','#4a6a63']};
const FISH_NAME={lydeka:'Lydeka',eserys:'Ešerys',starkis:'Starkis',samas:'Šamas',upetakis:'Upėtakis',sapalas:'Šapalas',vegele:'Vėgėlė'};

/* ---------- iliustracijos: mazgai (schemos) ---------- */
/* Kiekvienas žingsnis = SVG scena. Linija piešiama animacija (stroke-dashoffset). Pagrindinis valas žalias, laisvas galas oranžinis. */
const KC={m:'var(--accent)',t:'var(--hot)'};
const kline=(d,c='m',delay=0,w=5)=>`<path class="kl" pathLength="1" d="${d}" stroke="${KC[c]}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${delay}s"/>`;
const khook=()=>`<g class="kh" stroke="#8d98a3" stroke-width="5" fill="none" stroke-linecap="round"><circle cx="260" cy="100" r="12"/><path d="M260 112 L260 160 C260 196 214 196 214 160"/><path d="M214 160 L222 146" stroke-width="4"/></g>`;
const klure=()=>`<g class="kh" stroke="#8d98a3" stroke-width="5" fill="none" stroke-linecap="round"><circle cx="262" cy="100" r="11"/></g><path class="kh" d="M273 100 C300 84 316 96 316 112 C316 130 296 134 273 106" fill="#e6efe9" stroke="#8d98a3" stroke-width="3"/>`;
const klabel=t=>`<text x="12" y="22" class="klab">${t}</text>`;
const coil=(x,y,n,dx=9,c='t',delay=.2)=>Array.from({length:n},(_,i)=>kline(`M${x+i*dx} ${y-9} C${x+i*dx+6} ${y-9} ${x+i*dx+6} ${y+9} ${x+i*dx} ${y+9}`,c,delay+i*.12,3.6)).join('');
const knotScene=body=>`<svg class="kscene" viewBox="0 0 330 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
const KNOT_ART={
'Palomar':[
 knotScene(khook()+kline('M10 94 L270 94 C290 94 290 108 270 108 L10 108','m',0)+klabel('Dvigubas valas')),
 knotScene(khook()+kline('M10 94 L96 94 C120 94 132 62 160 64 C190 66 182 112 150 106 C128 102 138 82 170 96 L262 96 C280 96 280 108 262 108 L170 108 C150 108 130 108 10 108','m',0)+klabel('Paprastas mazgas')),
 knotScene(khook()+kline('M10 100 L196 100','m',0)+kline('M196 100 C200 60 320 70 312 140 C304 206 214 214 214 170 C214 130 250 104 262 100','t',.3)+klabel('Kilpa per kabliuką')),
 knotScene(khook()+kline('M10 100 L246 100','m',0)+`<circle class="kl2" cx="236" cy="100" r="9" fill="var(--accent)"/>`+kline('M246 100 L300 70','t',.3,4)+klabel('Sutempk')),
 knotScene(khook()+kline('M10 100 L246 100','m',0)+`<circle cx="236" cy="100" r="9" fill="var(--accent)"/>`+kline('M246 100 L256 94','t',.3,4)+klabel('Nukirpk galiuką 2–3 mm'))],
'Pagerintas clinch':[
 knotScene(khook()+kline('M10 100 L262 100','m',0)+kline('M262 100 L270 100','m')+coil(150,100,6,12,'t',.3)+klabel('Apvijos 5–7 kartus')),
 knotScene(khook()+kline('M10 100 L262 100','m',0)+coil(176,100,5,12,'m',0)+kline('M236 100 C250 70 232 64 226 90','t',.4)+klabel('Pro mažą kilpą prie skylutės')),
 knotScene(khook()+kline('M10 100 L262 100','m',0)+coil(176,100,5,12,'m',0)+kline('M236 100 C250 60 210 40 214 80 C216 96 230 98 246 70','t',.4)+klabel('Ir pro didelę kilpą')),
 knotScene(khook()+kline('M10 100 L250 100','m',0)+coil(222,100,5,5,'m',.1)+kline('M246 100 L296 80','t',.5,4)+klabel('Sutempk ir pastumk apvijas prie skylutės')),
 knotScene(khook()+kline('M10 100 L250 100','m',0)+coil(222,100,5,5,'m',0)+kline('M246 100 L254 96','t',.3,4)+klabel('Nukirpk galiuką'))],
'Uni':[
 knotScene(khook()+kline('M10 100 L262 100','m',0)+kline('M262 100 C292 100 292 130 262 130 L130 130','t',.3)+klabel('Atlenk galiuką atgal')),
 knotScene(khook()+kline('M10 100 L262 100','m',0)+kline('M262 100 C292 100 292 130 262 130 L150 130','t',0)+coil(168,115,5,12,'t',.3)+klabel('4–6 apvijos per kilpą')),
 knotScene(khook()+kline('M10 100 L262 100','m',0)+coil(200,100,5,6,'t',0)+kline('M262 100 C290 100 290 130 262 130 L222 130','t',0)+klabel('Patrauk galiuką, apvijos susispaus')),
 knotScene(khook()+kline('M10 100 L262 100','m',0)+coil(238,100,5,4,'t',0)+kline('M262 100 C268 100 268 112 262 112','t',0)+klabel('Pastumk prie skylutės, patempk valą')),
 knotScene(khook()+kline('M10 100 L250 100','m',0)+coil(238,100,5,3.4,'t',0)+klabel('Nukirpk galiuką'))],
'Atvira kilpa (non-slip loop)':[
 knotScene(klure()+kline('M10 100 L100 100 C118 100 130 76 150 78 C170 80 166 112 146 108 C128 104 134 90 156 100 L210 100','m',0)+klabel('Laisvas paprastas mazgas, ~10 cm nuo galo')),
 knotScene(klure()+kline('M10 100 L100 100 C118 100 130 76 150 78 C170 80 166 112 146 108 C128 104 134 90 156 100 L212 100 C240 100 240 78 262 88 L262 112','t',.2)+klabel('Pro masalo žiedą, atgal pro mazgą')),
 knotScene(klure()+kline('M10 100 L150 100','m',0)+coil(150,100,4,9,'t',.2)+kline('M186 100 L212 100 C240 100 240 78 262 88','t',0)+klabel('3–5 apvijos aplink valą')),
 knotScene(klure()+kline('M10 100 L170 100','m',0)+coil(150,100,4,8,'t',0)+kline('M176 100 C190 70 150 70 150 96','t',.4)+klabel('Vėl pro paprastą mazgą')),
 knotScene(klure()+kline('M10 100 L150 100','m',0)+`<circle cx="150" cy="100" r="9" fill="var(--accent)"/>`+kline('M158 100 C190 100 200 60 240 70 C262 76 266 92 262 96','t',.3)+klabel('Užveržk, kilpa lieka laisva'))],
'Dvigubas Uni (valų sujungimas)':[
 knotScene(kline('M10 92 L220 92','m',0,5)+kline('M110 120 L320 120','t',.2,5)+klabel('Valai persidengia ~15 cm')),
 knotScene(kline('M10 92 L220 92','m',0)+kline('M110 120 L320 120','t',0)+coil(150,106,5,9,'m',.3)+klabel('Uni mazgas pirmu galu')),
 knotScene(kline('M10 92 L220 92','m',0)+kline('M110 120 L320 120','t',0)+coil(150,106,5,9,'m',0)+coil(230,106,5,9,'t',.3)+klabel('Tą patį kitu galu')),
 knotScene(kline('M10 106 L320 106','m',0)+`<circle cx="150" cy="106" r="10" fill="var(--accent)"/><circle cx="176" cy="106" r="10" fill="var(--hot)"/>`+klabel('Patempk į priešingas puses')),
 knotScene(kline('M10 106 L320 106','m',0)+`<circle cx="156" cy="106" r="10" fill="var(--accent)"/><circle cx="170" cy="106" r="10" fill="var(--hot)"/>`+klabel('Nukirpk galus'))],
'FG':[
 knotScene(kline('M10 106 L320 106','t',0)+kline('M10 80 C40 80 40 132 80 132 C120 132 120 80 160 80 C200 80 200 132 240 132 C270 132 270 106 300 106','m',.2,3.4)+klabel('Pintas valas pina pavadėlį')),
 knotScene(kline('M10 106 L320 106','t',0)+kline('M10 80 C40 80 40 132 80 132 C120 132 120 80 160 80 C200 80 200 132 240 132','m',0,3.4)+coil(244,106,3,10,'m',.4)+klabel('2–3 pusiniai mazgai ant pavadėlio')),
 knotScene(kline('M10 106 L320 106','t',0)+coil(212,106,3,10,'m',0)+coil(250,106,5,8,'m',.3)+klabel('3–5 pusiniai mazgai ant abiejų')),
 knotScene(kline('M10 106 L320 106','t',0)+`<rect x="196" y="97" width="66" height="18" rx="9" fill="var(--accent)"/>`+klabel('Sutempk, nukirpk galus'))]
};

/* ---------- masalų vizualizacija ---------- */
const LURE_COL=[
 [/watermelon\s*pp|watermelon\s*pepper/i,['#86a85e','#2f4a2a','#dbe8bc'],'flecks'],
 [/fresh\s*watermelon/i,['#a3cc72','#4c7a35','#eaf4cd']],
 [/silver\s*bluegill/i,['#a9bccb','#3d6f93','#eef2f5'],'flecks'],
 [/green\s*tomato/i,['#8f9c40','#4f5a1f','#dccb62']],
 [/watermelon|arbūz/i,['#86a85e','#2f4a2a','#dbe8bc']],
 [/green\s*pumpkin|pumpkin/i,['#8a8a3a','#4a4a20','#c9b45a']],
 [/motor\s*oil|alyv/i,['#6b5a3a','#2f3a2a','#a39266']],
 [/chartreuse|salotin/i,['#c6e04a','#7f9a1f','#f0f6b0']],
 [/fire\s*tiger/i,['#e9a82b','#cf4a1b','#f4e08a']],
 [/perch|ešer/i,['#8a9a4a','#2f4a2a','#e8d36a']],
 [/roach|kuoj/i,['#b8c2c8','#7a8a96','#f0f1f2']],
 [/black|juod/i,['#2a2a2e','#0e0e10','#55555c']],
 [/white|balt/i,['#f2f2ee','#c9c9c2','#ffffff']],
 [/pearl|perl/i,['#e8e4de','#b9b4ac','#fbfaf7']],
 [/silver|sidabr/i,['#c7ccd1','#8a9299','#eef0f2']],
 [/gold|auks/i,['#d9b44a','#9a7a1f','#f1dc8a']],
 [/orange|oranž/i,['#ee8a2b','#b8520f','#f8c98a']],
 [/red|raud/i,['#c9302c','#7a1512','#e8847f']],
 [/pink|rož/i,['#ef8fb4','#b84a76','#fbd0e1']],
 [/blue|mėl/i,['#3f78c7','#1f3f78','#a8c7ee']],
 [/purple|violet|violet/i,['#7a4ab0','#3d2063','#c3a6e0']],
 [/brown|rud/i,['#7a5236','#3d2616','#b89877']],
 [/yellow|gelt/i,['#f2d034','#b8941a','#faeb9a']],
 [/clear|ghost|skaidr/i,['#d8e6ec','#9fb6c0','#f3f8fa']],
 [/natural|natūral/i,['#a8a888','#5e5e48','#e0dcc4']]
];
function lureCol(g){const s=[g.color,g.model,g.name].filter(Boolean).join(' ');
  for(const [re,c,f] of LURE_COL){if(re.test(s))return {c,flecks:!!f,known:true}}
  return {c:['#bdb7aa','#807a6d','#e8e3d8'],flecks:false,known:false}}
let _lid=0;
function lureSVG(g,cls){
  const {c,flecks,known}=lureCol(g);const id='lg'+(++_lid);
  const t=(g.type||'').toLowerCase();
  const defs=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[1]}"/><stop offset=".5" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs>`;
  const fl=flecks?[[30,22],[42,19],[54,23],[66,20],[48,27],[36,26],[60,26],[74,22]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r=".9" fill="#fff" opacity=".55"/>`).join(''):'';
  let body='';
  if(/vobler|paviršin/.test(t)){
    body=`<path d="M22 26 L10 22 L12 32 Z" fill="#8a949c" opacity=".9"/><path d="M26 24 C40 11 78 11 98 22 C104 25 104 27 98 30 C78 38 40 37 26 28 C24 27 24 25 26 24Z" fill="url(#${id})" stroke="${c[1]}" stroke-width=".8"/>
     <path d="M60 36 l-3 6 M60 36 l3 6" stroke="#8a949c" stroke-width="1.2"/><circle cx="88" cy="22" r="2.6" fill="#fff"/><circle cx="88.6" cy="22" r="1.2" fill="#111"/>${fl}`}
  else if(/blizg/.test(t)){
    body=`<ellipse cx="62" cy="24" rx="34" ry="13" transform="rotate(-14 62 24)" fill="url(#${id})" stroke="${c[1]}" stroke-width=".8"/><circle cx="30" cy="30" r="2.4" fill="none" stroke="#8a949c" stroke-width="1.4"/><path d="M92 14 l8 -6" stroke="#8a949c" stroke-width="1.4"/>${fl}`}
  else if(/sukr|spinner/.test(t)){
    body=`<ellipse cx="44" cy="24" rx="20" ry="11" fill="url(#${id})" stroke="${c[1]}" stroke-width=".8"/><rect x="62" y="21" width="30" height="6" rx="3" fill="#8a949c"/><path d="M96 24 q10 4 8 14" fill="none" stroke="#8a949c" stroke-width="1.6"/>`}
  else if(/jig/.test(t)){
    body=`<circle cx="44" cy="24" r="12" fill="url(#${id})" stroke="${c[1]}" stroke-width=".8"/><circle cx="48" cy="21" r="2.2" fill="#fff"/><path d="M54 26 C74 26 92 20 100 12" fill="none" stroke="#8a949c" stroke-width="1.8"/>`}
  else if(/kabliuk|pasvar|sukut|karabin/.test(t)||g.cat==='terminal'){
    body=`<path d="M40 8 L40 30 C40 42 62 42 66 30 L60 24" fill="none" stroke="#8a949c" stroke-width="2.4" stroke-linecap="round"/>`}
  else{ /* gumytė / šadas */
    body=`<path d="M10 24 C22 12 56 12 82 20 L90 24 L82 28 C56 36 22 36 10 24Z" fill="url(#${id})" stroke="${c[1]}" stroke-width=".8"/>
     <path d="M86 24 C96 10 110 12 114 24 C110 36 96 38 86 24Z" fill="${c[0]}" stroke="${c[1]}" stroke-width=".8" opacity=".92"/>
     <path d="M20 26 C40 30 66 30 82 26" fill="none" stroke="${c[2]}" stroke-width="1.6" opacity=".7"/>
     <circle cx="24" cy="22" r="2.4" fill="#fff"/><circle cx="24.5" cy="22" r="1.1" fill="#111"/>${fl}`}
  const warn=known?'':'<text x="60" y="46" text-anchor="middle" font-size="8" fill="#807a6d">spalva neatpažinta</text>';
  return `<svg class="${cls||'lureimg'}" viewBox="0 0 120 48" role="img" aria-label="${esc(gl(g))}">${defs}${body}${warn}</svg>`}
const gimg=g=>g.thumb||PRODUCT_IMG[g.id]||'';
const lureVisual=g=>gimg(g)?`<img class="lureimg photo" src="${gimg(g)}" alt="${esc(gl(g))}">`:lureSVG(g,'lureimg');
const lureShow=(g,cls)=>gimg(g)?`<img class="${cls||'lureimg'} photo" src="${gimg(g)}" alt="">`:lureSVG(g,cls||'lureimg');
