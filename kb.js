/* ============================================================
   ŽINIŲ BAZĖ. Kiekvienas teiginys turi šaltinio ID.
   Patikimumas: A recenzuotas / oficialus teisės aktas,
   A- oficiali institucijos atmintinė (ne teisės aktas),
   B institucijos pranešimas ar agregatorius, C magistro darbas ar specializuota spauda, D nepatikrinta.
   Taikomumas Lietuvai: aukštas / vidutinis / žemas.
   Paskutinis tikrinimas: 2026-11-13.
   ============================================================ */
const KB_DATE='2026-11-13';

const SRC={
 A1:{t:'AAD atmintinė: žvejybos laikotarpiai, dydžiai, kiekiai (infografikas, PDF)',g:'A-',ap:'aukštas',url:'https://aad.lrv.lt/lt/konsultacijos/atmintines/zvejyba/zvejybos-atmintine/',n:'Puslapis atnaujintas 2026-11-10, infografike nurodyta 2026.05.15. Perskaityta 2026-11-13. Ne teisės aktas.'},
 A2:{t:'AAD atmintinė: žvejybos įrankiai ir būdai',g:'A-',ap:'aukštas',url:'https://aad.lrv.lt/lt/konsultacijos/atmintines/zvejyba/zvejybos-irankiai-budai/',n:'Atnaujinta 2026-10-29. Perskaityta 2026-11-13.'},
 A3:{t:'AAD atmintinė: mėgėjų žvejybos leidimai',g:'A-',ap:'aukštas',url:'https://aad.lrv.lt/lt/konsultacijos/atmintines/zvejyba/megeju-zvejybos-leidimai/',n:'Atnaujinta 2026-10-28.'},
 A4:{t:'AAD atmintinė: poledinė žūklė',g:'A-',ap:'aukštas',url:'https://aad.lrv.lt/lt/konsultacijos/atmintines/zvejyba/poledine-zukle/',n:'Atnaujinta 2026-10-27.'},
 A5:{t:'AAD atmintinė: žvejybos sąlygos konkrečiuose vandens telkiniuose',g:'A-',ap:'aukštas',url:'https://aad.lrv.lt/lt/konsultacijos/atmintines/zvejyba/zvejybos-draudimai-upiu-ruozuose/',n:'Perskaityta 2026-11-13. Upių sąrašas čia įkeltas tik iš dalies (Vilniaus ir Trakų regionas).'},
 A6:{t:'Mėgėjų žvejybos vidaus vandenyse taisyklės (pirminis tekstas, e-seimas TAIS.441228)',g:'A',ap:'aukštas',url:'https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.441228/asr',n:'NEPERSKAITYTA: e-seimas blokuoja automatinį skaitymą. Taisyklių suvestinė laukia, kol Arnas ją pateiks.'},
 B1:{t:'zvejogidas.lt (ežerų duomenų agregatorius)',g:'B-',ap:'aukštas',url:'https://zvejogidas.lt/ezeras/ezeras-viesai-traku-raj',n:'Ežero ribos sutampa su AAD (A1), kitų laukų šaltinio nėra. Atnaujinimo datos nėra. Naudoti tik kaip užuominą, nuomą tikrinti ALIS.'},
 P1:{t:'Kuparinen, Klefoth, Arlinghaus 2010, Fisheries Research 105:111-117 (lydeka, Vokietijos ežeras)',g:'A',ap:'vidutinis',url:'https://doi.org/10.1016/j.fishres.2010.03.011',n:'Vienas ežeras. Skaitytos tik santraukos.'},
 P2:{t:'Roste 2020, NMBU magistro darbas (lydeka, Norvegija)',g:'C',ap:'žemas',url:'https://static02.nmbu.no/mina/studier/moppgaver/2020-Roste.pdf',n:'Nerecenzuota, vienas ežeras, spalis.'},
 P3:{t:'Bursell, Arlinghaus 2018, PeerJ 6:e4744 (release-rig, Baltijos lydeka)',g:'A-',ap:'aukštas',url:'https://peerj.com/articles/4744',n:'Piliečių mokslo duomenys, ne griežtas eksperimentas.'},
 P4:{t:'Heermann ir kt. 2013, Fish. Manag. Ecol. 20:187-200 (ešerys, 21 ežeras Vokietijoje)',g:'A',ap:'aukštas',url:'https://doi.org/10.1111/fme.12000',n:'Žvejų žurnalai + eksperimentinė žvejyba.'},
 P5:{t:'Horký ir kt. 2008, Hydrobiologia 614:151-157 (starkis, Elbė)',g:'A',ap:'vidutinis',url:'https://vuzv.cz/publikace/a-telemetry-study-on-the-diurnal-distribution-and-activity-of-adult-pikeperch-sander-lucioperca-l-in-a-riverine-environment',n:'Upė, telemetrija. Poulet ir kt. 2005 (Hydrobiologia 543:79-90, pietų Prancūzija) rodo tą patį, bet šiltas klimatas.'},
 P6:{t:'Rakauskas ir kt. 2019, KMAE (mažų rytų Lietuvos ežerų biokontrolė)',g:'A',ap:'aukštas',url:'https://www.kmae-journal.org/10.1051/kmae/2019013',n:'Ištirti ežerai: Beržuvis, Bevardis, Cirkliškis, Stūgliai. Tomas ir puslapiai nepatikrinti.'},
 P7:{t:'Dainys ir kt. 2022, Fishes 7(5):232 (Kauno marios)',g:'A',ap:'aukštas',url:'https://www.mdpi.com/2410-3888/7/5/232/htm',n:'Mėgėjų žvejyba stabdo starkių ir ešerių atsistatymą.'},
 P8:{t:'Žuvininkystės tarnyba / LIFE: lydekų jauniklių išleidimas Vilniaus ir Trakų ežeruose, 2025-10-02',g:'B',ap:'aukštas',url:'https://lifesipvanduo.apva.lt/en/news/i-vilniaus-ir-traku-rajonu-ezerus-isleista-daugiau-kaip-2-tukstanciai-dirbtiniu-budu-uzaugintu-lydekaiciu-jaunikliu/',n:'Institucijos pranešimas.'},
 P9:{t:'Ann. Zool. Fennici 33:669-678 (1996), Baltijos ešerio aktyvumas',g:'A',ap:'vidutinis',url:'https://www.annzool.net/PDF/anzf33/anzf33-669p.pdf',n:'Aktyvumas koreliuoja su temperatūra ir dienos ilgiu.'},
 N1:{t:'In-Fisherman perpasakojimas apie J. Casselmano tyrimus (lydeka po ledu)',g:'C',ap:'žemas',url:'https://www.in-fisherman.com/editorial/understanding-winter-pike/387779',n:'Specializuota spauda, Kanados skydo ežerai. Tik hipotezei.'}
};

