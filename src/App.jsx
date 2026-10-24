import React, { useState, useMemo, useEffect, useRef } from "react";

// ========== LANGUAGE & CURRENCY ==========
let LANG="el",CURSYM="€";
const APP_VER="2.21";
const LANG_DICTS={};            // LANG_DICTS.en = EN (βλ. παρακάτω) — κάθε νέα γλώσσα = ένα νέο λεξικό
const LANGS=[{id:"el",name:"Ελληνικά",flag:"gr"},{id:"en",name:"English",flag:"gb"},{id:"de",name:"Deutsch",flag:"de"},{id:"fr",name:"Français",flag:"fr"},{id:"it",name:"Italiano",flag:"it"},{id:"es",name:"Español",flag:"es"},{id:"ru",name:"Русский",flag:"ru"}];
const CURRENCIES=[
  {id:"EUR",sym:"€"},{id:"USD",sym:"$"},{id:"GBP",sym:"£"},{id:"CHF",sym:"CHF"},{id:"SEK",sym:"kr"},
  {id:"PLN",sym:"zł"},{id:"CZK",sym:"Kč"},{id:"RON",sym:"lei"},{id:"BGN",sym:"лв"},{id:"TRY",sym:"₺"},
  {id:"AUD",sym:"A$"},{id:"CAD",sym:"C$"},{id:"RUB",sym:"₽"},
];
const cs=s=>String(s).replace(/€/g,CURSYM);
const t=s=>{const d=LANG_DICTS[LANG];return cs((d&&d[s])||s);};
const tf=(s,...a)=>t(s).replace(/\{(\d+)\}/g,(m,i)=>a[+i]!==undefined?a[+i]:"");

// ========== CONSTANTS ==========
const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];
const VCATS = [
  {id:"car",label:"ΙΧ",icon:"🚗"},{id:"taxi",label:"Taxi",icon:"🚕"},
  {id:"moto",label:"Μηχανή",icon:"🏍️"},{id:"van",label:"Βαν",icon:"🚐"},
  {id:"ltruck",label:"Ελαφρύ Φορτηγό",icon:"🚚"},{id:"truck",label:"Βαρύ Φορτηγό",icon:"🚛"},
  {id:"bus",label:"Λεωφορείο",icon:"🚌"},
];
const FTYPES = [
  {id:"petrol",label:"Βενζίνη",icon:"🟢"},{id:"diesel",label:"Diesel",icon:"🟡"},
  {id:"lpg",label:"Υγραέριο (LPG)",icon:"🟣"},
  {id:"cng",label:"Φυσικό Αέριο",icon:"⚪"},{id:"electric",label:"Ηλεκτρισμός (kWh)",icon:"⚡"},
];
const POWERTRAINS = [
  {id:"ice",label:"Καύσιμο",icon:"⛽"},{id:"hybrid",label:"Υβριδικό (αυτοφορτιζόμενο)",icon:"🔋"},
  {id:"phev",label:"Plug-in υβριδικό (φορτίζει από πρίζα)",icon:"🔌"},{id:"ev",label:"Ηλεκτρικό",icon:"⚡"},
];
const GEARBOXES = [
  {id:"manual",label:"Χειροκίνητο"},{id:"auto",label:"Αυτόματο"},{id:"dct",label:"Διπλού συμπλέκτη (DCT)"},
  {id:"cvt",label:"CVT"},{id:"single",label:"Μονοταχές (EV)"},
];
const DRIVES = [
  {id:"fwd",label:"Εμπρός κίνηση (FWD)"},{id:"rwd",label:"Πίσω κίνηση (RWD)"},
  {id:"awd",label:"Τετρακίνηση μόνιμη (AWD)"},{id:"4wd",label:"4x4 επιλεγόμενη"},
];
// Παλιά δεδομένα: οι 3 αμόλυβδες γίνονται "Βενζίνη" (τα οκτάνια κρατιούνται ως πληροφορία)
const LEGACY_FUEL = {unleaded95:["petrol","95"],unleaded98:["petrol","98"],unleaded100:["petrol","100"],diesel_plus:["diesel","Plus"]};
const normFuelId=id=>LEGACY_FUEL[id]?LEGACY_FUEL[id][0]:id;
const normVehicles=vs=>(vs||[]).map(v=>({powertrain:"ice",...v,fuelType:normFuelId(v.fuelType)||"",fuelType2:normFuelId(v.fuelType2)||""}));
const normEntries=en=>{const o={};Object.keys(en||{}).forEach(k=>{o[k]=(en[k]||[]).map(e=>LEGACY_FUEL[e.fuelType]?{...e,fuelType:LEGACY_FUEL[e.fuelType][0],octane:LEGACY_FUEL[e.fuelType][1]}:e);});return o;};
const fuelsForPT=pt=>pt==="ev"?[]:pt==="phev"?FTYPES.filter(f=>["petrol","diesel"].includes(f.id)):FTYPES.filter(f=>f.id!=="electric");
const applyPT=(v,pt)=>{
  const o={...v,powertrain:pt};
  if(pt==="ev"){o.fuelType="electric";o.fuelType2="";}
  else{
    if(o.fuelType==="electric")o.fuelType="";
    if(pt==="phev"){o.fuelType2="electric";if(o.fuelType&&!fuelsForPT("phev").some(f=>f.id===o.fuelType))o.fuelType="";}
    else if(o.fuelType2==="electric")o.fuelType2="";
  }
  return o;
};
const unitOf=ft=>ft==="electric"?"kWh":"L";

const EXPENSE_CATS = [
  {id:"tolls",label:"Διόδια",icon:"🛣️"},
  {id:"transponder",label:"Πομποδέκτης Ε.Ο.",icon:"📡"},
  {id:"parking",label:"Parking",icon:"🅿️"},
  {id:"car_wash",label:"Πλύσιμο",icon:"🚿"},
  {id:"car_clean",label:"Καθαρισμός",icon:"🧹"},
  {id:"glass",label:"Τζάμια",icon:"🪟"},
  {id:"kek",label:"ΚΕΚ",icon:"🚗💨"},
  {id:"kteo",label:"ΚΤΕΟ",icon:"🚗✅"},
  {id:"road_tax",label:"Τέλη Κυκλοφορίας",icon:"🚘"},
  {id:"insurance",label:"Ασφάλεια",icon:"🛡️"},
  {id:"repair",label:"Επισκευή",icon:"🔩"},
  {id:"service",label:"Service",icon:"🔧"},
  {id:"oil",label:"Λάδια/Φίλτρα",icon:"🛢️"},
  {id:"parts",label:"Ανταλλακτικά",icon:"⚙️"},
  {id:"battery",label:"Μπαταρία",icon:"🔋"},
  {id:"electrical",label:"Ηλεκτρολογικά",icon:"💡"},
  {id:"tyres",label:"Ελαστικά",icon:"🛞"},
  {id:"alignment",label:"Ζυγοστάθμιση",icon:"⚖️"},
  {id:"fine",label:"Πρόστιμο",icon:"🚔"},
  {id:"custom",label:"Άλλο",icon:"💸"},
];

const MONTHS_FULL=["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];
const MONTHS_SHORT=["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];
const WEEKDAYS=["Δε","Τρ","Τε","Πε","Πα","Σα","Κυ"];

// ========== UTILITIES ==========
const uid=()=>Math.random().toString(36).substr(2,9);
// Κατανάλωση "γεμάτο → γεμάτο": τα μερικά γεμίσματα ενδιάμεσα αθροίζονται στο επόμενο φουλ.
const computeSegments=(list,pt)=>{
  const out={};
  if(pt==="phev")return out;
  ["f","e"].forEach(kind=>{
    let anchor=null,acc=0;
    list.forEach(e=>{
      if((e.fuelType==="electric"?"e":"f")!==kind)return;
      const l=parseFloat(e.liters)||0,odo=parseFloat(e.odo)||0;
      if(e.missed){anchor=null;acc=0;}
      if(anchor)acc+=l;
      if(e.full===false)return;
      if(odo>0){
        if(anchor&&odo>anchor.odo&&acc>0){const km=odo-anchor.odo;out[e.id]={cons:acc/km*100,km,l:acc};}
        anchor={odo};acc=0;
      }else{anchor=null;acc=0;}
    });
  });
  return out;
};
const fmt=(n,d=2)=>(n!=null&&!isNaN(n))?(+n).toFixed(d):"0.00";
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;};
const formatDate=ds=>{
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(ds||"");
  return m?`${m[3]}/${m[2]}/${m[1].slice(2)}`:"--/--/--";
};
// Ημερομηνίες "ΕΕΕΕ-ΜΜ-ΗΗ" χωρίς μετατροπή ζώνης ώρας (να μην μετακινείται η μέρα/μήνας)
const pd=ds=>({getFullYear:()=>+String(ds).slice(0,4),getMonth:()=>+String(ds).slice(5,7)-1});
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const csvCell=v=>{let t=String(v==null?"":v).replace(/[\r\n\t,]+/g," ").trim();if(/^[=+\-@]/.test(t))t="'"+t;return t;};
const safeName=s=>String(s||"").replace(/[^\w\u0370-\u03FF\u1F00-\u1FFF-]+/g,"_").slice(0,40)||"vehicle";
const downloadFile=(name,mime,text)=>{
  const url=URL.createObjectURL(new Blob([text],{type:mime}));
  const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),10000);
};
const dispLabel=(e,cat)=>(e&&e.label&&(!cat||e.label!==cat.label))?e.label:(cat?t(cat.label):((e&&e.label)||""));
const FS_SCALE=[1,1.12,1.25];
const fz=n=>`calc(${n}px * var(--fs, 1))`;
const guessLocale=()=>{
  try{
    const l=String(navigator.language||"el").toLowerCase(),p=l.slice(0,2);
    return{lang:LANGS.some(x=>x.id===p)?p:"en",cur:l==="en-us"?"USD":l==="en-gb"?"GBP":p==="ru"?"RUB":p==="en"?"USD":"EUR",du:l==="en-us"?"us":l==="en-gb"?"uk":"metric"};
  }catch(e){return{lang:"el",cur:"EUR",du:"metric"};}
};
const readPrefs=()=>{
  const g=guessLocale();
  try{
    const p=JSON.parse(localStorage.getItem("fuellog_prefs")||"{}");
    return{dark:p.dark!==false,fs:[0,1,2].includes(p.fs)?p.fs:1,lang:LANGS.some(x=>x.id===p.lang)?p.lang:g.lang,cur:CURRENCIES.some(c=>c.id===p.cur)?p.cur:g.cur,du:Object.prototype.hasOwnProperty.call(UNIT_PRESETS,p.du)?p.du:g.du};
  }catch(e){return{dark:true,fs:1,lang:g.lang,cur:g.cur,du:g.du};}
};
const daysUntil=ds=>{if(!ds)return null;return Math.ceil((new Date(ds)-new Date(today()))/86400000);};
const REMINDER_FIELDS=[
  {f:"insuranceExp",label:"Λήξη Ασφάλειας",icon:"🛡️"},{f:"kteo",label:"ΚΤΕΟ",icon:"🔍"},
  {f:"kek",label:"ΚΕΚ",icon:"🔬"},{f:"tiresNext",label:"Αλλαγή Ελαστικών",icon:"⚫"},
  {f:"serviceNextDate",label:"Επόμενο Service",icon:"🔧"},
  {f:"licenseExp",label:"Λήξη Διπλώματος",icon:"🪪"},
];
const WARN_DAYS=30;
const WARN_KM=1000;

// ========== THEME ==========
const DK={bg:"#080810",sf:"#10101c",br:"#1e1e30",tx:"#f5f5ff",mt:"#8888aa",ft:"#33334a",inp:"#0d0d1a",ib:"#1e1e30"};
const LT={bg:"#f0e8db",sf:"#faf3e8",br:"#d4c0a8",tx:"#111111",mt:"#555560",ft:"#e0d0bc",inp:"#ffffff",ib:"#c4b098"};
const YEL="#ffd60a";

// ========== DEFAULT FACTORIES ==========
const defInfo=()=>({brand:"",model:"",year:"",cc:"",plate:"",chassis:"",insurance:"",insuranceExp:"",kteo:"",kek:"",tiresBrand:"",tiresSize:"",tiresDate:"",tiresNext:"",serviceDate:"",serviceNextDate:"",serviceKm:"",serviceNextKm:"",serviceNotes:"",driverMain:"",driverSecond:"",oilVisc:"",licenseNo:"",licenseExp:"",gearbox:"",drive:"",battery:""});
const defV=(ov={})=>({id:uid(),name:"ΝΕΟ ΟΧΗΜΑ",icon:"🚗",color:"#f97316",category:"car",powertrain:"ice",fuelType:"",fuelType2:"",unitMiles:false,info:defInfo(),parking:null,units:{...UNIT_PRESETS.metric},...ov});
const emptyFuel=ft=>({date:today(),fuelType:ft||"diesel",ppl:"",total:"",odo:"",notes:"",full:true});
const emptyExp=()=>({date:today(),category:"",label:"",amount:"",notes:""});

const PAST_FIELDS=["tiresDate","serviceDate"];   // ημερομηνίες που αφορούν το παρελθόν (όχι μελλοντικές)
const VINFO_FIELDS=[
  {f:"brand",label:"Μάρκα",type:"text",ph:"Toyota, BMW…"},{f:"model",label:"Μοντέλο",type:"text",ph:"Corolla, X5…"},
  {f:"year",label:"Έτος",type:"number",ph:"2020"},{f:"cc",label:"Κυβικά (cc)",type:"number",ph:"1600",not:["ev"]},
  {f:"gearbox",label:"Κιβώτιο ταχυτήτων",type:"select",opts:GEARBOXES},{f:"drive",label:"Κίνηση",type:"select",opts:DRIVES},
  {f:"battery",label:"Μπαταρία (kWh)",type:"number",ph:"60",only:["ev","phev"]},
  {f:"plate",label:"Αρ. Πινακίδας",type:"text",ph:"ΑΒΓ-1234"},{f:"chassis",label:"Αρ. Πλαισίου (VIN)",type:"text",ph:"WBA…"},
  {f:"insurance",label:"Αρ. Ασφαλιστηρίου",type:"text",ph:""},{f:"insuranceExp",label:"Λήξη Ασφάλειας",type:"date",ph:""},
  {f:"kteo",label:"Επόμενο ΚΤΕΟ",type:"date",ph:""},{f:"kek",label:"Επόμενο ΚΕΚ",type:"date",ph:""},
  {f:"tiresBrand",label:"Μάρκα Ελαστικών",type:"text",ph:"Michelin…"},{f:"tiresSize",label:"Διαστάσεις Ελαστικών",type:"text",ph:"195/65R15"},
  {f:"tiresDate",label:"Τελευταία Αλλαγή Ελαστ.",type:"date",ph:""},{f:"tiresNext",label:"Επόμενη Αλλαγή Ελαστ.",type:"date",ph:""},
  {f:"serviceDate",label:"Τελευταίο Service",type:"date",ph:""},{f:"serviceNextDate",label:"Επόμενο Service (ημ.)",type:"date",ph:""},
  {f:"serviceKm",label:"Service στα (χλμ)",type:"number",ph:"150000"},{f:"serviceNextKm",label:"Επόμενο Service (χλμ)",type:"number",ph:"165000"},
  {f:"serviceNotes",label:"Σημ. Service",type:"text",ph:"Αλλαγή λαδιών…"},
  {f:"oilVisc",label:"Ιξώδες Λαδιού",type:"text",ph:"5W-30",not:["ev"]},
  {f:"driverMain",label:"Κύριος Οδηγός",type:"text",ph:"Ονοματεπώνυμο"},{f:"driverSecond",label:"2ος Οδηγός",type:"text",ph:"Ονοματεπώνυμο"},
  {f:"licenseNo",label:"Αρ. Διπλώματος",type:"text",ph:""},{f:"licenseExp",label:"Λήξη Διπλώματος",type:"date",ph:""},
];

// ---------- Μονάδες ανά όχημα (τα δεδομένα αποθηκεύονται στις μονάδες του οχήματος) ----------
const UNIT_PRESETS={metric:{dist:"km",vol:"L",cons:"L100"},us:{dist:"mi",vol:"galUS",cons:"mpgUS"},uk:{dist:"mi",vol:"L",cons:"mpgUK"}};
const L_PER={L:1,galUS:3.785411784,galUK:4.54609};
const KM_PER={km:1,mi:1.609344};
const cleanUnits=u=>({dist:u&&u.dist==="mi"?"mi":"km",vol:u&&(u.vol==="galUS"||u.vol==="galUK")?u.vol:"L",cons:u&&["kmL","mpgUS","mpgUK"].includes(u.cons)?u.cons:"L100"});
const volLabel=(ft,un)=>ft==="electric"?"kWh":(un.vol==="galUS"?"gal":un.vol==="galUK"?"gal UK":"L");
const distLabel=un=>un.dist==="mi"?"mi":t("χλμ");
const consLabel=(ev,un)=>ev?(un.cons==="L100"?"kWh/100km":un.cons==="kmL"?"km/kWh":"mi/kWh"):(un.cons==="kmL"?"km/L":un.cons==="mpgUS"?"mpg":un.cons==="mpgUK"?"mpg (UK)":"L/100km");
// c100 = όγκος ανά 100 μονάδες απόστασης (στις μονάδες του οχήματος) -> επιλεγμένη μονάδα κατανάλωσης
const consVal=(c100,ev,un)=>{
  if(!(c100>0))return 0;
  const base=(ev?c100:c100*L_PER[un.vol])/KM_PER[un.dist];   // L (ή kWh) ανά 100 km
  switch(un.cons){
    case "kmL":return 100/base;
    case "mpgUS":return (ev?62.1371:235.2146)/base;
    case "mpgUK":return (ev?62.1371:282.4809)/base;
    default:return base;
  }
};
const consMax=(ev,un)=>ev?({L100:35,kmL:12,mpgUS:8,mpgUK:8}[un.cons]):({L100:20,kmL:25,mpgUS:60,mpgUK:75}[un.cons]);
const convertUnits=(from,to,list,info)=>{
  const dk=KM_PER[from.dist]/KM_PER[to.dist],vk=L_PER[from.vol]/L_PER[to.vol];
  const r=(x,n)=>Math.round(x*n)/n;
  const ent=list.map(e=>{const el=e.fuelType==="electric";return{...e,odo:e.odo==null?e.odo:r(e.odo*dk,10000),liters:el?e.liters:r((parseFloat(e.liters)||0)*vk,100000),ppl:el?e.ppl:r((parseFloat(e.ppl)||0)/vk,1000000)};});
  const inf={...info};
  ["serviceKm","serviceNextKm"].forEach(k=>{const n=parseFloat(inf[k]);if(n>0)inf[k]=String(Math.round(n*dk));});
  return{ent,inf};
};

// Καθαρισμός/έλεγχος δεδομένων (localStorage ή εισαγόμενο JSON): αποτρέπει crash και κακόβουλο περιεχόμενο
const isDate=s=>{if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const[y,m,d]=s.split("-").map(Number);const t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d;};
const numOr0=x=>{const n=parseFloat(x);return Number.isFinite(n)?n:0;};
const numOrNull=x=>{const n=parseFloat(x);return Number.isFinite(n)&&n>0?n:null;};
const cut=(x,max)=>typeof x==="string"?x.slice(0,max):(typeof x==="number"?String(x).slice(0,max):"");
const cleanColor=c=>typeof c==="string"&&/^#[0-9a-fA-F]{6}$/.test(c)?c:FUEL_COLORS[0];
const sanitizeData=raw=>{
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||!Array.isArray(raw.vehicles))return null;
  const used=new Set(),idMap=new Map();
  const mkId=id=>{let x=(typeof id==="string"&&/^[A-Za-z0-9-][A-Za-z0-9_-]{0,39}$/.test(id)&&!(id in Object.prototype))?id:uid();while(used.has(x))x=uid();used.add(x);return x;};
  const rm=(raw.meta&&typeof raw.meta==="object"&&!Array.isArray(raw.meta))?raw.meta:{},rmU=(rm.u&&typeof rm.u==="object")?rm.u:{},meta={u:Object.create(null),dels:Object.create(null)};
  const mkIdU=id=>{const nid=mkId(id);if(typeof id==="string"&&Object.prototype.hasOwnProperty.call(rmU,id)){const t0=Number(rmU[id]);if(Number.isFinite(t0)&&t0>0)meta.u[nid]=Math.floor(t0);}return nid;};
  const vehicles=[];
  raw.vehicles.slice(0,30).forEach(v=>{
    if(!v||typeof v!=="object")return;
    const info=defInfo(),vi=(v.info&&typeof v.info==="object")?v.info:{};
    Object.keys(info).forEach(k=>{info[k]=cut(vi[k],120);});
    const p=v.parking;
    const parking=(p&&typeof p==="object"&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180&&!isNaN(Date.parse(p.ts)))?{lat:p.lat,lng:p.lng,acc:Math.max(0,Math.round(numOr0(p.acc))),ts:new Date(p.ts).toISOString()}:null;
    const pt=POWERTRAINS.some(x=>x.id===v.powertrain)?v.powertrain:"ice";
    const f1=normFuelId(v.fuelType),f2=normFuelId(v.fuelType2);
    const fx=applyPT({fuelType:FTYPES.some(f=>f.id===f1)?f1:"",fuelType2:FTYPES.some(f=>f.id===f2)?f2:""},pt);
    const id=mkIdU(v.id);
    if(typeof v.id==="string"&&!idMap.has(v.id))idMap.set(v.id,id);
    vehicles.push({id,name:cut(v.name,40).trim()||"ΟΧΗΜΑ",icon:cut(v.icon,16)||"🚗",color:cleanColor(v.color),category:VCATS.some(c=>c.id===v.category)?v.category:"car",powertrain:pt,fuelType:fx.fuelType,fuelType2:fx.fuelType2,unitMiles:false,info,parking,units:cleanUnits(v.units)});
  });
  if(!vehicles.length)return null;
  const vById=new Map(vehicles.map(v=>[v.id,v]));
  const entries={},expenses={},notes={};
  const eachList=(src,fn)=>{
    if(!src||typeof src!=="object"||Array.isArray(src))return;
    Object.keys(src).slice(0,60).forEach(k=>{const nid=idMap.get(k);if(!nid||!Array.isArray(src[k]))return;fn(nid,src[k].slice(0,50000).filter(e=>e&&typeof e==="object"&&isDate(e.date)));});
  };
  eachList(raw.entries,(nid,list)=>{
    const vdef=vById.get(nid).fuelType||"diesel";
    entries[nid]=normEntries({a:list}).a.map(e=>{
      const o={id:mkIdU(e.id),date:e.date,fuelType:FTYPES.some(f=>f.id===e.fuelType)?e.fuelType:vdef,total:numOr0(e.total),ppl:numOr0(e.ppl),liters:numOr0(e.liters),odo:numOrNull(e.odo),notes:cut(e.notes,200),full:e.full!==false};
      if(e.octane!=null&&e.octane!=="")o.octane=cut(e.octane,10);
      if(e.missed===true)o.missed=true;
      return o;
    });
  });
  eachList(raw.expenses,(nid,list)=>{expenses[nid]=list.map(e=>({id:mkIdU(e.id),date:e.date,category:EXPENSE_CATS.some(c=>c.id===e.category)?e.category:"custom",label:cut(e.label,80),amount:numOr0(e.amount),icon:cut(e.icon,16),notes:cut(e.notes,200)}));});
  eachList(raw.notes,(nid,list)=>{notes[nid]=list.map(e=>({id:mkIdU(e.id),date:e.date,text:cut(e.text,2000)}));});
  const vid=(typeof raw.vid==="string"&&idMap.get(raw.vid))||vehicles[0].id;
  const rd=(rm.dels&&typeof rm.dels==="object"&&!Array.isArray(rm.dels))?rm.dels:{};
  Object.keys(rd).slice(0,100000).forEach(k=>{const t0=Number(rd[k]);if(/^[A-Za-z0-9-][A-Za-z0-9_-]{0,39}$/.test(k)&&Number.isFinite(t0)&&t0>0)meta.dels[k]=Math.floor(t0);});
  return{vehicles,entries,expenses,notes,vid,meta};
};

