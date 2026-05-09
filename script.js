'use strict';
const S={
  surah:null,ayah:1,lang:'en.sahih',reciter:'ar.alafasy',
  prayers:{},adhan:JSON.parse(localStorage.getItem('mik_adhan')||'{"Fajr":true,"Dhuhr":false,"Asr":false,"Maghrib":true,"Isha":true}'),
  bookmarks:JSON.parse(localStorage.getItem('mik_bm')||'[]'),
  tCount:0,tTarget:33,tSets:0,tTotal:0,
  zikr:{ar:'سُبْحَانَ اللَّهِ',name:'SubhanAllah'},
  playing:false,repeat:false,asz:26,
  theme:localStorage.getItem('mik_theme')||'dark',
  allSurahs:[],cache:{},tafsirMode:false,
  lastRead:JSON.parse(localStorage.getItem('mik_lr')||'null'),
  lat:null,lon:null,pageMode:false,currentPage:1,
};

window.addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  setTimeout(()=>{
    const sp=document.getElementById('splash');
    if(sp){sp.style.transition='opacity 0.6s';sp.style.opacity='0';}
    setTimeout(()=>{if(sp)sp.style.display='none';showPage('page-home');},600);
  },2800);
  startClock();loadHijri();getLocation();
  loadSurahs();loadNames();loadProphetNames();
  setupAdhanToggles();renderBookmarks();renderLastRead();
  // init tasbeeh ring
  const prog=document.getElementById('t-prog');
  if(prog){const c=2*Math.PI*95;prog.style.strokeDasharray=c;prog.style.strokeDashoffset=c;}
});

