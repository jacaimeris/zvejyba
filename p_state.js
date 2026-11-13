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