/* Pagrindas rekomendacijoms. Brifas gali remtis TIK šiais įrašais. */
const EVID=[
 {id:'EV1',f:'Prieblanda (lydeka)',sp:'Lydeka',claim:'Lydekos kibimas (pagavimai per valandą) didesnis prieblandoje (aušra ir sutemos) nei kitu paros metu.',src:['P1'],conf:'vidutinis',ap:'Vienas Vokietijos ežeras, eksperimentinė žvejyba. Klimatas ir ežero tipas panašūs.'},
 {id:'EV2',f:'Vėjas (lydeka)',sp:'Lydeka',claim:'Stipresnio vėjo dienomis lydeka kibo geriau. Slenksčio šaltinis nenurodo.',src:['P1'],conf:'vidutinis',ap:'Vienas ežeras.'},
 {id:'EV3',f:'Mėnulis (lydeka)',sp:'Lydeka',claim:'Pagavimai didesni aplink pilnatį ir jaunatį. Ką reiškia "aplink", šaltinio santraukoje nepasakyta; programa naudoja ±2 d. (savo apibrėžimas).',src:['P1'],conf:'žemas',ap:'Vienas ežeras, santraukos lygis.'},
 {id:'EV4',f:'Vandens temperatūra (lydeka)',sp:'Lydeka',claim:'Aukštėjant vandens temperatūrai lydekos pagavimai mažėjo.',src:['P1'],conf:'vidutinis',ap:'Vienas ežeras; tyrimo temperatūrų intervalas man nežinomas.'},
 {id:'EV5',f:'Žvejybos spaudimas',sp:'Lydeka',claim:'Intensyvi žvejyba per paskutines 2 dienas statistiškai reikšmingai mažino pagavimus ir buvo stipriausias iš veiksnių. Pagavimai krito net be žuvų pasilikimo.',src:['P1'],conf:'vidutinis',ap:'Vienas ežeras. Mažiems, lengvai prieinamiems Vilniaus ežerams logiška, bet neįrodyta.'},
 {id:'EV6',f:'Oro slėgis',sp:'visos',claim:'NEĮRODYTA. Recenzuotame tyrime (P1) slėgis tarp reikšmingų veiksnių nepaminėtas, nerecenzuotame magistro darbe (P2) žemas slėgis didino pagavimus. Šaltiniai nesutaria, todėl slėgis brife nevertinamas.',src:['P1','P2'],conf:'žemas',ap:'Prieštarauja.'},
 {id:'EV7',f:'Prieblanda (starkis)',sp:'Starkis',claim:'Starkio judrumas didžiausias prieblandoje, mažiausias naktį. Tai bendra tendencija, o ne taisyklė.',src:['P5'],conf:'vidutinis',ap:'Upė Čekijoje.'},
 {id:'EV8',f:'Sistema (lydeka)',sp:'Lydeka',claim:'"Release-rig" sistema (smulkesni kabliukai, kitoks tvirtinimas) pakėlė sėkmingą ištraukimą nuo 45% iki 85%. Masalo tipas ir vandens temperatūra ištraukimui įtakos neturėjo. Kietieji masalai su įprasta sistema sukėlė daugiau sužalojimų.',src:['P3'],conf:'vidutinis',ap:'Baltijos lydeka, spiningavimas. Piliečių mokslo duomenys.'},
 {id:'EV9',f:'Ešerys: žvejas ir sezonas',sp:'Ešerys',claim:'Ešerių pagavimus stipriai veikia paties žvejo veiksniai (patirtis, tikslinė rūšis, masalas), vandens skaidrumas ir sezonas. Rudenį pagavimai didesni dėl maisto stygiaus.',src:['P4'],conf:'vidutinis',ap:'21 ežeras Vokietijoje, ledynų formuotas kraštovaizdis. Konkretaus masalo šaltinis nenurodo.'},
 {id:'EV10',f:'Ešerio aktyvumas',sp:'Ešerys',claim:'Ešerio plaukimo aktyvumas sezoniškai kinta pagal temperatūrą ir dienos ilgį, nerštavietėje pikas.',src:['P9'],conf:'vidutinis',ap:'Baltijos populiacija.'},
 {id:'EV11',f:'Deguonis po ledu',sp:'visos',claim:'Mažuose rytų Lietuvos ežeruose ilgai tvyrant ledui deguonies stygius pasitaiko nereguliariai. Tai keičia žuvų vietą ir kibimą.',src:['P6'],conf:'vidutinis',ap:'Tiesiogiai Lietuva, bet tik 4 ištirti ežerai.'},
 {id:'EV12',f:'Šviesa po ledu (hipotezė)',sp:'Lydeka',claim:'Specializuotos spaudos teigimu, žiemą po ledu šviesa gali būti artima optimaliai lydekai, o įtekantys upeliai turtingesni deguonies. NEPATVIRTINTA recenzuotu šaltiniu.',src:['N1'],conf:'žemas',ap:'Kanados ežerai.'},
 {id:'EV13',f:'Masalo parinkimas',sp:'visos',claim:'Rasta TIK tiek: konkretaus masalo (tipo, spalvos, dydžio) pranašumo Lietuvos ežeruose recenzuotų duomenų nėra. Masalų rekomendacijos remiasi tavo paties pagavimais ir metodiniu principu, ne literatūra.',src:[],conf:'žemas',ap:'Tyrimų spraga.'}
];