function showToast(msg,dur=2800){
  let t=document.getElementById('mik-toast');
  if(!t){t=document.createElement('div');t.id='mik-toast';
    t.style.cssText='position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:rgba(15,13,8,0.97);color:#f5d07a;padding:9px 20px;border-radius:20px;font-size:13px;z-index:99999;border:1px solid rgba(201,150,58,0.3);pointer-events:none;transition:opacity 0.3s;white-space:nowrap;max-width:90vw;text-align:center;';
    document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',dur);
}

function applyTheme(){document.documentElement.setAttribute('data-theme',S.theme==='light'?'light':'');}
function toggleTheme(){
  S.theme=S.theme==='dark'?'light':'dark';
  localStorage.setItem('mik_theme',S.theme);applyTheme();
  const b=document.getElementById('theme-btn');if(b)b.textContent=S.theme==='dark'?'☀️':'🌙';
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const p=document.getElementById(id);if(p)p.classList.remove('hidden');
  if(id==='page-bookmarks')renderBookmarks();
  if(id==='page-tafsir-home')loadTafsirSurahList();
  if(id==='page-hijri')renderHijriPage();
  if(id==='page-dhikr')renderDhikrList();
}
function setNav(el){
  const nav=el.closest('.bnav');
  if(nav)nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
}
function toggleSearch(){
  const b=document.getElementById('sbar');
  if(b){b.classList.toggle('hidden');if(!b.classList.contains('hidden'))document.getElementById('sinput').focus();}
}
function filterSurahs(){
  const q=(document.getElementById('sinput').value||'').toLowerCase();
  renderSurahList(S.allSurahs.filter(s=>s.englishName.toLowerCase().includes(q)||s.englishNameTranslation.toLowerCase().includes(q)||String(s.number).includes(q)));
}
function setTab(el,type){
  el.closest('.jtabs').querySelectorAll('.jtab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if(type==='surah')renderSurahList(S.allSurahs);
  else if(type==='fav'){const fn=S.bookmarks.filter(b=>!b.ayahNum).map(b=>b.surahNum);renderSurahList(S.allSurahs.filter(s=>fn.includes(s.number)));}
  else if(type==='juz')renderJuzList();
}

// CLOCK
function startClock(){
  const tick=()=>{
    const n=new Date(),h=String(n.getHours()).padStart(2,'0'),m=String(n.getMinutes()).padStart(2,'0');
    const el=document.getElementById('current-time');if(el)el.textContent=`${h}:${m}`;
    updateNextPrayer();
  };tick();setInterval(tick,1000);
}

// HIJRI
const HM=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaʿban','Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah'];
const HM_AR=['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'];
const ML=[30,29,30,29,30,29,30,29,30,29,30,29];

function toHijri(y,m,d){
  if(m<=2){y--;m+=12;}
  const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
  const jd=Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524;
  const z=jd-1948440+10632,n=Math.floor((z-1)/10631),zz=z-10631*n+354;
  const j=Math.floor((10985-zz)/5316)*Math.floor(50*zz/17719)+Math.floor(zz/5670)*Math.floor(43*zz/15238);
  const zzz=zz-Math.floor((30-j)/15)*Math.floor(17719*j/50)-Math.floor(j/16)*Math.floor(15238*j/43)+29;
  const hm=Math.floor(24*zzz/709);
  return{y:30*n+j-30,m:hm,d:zzz-Math.floor(709*hm/24)};
}
function daysTo(h,target){
  let days=ML[h.m-1]-h.d,m=h.m%12+1;
  while(m!==target){days+=ML[m-1];m=m%12+1;}
  return days+1;
}
function loadHijri(){
  try{
    const now=new Date(),h=toHijri(now.getFullYear(),now.getMonth()+1,now.getDate());
    const el=document.getElementById('hijri-today');
    if(el)el.textContent=`${h.d} ${HM[h.m-1]} ${h.y} AH`;
    calcEvents(h);
  }catch(e){const el=document.getElementById('hijri-today');if(el)el.textContent='Islamic Calendar';}
}
function calcEvents(h){
  const r=document.getElementById('ramadan-txt'),e=document.getElementById('eid-txt');
  if(h.m===9){const rem=30-h.d;if(r)r.textContent=rem>0?`Ramadan: ${rem} days left 🌙`:'Ramadan: Last day! 🌙';}
  else{const d=daysTo(h,9);if(r)r.textContent=`Ramadan in ~${d} days 🌙`;}
  if(h.m===10&&h.d<=3){if(e)e.textContent=`Eid al-Fitr: Day ${h.d}! 🎉`;}
  else if(h.m===9){if(e)e.textContent=`Eid al-Fitr in ${30-h.d+1} days 🎁`;}
  else{if(e)e.textContent='Eid al-Fitr: Shawwal 1 🎁';}
}
function renderHijriPage(){
  const c=document.getElementById('hijri-page-content');if(!c)return;
  const now=new Date(),h=toHijri(now.getFullYear(),now.getMonth()+1,now.getDate());
  const events=[
    {m:1,d:1,name:'Islamic New Year',ar:'رأس السنة الهجرية',icon:'🌙'},
    {m:1,d:10,name:'Day of Ashura',ar:'يوم عاشوراء',icon:'✨'},
    {m:3,d:12,name:'Mawlid al-Nabi ﷺ',ar:'المولد النبوي الشريف',icon:'💚'},
    {m:7,d:27,name:'Isra & Miraj',ar:'الإسراء والمعراج',icon:'⭐'},
    {m:8,d:15,name:'Shab-e-Barat',ar:'ليلة البراءة',icon:'🌟'},
    {m:9,d:1,name:'Ramadan Begins',ar:'بداية رمضان المبارك',icon:'🌙'},
    {m:9,d:21,name:'Last 10 Nights',ar:'العشر الأواخر من رمضان',icon:'🤲'},
    {m:9,d:27,name:'Laylat al-Qadr',ar:'ليلة القدر',icon:'✨'},
    {m:10,d:1,name:'Eid al-Fitr',ar:'عيد الفطر المبارك',icon:'🎉'},
    {m:12,d:9,name:'Day of Arafah',ar:'يوم عرفة المبارك',icon:'🕋'},
    {m:12,d:10,name:'Eid al-Adha',ar:'عيد الأضحى المبارك',icon:'🐑'},
    {m:12,d:18,name:'End of Hajj',ar:'انتهاء موسم الحج',icon:'🕌'},
  ];
  let html=`<div class="hijri-hero">
    <div class="hh-ar">${HM_AR[h.m-1]}</div>
    <div class="hh-date">${h.d}</div>
    <div class="hh-year">${h.y} AH · ${HM[h.m-1]}</div>
    <div class="hh-greg">${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
  </div><div class="sec-hdr" style="padding:12px 20px 6px">Islamic Events</div>`;
  events.forEach(ev=>{
    const ea=ev.m*30+ev.d,ca=h.m*30+h.d;let diff=ea-ca;if(diff<0)diff+=354;
    const today=ev.m===h.m&&ev.d===h.d;
    const badge=today?'<span class="ev-badge today-badge">TODAY 🌟</span>':diff>0?`<span class="ev-badge">${diff}d away</span>`:'<span class="ev-badge passed-badge">Passed</span>';
    html+=`<div class="ev-card"><div class="ev-icon">${ev.icon}</div><div class="ev-info"><div class="ev-name">${ev.name}</div><div class="ev-ar">${ev.ar}</div><div class="ev-date">${ev.d} ${HM[ev.m-1]}</div></div>${badge}</div>`;
  });
  html+=`<div class="sec-hdr" style="padding:12px 20px 6px">Hijri Months</div><div class="months-grid">`;
  HM.forEach((mn,i)=>{html+=`<div class="month-pill ${i+1===h.m?'active':''}"><div class="mp-num">${i+1}</div><div class="mp-ar">${HM_AR[i]}</div><div class="mp-en">${mn}</div></div>`;});
  html+=`</div>`;c.innerHTML=html;
}

// LOCATION & PRAYER
function getLocation(){
  if(!navigator.geolocation){fetchPrayers(21.3891,39.8579);return;}
  navigator.geolocation.getCurrentPosition(pos=>{
    S.lat=pos.coords.latitude;S.lon=pos.coords.longitude;
    fetchPrayers(S.lat,S.lon);reverseGeo(S.lat,S.lon);
  },()=>{fetchPrayers(21.3891,39.8579);const l=document.getElementById('prayer-loc');if(l)l.textContent='📍 Mecca (default)';});
}
function reverseGeo(lat,lon){
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    .then(r=>r.json()).then(d=>{
      const city=d.address.city||d.address.town||d.address.village||'Your City';
      const l=document.getElementById('prayer-loc');if(l)l.textContent=`📍 ${city}, ${d.address.country||''}`;
    }).catch(()=>{});
}
function fetchPrayers(lat,lon){
  const now=new Date();
  fetch(`https://api.aladhan.com/v1/timings/${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}?latitude=${lat}&longitude=${lon}&method=2`)
    .then(r=>r.json()).then(d=>{
      const t=d.data.timings;
      S.prayers={Fajr:t.Fajr,Sunrise:t.Sunrise,Dhuhr:t.Dhuhr,Asr:t.Asr,Maghrib:t.Maghrib,Isha:t.Isha};
      renderPrayers();scheduleAdhans();
    }).catch(()=>{});
}
function fmt12(t24){
  if(!t24)return'--:--';
  const[h,m]=t24.split(':').map(Number),ap=h>=12?'PM':'AM',h12=h%12||12;
  return`${h12}:${String(m).padStart(2,'0')} ${ap}`;
}
function renderPrayers(){
  const p=S.prayers;
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    const id=name.toLowerCase();
    const pi=document.getElementById(`p-${id}`);if(pi&&p[name])pi.textContent=fmt12(p[name]);
    const fp=document.getElementById(`fpt-${id}`);if(fp&&p[name])fp.textContent=fmt12(p[name]);
  });
  if(p.Sunrise){const s=document.getElementById('fpt-sunrise');if(s)s.textContent=fmt12(p.Sunrise);}
  updateNextPrayer();
}
function updateNextPrayer(){
  const names=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const now=new Date(),nm=now.getHours()*60+now.getMinutes();
  document.querySelectorAll('.fp-item').forEach(i=>i.classList.remove('next'));
  document.querySelectorAll('.ppill').forEach(i=>i.classList.remove('active'));
  for(const name of names){
    const t=S.prayers[name];if(!t)continue;
    const[h,m]=t.split(':').map(Number),pm=h*60+m;
    if(pm>nm){
      const rem=pm-nm,hrs=Math.floor(rem/60),mins=rem%60;
      const el=document.getElementById('next-prayer-name'),tel=document.getElementById('next-prayer-time');
      if(el)el.textContent=name;
      if(tel)tel.textContent=`${fmt12(t)} · in ${hrs>0?hrs+'h ':''} ${mins}m`;
      const fp=document.getElementById(`fp-${name.toLowerCase()}`);if(fp)fp.classList.add('next');
      return;
    }
  }
  const el=document.getElementById('next-prayer-name'),tel=document.getElementById('next-prayer-time');
  if(el)el.textContent='Fajr (Tomorrow)';
  if(tel&&S.prayers.Fajr)tel.textContent=fmt12(S.prayers.Fajr);
}
function scheduleAdhans(){
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    if(!S.prayers[name]||!S.adhan[name])return;
    const[h,m]=S.prayers[name].split(':').map(Number);
    const now=new Date(),pt=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0),delay=pt-now;
    if(delay>0&&delay<86400000){
      setTimeout(()=>{
        const a=document.getElementById('adhan-audio');
        if(a){a.currentTime=0;a.play().catch(()=>{});}
        showToast(`🕌 ${name} Prayer Time — الله أكبر`,7000);
        if(navigator.vibrate)navigator.vibrate([300,100,300,100,300]);
      },delay);
    }
  });
}
function setupAdhanToggles(){
  const list=document.getElementById('adhan-list');if(!list)return;list.innerHTML='';
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    const d=document.createElement('div');d.className='adhan-item';
    d.innerHTML=`<div class="adhan-item-l"><span class="adhan-dot"></span><span>${name}</span></div>
      <button class="toggle ${S.adhan[name]?'on':''}" onclick="toggleAdhan('${name}',this)"></button>`;
    list.appendChild(d);
  });
}
function toggleAdhan(name,btn){
  S.adhan[name]=!S.adhan[name];btn.classList.toggle('on',S.adhan[name]);
  localStorage.setItem('mik_adhan',JSON.stringify(S.adhan));
  showToast(S.adhan[name]?`🔔 ${name} Adhan ON`:`🔕 ${name} Adhan OFF`);
}