// ---------- Συγχώνευση αντιγράφων & έλεγχος διπλοεγγραφών (v2.20) ----------
const TOMB_TTL=180*86400000;            // οι διαγραφές «θυμούνται» 180 μέρες
const KINDS=["entries","expenses","notes"];
const newMap=()=>Object.create(null);
const sigCache=new WeakMap();
const sigOf=o=>{let s=sigCache.get(o);if(s===undefined){s=JSON.stringify(o);sigCache.set(o,s);}return s;};
// id -> υπογραφή περιεχομένου, για κάθε όχημα/γέμισμα/έξοδο/σημείωση
const sigsOf=d=>{
  const out=newMap();
  d.vehicles.forEach(v=>{out[v.id]=sigOf(v);});
  KINDS.forEach(k=>{Object.keys(d[k]||{}).forEach(vid=>{(d[k][vid]||[]).forEach(e=>{out[e.id]=sigOf(e);});});});
  return out;
};
// ── Διπλοεγγραφές: ίδια ημερομηνία + είδος + ποσό (γεμίσματα) / κατηγορία + ποσό (έξοδα) / ίδιο κείμενο (σημειώσεις) ──
const normTxt=s=>String(s==null?"":s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const amt=x=>parseFloat(x)||0;
const isDup=(kind,a,b)=>{
  if(a.date!==b.date)return false;
  if(kind==="entries")return a.fuelType===b.fuelType&&Math.abs(amt(a.total)-amt(b.total))<0.01;
  if(kind==="expenses")return a.category===b.category&&Math.abs(amt(a.amount)-amt(b.amount))<0.01;
  return normTxt(a.text)===normTxt(b.text);
};
// Ένα-προς-ένα ταίριασμα: αν υπάρχει 1 διόδιο 1,50€ και έρχονται 2 ίδια, το ένα είναι διπλό και το άλλο νέο
const dupFinder=(kind,existing)=>{
  const by=new Map();
  existing.forEach(x=>{const a=by.get(x.date);if(a)a.push(x);else by.set(x.date,[x]);});
  return e=>{const a=by.get(e.date);if(!a)return false;const i=a.findIndex(x=>isDup(kind,x,e));if(i<0)return false;a.splice(i,1);return true;};
};
const dedupeList=(kind,existing,incoming)=>{
  const isD=dupFinder(kind,existing||[]),list=[];let dups=0;
  (incoming||[]).forEach(e=>{if(isD(e))dups++;else list.push(e);});
  return{list,dups};
};
// Ίδιο όχημα = ίδιο όνομα (και όχι διαφορετική πινακίδα) ή ίδια πινακίδα
const sameVehicle=(a,b)=>{
  const na=normTxt(a.name),nb=normTxt(b.name);
  const pa=normTxt((a.info||{}).plate).replace(/[\s-]/g,""),pb=normTxt((b.info||{}).plate).replace(/[\s-]/g,"");
  return(!!na&&na===nb&&(!pa||!pb||pa===pb))||(!!pa&&pa===pb);
};
// Συγχώνευση δύο αντιγράφων (ήδη "καθαρισμένων"). Κερδίζει η νεότερη αλλαγή ανά εγγραφή· οι διαγραφές διαδίδονται με "ταφόπλακες".
const mergeData=(L,R)=>{
  const lm=L.meta||{u:newMap(),dels:newMap()},rm=R.meta||{u:newMap(),dels:newMap()};
  const st={added:0,updated:0,removed:0,dups:0};
  const U=(m,id)=>(m.u&&m.u[id])||0,D=(m,id)=>(m.dels&&m.dels[id])||0;
  const lv=new Map(L.vehicles.map(v=>[v.id,v]));
  // όχημα του αρχείου με άλλο id αλλά ίδια ταυτότητα → οι εγγραφές του πάνε στο δικό μου όχημα
  const alias={};
  R.vehicles.forEach(v=>{if(lv.has(v.id))return;const m0=L.vehicles.find(x=>sameVehicle(x,v));if(m0)alias[v.id]=m0.id;});
  if(Object.keys(alias).length){
    R={...R,vehicles:R.vehicles.filter(v=>!alias[v.id])};
    KINDS.forEach(k=>{const o={...(R[k]||{})};Object.keys(alias).forEach(rid=>{const to=alias[rid];o[to]=[...(o[to]||[]),...(o[rid]||[])];delete o[rid];});R[k]=o;});
  }
  const rv=new Map(R.vehicles.map(v=>[v.id,v]));
  const pick=(a,b,id)=>{
    if(a&&b){
      if(sigOf(a)===sigOf(b))return a;
      if(U(rm,id)>U(lm,id)){st.updated++;return b;}
      return a;
    }
    if(a){
      const d=D(rm,id);
      if(d>0&&d>=U(lm,id)){st.removed++;return null;}   // διαγράφηκε στο άλλο αντίγραφο
      return a;
    }
    const d=D(lm,id);
    if(d>0&&d>=U(rm,id))return null;                    // το έχω διαγράψει εγώ
    st.added++;return b;
  };
  const ids=[...L.vehicles.map(v=>v.id),...R.vehicles.filter(v=>!lv.has(v.id)).map(v=>v.id)];
  const vehicles=[],out={entries:{},expenses:{},notes:{}},U2=newMap();
  ids.forEach(id=>{
    const v=pick(lv.get(id),rv.get(id),id);
    if(!v)return;
    vehicles.push(v);U2[id]=Math.max(U(lm,id),U(rm,id));
    KINDS.forEach(k=>{
      const la=(L[k]&&L[k][id])||[],ra=(R[k]&&R[k][id])||[];
      const lmap=new Map(la.map(e=>[e.id,e])),rmap=new Map(ra.map(e=>[e.id,e]));
      const list=[];
      la.forEach(e=>{const r=pick(e,rmap.get(e.id),e.id);if(r)list.push(r);});
      const isD=dupFinder(k,la.filter(x=>!rmap.has(x.id)));
      ra.forEach(e=>{
        if(lmap.has(e.id))return;
        const r=pick(undefined,e,e.id);if(!r)return;
        if(isD(r)){st.added--;st.dups++;return;}      // ίδια εγγραφή με άλλο id → παραλείπεται
        list.push(r);
      });
      out[k][id]=list;
      list.forEach(e=>{U2[e.id]=Math.max(U(lm,e.id),U(rm,e.id));});
    });
  });
  if(!vehicles.length)return null;
  const dels=newMap(),now=Date.now();
  [lm.dels||{},rm.dels||{}].forEach(m=>Object.keys(m).forEach(id=>{
    if(id in U2||now-m[id]>TOMB_TTL)return;
    dels[id]=Math.max(dels[id]||0,m[id]);
  }));
  const vid=vehicles.some(v=>v.id===L.vid)?L.vid:vehicles[0].id;
  return{data:{vehicles,entries:out.entries,expenses:out.expenses,notes:out.notes,vid,meta:{u:U2,dels}},stats:st};
};

// ---------- Εισαγωγή από Fuelio (CSV) ----------
const parseCSV=(text,delim=",")=>{
  const rows=[];let row=[],cur="",q=false;
  const str=String(text||"").replace(/^\uFEFF/,"");
  for(let i=0;i<str.length&&rows.length<200000;i++){
    const c=str[i];
    if(q){if(c==='"'){if(str[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
    else if(c==='"')q=true;
    else if(c===delim){row.push(cur);cur="";}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&str[i+1]==="\n")i++;row.push(cur);cur="";rows.push(row);row=[];}
    else cur+=c;
  }
  if(cur!==""||row.length){row.push(cur);rows.push(row);}
  return rows;
};
const parseFuelioSections=text=>{
  const secs=Object.create(null);let name=null,head=null;
  parseCSV(text).forEach(r=>{
    const first=String(r[0]||"").trim();
    if(first.startsWith("## ")){name=first.slice(3).trim();head=null;secs[name]=[];return;}
    if(!name||r.every(c=>!String(c).trim()))return;
    if(!head){head=r.map(h=>String(h).trim());return;}
    const o=Object.create(null);
    head.forEach((h,i)=>{if(h)o[h]=String(r[i]==null?"":r[i]).trim();});
    secs[name].push(o);
  });
  return secs;
};
const fnum=s=>{const x=parseFloat(String(s==null?"":s).trim().replace(/\s/g,"").replace(",","."));return Number.isFinite(x)?x:0;};
const mkDate=(y,m,d)=>{const p=n=>String(n).padStart(2,"0");const s=`${y}-${p(m)}-${p(d)}`;return isDate(s)?s:null;};
const fuelioDate=(s,fmt)=>{
  const str=String(s||"").trim().slice(0,40);let m;
  if((m=/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(str)))return mkDate(+m[1],+m[2],+m[3]);
  if((m=/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(str))){
    const a=+m[1],b=+m[2],y=+m[3];let mdy=String(fmt||"").toLowerCase().startsWith("mm");
    if(a>12)mdy=false;else if(b>12)mdy=true;
    return mdy?mkDate(y,a,b):mkDate(y,b,a);
  }
  return null;
};
// Το Fuelio με ορισμένες τοπικές ρυθμίσεις εξάγει 36.883 ως 36883 και 2.169 ως 2169 (×1000). Το διορθώνουμε με βάση το συνολικό ποσό.
const fuelioFixScale=(T,L,P,limit)=>{
  const sps=P>0?[1,0.001]:[1];let best=null;
  [1,0.001].forEach(sl=>sps.forEach(sp=>{
    const l=L*sl,p=P>0?P*sp:(T>0&&l>0?T/l:0);
    if(!(l>0))return;
    const err=T>0&&p>0?Math.abs(T/l-p)/p:0.5;
    const o={l,p,err,over:l>limit?1:0,pen:(sl<1?1:0)+(sp<1?1:0),fixed:sl<1||sp<1};
    if(!best||o.over<best.over||(o.over===best.over&&(o.err<best.err-0.005||(Math.abs(o.err-best.err)<=0.005&&o.pen<best.pen))))best=o;
  }));
  return best||{l:L,p:P,fixed:false};
};
const FUELIO_CATS=[[/διοδ|toll/,"tolls"],[/σταθμ|park/,"parking"],[/πλυσ|wash/,"car_wash"],[/προστιμ|κλησ|fine|ticket/,"fine"],[/ασφαλ|insur/,"insurance"],[/επισκευ|repair/,"repair"],[/συντηρ|service|maint/,"service"],[/λαδ|oil|filter|φιλτρ/,"oil"],[/ανταλλ|part/,"parts"],[/μπαταρ|batter/,"battery"],[/ελαστικ|tyre|tire/,"tyres"],[/κτεο|inspection/,"kteo"],[/τελη|tax|registr/,"road_tax"],[/καθαρ|clean/,"car_clean"],[/τζαμ|glass|windshield/,"glass"]];
const importFuelio=text=>{
  const secs=parseFuelioSections(text);
  const logs=secs["Log"]||[],veh=(secs["Vehicle"]||[])[0];
  if(!veh&&!logs.length)return null;
  const v=veh||{};
  const key=(o,prefix)=>{const k=Object.keys(o).find(h=>h.toLowerCase().startsWith(prefix.toLowerCase()));return k?o[k]:"";};
  const dfmt=v.ImportCSVDateFormat||"";
  const cu=v.ConsumptionUnit;
  const units={dist:v.DistUnit==="1"?"mi":"km",vol:v.FuelUnit==="1"?"galUS":v.FuelUnit==="2"?"galUK":"L",cons:cu==="1"?"kmL":cu==="2"?"mpgUS":cu==="3"?"mpgUK":"L100"};
  const limit=Math.max(fnum(v.Tank1Capacity)*1.6,150);
  const mapFuel=code=>{const n=parseInt(code,10);return n>=100&&n<200?"petrol":n>=200&&n<300?"diesel":null;};
  const mainFuel=mapFuel(v.Tank1Type)||"petrol";
  let unknownFuel=0,rescaled=0;
  const entries=[];
  logs.forEach(r=>{
    const date=fuelioDate(key(r,"Data")||r.Date,dfmt);
    if(!date)return;
    let L=fnum(key(r,"Fuel (")),T=fnum(key(r,"Price")),P=fnum(r.VolumePrice);
    const fx=fuelioFixScale(T,L,P,limit);
    if(fx.fixed)rescaled++;
    L=fx.l;P=fx.p;
    if(!(T>0)&&L>0&&P>0)T=+(L*P).toFixed(2);
    if(!(P>0)&&T>0&&L>0)P=+(T/L).toFixed(3);
    const ft=mapFuel(r.FuelType);
    if(!ft&&String(r.FuelType||"").trim())unknownFuel++;
    entries.push({id:uid(),date,fuelType:ft||mainFuel,total:T,ppl:P,liters:L,odo:fnum(key(r,"Odo"))||null,notes:[key(r,"City"),key(r,"Notes")].filter(Boolean).join(" · ").slice(0,200),full:r.Full!=="0",missed:r.Missed==="1"});
  });
  const catName=new Map((secs["CostCategories"]||[]).map(c=>[c.CostTypeID,c.Name||""]));
  const norm=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const expenses=[];
  (secs["Costs"]||[]).forEach(r=>{
    if(r.isTemplate==="1"||r.isIncome==="1")return;
    const date=fuelioDate(r.Date,dfmt),amount=fnum(r.Cost);
    if(!date||!(amount>0))return;
    const name=catName.get(r.CostTypeID)||"",hit=FUELIO_CATS.find(([re])=>re.test(norm(name)));
    const title=String(r.CostTitle||"").trim();
    expenses.push({id:uid(),date,category:hit?hit[1]:"custom",label:(title||name).slice(0,80),amount,icon:"",notes:[!hit&&title?name:"",r.Notes].filter(Boolean).join(" · ").slice(0,200)});
  });
  const id=uid();
  const clean=sanitizeData({
    vehicles:[{id,name:[v.Name,v.Description].filter(Boolean).join(" ")||"Fuelio",icon:"🚗",color:FUEL_COLORS[Math.floor(Math.random()*FUEL_COLORS.length)],category:"car",powertrain:"ice",fuelType:mainFuel,fuelType2:"",units,
      info:{brand:v.Make||v.Name||"",model:v.Model||v.Description||"",year:v.Year||"",plate:v.Plate||"",chassis:v.VIN||"",insurance:v.Insurance||""}}],
    entries:{[id]:entries},expenses:{[id]:expenses},vid:id
  });
  if(!clean)return null;
  return{vehicle:clean.vehicles[0],entries:clean.entries[id]||[],expenses:clean.expenses[id]||[],stats:{unknownFuel,rescaled}};
};

// ---------- Γενική εισαγωγή CSV από άλλες εφαρμογές (με αντιστοίχιση στηλών) ----------
const detectDelim=text=>{
  const first=String(text||"").split(/\r?\n/).find(l=>l.trim())||"";
  const c={",":0,";":0,"\t":0};let q=false;
  for(const ch of first){if(ch==='"')q=!q;else if(!q&&c[ch]!==undefined)c[ch]++;}
  return Object.keys(c).sort((a,b)=>c[b]-c[a])[0];
};
const gnum=s=>{
  let x=String(s==null?"":s).trim().replace(/[^\d.,-]/g,"");
  if(!x)return 0;
  const lc=x.lastIndexOf(","),ld=x.lastIndexOf(".");
  if(lc>-1&&ld>-1)x=lc>ld?x.replace(/\./g,"").replace(",","."):x.replace(/,/g,"");
  else if(lc>-1)x=x.replace(",",".");
  const n=parseFloat(x);return Number.isFinite(n)?n:0;
};
const strip=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const CSV_FIELDS=[["date","Ημερομηνία"],["odo","Χιλιόμετρα (ODO)"],["vol","Ποσότητα (λίτρα / γαλόνια / kWh)"],["ppl","Τιμή ανά μονάδα"],["total","Συνολικό κόστος"],["full","Γέμισμα μέχρι πάνω"],["notes","Σημειώσεις"]];
const CSV_GUESS={
  date:/^(date|data|datum|fecha|tarih|дата|ημερομηνια|fuelup_date|refuel)/,
  odo:/odo|mileage|odom|kilomet|χιλιομ|пробег|km stand|compteur/,
  vol:/litre|liter|gallon|volume|quantit|qty|fuel \(|λιτρ|литр|menge|cantidad|litri|litros|galon/,
  ppl:/price per|price\/|per l|per gal|unit price|ppl|volumeprice|τιμη ανα|τιμη\/|цена за|preis pro|prix au|prezzo al|precio por/,
  total:/total|cost|amount|sum|συνολ|κοστος|ποσο|итого|сумма|gesamt|montant|totale|importe|^price/,
  full:/full|partial|φουλ|полн|voll|plein|pieno|lleno/,
  notes:/note|comment|σημει|заметк|notiz|remarq|nota|memo/
};
const guessCsvMap=headers=>{
  const map={},used=new Set();
  ["date","ppl","total","vol","odo","full","notes"].forEach(f=>{
    const i=headers.findIndex((h,ix)=>!used.has(ix)&&CSV_GUESS[f].test(strip(h)));
    map[f]=i;if(i>=0)used.add(i);
  });
  return map;
};
const buildCsvVehicle=(rows,map,o)=>{
  const g=(r,f)=>map[f]>=0?r[map[f]]:"";
  const entries=[];let skipped=0;
  rows.forEach(r=>{
    const date=fuelioDate(g(r,"date"),o.dfmt);
    if(!date){skipped++;return;}
    let L=gnum(g(r,"vol")),P=gnum(g(r,"ppl")),T=gnum(g(r,"total"));
    if(!(T>0)&&L>0&&P>0)T=+(L*P).toFixed(2);
    if(!(P>0)&&T>0&&L>0)P=+(T/L).toFixed(3);
    if(!(L>0)&&T>0&&P>0)L=+(T/P).toFixed(3);
    if(!(T>0)&&!(L>0)){skipped++;return;}
    const fv=strip(g(r,"full"));
    let full=true;
    if(map.full>=0){
      if(/^(1|true|yes|y|nai|ναι|да|oui|si|ja|full|φουλ)$/.test(fv))full=true;
      else if(/^(0|false|no|n|οχι|нет|non|nein|partial|μερικο)$/.test(fv))full=false;
      if(o.fullInverted&&fv)full=!full;
    }
    entries.push({id:uid(),date,fuelType:o.fuelType,total:T,ppl:P,liters:L,odo:gnum(g(r,"odo"))||null,notes:String(g(r,"notes")||"").slice(0,200),full});
  });
  const id=uid();
  const clean=sanitizeData({vehicles:[{id,name:o.name||"CSV",icon:"🚗",color:FUEL_COLORS[Math.floor(Math.random()*FUEL_COLORS.length)],category:"car",powertrain:o.fuelType==="electric"?"ev":"ice",fuelType:o.fuelType,fuelType2:"",units:o.units,info:{}}],entries:{[id]:entries},expenses:{},vid:id});
  if(!clean)return null;
  return{vehicle:clean.vehicles[0],entries:clean.entries[id]||[],skipped};
};

// ========== COMPONENTS ==========
function RoundCyberGauge({value,min,max,color,label,unit,T,dec=1}){
  const pct=Math.min(1,Math.max(0,(value-min)/(max-min||1)));
  const R=42,cx=52,cy=52,sA=Math.PI*0.7,eA=Math.PI*2.3,totalArc=eA-sA,vA=sA+totalArc*pct;
  const arcX=a=>cx+R*Math.cos(a),arcY=a=>cy+R*Math.sin(a);
  const nx=cx+R*Math.cos(vA),ny=cy+R*Math.sin(vA);
  const trackLargeArc=totalArc>Math.PI?1:0,valueArcAngle=totalArc*pct,valueLargeArc=valueArcAngle>Math.PI?1:0;
  return(
    <div style={{background:"#000",borderRadius:"50%",padding:5,border:`2px solid ${color}`,width:"100%",aspectRatio:"1/1",position:"relative"}}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${trackLargeArc} 1 ${arcX(eA)} ${arcY(eA)}`} fill="none" stroke="#23232f" strokeWidth={6} strokeLinecap="round"/>
        {pct>0.005&&<path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${valueLargeArc} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>}
        {pct>0.005&&<path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${valueLargeArc} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" opacity={0.15}/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={3} fill={color}/><circle cx={cx} cy={cy} r={1.5} fill="#000"/>
        <text x={cx} y={cy+4} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900" style={{filter:`drop-shadow(0 0 4px ${color})`}}>{fmt(value,dec)}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="#9999bb" fontSize={5.5}>{unit}</text>
      </svg>
      <div style={{position:"absolute",bottom:6,width:"100%",textAlign:"center",fontSize:fz(6.5),whiteSpace:"nowrap",color,fontWeight:700,letterSpacing:0.5}}>{label}</div>
    </div>
  );
}

function StackedBarChart({data,T,fuelLabel=t("Καύσιμα")}){
  const [sel,setSel]=useState(null);
  if(!data.length)return null;
  const max=Math.max(...data.map(d=>d.fuel+d.exp),0.01),W=300,H=56,bw=Math.floor(W/data.length)-4;
  const s=sel!=null?data[sel]:null;
  return(
    <div>
      <div style={{display:"flex",gap:14,fontSize:fz(10),color:T.mt,marginBottom:6}}><span>🟦 {fuelLabel}</span><span>{t("🟥 Λοιπά έξοδα")}</span></div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+28}`} style={{overflow:"visible"}}>
        {data.map((d,i)=>{
          const x=i*(W/data.length)+2,hf=(d.fuel/max)*H,he=(d.exp/max)*H,op=sel===null||sel===i?0.9:0.35,tot=d.fuel+d.exp;
          return(
            <g key={i} onClick={()=>setSel(sel===i?null:i)} style={{cursor:"pointer"}}>
              <rect x={x-1} y={0} width={bw+2} height={H+20} fill="transparent"/>
              <rect x={x} y={H-hf} width={bw} height={hf} fill="#3b82f6" opacity={op}/>
              <rect x={x} y={H-hf-he} width={bw} height={he} fill="#e11d48" opacity={op}/>
              <text x={x+bw/2} y={H+14} textAnchor="middle" fill={sel===i?T.tx:T.mt} fontSize={6.5} fontWeight={sel===i?"bold":"normal"}>{d.label}</text>
              {tot>0&&<text x={x+bw/2} y={H-hf-he-4} textAnchor="middle" fill={T.mt} fontSize={6}>{tot.toFixed(0)}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{fontSize:fz(11),color:T.mt,textAlign:"center",marginTop:4}}>
        {s?<span><b style={{color:T.tx}}>{s.label}</b> · ⛽ <b style={{color:"#3b82f6"}}>{fmt(s.fuel)}{cs("€")}</b> · 📋 <b style={{color:"#e11d48"}}>{fmt(s.exp)}{cs("€")}</b> {t("· Σύνολο")} <b style={{color:T.tx}}>{fmt(s.fuel+s.exp)}{cs("€")}</b></span>:t("Πάτα μια στήλη για λεπτομέρειες")}
      </div>
    </div>
  );
}

function LineChart({data,color,avg,T,unit="L/100km",h=64,dec=1}){
  const [sel,setSel]=useState(null);
  const W=300,H=h,pad=8;
  const vals=data.map(d=>d.value),mn=Math.min(...vals),mx=Math.max(...vals),span=(mx-mn)||1,lo=mn-span*0.2,hi=mx+span*0.2;
  const X=i=>pad+(data.length>1?i*(W-2*pad)/(data.length-1):0),Y=v=>H-pad-((v-lo)/(hi-lo))*(H-2*pad);
  const path=data.map((d,i)=>`${i?"L":"M"}${X(i)} ${Y(d.value)}`).join(" ");
  const s=sel!=null?data[sel]:null;
  return(
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {avg>0&&avg>=lo&&avg<=hi&&<line x1={pad} x2={W-pad} y1={Y(avg)} y2={Y(avg)} stroke={T.mt} strokeDasharray="3 3" strokeWidth={0.8}/>}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
        {data.map((d,i)=>(
          <g key={i} onClick={()=>setSel(sel===i?null:i)} style={{cursor:"pointer"}}>
            <circle cx={X(i)} cy={Y(d.value)} r={sel===i?5:3} fill={color}/>
            <circle cx={X(i)} cy={Y(d.value)} r={10} fill="transparent"/>
          </g>
        ))}
      </svg>
      <div style={{fontSize:fz(11),color:T.mt,textAlign:"center"}}>
        {s?<span><b style={{color}}>{s.value} {unit}</b> · {s.label}</span>:tf("Μέση: {0} {1} (διακεκομμένη) · πάτα ένα σημείο",fmt(avg,dec),unit)}
      </div>
    </div>
  );
}

function Flag({id,w=24}){
  const h=Math.round(w*2/3);
  const box={display:"inline-block",verticalAlign:"middle",borderRadius:3,boxShadow:"0 0 0 1px rgba(128,128,128,0.45)",flexShrink:0};
  const wrap=(vb,kids)=><svg width={w} height={h} viewBox={vb} style={box} aria-hidden="true">{kids}</svg>;
  switch(id){
    case "de":return wrap("0 0 3 2",<g><rect width="3" height="2" fill="#FFCE00"/><rect width="3" height="1.3334" fill="#DD0000"/><rect width="3" height="0.6667" fill="#000"/></g>);
    case "fr":return wrap("0 0 3 2",<g><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></g>);
    case "it":return wrap("0 0 3 2",<g><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE2B37"/></g>);
    case "es":return wrap("0 0 3 2",<g><rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/></g>);
    case "ru":return wrap("0 0 3 2",<g><rect width="3" height="2" fill="#fff"/><rect y="0.6667" width="3" height="0.6667" fill="#0039A6"/><rect y="1.3334" width="3" height="0.6667" fill="#D52B1E"/></g>);
    case "gr":return wrap("0 0 27 18",<g><rect width="27" height="18" fill="#0D5EAF"/>{[1,3,5,7].map(i=><rect key={i} y={i*2} width="27" height="2" fill="#fff"/>)}<rect width="10" height="10" fill="#0D5EAF"/><rect x="4" width="2" height="10" fill="#fff"/><rect y="4" width="10" height="2" fill="#fff"/></g>);
    default:return wrap("0 0 60 30",<g><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/></g>);
  }
}

function LangPicker({value,onChange,T,color}){
  return(
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {LANGS.map(l=>{
        const on=value===l.id;
        return(
          <button key={l.id} type="button" onClick={()=>onChange(l.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:18,border:`2px solid ${on?color:"transparent"}`,cursor:"pointer",fontSize:fz(13),fontWeight:"bold",background:on?color:T.br,color:on?"#fff":T.tx}}>
            <Flag id={l.flag}/>{l.name}
          </button>
        );
      })}
    </div>
  );
}

function UnitsPicker({value,onChange,T,color,ev}){
  const v=cleanUnits(value);
  const active=Object.keys(UNIT_PRESETS).find(k=>UNIT_PRESETS[k].dist===v.dist&&UNIT_PRESETS[k].vol===v.vol)||"";
  const chip=on=>({padding:"6px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:fz(12),fontWeight:"bold",background:on?color:T.br,color:on?"#fff":T.mt});
  const presets=[["metric",t("Μετρικό (χλμ · L)")],["us",t("ΗΠΑ (mi · gal)")],["uk",t("ΗΒ (mi · L)")]];
  const cons=ev?["L100","kmL","mpgUS"]:["L100","kmL","mpgUS","mpgUK"];
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
        {presets.map(([k,l])=><button key={k} type="button" onClick={()=>onChange({...UNIT_PRESETS[k]})} style={chip(active===k)}>{t(l)}</button>)}
      </div>
      <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",marginBottom:6}}>{t("ΜΟΝΑΔΑ ΚΑΤΑΝΑΛΩΣΗΣ")}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {cons.map(c=><button key={c} type="button" onClick={()=>onChange({...v,cons:c})} style={chip(v.cons===c)}>{consLabel(ev,{...v,cons:c})}</button>)}
      </div>
    </div>
  );
}

function Modal({open,onClose,title,children,T,locked}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={e=>{if(!locked&&e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.sf,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",padding:"20px 16px 36px",borderTop:`1px solid ${T.br}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:fz(16)}}>{title}</h3>
          {!locked&&<button onClick={onClose} style={{border:"none",background:"none",color:T.mt,fontSize:fz(26),cursor:"pointer",lineHeight:1}}>✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthGroup({monthKey,label,badge,total,isOpen,onToggle,T,children}){
  return(
    <div style={{marginBottom:8}}>
      <div onClick={onToggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer",userSelect:"none",background:isOpen?T.br:T.sf,border:`1px solid ${T.br}`,borderRadius:isOpen?"12px 12px 0 0":12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",minWidth:0}}>
          <span style={{fontSize:fz(15)}}>📅</span>
          <span style={{fontWeight:"bold",fontSize:fz(14)}}>{label}</span>
          <span style={{fontSize:fz(11),fontWeight:"bold",padding:"2px 8px",borderRadius:10,background:"rgba(127,127,200,0.2)",color:T.mt}}>{badge}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {total!=null&&<span style={{color:"#e07b54",fontWeight:"bold",fontSize:fz(14)}}>{total}</span>}
          <span style={{color:T.mt,fontSize:fz(12)}}>{isOpen?"▲":"▼"}</span>
        </div>
      </div>
      {isOpen&&<div style={{border:`1px solid ${T.br}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>{children}</div>}
    </div>
  );
}

function FuelEntryRow({e,i,total,allFuel,T,col,swipeId,setSwipeId,swipeStartX,onEdit,onDel,un}){
  const ftype=FTYPES.find(f=>f.id===e.fuelType);
  const prev=e._gi>0?allFuel[e._gi-1]:null;
  const diffKm=(e.odo!=null&&prev&&prev.odo!=null&&e.odo>prev.odo)?(e.odo-prev.odo):null;
  const cons=e._cons!=null?e._cons:null;
  const u=volLabel(e.fuelType,un),evr=e.fuelType==="electric";
  const isSwipe=swipeId===e.id;
  return(
    <div style={{position:"relative",overflow:"hidden"}}
      onTouchStart={ev=>{swipeStartX.current=ev.touches[0].clientX;}}
      onTouchEnd={ev=>{
        if(swipeStartX.current===null)return;
        const dx=swipeStartX.current-ev.changedTouches[0].clientX;
        if(dx>60)setSwipeId(e.id);else if(dx<-20)setSwipeId(null);
        swipeStartX.current=null;
      }}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:90,background:"#e11d48",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>{onDel(e.id);setSwipeId(null);}}>
        <span style={{color:"#fff",fontSize:fz(22)}}>🗑️</span>
      </div>
      <div style={{padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none",transform:isSwipe?"translateX(-90px)":"translateX(0)",transition:"transform 0.25s ease",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4,marginBottom:4}}>
          <span style={{fontSize:fz(13),fontWeight:"bold"}}>{formatDate(e.date)}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {diffKm!=null&&diffKm>0&&<span style={{fontSize:fz(11),color:"#10b981"}}>📍{diffKm} {distLabel(un)}</span>}
            <span style={{fontSize:fz(11),color:T.mt}}>{ftype?`${ftype.icon} ${t(ftype.label)}${e.octane?" "+e.octane:""}`:e.fuelType}</span>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontSize:fz(15),fontWeight:"bold"}}>{fmt(e.liters,2)} {u}</span>
            <span style={{fontSize:fz(12),marginLeft:8,color:T.mt}}>{fmt(e.ppl,3)} {cs("€/")}{u}</span>
            {e.full===false&&<span style={{fontSize:fz(10),marginLeft:8,padding:"1px 6px",borderRadius:8,background:T.br,color:T.mt}}>{t("μερικό")}</span>}
            {cons!=null&&<span style={{fontSize:fz(11),marginLeft:8,color:col,fontWeight:"bold"}}>{fmt(consVal(cons,evr,un),1)} {consLabel(evr,un)}</span>}
            {e.odo&&<div style={{fontSize:fz(11),color:T.mt,marginTop:2}}>ODO: {Number(e.odo).toLocaleString()} {distLabel(un)}</div>}
            {e.notes&&<div style={{fontSize:fz(11),color:T.mt,marginTop:2}}>📝 {e.notes}</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{fontSize:fz(16),fontWeight:"bold",color:"#ef4444"}}>{fmt(e.total)}{cs("€")}</span>
            <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:fz(12),padding:"4px 7px",borderRadius:6}}>✏️</button>
            <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:fz(16)}}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseEntryRow({e,i,total,T,onEdit,onDel}){
  const cat=EXPENSE_CATS.find(c=>c.id===e.category);
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <span style={{fontSize:fz(20)}}>{cat&&cat.icon||e.icon||"💸"}</span>
        <div>
          <div style={{fontWeight:"bold",fontSize:fz(13),wordBreak:"break-word"}}>{dispLabel(e,cat)}</div>
          <div style={{fontSize:fz(11),color:T.mt}}>{formatDate(e.date)}{cat&&e.label&&e.label!==t(cat.label)?` · ${t(cat.label)}`:""}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <span style={{fontWeight:"bold",color:"#e11d48",fontSize:fz(14)}}>-{fmt(e.amount)}{cs("€")}</span>
        <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:fz(12),padding:"4px 7px",borderRadius:6}}>✏️</button>
        <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:fz(16),padding:2}}>✕</button>
      </div>
    </div>
  );
}

function NoteEntryRow({e,i,total,T,onEdit,onDel}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none"}}>
      <div style={{display:"flex",gap:10,minWidth:0}}>
        <span style={{fontSize:fz(20)}}>📝</span>
        <div style={{minWidth:0}}>
          <div style={{fontSize:fz(11),color:T.mt,marginBottom:2}}>{formatDate(e.date)}</div>
          <div style={{fontSize:fz(13),whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{e.text}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:fz(12),padding:"4px 7px",borderRadius:6}}>✏️</button>
        <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:fz(16),padding:2}}>✕</button>
      </div>
    </div>
  );
}

function Welcome({T,col,lang,setLang,onDone}){
  const [i,setI]=useState(0);
  const sx=useRef(null);
  const N=3,last=i===N-1;
  const go=n=>setI(Math.min(N-1,Math.max(0,n)));
  const feats=[
    ["⛽","Γεμίσματα & κατανάλωση","Αυτόματος υπολογισμός λίτρων και κατανάλωσης","#3b82f6"],
    ["📋","Όλα τα έξοδα","Διόδια, service, ασφάλεια, ελαστικά και άλλα","#e11d48"],
    ["🔔","Υπενθυμίσεις","ΚΤΕΟ, ασφάλεια, service, δίπλωμα","#ffd60a"],
    ["📊","Στατιστικά","Γραφήματα, ημερολόγιο και ανασκόπηση χρονιάς","#10b981"],
  ];
  const rows=[
    ["📴","Λειτουργεί και χωρίς internet"],
    ["🛟","Κάνε αντίγραφο ασφαλείας από το κουμπί 💾 πάνω δεξιά"],
    ["🔀","Φέρε τα δεδομένα σου σε άλλη συσκευή με συγχώνευση"],
  ];
  const anim=(idx,css)=>i===idx?css:"none";
  const chips=[["🛣️"],["🔧"],["🅿️"],["⚡"]];
  const chipPos=[{top:6,left:2},{top:20,right:0},{bottom:20,left:0},{bottom:4,right:14}];
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",color:T.tx,fontFamily:"sans-serif",
      background:`radial-gradient(circle at 50% -5%, ${col}40, transparent 55%), radial-gradient(circle at 100% 100%, ${col}1f, transparent 50%), ${T.bg}`}}
      onTouchStart={e=>{sx.current=e.touches[0].clientX;}}
      onTouchEnd={e=>{if(sx.current===null)return;const dx=sx.current-e.changedTouches[0].clientX;if(dx>50)go(i+1);else if(dx<-50)go(i-1);sx.current=null;}}>
      <style>{`
        @keyframes flSweep{from{stroke-dashoffset:100}to{stroke-dashoffset:28}}
        @keyframes flUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes flFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes flPulse{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.5);opacity:0}}
        @keyframes flPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @media (prefers-reduced-motion:reduce){.fl-wel *{animation:none!important}}
      `}</style>

      <div style={{display:"flex",justifyContent:"flex-end",padding:"max(14px, env(safe-area-inset-top)) 16px 0",minHeight:44}}>
        {!last&&<button onClick={onDone} style={{border:"none",background:"none",color:T.mt,fontSize:fz(13),fontWeight:"bold",cursor:"pointer",padding:"8px 6px"}}>{t("Παράλειψη")}</button>}
      </div>

      <div className="fl-wel" style={{flex:1,overflow:"hidden"}}>
        <div style={{display:"flex",height:"100%",width:`${N*100}%`,transform:`translateX(-${i*100/N}%)`,transition:"transform .45s cubic-bezier(.4,.1,.2,1)"}}>

          {/* ── Slide 1 · Καλωσόρισμα ── */}
          <div aria-hidden={i!==0} style={{width:`${100/N}%`,overflowY:"auto",padding:"4px 24px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",boxSizing:"border-box"}}>
            <div style={{position:"relative",width:205,height:205,marginBottom:10}}>
              <svg viewBox="0 0 180 180" width="205" height="205" style={{filter:`drop-shadow(0 0 10px ${col}66)`}}>
                <path d="M 40.5 139.5 A 70 70 0 1 1 139.5 139.5" fill="none" stroke={T.br} strokeWidth="12" strokeLinecap="round"/>
                <path d="M 40.5 139.5 A 70 70 0 1 1 139.5 139.5" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" pathLength="100"
                  style={{strokeDasharray:100,strokeDashoffset:i===0?28:100,animation:anim(0,"flSweep 1.6s .25s cubic-bezier(.3,.1,.2,1) both")}}/>
                svg x="46" y="34" width="88" height="88" viewBox="0 0 64 64"><LogoMark col={col} bg={T.bg}/></svg>
                <text x="90" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill={T.mt} letterSpacing="1.5">FUELLOG</text>
              </svg>
              {chips.map(([ic],k)=>(
                <span key={k} style={{position:"absolute",...chipPos[k],width:40,height:40,borderRadius:"50%",background:T.sf,border:`1px solid ${T.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`0 4px 14px ${col}33`,
                  animation:anim(0,`flFloat ${3+k*.4}s ${k*.5}s ease-in-out infinite`)}}>{ic}</span>
              ))}
            </div>
            <h1 style={{margin:"0 0 10px",fontSize:fz(27),lineHeight:1.2,animation:anim(0,"flUp .6s .1s both")}}>{t("Καλώς ήρθες στο FuelLog")}</h1>
            <p style={{margin:"0 0 22px",fontSize:fz(15),lineHeight:1.55,color:T.mt,maxWidth:320,animation:anim(0,"flUp .6s .25s both")}}>{t("Τα καύσιμα και τα έξοδα του αυτοκινήτου σου, απλά και σε ένα μέρος.")}</p>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:10,maxWidth:300,animation:anim(0,"flUp .6s .4s both")}}>
              {LANGS.map(l=>{
                const on=lang===l.id;
                return(
                  <button key={l.id} type="button" aria-label={l.name} title={l.name} onClick={()=>setLang(l.id)}
                    style={{padding:6,borderRadius:12,cursor:"pointer",background:on?`${col}33`:"transparent",border:`2px solid ${on?col:"transparent"}`,opacity:on?1:0.6,transform:on?"scale(1.12)":"none",transition:"all .2s"}}>
                    <Flag id={l.flag} w={34}/>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Slide 2 · Τι κάνει ── */}
          <div aria-hidden={i!==1} style={{width:`${100/N}%`,overflowY:"auto",padding:"4px 20px 16px",display:"flex",flexDirection:"column",justifyContent:"center",boxSizing:"border-box"}}>
            <h2 style={{margin:"0 0 18px",fontSize:fz(23),textAlign:"center",animation:anim(1,"flUp .5s both")}}>{t("Όλα για το αυτοκίνητό σου")}</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {feats.map(([ic,ti,de,c],k)=>(
                <div key={ti} style={{background:T.sf,border:`1px solid ${T.br}`,borderTop:`3px solid ${c}`,borderRadius:16,padding:"14px 12px",animation:anim(1,`flUp .55s ${.12+k*.12}s both`)}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${c}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fz(24),marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:4}}>{t(ti)}</div>
                  <div style={{fontSize:fz(11),color:T.mt,lineHeight:1.45}}>{t(de)}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:fz(12),color:T.mt,animation:anim(1,"flUp .55s .65s both")}}>{t("🚗 Πολλά οχήματα · ⚡ Και ηλεκτρικά ή υβριδικά")}</div>
          </div>

          {/* ── Slide 3 · Τα δεδομένα σου ── */}
          <div aria-hidden={i!==2} style={{width:`${100/N}%`,overflowY:"auto",padding:"4px 22px 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",boxSizing:"border-box"}}>
            <div style={{position:"relative",width:110,height:110,marginBottom:20}}>
              <span style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${col}`,animation:anim(2,"flPulse 2.2s ease-out infinite")}}/>
              <span style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${col}`,animation:anim(2,"flPulse 2.2s 1.1s ease-out infinite")}}/>
              <div style={{position:"absolute",inset:8,borderRadius:"50%",background:T.sf,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,animation:anim(2,"flPop .6s .1s both")}}>🔒</div>
            </div>
            <h2 style={{margin:"0 0 8px",fontSize:fz(23),animation:anim(2,"flUp .5s .1s both")}}>{t("Τα δεδομένα σου μένουν δικά σου")}</h2>
            <p style={{margin:"0 0 18px",fontSize:fz(14),lineHeight:1.55,color:T.mt,maxWidth:320,animation:anim(2,"flUp .5s .2s both")}}>{t("Αποθηκεύονται μόνο σε αυτή τη συσκευή. Δεν χρειάζεται λογαριασμός.")}</p>
            <div style={{width:"100%",maxWidth:340,background:T.sf,border:`1px solid ${T.br}`,borderRadius:16,padding:"6px 14px",marginBottom:14,textAlign:"left"}}>
              {rows.map(([ic,tx],k)=>(
                <div key={tx} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:k<rows.length-1?`1px solid ${T.ft}`:"none",animation:anim(2,`flUp .5s ${.3+k*.12}s both`)}}>
                  <span style={{fontSize:fz(22)}}>{ic}</span>
                  <span style={{fontSize:fz(13),lineHeight:1.4}}>{t(tx)}</span>
                </div>
              ))}
            </div>
            <div style={{width:"100%",maxWidth:340,fontSize:fz(12),color:T.mt,lineHeight:1.5,border:`1px dashed ${col}`,borderRadius:12,padding:"10px 12px",animation:anim(2,"flUp .5s .7s both")}}>{t("Τη γλώσσα και το νόμισμα τα αλλάζεις όποτε θες από το ℹ️ Σχετικά και ρυθμίσεις.")}</div>
            <div style={{marginTop:14,fontSize:fz(11),color:T.mt,animation:anim(2,"flUp .5s .85s both")}}>© 2026 · {t("Ταχμαζίδης Κ. Γιώργος")}</div> 
          </div>
        </div>
      </div>

      <div style={{padding:"8px 20px max(20px, env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:14}}>
          {[0,1,2].map(k=><button key={k} type="button" aria-label={String(k+1)} onClick={()=>go(k)} style={{width:i===k?26:9,height:9,borderRadius:5,border:"none",padding:0,cursor:"pointer",background:i===k?col:T.br,transition:"all .3s"}}/>)}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>go(i-1)} style={{flex:"0 0 30%",padding:14,background:T.br,color:T.tx,border:"none",borderRadius:12,fontWeight:"bold",fontSize:fz(14),cursor:"pointer",visibility:i===0?"hidden":"visible"}}>{t("Πίσω")}</button>
          <button onClick={()=>last?onDone():go(i+1)} style={{flex:1,padding:14,background:col,color:"#fff",border:"none",borderRadius:12,fontWeight:"bold",fontSize:fz(15),cursor:"pointer",boxShadow:`0 6px 20px ${col}55`}}>{last?t("Ξεκινάμε!")+" 🚀":t("Επόμενο")+" →"}</button>
        </div>
      </div>
    </div>
  );
}
function LogoMark({col,bg}){
  const badge=col==="#10b981"?"#3b82f6":"#10b981";
  const f=CURSYM.length>2?8:CURSYM.length>1?11:17;
  return(
    <g>
      <path d="M42 20 H48 Q52 20 52 24 V40 Q52 44 55.5 44 Q59 44 59 40 V28 L55 22" fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="10" y="53" width="36" height="6" rx="3" fill={col}/>
      <rect x="14" y="6" width="28" height="48" rx="5" fill={col}/>
      <rect x="19" y="12" width="18" height="13" rx="2.5" fill="rgba(0,0,0,.35)"/>
      <path d="M28 31 C28 31 21.5 38.5 21.5 42.5 A6.5 6.5 0 0 0 34.5 42.5 C34.5 38.5 28 31 28 31 Z" fill="rgba(255,255,255,.92)"/>
      <circle cx="47" cy="47" r="14" fill={badge} stroke={bg} strokeWidth="3"/>
      <text x="47" y="47.5" textAnchor="middle" dominantBaseline="central" fontSize={f} fontWeight="900" fill="#fff" fontFamily="Arial,sans-serif">{CURSYM}</text>
    </g>
  );
}
function Logo({col,bg,size=32}){
  return <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{flexShrink:0}}><LogoMark col={col} bg={bg}/></svg>;
}
 
// ========== MAIN APP ==========
export default function FuelLog(){
  const [dark,setDark]=useState(()=>readPrefs().dark);
  const [fsLvl,setFsLvl]=useState(()=>readPrefs().fs);
  const [lang,setLang]=useState(()=>readPrefs().lang);
  const [cur,setCur]=useState(()=>readPrefs().cur);
  const [defUnits,setDefUnits]=useState(()=>readPrefs().du);
  LANG=lang;CURSYM=(CURRENCIES.find(c=>c.id===cur)||CURRENCIES[0]).sym;
  const [saveErr,setSaveErr]=useState(false);
  const T=dark?DK:LT;
  const [vehicles,setVehicles]=useState([{...defV(),id:"v1",name:"ΟΧΗΜΑ",icon:"🚗",color:"#f97316",fuelType:"diesel",fuelType2:""}]);
  const [vid,setVid]=useState("v1");
  const [entries,setEntries]=useState({});
  const [expenses,setExpenses]=useState({});
  const [notes,setNotes]=useState({});
  const [noteEdit,setNoteEdit]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [setupMode,setSetupMode]=useState(false);const [showWelcome,setShowWelcome]=useState(false);
  const [doneRem,setDoneRem]=useState(null);
  const [gaugeDet,setGaugeDet]=useState(null);   // null | "cons" | "ppl" | "eppl"
  const askDel=(title,detail,fn)=>setConfirmDel({title,detail,fn});
  const askConfirm=(cfg,fn)=>setConfirmDel({...cfg,fn});
  const [lastBackup,setLastBackup]=useState(()=>{try{return localStorage.getItem("fuellog_last_backup")||"";}catch(e){return "";}});
  const [hideBackup,setHideBackup]=useState(false);
  const [expCatFilter,setExpCatFilter]=useState("all");
  const [tab,setTab]=useState("home");
  const [fY,setFY]=useState(String(new Date().getFullYear()));
  const [fM,setFM]=useState("all");
  const [openFuelM,setOpenFuelM]=useState({});
  const [openExpM,setOpenExpM]=useState({});
  const [openCat,setOpenCat]=useState(null);
  const [openCatMonth,setOpenCatMonth]=useState({});
  const [histSort,setHistSort]=useState("date_desc");
  const [movFilter,setMovFilter]=useState("all");
  const [movView,setMovView]=useState("list");
  const [calY,setCalY]=useState(new Date().getFullYear());
  const [calM,setCalM]=useState(new Date().getMonth());
  const [selDay,setSelDay]=useState(null);
  const [swipeId,setSwipeId]=useState(null);
  const swipeStartX=useRef(null);
  const hydrated=useRef(false);
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;
  const [showInstallBanner,setShowInstallBanner]=useState(false);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [fuelForm,setFuelForm]=useState(emptyFuel("diesel"));
  const [expForm,setExpForm]=useState(emptyExp());
  const [showAddV,setShowAddV]=useState(false);
  const [newV,setNewV]=useState(defV());
  const [showVInfo,setShowVInfo]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [showIO,setShowIO]=useState(false);
  const [showEditV,setShowEditV]=useState(false);
  const [editVData,setEditVData]=useState(null);
  const [editFuelE,setEditFuelE]=useState(null);
  const [editExpE,setEditExpE]=useState(null);
  const [importText,setImportText]=useState("");
  const [importMsg,setImportMsg]=useState("");
  const [showYear,setShowYear]=useState(false);
  const [yearSel,setYearSel]=useState(String(new Date().getFullYear()));
  const [parkMsg,setParkMsg]=useState("");
  const [showPark,setShowPark]=useState(false);
  const [fuelioMsg,setFuelioMsg]=useState("");
  const [csvImp,setCsvImp]=useState(null);
  const [csvMsg,setCsvMsg]=useState("");
  const importRef=useRef();

  // ── Συγχώνευση (v2.20) ──
  const metaRef=useRef({u:newMap(),dels:newMap(),sig:newMap()});   // χρόνοι τελευταίας αλλαγής + διαγραφές ανά id
  const stateRef=useRef(null);
  stateRef.current={vehicles,entries,expenses,notes,vid};
  // Εντοπίζει αλλαγές/διαγραφές σε σχέση με την προηγούμενη κατάσταση και τις σημαίνει με χρόνο
  const trackMeta=d=>{
    const m=metaRef.current,cur=sigsOf(d),now=Date.now();
    Object.keys(cur).forEach(id=>{if(m.sig[id]!==cur[id]){m.u[id]=now;delete m.dels[id];}});
    Object.keys(m.sig).forEach(id=>{if(!(id in cur)){m.dels[id]=now;delete m.u[id];}});
    m.sig=cur;
    Object.keys(m.dels).forEach(id=>{if(now-m.dels[id]>TOMB_TTL)delete m.dels[id];});
  };
  const snapshotLocal=()=>({...stateRef.current,meta:{u:metaRef.current.u,dels:metaRef.current.dels}});
  // mode "replace": όλα τα εισαγόμενα θεωρούνται «νέα αλλαγή» και τα παλιά διαγράφονται· mode "merge": κρατά τους χρόνους του συγχωνευμένου
  const applyData=(d,mode)=>{
    const now=Date.now(),sig=sigsOf(d);let u,dels;
    if(mode==="replace"){
      u=newMap();Object.keys(sig).forEach(id=>{u[id]=now;});
      dels=newMap();
      Object.keys(metaRef.current.dels).forEach(id=>{if(!(id in sig))dels[id]=metaRef.current.dels[id];});
      Object.keys(metaRef.current.sig).forEach(id=>{if(!(id in sig))dels[id]=now;});
    }else{
      u=Object.assign(newMap(),d.meta.u);dels=Object.assign(newMap(),d.meta.dels);
    }
    metaRef.current={u,dels,sig};
    setVehicles(d.vehicles);setEntries(d.entries);setExpenses(d.expenses);setNotes(d.notes);setVid(d.vid);
  };


  const av=vehicles.find(v=>v.id===vid)||vehicles[0];
  const col=av.color;
  const pt=av.powertrain||"ice";
  const un=cleanUnits(av.units);
  const unKey=un.dist+un.vol+un.cons;
  const pu=volLabel(pt==="ev"?"electric":"x",un);
  const dl=distLabel(un);
  const cl=consLabel(pt==="ev",un);

  useEffect(()=>{
    let first=true,raw=null;
    try{
      raw=localStorage.getItem("fuellog_data");
      if(raw){
        const d=sanitizeData(JSON.parse(raw));
        if(d){
          setVehicles(d.vehicles);setEntries(d.entries);setExpenses(d.expenses);setNotes(d.notes);setVid(d.vid);
          metaRef.current={u:d.meta.u,dels:d.meta.dels,sig:sigsOf(d)};
          const hasAny=o=>!!o&&Object.values(o).some(a=>a&&a.length);
          const onlyPlaceholder=d.vehicles.length===1&&["ΟΧΗΜΑ","ΕΤΑΙΡΙΚΟ"].includes(d.vehicles[0].name)&&d.vehicles[0].id==="v1"&&Object.values(d.vehicles[0].info||{}).every(x=>!x)&&!hasAny(d.entries)&&!hasAny(d.expenses)&&!hasAny(d.notes);
          first=onlyPlaceholder;
        }else{
          try{localStorage.setItem("fuellog_corrupt_backup",raw);}catch(e2){}
        }
      }
    }catch(e){
      try{if(raw)localStorage.setItem("fuellog_corrupt_backup",raw);}catch(e2){}
    }
    if(first){setSetupMode(true);setShowWelcome(true);setNewV(defV({name:"",units:{...UNIT_PRESETS[defUnits]}}));setShowAddV(true);}
  },[]);

  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallPrompt(e);if(!isStandalone)setShowInstallBanner(true);};
    window.addEventListener('beforeinstallprompt',handler);
    if(isIOS&&!isStandalone)setShowInstallBanner(true);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);

  useEffect(()=>{
    if(!hydrated.current){hydrated.current=true;return;}
    trackMeta({vehicles,entries,expenses,notes});
    try{localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,notes,vid,meta:{u:metaRef.current.u,dels:metaRef.current.dels}}));setSaveErr(false);}catch(e){setSaveErr(true);}
  },[vehicles,entries,expenses,notes,vid]);
  useEffect(()=>{try{localStorage.setItem("fuellog_prefs",JSON.stringify({dark,fs:fsLvl,lang,cur,du:defUnits}));}catch(e){}},[dark,fsLvl,lang,cur,defUnits]);
  useEffect(()=>{setFuelForm(emptyFuel(av.fuelType||"diesel"));},[vid,av.fuelType]);

  const allFuel=useMemo(()=>(entries[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid,lang]);
  const allNotes=useMemo(()=>(notes[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[notes,vid,lang]);
  const allExp=useMemo(()=>(expenses[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid,lang]);

  const filtFuel=useMemo(()=>{let f=allFuel;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allFuel,fY,fM,lang]);
  const filtExp=useMemo(()=>{let f=allExp;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allExp,fY,fM,lang]);

  const segMap=useMemo(()=>computeSegments(allFuel,pt),[allFuel,pt,lang]);

  const stats=useMemo(()=>{
    const isE=x=>x.fuelType==="electric";
    const fuelSpent=filtFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const tL=filtFuel.filter(x=>!isE(x)).reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const tK=filtFuel.filter(isE).reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const prim=filtFuel.filter(x=>pt==="ev"?isE(x):!isE(x));
    let totalConsL=0,totalConsKm=0;
    prim.forEach(x=>{const sg=segMap[x.id];if(sg){totalConsKm+=sg.km;totalConsL+=sg.l;}});
    const aC=totalConsKm>0?(totalConsL/totalConsKm*100):0;
    const wP=prim.filter(x=>parseFloat(x.ppl)>0);
    const aP=wP.length?+(wP.reduce((s,x)=>s+parseFloat(x.ppl),0)/wP.length).toFixed(3):0;
    const eP=filtFuel.filter(x=>isE(x)&&parseFloat(x.ppl)>0);
    const aPE=eP.length?+(eP.reduce((s,x)=>s+parseFloat(x.ppl),0)/eP.length).toFixed(3):0;
    const odoEntries=filtFuel.filter(x=>x.odo!=null&&parseFloat(x.odo)>0).sort((a,b)=>parseFloat(a.odo)-parseFloat(b.odo));
    const totalKm=odoEntries.length>=2?(parseFloat(odoEntries[odoEntries.length-1].odo)-parseFloat(odoEntries[0].odo)):0;
    const costPerKm=totalKm>0?((fuelSpent+expSpent)/totalKm):0;
    const fuelCostPerKm=totalKm>0?(fuelSpent/totalKm):0;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,tK,aC,aP,aPE,totalKm,costPerKm,fuelCostPerKm};
  },[filtFuel,filtExp,pt,segMap,lang]);

  const gaugeRanges=useMemo(()=>{
    const ev=pt==="ev";
    const ppls=allFuel.filter(x=>ev?x.fuelType==="electric":x.fuelType!=="electric").map(x=>parseFloat(x.ppl)).filter(x=>x>0);
    const pplMin=ev?(ppls.length?Math.max(0,Math.min(...ppls)-0.1):0.1):(ppls.length?Math.max(0.5,Math.min(...ppls)-0.2):0.8);
    const pplMax=ev?(ppls.length?Math.max(...ppls)+0.15:0.8):(ppls.length?Math.max(...ppls)+0.3:3.0);
    const eP=allFuel.filter(x=>x.fuelType==="electric").map(x=>parseFloat(x.ppl)).filter(x=>x>0);
    const eMin=eP.length?Math.max(0,Math.min(...eP)-0.1):0.1,eMax=eP.length?Math.max(...eP)+0.15:0.8;
    return{consMin:0,consMax:ev?35:20,pplMin,pplMax,eMin,eMax};
  },[allFuel,pt,lang]);

  const reminders=useMemo(()=>{
    const list=[];
    vehicles.forEach(v=>{REMINDER_FIELDS.forEach(({f,label,icon})=>{const ds=(v.info||{})[f],days=daysUntil(ds);if(days===null)return;if(days<=WARN_DAYS)list.push({vid:v.id,vName:v.name,vIcon:v.icon,vColor:v.color,f,label,icon,days,date:ds,urgent:days<=7,expired:days<0});});});
    vehicles.forEach(v=>{
      const nk=parseFloat((v.info||{}).serviceNextKm);
      const odos=(entries[v.id]||[]).map(e=>parseFloat(e.odo)).filter(x=>x>0);
      if(nk>0&&odos.length){
        const left=nk-Math.max(...odos);
        if(left<=WARN_KM)list.push({vid:v.id,vName:v.name,vIcon:v.icon,vColor:v.color,label:`Service (${distLabel(cleanUnits(v.units))})`,dl:distLabel(cleanUnits(v.units)),icon:"🔧",isKm:true,f:"serviceNextKm",odo:Math.max(...odos),kmLeft:left,days:Math.max(0,Math.round(left/50)),date:String(nk),urgent:left<=300,expired:left<=0});
      }
    });
    return list.sort((a,b)=>a.days-b.days);
  },[vehicles,entries,lang]);

  const monthlyBarData=useMemo(()=>{
    const yF=fY==="all"?allFuel:allFuel.filter(e=>e.date.startsWith(fY));
    const yE=fY==="all"?allExp:allExp.filter(e=>e.date.startsWith(fY));
    return MONTHS_SHORT.map((lb,i)=>{
      const label=t(lb);
      const m=String(i+1).padStart(2,"0");
      const f=yF.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
      const x=yE.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
      return{label,fuel:+f.toFixed(2),exp:+x.toFixed(2)};
    });
  },[allFuel,allExp,fY,lang]);

  const expByMonth=useMemo(()=>{
    const map={};
    allExp.forEach(e=>{
      const d=pd(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${t(MONTHS_FULL[d.getMonth()])} ${d.getFullYear()}`,entries:[],total:0,byCategory:{}};
      map[k].entries.push(e);map[k].total+=(parseFloat(e.amount)||0);
      const cat=e.category||"custom";map[k].byCategory[cat]=(map[k].byCategory[cat]||0)+(parseFloat(e.amount)||0);
    });
    return Object.values(map).sort((a,b)=>b.key.localeCompare(a.key));
  },[allExp,lang]);

  // Fuel entries with their index and consumption (used by Κινήσεις)
  const fuelMeta=useMemo(()=>allFuel.map((e,gi)=>({...e,_gi:gi,_cons:segMap[e.id]?segMap[e.id].cons:null,_seg:segMap[e.id]||null})),[allFuel,segMap,lang]);

  const consSeries=useMemo(()=>fuelMeta.filter(e=>e._cons!=null&&(fY==="all"||e.date.startsWith(fY))).map(e=>({label:formatDate(e.date),value:+consVal(e._cons,e.fuelType==="electric",un).toFixed(2)})),[fuelMeta,fY,unKey,lang]);

  // Λεπτομέρειες διαδραστικού gauge (ιστορικό κατανάλωσης / τιμής) — ίδια φίλτρα έτους/μήνα με τα gauges
  const gaugeInfo=useMemo(()=>{
    if(!gaugeDet)return null;
    const ev=pt==="ev";
    const inPeriod=e=>(fY==="all"||e.date.startsWith(fY))&&(fM==="all"||e.date.slice(5,7)===fM);
    let data,color,unit,dec,avg;
    if(gaugeDet==="cons"){
      data=fuelMeta.filter(e=>e._cons!=null&&inPeriod(e)&&((e.fuelType==="electric")===ev)).map(e=>({label:formatDate(e.date),value:+consVal(e._cons,ev,un).toFixed(2)}));
      color="#10b981";unit=cl;dec=1;avg=consVal(stats.aC,ev,un);
    }else{
      const wantE=gaugeDet==="eppl"||ev;
      data=fuelMeta.filter(e=>inPeriod(e)&&parseFloat(e.ppl)>0&&((e.fuelType==="electric")===wantE)).map(e=>({label:formatDate(e.date),value:+parseFloat(e.ppl).toFixed(3)}));
      color=gaugeDet==="eppl"?"#06b6d4":"#f97316";unit=cs(`€/${wantE?"kWh":volLabel("x",un)}`);dec=3;
      avg=data.length?data.reduce((s,d)=>s+d.value,0)/data.length:0;
    }
    const vals=data.map(d=>d.value);
    return{data,color,unit,dec,avg,
      min:vals.length?Math.min(...vals):0,max:vals.length?Math.max(...vals):0,last:vals.length?vals[vals.length-1]:0,
      title:gaugeDet==="cons"?t("📈 Ιστορικό κατανάλωσης"):t("📈 Ιστορικό τιμής")};
  },[gaugeDet,fuelMeta,fY,fM,pt,unKey,stats.aC,cl,lang]);

  // Unified movements (fuel + expenses) grouped by month
  const movesByMonth=useMemo(()=>{
    const items=[];
    if(movFilter==="all"||movFilter==="fuel")fuelMeta.forEach(e=>items.push({kind:"fuel",e}));
    if(movFilter==="all"||movFilter==="exp")allExp.forEach(e=>items.push({kind:"exp",e}));
    if(movFilter==="all"||movFilter==="note")allNotes.forEach(e=>items.push({kind:"note",e}));
    const dir=histSort==="date_asc"?1:-1;
    items.sort((a,b)=>dir*(new Date(a.e.date)-new Date(b.e.date)));
    const map={};
    items.forEach(it=>{
      const d=pd(it.e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${t(MONTHS_FULL[d.getMonth()])} ${d.getFullYear()}`,items:[],nF:0,nE:0,nN:0,total:0};
      map[k].items.push(it);
      if(it.kind==="fuel"){map[k].nF++;map[k].total+=(parseFloat(it.e.total)||0);}
      else if(it.kind==="note"){map[k].nN++;}
      else{map[k].nE++;map[k].total+=(parseFloat(it.e.amount)||0);}
    });
    return Object.values(map).sort((a,b)=>dir*a.key.localeCompare(b.key));
  },[fuelMeta,allExp,allNotes,movFilter,histSort,lang]);

  // Per-day lookup for the calendar
  const dayMap=useMemo(()=>{
    const m={};
    fuelMeta.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).f.push(e);});
    allExp.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).x.push(e);});
    allNotes.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).n.push(e);});
    return m;
  },[fuelMeta,allExp,allNotes,lang]);

  const availYears=useMemo(()=>{
    const ys=new Set([String(new Date().getFullYear())]);
    [...allFuel,...allExp].forEach(e=>{if(e.date)ys.add(e.date.slice(0,4));});
    return[...ys].sort((a,b)=>b-a);
  },[allFuel,allExp,lang]);

  // Yearly review for the active vehicle
  const yearReview=useMemo(()=>{
    const ev=pt==="ev";
    const f=fuelMeta.filter(e=>e.date.startsWith(yearSel));
    const x=allExp.filter(e=>e.date.startsWith(yearSel));
    const sum=(a,k)=>a.reduce((s,e)=>s+(parseFloat(e[k])||0),0);
    const fuelSpent=sum(f,"total"),expSpent=sum(x,"amount");
    const liters=sum(f.filter(e=>e.fuelType!=="electric"),"liters"),kwh=sum(f.filter(e=>e.fuelType==="electric"),"liters");
    const odos=f.map(e=>parseFloat(e.odo)).filter(o=>o>0);
    const km=odos.length>=2?Math.max(...odos)-Math.min(...odos):0;
    let cL=0,cKm=0;
    f.forEach(e=>{if(e._seg){cL+=e._seg.l;cKm+=e._seg.km;}});
    const avgCons=cKm>0?cL/cKm*100:0;
    const prim=f.filter(e=>ev?e.fuelType==="electric":e.fuelType!=="electric");
    const wP=prim.filter(e=>parseFloat(e.ppl)>0);
    const priciest=f.length?f.reduce((a,b)=>(parseFloat(b.total)||0)>(parseFloat(a.total)||0)?b:a):null;
    const cheapest=wP.length?wP.reduce((a,b)=>parseFloat(b.ppl)<parseFloat(a.ppl)?b:a):null;
    const byCat={};x.forEach(e=>{const c=e.category||"custom";byCat[c]=(byCat[c]||0)+(parseFloat(e.amount)||0);});
    const topCat=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
    const byM={};
    [...f.map(e=>[e.date,parseFloat(e.total)||0]),...x.map(e=>[e.date,parseFloat(e.amount)||0])].forEach(([d,v])=>{const m=+d.slice(5,7)-1;byM[m]=(byM[m]||0)+v;});
    const topM=Object.entries(byM).sort((a,b)=>b[1]-a[1])[0];
    return{nF:f.length,nE:x.length,fuelSpent,expSpent,total:fuelSpent+expSpent,liters,kwh,km,avgCons,
      avgPpl:wP.length?sum(wP,"ppl")/wP.length:0,costPerKm:km>0?(fuelSpent+expSpent)/km:0,priciest,cheapest,topCat,topM};
  },[fuelMeta,allFuel,allExp,yearSel,pt,lang]);

  const vFuelTypes=useMemo(()=>{
    const ft=av.fuelType||"diesel",ft2=av.fuelType2;
    const list=[FTYPES.find(f=>f.id===ft)].filter(Boolean);
    if(ft2){const x=FTYPES.find(f=>f.id===ft2);if(x)list.push(x);}
    return list.length?list:FTYPES;
  },[av,lang]);

  const handleInstall=async()=>{if(installPrompt){installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted"){setShowInstallBanner(false);setInstallPrompt(null);}}};

  // ── Parking location ──
  const saveParking=()=>{
    if(!navigator.geolocation){setParkMsg(t("❌ Η συσκευή δεν υποστηρίζει GPS."));return;}
    setParkMsg(t("📡 Εντοπισμός θέσης…"));
    navigator.geolocation.getCurrentPosition(
      p=>{setVehicles(pv=>pv.map(v=>v.id===vid?{...v,parking:{lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy),ts:new Date().toISOString()}}:v));setParkMsg("");},
      err=>setParkMsg(err.code===1?t("❌ Δεν δόθηκε άδεια τοποθεσίας. Επίτρεψέ την από τις ρυθμίσεις του browser ή της εφαρμογής για αυτό το site."):t("❌ Δεν βρέθηκε θέση. Άνοιξε το GPS και ξαναδοκίμασε.")),
      {enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  };
  const clearParking=()=>setVehicles(pv=>pv.map(v=>v.id===vid?{...v,parking:null}:v));

  // ── CRUD Fuel ──
  const handleAddFuel=()=>{
    const ppl=parseFloat(fuelForm.ppl),total=parseFloat(fuelForm.total);
    if(!(total>0)||!fuelForm.date)return;
    const liters=ppl>0?+(total/ppl).toFixed(3):0;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{...fuelForm,id:uid(),total,ppl:ppl||0,liters,odo:fuelForm.odo?parseFloat(fuelForm.odo):null}]}));
    setFuelForm(emptyFuel(av.fuelType||"diesel"));setTab("home");
  };
  const handleDelFuel=id=>{const e=allFuel.find(x=>x.id===id);askDel(t("Γέμισμα καυσίμου"),e?cs(`${formatDate(e.date)} · ${fmt(e.total)}€`):"",()=>setEntries(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};
  const handleSaveEditFuel=()=>{
    if(!(parseFloat(editFuelE.total)>0)||!editFuelE.date)return;
    const ppl=parseFloat(editFuelE.ppl),total=parseFloat(editFuelE.total),liters=ppl>0?+(total/ppl).toFixed(3):(parseFloat(editFuelE.liters)||0);
    setEntries(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editFuelE.id?{...editFuelE,total,ppl:ppl||0,liters,odo:editFuelE.odo?parseFloat(editFuelE.odo):null}:e)}));
    setEditFuelE(null);
  };

  // ── CRUD Expenses ──
  const handleAddExp=()=>{
    if(!(parseFloat(expForm.amount)>0)||!expForm.category||!expForm.date)return;
    const cat=EXPENSE_CATS.find(c=>c.id===expForm.category);
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{...expForm,id:uid(),amount:parseFloat(expForm.amount),icon:cat&&cat.icon||"💸",label:expForm.label}]}));
    setExpForm(emptyExp());
  };
  const handleDelExp=id=>{const e=allExp.find(x=>x.id===id),c=e&&EXPENSE_CATS.find(k=>k.id===e.category);askDel(t("Έξοδο"),e?cs(`${dispLabel(e,c)} · ${formatDate(e.date)} · -${fmt(e.amount)}€`):"",()=>setExpenses(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};

  // ── CRUD Notes ──
  const handleSaveNote=()=>{
    const text=(noteEdit.text||"").trim();if(!text||!noteEdit.date)return;
    setNotes(p=>{const list=p[vid]||[];const n={...noteEdit,text};return{...p,[vid]:n.id?list.map(x=>x.id===n.id?n:x):[...list,{...n,id:uid()}]};});
    setNoteEdit(null);
  };
  const handleDelNote=id=>{const e=allNotes.find(x=>x.id===id);askDel(t("Σημείωση"),e?`${formatDate(e.date)} · ${(e.text||"").slice(0,50)}${(e.text||"").length>50?"…":""}`:"",()=>setNotes(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};
  const handleSaveEditExp=()=>{
    if(!(parseFloat(editExpE.amount)>0)||!editExpE.date)return;
    const cat=EXPENSE_CATS.find(c=>c.id===editExpE.category);
    setExpenses(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editExpE.id?{...editExpE,amount:parseFloat(editExpE.amount),icon:cat&&cat.icon||editExpE.icon}:e)}));
    setEditExpE(null);
  };

  // ── Reminder done: set next date / km (empty = remove reminder) ──
  const saveDoneRem=()=>{
    const r=doneRem;if(!r)return;
    setVehicles(p=>p.map(v=>{
      if(v.id!==r.vid)return v;
      const info={...v.info,[r.f]:r.value||""};
      if(r.f==="serviceNextDate")info.serviceDate=today();
      if(r.f==="tiresNext")info.tiresDate=today();
      if(r.f==="serviceNextKm"){if(r.odo)info.serviceKm=String(r.odo);info.serviceDate=today();}
      return{...v,info};
    }));
    setDoneRem(null);
  };

  // ── CRUD Vehicles ──
  const handleAddVehicle=()=>{
    if(!newV.fuelType)return;
    const v={...newV,id:uid(),name:(newV.name||"").trim()||"ΟΧΗΜΑ 1"};
    if(setupMode){metaRef.current={u:Object.create(null),dels:Object.create(null),sig:Object.create(null)};setVehicles([v]);setEntries({});setExpenses({});setNotes({});setSetupMode(false);}
    else setVehicles(p=>[...p,v]);
    setVid(v.id);setShowAddV(false);setNewV(defV({units:{...UNIT_PRESETS[defUnits]}}));setTab("home");
  };
  const handleSaveEditV=()=>{
    if(!editVData.fuelType)return;
    const old=vehicles.find(v=>v.id===editVData.id)||{};
    const from=cleanUnits(old.units),to=cleanUnits(editVData.units);
    let info=old.info||defInfo();
    if(from.dist!==to.dist||from.vol!==to.vol){
      const conv=convertUnits(from,to,entries[editVData.id]||[],info);
      info=conv.inf;
      setEntries(p=>({...p,[editVData.id]:conv.ent}));
    }
    setVehicles(p=>p.map(v=>v.id===editVData.id?{...v,name:editVData.name,color:editVData.color,icon:editVData.icon,category:editVData.category,powertrain:editVData.powertrain||"ice",fuelType:editVData.fuelType,fuelType2:editVData.fuelType2,units:to,info}:v));
    setShowEditV(false);setEditVData(null);
  };
  const handleDeleteV=()=>{
    if(vehicles.length<=1){setConfirmDel({info:true,title:t("Δεν μπορείς να διαγράψεις το μοναδικό όχημα.")});return;}
    askDel(t("Όχημα"),editVData.name+t(" — θα διαγραφούν και όλα τα δεδομένα του."),()=>{
    setVehicles(p=>p.filter(v=>v.id!==editVData.id));
    setEntries(p=>{const n={...p};delete n[editVData.id];return n;});
    setExpenses(p=>{const n={...p};delete n[editVData.id];return n;});
    setNotes(p=>{const n={...p};delete n[editVData.id];return n;});
    setVid((vehicles.find(v=>v.id!==editVData.id)||{}).id||"v1");
    setShowEditV(false);setEditVData(null);
    });
  };
  const updateVInfo=(f,val)=>{if(PAST_FIELDS.includes(f)&&val>today())val=today();setVehicles(p=>p.map(v=>v.id===vid?{...v,info:{...v.info,[f]:val}}:v));};

  // ── Export / Import ──
  const exportJSON=()=>{
    downloadFile(`fuellog_${today()}.json`,"application/json;charset=utf-8",JSON.stringify({vehicles,entries,expenses,notes,vid,meta:{u:metaRef.current.u,dels:metaRef.current.dels}},null,2));
    try{localStorage.setItem("fuellog_last_backup",today());}catch(e){}
    setLastBackup(today());
  };
  const exportCSV=()=>{
    let csv=[t("Τύπος"),t("Όχημα"),t("Ημερομηνία"),t("Κατηγορία"),t("Λίτρα/kWh"),t("€/μον."),t("Σύνολο €"),"ODO",t("Σημειώσεις")].map(csvCell).join(",")+"\n";
    vehicles.forEach(v=>{
      (entries[v.id]||[]).forEach(e=>{csv+=`${csvCell(t("Καύσιμο"))},${csvCell(v.name)},${e.date},${e.fuelType},${fmt(e.liters)},${fmt(e.ppl,3)},${fmt(e.total)},${e.odo||""},${csvCell(e.notes)}\n`;});
      (expenses[v.id]||[]).forEach(e=>{const c=EXPENSE_CATS.find(k=>k.id===e.category);csv+=`${csvCell(t("Έξοδο"))},${csvCell(v.name)},${e.date},${e.category},,,${fmt(e.amount)},,${csvCell(dispLabel(e,c))}\n`;});
      (notes[v.id]||[]).forEach(e=>{csv+=`${csvCell(t("Σημείωση"))},${csvCell(v.name)},${e.date},,,,,,${csvCell(e.text)}\n`;});
    });
    downloadFile(`fuellog_${today()}.csv`,"text/csv;charset=utf-8","\uFEFF"+csv);
  };
  const exportExcel=()=>{
    const sep="\t";
    let out="FuelLog - "+csvCell(av.name)+"\r\n\r\n"+t("ΓΕΜΙΣΜΑΤΑ ΚΑΥΣΙΜΟΥ")+"\r\n";
    out+=[t("Ημερομηνία"),t("Τύπος"),t("Λίτρα/kWh"),t("Τιμή/μον."),`${t("Σύνολο")} ${cur}`,"ODO",`${t("κατ.")} (${cl})`,t("Σημειώσεις")].join(sep)+"\r\n";
    allFuel.forEach(e=>{
      const sg=segMap[e.id],cons=sg?sg.cons:null,ftype=FTYPES.find(f=>f.id===e.fuelType);
      out+=[formatDate(e.date),(ftype?t(ftype.label):e.fuelType)+(e.octane?" "+e.octane:"")+(e.full===false?" ("+t("μερικό")+")":""),fmt(e.liters),fmt(e.ppl,3),fmt(e.total),e.odo||"",cons?fmt(consVal(cons,e.fuelType==="electric",un),1):"",csvCell(e.notes)].join(sep)+"\r\n";
    });
    if(allExp.length>0){
      out+="\r\n"+t("ΛΟΙΠΑ ΕΞΟΔΑ")+"\r\n"+[t("Ημερομηνία"),t("Κατηγορία"),t("Περιγραφή"),`${t("Ποσό")} ${cur}`].join(sep)+"\r\n";
      allExp.forEach(e=>{const cat=EXPENSE_CATS.find(c=>c.id===e.category);out+=[formatDate(e.date),cat?t(cat.label):e.category,csvCell(dispLabel(e,cat)),fmt(e.amount)].join(sep)+"\r\n";});
    }
    downloadFile(`fuellog_${safeName(av.name)}_${today()}.xls`,"text/tab-separated-values;charset=utf-8","\uFEFF"+out);
  };

  const exportPDF=()=>{
    const sym=esc(CURSYM);
    const totalFuel=allFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const totalExp=allExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const fuelRows=allFuel.map(e=>{
      const sg0=segMap[e.id],cons=sg0?sg0.cons:null,ftype=FTYPES.find(f=>f.id===e.fuelType);
      return`<tr><td>${formatDate(e.date)}</td><td>${esc(ftype?t(ftype.label):e.fuelType)}${e.full===false?" ("+esc(t("μερικό"))+")":""}</td><td>${fmt(e.liters,2)}</td><td>${fmt(e.ppl,3)}</td><td><b>${fmt(e.total)}${sym}</b></td><td>${e.odo?Number(e.odo).toLocaleString():"-"}</td><td>${cons?fmt(consVal(cons,e.fuelType==="electric",un),1):"-"}</td><td>${esc(e.notes)}</td></tr>`;
    }).join("");
    const expRows=allExp.map(e=>{
      const cat=EXPENSE_CATS.find(c=>c.id===e.category);
      return`<tr><td>${formatDate(e.date)}</td><td>${esc(cat?t(cat.label):e.category)}</td><td>${esc(dispLabel(e,cat))}</td><td style="color:#c00;font-weight:bold">-${fmt(e.amount)}${sym}</td></tr>`;
    }).join("");
    const H=k=>esc(t(k));
    const html=`<!DOCTYPE html><html lang="${LANG}"><head><meta charset="UTF-8"><title>FuelLog - ${esc(av.name)}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:20px}.hdr{margin-bottom:14px;border-bottom:3px solid #f97316;padding-bottom:8px}.hdr h1{font-size:19px;color:#f97316}.hdr p{font-size:10px;color:#555;margin-top:4px}.totals{background:#f5f5f5;border-radius:6px;padding:8px 14px;display:flex;gap:24px;font-size:12px;margin-bottom:14px}.totals b{color:#f97316}h2{font-size:13px;margin:16px 0 7px;color:#1e1e30;border-left:4px solid #f97316;padding-left:8px}table{width:100%;border-collapse:collapse;margin-bottom:14px}thead tr{background:#1e1e30;color:#fff}th{padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f8f8fc}.footer{margin-top:18px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}@media print{body{padding:8px}}</style></head><body><div class="hdr"><h1>⛽ FuelLog — ${esc(av.name)}${av.info&&av.info.plate?" ("+esc(av.info.plate)+")":""}</h1><p>${H("Εξαγωγή")}: ${today()} &nbsp;|&nbsp; ${H("Γεμίσματα")}: ${allFuel.length} &nbsp;|&nbsp; ${H("Σύνολο")}: ${fmt(totalFuel+totalExp)}${sym}</p></div><div class="totals"><div>${H("Καύσιμα")}: <b>${fmt(totalFuel)}${sym}</b></div><div>${H("Άλλα έξοδα")}: <b>${fmt(totalExp)}${sym}</b></div><div>${H("Σύνολο")}: <b>${fmt(totalFuel+totalExp)}${sym}</b></div></div><h2>⛽ ${H("Γεμίσματα Καυσίμου")}</h2><table><thead><tr><th>${H("Ημερομηνία")}</th><th>${H("Τύπος")}</th><th>${H("Λίτρα/kWh")}</th><th>${H("€/μον.")}</th><th>${H("Σύνολο")}</th><th>ODO (${esc(dl)})</th><th>${esc(cl)}</th><th>${H("Σημειώσεις")}</th></tr></thead><tbody>${fuelRows}</tbody></table>${allExp.length>0?"<h2>📋 "+H("Λοιπά Έξοδα")+"</h2><table><thead><tr><th>"+H("Ημερομηνία")+"</th><th>"+H("Κατηγορία")+"</th><th>"+H("Περιγραφή")+"</th><th>"+H("Ποσό")+"</th></tr></thead><tbody>"+expRows+"</tbody></table>":""}<div class="footer">${H("Δημιουργήθηκε από")} FuelLog v${APP_VER} — Ταχμαζίδης Κ. Γιώργος</div><script>window.onload=function(){window.print();};<\/script></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(!win){const a=document.createElement("a");a.href=url;a.download=`fuellog_${safeName(av.name)}_${today()}.html`;a.click();}
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  };

  const doImport=d=>{
    try{const prev=localStorage.getItem("fuellog_data");if(prev)localStorage.setItem("fuellog_before_import",prev);}catch(e){}
    applyData(d,"replace");
    setImportMsg(t("✅ Εισαγωγή επιτυχής!"));setImportText("");
  };
  const handleImport=()=>{
    const text=importText.trim();
    if(!text){setImportMsg(t("❌ Δεν έχεις επιλέξει αρχείο."));return;}
    if(text.length>8*1024*1024){setImportMsg(t("❌ Πολύ μεγάλο αρχείο."));return;}
    let d=null;
    try{d=sanitizeData(JSON.parse(text));}catch(e){setImportMsg(t("❌ Μη έγκυρο JSON."));return;}
    if(!d){setImportMsg(t("❌ Μη έγκυρη μορφή FuelLog."));return;}
    const cnt=o=>Object.values(o).reduce((s,a)=>s+a.length,0);
    askConfirm({title:t("Αντικατάσταση δεδομένων"),detail:tf("{0} όχημα · {1} γεμίσματα · {2} έξοδα",d.vehicles.length,cnt(d.entries),cnt(d.expenses)),question:t("Να αντικατασταθούν τα τωρινά δεδομένα;"),ok:t("Εισαγωγή"),icon:"⬆️",note:t("Θα κρατηθεί αυτόματα αντίγραφο των τωρινών.")},()=>doImport(d));
  };
    const handleMergeImport=()=>{
    const text=importText.trim();
    if(!text){setImportMsg(t("❌ Δεν έχεις επιλέξει αρχείο."));return;}
    if(text.length>8*1024*1024){setImportMsg(t("❌ Πολύ μεγάλο αρχείο."));return;}
    let d=null;
    try{d=sanitizeData(JSON.parse(text));}catch(e){setImportMsg(t("❌ Μη έγκυρο JSON."));return;}
    if(!d){setImportMsg(t("❌ Μη έγκυρη μορφή FuelLog."));return;}
    const m=mergeData(snapshotLocal(),d);
    if(!m){setImportMsg(t("❌ Μη έγκυρη μορφή FuelLog."));return;}
    try{const prev=localStorage.getItem("fuellog_data");if(prev)localStorage.setItem("fuellog_before_import",prev);}catch(e){}
    applyData(m.data,"merge");
    setImportMsg(tf("✅ Συγχωνεύθηκαν: +{0} νέες · {1} ενημερώθηκαν · {2} διαγράφηκαν · {3} διπλές παραλείφθηκαν",m.stats.added,m.stats.updated,m.stats.removed,m.stats.dups));setImportText("");
  };
  const handleFuelioFile=e=>{
    const f=e.target.files[0];if(!f)return;
    if(f.size>8*1024*1024){setFuelioMsg(t("❌ Πολύ μεγάλο αρχείο."));e.target.value="";return;}
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const res=importFuelio(String(ev.target.result||""));
        if(!res){setFuelioMsg(t("❌ Δεν αναγνωρίστηκε αρχείο Fuelio."));return;}
        const v=res.vehicle;
        const ex=vehicles.find(x=>sameVehicle(x,v));
        let addE=res.entries,addX=res.expenses,dupN=0,tid=v.id;
        if(ex){
          const de=dedupeList("entries",entries[ex.id],res.entries),dx=dedupeList("expenses",expenses[ex.id],res.expenses);
          addE=de.list;addX=dx.list;dupN=de.dups+dx.dups;tid=ex.id;
          setEntries(p=>({...p,[ex.id]:[...(p[ex.id]||[]),...addE]}));setExpenses(p=>({...p,[ex.id]:[...(p[ex.id]||[]),...addX]}));
        }else{
          setVehicles(p=>[...p,v]);setEntries(p=>({...p,[v.id]:res.entries}));setExpenses(p=>({...p,[v.id]:res.expenses}));
        }
        setVid(tid);
        const ftl=FTYPES.find(x=>x.id===v.fuelType);
        setFuelioMsg((ex?tf("✅ Προστέθηκαν στο «{0}»: {1} γεμίσματα, {2} έξοδα.",ex.name,addE.length,addX.length):tf("✅ Προστέθηκε «{0}»: {1} γεμίσματα, {2} έξοδα.",v.name,res.entries.length,res.expenses.length))+(dupN?" "+tf("{0} διπλοεγγραφές παραλείφθηκαν.",dupN):"")
          +(res.stats.unknownFuel?" "+tf("{0} εγγραφές με άγνωστο τύπο καυσίμου μπήκαν ως «{1}».",res.stats.unknownFuel,ftl?t(ftl.label):""):"")
          +(res.stats.rescaled?" "+tf("Διορθώθηκαν αυτόματα {0} τιμές που είχαν εξαχθεί ×1000.",res.stats.rescaled):""));
      }catch(err){setFuelioMsg(t("❌ Σφάλμα ανάγνωσης αρχείου."));}
    };
    r.onerror=()=>setFuelioMsg(t("❌ Αδυναμία ανάγνωσης αρχείου."));
    r.readAsText(f,"utf-8");e.target.value="";
  };
  const handleCsvFile=e=>{
    const f=e.target.files[0];if(!f)return;
    if(f.size>8*1024*1024){setCsvMsg(t("❌ Πολύ μεγάλο αρχείο."));e.target.value="";return;}
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const text=String(ev.target.result||"");
        const rows=parseCSV(text,detectDelim(text)).filter(x=>x.filter(c=>String(c).trim()).length>=2);
        if(rows.length<2){setCsvMsg(t("❌ Το αρχείο δεν περιέχει δεδομένα."));return;}
        const headers=rows[0].map(h=>String(h).trim());
        const map=guessCsvMap(headers);
        setCsvMsg("");
        setCsvImp({headers,rows:rows.slice(1,20001),map,name:f.name.replace(/\.[^.]+$/,"").slice(0,40),fuelType:"petrol",units:{...UNIT_PRESETS[defUnits]},dfmt:"dd",fullInverted:map.full>=0&&/partial|μερικο/.test(strip(headers[map.full]))});
      }catch(err){setCsvMsg(t("❌ Σφάλμα ανάγνωσης αρχείου."));}
    };
    r.onerror=()=>setCsvMsg(t("❌ Αδυναμία ανάγνωσης αρχείου."));
    r.readAsText(f,"utf-8");e.target.value="";
  };
  const doCsvImport=()=>{
    const c=csvImp;if(!c)return;
    if(c.map.date<0||(c.map.total<0&&c.map.vol<0)){setCsvMsg(t("❌ Διάλεξε τουλάχιστον τις στήλες Ημερομηνία και Συνολικό κόστος ή Ποσότητα."));return;}
    const res=buildCsvVehicle(c.rows,c.map,c);
    if(!res||!res.entries.length){setCsvMsg(t("❌ Δεν βρέθηκαν έγκυρες εγγραφές. Έλεγξε τις στήλες."));return;}
    const v=res.vehicle;
    const ex=vehicles.find(x=>sameVehicle(x,v));
    let addE=res.entries,dupN=0,tid=v.id;
    if(ex){
      const de=dedupeList("entries",entries[ex.id],res.entries);
      addE=de.list;dupN=de.dups;tid=ex.id;
      setEntries(p=>({...p,[ex.id]:[...(p[ex.id]||[]),...addE]}));
    }else{
      setVehicles(p=>[...p,v]);setEntries(p=>({...p,[v.id]:res.entries}));setExpenses(p=>({...p,[v.id]:[]}));
    }
    setVid(tid);
    setCsvMsg((ex?tf("✅ Προστέθηκαν στο «{0}»: {1} γεμίσματα.",ex.name,addE.length):tf("✅ Προστέθηκε «{0}»: {1} γεμίσματα.",v.name,res.entries.length))+(dupN?" "+tf("{0} διπλοεγγραφές παραλείφθηκαν.",dupN):"")+(res.skipped?" "+tf("{0} γραμμές παραλείφθηκαν.",res.skipped):""));
    setCsvImp(null);
  };
  const handleImportFile=e=>{const f=e.target.files[0];if(!f)return;if(f.size>8*1024*1024){setImportMsg(t("❌ Πολύ μεγάλο αρχείο."));e.target.value="";return;}const r=new FileReader();r.onload=ev=>{setImportText(String(ev.target.result||""));setImportMsg("");};r.onerror=()=>setImportMsg(t("❌ Αδυναμία ανάγνωσης αρχείου."));r.readAsText(f);e.target.value="";};

  // Inputs get a coloured (vehicle colour) border so they stand out
  const IS={width:"100%",padding:12,marginBottom:10,borderRadius:8,background:T.inp,color:T.tx,border:`2px solid ${col}`,boxSizing:"border-box",fontSize:"max(16px, calc(14px * var(--fs, 1)))"};
  const CS=(extra={})=>({background:T.sf,padding:14,borderRadius:14,border:`1px solid ${T.br}`,...extra});
  const TABS=[{id:"home",label:t("Αρχική"),icon:"🏠"},{id:"fuel",label:pt==="ev"?t("Φόρτιση"):t("Καύσιμο"),icon:pt==="ev"?"⚡":"⛽"},{id:"expenses",label:t("Έξοδα"),icon:"📋"},{id:"stats",label:t("Στατιστικά"),icon:"📊"},{id:"history",label:t("Κινήσεις"),icon:"🧾"}];
  const curMonthKey=today().slice(0,7);
  const hasData=Object.values(entries).some(a=>a&&a.length)||Object.values(expenses).some(a=>a&&a.length)||Object.values(notes).some(a=>a&&a.length);
  const backupAge=lastBackup?-daysUntil(lastBackup):null;
  const needBackup=hasData&&!hideBackup&&(backupAge===null||backupAge>=30);
  const editFuelOpts=(()=>{const base=vFuelTypes;if(!editFuelE||base.some(f=>f.id===editFuelE.fuelType))return base;const x=FTYPES.find(f=>f.id===editFuelE.fuelType);return x?[...base,x]:base;})();
  const chipStyle=on=>({padding:"6px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:fz(12),fontWeight:"bold",background:on?col:T.br,color:on?"#fff":T.mt});

  return(
    <div className="fl-root" style={{backgroundColor:T.bg,color:T.tx,minHeight:"100vh",fontFamily:"sans-serif",paddingBottom:90,"--fs":FS_SCALE[fsLvl]}}>
      <style>{`.fl-root input:focus,.fl-root select:focus,.fl-root textarea:focus{outline:none;box-shadow:0 0 0 3px ${col}55}${setupMode?".fl-root header,.fl-root main,.fl-root .fl-hide{visibility:hidden}":""}`}</style>

      {/* Header */}
      <header style={{flexWrap:"wrap",gap:6,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Logo col={col} bg={T.sf} size={34}/>
          <span style={{fontWeight:"bold",fontSize:fz(17)}}>Fuel<span style={{color:col}}>Log</span>
          <span style={{fontSize:fz(11),color:T.mt,fontWeight:"normal"}}>v{APP_VER}</span></span>
      
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setShowVInfo(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:fz(14),cursor:"pointer"}} title={t("Αρχείο αυτοκινήτου")}>🗂️</button>
          <button onClick={()=>setShowPark(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:fz(14),cursor:"pointer"}} title={t("Πού παρκάρισα")}>{av.parking?"📍":"🅿️"}</button>
          <button onClick={()=>setShowIO(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:fz(14),cursor:"pointer"}}>💾</button>
          <button onClick={()=>setShowAbout(true)} style={{border:"none",background:"none",fontSize:fz(20),cursor:"pointer"}}>ℹ️</button>
          <button onClick={()=>setDark(!dark)} style={{border:"none",background:"none",fontSize:fz(22),cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </header>

      {/* Vehicle selector */}
      <div className="fl-hide" style={{display:"flex",gap:8,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,overflowX:"auto"}}>
        {vehicles.map(v=>(
          <div key={v.id} style={{display:"flex",alignItems:"center",borderRadius:20,background:vid===v.id?v.color:T.br,overflow:"hidden"}}>
            <button onClick={()=>setVid(v.id)} style={{padding:"6px 12px",border:"none",cursor:"pointer",whiteSpace:"nowrap",background:"transparent",color:vid===v.id?"#fff":T.mt,fontWeight:"bold",fontSize:fz(13)}}>{v.icon} {v.name}</button>
            {vid===v.id&&<button onClick={()=>{setEditVData({...v});setShowEditV(true);}} style={{border:"none",background:"rgba(0,0,0,0.2)",color:"#fff",cursor:"pointer",padding:"6px 8px",fontSize:fz(12),borderLeft:"1px solid rgba(255,255,255,0.2)"}}>✏️</button>}
          </div>
        ))}
        <button onClick={()=>{setNewV(defV({units:{...UNIT_PRESETS[defUnits]}}));setShowAddV(true);}} style={{padding:"6px 12px",borderRadius:20,border:`1px dashed ${T.mt}`,background:"none",color:T.mt,cursor:"pointer",fontSize:fz(18),lineHeight:1}}>+</button>
      </div>

      {/* Bottom nav */}
      <div className="fl-hide" style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",background:T.sf,borderTop:`1px solid ${T.br}`,padding:"5px 0",zIndex:100}}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{border:"none",background:"none",cursor:"pointer",padding:"3px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:1,color:tab===tb.id?col:T.mt,fontSize:fz(9),fontWeight:tab===tb.id?"bold":"normal",position:"relative"}}>
            <span style={{fontSize:fz(19)}}>{tb.icon}</span>{t(tb.label)}
            {tb.id==="home"&&reminders.length>0&&(
              <span style={{position:"absolute",top:0,right:2,background:reminders.some(r=>r.expired||r.urgent)?"#e11d48":YEL,color:reminders.some(r=>r.expired||r.urgent)?"#fff":"#000",fontSize:fz(8),fontWeight:"bold",padding:"1px 4px",borderRadius:8,minWidth:14,textAlign:"center"}}>{reminders.length}</span>
            )}
          </button>
        ))}
      </div>

      <main style={{padding:15}}>

        {/* ══ HOME ══ */}
        {tab==="home"&&(
          <div>
            <div style={{...CS(),marginBottom:12}}>
              <div style={{fontSize:fz(11),color:T.mt,marginBottom:4}}>{t("ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ ·")} {av.icon} {av.name}</div>
              <div style={{fontSize:fz(30),fontWeight:"bold",color:YEL}}>{fmt((entries[vid]||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0)+(expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0))}{cs("€")}</div>
              {av.info&&av.info.plate&&<div style={{fontSize:fz(11),color:T.mt,marginTop:2}}>{av.info.plate}</div>}
            </div>


            {saveErr&&(
              <div style={{background:dark?"#2a0a0a":"#fde8e8",border:"1px solid #e11d48",borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:fz(26)}}>⚠️</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:fz(13),fontWeight:"bold",color:"#e11d48"}}>{t("Δεν γίνεται αποθήκευση στη συσκευή")}</div>
                  <div style={{fontSize:fz(11),color:T.mt}}>{t("Η μνήμη του browser είναι γεμάτη ή μπλοκαρισμένη (π.χ. ιδιωτική περιήγηση). Κατέβασε αντίγραφο τώρα για να μη χαθούν δεδομένα.")}</div>
                </div>
                <button onClick={exportJSON} style={{padding:"7px 12px",background:"#e11d48",color:"#fff",border:"none",borderRadius:8,fontWeight:"bold",fontSize:fz(12),cursor:"pointer",whiteSpace:"nowrap"}}>{t("Λήψη JSON")}</button>
              </div>
            )}
            {showInstallBanner&&!isStandalone&&(
              <div style={{background:dark?"#1a1a10":"#fff8e7",border:`1px solid ${col}`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:fz(28)}}>📲</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:fz(13),fontWeight:"bold",color:col}}>{t("Εγκατέστησε το FuelLog!")}</div>
                  {isIOS?<div style={{fontSize:fz(11),color:T.mt}}>{t("Πάτα")} <b>Share</b> → <b>"Add to Home Screen"</b> {t("για offline χρήση")}</div>:<div style={{fontSize:fz(11),color:T.mt}}>{t("Γρήγορη πρόσβαση & χρήση χωρίς internet")}</div>}
                </div>
                {!isIOS&&<button onClick={handleInstall} style={{padding:"7px 12px",background:col,color:"#fff",border:"none",borderRadius:8,fontWeight:"bold",fontSize:fz(12),cursor:"pointer",whiteSpace:"nowrap"}}>{t("Εγκατάσταση")}</button>}
                <button onClick={()=>setShowInstallBanner(false)} style={{border:"none",background:"none",color:T.mt,fontSize:fz(20),cursor:"pointer",lineHeight:1,padding:4}}>✕</button>
              </div>
            )}
            {needBackup&&(
              <div style={{background:dark?"#101a24":"#e6f0fb",border:"1px solid #3b82f6",borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:fz(26)}}>💾</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:fz(13),fontWeight:"bold",color:"#3b82f6"}}>{t("Κάνε αντίγραφο ασφαλείας")}</div>
                  <div style={{fontSize:fz(11),color:T.mt}}>{backupAge===null?t("Δεν έχεις κατεβάσει ποτέ αντίγραφο."):tf("Το τελευταίο ήταν πριν {0} μέρες.",backupAge)} {t("Τα δεδομένα μένουν μόνο σε αυτό το κινητό.")}</div>
                </div>
                <button onClick={exportJSON} style={{padding:"7px 12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,fontWeight:"bold",fontSize:fz(12),cursor:"pointer",whiteSpace:"nowrap"}}>{t("Λήψη JSON")}</button>
                <button onClick={()=>setHideBackup(true)} style={{border:"none",background:"none",color:T.mt,fontSize:fz(20),cursor:"pointer",lineHeight:1,padding:4}}>✕</button>
              </div>
            )}
            {reminders.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:fz(12),fontWeight:"bold",color:YEL,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{t("🔔 Υπενθυμίσεις")} <span style={{background:"#e11d48",color:"#fff",fontSize:fz(10),fontWeight:"bold",padding:"1px 7px",borderRadius:10}}>{reminders.length}</span>
                </div>
                {reminders.map((r,i)=>{
                  const bgC=r.expired?"#2a0a0a":r.urgent?"#2a1200":dark?"#1a1a10":"#fdf3d0";
                  const bC=r.expired?"#e11d48":r.urgent?"#f97316":YEL;
                  const tC=r.expired?"#ef4444":r.urgent?"#f97316":YEL;
                  const st=r.isKm?(r.expired?tf("⚠️ Πέρασες το όριο κατά {0} {1}",Math.abs(Math.round(r.kmLeft)).toLocaleString(),r.dl):tf("⏰ Σε {0} {1}",Math.round(r.kmLeft).toLocaleString(),r.dl)):r.expired?tf("⚠️ Έληξε πριν {0} μέρες",Math.abs(r.days)):r.days===0?t("⚠️ Λήγει ΣΗΜΕΡΑ"):tf("⏰ Λήγει σε {0} μέρες",r.days);
                  return(
                    <div key={i} onClick={()=>setDoneRem({...r,value:""})} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,marginBottom:6,cursor:"pointer",background:bgC,border:`1px solid ${bC}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:fz(22)}}>{r.icon}</span>
                        <div><div style={{fontSize:fz(13),fontWeight:"bold",color:tC}}>{t(r.label)}</div><div style={{fontSize:fz(11),color:T.mt}}>{r.vIcon} {r.vName} · {r.isKm?tf("όριο {0} {1}",Number(r.date).toLocaleString(),r.dl):formatDate(r.date)}</div></div>
                      </div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:fz(11),fontWeight:"bold",color:tC}}>{st}</div><div style={{fontSize:fz(10),color:T.mt}}>{t("✔ Έγινε;")}</div></div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div onClick={()=>{setMovFilter("fuel");setTab("history");}} style={{...CS({cursor:"pointer",borderLeft:`3px solid #3b82f6`})}}>
                <div style={{fontSize:fz(10),color:T.mt}}>{t("⛽ ΓΕΜΙΣΜΑΤΑ")}</div>
                <div style={{fontSize:fz(26),fontWeight:"bold",color:"#3b82f6"}}>{(entries[vid]||[]).length}</div>
                <div style={{fontSize:fz(10),color:col,marginTop:6}}>{t("→ Κινήσεις")}</div>
              </div>
              <div onClick={()=>{setMovFilter("exp");setTab("history");}} style={{...CS({cursor:"pointer",borderLeft:`3px solid #e11d48`})}}>
                <div style={{fontSize:fz(10),color:T.mt}}>{t("📋 ΕΞΟΔΑ")}</div>
                <div style={{fontSize:fz(26),fontWeight:"bold",color:"#e11d48"}}>{(expenses[vid]||[]).length}</div>
                <div style={{fontSize:fz(10),color:col,marginTop:6}}>{t("→ Κινήσεις")}</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FUEL ══ */}
        {tab==="fuel"&&(
          <div style={CS({border:`2px solid ${col}`})}>
            <h3 style={{marginTop:0,fontSize:fz(16)}}>{fuelForm.fuelType==="electric"?t("⚡ Νέα Φόρτιση"):t("⛽ Νέο Γέμισμα")}</h3>
            <input type="date" max={today()} value={fuelForm.date} onChange={e=>setFuelForm({...fuelForm,date:e.target.value>today()?today():e.target.value})} style={IS}/>
            <select value={fuelForm.fuelType} onChange={e=>setFuelForm({...fuelForm,fuelType:e.target.value})} style={IS}>
              {vFuelTypes.map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}
            </select>
            <input type="number" step="0.001" placeholder={cs(`⬡  ${t("Τιμή")} €/${volLabel(fuelForm.fuelType,un)}`)} value={fuelForm.ppl} onChange={e=>setFuelForm({...fuelForm,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder={t("💶  Συνολικό Ποσό €")} value={fuelForm.total} onChange={e=>setFuelForm({...fuelForm,total:e.target.value})} style={IS}/>
            <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:10,borderRadius:8,background:T.inp,border:`2px solid ${col}`,cursor:"pointer",fontSize:fz(13),color:T.tx}}>
              <input type="checkbox" checked={fuelForm.full!==false} onChange={e=>setFuelForm({...fuelForm,full:e.target.checked})} style={{width:20,height:20,accentColor:col}}/>
              <span>{fuelForm.fuelType==="electric"?t("🔋 Φόρτισα μέχρι πάνω"):t("⛽ Γέμισα μέχρι πάνω (φουλ)")}</span>
            </label>
            {parseFloat(fuelForm.ppl)>0&&parseFloat(fuelForm.total)>0&&(
              <div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"9px 14px",borderRadius:8,marginBottom:10,fontSize:fz(13),border:"1px solid #10b981"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>🧮 <b>{+(parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl)).toFixed(2)}</b> {volLabel(fuelForm.fuelType,un)}</span>
                  <span style={{fontSize:fz(11),opacity:0.8}}>{fmt(parseFloat(fuelForm.ppl),3)} {cs("€/")}{volLabel(fuelForm.fuelType,un)}</span>
                </div>
                {(()=>{
                  const isEl=fuelForm.fuelType==="electric";
                  const same=allFuel.filter(x=>(x.fuelType==="electric")===isEl);
                  let ai=-1;for(let i=same.length-1;i>=0;i--){if(same[i].full!==false){ai=i;break;}}
                  const prevE=pt==="phev"||ai<0?null:same[ai];
                  const curOdo=parseFloat(fuelForm.odo),prevOdo=prevE?parseFloat(prevE.odo):null;
                  const liters=parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl);
                  const accL=liters+same.slice(ai+1).reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
                  if(fuelForm.full!==false&&curOdo>0&&prevOdo>0&&curOdo>prevOdo&&liters>0){
                    const cons=(accL/(curOdo-prevOdo)*100).toFixed(1),diffKm=curOdo-prevOdo;
                    return <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid #10b98140",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:fz(11)}}>📍 {diffKm} {distLabel(un)}</span><span style={{fontSize:fz(12),fontWeight:"bold"}}>{fmt(consVal(parseFloat(cons),isEl,un),1)} {consLabel(isEl,un)}</span></div>;
                  }return null;
                })()}
              </div>
            )}
            <input type="number" placeholder={`🔢  Odometer (${t("Συνολικά")} ${distLabel(un)})`} value={fuelForm.odo} onChange={e=>setFuelForm({...fuelForm,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder={t("📝  Σημειώσεις (προαιρετικό)")} value={fuelForm.notes} onChange={e=>setFuelForm({...fuelForm,notes:e.target.value})} style={IS}/>
            <button onClick={handleAddFuel} style={{width:"100%",padding:15,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(16),cursor:"pointer"}}>{t("ΑΠΟΘΗΚΕΥΣΗ")}</button>
          </div>
        )}

        {/* ══ EXPENSES ══ */}
        {tab==="expenses"&&(
          <div>
            <div style={{...CS({border:`2px solid ${col}`}),marginBottom:16}}>
              <h3 style={{margin:"0 0 12px",fontSize:fz(15)}}>{t("➕ Νέο Έξοδο")}</h3>
              <input type="date" max={today()} value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value>today()?today():e.target.value})} style={IS}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {EXPENSE_CATS.map(cat=>(
                  <div key={cat.id} onClick={()=>setExpForm({...expForm,category:cat.id,label:""})}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px",borderRadius:10,cursor:"pointer",
                      background:expForm.category===cat.id?col:T.inp,
                      border:`2px solid ${expForm.category===cat.id?col:T.br}`,
                      transition:"all 0.15s"}}>
                    <span style={{fontSize:fz(22)}}>{cat.icon}</span>
                    <span style={{fontSize:fz(9),fontWeight:"bold",textAlign:"center",lineHeight:1.2,color:expForm.category===cat.id?"#fff":T.tx}}>{t(cat.label)}</span>
                  </div>
                ))}
              </div>
              {!expForm.category&&<div style={{fontSize:fz(11),color:T.mt,margin:"-2px 0 10px",textAlign:"center"}}>{t("👆 Διάλεξε κατηγορία εξόδου")}</div>}
              <input type="text" placeholder={t("Περιγραφή / Τοποθεσία (προαιρετικό)")} value={expForm.label} onChange={e=>setExpForm({...expForm,label:e.target.value})} style={IS}/>
              <input type="number" step="0.01" placeholder={t("Ποσό €")} value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} style={{...IS,fontSize:fz(20),fontWeight:"bold",textAlign:"center"}}/>
              <button onClick={handleAddExp} style={{opacity:expForm.category&&parseFloat(expForm.amount)>0?1:0.45,width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("✅ ΑΠΟΘΗΚΕΥΣΗ")}</button>
            </div>

            {/* Category filter chips */}
            {allExp.length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                <button onClick={()=>setExpCatFilter("all")} style={{padding:"5px 10px",borderRadius:16,border:"none",cursor:"pointer",fontSize:fz(11),fontWeight:"bold",background:expCatFilter==="all"?col:T.br,color:expCatFilter==="all"?"#fff":T.mt}}>{t("Όλα")}</button>
                {EXPENSE_CATS.filter(c=>(expenses[vid]||[]).some(e=>e.category===c.id)).map(c=>(
                  <button key={c.id} onClick={()=>setExpCatFilter(expCatFilter===c.id?"all":c.id)}
                    style={{padding:"5px 10px",borderRadius:16,border:"none",cursor:"pointer",fontSize:fz(11),fontWeight:"bold",
                      background:expCatFilter===c.id?col:T.br,color:expCatFilter===c.id?"#fff":T.mt}}>
                    {c.icon} {t(c.label)}
                  </button>
                ))}
              </div>
            )}

            {expByMonth.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>{t("Δεν υπάρχουν έξοδα ακόμα.")}</div>}

            {expByMonth.map(({key,label,entries:me,total,byCategory})=>{
              const filtMe=expCatFilter==="all"?me:me.filter(e=>e.category===expCatFilter);
              if(!filtMe.length)return null;
              const filtTotal=filtMe.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
              return(
                <MonthGroup key={key} monthKey={key} label={label} badge={tf("{0} εγγρ.",filtMe.length)} total={cs(`-${fmt(filtTotal)}€`)} isOpen={!!openExpM[key]} onToggle={()=>setOpenExpM(p=>({...p,[key]:!p[key]}))} T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 12px",background:T.bg,borderBottom:`1px solid ${T.ft}`}}>
                    {Object.entries(byCategory).filter(([catId])=>expCatFilter==="all"||catId===expCatFilter).map(([catId,amt])=>{
                      const cat=EXPENSE_CATS.find(c=>c.id===catId);
                      return(
                        <div key={catId} style={{background:T.sf,borderRadius:8,padding:"4px 8px",fontSize:fz(11),display:"flex",alignItems:"center",gap:4}}>
                          <span>{cat&&cat.icon||"💸"}</span>
                          <span style={{color:T.mt}}>{cat&&t(cat.label)||catId}</span>
                          <span style={{fontWeight:"bold",color:"#e07b54"}}>{fmt(amt)}{cs("€")}</span>
                        </div>
                      );
                    })}
                  </div>
                  {filtMe.slice().reverse().map((e,i)=>(
                    <ExpenseEntryRow key={e.id} e={e} i={i} total={filtMe.length} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>
                  ))}
                </MonthGroup>
              );
            })}
          </div>
        )}

        {/* ══ STATS ══ */}
        {tab==="stats"&&(
          <div>
            <button onClick={()=>setShowYear(true)} style={{width:"100%",padding:12,marginBottom:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{t("🎉 Η χρονιά σου ·")} {av.icon} {av.name}</button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <select value={fY} onChange={e=>setFY(e.target.value)} style={IS}>
                <option value="all">{t("Όλα τα έτη")}</option>
                {availYears.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fM} onChange={e=>setFM(e.target.value)} style={IS}>
                <option value="all">{t("Όλοι οι μήνες")}</option>
                {MONTHS_SHORT.map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{t(m)}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{label:t("ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ"),v:fmt(stats.totalSpent)+cs("€"),color:YEL},{label:pt==="ev"?t("ΗΛΕΚΤΡΙΣΜΟΣ"):pt==="phev"?t("ΚΑΥΣΙΜΑ & ΡΕΥΜΑ"):t("ΚΑΥΣΙΜΑ"),v:fmt(stats.fuelSpent)+cs("€"),color:"#3b82f6"},{label:t("ΑΛΛΑ ΕΞΟΔΑ"),v:fmt(stats.expSpent)+cs("€"),color:"#e11d48"},...(pt!=="ev"?[{label:un.vol==="L"?t("ΣΥΝΟΛΟ ΛΙΤΡΩΝ"):t("ΣΥΝΟΛΟ ΓΑΛΟΝΙΩΝ"),v:fmt(stats.tL)+" "+volLabel("x",un),color:"#10b981"}]:[]),...(stats.tK>0?[{label:t("ΣΥΝΟΛΟ kWh"),v:fmt(stats.tK)+" kWh",color:"#06b6d4"}]:[])].map(({label,v,color})=>(
                <div key={label} style={CS()}><div style={{fontSize:fz(9),color:T.mt,marginBottom:3}}>{label}</div><div style={{fontSize:fz(18),fontWeight:"bold",color}}>{v}</div></div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
              <div style={{width:"100%",maxWidth:310,display:"flex",alignItems:"center",overflow:"visible"}}>
                <div onClick={()=>setGaugeDet(pt==="phev"?"eppl":"cons")} role="button" style={{flex:"0 0 55%",zIndex:2,cursor:"pointer",WebkitTapHighlightColor:"transparent",filter:"drop-shadow(3px 0 10px #10b98150)"}}>
                  {pt==="phev"
                    ?<RoundCyberGauge value={stats.aPE} min={gaugeRanges.eMin} max={gaugeRanges.eMax} color="#06b6d4" label={t("ΜΕΣΗ ΤΙΜΗ/kWh")} unit={cs("€/kWh")} dec={2} T={T}/>
                    :<RoundCyberGauge value={consVal(stats.aC,pt==="ev",un)} min={0} max={consMax(pt==="ev",un)} color="#10b981" label={t("ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ")} unit={cl} T={T}/>}
                </div>
                <div onClick={()=>setGaugeDet("ppl")} role="button" style={{flex:"0 0 55%",marginLeft:"-7%",zIndex:1,cursor:"pointer",WebkitTapHighlightColor:"transparent",filter:"drop-shadow(-3px 0 10px #f9731650)"}}>
                  <RoundCyberGauge value={stats.aP} min={gaugeRanges.pplMin} max={gaugeRanges.pplMax} color="#f97316" label={tf("ΜΕΣΗ ΤΙΜΗ/{0}",pu)} unit={cs(`€/${pu}`)} dec={pt==="ev"?2:1} T={T}/>
                </div>
              </div>
            </div>
            <div style={{fontSize:fz(10),color:T.mt,textAlign:"center",marginBottom:16}}>{t("👆 Πάτα ένα gauge για ιστορικό")}</div>
            {stats.totalKm>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{...CS(),textAlign:"center",padding:10}}><div style={{fontSize:fz(9),color:T.mt,marginBottom:4}}>{un.dist==="mi"?t("ΣΥΝΟΛΟ ΜΙΛΙΑ"):t("ΣΥΝΟΛΟ ΧΛΜ")}</div><div style={{fontSize:fz(15),fontWeight:"bold",color:"#06b6d4"}}>{stats.totalKm.toLocaleString()}</div><div style={{fontSize:fz(9),color:T.mt}}>{dl}</div></div>
                <div style={{...CS(),textAlign:"center",padding:10,border:`1px solid ${col}44`}}><div style={{fontSize:fz(9),color:T.mt,marginBottom:4}}>{tf("ΚΟΣΤΟΣ/{0}",dl.toUpperCase())}</div><div style={{fontSize:fz(15),fontWeight:"bold",color:col}}>{fmt(stats.costPerKm,3)}</div><div style={{fontSize:fz(9),color:T.mt}}>{tf("€/{0} (ολικό)",dl)}</div></div>
                <div style={{...CS(),textAlign:"center",padding:10}}><div style={{fontSize:fz(9),color:T.mt,marginBottom:4}}>{pt==="ev"?tf("ΡΕΥΜΑ/{0}",dl.toUpperCase()):tf("ΚΑΥΣΙΜΟ/{0}",dl.toUpperCase())}</div><div style={{fontSize:fz(15),fontWeight:"bold",color:"#3b82f6"}}>{fmt(stats.fuelCostPerKm,3)}</div><div style={{fontSize:fz(9),color:T.mt}}>{cs(`€/${dl}`)}</div></div>
              </div>
            )}
            <div style={{...CS(),marginBottom:14}}>
              <div style={{fontSize:fz(12),fontWeight:"bold",marginBottom:8,color:T.tx}}>{t("📊 Μηνιαία Έξοδα ·")} {fY!=="all"?fY:t("Όλα τα έτη")}</div>
              <StackedBarChart data={monthlyBarData} T={T} fuelLabel={pt==="ev"?t("Ηλεκτρισμός"):pt==="phev"?t("Καύσιμα & ρεύμα"):t("Καύσιμα")}/>
            </div>
            {consSeries.length>=2&&(
              <div style={{...CS(),marginBottom:14}}>
                <div style={{fontSize:fz(12),fontWeight:"bold",marginBottom:8,color:T.tx}}>{t("⛽ Κατανάλωση ανά γέμισμα ·")} {fY!=="all"?fY:t("Όλα τα έτη")}</div>
                <LineChart data={consSeries} color="#10b981" avg={consVal(stats.aC,pt==="ev",un)} T={T} unit={cl}/>
              </div>
            )}
            {allExp.length>0&&(
              <div style={CS()}>
                <div style={{fontSize:fz(12),fontWeight:"bold",marginBottom:4,color:T.tx}}>{t("🗂️ Κατανομή Εξόδων")}</div>
                <div style={{fontSize:fz(10),color:T.mt,marginBottom:10}}>{t("Σύνολο οχήματος ·")} {(expenses[vid]||[]).length} {t("εγγραφές · tap για ανάλυση")}</div>
                {EXPENSE_CATS.map(cat=>{
                  const catEntries=(expenses[vid]||[]).filter(e=>(e.category||"custom")===cat.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
                  const tot=catEntries.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
                  if(!tot)return null;
                  const grandTotal=(expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
                  const pct=grandTotal>0?(tot/grandTotal*100):0;
                  const isOpen=openCat===cat.id;
                  const byMonth={};
                  catEntries.forEach(e=>{
                    const d=pd(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                    const lbl=`${t(MONTHS_FULL[d.getMonth()])} ${d.getFullYear()}`;
                    if(!byMonth[k])byMonth[k]={lbl,entries:[],total:0};
                    byMonth[k].entries.push(e);byMonth[k].total+=(parseFloat(e.amount)||0);
                  });
                  const monthKeys=Object.keys(byMonth);
                  return(
                    <div key={cat.id} style={{marginBottom:10}}>
                      <div onClick={()=>setOpenCat(isOpen?null:cat.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,cursor:"pointer",padding:"6px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",minWidth:0}}>
                          <span style={{fontSize:fz(16)}}>{cat.icon}</span>
                          <span style={{fontSize:fz(13),fontWeight:"bold"}}>{t(cat.label)}</span>
                          <span style={{fontSize:fz(10),color:T.mt,background:T.br,padding:"1px 6px",borderRadius:8}}>{catEntries.length}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:fz(13),fontWeight:"bold"}}>{fmt(tot)}{cs("€")}</span>
                          <span style={{fontSize:fz(11),color:T.mt}}>({pct.toFixed(0)}%)</span>
                          <span style={{fontSize:fz(11),color:T.mt}}>{isOpen?"▲":"▼"}</span>
                        </div>
                      </div>
                      <div style={{background:T.br,borderRadius:4,height:7,overflow:"hidden",marginBottom:isOpen?8:0}}>
                        <div style={{background:col,width:`${pct}%`,height:7,borderRadius:4,transition:"width 0.5s ease"}}/>
                      </div>
                      {isOpen&&(
                        <div style={{background:T.bg,borderRadius:8,overflow:"hidden",border:`1px solid ${T.br}`}}>
                          {monthKeys.map((mk)=>{
                            const {lbl,entries:me,total:mt}=byMonth[mk];
                            const mKey=cat.id+"_"+mk;
                            const mOpen=!!openCatMonth[mKey];
                            return(
                              <div key={mk}>
                                <div onClick={()=>setOpenCatMonth(p=>({...p,[mKey]:!p[mKey]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:mOpen?T.br:T.ft,cursor:"pointer",borderBottom:`1px solid ${T.br}`}}>
                                  <span style={{fontSize:fz(11),fontWeight:"bold",color:T.tx}}>📅 {lbl} <span style={{color:T.mt,fontWeight:"normal"}}>({me.length})</span></span>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <span style={{fontSize:fz(11),fontWeight:"bold",color:col}}>-{fmt(mt)}{cs("€")}</span>
                                    <span style={{fontSize:fz(10),color:T.mt}}>{mOpen?"▲":"▼"}</span>
                                  </div>
                                </div>
                                {mOpen&&me.map((e,i)=>(
                                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 20px",background:i%2===0?T.bg:T.sf,borderBottom:i<me.length-1?`1px solid ${T.ft}`:"none"}}>
                                    <div>
                                      <div style={{fontSize:fz(12),fontWeight:"bold"}}>{dispLabel(e,cat)}</div>
                                      <div style={{fontSize:fz(10),color:T.mt}}>{formatDate(e.date)}</div>
                                    </div>
                                    <span style={{fontSize:fz(13),fontWeight:"bold",color:"#e11d48"}}>-{fmt(e.amount)}{cs("€")}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          <div style={{padding:"8px 12px",background:T.ft,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:fz(11),color:T.mt,fontWeight:"bold"}}>{t("ΣΥΝΟΛΟ")} {t(cat.label).toUpperCase()}</span>
                            <span style={{fontSize:fz(14),fontWeight:"bold",color:col}}>{fmt(tot)}{cs("€")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ΚΙΝΗΣΕΙΣ (unified history + calendar) ══ */}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{margin:0}}>{t("🧾 Κινήσεις")}</h3>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setMovView("list")} style={chipStyle(movView==="list")}>{t("📃 Λίστα")}</button>
                <button onClick={()=>setMovView("cal")} style={chipStyle(movView==="cal")}>{t("🗓️ Ημερολόγιο")}</button>
              </div>
            </div>

            <button onClick={()=>setNoteEdit({date:(movView==="cal"&&selDay)||today(),text:""})} style={{width:"100%",padding:11,marginBottom:12,background:"none",color:col,border:`2px dashed ${col}`,borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{t("📝 Νέα σημείωση")}</button>

            {movView==="list"&&(
              <div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
                  <button onClick={()=>setMovFilter("all")} style={chipStyle(movFilter==="all")}>{t("Όλα")}</button>
                  <button onClick={()=>setMovFilter("fuel")} style={chipStyle(movFilter==="fuel")}>{t("⛽ Καύσιμα")}</button>
                  <button onClick={()=>setMovFilter("exp")} style={chipStyle(movFilter==="exp")}>{t("📋 Έξοδα")}</button>
                  <button onClick={()=>setMovFilter("note")} style={chipStyle(movFilter==="note")}>{t("📝 Σημειώσεις")}</button>
                  <select value={histSort} onChange={e=>setHistSort(e.target.value)} style={{...IS,marginBottom:0,marginLeft:"auto",padding:"5px 8px",fontSize:fz(11),width:"auto"}}>
                    <option value="date_desc">{t("📅 Νεότερο")}</option><option value="date_asc">{t("📅 Παλαιότερο")}</option>
                  </select>
                </div>
                {movesByMonth.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>{t("Δεν υπάρχουν εγγραφές ακόμα.")}</div>}
                {movesByMonth.map(({key,label,items,nF,nE,nN,total})=>{
                  const isO=openFuelM[key]===undefined?key===curMonthKey:openFuelM[key];
                  const badge=[nF>0?`⛽ ${nF}`:null,nE>0?`📋 ${nE}`:null,nN>0?`📝 ${nN}`:null].filter(Boolean).join(" · ");
                  return(
                    <MonthGroup key={key} monthKey={key} label={label} badge={badge} total={total>0?cs(`${fmt(total)}€`):null} isOpen={isO} onToggle={()=>setOpenFuelM(p=>({...p,[key]:!isO}))} T={T}>
                      {items.map((it,i)=>(
                        <div key={it.e.id} style={{borderLeft:`4px solid ${it.kind==="fuel"?"#3b82f6":it.kind==="note"?YEL:"#e11d48"}`}}>
                          {it.kind==="fuel"
                            ?<FuelEntryRow un={un} e={it.e} i={i} total={items.length} allFuel={allFuel} T={T} col={col} swipeId={swipeId} setSwipeId={setSwipeId} swipeStartX={swipeStartX} onEdit={setEditFuelE} onDel={handleDelFuel}/>
                            :it.kind==="note"
                            ?<NoteEntryRow e={it.e} i={i} total={items.length} T={T} onEdit={setNoteEdit} onDel={handleDelNote}/>
                            :<ExpenseEntryRow e={it.e} i={i} total={items.length} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>}
                        </div>
                      ))}
                    </MonthGroup>
                  );
                })}
              </div>
            )}

            {movView==="cal"&&(()=>{
              const first=(new Date(calY,calM,1).getDay()+6)%7,nd=new Date(calY,calM+1,0).getDate();
              const cells=[];for(let i=0;i<first;i++)cells.push(null);for(let d=1;d<=nd;d++)cells.push(d);
              const mk=`${calY}-${String(calM+1).padStart(2,"0")}`;
              const dk=d=>`${mk}-${String(d).padStart(2,"0")}`;
              const shiftM=n=>{const d=new Date(calY,calM+n,1);setCalY(d.getFullYear());setCalM(d.getMonth());setSelDay(null);};
              let mTotal=0;
              for(let d=1;d<=nd;d++){const x=dayMap[dk(d)];if(x){mTotal+=x.f.reduce((s,e)=>s+(parseFloat(e.total)||0),0)+x.x.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);}}
              const sel=selDay?dayMap[selDay]:null;
              const selCount=sel?sel.f.length+sel.x.length+sel.n.length:0;
              return(
                <div>
                  <div style={{...CS(),marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <button onClick={()=>shiftM(-1)} style={{...chipStyle(false),fontSize:fz(16)}}>◀</button>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontWeight:"bold",fontSize:fz(15)}}>{t(MONTHS_FULL[calM])} {calY}</div>
                        <div style={{fontSize:fz(11),color:T.mt}}>{t("Σύνολο μήνα:")} <b style={{color:"#e07b54"}}>{fmt(mTotal)}{cs("€")}</b></div>
                      </div>
                      <button onClick={()=>shiftM(1)} style={{...chipStyle(false),fontSize:fz(16)}}>▶</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
                      {WEEKDAYS.map(w=><div key={w} style={{textAlign:"center",fontSize:fz(10),color:T.mt,fontWeight:"bold"}}>{t(w)}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                      {cells.map((d,i)=>{
                        if(d===null)return <div key={"e"+i}/>;
                        const k=dk(d),x=dayMap[k],isToday=k===today(),isSel=k===selDay;
                        const firstCat=x&&x.x.length?EXPENSE_CATS.find(c=>c.id===x.x[0].category):null;
                        return(
                          <div key={k} onClick={()=>setSelDay(isSel?null:k)} style={{aspectRatio:"1/1",borderRadius:8,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",paddingTop:3,boxSizing:"border-box",
                            background:isSel?col:x?T.bg:"transparent",border:`2px solid ${isToday?col:x?T.br:"transparent"}`}}>
                            <span style={{fontSize:fz(11),fontWeight:isToday?"bold":"normal",color:isSel?"#fff":T.tx}}>{d}</span>
                            <div style={{display:"flex",gap:1,fontSize:fz(11),lineHeight:1.1,marginTop:1}}>
                              {x&&x.f.length>0&&<span>⛽</span>}
                              {x&&x.x.length>0&&<span>{firstCat?firstCat.icon:"💸"}</span>}
                              {x&&x.n.length>0&&<span>📝</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:fz(10),color:T.mt,marginTop:8,textAlign:"center"}}>{t("⛽ γέμισμα · 📝 σημείωση · άλλα εικονίδια = έξοδο (service, διόδια κ.λπ.) · πάτα μια μέρα για λεπτομέρειες")}</div>
                  </div>
                  {selDay&&(
                    <div>
                      <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:8}}>📌 {formatDate(selDay)}</div>
                      {selCount===0&&<div style={{textAlign:"center",color:T.mt,padding:16,fontSize:fz(13)}}>{t("Καμία κίνηση αυτή τη μέρα.")}</div>}
                      {selCount>0&&(
                        <div style={{borderRadius:12,overflow:"hidden",border:`1px solid ${T.br}`}}>
                          {sel.f.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:"4px solid #3b82f6"}}>
                              <FuelEntryRow un={un} e={e} i={i} total={selCount} allFuel={allFuel} T={T} col={col} swipeId={swipeId} setSwipeId={setSwipeId} swipeStartX={swipeStartX} onEdit={setEditFuelE} onDel={handleDelFuel}/>
                            </div>
                          ))}
                          {sel.x.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:"4px solid #e11d48"}}>
                              <ExpenseEntryRow e={e} i={sel.f.length+i} total={selCount} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>
                            </div>
                          ))}
                          {sel.n.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:`4px solid ${YEL}`}}>
                              <NoteEntryRow e={e} i={sel.f.length+sel.x.length+i} total={selCount} T={T} onEdit={setNoteEdit} onDel={handleDelNote}/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ══ MODALS ══ */}

      {/* Interactive gauge details */}
      <Modal open={!!gaugeDet} onClose={()=>setGaugeDet(null)} title={gaugeInfo?gaugeInfo.title:""} T={T}>
        {gaugeInfo&&(
          <div>
            <div style={{fontSize:fz(12),color:T.mt,marginBottom:12}}>{av.icon} {av.name} · {fY!=="all"?fY:t("Όλα τα έτη")}{fM!=="all"?" · "+t(MONTHS_SHORT[+fM-1]):""} · <b style={{color:gaugeInfo.color}}>{gaugeInfo.unit}</b></div>
            {gaugeInfo.data.length===0?(
              <div style={{textAlign:"center",color:T.mt,padding:24,fontSize:fz(13),lineHeight:1.6}}>{gaugeDet==="cons"?t("Η κατανάλωση υπολογίζεται από 2 διαδοχικά γεμίσματα «μέχρι πάνω» (φουλ) με αυξανόμενο ODO."):t("Δεν υπάρχουν εγγραφές ακόμα.")}</div>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  {[[t("ΕΛΑΧΙΣΤΗ"),gaugeInfo.min,"#10b981"],[t("ΜΕΣΗ"),gaugeInfo.avg,gaugeInfo.color],[t("ΜΕΓΙΣΤΗ"),gaugeInfo.max,"#e11d48"],[t("ΤΕΛΕΥΤΑΙΑ"),gaugeInfo.last,col]].map(([l,v,c])=>(
                    <div key={l} style={CS({padding:10,textAlign:"center"})}>
                      <div style={{fontSize:fz(9),color:T.mt,marginBottom:3}}>{l}</div>
                      <div style={{fontSize:fz(18),fontWeight:"bold",color:c}}>{fmt(v,gaugeInfo.dec)}</div>
                      <div style={{fontSize:fz(9),color:T.mt}}>{gaugeInfo.unit}</div>
                    </div>
                  ))}
                </div>
                {gaugeInfo.data.length>=2?(
                  <div style={CS()}>
                    <LineChart data={gaugeInfo.data} color={gaugeInfo.color} avg={gaugeInfo.avg} T={T} unit={gaugeInfo.unit} h={130} dec={gaugeInfo.dec}/>
                  </div>
                ):(
                  <div style={{textAlign:"center",color:T.mt,fontSize:fz(12)}}>{t("Χρειάζονται τουλάχιστον 2 εγγραφές για γράφημα.")}</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showAddV} onClose={()=>setShowAddV(false)} locked={setupMode} title={setupMode?t("🚗 Καλώς ήρθες! Πρόσθεσε το όχημά σου"):t("➕ Νέο Όχημα")} T={T}>
        {setupMode&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",marginBottom:8}}>{t("ΓΛΩΣΣΑ / LANGUAGE")}</div>
            <LangPicker value={lang} onChange={setLang} T={T} color={newV.color}/>
            <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",margin:"12px 0 8px"}}>{t("ΝΟΜΙΣΜΑ")}</div>
            <select value={cur} onChange={e=>setCur(e.target.value)} style={IS}>{CURRENCIES.map(c=><option key={c.id} value={c.id}>{c.sym} · {c.id}</option>)}</select>
          </div>
        )}
        <input type="text" placeholder={t("Όνομα (π.χ. ΕΤΑΙΡΙΚΟ)")} value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} style={IS}/>
        <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("ΚΑΤΗΓΟΡΙΑ")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{VCATS.map(c=><button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:fz(13),background:newV.category===c.id?col:T.br,color:newV.category===c.id?"#fff":T.mt}}>{c.icon} {t(c.label)}</button>)}</div>
        <input type="text" placeholder={t("Αρ. Πινακίδας")} value={newV.info.plate} onChange={e=>setNewV({...newV,info:{...newV.info,plate:e.target.value}})} style={IS}/>
        <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("ΤΥΠΟΣ ΚΙΝΗΤΗΡΑ")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{POWERTRAINS.map(p=><button key={p.id} onClick={()=>setNewV(applyPT(newV,p.id))} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:fz(13),background:(newV.powertrain||"ice")===p.id?newV.color:T.br,color:(newV.powertrain||"ice")===p.id?"#fff":T.mt}}>{p.icon} {t(p.label)}</button>)}</div>
        {newV.powertrain==="hybrid"&&<div style={{fontSize:fz(11),color:T.mt,margin:"-6px 0 12px"}}>{t("ℹ️ Το αυτοφορτιζόμενο δεν αγοράζει ρεύμα, οπότε καταγράφεται μόνο με καύσιμο. Αν φορτίζεις από πρίζα, διάλεξε «Plug-in».")}</div>}
        {(newV.powertrain||"ice")==="ev"?(
          <div style={{fontSize:fz(12),color:T.mt,marginBottom:14}}>{t("⚡ Ενέργεια: Ηλεκτρισμός (kWh)")}</div>
        ):(
          <div>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:6}}>{t("ΚΥΡΙΟ ΚΑΥΣΙΜΟ (υποχρεωτικό)")}{newV.powertrain==="phev"?t(" · το ρεύμα προστίθεται αυτόματα"):""}</div>
            <select value={newV.fuelType} onChange={e=>setNewV({...newV,fuelType:e.target.value})} style={IS}><option value="">{t("— Επίλεξε καύσιμο —")}</option>{fuelsForPT(newV.powertrain||"ice").map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
            {newV.powertrain!=="phev"&&(
              <div>
                <div style={{fontSize:fz(11),color:T.mt,marginBottom:6}}>{t("2ο ΚΑΥΣΙΜΟ")}</div>
                <select value={newV.fuelType2} onChange={e=>setNewV({...newV,fuelType2:e.target.value})} style={IS}><option value="">{t("— Κανένα —")}</option>{fuelsForPT(newV.powertrain||"ice").map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
              </div>
            )}
          </div>
        )}
        <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("ΜΟΝΑΔΕΣ")}</div>
        <UnitsPicker value={newV.units} onChange={u=>setNewV({...newV,units:u})} T={T} color={newV.color} ev={newV.powertrain==="ev"}/>
        <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("ΧΡΩΜΑ")}</div>
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>{FUEL_COLORS.map(c=><div key={c} onClick={()=>setNewV({...newV,color:c})} style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:newV.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}</div>
        <button onClick={handleAddVehicle} disabled={!newV.fuelType} style={{opacity:newV.fuelType?1:0.4,width:"100%",padding:14,background:newV.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("ΠΡΟΣΘΗΚΗ ΟΧΗΜΑΤΟΣ")}</button>
      </Modal>

      <Modal open={showVInfo} onClose={()=>setShowVInfo(false)} title={tf("{0} {1} · Αρχείο αυτοκινήτου",av.icon,av.name)} T={T}>
        {VINFO_FIELDS.filter(x=>(!x.only||x.only.includes(pt))&&(!x.not||!x.not.includes(pt))).map(({f,label,type,ph,opts})=>(
          <div key={f} style={{marginBottom:12}}>
            <div style={{fontSize:fz(10),color:T.mt,marginBottom:3,fontWeight:"bold"}}>{(un.dist==="mi"?t(label).replace(/χλμ|km|км/g,"mi"):t(label)).toUpperCase()}</div>
            {type==="select"
              ?<select value={(av.info||{})[f]||""} onChange={e=>updateVInfo(f,e.target.value)} style={{...IS,marginBottom:0}}><option value="">{t("— Επίλεξε —")}</option>{opts.map(o=><option key={o.id} value={o.id}>{t(o.label)}</option>)}</select>
              :<input type={type} placeholder={t(ph)} max={PAST_FIELDS.includes(f)?today():undefined} value={(av.info||{})[f]||""} onChange={e=>updateVInfo(f,e.target.value)} style={{...IS,marginBottom:0}}/>}
          </div>
        ))}
        <button onClick={()=>setShowVInfo(false)} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer",marginTop:8}}>{t("✅ Αποθήκευση & Κλείσιμο")}</button>
      </Modal>

      <Modal open={showIO} onClose={()=>setShowIO(false)} title={t("💾 Εισαγωγή / Εξαγωγή")} T={T}>
        <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:10}}>{t("Εξαγωγή Δεδομένων")}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={exportJSON} style={{padding:12,background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:fz(13)}}>⬇️ JSON</button>
          <button onClick={exportCSV} style={{padding:12,background:"#10b981",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:fz(13)}}>⬇️ CSV</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <button onClick={exportExcel} style={{padding:12,background:"#22c55e",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:fz(13)}}>📊 Excel (.xls)</button>
          <button onClick={exportPDF} style={{padding:12,background:"#e11d48",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:fz(13)}}>📄 PDF</button>
        </div>
        <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:8}}>{t("Εισαγωγή (JSON)")}</div>
        <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{...IS,marginBottom:10}}/>
        <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder={t("Ή επικόλλησε JSON εδώ…")} rows={4} style={{...IS,resize:"vertical",fontFamily:"monospace",fontSize:fz(12)}}/>
        {importMsg&&<div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:fz(13),fontWeight:"bold",background:importMsg.startsWith("✅")?"#0d2010":"#2a0a0a",color:importMsg.startsWith("✅")?"#10b981":"#ef4444"}}>{importMsg}</div>}
        <button onClick={handleMergeImport} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer",marginBottom:8}}>{t("🔀 Συγχώνευση με τα υπάρχοντα")}</button>
        <button onClick={handleImport} style={{width:"100%",padding:11,background:"none",color:T.mt,border:`1px solid ${T.br}`,borderRadius:10,fontWeight:"bold",fontSize:fz(13),cursor:"pointer"}}>{t("⬆️ Αντικατάσταση όλων")}</button>
        <div style={{fontSize:fz(10),color:T.mt,marginTop:8,textAlign:"center"}}>{t("🔀 Η συγχώνευση κρατά ό,τι υπάρχει, προσθέτει ό,τι λείπει και προσπερνά τις διπλοεγγραφές (ίδια ημερομηνία, είδος, ποσό). Η αντικατάσταση σβήνει τα τωρινά δεδομένα.")}</div>
        <div style={{borderTop:`1px solid ${T.br}`,marginTop:18,paddingTop:14}}>
          <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:6}}>{t("Εισαγωγή από Fuelio (CSV)")}</div>
          <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("Προσθέτει νέο όχημα με τα γεμίσματα και τα έξοδά του. Δεν αντικαθιστά τα υπάρχοντα δεδομένα.")}</div>
          <input type="file" accept=".csv,text/csv" onChange={handleFuelioFile} style={IS}/>
          {fuelioMsg&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:fz(13),fontWeight:"bold",background:fuelioMsg.startsWith("✅")?"#0d2010":"#2a0a0a",color:fuelioMsg.startsWith("✅")?"#10b981":"#ef4444"}}>{fuelioMsg}</div>}
        </div>
        <div style={{borderTop:`1px solid ${T.br}`,marginTop:18,paddingTop:14}}>
          <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:6}}>{t("Εισαγωγή από άλλη εφαρμογή (CSV)")}</div>
          <div style={{fontSize:fz(11),color:T.mt,marginBottom:8}}>{t("Για οποιαδήποτε εφαρμογή ή Excel που εξάγει CSV. Οι στήλες αναγνωρίζονται αυτόματα και μπορείς να τις διορθώσεις πριν την εισαγωγή.")}</div>
          <input type="file" accept=".csv,.txt,text/csv" onChange={handleCsvFile} style={IS}/>
          {csvImp&&(
            <div style={{...CS(),marginBottom:10}}>
              <input type="text" value={csvImp.name} onChange={e=>setCsvImp({...csvImp,name:e.target.value})} placeholder={t("Όνομα οχήματος")} style={IS}/>
              {CSV_FIELDS.map(([k,label])=>(
                <div key={k} style={{marginBottom:8}}>
                  <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",marginBottom:3}}>{t(label).toUpperCase()}</div>
                  <select value={csvImp.map[k]} onChange={e=>setCsvImp({...csvImp,map:{...csvImp.map,[k]:+e.target.value}})} style={{...IS,marginBottom:0}}>
                    <option value={-1}>{t("— Δεν υπάρχει —")}</option>
                    {csvImp.headers.map((h,i)=><option key={i} value={i}>{h||"#"+(i+1)}</option>)}
                  </select>
                  {csvImp.map[k]>=0&&<div style={{fontSize:fz(10),color:T.mt,marginTop:2}}>{t("π.χ.")} {String((csvImp.rows[0]||[])[csvImp.map[k]]||"").slice(0,40)}</div>}
                </div>
              ))}
              <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",margin:"10px 0 3px"}}>{t("ΚΑΥΣΙΜΟ")}</div>
              <select value={csvImp.fuelType} onChange={e=>setCsvImp({...csvImp,fuelType:e.target.value})} style={IS}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
              <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",marginBottom:3}}>{t("ΜΟΡΦΗ ΗΜΕΡΟΜΗΝΙΑΣ")}</div>
              <select value={csvImp.dfmt} onChange={e=>setCsvImp({...csvImp,dfmt:e.target.value})} style={IS}>
                <option value="dd">{t("ΗΗ/ΜΜ/ΕΕΕΕ")}</option><option value="mm">{t("ΜΜ/ΗΗ/ΕΕΕΕ")}</option>
              </select>
              <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",marginBottom:6}}>{t("ΜΟΝΑΔΕΣ ΤΩΝ ΔΕΔΟΜΕΝΩΝ")}</div>
              <UnitsPicker value={csvImp.units} onChange={u=>setCsvImp({...csvImp,units:u})} T={T} color={col} ev={csvImp.fuelType==="electric"}/>
              <button onClick={doCsvImport} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{t("⬆️ Εισαγωγή οχήματος")}</button>
            </div>
          )}
          {csvMsg&&<div style={{padding:"8px 12px",borderRadius:8,fontSize:fz(13),fontWeight:"bold",background:csvMsg.startsWith("✅")?"#0d2010":"#2a0a0a",color:csvMsg.startsWith("✅")?"#10b981":"#ef4444"}}>{csvMsg}</div>}
        </div>
      </Modal>

      {/* Parking */}
      <Modal open={showPark} onClose={()=>setShowPark(false)} title={tf("🅿️ Πού παρκάρισα · {0} {1}",av.icon,av.name)} T={T}>
        {av.parking?(
          <div>
            <div style={{fontSize:fz(13),marginBottom:12}}>{t("📍 Αποθηκεύτηκε")} {new Date(av.parking.ts).toLocaleString(LANG,{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})} <span style={{fontSize:fz(11),color:T.mt}}>(±{av.parking.acc} m)</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${av.parking.lat},${av.parking.lng}&travelmode=walking`} target="_blank" rel="noreferrer" style={{padding:12,background:col,color:"#fff",borderRadius:10,fontWeight:"bold",fontSize:fz(13),textAlign:"center",textDecoration:"none"}}>{t("🧭 Οδηγίες")}</a>
              <a href={`https://www.openstreetmap.org/?mlat=${av.parking.lat}&mlon=${av.parking.lng}#map=18/${av.parking.lat}/${av.parking.lng}`} target="_blank" rel="noreferrer" style={{padding:12,background:T.br,color:T.tx,borderRadius:10,fontWeight:"bold",fontSize:fz(13),textAlign:"center",textDecoration:"none"}}>{t("🗺️ Χάρτης")}</a>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={saveParking} style={{padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(12),cursor:"pointer"}}>{t("📍 Νέα θέση")}</button>
              <button onClick={clearParking} style={{padding:11,background:"none",color:"#e11d48",border:"1px solid #e11d48",borderRadius:10,fontWeight:"bold",fontSize:fz(12),cursor:"pointer"}}>{t("✕ Φεύγω")}</button>
            </div>
          </div>
        ):(
          <button onClick={saveParking} style={{width:"100%",padding:15,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("📍 Πάρκαρα εδώ")}</button>
        )}
        {parkMsg&&<div style={{fontSize:fz(12),color:T.mt,marginTop:10}}>{parkMsg}</div>}
      </Modal>

      {/* Yearly review */}
      <Modal open={showYear} onClose={()=>setShowYear(false)} title={tf("🎉 Η χρονιά σου · {0} {1}",av.icon,av.name)} T={T}>
        <select value={yearSel} onChange={e=>setYearSel(e.target.value)} style={IS}>{availYears.map(y=><option key={y} value={y}>{y}</option>)}</select>
        {yearReview.nF+yearReview.nE===0?(
          <div style={{textAlign:"center",color:T.mt,padding:20}}>{t("Δεν υπάρχουν κινήσεις για")} {yearSel}.</div>
        ):(
          <div>
            <div style={{...CS({border:`2px solid ${col}`}),textAlign:"center",marginBottom:10}}>
              <div style={{fontSize:fz(11),color:T.mt}}>{t("ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ")} {yearSel}</div>
              <div style={{fontSize:fz(32),fontWeight:"bold",color:YEL}}>{fmt(yearReview.total)}{cs("€")}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[
                {l:pt==="ev"?t("⚡ ΦΟΡΤΙΣΕΙΣ"):t("⛽ ΓΕΜΙΣΜΑΤΑ"),v:yearReview.nF,c:"#3b82f6"},
                ...(pt!=="ev"?[{l:un.vol==="L"?t("🛢️ ΛΙΤΡΑ"):t("🛢️ ΓΑΛΟΝΙΑ"),v:fmt(yearReview.liters,1)+" "+volLabel("x",un),c:"#10b981"}]:[]),
                ...(yearReview.kwh>0?[{l:"⚡ kWh",v:fmt(yearReview.kwh,1)+" kWh",c:"#06b6d4"}]:[]),
                {l:pt==="ev"?t("ΗΛΕΚΤΡΙΣΜΟΣ"):t("ΚΑΥΣΙΜΑ"),v:fmt(yearReview.fuelSpent)+cs("€"),c:"#3b82f6"},
                {l:t("ΑΛΛΑ ΕΞΟΔΑ"),v:fmt(yearReview.expSpent)+cs("€"),c:"#e11d48"},
                {l:un.dist==="mi"?t("📍 ΜΙΛΙΑ"):t("📍 ΧΙΛΙΟΜΕΤΡΑ"),v:yearReview.km>0?yearReview.km.toLocaleString()+" "+dl:"—",c:"#06b6d4"},
                {l:t("ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ"),v:yearReview.avgCons>0?fmt(consVal(yearReview.avgCons,pt==="ev",un),1)+" "+cl:"—",c:"#10b981"},
                {l:t("ΜΕΣΗ ΤΙΜΗ"),v:yearReview.avgPpl>0?fmt(yearReview.avgPpl,3)+cs(` €/${pu}`):"—",c:"#f97316"},
                {l:tf("ΚΟΣΤΟΣ/{0}",dl.toUpperCase()),v:yearReview.costPerKm>0?fmt(yearReview.costPerKm,3)+cs(" €"):"—",c:col},
              ].map(({l,v,c})=><div key={l} style={CS({padding:10})}><div style={{fontSize:fz(9),color:T.mt,marginBottom:3}}>{l}</div><div style={{fontSize:fz(16),fontWeight:"bold",color:c}}>{v}</div></div>)}
            </div>
            <div style={{...CS(),fontSize:fz(12),lineHeight:1.9}}>
              {yearReview.priciest&&<div>{t("💸 Ακριβότερο γέμισμα:")} <b>{fmt(yearReview.priciest.total)}{cs("€")}</b> · {formatDate(yearReview.priciest.date)}</div>}
              {yearReview.cheapest&&<div>{t("🏷️ Φθηνότερη τιμή:")} <b>{fmt(yearReview.cheapest.ppl,3)} {cs("€/")}{pu}</b> · {formatDate(yearReview.cheapest.date)}</div>}
              {yearReview.topCat&&(()=>{const c=EXPENSE_CATS.find(k=>k.id===yearReview.topCat[0]);return <div>{t("🏆 Μεγαλύτερο έξοδο:")} <b>{c?`${c.icon} ${t(c.label)}`:yearReview.topCat[0]}</b> ({fmt(yearReview.topCat[1])}{cs("€)")}</div>;})()}
              {yearReview.topM&&<div>{t("📅 Ακριβότερος μήνας:")} <b>{t(MONTHS_FULL[yearReview.topM[0]])}</b> ({fmt(yearReview.topM[1])}{cs("€)")}</div>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editFuelE} onClose={()=>setEditFuelE(null)} title={t("✏️ Επεξεργασία Γεμίσματος")} T={T}>
        {editFuelE&&(
          <div>
            <input type="date" max={today()} value={editFuelE.date} onChange={e=>setEditFuelE({...editFuelE,date:e.target.value>today()?today():e.target.value})} style={IS}/>
            <select value={editFuelE.fuelType} onChange={e=>setEditFuelE({...editFuelE,fuelType:e.target.value})} style={IS}>{editFuelOpts.map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
            <input type="number" step="0.001" placeholder={cs(`${t("Τιμή")} €/${volLabel(editFuelE.fuelType,un)}`)} value={editFuelE.ppl} onChange={e=>setEditFuelE({...editFuelE,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder={t("Συνολικό Ποσό €")} value={editFuelE.total} onChange={e=>setEditFuelE({...editFuelE,total:e.target.value})} style={IS}/>
            {parseFloat(editFuelE.ppl)>0&&parseFloat(editFuelE.total)>0&&<div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:fz(13),fontWeight:"bold"}}>🧮 {+(parseFloat(editFuelE.total)/parseFloat(editFuelE.ppl)).toFixed(2)} {volLabel(editFuelE.fuelType,un)}</div>}
            <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:10,borderRadius:8,background:T.inp,border:`2px solid ${col}`,cursor:"pointer",fontSize:fz(13),color:T.tx}}>
              <input type="checkbox" checked={editFuelE.full!==false} onChange={e=>setEditFuelE({...editFuelE,full:e.target.checked})} style={{width:20,height:20,accentColor:col}}/>
              <span>{editFuelE.fuelType==="electric"?t("🔋 Φόρτιση μέχρι πάνω"):t("⛽ Γέμισμα μέχρι πάνω (φουλ)")}</span>
            </label>
            <input type="number" placeholder="Odometer" value={editFuelE.odo||""} onChange={e=>setEditFuelE({...editFuelE,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder={t("Σημειώσεις")} value={editFuelE.notes||""} onChange={e=>setEditFuelE({...editFuelE,notes:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditFuel} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("ΑΠΟΘΗΚΕΥΣΗ")}</button>
          </div>
        )}
      </Modal>

      <Modal open={!!editExpE} onClose={()=>setEditExpE(null)} title={t("✏️ Επεξεργασία Εξόδου")} T={T}>
        {editExpE&&(
          <div>
            <input type="date" max={today()} value={editExpE.date} onChange={e=>setEditExpE({...editExpE,date:e.target.value>today()?today():e.target.value})} style={IS}/>
            <select value={editExpE.category} onChange={e=>setEditExpE({...editExpE,category:e.target.value})} style={IS}>{EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {t(c.label)}</option>)}</select>
            <input type="text" placeholder={t("Τοποθεσία / Περιγραφή")} value={editExpE.label||""} onChange={e=>setEditExpE({...editExpE,label:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder={t("Ποσό €")} value={editExpE.amount} onChange={e=>setEditExpE({...editExpE,amount:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditExp} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("ΑΠΟΘΗΚΕΥΣΗ")}</button>
          </div>
        )}
      </Modal>

      {doneRem&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setDoneRem(null);}}>
          <div style={{background:T.sf,border:"2px solid #10b981",borderRadius:18,padding:"22px 18px 18px",width:"100%",maxWidth:340,textAlign:"center"}}>
            <div style={{fontSize:fz(36),marginBottom:4}}>{doneRem.icon}</div>
            <div style={{fontSize:fz(16),fontWeight:"bold",marginBottom:2}}>{t("✅ Έγινε:")} {t(doneRem.label)}</div>
            <div style={{fontSize:fz(12),color:T.mt,marginBottom:14}}>{doneRem.vIcon} {doneRem.vName}</div>
            <div style={{fontSize:fz(10),color:T.mt,fontWeight:"bold",marginBottom:4,textAlign:"left"}}>{doneRem.isKm?tf("ΝΕΟ ΟΡΙΟ ΕΠΟΜΕΝΟΥ SERVICE ({0})",String(doneRem.dl).toUpperCase()):t("ΝΕΑ ΗΜΕΡΟΜΗΝΙΑ")}</div>
            <input type={doneRem.isKm?"number":"date"} placeholder={doneRem.isKm?t("π.χ. 165000"):""} value={doneRem.value} onChange={e=>setDoneRem({...doneRem,value:e.target.value})} style={{...IS,marginBottom:6}}/>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:14,textAlign:"left"}}>{t("Άφησέ το κενό αν δεν θες νέα υπενθύμιση. Η τωρινή θα σβηστεί.")}</div>
            <button onClick={saveDoneRem} style={{width:"100%",padding:13,background:"#10b981",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer",marginBottom:10}}>{t("✅ Αποθήκευση")}</button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setDoneRem(null)} style={{padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(13),cursor:"pointer"}}>{t("Ακύρωση")}</button>
              <button onClick={()=>{setVid(doneRem.vid);setShowVInfo(true);setDoneRem(null);}} style={{padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(13),cursor:"pointer"}}>{t("🗂️ Αρχείο")}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setConfirmDel(null);}}>
          <div style={{background:T.sf,border:`2px solid ${confirmDel.info?col:"#e11d48"}`,borderRadius:18,padding:"22px 18px 18px",width:"100%",maxWidth:340,textAlign:"center"}}>
            {confirmDel.info?(
              <div>
                <div style={{fontSize:fz(36),marginBottom:8}}>ℹ️</div>
                <div style={{fontSize:fz(15),fontWeight:"bold",marginBottom:16}}>{confirmDel.title}</div>
                <button onClick={()=>setConfirmDel(null)} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("ΟΚ")}</button>
              </div>
            ):(
              <div>
                <div style={{fontSize:fz(40),marginBottom:6}}>{confirmDel.icon||"🗑️"}</div>
                <div style={{fontSize:fz(17),fontWeight:"bold",marginBottom:8}}>{confirmDel.question||t("Είσαι σίγουρος για τη διαγραφή;")}</div>
                <div style={{fontSize:fz(13),fontWeight:"bold",marginBottom:4}}>{confirmDel.title}</div>
                {confirmDel.detail&&<div style={{fontSize:fz(12),color:T.mt,marginBottom:8,wordBreak:"break-word"}}>{confirmDel.detail}</div>}
                <div style={{fontSize:fz(12),color:"#e11d48",fontWeight:"bold",marginBottom:16}}>{confirmDel.note===undefined?t("Δεν μπορεί να αναιρεθεί."):confirmDel.note}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>setConfirmDel(null)} style={{padding:13,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{t("Ακύρωση")}</button>
                  <button onClick={()=>{const f=confirmDel.fn;setConfirmDel(null);if(f)f();}} style={{padding:13,background:"#e11d48",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{confirmDel.ok||t("Διαγραφή")}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={!!noteEdit} onClose={()=>setNoteEdit(null)} title={noteEdit&&noteEdit.id?t("✏️ Επεξεργασία Σημείωσης"):t("📝 Νέα Σημείωση")} T={T}>
        {noteEdit&&(
          <div>
            <input type="date" value={noteEdit.date} onChange={e=>setNoteEdit({...noteEdit,date:e.target.value})} style={IS}/>
            <textarea rows={6} placeholder={t("Γράψε ό,τι θέλεις να θυμάσαι (π.χ. θόρυβος στα φρένα, ξέχασα να ελέγξω τα λάδια…)")} value={noteEdit.text} onChange={e=>setNoteEdit({...noteEdit,text:e.target.value})} style={{...IS,resize:"vertical",fontFamily:"inherit"}}/>
            <button onClick={handleSaveNote} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer"}}>{t("ΑΠΟΘΗΚΕΥΣΗ")}</button>
          </div>
        )}
      </Modal>

      <Modal open={showAbout} onClose={()=>setShowAbout(false)} title={t("ℹ️ Σχετικά και ρυθμίσεις")} T={T}>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",marginBottom:8}}>{t("ΜΕΓΕΘΟΣ ΓΡΑΜΜΑΤΩΝ")}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[[t("Μικρά"),0],[t("Κανονικά"),1],[t("Μεγάλα"),2]].map(([l,n])=><button key={n} onClick={()=>setFsLvl(n)} style={chipStyle(fsLvl===n)}>{l}</button>)}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",marginBottom:8}}>{t("ΓΛΩΣΣΑ / LANGUAGE")}</div>
          <LangPicker value={lang} onChange={setLang} T={T} color={col}/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",marginBottom:8}}>{t("ΝΟΜΙΣΜΑ")}</div>
          <select value={cur} onChange={e=>setCur(e.target.value)} style={{...IS,marginBottom:4}}>{CURRENCIES.map(c=><option key={c.id} value={c.id}>{c.sym} · {c.id}</option>)}</select>
          <div style={{fontSize:fz(10),color:T.mt}}>{t("Αλλάζει μόνο το σύμβολο· τα ποσά δεν μετατρέπονται.")}</div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:fz(11),color:T.mt,fontWeight:"bold",marginBottom:8}}>{t("ΜΟΝΑΔΕΣ ΓΙΑ ΝΕΑ ΟΧΗΜΑΤΑ")}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["metric",t("Μετρικό (χλμ · L)")],["us",t("ΗΠΑ (mi · gal)")],["uk",t("ΗΒ (mi · L)")]].map(([k,l])=><button key={k} onClick={()=>setDefUnits(k)} style={chipStyle(defUnits===k)}>{t(l)}</button>)}
          </div>
          <div style={{fontSize:fz(10),color:T.mt,marginTop:4}}>{t("Οι μονάδες κάθε οχήματος αλλάζουν από την επεξεργασία του (✏️).")}</div>
        </div>
        <div style={{...CS({marginBottom:12}),fontSize:fz(12),color:T.mt,lineHeight:1.6}}>{t("💾 Τα δεδομένα αποθηκεύονται μόνο σε αυτή τη συσκευή. Κάνε τακτικά αντίγραφο ασφαλείας από το κουμπί 💾 πάνω.")}</div>
<button onClick={()=>{setShowAbout(false);setShowWelcome(true);}} style={{...chipStyle(false),marginBottom:18}}>{t("👋 Δες ξανά την υποδοχή")}</button>
        <div style={{textAlign:"center",padding:"10px 0 20px"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Logo col={col} bg={T.sf} size={72}/></div>
          <div style={{fontSize:fz(22),fontWeight:"bold",marginBottom:4}}>FuelLog</div>
          <div style={{fontSize:fz(14),color:col,marginBottom:20}}>v{APP_VER}</div>
          <div style={{fontSize:fz(13),color:T.mt,lineHeight:1.9,marginBottom:20,textAlign:"left"}}>{t("⛽ Γεμίσματα καυσίμου με αυτόματο υπολογισμό λίτρων")}<br/>{t("🛣️ Διόδια, Πομποδέκτης, Parking, Service, Ελαστικά & άλλα έξοδα")}<br/>{t("🧾 Κινήσεις: ενιαίο ιστορικό & ημερολόγιο")}<br/>{t("📊 Στατιστικά, γραφήματα & ανάλυση κατανάλωσης")}<br/>{t("🎉 Ανασκόπηση χρονιάς ανά όχημα")}<br/>{t("🅿️ Πού παρκάρισα (GPS)")}<br/>{t("🚗 Υποστήριξη πολλαπλών οχημάτων & 2 καυσίμων")}<br/>{t("⚡ Βενζινοκίνητα, diesel, υβριδικά, plug-in & ηλεκτρικά")}<br/>{t("½ Μερικά γεμίσματα με σωστό υπολογισμό κατανάλωσης")}<br/>{t("🔔 Υπενθυμίσεις ΚΤΕΟ, ασφάλειας, service, διπλώματος")}<br/>{t("💾 Εξαγωγή σε JSON, CSV, Excel, PDF")}<br/>{t("📥 Εισαγωγή από Fuelio και από οποιαδήποτε εφαρμογή με CSV")}<br/>{t("🔀 Συγχώνευση αντιγράφων & έλεγχος διπλοεγγραφών στην εισαγωγή")}<br/>
          </div>
          <div style={{borderTop:`1px solid ${T.br}`,paddingTop:16}}>
            <div style={{fontSize:fz(12),color:T.mt,marginBottom:4}}>{t("Σχεδίαση & Ανάπτυξη")}</div>
            <div style={{fontSize:fz(18),fontWeight:"bold",color:col}}>{t("Ταχμαζίδης Κ. Γιώργος")}</div>
            <div style={{fontSize:fz(12),color:T.mt,marginTop:4}}>{t("© 2026 · Όλα τα δικαιώματα διατηρούνται")}</div>
            <div style={{fontSize:fz(13),marginTop:10}}>{t("Επικοινωνία")}: <a href={`mailto:fuellog.info@gmail.com?subject=FuelLog%20v${APP_VER}`} style={{color:col,fontWeight:"bold",textDecoration:"none"}}>fuellog.info@gmail.com</a></div>
          </div>
        </div>
      </Modal>

      <Modal open={showEditV&&!!editVData} onClose={()=>{setShowEditV(false);setEditVData(null);}} title={t("✏️ Επεξεργασία Οχήματος")} T={T}>
        {editVData&&(
          <div>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:6,fontWeight:"bold"}}>{t("ΟΝΟΜΑ")}</div>
            <input type="text" value={editVData.name} onChange={e=>setEditVData({...editVData,name:e.target.value})} style={IS}/>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:8,fontWeight:"bold"}}>{t("ΚΑΤΗΓΟΡΙΑ")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{VCATS.map(c=><button key={c.id} onClick={()=>setEditVData({...editVData,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:fz(13),background:editVData.category===c.id?editVData.color:T.br,color:editVData.category===c.id?"#fff":T.mt}}>{c.icon} {t(c.label)}</button>)}</div>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:8,fontWeight:"bold"}}>{t("ΤΥΠΟΣ ΚΙΝΗΤΗΡΑ")}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{POWERTRAINS.map(p=><button key={p.id} onClick={()=>setEditVData(applyPT(editVData,p.id))} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:fz(13),background:(editVData.powertrain||"ice")===p.id?editVData.color:T.br,color:(editVData.powertrain||"ice")===p.id?"#fff":T.mt}}>{p.icon} {t(p.label)}</button>)}</div>
            {editVData.powertrain==="hybrid"&&<div style={{fontSize:fz(11),color:T.mt,margin:"-6px 0 12px"}}>{t("ℹ️ Το αυτοφορτιζόμενο δεν αγοράζει ρεύμα, οπότε καταγράφεται μόνο με καύσιμο. Αν φορτίζεις από πρίζα, διάλεξε «Plug-in».")}</div>}
            {(editVData.powertrain||"ice")==="ev"?(
              <div style={{fontSize:fz(12),color:T.mt,marginBottom:14}}>{t("⚡ Ενέργεια: Ηλεκτρισμός (kWh)")}</div>
            ):(
              <div>
                <div style={{fontSize:fz(11),color:T.mt,marginBottom:6,fontWeight:"bold"}}>{t("ΚΥΡΙΟ ΚΑΥΣΙΜΟ")}{editVData.powertrain==="phev"?t(" · το ρεύμα προστίθεται αυτόματα"):""}</div>
                <select value={editVData.fuelType} onChange={e=>setEditVData({...editVData,fuelType:e.target.value})} style={IS}><option value="">{t("— Επίλεξε καύσιμο —")}</option>{fuelsForPT(editVData.powertrain||"ice").map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
                {editVData.powertrain!=="phev"&&(
                  <div>
                    <div style={{fontSize:fz(11),color:T.mt,marginBottom:6,fontWeight:"bold"}}>{t("2ο ΚΑΥΣΙΜΟ")}</div>
                    <select value={editVData.fuelType2||""} onChange={e=>setEditVData({...editVData,fuelType2:e.target.value})} style={IS}><option value="">{t("— Κανένα —")}</option>{fuelsForPT(editVData.powertrain||"ice").map(f=><option key={f.id} value={f.id}>{f.icon} {t(f.label)}</option>)}</select>
                  </div>
                )}
              </div>
            )}
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:8,fontWeight:"bold"}}>{t("ΜΟΝΑΔΕΣ")}</div>
            <UnitsPicker value={editVData.units} onChange={u=>setEditVData({...editVData,units:u})} T={T} color={editVData.color} ev={editVData.powertrain==="ev"}/>
            <div style={{fontSize:fz(10),color:T.mt,margin:"-6px 0 14px"}}>{t("Αν αλλάξεις μονάδες, οι υπάρχουσες εγγραφές μετατρέπονται αυτόματα.")}</div>
            <div style={{fontSize:fz(11),color:T.mt,marginBottom:8,fontWeight:"bold"}}>{t("ΧΡΩΜΑ")}</div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>{FUEL_COLORS.map(c=><div key={c} onClick={()=>setEditVData({...editVData,color:c})} style={{width:34,height:34,borderRadius:"50%",background:c,cursor:"pointer",border:editVData.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}</div>
            <button onClick={handleSaveEditV} style={{width:"100%",padding:14,background:editVData.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:fz(15),cursor:"pointer",marginBottom:10}}>{t("✅ Αποθήκευση")}</button>
            <button onClick={handleDeleteV} style={{width:"100%",padding:12,background:"none",color:"#e11d48",border:"2px solid #e11d48",borderRadius:10,fontWeight:"bold",fontSize:fz(14),cursor:"pointer"}}>{t("🗑️ Διαγραφή Οχήματος")}</button>
          </div>
        )}
      </Modal>

{showWelcome&&<Welcome T={T} col={col} lang={lang} setLang={setLang} onDone={()=>setShowWelcome(false)}/>}
      
    </div>
  );
}

// ========== TRANSLATIONS (el = κλειδιά) · en · de · fr · it · es · ru ==========
const I18N_ROWS=[
  ["ΙΧ", "Car", "Pkw", "Voiture", "Auto", "Coche", "Легковой"],
  ["Μηχανή", "Motorcycle", "Motorrad", "Moto", "Moto", "Moto", "Мотоцикл"],
  ["Βαν", "Van", "Transporter", "Fourgonnette", "Furgone", "Furgoneta", "Фургон"],
  ["Ελαφρύ Φορτηγό", "Light truck", "Leichter Lkw", "Camionnette", "Autocarro leggero", "Camión ligero", "Лёгкий грузовик"],
  ["Βαρύ Φορτηγό", "Heavy truck", "Schwerer Lkw", "Poids lourd", "Autocarro pesante", "Camión pesado", "Грузовик"],
  ["Λεωφορείο", "Bus", "Bus", "Autobus", "Autobus", "Autobús", "Автобус"],
  ["Βενζίνη", "Petrol", "Benzin", "Essence", "Benzina", "Gasolina", "Бензин"],
  ["Υγραέριο (LPG)", "LPG", "Autogas (LPG)", "GPL", "GPL", "GLP", "Автогаз (LPG)"],
  ["Φυσικό Αέριο", "Natural gas (CNG)", "Erdgas (CNG)", "Gaz naturel (GNV)", "Metano (CNG)", "Gas natural (GNC)", "Природный газ (CNG)"],
  ["Ηλεκτρισμός (kWh)", "Electricity (kWh)", "Strom (kWh)", "Électricité (kWh)", "Elettricità (kWh)", "Electricidad (kWh)", "Электричество (кВт·ч)"],
  ["Καύσιμο", "Fuel", "Kraftstoff", "Carburant", "Carburante", "Combustible", "Топливо"],
  ["Υβριδικό (αυτοφορτιζόμενο)", "Hybrid (self-charging)", "Hybrid (selbstladend)", "Hybride (autorechargeable)", "Ibrido (autoricaricabile)", "Híbrido (autorrecargable)", "Гибрид (без зарядки от сети)"],
  ["Plug-in υβριδικό (φορτίζει από πρίζα)", "Plug-in hybrid (charges from a socket)", "Plug-in-Hybrid (lädt an der Steckdose)", "Hybride rechargeable (se recharge sur prise)", "Ibrido plug-in (si ricarica dalla presa)", "Híbrido enchufable (se carga en enchufe)", "Плагин-гибрид (заряжается от розетки)"],
  ["Ηλεκτρικό", "Electric", "Elektro", "Électrique", "Elettrico", "Eléctrico", "Электро"],
  ["Χειροκίνητο", "Manual", "Schaltgetriebe", "Manuelle", "Manuale", "Manual", "Механика"],
  ["Αυτόματο", "Automatic", "Automatik", "Automatique", "Automatico", "Automático", "Автомат"],
  ["Διπλού συμπλέκτη (DCT)", "Dual-clutch (DCT)", "Doppelkupplung (DCT)", "Double embrayage (DCT)", "Doppia frizione (DCT)", "Doble embrague (DCT)", "Робот с двумя сцеплениями (DCT)"],
  ["Μονοταχές (EV)", "Single-speed (EV)", "Eingang-Getriebe (EV)", "Mono-rapport (VE)", "Monomarcia (EV)", "Una velocidad (VE)", "Одноступенчатая (EV)"],
  ["Εμπρός κίνηση (FWD)", "Front-wheel drive (FWD)", "Frontantrieb (FWD)", "Traction avant (FWD)", "Trazione anteriore (FWD)", "Tracción delantera (FWD)", "Передний привод (FWD)"],
  ["Πίσω κίνηση (RWD)", "Rear-wheel drive (RWD)", "Hinterradantrieb (RWD)", "Propulsion (RWD)", "Trazione posteriore (RWD)", "Tracción trasera (RWD)", "Задний привод (RWD)"],
  ["Τετρακίνηση μόνιμη (AWD)", "Permanent all-wheel drive (AWD)", "Permanenter Allradantrieb (AWD)", "Transmission intégrale permanente (AWD)", "Trazione integrale permanente (AWD)", "Tracción total permanente (AWD)", "Постоянный полный привод (AWD)"],
  ["4x4 επιλεγόμενη", "Selectable 4x4", "Zuschaltbarer 4x4", "4x4 enclenchable", "4x4 inseribile", "4x4 conectable", "Подключаемый 4x4"],
  ["Διόδια", "Tolls", "Maut", "Péages", "Pedaggi", "Peajes", "Платные дороги"],
  ["Πομποδέκτης Ε.Ο.", "Toll transponder", "Maut-Transponder", "Badge de télépéage", "Transponder pedaggio", "Dispositivo de peaje", "Транспондер"],
  ["Πλύσιμο", "Car wash", "Autowäsche", "Lavage", "Lavaggio", "Lavado", "Мойка"],
  ["Καθαρισμός", "Cleaning", "Reinigung", "Nettoyage", "Pulizia", "Limpieza", "Чистка"],
  ["Τζάμια", "Glass", "Scheiben", "Vitres", "Vetri", "Cristales", "Стёкла"],
  ["ΚΕΚ", "Emissions check", "Abgasuntersuchung", "Contrôle des émissions", "Controllo emissioni", "Control de emisiones", "Проверка выбросов"],
  ["ΚΤΕΟ", "Vehicle inspection", "Hauptuntersuchung", "Contrôle technique", "Revisione", "ITV", "Техосмотр"],
  ["Τέλη Κυκλοφορίας", "Road tax", "Kfz-Steuer", "Taxe automobile", "Bollo auto", "Impuesto de circulación", "Транспортный налог"],
  ["Ασφάλεια", "Insurance", "Versicherung", "Assurance", "Assicurazione", "Seguro", "Страховка"],
  ["Επισκευή", "Repair", "Reparatur", "Réparation", "Riparazione", "Reparación", "Ремонт"],
  ["Λάδια/Φίλτρα", "Oil/Filters", "Öl/Filter", "Huile/Filtres", "Olio/Filtri", "Aceite/Filtros", "Масло/Фильтры"],
  ["Ανταλλακτικά", "Spare parts", "Ersatzteile", "Pièces détachées", "Ricambi", "Repuestos", "Запчасти"],
  ["Μπαταρία", "Battery", "Batterie", "Batterie", "Batteria", "Batería", "Аккумулятор"],
  ["Ηλεκτρολογικά", "Electrical", "Elektrik", "Électrique", "Impianto elettrico", "Sistema eléctrico", "Электрика"],
  ["Ελαστικά", "Tyres", "Reifen", "Pneus", "Pneumatici", "Neumáticos", "Шины"],
  ["Ζυγοστάθμιση", "Wheel balancing", "Auswuchten", "Équilibrage", "Equilibratura", "Equilibrado", "Балансировка"],
  ["Πρόστιμο", "Fine", "Bußgeld", "Amende", "Multa", "Multa", "Штраф"],
  ["Άλλο", "Other", "Sonstiges", "Autre", "Altro", "Otro", "Прочее"],
  ["Ιανουάριος", "January", "Januar", "janvier", "gennaio", "enero", "январь"],
  ["Φεβρουάριος", "February", "Februar", "février", "febbraio", "febrero", "февраль"],
  ["Μάρτιος", "March", "März", "mars", "marzo", "marzo", "март"],
  ["Απρίλιος", "April", "April", "avril", "aprile", "abril", "апрель"],
  ["Μάιος", "May", "Mai", "mai", "maggio", "mayo", "май"],
  ["Ιούνιος", "June", "Juni", "juin", "giugno", "junio", "июнь"],
  ["Ιούλιος", "July", "Juli", "juillet", "luglio", "julio", "июль"],
  ["Αύγουστος", "August", "August", "août", "agosto", "agosto", "август"],
  ["Σεπτέμβριος", "September", "September", "septembre", "settembre", "septiembre", "сентябрь"],
  ["Οκτώβριος", "October", "Oktober", "octobre", "ottobre", "octubre", "октябрь"],
  ["Νοέμβριος", "November", "November", "novembre", "novembre", "noviembre", "ноябрь"],
  ["Δεκέμβριος", "December", "Dezember", "décembre", "dicembre", "diciembre", "декабрь"],
  ["Ιαν", "Jan", "Jan", "janv.", "gen", "ene", "янв"],
  ["Φεβ", "Feb", "Feb", "févr.", "feb", "feb", "фев"],
  ["Μαρ", "Mar", "Mär", "mars", "mar", "mar", "мар"],
  ["Απρ", "Apr", "Apr", "avr.", "apr", "abr", "апр"],
  ["Μαΐ", "May", "Mai", "mai", "mag", "may", "май"],
  ["Ιουν", "Jun", "Jun", "juin", "giu", "jun", "июн"],
  ["Ιουλ", "Jul", "Jul", "juil.", "lug", "jul", "июл"],
  ["Αυγ", "Aug", "Aug", "août", "ago", "ago", "авг"],
  ["Σεπ", "Sep", "Sep", "sept.", "set", "sep", "сен"],
  ["Οκτ", "Oct", "Okt", "oct.", "ott", "oct", "окт"],
  ["Νοε", "Nov", "Nov", "nov.", "nov", "nov", "ноя"],
  ["Δεκ", "Dec", "Dez", "déc.", "dic", "dic", "дек"],
  ["Δε", "Mo", "Mo", "Lu", "Lu", "Lu", "Пн"],
  ["Τρ", "Tu", "Di", "Ma", "Ma", "Ma", "Вт"],
  ["Τε", "We", "Mi", "Me", "Me", "Mi", "Ср"],
  ["Πε", "Th", "Do", "Je", "Gi", "Ju", "Чт"],
  ["Πα", "Fr", "Fr", "Ve", "Ve", "Vi", "Пт"],
  ["Σα", "Sa", "Sa", "Sa", "Sa", "Sá", "Сб"],
  ["Κυ", "Su", "So", "Di", "Do", "Do", "Вс"],
  ["Λήξη Ασφάλειας", "Insurance expiry", "Ablauf der Versicherung", "Échéance de l'assurance", "Scadenza assicurazione", "Vencimiento del seguro", "Срок страховки"],
  ["Αλλαγή Ελαστικών", "Tyre change", "Reifenwechsel", "Changement de pneus", "Cambio pneumatici", "Cambio de neumáticos", "Замена шин"],
  ["Επόμενο Service", "Next service", "Nächster Service", "Prochain entretien", "Prossimo tagliando", "Próxima revisión", "Следующее ТО"],
  ["Λήξη Διπλώματος", "Licence expiry", "Ablauf des Führerscheins", "Expiration du permis", "Scadenza patente", "Caducidad del carnet", "Срок действия прав"],
  ["Μάρκα", "Make", "Marke", "Marque", "Marca", "Marca", "Марка"],
  ["Μοντέλο", "Model", "Modell", "Modèle", "Modello", "Modelo", "Модель"],
  ["Έτος", "Year", "Baujahr", "Année", "Anno", "Año", "Год"],
  ["Κυβικά (cc)", "Engine size (cc)", "Hubraum (cm³)", "Cylindrée (cm³)", "Cilindrata (cc)", "Cilindrada (cc)", "Объём двигателя (см³)"],
  ["Κιβώτιο ταχυτήτων", "Gearbox", "Getriebe", "Boîte de vitesses", "Cambio", "Caja de cambios", "Коробка передач"],
  ["Κίνηση", "Drivetrain", "Antrieb", "Transmission", "Trazione", "Tracción", "Привод"],
  ["Μπαταρία (kWh)", "Battery (kWh)", "Batterie (kWh)", "Batterie (kWh)", "Batteria (kWh)", "Batería (kWh)", "Аккумулятор (кВт·ч)"],
  ["Αρ. Πινακίδας", "Licence plate", "Kennzeichen", "Plaque d'immatriculation", "Targa", "Matrícula", "Госномер"],
  ["ΑΒΓ-1234", "ABC-1234", "B-AB 1234", "AB-123-CD", "AB 123 CD", "1234 ABC", "А123ВС"],
  ["Αρ. Πλαισίου (VIN)", "Chassis no. (VIN)", "Fahrgestellnr. (VIN)", "N° de châssis (VIN)", "N. telaio (VIN)", "N.º de bastidor (VIN)", "VIN"],
  ["Αρ. Ασφαλιστηρίου", "Policy no.", "Versicherungsnr.", "N° de police", "N. polizza", "N.º de póliza", "№ полиса"],
  ["Επόμενο ΚΤΕΟ", "Next inspection", "Nächste HU", "Prochain contrôle technique", "Prossima revisione", "Próxima ITV", "Следующий техосмотр"],
  ["Επόμενο ΚΕΚ", "Next emissions check", "Nächste Abgasuntersuchung", "Prochain contrôle des émissions", "Prossimo controllo emissioni", "Próximo control de emisiones", "Следующая проверка выбросов"],
  ["Μάρκα Ελαστικών", "Tyre brand", "Reifenmarke", "Marque des pneus", "Marca pneumatici", "Marca de neumáticos", "Марка шин"],
  ["Διαστάσεις Ελαστικών", "Tyre size", "Reifengröße", "Dimensions des pneus", "Misura pneumatici", "Medida de neumáticos", "Размер шин"],
  ["Τελευταία Αλλαγή Ελαστ.", "Last tyre change", "Letzter Reifenwechsel", "Dernier changement de pneus", "Ultimo cambio pneumatici", "Último cambio de neumáticos", "Последняя замена шин"],
  ["Επόμενη Αλλαγή Ελαστ.", "Next tyre change", "Nächster Reifenwechsel", "Prochain changement de pneus", "Prossimo cambio pneumatici", "Próximo cambio de neumáticos", "Следующая замена шин"],
  ["Τελευταίο Service", "Last service", "Letzter Service", "Dernier entretien", "Ultimo tagliando", "Última revisión", "Последнее ТО"],
  ["Επόμενο Service (ημ.)", "Next service (date)", "Nächster Service (Datum)", "Prochain entretien (date)", "Prossimo tagliando (data)", "Próxima revisión (fecha)", "Следующее ТО (дата)"],
  ["Service στα (χλμ)", "Service at (km)", "Service bei (km)", "Entretien à (km)", "Tagliando a (km)", "Revisión a los (km)", "ТО на (км)"],
  ["Επόμενο Service (χλμ)", "Next service (km)", "Nächster Service (km)", "Prochain entretien (km)", "Prossimo tagliando (km)", "Próxima revisión (km)", "Следующее ТО (км)"],
  ["Σημ. Service", "Service notes", "Service-Notizen", "Notes d'entretien", "Note tagliando", "Notas de revisión", "Заметки по ТО"],
  ["Αλλαγή λαδιών…", "Oil change…", "Ölwechsel…", "Vidange…", "Cambio olio…", "Cambio de aceite…", "Замена масла…"],
  ["Ιξώδες Λαδιού", "Oil viscosity", "Ölviskosität", "Viscosité de l'huile", "Viscosità olio", "Viscosidad del aceite", "Вязкость масла"],
  ["Κύριος Οδηγός", "Main driver", "Hauptfahrer", "Conducteur principal", "Conducente principale", "Conductor principal", "Основной водитель"],
  ["Ονοματεπώνυμο", "Full name", "Vor- und Nachname", "Nom et prénom", "Nome e cognome", "Nombre y apellidos", "Фамилия и имя"],
  ["2ος Οδηγός", "2nd driver", "2. Fahrer", "2e conducteur", "2º conducente", "2.º conductor", "Второй водитель"],
  ["Αρ. Διπλώματος", "Licence no.", "Führerscheinnr.", "N° de permis", "N. patente", "N.º de carnet", "№ прав"],
  ["χλμ", "km", "km", "km", "km", "km", "км"],
  ["Ημερομηνία", "Date", "Datum", "Date", "Data", "Fecha", "Дата"],
  ["Χιλιόμετρα (ODO)", "Mileage (ODO)", "Kilometerstand (ODO)", "Kilométrage (ODO)", "Chilometraggio (ODO)", "Kilometraje (ODO)", "Пробег (ODO)"],
  ["Ποσότητα (λίτρα / γαλόνια / kWh)", "Quantity (litres / gallons / kWh)", "Menge (Liter / Gallonen / kWh)", "Quantité (litres / gallons / kWh)", "Quantità (litri / galloni / kWh)", "Cantidad (litros / galones / kWh)", "Количество (литры / галлоны / кВт·ч)"],
  ["Τιμή ανά μονάδα", "Price per unit", "Preis pro Einheit", "Prix à l'unité", "Prezzo per unità", "Precio por unidad", "Цена за единицу"],
  ["Συνολικό κόστος", "Total cost", "Gesamtkosten", "Coût total", "Costo totale", "Coste total", "Общая стоимость"],
  ["Γέμισμα μέχρι πάνω", "Filled to the top", "Vollgetankt", "Plein complet", "Pieno completo", "Depósito lleno", "Полный бак"],
  ["Σημειώσεις", "Notes", "Notizen", "Notes", "Note", "Notas", "Заметки"],
  ["Καύσιμα", "Fuel", "Kraftstoff", "Carburant", "Carburante", "Combustible", "Топливо"],
  ["🟥 Λοιπά έξοδα", "🟥 Other expenses", "🟥 Sonstige Kosten", "🟥 Autres dépenses", "🟥 Altre spese", "🟥 Otros gastos", "🟥 Прочие расходы"],
  ["· Σύνολο", "· Total", "· Gesamt", "· Total", "· Totale", "· Total", "· Итого"],
  ["Πάτα μια στήλη για λεπτομέρειες", "Tap a bar for details", "Balken antippen für Details", "Touchez une barre pour le détail", "Tocca una barra per i dettagli", "Toca una barra para ver detalles", "Нажмите на столбец для подробностей"],
  ["Μέση: {0} {1} (διακεκομμένη) · πάτα ένα σημείο", "Average: {0} {1} (dashed) · tap a point", "Durchschnitt: {0} {1} (gestrichelt) · Punkt antippen", "Moyenne : {0} {1} (pointillés) · touchez un point", "Media: {0} {1} (tratteggiata) · tocca un punto", "Media: {0} {1} (discontinua) · toca un punto", "Среднее: {0} {1} (пунктир) · нажмите на точку"],
  ["Μετρικό (χλμ · L)", "Metric (km · L)", "Metrisch (km · L)", "Métrique (km · L)", "Metrico (km · L)", "Métrico (km · L)", "Метрическая (км · л)"],
  ["ΗΠΑ (mi · gal)", "USA (mi · gal)", "USA (mi · gal)", "États-Unis (mi · gal)", "USA (mi · gal)", "EE. UU. (mi · gal)", "США (мили · гал)"],
  ["ΗΒ (mi · L)", "UK (mi · L)", "UK (mi · L)", "Royaume-Uni (mi · L)", "Regno Unito (mi · L)", "Reino Unido (mi · L)", "Великобритания (мили · л)"],
  ["ΜΟΝΑΔΑ ΚΑΤΑΝΑΛΩΣΗΣ", "CONSUMPTION UNIT", "VERBRAUCHSEINHEIT", "UNITÉ DE CONSOMMATION", "UNITÀ DI CONSUMO", "UNIDAD DE CONSUMO", "ЕДИНИЦА РАСХОДА"],
  ["½ μερικό", "½ partial", "½ Teilbetankung", "½ partiel", "½ parziale", "½ parcial", "½ частичная"],
  ["❌ Η συσκευή δεν υποστηρίζει GPS.", "❌ This device does not support GPS.", "❌ Dieses Gerät unterstützt kein GPS.", "❌ Cet appareil ne prend pas en charge le GPS.", "❌ Questo dispositivo non supporta il GPS.", "❌ Este dispositivo no admite GPS.", "❌ Это устройство не поддерживает GPS."],
  ["📡 Εντοπισμός θέσης…", "📡 Locating…", "📡 Standort wird ermittelt…", "📡 Localisation…", "📡 Localizzazione…", "📡 Localizando…", "📡 Определение местоположения…"],
  ["❌ Δεν δόθηκε άδεια τοποθεσίας. Επίτρεψέ την από τις ρυθμίσεις του browser ή της εφαρμογής για αυτό το site.", "❌ Location permission was not granted. Allow it in your browser or app settings for this site.", "❌ Standortberechtigung nicht erteilt. Erlaube sie in den Browser- oder App-Einstellungen für diese Seite.", "❌ Autorisation de localisation refusée. Autorisez-la dans les réglages du navigateur ou de l'appli pour ce site.", "❌ Autorizzazione alla posizione negata. Consentila nelle impostazioni del browser o dell'app per questo sito.", "❌ No se concedió el permiso de ubicación. Actívalo en los ajustes del navegador o de la app para este sitio.", "❌ Доступ к местоположению не предоставлен. Разрешите его в настройках браузера или приложения для этого сайта."],
  ["❌ Δεν βρέθηκε θέση. Άνοιξε το GPS και ξαναδοκίμασε.", "❌ Location not found. Turn on GPS and try again.", "❌ Standort nicht gefunden. GPS einschalten und erneut versuchen.", "❌ Position introuvable. Activez le GPS et réessayez.", "❌ Posizione non trovata. Attiva il GPS e riprova.", "❌ No se encontró la ubicación. Activa el GPS e inténtalo de nuevo.", "❌ Не удалось определить местоположение. Включите GPS и повторите."],
  ["Γέμισμα καυσίμου", "Fill-up", "Tankfüllung", "Plein de carburant", "Rifornimento", "Repostaje", "Заправка"],
  ["Έξοδο", "Expense", "Ausgabe", "Dépense", "Spesa", "Gasto", "Расход"],
  ["Σημείωση", "Note", "Notiz", "Note", "Nota", "Nota", "Заметка"],
  ["Δεν μπορείς να διαγράψεις το μοναδικό όχημα.", "You cannot delete your only vehicle.", "Du kannst dein einziges Fahrzeug nicht löschen.", "Vous ne pouvez pas supprimer votre seul véhicule.", "Non puoi eliminare l'unico veicolo.", "No puedes eliminar tu único vehículo.", "Нельзя удалить единственный автомобиль."],
  ["Όχημα", "Vehicle", "Fahrzeug", "Véhicule", "Veicolo", "Vehículo", "Автомобиль"],
  [" — θα διαγραφούν και όλα τα δεδομένα του.", " — all its data will be deleted too.", " — alle zugehörigen Daten werden ebenfalls gelöscht.", " — toutes ses données seront aussi supprimées.", " — verranno eliminati anche tutti i suoi dati.", " — también se eliminarán todos sus datos.", " — все его данные тоже будут удалены."],
  ["Τύπος", "Type", "Typ", "Type", "Tipo", "Tipo", "Тип"],
  ["Κατηγορία", "Category", "Kategorie", "Catégorie", "Categoria", "Categoría", "Категория"],
  ["Λίτρα/kWh", "Litres/kWh", "Liter/kWh", "Litres/kWh", "Litri/kWh", "Litros/kWh", "Литры/кВт·ч"],
  ["€/μον.", "€/unit", "€/Einheit", "€/unité", "€/unità", "€/unidad", "€/ед."],
  ["Σύνολο €", "Total €", "Gesamt €", "Total €", "Totale €", "Total €", "Итого €"],
  ["ΓΕΜΙΣΜΑΤΑ ΚΑΥΣΙΜΟΥ", "FUEL FILL-UPS", "TANKFÜLLUNGEN", "PLEINS DE CARBURANT", "RIFORNIMENTI", "REPOSTAJES", "ЗАПРАВКИ"],
  ["Τιμή/μον.", "Price/unit", "Preis/Einheit", "Prix/unité", "Prezzo/unità", "Precio/unidad", "Цена/ед."],
  ["Σύνολο", "Total", "Gesamt", "Total", "Totale", "Total", "Итого"],
  ["κατ.", "cons.", "Verbr.", "conso.", "cons.", "cons.", "расх."],
  ["μερικό", "partial", "teilweise", "partiel", "parziale", "parcial", "частично"],
  ["ΛΟΙΠΑ ΕΞΟΔΑ", "OTHER EXPENSES", "SONSTIGE KOSTEN", "AUTRES DÉPENSES", "ALTRE SPESE", "OTROS GASTOS", "ПРОЧИЕ РАСХОДЫ"],
  ["Περιγραφή", "Description", "Beschreibung", "Description", "Descrizione", "Descripción", "Описание"],
  ["Ποσό", "Amount", "Betrag", "Montant", "Importo", "Importe", "Сумма"],
  ["✅ Εισαγωγή επιτυχής!", "✅ Import successful!", "✅ Import erfolgreich!", "✅ Importation réussie !", "✅ Importazione riuscita!", "✅ ¡Importación correcta!", "✅ Импорт выполнен!"],
  ["❌ Δεν έχεις επιλέξει αρχείο.", "❌ No file selected.", "❌ Keine Datei ausgewählt.", "❌ Aucun fichier sélectionné.", "❌ Nessun file selezionato.", "❌ No has seleccionado ningún archivo.", "❌ Файл не выбран."],
  ["❌ Πολύ μεγάλο αρχείο.", "❌ File too large.", "❌ Datei zu groß.", "❌ Fichier trop volumineux.", "❌ File troppo grande.", "❌ Archivo demasiado grande.", "❌ Файл слишком большой."],
  ["❌ Μη έγκυρο JSON.", "❌ Invalid JSON.", "❌ Ungültiges JSON.", "❌ JSON invalide.", "❌ JSON non valido.", "❌ JSON no válido.", "❌ Недопустимый JSON."],
  ["❌ Μη έγκυρη μορφή FuelLog.", "❌ Not a valid FuelLog format.", "❌ Kein gültiges FuelLog-Format.", "❌ Format FuelLog invalide.", "❌ Formato FuelLog non valido.", "❌ Formato FuelLog no válido.", "❌ Недопустимый формат FuelLog."],
  ["Αντικατάσταση δεδομένων", "Replace data", "Daten ersetzen", "Remplacer les données", "Sostituisci i dati", "Reemplazar datos", "Замена данных"],
  ["{0} όχημα · {1} γεμίσματα · {2} έξοδα", "{0} vehicle(s) · {1} fill-ups · {2} expenses", "{0} Fahrzeug(e) · {1} Tankfüllungen · {2} Ausgaben", "{0} véhicule(s) · {1} pleins · {2} dépenses", "{0} veicolo/i · {1} rifornimenti · {2} spese", "{0} vehículo(s) · {1} repostajes · {2} gastos", "Авто: {0} · заправок: {1} · расходов: {2}"],
  ["Να αντικατασταθούν τα τωρινά δεδομένα;", "Replace the current data?", "Aktuelle Daten ersetzen?", "Remplacer les données actuelles ?", "Sostituire i dati attuali?", "¿Reemplazar los datos actuales?", "Заменить текущие данные?"],
  ["Εισαγωγή", "Import", "Importieren", "Importer", "Importa", "Importar", "Импорт"],
  ["Θα κρατηθεί αυτόματα αντίγραφο των τωρινών.", "A copy of the current data will be kept automatically.", "Von den aktuellen Daten wird automatisch eine Kopie behalten.", "Une copie des données actuelles sera conservée automatiquement.", "Verrà conservata automaticamente una copia dei dati attuali.", "Se guardará automáticamente una copia de los datos actuales.", "Копия текущих данных сохранится автоматически."],
  ["❌ Δεν αναγνωρίστηκε αρχείο Fuelio.", "❌ Not recognised as a Fuelio file.", "❌ Keine Fuelio-Datei erkannt.", "❌ Fichier Fuelio non reconnu.", "❌ File Fuelio non riconosciuto.", "❌ No se reconoce como archivo de Fuelio.", "❌ Файл Fuelio не распознан."],
  ["✅ Προστέθηκε «{0}»: {1} γεμίσματα, {2} έξοδα.", "✅ Added “{0}”: {1} fill-ups, {2} expenses.", "✅ „{0}“ hinzugefügt: {1} Tankfüllungen, {2} Ausgaben.", "✅ « {0} » ajouté : {1} pleins, {2} dépenses.", "✅ Aggiunto «{0}»: {1} rifornimenti, {2} spese.", "✅ Añadido «{0}»: {1} repostajes, {2} gastos.", "✅ Добавлено «{0}»: заправок — {1}, расходов — {2}."],
  ["{0} εγγραφές με άγνωστο τύπο καυσίμου μπήκαν ως «{1}».", "{0} entries with an unknown fuel type were set to “{1}”.", "{0} Einträge mit unbekanntem Kraftstoff wurden als „{1}“ übernommen.", "{0} entrées de carburant inconnu ont été importées comme « {1} ».", "{0} voci con carburante sconosciuto sono state importate come «{1}».", "{0} registros con combustible desconocido se importaron como «{1}».", "{0} записей с неизвестным видом топлива импортированы как «{1}»."],
  ["Διορθώθηκαν αυτόματα {0} τιμές που είχαν εξαχθεί ×1000.", "{0} values exported ×1000 were corrected automatically.", "{0} um den Faktor 1000 verfälschte Werte wurden automatisch korrigiert.", "{0} valeurs exportées ×1000 ont été corrigées automatiquement.", "{0} valori esportati ×1000 sono stati corretti automaticamente.", "Se corrigieron automáticamente {0} valores exportados ×1000.", "Автоматически исправлено значений, выгруженных ×1000: {0}."],
  ["❌ Σφάλμα ανάγνωσης αρχείου.", "❌ Error reading the file.", "❌ Fehler beim Lesen der Datei.", "❌ Erreur de lecture du fichier.", "❌ Errore di lettura del file.", "❌ Error al leer el archivo.", "❌ Ошибка чтения файла."],
  ["❌ Αδυναμία ανάγνωσης αρχείου.", "❌ Could not read the file.", "❌ Datei konnte nicht gelesen werden.", "❌ Impossible de lire le fichier.", "❌ Impossibile leggere il file.", "❌ No se pudo leer el archivo.", "❌ Не удалось прочитать файл."],
  ["❌ Το αρχείο δεν περιέχει δεδομένα.", "❌ The file contains no data.", "❌ Die Datei enthält keine Daten.", "❌ Le fichier ne contient aucune donnée.", "❌ Il file non contiene dati.", "❌ El archivo no contiene datos.", "❌ В файле нет данных."],
  ["❌ Διάλεξε τουλάχιστον τις στήλες Ημερομηνία και Συνολικό κόστος ή Ποσότητα.", "❌ Select at least the Date and Total cost (or Quantity) columns.", "❌ Wähle mindestens die Spalten Datum und Gesamtkosten (oder Menge).", "❌ Choisissez au moins les colonnes Date et Coût total (ou Quantité).", "❌ Scegli almeno le colonne Data e Costo totale (o Quantità).", "❌ Elige al menos las columnas Fecha y Coste total (o Cantidad).", "❌ Выберите хотя бы столбцы «Дата» и «Общая стоимость» (или «Количество»)."],
  ["❌ Δεν βρέθηκαν έγκυρες εγγραφές. Έλεγξε τις στήλες.", "❌ No valid entries found. Check the columns.", "❌ Keine gültigen Einträge gefunden. Spalten prüfen.", "❌ Aucune entrée valide. Vérifiez les colonnes.", "❌ Nessuna voce valida. Controlla le colonne.", "❌ No se encontraron registros válidos. Revisa las columnas.", "❌ Допустимых записей не найдено. Проверьте столбцы."],
  ["✅ Προστέθηκε «{0}»: {1} γεμίσματα.", "✅ Added “{0}”: {1} fill-ups.", "✅ „{0}“ hinzugefügt: {1} Tankfüllungen.", "✅ « {0} » ajouté : {1} pleins.", "✅ Aggiunto «{0}»: {1} rifornimenti.", "✅ Añadido «{0}»: {1} repostajes.", "✅ Добавлено «{0}»: заправок — {1}."],
  ["{0} γραμμές παραλείφθηκαν.", "{0} rows were skipped.", "{0} Zeilen wurden übersprungen.", "{0} lignes ignorées.", "{0} righe ignorate.", "{0} filas omitidas.", "Пропущено строк: {0}."],
  ["Αρχική", "Home", "Start", "Accueil", "Home", "Inicio", "Главная"],
  ["Φόρτιση", "Charging", "Laden", "Recharge", "Ricarica", "Carga", "Зарядка"],
  ["Έξοδα", "Expenses", "Ausgaben", "Dépenses", "Spese", "Gastos", "Расходы"],
  ["Στατιστικά", "Statistics", "Statistik", "Statistiques", "Statistiche", "Estadísticas", "Статистика"],
  ["Κινήσεις", "Activity", "Verlauf", "Historique", "Movimenti", "Movimientos", "История"],
  ["Αρχείο αυτοκινήτου", "Vehicle file", "Fahrzeugakte", "Fiche du véhicule", "Scheda veicolo", "Ficha del vehículo", "Карточка автомобиля"],
  ["Πού παρκάρισα", "Where I parked", "Wo ich geparkt habe", "Où j'ai garé ma voiture", "Dove ho parcheggiato", "Dónde aparqué", "Где я припарковался"],
  ["ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ ·", "TOTAL EXPENSES ·", "GESAMTKOSTEN ·", "DÉPENSES TOTALES ·", "SPESE TOTALI ·", "GASTOS TOTALES ·", "ВСЕГО РАСХОДОВ ·"],
  ["Δεν γίνεται αποθήκευση στη συσκευή", "Cannot save on this device", "Speichern auf diesem Gerät nicht möglich", "Enregistrement impossible sur cet appareil", "Impossibile salvare su questo dispositivo", "No se puede guardar en este dispositivo", "Не удаётся сохранить на устройстве"],
  ["Η μνήμη του browser είναι γεμάτη ή μπλοκαρισμένη (π.χ. ιδιωτική περιήγηση). Κατέβασε αντίγραφο τώρα για να μη χαθούν δεδομένα.", "The browser storage is full or blocked (e.g. private browsing). Download a backup now so no data is lost.", "Der Browser-Speicher ist voll oder gesperrt (z. B. privater Modus). Lade jetzt eine Sicherung herunter, damit keine Daten verloren gehen.", "Le stockage du navigateur est plein ou bloqué (navigation privée, par ex.). Téléchargez une sauvegarde maintenant pour ne rien perdre.", "La memoria del browser è piena o bloccata (es. navigazione privata). Scarica subito un backup per non perdere i dati.", "El almacenamiento del navegador está lleno o bloqueado (p. ej., navegación privada). Descarga una copia ahora para no perder datos.", "Хранилище браузера переполнено или заблокировано (например, приватный режим). Скачайте резервную копию, чтобы не потерять данные."],
  ["Λήψη JSON", "Download JSON", "JSON herunterladen", "Télécharger le JSON", "Scarica JSON", "Descargar JSON", "Скачать JSON"],
  ["Εγκατέστησε το FuelLog!", "Install FuelLog!", "Installiere FuelLog!", "Installez FuelLog !", "Installa FuelLog!", "¡Instala FuelLog!", "Установите FuelLog!"],
  ["Πάτα", "Tap", "Tippe auf", "Touchez", "Tocca", "Toca", "Нажмите"],
  ["για offline χρήση", "to use offline", "für die Offline-Nutzung", "pour l'utiliser hors ligne", "per usarlo offline", "para usarlo sin conexión", "для работы офлайн"],
  ["Γρήγορη πρόσβαση & χρήση χωρίς internet", "Quick access & use without internet", "Schneller Zugriff & Nutzung ohne Internet", "Accès rapide & utilisation sans internet", "Accesso rapido e uso senza internet", "Acceso rápido y uso sin internet", "Быстрый доступ и работа без интернета"],
  ["Εγκατάσταση", "Install", "Installieren", "Installer", "Installa", "Instalar", "Установить"],
  ["Κάνε αντίγραφο ασφαλείας", "Make a backup", "Sicherung erstellen", "Faites une sauvegarde", "Fai un backup", "Haz una copia de seguridad", "Сделайте резервную копию"],
  ["Δεν έχεις κατεβάσει ποτέ αντίγραφο.", "You have never downloaded a backup.", "Du hast noch nie eine Sicherung heruntergeladen.", "Vous n'avez jamais téléchargé de sauvegarde.", "Non hai mai scaricato un backup.", "Nunca has descargado una copia.", "Вы ещё ни разу не скачивали копию."],
  ["Το τελευταίο ήταν πριν {0} μέρες.", "The last one was {0} days ago.", "Die letzte war vor {0} Tagen.", "La dernière date d'il y a {0} jours.", "L'ultimo risale a {0} giorni fa.", "La última fue hace {0} días.", "Последняя была {0} дн. назад."],
  ["Τα δεδομένα μένουν μόνο σε αυτό το κινητό.", "Your data stays only on this device.", "Deine Daten bleiben nur auf diesem Gerät.", "Vos données restent uniquement sur cet appareil.", "I dati restano solo su questo dispositivo.", "Tus datos solo se guardan en este dispositivo.", "Данные хранятся только на этом устройстве."],
  ["🔔 Υπενθυμίσεις", "🔔 Reminders", "🔔 Erinnerungen", "🔔 Rappels", "🔔 Promemoria", "🔔 Recordatorios", "🔔 Напоминания"],
  ["⚠️ Πέρασες το όριο κατά {0} {1}", "⚠️ You are {0} {1} over the limit", "⚠️ Limit um {0} {1} überschritten", "⚠️ Limite dépassée de {0} {1}", "⚠️ Hai superato il limite di {0} {1}", "⚠️ Has superado el límite en {0} {1}", "⚠️ Лимит превышен на {0} {1}"],
  ["⏰ Σε {0} {1}", "⏰ In {0} {1}", "⏰ In {0} {1}", "⏰ Dans {0} {1}", "⏰ Tra {0} {1}", "⏰ En {0} {1}", "⏰ Через {0} {1}"],
  ["⚠️ Έληξε πριν {0} μέρες", "⚠️ Expired {0} days ago", "⚠️ Vor {0} Tagen abgelaufen", "⚠️ Expiré il y a {0} jours", "⚠️ Scaduto {0} giorni fa", "⚠️ Venció hace {0} días", "⚠️ Истёк {0} дн. назад"],
  ["⚠️ Λήγει ΣΗΜΕΡΑ", "⚠️ Expires TODAY", "⚠️ Läuft HEUTE ab", "⚠️ Expire AUJOURD'HUI", "⚠️ Scade OGGI", "⚠️ Vence HOY", "⚠️ Истекает СЕГОДНЯ"],
  ["⏰ Λήγει σε {0} μέρες", "⏰ Expires in {0} days", "⏰ Läuft in {0} Tagen ab", "⏰ Expire dans {0} jours", "⏰ Scade tra {0} giorni", "⏰ Vence en {0} días", "⏰ Истекает через {0} дн."],
  ["όριο {0} {1}", "limit {0} {1}", "Limit {0} {1}", "limite {0} {1}", "limite {0} {1}", "límite {0} {1}", "лимит {0} {1}"],
  ["✔ Έγινε;", "✔ Done?", "✔ Erledigt?", "✔ Fait ?", "✔ Fatto?", "✔ ¿Hecho?", "✔ Готово?"],
  ["⛽ ΓΕΜΙΣΜΑΤΑ", "⛽ FILL-UPS", "⛽ TANKFÜLLUNGEN", "⛽ PLEINS", "⛽ RIFORNIMENTI", "⛽ REPOSTAJES", "⛽ ЗАПРАВКИ"],
  ["→ Κινήσεις", "→ Activity", "→ Verlauf", "→ Historique", "→ Movimenti", "→ Movimientos", "→ История"],
  ["📋 ΕΞΟΔΑ", "📋 EXPENSES", "📋 AUSGABEN", "📋 DÉPENSES", "📋 SPESE", "📋 GASTOS", "📋 РАСХОДЫ"],
  ["⚡ Νέα Φόρτιση", "⚡ New charge", "⚡ Neuer Ladevorgang", "⚡ Nouvelle recharge", "⚡ Nuova ricarica", "⚡ Nueva carga", "⚡ Новая зарядка"],
  ["⛽ Νέο Γέμισμα", "⛽ New fill-up", "⛽ Neue Tankfüllung", "⛽ Nouveau plein", "⛽ Nuovo rifornimento", "⛽ Nuevo repostaje", "⛽ Новая заправка"],
  ["Τιμή", "Price", "Preis", "Prix", "Prezzo", "Precio", "Цена"],
  ["💶  Συνολικό Ποσό €", "💶  Total amount €", "💶  Gesamtbetrag €", "💶  Montant total €", "💶  Importo totale €", "💶  Importe total €", "💶  Общая сумма €"],
  ["🔋 Φόρτισα μέχρι πάνω", "🔋 Charged to full", "🔋 Vollständig geladen", "🔋 Chargé à fond", "🔋 Caricato al massimo", "🔋 Cargado al máximo", "🔋 Заряжено до полной"],
  ["⛽ Γέμισα μέχρι πάνω (φουλ)", "⛽ Filled up completely (full tank)", "⛽ Vollgetankt (voller Tank)", "⛽ Plein complet (réservoir plein)", "⛽ Pieno completo (serbatoio pieno)", "⛽ Depósito lleno (lleno completo)", "⛽ Полный бак (до отсечки)"],
  ["Συνολικά", "Total", "Gesamt", "Total", "Totale", "Total", "Общий"],
  ["📝  Σημειώσεις (προαιρετικό)", "📝  Notes (optional)", "📝  Notizen (optional)", "📝  Notes (facultatif)", "📝  Note (facoltativo)", "📝  Notas (opcional)", "📝  Заметки (необязательно)"],
  ["ΑΠΟΘΗΚΕΥΣΗ", "SAVE", "SPEICHERN", "ENREGISTRER", "SALVA", "GUARDAR", "СОХРАНИТЬ"],
  ["➕ Νέο Έξοδο", "➕ New expense", "➕ Neue Ausgabe", "➕ Nouvelle dépense", "➕ Nuova spesa", "➕ Nuevo gasto", "➕ Новый расход"],
  ["👆 Διάλεξε κατηγορία εξόδου", "👆 Choose an expense category", "👆 Kategorie wählen", "👆 Choisissez une catégorie", "👆 Scegli una categoria", "👆 Elige una categoría", "👆 Выберите категорию расхода"],
  ["Περιγραφή / Τοποθεσία (προαιρετικό)", "Description / Location (optional)", "Beschreibung / Ort (optional)", "Description / Lieu (facultatif)", "Descrizione / Luogo (facoltativo)", "Descripción / Lugar (opcional)", "Описание / Место (необязательно)"],
  ["Ποσό €", "Amount €", "Betrag €", "Montant €", "Importo €", "Importe €", "Сумма €"],
  ["✅ ΑΠΟΘΗΚΕΥΣΗ", "✅ SAVE", "✅ SPEICHERN", "✅ ENREGISTRER", "✅ SALVA", "✅ GUARDAR", "✅ СОХРАНИТЬ"],
  ["Όλα", "All", "Alle", "Tout", "Tutti", "Todo", "Все"],
  ["Δεν υπάρχουν έξοδα ακόμα.", "No expenses yet.", "Noch keine Ausgaben.", "Aucune dépense pour l'instant.", "Ancora nessuna spesa.", "Aún no hay gastos.", "Расходов пока нет."],
  ["{0} εγγρ.", "{0} entries", "{0} Einträge", "{0} entrées", "{0} voci", "{0} reg.", "{0} зап."],
  ["🎉 Η χρονιά σου ·", "🎉 Your year ·", "🎉 Dein Jahr ·", "🎉 Votre année ·", "🎉 Il tuo anno ·", "🎉 Tu año ·", "🎉 Ваш год ·"],
  ["Όλα τα έτη", "All years", "Alle Jahre", "Toutes les années", "Tutti gli anni", "Todos los años", "Все годы"],
  ["Όλοι οι μήνες", "All months", "Alle Monate", "Tous les mois", "Tutti i mesi", "Todos los meses", "Все месяцы"],
  ["ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ", "TOTAL EXPENSES", "GESAMTKOSTEN", "DÉPENSES TOTALES", "SPESE TOTALI", "GASTOS TOTALES", "ВСЕГО РАСХОДОВ"],
  ["ΗΛΕΚΤΡΙΣΜΟΣ", "ELECTRICITY", "STROM", "ÉLECTRICITÉ", "ELETTRICITÀ", "ELECTRICIDAD", "ЭЛЕКТРИЧЕСТВО"],
  ["ΚΑΥΣΙΜΑ & ΡΕΥΜΑ", "FUEL & POWER", "KRAFTSTOFF & STROM", "CARBURANT & ÉLECTRICITÉ", "CARBURANTE & ENERGIA", "COMBUSTIBLE Y ELECTRICIDAD", "ТОПЛИВО И ЭЛЕКТРИЧЕСТВО"],
  ["ΚΑΥΣΙΜΑ", "FUEL", "KRAFTSTOFF", "CARBURANT", "CARBURANTE", "COMBUSTIBLE", "ТОПЛИВО"],
  ["ΑΛΛΑ ΕΞΟΔΑ", "OTHER EXPENSES", "SONSTIGE KOSTEN", "AUTRES DÉPENSES", "ALTRE SPESE", "OTROS GASTOS", "ПРОЧИЕ РАСХОДЫ"],
  ["ΣΥΝΟΛΟ ΛΙΤΡΩΝ", "TOTAL LITRES", "LITER GESAMT", "TOTAL LITRES", "LITRI TOTALI", "LITROS TOTALES", "ВСЕГО ЛИТРОВ"],
  ["ΣΥΝΟΛΟ ΓΑΛΟΝΙΩΝ", "TOTAL GALLONS", "GALLONEN GESAMT", "TOTAL GALLONS", "GALLONI TOTALI", "GALONES TOTALES", "ВСЕГО ГАЛЛОНОВ"],
  ["ΣΥΝΟΛΟ kWh", "TOTAL kWh", "kWh GESAMT", "TOTAL kWh", "kWh TOTALI", "kWh TOTALES", "ВСЕГО кВт·ч"],
  ["ΜΕΣΗ ΤΙΜΗ/kWh", "AVG PRICE/kWh", "Ø PREIS/kWh", "PRIX MOY./kWh", "PREZZO MEDIO/kWh", "PRECIO MEDIO/kWh", "СР. ЦЕНА/кВт·ч"],
  ["ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ", "AVG CONSUMPTION", "Ø VERBRAUCH", "CONSO. MOYENNE", "CONSUMO MEDIO", "CONSUMO MEDIO", "СР. РАСХОД"],
  ["ΜΕΣΗ ΤΙΜΗ/{0}", "AVG PRICE/{0}", "Ø PREIS/{0}", "PRIX MOY./{0}", "PREZZO MEDIO/{0}", "PRECIO MEDIO/{0}", "СР. ЦЕНА/{0}"],
  ["ΣΥΝΟΛΟ ΜΙΛΙΑ", "TOTAL MILES", "MEILEN GESAMT", "TOTAL MILES", "MIGLIA TOTALI", "MILLAS TOTALES", "ВСЕГО МИЛЬ"],
  ["ΣΥΝΟΛΟ ΧΛΜ", "TOTAL KM", "KM GESAMT", "TOTAL KM", "KM TOTALI", "KM TOTALES", "ВСЕГО КМ"],
  ["ΚΟΣΤΟΣ/{0}", "COST/{0}", "KOSTEN/{0}", "COÛT/{0}", "COSTO/{0}", "COSTE/{0}", "СТОИМОСТЬ/{0}"],
  ["€/{0} (ολικό)", "€/{0} (overall)", "€/{0} (gesamt)", "€/{0} (total)", "€/{0} (totale)", "€/{0} (total)", "€/{0} (всего)"],
  ["ΡΕΥΜΑ/{0}", "POWER/{0}", "STROM/{0}", "ÉLECTRICITÉ/{0}", "ENERGIA/{0}", "ELECTRICIDAD/{0}", "ЭЛЕКТРИЧ./{0}"],
  ["ΚΑΥΣΙΜΟ/{0}", "FUEL/{0}", "KRAFTSTOFF/{0}", "CARBURANT/{0}", "CARBURANTE/{0}", "COMBUSTIBLE/{0}", "ТОПЛИВО/{0}"],
  ["📊 Μηνιαία Έξοδα ·", "📊 Monthly expenses ·", "📊 Monatliche Kosten ·", "📊 Dépenses mensuelles ·", "📊 Spese mensili ·", "📊 Gastos mensuales ·", "📊 Расходы по месяцам ·"],
  ["Ηλεκτρισμός", "Electricity", "Strom", "Électricité", "Elettricità", "Electricidad", "Электричество"],
  ["Καύσιμα & ρεύμα", "Fuel & power", "Kraftstoff & Strom", "Carburant & électricité", "Carburante ed energia", "Combustible y electricidad", "Топливо и электричество"],
  ["⛽ Κατανάλωση ανά γέμισμα ·", "⛽ Consumption per fill-up ·", "⛽ Verbrauch pro Tankfüllung ·", "⛽ Consommation par plein ·", "⛽ Consumo per rifornimento ·", "⛽ Consumo por repostaje ·", "⛽ Расход по заправкам ·"],
  ["🗂️ Κατανομή Εξόδων", "🗂️ Expense breakdown", "🗂️ Kostenverteilung", "🗂️ Répartition des dépenses", "🗂️ Ripartizione delle spese", "🗂️ Desglose de gastos", "🗂️ Структура расходов"],
  ["Σύνολο οχήματος ·", "Vehicle total ·", "Fahrzeug gesamt ·", "Total du véhicule ·", "Totale veicolo ·", "Total del vehículo ·", "Всего по авто ·"],
  ["εγγραφές · tap για ανάλυση", "entries · tap for details", "Einträge · tippen für Details", "entrées · touchez pour le détail", "voci · tocca per i dettagli", "registros · toca para ver detalle", "записей · нажмите для подробностей"],
  ["ΣΥΝΟΛΟ", "TOTAL", "GESAMT", "TOTAL", "TOTALE", "TOTAL", "ИТОГО"],
  ["🧾 Κινήσεις", "🧾 Activity", "🧾 Verlauf", "🧾 Historique", "🧾 Movimenti", "🧾 Movimientos", "🧾 История"],
  ["📃 Λίστα", "📃 List", "📃 Liste", "📃 Liste", "📃 Elenco", "📃 Lista", "📃 Список"],
  ["🗓️ Ημερολόγιο", "🗓️ Calendar", "🗓️ Kalender", "🗓️ Calendrier", "🗓️ Calendario", "🗓️ Calendario", "🗓️ Календарь"],
  ["📝 Νέα σημείωση", "📝 New note", "📝 Neue Notiz", "📝 Nouvelle note", "📝 Nuova nota", "📝 Nueva nota", "📝 Новая заметка"],
  ["⛽ Καύσιμα", "⛽ Fuel", "⛽ Kraftstoff", "⛽ Carburant", "⛽ Carburante", "⛽ Combustible", "⛽ Топливо"],
  ["📋 Έξοδα", "📋 Expenses", "📋 Ausgaben", "📋 Dépenses", "📋 Spese", "📋 Gastos", "📋 Расходы"],
  ["📝 Σημειώσεις", "📝 Notes", "📝 Notizen", "📝 Notes", "📝 Note", "📝 Notas", "📝 Заметки"],
  ["📅 Νεότερο", "📅 Newest", "📅 Neueste", "📅 Plus récent", "📅 Più recenti", "📅 Más recientes", "📅 Сначала новые"],
  ["📅 Παλαιότερο", "📅 Oldest", "📅 Älteste", "📅 Plus ancien", "📅 Più vecchi", "📅 Más antiguos", "📅 Сначала старые"],
  ["Δεν υπάρχουν εγγραφές ακόμα.", "No entries yet.", "Noch keine Einträge.", "Aucune entrée pour l'instant.", "Ancora nessuna voce.", "Aún no hay registros.", "Записей пока нет."],
  ["Σύνολο μήνα:", "Month total:", "Monatssumme:", "Total du mois :", "Totale del mese:", "Total del mes:", "Итого за месяц:"],
  ["⛽ γέμισμα · 📝 σημείωση · άλλα εικονίδια = έξοδο (service, διόδια κ.λπ.) · πάτα μια μέρα για λεπτομέρειες", "⛽ fill-up · 📝 note · other icons = expense (service, tolls, etc.) · tap a day for details", "⛽ Tankfüllung · 📝 Notiz · andere Symbole = Ausgabe (Service, Maut usw.) · Tag antippen für Details", "⛽ plein · 📝 note · autres icônes = dépense (entretien, péages, etc.) · touchez un jour pour le détail", "⛽ rifornimento · 📝 nota · altre icone = spesa (tagliando, pedaggi, ecc.) · tocca un giorno per i dettagli", "⛽ repostaje · 📝 nota · otros iconos = gasto (revisión, peajes, etc.) · toca un día para ver detalles", "⛽ заправка · 📝 заметка · другие значки = расход (ТО, платные дороги и т. д.) · нажмите на день для подробностей"],
  ["Καμία κίνηση αυτή τη μέρα.", "No activity on this day.", "Keine Einträge an diesem Tag.", "Aucune activité ce jour-là.", "Nessun movimento in questo giorno.", "Sin movimientos este día.", "В этот день записей нет."],
  ["🚗 Καλώς ήρθες! Πρόσθεσε το όχημά σου", "🚗 Welcome! Add your vehicle", "🚗 Willkommen! Füge dein Fahrzeug hinzu", "🚗 Bienvenue ! Ajoutez votre véhicule", "🚗 Benvenuto! Aggiungi il tuo veicolo", "🚗 ¡Bienvenido! Añade tu vehículo", "🚗 Добро пожаловать! Добавьте свой автомобиль"],
  ["➕ Νέο Όχημα", "➕ New vehicle", "➕ Neues Fahrzeug", "➕ Nouveau véhicule", "➕ Nuovo veicolo", "➕ Nuevo vehículo", "➕ Новый автомобиль"],
  ["ΓΛΩΣΣΑ / LANGUAGE", "LANGUAGE", "SPRACHE", "LANGUE", "LINGUA", "IDIOMA", "ЯЗЫК"],
  ["ΝΟΜΙΣΜΑ", "CURRENCY", "WÄHRUNG", "DEVISE", "VALUTA", "MONEDA", "ВАЛЮТА"],
  ["Όνομα (π.χ. ΕΤΑΙΡΙΚΟ)", "Name (e.g. COMPANY CAR)", "Name (z. B. FIRMENWAGEN)", "Nom (p. ex. VOITURE DE SOCIÉTÉ)", "Nome (es. AUTO AZIENDALE)", "Nombre (p. ej., COCHE DE EMPRESA)", "Название (например, СЛУЖЕБНЫЙ)"],
  ["ΚΑΤΗΓΟΡΙΑ", "CATEGORY", "KATEGORIE", "CATÉGORIE", "CATEGORIA", "CATEGORÍA", "КАТЕГОРИЯ"],
  ["ΤΥΠΟΣ ΚΙΝΗΤΗΡΑ", "ENGINE TYPE", "MOTORTYP", "TYPE DE MOTEUR", "TIPO DI MOTORE", "TIPO DE MOTOR", "ТИП ДВИГАТЕЛЯ"],
  ["ℹ️ Το αυτοφορτιζόμενο δεν αγοράζει ρεύμα, οπότε καταγράφεται μόνο με καύσιμο. Αν φορτίζεις από πρίζα, διάλεξε «Plug-in».", "ℹ️ A self-charging hybrid does not buy electricity, so it is logged with fuel only. If you charge from a socket, choose “Plug-in”.", "ℹ️ Ein selbstladender Hybrid kauft keinen Strom und wird nur mit Kraftstoff erfasst. Wenn du an der Steckdose lädst, wähle „Plug-in“.", "ℹ️ Un hybride autorechargeable n'achète pas d'électricité : il est suivi uniquement avec du carburant. Si vous rechargez sur prise, choisissez « Rechargeable ».", "ℹ️ Un ibrido autoricaricabile non acquista elettricità, quindi si registra solo con il carburante. Se ricarichi dalla presa, scegli «Plug-in».", "ℹ️ Un híbrido autorrecargable no compra electricidad, así que solo se registra con combustible. Si cargas en un enchufe, elige «Enchufable».", "ℹ️ Обычный гибрид не покупает электричество, поэтому учитывается только топливо. Если заряжаете от розетки, выберите «Плагин»."],
  ["⚡ Ενέργεια: Ηλεκτρισμός (kWh)", "⚡ Energy: Electricity (kWh)", "⚡ Energie: Strom (kWh)", "⚡ Énergie : électricité (kWh)", "⚡ Energia: elettricità (kWh)", "⚡ Energía: electricidad (kWh)", "⚡ Энергия: электричество (кВт·ч)"],
  ["ΚΥΡΙΟ ΚΑΥΣΙΜΟ (υποχρεωτικό)", "MAIN FUEL (required)", "HAUPTKRAFTSTOFF (Pflicht)", "CARBURANT PRINCIPAL (obligatoire)", "CARBURANTE PRINCIPALE (obbligatorio)", "COMBUSTIBLE PRINCIPAL (obligatorio)", "ОСНОВНОЕ ТОПЛИВО (обязательно)"],
  [" · το ρεύμα προστίθεται αυτόματα", " · electricity is added automatically", " · Strom wird automatisch ergänzt", " · l'électricité est ajoutée automatiquement", " · l'elettricità viene aggiunta automaticamente", " · la electricidad se añade automáticamente", " · электричество добавляется автоматически"],
  ["— Επίλεξε καύσιμο —", "— Choose fuel —", "— Kraftstoff wählen —", "— Choisir le carburant —", "— Scegli il carburante —", "— Elige combustible —", "— Выберите топливо —"],
  ["2ο ΚΑΥΣΙΜΟ", "2ND FUEL", "2. KRAFTSTOFF", "2E CARBURANT", "2º CARBURANTE", "2.º COMBUSTIBLE", "ВТОРОЕ ТОПЛИВО"],
  ["— Κανένα —", "— None —", "— Keiner —", "— Aucun —", "— Nessuno —", "— Ninguno —", "— Нет —"],
  ["ΜΟΝΑΔΕΣ", "UNITS", "EINHEITEN", "UNITÉS", "UNITÀ", "UNIDADES", "ЕДИНИЦЫ"],
  ["ΧΡΩΜΑ", "COLOUR", "FARBE", "COULEUR", "COLORE", "COLOR", "ЦВЕТ"],
  ["ΠΡΟΣΘΗΚΗ ΟΧΗΜΑΤΟΣ", "ADD VEHICLE", "FAHRZEUG HINZUFÜGEN", "AJOUTER LE VÉHICULE", "AGGIUNGI VEICOLO", "AÑADIR VEHÍCULO", "ДОБАВИТЬ АВТОМОБИЛЬ"],
  ["{0} {1} · Αρχείο αυτοκινήτου", "{0} {1} · Vehicle file", "{0} {1} · Fahrzeugakte", "{0} {1} · Fiche du véhicule", "{0} {1} · Scheda veicolo", "{0} {1} · Ficha del vehículo", "{0} {1} · Карточка автомобиля"],
  ["— Επίλεξε —", "— Choose —", "— Wählen —", "— Choisir —", "— Scegli —", "— Elegir —", "— Выбрать —"],
  ["✅ Αποθήκευση & Κλείσιμο", "✅ Save & close", "✅ Speichern & schließen", "✅ Enregistrer et fermer", "✅ Salva e chiudi", "✅ Guardar y cerrar", "✅ Сохранить и закрыть"],
  ["💾 Εισαγωγή / Εξαγωγή", "💾 Import / Export", "💾 Import / Export", "💾 Import / Export", "💾 Importa / Esporta", "💾 Importar / Exportar", "💾 Импорт / Экспорт"],
  ["Εξαγωγή Δεδομένων", "Export data", "Daten exportieren", "Exporter les données", "Esporta dati", "Exportar datos", "Экспорт данных"],
  ["Εισαγωγή (JSON)", "Import (JSON)", "Import (JSON)", "Importation (JSON)", "Importa (JSON)", "Importar (JSON)", "Импорт (JSON)"],
  ["Ή επικόλλησε JSON εδώ…", "Or paste JSON here…", "Oder JSON hier einfügen…", "Ou collez le JSON ici…", "Oppure incolla qui il JSON…", "O pega aquí el JSON…", "Или вставьте JSON сюда…"],
  ["⬆️ Εισαγωγή Δεδομένων", "⬆️ Import data", "⬆️ Daten importieren", "⬆️ Importer les données", "⬆️ Importa dati", "⬆️ Importar datos", "⬆️ Импортировать данные"],
  ["⚠️ Η εισαγωγή αντικαθιστά όλα τα υπάρχοντα δεδομένα.", "⚠️ Importing replaces all existing data.", "⚠️ Der Import ersetzt alle vorhandenen Daten.", "⚠️ L'importation remplace toutes les données existantes.", "⚠️ L'importazione sostituisce tutti i dati esistenti.", "⚠️ La importación reemplaza todos los datos existentes.", "⚠️ Импорт заменяет все существующие данные."],
  ["Εισαγωγή από Fuelio (CSV)", "Import from Fuelio (CSV)", "Import aus Fuelio (CSV)", "Importer depuis Fuelio (CSV)", "Importa da Fuelio (CSV)", "Importar desde Fuelio (CSV)", "Импорт из Fuelio (CSV)"],
  ["Προσθέτει νέο όχημα με τα γεμίσματα και τα έξοδά του. Δεν αντικαθιστά τα υπάρχοντα δεδομένα.", "Adds a new vehicle with its fill-ups and expenses. Does not replace existing data.", "Fügt ein neues Fahrzeug mit Tankfüllungen und Ausgaben hinzu. Vorhandene Daten bleiben erhalten.", "Ajoute un nouveau véhicule avec ses pleins et dépenses. Ne remplace pas les données existantes.", "Aggiunge un nuovo veicolo con rifornimenti e spese. Non sostituisce i dati esistenti.", "Añade un vehículo nuevo con sus repostajes y gastos. No reemplaza los datos existentes.", "Добавляет новый автомобиль с заправками и расходами. Существующие данные не заменяются."],
  ["Εισαγωγή από άλλη εφαρμογή (CSV)", "Import from another app (CSV)", "Import aus einer anderen App (CSV)", "Importer depuis une autre appli (CSV)", "Importa da un'altra app (CSV)", "Importar desde otra app (CSV)", "Импорт из другого приложения (CSV)"],
  ["Για οποιαδήποτε εφαρμογή ή Excel που εξάγει CSV. Οι στήλες αναγνωρίζονται αυτόματα και μπορείς να τις διορθώσεις πριν την εισαγωγή.", "For any app or Excel that exports CSV. Columns are detected automatically and you can adjust them before importing.", "Für jede App oder Excel mit CSV-Export. Die Spalten werden automatisch erkannt und können vor dem Import angepasst werden.", "Pour toute appli ou Excel exportant en CSV. Les colonnes sont détectées automatiquement et modifiables avant l'importation.", "Per qualsiasi app o Excel che esporta in CSV. Le colonne vengono riconosciute automaticamente e puoi correggerle prima dell'importazione.", "Para cualquier app o Excel que exporte CSV. Las columnas se detectan automáticamente y puedes corregirlas antes de importar.", "Для любого приложения или Excel с экспортом в CSV. Столбцы определяются автоматически, их можно поправить перед импортом."],
  ["Όνομα οχήματος", "Vehicle name", "Fahrzeugname", "Nom du véhicule", "Nome del veicolo", "Nombre del vehículo", "Название автомобиля"],
  ["— Δεν υπάρχει —", "— Not available —", "— Nicht vorhanden —", "— Absent —", "— Non presente —", "— No existe —", "— Нет —"],
  ["π.χ.", "e.g.", "z. B.", "p. ex.", "es.", "p. ej.", "напр."],
  ["ΚΑΥΣΙΜΟ", "FUEL", "KRAFTSTOFF", "CARBURANT", "CARBURANTE", "COMBUSTIBLE", "ТОПЛИВО"],
  ["ΜΟΡΦΗ ΗΜΕΡΟΜΗΝΙΑΣ", "DATE FORMAT", "DATUMSFORMAT", "FORMAT DE DATE", "FORMATO DATA", "FORMATO DE FECHA", "ФОРМАТ ДАТЫ"],
  ["ΗΗ/ΜΜ/ΕΕΕΕ", "DD/MM/YYYY", "TT/MM/JJJJ", "JJ/MM/AAAA", "GG/MM/AAAA", "DD/MM/AAAA", "ДД/ММ/ГГГГ"],
  ["ΜΜ/ΗΗ/ΕΕΕΕ", "MM/DD/YYYY", "MM/TT/JJJJ", "MM/JJ/AAAA", "MM/GG/AAAA", "MM/DD/AAAA", "ММ/ДД/ГГГГ"],
  ["ΜΟΝΑΔΕΣ ΤΩΝ ΔΕΔΟΜΕΝΩΝ", "DATA UNITS", "EINHEITEN DER DATEN", "UNITÉS DES DONNÉES", "UNITÀ DEI DATI", "UNIDADES DE LOS DATOS", "ЕДИНИЦЫ ДАННЫХ"],
  ["⬆️ Εισαγωγή οχήματος", "⬆️ Import vehicle", "⬆️ Fahrzeug importieren", "⬆️ Importer le véhicule", "⬆️ Importa veicolo", "⬆️ Importar vehículo", "⬆️ Импортировать автомобиль"],
  ["🅿️ Πού παρκάρισα · {0} {1}", "🅿️ Where I parked · {0} {1}", "🅿️ Wo ich geparkt habe · {0} {1}", "🅿️ Où j'ai garé · {0} {1}", "🅿️ Dove ho parcheggiato · {0} {1}", "🅿️ Dónde aparqué · {0} {1}", "🅿️ Где я припарковался · {0} {1}"],
  ["📍 Αποθηκεύτηκε", "📍 Saved", "📍 Gespeichert", "📍 Enregistré", "📍 Salvato", "📍 Guardado", "📍 Сохранено"],
  ["🧭 Οδηγίες", "🧭 Directions", "🧭 Route", "🧭 Itinéraire", "🧭 Indicazioni", "🧭 Cómo llegar", "🧭 Маршрут"],
  ["🗺️ Χάρτης", "🗺️ Map", "🗺️ Karte", "🗺️ Carte", "🗺️ Mappa", "🗺️ Mapa", "🗺️ Карта"],
  ["📍 Νέα θέση", "📍 New location", "📍 Neuer Standort", "📍 Nouvelle position", "📍 Nuova posizione", "📍 Nueva ubicación", "📍 Новое место"],
  ["✕ Φεύγω", "✕ Leaving", "✕ Ich fahre los", "✕ Je pars", "✕ Parto", "✕ Me voy", "✕ Уезжаю"],
  ["📍 Πάρκαρα εδώ", "📍 I parked here", "📍 Hier geparkt", "📍 Garé ici", "📍 Parcheggiato qui", "📍 Aparcado aquí", "📍 Припарковался здесь"],
  ["🎉 Η χρονιά σου · {0} {1}", "🎉 Your year · {0} {1}", "🎉 Dein Jahr · {0} {1}", "🎉 Votre année · {0} {1}", "🎉 Il tuo anno · {0} {1}", "🎉 Tu año · {0} {1}", "🎉 Ваш год · {0} {1}"],
  ["Δεν υπάρχουν κινήσεις για", "No activity for", "Keine Einträge für", "Aucune activité pour", "Nessun movimento per", "Sin movimientos para", "Нет записей за"],
  ["⚡ ΦΟΡΤΙΣΕΙΣ", "⚡ CHARGES", "⚡ LADEVORGÄNGE", "⚡ RECHARGES", "⚡ RICARICHE", "⚡ CARGAS", "⚡ ЗАРЯДКИ"],
  ["🛢️ ΛΙΤΡΑ", "🛢️ LITRES", "🛢️ LITER", "🛢️ LITRES", "🛢️ LITRI", "🛢️ LITROS", "🛢️ ЛИТРЫ"],
  ["🛢️ ΓΑΛΟΝΙΑ", "🛢️ GALLONS", "🛢️ GALLONEN", "🛢️ GALLONS", "🛢️ GALLONI", "🛢️ GALONES", "🛢️ ГАЛЛОНЫ"],
  ["📍 ΜΙΛΙΑ", "📍 MILES", "📍 MEILEN", "📍 MILES", "📍 MIGLIA", "📍 MILLAS", "📍 МИЛИ"],
  ["📍 ΧΙΛΙΟΜΕΤΡΑ", "📍 KILOMETRES", "📍 KILOMETER", "📍 KILOMÈTRES", "📍 CHILOMETRI", "📍 KILÓMETROS", "📍 КИЛОМЕТРЫ"],
  ["ΜΕΣΗ ΤΙΜΗ", "AVG PRICE", "Ø PREIS", "PRIX MOYEN", "PREZZO MEDIO", "PRECIO MEDIO", "СРЕДНЯЯ ЦЕНА"],
  ["💸 Ακριβότερο γέμισμα:", "💸 Most expensive fill-up:", "💸 Teuerste Tankfüllung:", "💸 Plein le plus cher :", "💸 Rifornimento più caro:", "💸 Repostaje más caro:", "💸 Самая дорогая заправка:"],
  ["🏷️ Φθηνότερη τιμή:", "🏷️ Lowest price:", "🏷️ Niedrigster Preis:", "🏷️ Prix le plus bas :", "🏷️ Prezzo più basso:", "🏷️ Precio más bajo:", "🏷️ Самая низкая цена:"],
  ["🏆 Μεγαλύτερο έξοδο:", "🏆 Biggest expense:", "🏆 Größte Ausgabe:", "🏆 Plus grosse dépense :", "🏆 Spesa maggiore:", "🏆 Mayor gasto:", "🏆 Самый большой расход:"],
  ["📅 Ακριβότερος μήνας:", "📅 Most expensive month:", "📅 Teuerster Monat:", "📅 Mois le plus cher :", "📅 Mese più costoso:", "📅 Mes más caro:", "📅 Самый дорогой месяц:"],
  ["✏️ Επεξεργασία Γεμίσματος", "✏️ Edit fill-up", "✏️ Tankfüllung bearbeiten", "✏️ Modifier le plein", "✏️ Modifica rifornimento", "✏️ Editar repostaje", "✏️ Редактирование заправки"],
  ["Συνολικό Ποσό €", "Total amount €", "Gesamtbetrag €", "Montant total €", "Importo totale €", "Importe total €", "Общая сумма €"],
  ["🔋 Φόρτιση μέχρι πάνω", "🔋 Charged to full", "🔋 Vollständig geladen", "🔋 Chargé à fond", "🔋 Caricato al massimo", "🔋 Cargado al máximo", "🔋 Заряжено до полной"],
  ["✏️ Επεξεργασία Εξόδου", "✏️ Edit expense", "✏️ Ausgabe bearbeiten", "✏️ Modifier la dépense", "✏️ Modifica spesa", "✏️ Editar gasto", "✏️ Редактирование расхода"],
  ["Τοποθεσία / Περιγραφή", "Location / Description", "Ort / Beschreibung", "Lieu / Description", "Luogo / Descrizione", "Lugar / Descripción", "Место / Описание"],
  ["✅ Έγινε:", "✅ Done:", "✅ Erledigt:", "✅ Fait :", "✅ Fatto:", "✅ Hecho:", "✅ Готово:"],
  ["ΝΕΟ ΟΡΙΟ ΕΠΟΜΕΝΟΥ SERVICE ({0})", "NEW LIMIT FOR NEXT SERVICE ({0})", "NEUES LIMIT FÜR NÄCHSTEN SERVICE ({0})", "NOUVELLE LIMITE DU PROCHAIN ENTRETIEN ({0})", "NUOVO LIMITE PROSSIMO TAGLIANDO ({0})", "NUEVO LÍMITE DE LA PRÓXIMA REVISIÓN ({0})", "НОВЫЙ ЛИМИТ СЛЕДУЮЩЕГО ТО ({0})"],
  ["ΝΕΑ ΗΜΕΡΟΜΗΝΙΑ", "NEW DATE", "NEUES DATUM", "NOUVELLE DATE", "NUOVA DATA", "NUEVA FECHA", "НОВАЯ ДАТА"],
  ["π.χ. 165000", "e.g. 165000", "z. B. 165000", "p. ex. 165000", "es. 165000", "p. ej., 165000", "напр. 165000"],
  ["Άφησέ το κενό αν δεν θες νέα υπενθύμιση. Η τωρινή θα σβηστεί.", "Leave empty if you don't want a new reminder. The current one will be removed.", "Leer lassen, wenn du keine neue Erinnerung möchtest. Die aktuelle wird gelöscht.", "Laissez vide si vous ne voulez pas de nouveau rappel. L'actuel sera supprimé.", "Lascia vuoto se non vuoi un nuovo promemoria. Quello attuale verrà eliminato.", "Déjalo vacío si no quieres un nuevo recordatorio. El actual se eliminará.", "Оставьте пустым, если новое напоминание не нужно. Текущее будет удалено."],
  ["✅ Αποθήκευση", "✅ Save", "✅ Speichern", "✅ Enregistrer", "✅ Salva", "✅ Guardar", "✅ Сохранить"],
  ["Ακύρωση", "Cancel", "Abbrechen", "Annuler", "Annulla", "Cancelar", "Отмена"],
  ["🗂️ Αρχείο", "🗂️ File", "🗂️ Akte", "🗂️ Fiche", "🗂️ Scheda", "🗂️ Ficha", "🗂️ Карточка"],
  ["ΟΚ", "OK", "OK", "OK", "OK", "OK", "ОК"],
  ["Είσαι σίγουρος για τη διαγραφή;", "Are you sure you want to delete?", "Wirklich löschen?", "Voulez-vous vraiment supprimer ?", "Sei sicuro di voler eliminare?", "¿Seguro que quieres eliminar?", "Вы уверены, что хотите удалить?"],
  ["Δεν μπορεί να αναιρεθεί.", "This cannot be undone.", "Das kann nicht rückgängig gemacht werden.", "Cette action est irréversible.", "Non può essere annullato.", "No se puede deshacer.", "Это действие нельзя отменить."],
  ["Διαγραφή", "Delete", "Löschen", "Supprimer", "Elimina", "Eliminar", "Удалить"],
  ["✏️ Επεξεργασία Σημείωσης", "✏️ Edit note", "✏️ Notiz bearbeiten", "✏️ Modifier la note", "✏️ Modifica nota", "✏️ Editar nota", "✏️ Редактирование заметки"],
  ["📝 Νέα Σημείωση", "📝 New note", "📝 Neue Notiz", "📝 Nouvelle note", "📝 Nuova nota", "📝 Nueva nota", "📝 Новая заметка"],
  ["Γράψε ό,τι θέλεις να θυμάσαι (π.χ. θόρυβος στα φρένα, ξέχασα να ελέγξω τα λάδια…)", "Write anything you want to remember (e.g. brake noise, forgot to check the oil…)", "Schreibe auf, was du dir merken möchtest (z. B. Bremsgeräusch, Ölstand nicht geprüft…)", "Écrivez ce dont vous voulez vous souvenir (p. ex. bruit de freins, oubli de vérifier l'huile…)", "Scrivi ciò che vuoi ricordare (es. rumore ai freni, ho dimenticato di controllare l'olio…)", "Escribe lo que quieras recordar (p. ej., ruido en los frenos, olvidé revisar el aceite…)", "Запишите, что нужно запомнить (например, шум тормозов, забыл проверить масло…)"],
  ["ℹ️ Σχετικά και ρυθμίσεις", "ℹ️ About & settings", "ℹ️ Info & Einstellungen", "ℹ️ À propos et réglages", "ℹ️ Info e impostazioni", "ℹ️ Acerca de y ajustes", "ℹ️ О приложении и настройки"],
  ["ΜΕΓΕΘΟΣ ΓΡΑΜΜΑΤΩΝ", "TEXT SIZE", "SCHRIFTGRÖSSE", "TAILLE DU TEXTE", "DIMENSIONE DEL TESTO", "TAMAÑO DEL TEXTO", "РАЗМЕР ТЕКСТА"],
  ["Μικρά", "Small", "Klein", "Petit", "Piccolo", "Pequeño", "Мелкий"],
  ["Κανονικά", "Normal", "Normal", "Normal", "Normale", "Normal", "Обычный"],
  ["Μεγάλα", "Large", "Groß", "Grand", "Grande", "Grande", "Крупный"],
  ["Αλλάζει μόνο το σύμβολο· τα ποσά δεν μετατρέπονται.", "Only the symbol changes; amounts are not converted.", "Nur das Symbol ändert sich; Beträge werden nicht umgerechnet.", "Seul le symbole change ; les montants ne sont pas convertis.", "Cambia solo il simbolo; gli importi non vengono convertiti.", "Solo cambia el símbolo; los importes no se convierten.", "Меняется только символ; суммы не пересчитываются."],
  ["ΜΟΝΑΔΕΣ ΓΙΑ ΝΕΑ ΟΧΗΜΑΤΑ", "UNITS FOR NEW VEHICLES", "EINHEITEN FÜR NEUE FAHRZEUGE", "UNITÉS POUR LES NOUVEAUX VÉHICULES", "UNITÀ PER I NUOVI VEICOLI", "UNIDADES PARA VEHÍCULOS NUEVOS", "ЕДИНИЦЫ ДЛЯ НОВЫХ АВТОМОБИЛЕЙ"],
  ["Οι μονάδες κάθε οχήματος αλλάζουν από την επεξεργασία του (✏️).", "Each vehicle's units can be changed from its edit screen (✏️).", "Die Einheiten jedes Fahrzeugs lassen sich über dessen Bearbeiten-Ansicht (✏️) ändern.", "Les unités de chaque véhicule se modifient depuis son écran d'édition (✏️).", "Le unità di ogni veicolo si cambiano dalla sua schermata di modifica (✏️).", "Las unidades de cada vehículo se cambian desde su pantalla de edición (✏️).", "Единицы каждого автомобиля меняются в его окне редактирования (✏️)."],
  ["⛽ Γεμίσματα καυσίμου με αυτόματο υπολογισμό λίτρων", "⛽ Fuel fill-ups with automatic volume calculation", "⛽ Tankfüllungen mit automatischer Mengenberechnung", "⛽ Pleins de carburant avec calcul automatique du volume", "⛽ Rifornimenti con calcolo automatico del volume", "⛽ Repostajes con cálculo automático del volumen", "⛽ Заправки с автоматическим расчётом объёма"],
  ["🛣️ Διόδια, Πομποδέκτης, Parking, Service, Ελαστικά & άλλα έξοδα", "🛣️ Tolls, transponder, parking, service, tyres & other expenses", "🛣️ Maut, Transponder, Parken, Service, Reifen & weitere Kosten", "🛣️ Péages, badge, parking, entretien, pneus et autres dépenses", "🛣️ Pedaggi, transponder, parcheggio, tagliando, pneumatici e altre spese", "🛣️ Peajes, dispositivo, parking, revisión, neumáticos y otros gastos", "🛣️ Платные дороги, транспондер, парковка, ТО, шины и другие расходы"],
  ["🧾 Κινήσεις: ενιαίο ιστορικό & ημερολόγιο", "🧾 Activity: combined history & calendar", "🧾 Verlauf: gemeinsame Übersicht & Kalender", "🧾 Historique : vue unifiée et calendrier", "🧾 Movimenti: storico unico e calendario", "🧾 Movimientos: historial unificado y calendario", "🧾 История: единый журнал и календарь"],
  ["📊 Στατιστικά, γραφήματα & ανάλυση κατανάλωσης", "📊 Statistics, charts & consumption analysis", "📊 Statistik, Diagramme & Verbrauchsanalyse", "📊 Statistiques, graphiques et analyse de la consommation", "📊 Statistiche, grafici e analisi dei consumi", "📊 Estadísticas, gráficos y análisis del consumo", "📊 Статистика, графики и анализ расхода"],
  ["🎉 Ανασκόπηση χρονιάς ανά όχημα", "🎉 Yearly review per vehicle", "🎉 Jahresrückblick pro Fahrzeug", "🎉 Bilan annuel par véhicule", "🎉 Riepilogo annuale per veicolo", "🎉 Resumen anual por vehículo", "🎉 Итоги года по каждому автомобилю"],
  ["🅿️ Πού παρκάρισα (GPS)", "🅿️ Where I parked (GPS)", "🅿️ Wo ich geparkt habe (GPS)", "🅿️ Où j'ai garé (GPS)", "🅿️ Dove ho parcheggiato (GPS)", "🅿️ Dónde aparqué (GPS)", "🅿️ Где я припарковался (GPS)"],
  ["🚗 Υποστήριξη πολλαπλών οχημάτων & 2 καυσίμων", "🚗 Multiple vehicles & 2 fuels", "🚗 Mehrere Fahrzeuge & 2 Kraftstoffe", "🚗 Plusieurs véhicules et 2 carburants", "🚗 Più veicoli e 2 carburanti", "🚗 Varios vehículos y 2 combustibles", "🚗 Несколько автомобилей и 2 вида топлива"],
  ["⚡ Βενζινοκίνητα, diesel, υβριδικά, plug-in & ηλεκτρικά", "⚡ Petrol, diesel, hybrid, plug-in & electric", "⚡ Benzin, Diesel, Hybrid, Plug-in & Elektro", "⚡ Essence, diesel, hybride, rechargeable et électrique", "⚡ Benzina, diesel, ibrido, plug-in ed elettrico", "⚡ Gasolina, diésel, híbrido, enchufable y eléctrico", "⚡ Бензин, дизель, гибрид, плагин-гибрид и электро"],
  ["½ Μερικά γεμίσματα με σωστό υπολογισμό κατανάλωσης", "½ Partial fill-ups with correct consumption calculation", "½ Teilbetankungen mit korrekter Verbrauchsberechnung", "½ Pleins partiels avec calcul de consommation correct", "½ Rifornimenti parziali con calcolo corretto dei consumi", "½ Repostajes parciales con cálculo correcto del consumo", "½ Частичные заправки с правильным расчётом расхода"],
  ["🔔 Υπενθυμίσεις ΚΤΕΟ, ασφάλειας, service, διπλώματος", "🔔 Reminders for inspection, insurance, service, licence", "🔔 Erinnerungen für HU, Versicherung, Service, Führerschein", "🔔 Rappels : contrôle technique, assurance, entretien, permis", "🔔 Promemoria per revisione, assicurazione, tagliando, patente", "🔔 Recordatorios de ITV, seguro, revisión, carnet", "🔔 Напоминания о техосмотре, страховке, ТО, правах"],
  ["💾 Εξαγωγή σε JSON, CSV, Excel, PDF", "💾 Export to JSON, CSV, Excel, PDF", "💾 Export als JSON, CSV, Excel, PDF", "💾 Export en JSON, CSV, Excel, PDF", "💾 Esportazione in JSON, CSV, Excel, PDF", "💾 Exportación a JSON, CSV, Excel, PDF", "💾 Экспорт в JSON, CSV, Excel, PDF"],
  ["📥 Εισαγωγή από Fuelio και από οποιαδήποτε εφαρμογή με CSV", "📥 Import from Fuelio and from any app with CSV", "📥 Import aus Fuelio und jeder App mit CSV", "📥 Importation depuis Fuelio et toute appli avec CSV", "📥 Importazione da Fuelio e da qualsiasi app con CSV", "📥 Importación desde Fuelio y cualquier app con CSV", "📥 Импорт из Fuelio и любого приложения с CSV"],
  ["Σχεδίαση & Ανάπτυξη", "Design & development", "Design & Entwicklung", "Conception et développement", "Progettazione e sviluppo", "Diseño y desarrollo", "Дизайн и разработка"],
  ["Ταχμαζίδης Κ. Γιώργος", "Tachmazidis K. Giorgos", "Tachmazidis K. Giorgos", "Tachmazidis K. Giorgos", "Tachmazidis K. Giorgos", "Tachmazidis K. Giorgos", "Тахмазидис К. Георгиос"],
  ["© 2026 · Όλα τα δικαιώματα διατηρούνται", "© 2026 · All rights reserved", "© 2026 · Alle Rechte vorbehalten", "© 2026 · Tous droits réservés", "© 2026 · Tutti i diritti riservati", "© 2026 · Todos los derechos reservados", "© 2026 · Все права защищены"],
  ["✏️ Επεξεργασία Οχήματος", "✏️ Edit vehicle", "✏️ Fahrzeug bearbeiten", "✏️ Modifier le véhicule", "✏️ Modifica veicolo", "✏️ Editar vehículo", "✏️ Редактирование автомобиля"],
  ["ΟΝΟΜΑ", "NAME", "NAME", "NOM", "NOME", "NOMBRE", "НАЗВАНИЕ"],
  ["ΚΥΡΙΟ ΚΑΥΣΙΜΟ", "MAIN FUEL", "HAUPTKRAFTSTOFF", "CARBURANT PRINCIPAL", "CARBURANTE PRINCIPALE", "COMBUSTIBLE PRINCIPAL", "ОСНОВНОЕ ТОПЛИВО"],
  ["Αν αλλάξεις μονάδες, οι υπάρχουσες εγγραφές μετατρέπονται αυτόματα.", "If you change units, existing entries are converted automatically.", "Wenn du Einheiten änderst, werden vorhandene Einträge automatisch umgerechnet.", "Si vous changez d'unités, les entrées existantes sont converties automatiquement.", "Se cambi le unità, le voci esistenti vengono convertite automaticamente.", "Si cambias las unidades, los registros existentes se convierten automáticamente.", "При смене единиц существующие записи пересчитываются автоматически."],
  ["🗑️ Διαγραφή Οχήματος", "🗑️ Delete vehicle", "🗑️ Fahrzeug löschen", "🗑️ Supprimer le véhicule", "🗑️ Elimina veicolo", "🗑️ Eliminar vehículo", "🗑️ Удалить автомобиль"],
  // ---- v2.17: διαδραστικά gauges ----
  ["👆 Πάτα ένα gauge για ιστορικό", "👆 Tap a gauge for its history", "👆 Tippe auf ein Instrument für den Verlauf", "👆 Touchez un compteur pour l'historique", "👆 Tocca un indicatore per lo storico", "👆 Toca un indicador para ver el historial", "👆 Нажмите на датчик, чтобы увидеть историю"],
  ["📈 Ιστορικό κατανάλωσης", "📈 Consumption history", "📈 Verbrauchsverlauf", "📈 Historique de consommation", "📈 Storico dei consumi", "📈 Historial de consumo", "📈 История расхода"],
  ["📈 Ιστορικό τιμής", "📈 Price history", "📈 Preisverlauf", "📈 Historique des prix", "📈 Storico dei prezzi", "📈 Historial de precios", "📈 История цены"],
  ["ΕΛΑΧΙΣΤΗ", "LOWEST", "NIEDRIGSTE", "PLUS BASSE", "PIÙ BASSA", "MÁS BAJA", "МИНИМУМ"],
  ["ΜΕΣΗ", "AVERAGE", "DURCHSCHNITT", "MOYENNE", "MEDIA", "MEDIA", "СРЕДНЯЯ"],
  ["ΜΕΓΙΣΤΗ", "HIGHEST", "HÖCHSTE", "PLUS HAUTE", "PIÙ ALTA", "MÁS ALTA", "МАКСИМУМ"],
  ["ΤΕΛΕΥΤΑΙΑ", "LATEST", "LETZTE", "DERNIÈRE", "ULTIMA", "ÚLTIMA", "ПОСЛЕДНЯЯ"],
  ["Η κατανάλωση υπολογίζεται από 2 διαδοχικά γεμίσματα «μέχρι πάνω» (φουλ) με αυξανόμενο ODO.", "Consumption is calculated from 2 consecutive full-tank fill-ups with increasing ODO.", "Der Verbrauch wird aus 2 aufeinanderfolgenden Volltankungen mit steigendem Kilometerstand berechnet.", "La consommation est calculée à partir de 2 pleins complets consécutifs avec un ODO croissant.", "Il consumo si calcola da 2 pieni completi consecutivi con ODO crescente.", "El consumo se calcula a partir de 2 repostajes consecutivos con depósito lleno y kilometraje creciente.", "Расход считается по 2 последовательным заправкам «до полного» с растущим пробегом."],
  ["Χρειάζονται τουλάχιστον 2 εγγραφές για γράφημα.", "At least 2 entries are needed for a chart.", "Für ein Diagramm sind mindestens 2 Einträge nötig.", "Il faut au moins 2 entrées pour un graphique.", "Servono almeno 2 voci per un grafico.", "Se necesitan al menos 2 registros para el gráfico.", "Для графика нужно минимум 2 записи."],
  // ---- v2.20: συγχώνευση & έλεγχος διπλοεγγραφών ----
  ["🔀 Συγχώνευση με τα υπάρχοντα", "🔀 Merge with existing data", "🔀 Mit vorhandenen Daten zusammenführen", "🔀 Fusionner avec les données existantes", "🔀 Unisci ai dati esistenti", "🔀 Combinar con los datos existentes", "🔀 Объединить с существующими"],
  ["⬆️ Αντικατάσταση όλων", "⬆️ Replace everything", "⬆️ Alles ersetzen", "⬆️ Tout remplacer", "⬆️ Sostituisci tutto", "⬆️ Reemplazar todo", "⬆️ Заменить всё"],
  ["✅ Συγχωνεύθηκαν: +{0} νέες · {1} ενημερώθηκαν · {2} διαγράφηκαν · {3} διπλές παραλείφθηκαν", "✅ Merged: +{0} new · {1} updated · {2} removed · {3} duplicates skipped", "✅ Zusammengeführt: +{0} neu · {1} aktualisiert · {2} entfernt · {3} Duplikate übersprungen", "✅ Fusionné : +{0} nouvelles · {1} mises à jour · {2} supprimées · {3} doublons ignorés", "✅ Unito: +{0} nuove · {1} aggiornate · {2} rimosse · {3} duplicati ignorati", "✅ Combinado: +{0} nuevos · {1} actualizados · {2} eliminados · {3} duplicados omitidos", "✅ Объединено: +{0} новых · {1} обновлено · {2} удалено · {3} дубликатов пропущено"],
  ["{0} διπλοεγγραφές παραλείφθηκαν.", "{0} duplicate entries were skipped.", "{0} doppelte Einträge wurden übersprungen.", "{0} doublons ont été ignorés.", "{0} voci duplicate sono state ignorate.", "Se omitieron {0} registros duplicados.", "Пропущено дубликатов: {0}."],
  ["✅ Προστέθηκαν στο «{0}»: {1} γεμίσματα, {2} έξοδα.", "✅ Added to “{0}”: {1} fill-ups, {2} expenses.", "✅ Zu „{0}“ hinzugefügt: {1} Tankfüllungen, {2} Ausgaben.", "✅ Ajouté à « {0} » : {1} pleins, {2} dépenses.", "✅ Aggiunti a «{0}»: {1} rifornimenti, {2} spese.", "✅ Añadido a «{0}»: {1} repostajes, {2} gastos.", "✅ Добавлено в «{0}»: заправок — {1}, расходов — {2}."],
  ["✅ Προστέθηκαν στο «{0}»: {1} γεμίσματα.", "✅ Added to “{0}”: {1} fill-ups.", "✅ Zu „{0}“ hinzugefügt: {1} Tankfüllungen.", "✅ Ajouté à « {0} » : {1} pleins.", "✅ Aggiunti a «{0}»: {1} rifornimenti.", "✅ Añadido a «{0}»: {1} repostajes.", "✅ Добавлено в «{0}»: заправок — {1}."],
  ["🔀 Η συγχώνευση κρατά ό,τι υπάρχει, προσθέτει ό,τι λείπει και προσπερνά τις διπλοεγγραφές (ίδια ημερομηνία, είδος, ποσό). Η αντικατάσταση σβήνει τα τωρινά δεδομένα.", "🔀 Merge keeps what you have, adds what is missing and skips duplicates (same date, type, amount). Replace erases your current data.", "🔀 Zusammenführen behält Vorhandenes, ergänzt Fehlendes und überspringt Duplikate (gleiches Datum, gleiche Art, gleicher Betrag). Ersetzen löscht die aktuellen Daten.", "🔀 La fusion conserve l'existant, ajoute ce qui manque et ignore les doublons (même date, type, montant). Le remplacement efface les données actuelles.", "🔀 L'unione mantiene ciò che hai, aggiunge ciò che manca e ignora i duplicati (stessa data, tipo, importo). La sostituzione cancella i dati attuali.", "🔀 Combinar conserva lo que tienes, añade lo que falta y omite duplicados (misma fecha, tipo e importe). Reemplazar borra los datos actuales.", "🔀 Объединение сохраняет имеющееся, добавляет недостающее и пропускает дубликаты (та же дата, тип, сумма). Замена стирает текущие данные."],
  ["🔀 Συγχώνευση αντιγράφων & έλεγχος διπλοεγγραφών στην εισαγωγή", "🔀 Backup merging & duplicate check on import", "🔀 Sicherungen zusammenführen & Duplikatprüfung beim Import", "🔀 Fusion des sauvegardes et contrôle des doublons à l'importation", "🔀 Unione dei backup e controllo dei duplicati all'importazione", "🔀 Combinación de copias y control de duplicados al importar", "🔀 Объединение копий и проверка дубликатов при импорте"],
  // ---- v2.21: οθόνη υποδοχής ----
  ["Καλώς ήρθες στο FuelLog", "Welcome to FuelLog", "Willkommen bei FuelLog", "Bienvenue dans FuelLog", "Benvenuto in FuelLog", "Te damos la bienvenida a FuelLog", "Добро пожаловать в FuelLog"],
  ["Τα καύσιμα και τα έξοδα του αυτοκινήτου σου, απλά και σε ένα μέρος.", "Your car's fuel and expenses, simple and in one place.", "Kraftstoff und Kosten deines Autos – einfach und an einem Ort.", "Le carburant et les dépenses de votre voiture, simplement et au même endroit.", "Carburante e spese della tua auto, in modo semplice e in un unico posto.", "El combustible y los gastos de tu coche, de forma sencilla y en un solo lugar.", "Топливо и расходы на автомобиль — просто и в одном месте."],
  ["Επόμενο", "Next", "Weiter", "Suivant", "Avanti", "Siguiente", "Далее"],
  ["Πίσω", "Back", "Zurück", "Retour", "Indietro", "Atrás", "Назад"],
  ["Παράλειψη", "Skip", "Überspringen", "Passer", "Salta", "Omitir", "Пропустить"],
  ["Ξεκινάμε!", "Let's go!", "Los geht's!", "C'est parti !", "Iniziamo!", "¡Empezamos!", "Начнём!"],
  ["Όλα για το αυτοκίνητό σου", "Everything for your car", "Alles für dein Auto", "Tout pour votre voiture", "Tutto per la tua auto", "Todo para tu coche", "Всё для вашего автомобиля"],
  ["Γεμίσματα & κατανάλωση", "Fill-ups & consumption", "Tankfüllungen & Verbrauch", "Pleins & consommation", "Rifornimenti e consumi", "Repostajes y consumo", "Заправки и расход"],
  ["Αυτόματος υπολογισμός λίτρων και κατανάλωσης", "Automatic volume and consumption calculation", "Automatische Berechnung von Menge und Verbrauch", "Calcul automatique du volume et de la consommation", "Calcolo automatico di volume e consumi", "Cálculo automático de volumen y consumo", "Автоматический расчёт объёма и расхода"],
  ["Όλα τα έξοδα", "All expenses", "Alle Kosten", "Toutes les dépenses", "Tutte le spese", "Todos los gastos", "Все расходы"],
  ["Διόδια, service, ασφάλεια, ελαστικά και άλλα", "Tolls, service, insurance, tyres and more", "Maut, Service, Versicherung, Reifen und mehr", "Péages, entretien, assurance, pneus et plus", "Pedaggi, tagliando, assicurazione, pneumatici e altro", "Peajes, revisión, seguro, neumáticos y más", "Платные дороги, ТО, страховка, шины и не только"],
  ["Υπενθυμίσεις", "Reminders", "Erinnerungen", "Rappels", "Promemoria", "Recordatorios", "Напоминания"],
  ["ΚΤΕΟ, ασφάλεια, service, δίπλωμα", "Inspection, insurance, service, licence", "HU, Versicherung, Service, Führerschein", "Contrôle technique, assurance, entretien, permis", "Revisione, assicurazione, tagliando, patente", "ITV, seguro, revisión, carnet", "Техосмотр, страховка, ТО, права"],
  ["Γραφήματα, ημερολόγιο και ανασκόπηση χρονιάς", "Charts, calendar and yearly review", "Diagramme, Kalender und Jahresrückblick", "Graphiques, calendrier et bilan annuel", "Grafici, calendario e riepilogo annuale", "Gráficos, calendario y resumen anual", "Графики, календарь и итоги года"],
  ["🚗 Πολλά οχήματα · ⚡ Και ηλεκτρικά ή υβριδικά", "🚗 Multiple vehicles · ⚡ Electric and hybrid too", "🚗 Mehrere Fahrzeuge · ⚡ Auch Elektro und Hybrid", "🚗 Plusieurs véhicules · ⚡ Aussi électriques et hybrides", "🚗 Più veicoli · ⚡ Anche elettriche e ibride", "🚗 Varios vehículos · ⚡ También eléctricos e híbridos", "🚗 Несколько авто · ⚡ Есть электро и гибриды"],
  ["Τα δεδομένα σου μένουν δικά σου", "Your data stays yours", "Deine Daten bleiben bei dir", "Vos données restent les vôtres", "I tuoi dati restano tuoi", "Tus datos siguen siendo tuyos", "Ваши данные остаются вашими"],
  ["Αποθηκεύονται μόνο σε αυτή τη συσκευή. Δεν χρειάζεται λογαριασμός.", "They are stored only on this device. No account needed.", "Sie werden nur auf diesem Gerät gespeichert. Kein Konto nötig.", "Elles sont enregistrées uniquement sur cet appareil. Aucun compte requis.", "Vengono salvati solo su questo dispositivo. Nessun account necessario.", "Se guardan solo en este dispositivo. No necesitas cuenta.", "Они хранятся только на этом устройстве. Аккаунт не нужен."],
  ["Λειτουργεί και χωρίς internet", "Works without internet too", "Funktioniert auch ohne Internet", "Fonctionne aussi sans internet", "Funziona anche senza internet", "Funciona también sin internet", "Работает и без интернета"],
  ["Κάνε αντίγραφο ασφαλείας από το κουμπί 💾 πάνω δεξιά", "Back up with the 💾 button at the top right", "Erstelle eine Sicherung mit der 💾-Taste oben rechts", "Faites une sauvegarde avec le bouton 💾 en haut à droite", "Fai un backup con il pulsante 💾 in alto a destra", "Haz una copia con el botón 💾 de arriba a la derecha", "Делайте резервную копию кнопкой 💾 вверху справа"],
  ["Φέρε τα δεδομένα σου σε άλλη συσκευή με συγχώνευση", "Move your data to another device with merge", "Übertrage deine Daten per Zusammenführen auf ein anderes Gerät", "Transférez vos données vers un autre appareil grâce à la fusion", "Sposta i dati su un altro dispositivo con l'unione", "Lleva tus datos a otro dispositivo con la combinación", "Перенесите данные на другое устройство через объединение"],
  ["Τη γλώσσα και το νόμισμα τα αλλάζεις όποτε θες από το ℹ️ Σχετικά και ρυθμίσεις.", "You can change language and currency anytime in ℹ️ About & settings.", "Sprache und Währung kannst du jederzeit unter ℹ️ Info & Einstellungen ändern.", "Vous pouvez changer la langue et la devise à tout moment dans ℹ️ À propos et réglages.", "Puoi cambiare lingua e valuta quando vuoi da ℹ️ Info e impostazioni.", "Puedes cambiar el idioma y la moneda cuando quieras en ℹ️ Acerca de y ajustes.", "Язык и валюту можно изменить в любой момент в ℹ️ О приложении и настройки."],
  ["💾 Τα δεδομένα αποθηκεύονται μόνο σε αυτή τη συσκευή. Κάνε τακτικά αντίγραφο ασφαλείας από το κουμπί 💾 πάνω.", "💾 Your data is stored only on this device. Back up regularly with the 💾 button at the top.", "💾 Deine Daten werden nur auf diesem Gerät gespeichert. Erstelle regelmäßig eine Sicherung mit der 💾-Taste oben.", "💾 Vos données sont enregistrées uniquement sur cet appareil. Faites régulièrement une sauvegarde avec le bouton 💾 en haut.", "💾 I dati sono salvati solo su questo dispositivo. Fai backup regolari con il pulsante 💾 in alto.", "💾 Tus datos se guardan solo en este dispositivo. Haz copias con regularidad con el botón 💾 de arriba.", "💾 Данные хранятся только на этом устройстве. Регулярно делайте копию кнопкой 💾 вверху."],
  ["👋 Δες ξανά την υποδοχή", "👋 View the welcome again", "👋 Willkommen erneut ansehen", "👋 Revoir l'accueil", "👋 Rivedi il benvenuto", "👋 Ver la bienvenida otra vez", "👋 Показать приветствие снова"],
  ["Ερωτήσεις ή προτάσεις;", "Questions or suggestions?", "Fragen oder Vorschläge?", "Des questions ou des suggestions ?", "Domande o suggerimenti?", "¿Preguntas o sugerencias?", "Вопросы или предложения?"],
];
["en","de","fr","it","es","ru"].forEach((l,i)=>{LANG_DICTS[l]=Object.create(null);I18N_ROWS.forEach(r=>{LANG_DICTS[l][r[0]]=r[i+1];});});