/* Metodika: kaip programa daro išvadas */
const PROC=[
 ['1. Šaltinių tikrinimas','Kiekvienas šaltinis registre turi patikimumo žymą (A, A-, B, C, D) ir taikomumo Lietuvai vertinimą. Teisės faktams naudojami tik oficialūs šaltiniai (AAD atmintinės, vėliau pirminis taisyklių tekstas). Agregatorių duomenys (B-) niekada nelaikomi galutine tiesa, o ežero nuoma tikrinama ALIS.'],
 ['2. Teisinė dalis','Brifo teisinė dalis skaičiuojama taisyklėmis, o ne generuojama dirbtinio intelekto. Taisyklės įkeltos iš AAD atmintinių su šaltinio nuoroda. Kiekviena eilutė rodo, ar taisyklė patikrinta pirminiame akte (kol kas ne).'],
 ['3. Sąlygų vertinimas','Programa lygina tavo nurodytas sąlygas su įrodymų lentele (EV1-EV13). Jei šaltinis veiksnio nepatvirtina arba šaltiniai prieštarauja (pvz. slėgis), veiksnys nevertinamas ir tai parašoma.'],
 ['4. Masalai ir sistema','Dirbtinis intelektas parenka tik iš tavo spintos ir privalo prie kiekvieno pasirinkimo nurodyti įrodymų ID. Kai įrodymo nėra, rekomendacija ženklinama "nepatvirtinta" ir žemu pasitikėjimu. Komplektas sudaromas taip, kad skirtingi masalai duotų informacijos tavo duomenims (metodinis sprendimas, ne literatūros).'],
 ['5. Laimikių įrašymas','Tu fotografuoji laimikį su masalu. Laikas ir vieta paimami iš nuotraukos EXIF, žuvis ir masalas atpažįstami iš nuotraukos, o tu patvirtini. Žvejybos pradžia ir pabaiga duoda pastangas.'],
 ['6. Statistika','Rodikliai skaičiuojami per valandą (pastangos). Kiekviena išvada žymima pasitikėjimu pagal duomenų kiekį. Masalų lentelė rodo tik pagavimus be bandymų skaičiaus, todėl ji nerodo masalo efektyvumo.'],
 ['7. Hipotezės','Hipotezes sudariau iš šaltinių (EV). Kiekviena turi aiškų testą. Rezultatas skaičiuojamas pagal tavo duomenis: pagavimų per valandą santykis (RR) su 95% intervalu, kurio paklaida padidinta 1,5 karto (mano konservatyvus sprendimas dėl netolygaus kibimo, ne literatūros skaičius). Mažiausia imtis: 5 žvejybos kiekvienoje grupėje ir 10 žuvų iš viso, kitaip rašoma "nepakanka duomenų".'],
 ['8. Dokumentavimas','Mygtukas "Įvertinti ir įrašyti" išsaugo hipotezės rezultatą su data ir imtimi. Taip matyti, kaip išvada keitėsi augant duomenims.']
];