// SURAH LIST
function loadSurahs(){
  fetch('https://api.alquran.cloud/v1/surah').then(r=>r.json()).then(d=>{
    S.allSurahs=d.data;renderSurahList(d.data);loadTafsirSurahList();
  }).catch(()=>showToast('No internet connection'));
}
function renderSurahList(surahs){
  const c=document.getElementById('surah-list');if(!c)return;c.innerHTML='';
  if(!surahs.length){c.innerHTML='<div class="empty-state"><div class="empty-ico">📭</div><div>No surahs found</div></div>';return;}
  surahs.forEach(s=>{
    const d=document.createElement('div');d.className='si';
    d.onclick=()=>openSurah(s.number,s.name,s.englishName,s.numberOfAyahs,s.revelationType);
    d.innerHTML=`<div class="si-num">${s.number}</div><div class="si-info"><div class="si-en">${s.englishName}</div><div class="si-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses · ${s.revelationType}</div></div><div class="si-ar">${s.name}</div>`;
    c.appendChild(d);
  });
}
function renderJuzList(){
  const c=document.getElementById('surah-list');if(!c)return;c.innerHTML='';
  const jd=[
    {j:1,f:'Al-Fatihah 1',t:'Al-Baqarah 141'},{j:2,f:'Al-Baqarah 142',t:'Al-Baqarah 252'},
    {j:3,f:'Al-Baqarah 253',t:'Al-Imran 92'},{j:4,f:'Al-Imran 93',t:'An-Nisa 23'},
    {j:5,f:'An-Nisa 24',t:'An-Nisa 147'},{j:6,f:'An-Nisa 148',t:'Al-Maidah 81'},
    {j:7,f:'Al-Maidah 82',t:'Al-Anam 110'},{j:8,f:'Al-Anam 111',t:'Al-Araf 87'},
    {j:9,f:'Al-Araf 88',t:'Al-Anfal 40'},{j:10,f:'Al-Anfal 41',t:'At-Tawbah 92'},
    {j:11,f:'At-Tawbah 93',t:'Hud 5'},{j:12,f:'Hud 6',t:'Yusuf 52'},
    {j:13,f:'Yusuf 53',t:'Ibrahim 52'},{j:14,f:'Al-Hijr 1',t:'An-Nahl 128'},
    {j:15,f:'Al-Isra 1',t:'Al-Kahf 74'},{j:16,f:'Al-Kahf 75',t:'Ta-Ha 135'},
    {j:17,f:'Al-Anbiya 1',t:'Al-Hajj 78'},{j:18,f:'Al-Muminun 1',t:'Al-Furqan 20'},
    {j:19,f:'Al-Furqan 21',t:'An-Naml 55'},{j:20,f:'An-Naml 56',t:'Al-Ankabut 45'},
    {j:21,f:'Al-Ankabut 46',t:'Al-Ahzab 30'},{j:22,f:'Al-Ahzab 31',t:'Ya-Sin 27'},
    {j:23,f:'Ya-Sin 28',t:'Az-Zumar 31'},{j:24,f:'Az-Zumar 32',t:'Fussilat 46'},
    {j:25,f:'Fussilat 47',t:'Al-Jathiya 37'},{j:26,f:'Al-Ahqaf 1',t:'Adh-Dhariyat 30'},
    {j:27,f:'Adh-Dhariyat 31',t:'Al-Hadid 29'},{j:28,f:'Al-Mujadila 1',t:'At-Tahrim 12'},
    {j:29,f:'Al-Mulk 1',t:'Al-Mursalat 50'},{j:30,f:'An-Naba 1',t:'An-Nas 6'},
  ];
  jd.forEach(juz=>{
    const d=document.createElement('div');d.className='si';
    d.onclick=()=>showToast(`Juz ${juz.j} full reader coming soon! 🌟`);
    d.innerHTML=`<div class="si-num">${juz.j}</div><div class="si-info"><div class="si-en">Juz ${juz.j}</div><div class="si-meta">${juz.f} → ${juz.t}</div></div><div class="si-ar">جزء ${juz.j}</div>`;
    c.appendChild(d);
  });
}