/* Taisyklės. Lietuvos mėgėjų žvejyba vidaus vandenyse. */
const SPECIES_RULES={
 'Lydeka':{closed:[[2,1,4,30]],limit:2,min:50,max:80,src:'A1',note:'Dydžio ribojimas netaikomas 2 priede nurodytose upėse; 7 priede nurodytuose telkiniuose leidžiama pasilikti vieną ne mažesnę nei 65 cm lydeką.'},
 'Starkis':{closed:[[3,1,5,31]],limit:2,min:50,max:65,src:'A1',note:''},
 'Šamas':{closed:[[1,1,4,1],[11,1,12,31]],limit:1,min:75,src:'A1',note:''},
 'Vėgėlė':{closed:[[12,15,12,31],[1,1,1,31]],limit:3,min:45,src:'A1',note:''},
 'Ešerys':{closed:[],limit:null,min:null,src:'A1',note:'Ešerys nėra atskirai išvardytas (kitos žuvys): ribos neturi, galioja bendras 5 kg svorio limitas.'},
 'Upėtakis':{closed:[],limit:2,min:30,max:40,src:'A1',note:'Margasis upėtakis: žvejojamas limituotoje žvejyboje, kortelė; sezonai pagal limituotos žvejybos telkinį.'},
 'Kuoja':{closed:[],limit:null,min:null,src:'A1',note:''},
 'Karšis':{closed:[],limit:null,min:null,src:'A1',note:''}
};
const WEIGHT_RULE='Vienos žvejybos metu sugautų žuvų (kurioms nėra savo normos) bendras svoris negali viršyti 5 kg (Kuršių mariose 7 kg).';
const YEAR_BAN='Visus metus draudžiama žvejoti: skersnukius, vijūnus, jūrines ir mažąsias nėges, nėgių vingilius, aštriašnipius erškėtus (ersketus), sterles ir plačiažnyplius vėžius (pavadinimus tikrinti infografike).';