// READER
function openSurah(num,nameAr,nameEn,ayahCount,type){
  S.surah={num,nameAr,nameEn,ayahCount,type};S.ayah=1;S.pageMode=false;S.currentPage=1;
  document.getElementById('reader-title').textContent=nameEn;
  document.getElementById('reader-sub').textContent=`${nameAr} · ${ayahCount} verses`;
  document.getElementById('bismillah-el').style.display=num===9?'none':'block';
  updateBmBtn();saveLastRead(num,nameAr,nameEn,1,ayahCount);
  showPage('page-reader');loadReader(num);
}
function loadReader(num){
  const c=document.getElementById('ayah-content');
  c.innerHTML=`<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>`;
  const key=num+'_'+S.lang;
  if(S.cache[key]){renderAyahs(S.cache[key]);return;}
  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${num}`).then(r=>r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${num}/${S.lang}`).then(r=>r.json())
  ]).then(([ar,tr])=>{
    const combined=ar.data.ayahs.map((a,i)=>({n:a.numberInSurah,ar:a.text,tr:tr.data.ayahs[i]?.text||''}));
    S.cache[key]=combined;renderAyahs(combined);
  }).catch(()=>{c.innerHTML='<div class="loading-state">Failed to load. Check internet.</div>';});
}
function renderAyahs(ayahs){
  const c=document.getElementById('ayah-content');c.innerHTML='';
  const pmBtn=document.getElementById('page-mode-btn');
  if(pmBtn)pmBtn.textContent=S.pageMode?'📜':'📄';
  if(S.pageMode){renderPageMode(ayahs);return;}
  ayahs.forEach(a=>{
    const d=document.createElement('div');d.className='ayah-item';d.id=`ay-${a.n}`;
    d.innerHTML=`<div class="ayah-top">
      <div class="ayah-num">${a.n}</div>
      <div class="ayah-acts">
        <button class="aab" onclick="playAyah(${a.n})">▶</button>
        <button class="aab" onclick="openTafsirSheet(${a.n},'${esc(a.ar)}')">📚</button>
        <button class="aab" onclick="bmAyah(${a.n})">🔖</button>
        <button class="aab" onclick="copyAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')">📋</button>
        <button class="aab" onclick="shareAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')">📤</button>
      </div></div>
      <div class="ayah-arabic" style="font-size:${S.asz}px">${a.ar}</div>
      <div class="ayah-trans">${a.tr}</div>
      ${S.tafsirMode?`<div class="ayah-tafsir-inline" id="ti-${a.n}"><span class="tafsir-label">📚 IBN KATHIR TAFSIR</span><div id="ti-txt-${a.n}">Loading...</div></div>`:''}`;
    c.appendChild(d);
    if(S.tafsirMode)loadInlineTafsir(a.n,S.surah?.num);
  });
}