/* Upės, kuriose žvejyba uždrausta spalio 1 d. - gruodžio 31 d. (A5). DALINIS sąrašas: Vilniaus ir Trakų regionas.
   Pilnas sąrašas AAD puslapyje. */
const RIVER_BAN_OCT_DEC=['Bezdonė','Bražuolė','Dūkšta','Juodė','Kamaja','Kena','Vilnia','Laukysta','Lokys','Lomena','Manierka','Mozūriškanka','Musė','Nemenčia','Riešė','Rudamina','Saidė','Strūna','Strečia','Taurija','Veršupis','Vokė','Žalesa','Žiežmara','Žeimena','Jusinė','Lakaja','Luknelė','Mera','Peršokšna','Petruškė','Saria','Skerdiksna','Skirda','Merkys','Cirvija','Lukna','Geluža','Grūda','Spengla','Ūla','Verknė','Samė','Strūzda'];
const NEMUNAS_BAN_JUL_DEC='Nemuno ruožai, kuriuose žvejyba draudžiama liepos 1 d. - gruodžio 1 d.: Jūros žiotys (+100 m dešiniu krantu), 150 m aukščiau Dubysos žiočių iki Meškupio žiočių, nuo Piliakalnio upelio žiočių iki Upesnio žiočių, Nevėžio žiotys (+100 m dešiniu krantu).';
const ECO_WATERS={'Alovė':'','Antakmenių ež.':'','Biržulis':'Iš valčių draudžiama žvejoti nuo navigacijos pradžios iki liepos 31 d.; karpinių žvejyba be bilieto negalioja.','Dviragis':'','Gėlių ež.':'','Ilgės ež.':'Draudžiama žvejoti balandžio 1 d. - rugpjūčio 1 d.','Ilmėdas':'','Imbradas':'','Kalvių':'','Kampuolis':'','Kaviškis':'','Kiaunas':'','Kiementas':'','Mūšėjus':'','Lūkstas':'','Mosėdžio I tvenkinys':'','Neveiglas':'','Paršežeris':'','Prapuntas':'','Riešė':'Draudžiama gaudyti baltuosius plačiakakčius.','Savistas':'','Simno ež.':'','Širvys':'','Šventas':'Draudžiama gaudyti baltuosius plačiakakčius.','Veisiejis':'Niedaus ornitologinio draustinio teritorijoje draudžiama žvejoti balandžio 1 d. - rugpjūčio 1 d.','Zapsys':'','Žiezdrelis':''};
const ECO_RULES='Ekologinei būklei gerinti skirti telkiniai (A5): plėšriąsias žuvis galima žvejoti tik dirbtiniais masalais; vienas žvejys naudoja ne daugiau kaip 1 įrankį; per žvejybą galima pasilikti vieną lydeką ir vieną starkį (abu ne mažesni nei 65 cm); jei žvejojama naudojant sonarą ar kitus žuvis aptikti padedančius prietaisus, visas lydekas ir starkius reikia paleisti; karpines žuvis galima žvejoti be bilieto (išskyrus Biržulį).';
const BANNED_WATERS='Žvejyba uždrausta: Jūra (Tauragė), Nemunas žemiau Kauno HE (500 m), Šventoji (Kavarskas ir Anykščių ruožai), Kuršių marių pakrantė tarp Atmatos ir Skirvytės (<1 km nuo kranto) ir Kniaupo įlanka, Krokų lankos draustinis, rezervatų vandens telkiniai (be limituotos žvejybos) ir valstybiniai akvakultūros tvenkiniai.';