// PAGE MODE
function toArabicNum(n){return String(n).split('').map(d=>'٠١٢٣٤٥٦٧٨٩'[d]).join('');}
function renderPageMode(ayahs){
  const c=document.getElementById('ayah-content');c.innerHTML='';
  const PPP=10,total=Math.ceil(ayahs.length/PPP);
  const start=(S.currentPage-1)*PPP,pg=ayahs.slice(start,start+PPP);
  const page=document.createElement('div');page.className='mushaf-page';
  const ab=document.createElement('div');ab.className='mushaf-arabic';
  pg.forEach(a=>{ab.innerHTML+=`<span class="mushaf-ayah" id="may-${a.n}">${a.ar}<span class="ayah-marker"> ﴿${toArabicNum(a.n)}﴾ </span></span>`;});
  page.appendChild(ab);
  const tb=document.createElement('div');tb.className='mushaf-trans';
  pg.forEach(a=>{tb.innerHTML+=`<div class="mushaf-trans-row"><span class="mtr-num">${a.n}.</span><span>${a.tr}</span></div>`;});
  page.appendChild(tb);
  const nav=document.createElement('div');nav.className='page-nav';
  nav.innerHTML=`<button class="pnav-btn" onclick="changePage(-1)" ${S.currentPage<=1?'disabled':''}>‹ Prev</button>
    <span class="pnav-info">Page ${S.currentPage} / ${total}</span>
    <button class="pnav-btn" onclick="changePage(1)" ${S.currentPage>=total?'disabled':''}>Next ›</button>`;
  page.appendChild(nav);c.appendChild(page);
}
function changePage(dir){
  const key=S.surah.num+'_'+S.lang,ayahs=S.cache[key];if(!ayahs)return;
  const total=Math.ceil(ayahs.length/10);
  S.currentPage=Math.max(1,Math.min(total,S.currentPage+dir));
  renderPageMode(ayahs);document.getElementById('ayah-content').scrollTop=0;
}
function togglePageMode(){
  S.pageMode=!S.pageMode;S.currentPage=1;
  if(S.surah)loadReader(S.surah.num);
  showToast(S.pageMode?'📄 Page Mode ON':'📜 Verse Mode ON');
}

function esc(s){return(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/`/g,"'");}
function changeLang(){S.lang=document.getElementById('lang-sel').value;S.cache={};if(S.surah)loadReader(S.surah.num);}
function changeReciter(){S.reciter=document.getElementById('reciter-sel').value;if(S.playing)playAyah(S.ayah);}
function changeFontSize(d){S.asz=Math.max(18,Math.min(44,S.asz+d));document.querySelectorAll('.ayah-arabic,.mushaf-arabic').forEach(el=>el.style.fontSize=S.asz+'px');}

// TAFSIR
function toggleTafsirMode(){
  S.tafsirMode=!S.tafsirMode;
  const btn=document.getElementById('tafsir-mode-btn');if(btn)btn.classList.toggle('active',S.tafsirMode);
  if(S.surah)loadReader(S.surah.num);
  showToast(S.tafsirMode?'Tafsir ON 📚':'Tafsir OFF');
}
function loadInlineTafsir(ayahNu