/* Vandenų profiliai su kilme. Į programą įkeliami mygtuku. */
const KB_WATERS=[
 {name:'Viesai',kind:'Ežeras',region:'Trakų r., ~8 km į vakarus nuo Trakų',area:'45.42',maxDepth:'20.86',meanDepth:'7.12',coords:'54.633432, 24.796452',
  bottom:'',access:'Parkavimas ir valčių nuleidimo vietos šaltinyje nenurodyti. Automobilio negalima statyti arčiau nei 25 m nuo vandens.',
  notes:'Įžuvinimas: 2023-10-27 išleista 440 lydekų šiųmetukų (B1). Žuvų sudėtis nepatvirtinta (B1). Matuota: 45,42 ha, vidutinis gylis 7,12 m (B1).',
  legal:{status:'neišnuomotas',tenant:'',prevTenant:'Spearfishing Club Rykliukas (leidimas galiojo iki 2025-07-27)',ticket:'L05.1 (žvejo mėgėjo bilietas)',
   boat:'Elektrinis variklis arba be variklio. Benzininiai varikliai: šaltinis neaiškus, TIKRINTI. Benzininės valtys: 100 m nuo kranto tik minimaliu greičiu.',
   src:'B1',checked:KB_DATE,verifiedPrimary:false,todo:'ALIS: patikrinti, ar po 2025-07-27 nėra naujo nuomininko; patikrinti variklių taisykles pagal pirminį tekstą.'}}
];

/* Hipotezės: sudarytos iš EVID. Testas apibrėžtas logic.js */
const HYP=[
 {id:'H1',text:'Lydekos kimba geriau prieblandoje (1 val. aplink saulėtekį ir saulėlydį) nei kitu paros metu.',ev:['EV1'],test:'twilight',sp:['Lydeka'],exp:'+'},
 {id:'H2',text:'Starkiai kimba geriau prieblandoje nei kitu paros metu.',ev:['EV7'],test:'twilight',sp:['Starkis'],exp:'+'},
 {id:'H3',text:'Žvejybose su stipresniu vėju (virš tavo duomenų medianos) lydekų per valandą daugiau.',ev:['EV2'],test:'wind',sp:['Lydeka'],exp:'+'},
 {id:'H4',text:'Aplink jaunatį ir pilnatį (±2 d.) lydekų per valandą daugiau.',ev:['EV3'],test:'moon',sp:['Lydeka'],exp:'+'},
 {id:'H5',text:'Šaltesnio vandens žvejybose (žemiau tavo duomenų medianos, ne ledas) lydekų per valandą daugiau.',ev:['EV4'],test:'wtemp',sp:['Lydeka'],exp:'+'},
 {id:'H6',text:'Kai ežeras buvo intensyviai žvejotas per paskutines 2 dienas, lydekų per valandą mažiau.',ev:['EV5'],test:'pressure2d',sp:['Lydeka'],exp:'-'},
 {id:'H7',text:'Žemo slėgio (<1010 hPa) dienomis lydekų per valandą daugiau nei aukšto (≥1015 hPa). Ginčytina: šaltiniai nesutaria.',ev:['EV6'],test:'airpressure',sp:['Lydeka'],exp:'+'}
];
