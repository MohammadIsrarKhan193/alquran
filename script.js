'use strict';
const S={
  surah:null,ayah:1,lang:'en.sahih',reciter:'ar.alafasy',tafsirLang:'en.ibn-kathir',
  prayers:{},adhan:JSON.parse(localStorage.getItem('mik_adhan')||'{"Fajr":true,"Dhuhr":false,"Asr":false,"Maghrib":true,"Isha":true}'),
  bookmarks:JSON.parse(localStorage.getItem('mik_bm')||'[]'),
  tCount:0,tTarget:33,tSets:0,tTotal:0,
  playing:false,repeat:false,asz:26,
  theme:localStorage.getItem('mik_theme')||'dark',
  allSurahs:[],cache:{},tafsirMode:false,
  lastRead:JSON.parse(localStorage.getItem('mik_lr')||'null'),
  pageMode:false,currentPage:1,
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
  else if(h.m===9){if(e)e.textContent=`Eid in ${30-h.d+1} days 🎁`;}
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
    {m:9,d:21,name:'Last 10 Nights',ar:'العشر الأواخر',icon:'🤲'},
    {m:9,d:27,name:'Laylat al-Qadr',ar:'ليلة القدر',icon:'✨'},
    {m:10,d:1,name:'Eid al-Fitr',ar:'عيد الفطر المبارك',icon:'🎉'},
    {m:12,d:9,name:'Day of Arafah',ar:'يوم عرفة',icon:'🕋'},
    {m:12,d:10,name:'Eid al-Adha',ar:'عيد الأضحى المبارك',icon:'🐑'},
    {m:12,d:18,name:'End of Hajj',ar:'انتهاء موسم الحج',icon:'🕌'},
  ];
  let html=`<div class="hijri-hero"><div class="hh-ar">${HM_AR[h.m-1]}</div><div class="hh-date">${h.d}</div><div class="hh-year">${h.y} AH · ${HM[h.m-1]}</div><div class="hh-greg">${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div><div class="sec-hdr" style="padding:12px 20px 6px">Islamic Events</div>`;
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
    d.innerHTML=`<div class="adhan-item-l"><span class="adhan-dot"></span><span>${name}</span></div><button class="toggle ${S.adhan[name]?'on':''}" onclick="toggleAdhan('${name}',this)"></button>`;
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
  [{j:1,f:'Al-Fatihah 1',t:'Al-Baqarah 141'},{j:2,f:'Al-Baqarah 142',t:'Al-Baqarah 252'},{j:3,f:'Al-Baqarah 253',t:'Al-Imran 92'},{j:4,f:'Al-Imran 93',t:'An-Nisa 23'},{j:5,f:'An-Nisa 24',t:'An-Nisa 147'},{j:6,f:'An-Nisa 148',t:'Al-Maidah 81'},{j:7,f:'Al-Maidah 82',t:'Al-Anam 110'},{j:8,f:'Al-Anam 111',t:'Al-Araf 87'},{j:9,f:'Al-Araf 88',t:'Al-Anfal 40'},{j:10,f:'Al-Anfal 41',t:'At-Tawbah 92'},{j:11,f:'At-Tawbah 93',t:'Hud 5'},{j:12,f:'Hud 6',t:'Yusuf 52'},{j:13,f:'Yusuf 53',t:'Ibrahim 52'},{j:14,f:'Al-Hijr 1',t:'An-Nahl 128'},{j:15,f:'Al-Isra 1',t:'Al-Kahf 74'},{j:16,f:'Al-Kahf 75',t:'Ta-Ha 135'},{j:17,f:'Al-Anbiya 1',t:'Al-Hajj 78'},{j:18,f:'Al-Muminun 1',t:'Al-Furqan 20'},{j:19,f:'Al-Furqan 21',t:'An-Naml 55'},{j:20,f:'An-Naml 56',t:'Al-Ankabut 45'},{j:21,f:'Al-Ankabut 46',t:'Al-Ahzab 30'},{j:22,f:'Al-Ahzab 31',t:'Ya-Sin 27'},{j:23,f:'Ya-Sin 28',t:'Az-Zumar 31'},{j:24,f:'Az-Zumar 32',t:'Fussilat 46'},{j:25,f:'Fussilat 47',t:'Al-Jathiya 37'},{j:26,f:'Al-Ahqaf 1',t:'Adh-Dhariyat 30'},{j:27,f:'Adh-Dhariyat 31',t:'Al-Hadid 29'},{j:28,f:'Al-Mujadila 1',t:'At-Tahrim 12'},{j:29,f:'Al-Mulk 1',t:'Al-Mursalat 50'},{j:30,f:'An-Naba 1',t:'An-Nas 6'}].forEach(juz=>{
    const d=document.createElement('div');d.className='si';
    d.onclick=()=>showToast(`Juz ${juz.j} coming soon! 🌟`);
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
  c.innerHTML='<div class="loading-state"><div class="spinner"></div><span>Loading...</span></div>';
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
  if(pmBtn)pmBtn.classList.toggle('active',S.pageMode);
  if(S.pageMode){renderPageMode(ayahs);return;}
  ayahs.forEach(a=>{
    const d=document.createElement('div');d.className='ayah-item';d.id=`ay-${a.n}`;
    d.innerHTML=`<div class="ayah-top"><div class="ayah-num">${a.n}</div>
      <div class="ayah-acts">
        <button class="aab" onclick="playAyah(${a.n})">▶</button>
        <button class="aab" onclick="openTafsirSheet(${a.n},'${esc(a.ar)}')">📚</button>
        <button class="aab" onclick="bmAyah(${a.n})">🔖</button>
        <button class="aab" onclick="copyAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')">📋</button>
        <button class="aab" onclick="shareAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')">📤</button>
      </div></div>
      <div class="ayah-arabic" style="font-size:${S.asz}px">${a.ar}</div>
      <div class="ayah-trans">${a.tr}</div>
      ${S.tafsirMode?`<div class="ayah-tafsir-inline" id="ti-${a.n}"><span class="tafsir-label">📚 IBN KATHIR</span><div id="ti-txt-${a.n}">Loading...</div></div>`:''}`;
    c.appendChild(d);
    if(S.tafsirMode)loadInlineTafsir(a.n,S.surah?.num);
  });
}

// PAGE MODE
function toArabicNum(n){return String(n).split('').map(d=>'٠١٢٣٤٥٦٧٨٩'[d]).join('');}
function renderPageMode(ayahs){
  const c=document.getElementById('ayah-content');c.innerHTML='';
  const PPP=10,total=Math.ceil(ayahs.length/PPP);
  const pg=ayahs.slice((S.currentPage-1)*PPP,S.currentPage*PPP);
  const page=document.createElement('div');page.className='mushaf-page';
  const ab=document.createElement('div');ab.className='mushaf-arabic';
  pg.forEach(a=>{ab.innerHTML+=`<span class="mushaf-ayah" id="may-${a.n}">${a.ar}<span class="ayah-marker"> ﴿${toArabicNum(a.n)}﴾ </span></span>`;});
  page.appendChild(ab);
  const tb=document.createElement('div');tb.className='mushaf-trans';
  pg.forEach(a=>{tb.innerHTML+=`<div class="mushaf-trans-row"><span class="mtr-num">${a.n}.</span><span>${a.tr}</span></div>`;});
  page.appendChild(tb);
  const nav=document.createElement('div');nav.className='page-nav';
  nav.innerHTML=`<button class="pnav-btn" onclick="changePage(-1)" ${S.currentPage<=1?'disabled':''}>‹ Prev</button><span class="pnav-info">Page ${S.currentPage} / ${total}</span><button class="pnav-btn" onclick="changePage(1)" ${S.currentPage>=total?'disabled':''}>Next ›</button>`;
  page.appendChild(nav);c.appendChild(page);
}
function changePage(dir){
  const ayahs=S.cache[S.surah.num+'_'+S.lang];if(!ayahs)return;
  S.currentPage=Math.max(1,Math.min(Math.ceil(ayahs.length/10),S.currentPage+dir));
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
function changeTafsirLang(){S.tafsirLang=document.getElementById('tafsir-lang-sel').value;showToast('Tafsir language updated 📚');}

// TAFSIR
function toggleTafsirMode(){
  S.tafsirMode=!S.tafsirMode;
  const btn=document.getElementById('tafsir-mode-btn');if(btn)btn.classList.toggle('active',S.tafsirMode);
  if(S.surah)loadReader(S.surah.num);
  showToast(S.tafsirMode?'Tafsir ON 📚':'Tafsir OFF');
}
function loadInlineTafsir(ayahNum,surahNum){
  const el=document.getElementById(`ti-txt-${ayahNum}`);if(!el)return;
  fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/${S.tafsirLang}`)
    .then(r=>r.json()).then(d=>{el.textContent=d.data?.text||'Tafsir not available.';})
    .catch(()=>{el.textContent='Tafsir unavailable.';});
}
function openTafsirSheet(ayahNum,arabicText){
  const sheet=document.getElementById('tafsir-sheet');if(!sheet)return;
  const title=document.getElementById('sheet-title'),ar=document.getElementById('sheet-ar'),txt=document.getElementById('sheet-txt');
  if(title)title.textContent=`Verse ${ayahNum} · ${S.surah?.nameEn||''}`;
  if(ar)ar.textContent=arabicText;
  if(txt)txt.innerHTML='<div class="loading-state"><div class="spinner"></div></div>';
  sheet.classList.remove('hidden');
  if(!S.surah)return;
  fetch(`https://api.alquran.cloud/v1/ayah/${S.surah.num}:${ayahNum}/${S.tafsirLang}`)
    .then(r=>r.json()).then(d=>{if(txt){txt.innerHTML='';txt.textContent=d.data?.text||'Tafsir not available.';}})
    .catch(()=>{if(txt)txt.textContent='Tafsir unavailable.';});
}
function closeSheet(){const s=document.getElementById('tafsir-sheet');if(s)s.classList.add('hidden');}
function loadTafsirSurahList(){
  const c=document.getElementById('tafsir-surah-list');if(!c||!S.allSurahs.length)return;c.innerHTML='';
  S.allSurahs.forEach(s=>{
    const d=document.createElement('div');d.className='si';
    d.onclick=()=>openTafsirPage(s.number,s.englishName,s.name);
    d.innerHTML=`<div class="si-num">${s.number}</div><div class="si-info"><div class="si-en">${s.englishName}</div><div class="si-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses</div></div><div class="si-ar">${s.name}</div>`;
    c.appendChild(d);
  });
}
function openTafsirPage(num,nameEn){
  document.getElementById('tafsir-title').textContent=`${nameEn} — Tafsir`;
  const c=document.getElementById('tafsir-content');
  c.innerHTML='<div class="loading-state"><div class="spinner"></div><span>Loading Tafsir...</span></div>';
  showPage('page-tafsir-reader');
  fetch(`https://api.alquran.cloud/v1/surah/${num}`).then(r=>r.json()).then(({data})=>{
    c.innerHTML='';
    data.ayahs.forEach((a,i)=>{
      const block=document.createElement('div');block.className='tafsir-ayah-block';
      block.innerHTML=`<div class="tab-num">VERSE ${a.numberInSurah}</div><div class="tab-arabic">${a.text}</div><div class="tab-text" id="tf-${num}-${a.numberInSurah}"><div class="loading-state"><div class="spinner"></div></div></div>`;
      c.appendChild(block);
      if(i<4)loadTafsirText(num,a.numberInSurah);
    });
    c.addEventListener('scroll',()=>{
      data.ayahs.forEach(a=>{
        const el=document.getElementById(`tf-${num}-${a.numberInSurah}`);
        if(el&&el.querySelector('.spinner')&&el.getBoundingClientRect().top<window.innerHeight+300)loadTafsirText(num,a.numberInSurah);
      });
    },{passive:true});
  }).catch(()=>{c.innerHTML='<div class="loading-state">Failed to load.</div>';});
}
function loadTafsirText(sn,an){
  const el=document.getElementById(`tf-${sn}-${an}`);if(!el||!el.querySelector('.spinner'))return;
  fetch(`https://api.alquran.cloud/v1/ayah/${sn}:${an}/${S.tafsirLang}`)
    .then(r=>r.json()).then(d=>{el.textContent=d.data?.text||'Tafsir not available.';})
    .catch(()=>{el.textContent='Tafsir unavailable.';});
}

// AUDIO — AUTO NEXT SURAH
function playAyah(num){
  if(!S.surah)return;S.ayah=num;S.playing=true;
  const ss=String(S.surah.num).padStart(3,'0'),as=String(num).padStart(3,'0');
  const audio=document.getElementById('quran-audio');
  audio.src=`https://cdn.islamic.network/quran/audio/128/${S.reciter}/${S.surah.num*1000+num}.mp3`;
  audio.play().catch(()=>{
    audio.src=`https://everyayah.com/data/Alafasy_128kbps/${ss}${as}.mp3`;
    audio.play().catch(()=>showToast('Audio unavailable'));
  });
  document.querySelectorAll('.ayah-item,.mushaf-ayah').forEach(e=>e.classList.remove('playing'));
  const el=document.getElementById(`ay-${num}`)||document.getElementById(`may-${num}`);
  if(el){el.classList.add('playing');el.scrollIntoView({behavior:'smooth',block:'center'});}
  document.getElementById('play-btn').textContent='⏸';
  document.getElementById('ap-label').textContent=`Verse ${num} of ${S.surah.ayahCount}`;
  saveLastRead(S.surah.num,S.surah.nameAr,S.surah.nameEn,num,S.surah.ayahCount);
}
function togglePlay(){
  const a=document.getElementById('quran-audio');
  if(a.paused){a.play();S.playing=true;document.getElementById('play-btn').textContent='⏸';}
  else{a.pause();S.playing=false;document.getElementById('play-btn').textContent='▶';}
}
function nextAyah(){if(S.surah&&S.ayah<S.surah.ayahCount)playAyah(S.ayah+1);}
function prevAyah(){if(S.ayah>1)playAyah(S.ayah-1);}
function onAudioEnd(){
  if(S.repeat){playAyah(S.ayah);return;}
  if(S.surah&&S.ayah<S.surah.ayahCount){
    setTimeout(()=>nextAyah(),500);
  } else {
    // AUTO NEXT SURAH like real Quran
    const nextNum=S.surah.num+1;
    if(nextNum<=114&&S.allSurahs.length){
      const next=S.allSurahs[nextNum-1];
      showToast(`📖 ${next.englishName}`);
      setTimeout(()=>{
        openSurah(next.number,next.name,next.englishName,next.numberOfAyahs,next.revelationType);
        setTimeout(()=>playAyah(1),1200);
      },800);
    } else {
      document.getElementById('play-btn').textContent='▶';
      S.playing=false;
      showToast('🌙 Alhamdulillah! Quran complete!',5000);
    }
  }
}
function toggleRepeat(){
  S.repeat=!S.repeat;
  const btn=document.getElementById('repeat-btn');
  btn.style.color=S.repeat?'var(--gold)':'';btn.style.borderColor=S.repeat?'var(--gold)':'';
  showToast(S.repeat?'🔁 Repeat ON':'🔁 Repeat OFF');
}
function stopAudio(){const a=document.getElementById('quran-audio');a.pause();a.src='';S.playing=false;}
function updateProgress(){
  const a=document.getElementById('quran-audio');if(!a.duration)return;
  const f=document.getElementById('ap-fill');if(f)f.style.width=(a.currentTime/a.duration*100)+'%';
}
function copyAyah(num,ar,tr){
  navigator.clipboard.writeText(`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num}\nAl-Qur'an Pro · MÎK Edition`)
    .then(()=>showToast('Copied! 📋')).catch(()=>showToast('Copy failed'));
}
function shareAyah(num,ar,tr){
  const text=`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num}\nAl-Qur'an Pro · MÎK Edition`;
  if(navigator.share)navigator.share({title:"Al-Qur'an — MÎK Edition",text}).catch(()=>{});
  else copyAyah(num,ar,tr);
}

// LAST READ
function saveLastRead(sn,na,ne,an,ac){
  S.lastRead={surahNum:sn,nameAr:na,nameEn:ne,ayahNum:an,ayahCount:ac};
  localStorage.setItem('mik_lr',JSON.stringify(S.lastRead));renderLastRead();
}
function renderLastRead(){
  const wrap=document.getElementById('last-read-wrap');if(!wrap)return;
  if(!S.lastRead){wrap.classList.add('hidden');return;}
  wrap.classList.remove('hidden');
  const nm=document.getElementById('lr-name'),sb=document.getElementById('lr-sub');
  if(nm)nm.textContent=S.lastRead.nameEn;
  if(sb)sb.textContent=`Verse ${S.lastRead.ayahNum} of ${S.lastRead.ayahCount}`;
}
function continueReading(){
  if(!S.lastRead)return;
  const lr=S.lastRead,s=S.allSurahs.find(x=>x.number===lr.surahNum);
  if(s){openSurah(lr.surahNum,lr.nameAr,lr.nameEn,lr.ayahCount,'');
    setTimeout(()=>{const el=document.getElementById(`ay-${lr.ayahNum}`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},800);}
}

// BOOKMARKS
function toggleBookmarkSurah(){
  if(!S.surah)return;
  const idx=S.bookmarks.findIndex(b=>b.surahNum===S.surah.num&&!b.ayahNum);
  if(idx>-1){S.bookmarks.splice(idx,1);showToast('Bookmark removed');}
  else{S.bookmarks.push({surahNum:S.surah.num,nameEn:S.surah.nameEn,nameAr:S.surah.nameAr});showToast('Bookmarked! 🔖');}
  localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));updateBmBtn();
}
function bmAyah(num){
  if(!S.surah)return;
  const idx=S.bookmarks.findIndex(b=>b.surahNum===S.surah.num&&b.ayahNum===num);
  if(idx>-1){S.bookmarks.splice(idx,1);showToast('Removed');}
  else{S.bookmarks.push({surahNum:S.surah.num,ayahNum:num,nameEn:S.surah.nameEn,nameAr:S.surah.nameAr});showToast('Verse bookmarked! 🔖');}
  localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));
}
function updateBmBtn(){
  const btn=document.getElementById('bm-btn');if(!btn||!S.surah)return;
  btn.style.color=S.bookmarks.some(b=>b.surahNum===S.surah.num&&!b.ayahNum)?'var(--gold)':'';
}
function renderBookmarks(){
  const c=document.getElementById('bm-list');if(!c)return;
  if(!S.bookmarks.length){c.innerHTML='<div class="empty-state"><div class="empty-ico">🔖</div><div>No bookmarks yet</div><div style="font-size:12px;color:var(--text3);margin-top:6px">Tap 🔖 on any Surah or verse</div></div>';return;}
  c.innerHTML='';
  S.bookmarks.forEach((b,i)=>{
    const d=document.createElement('div');d.className='bm-item';
    d.onclick=()=>{const s=S.allSurahs.find(x=>x.number===b.surahNum);if(s)openSurah(s.number,s.name,s.englishName,s.numberOfAyahs,s.revelationType);};
    d.innerHTML=`<div class="bm-ico">${b.ayahNum?'📝':'📖'}</div><div class="bm-info"><div class="bm-name">${b.nameEn}${b.ayahNum?' — Verse '+b.ayahNum:''}</div><div class="bm-ar">${b.nameAr}</div></div><button class="bm-del" onclick="event.stopPropagation();deleteBm(${i})">✕</button>`;
    c.appendChild(d);
  });
}
function deleteBm(i){S.bookmarks.splice(i,1);localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));renderBookmarks();}

// QIBLA
function startQibla(){
  const info=document.getElementById('qibla-info'),deg=document.getElementById('qibla-deg');
  if(!navigator.geolocation){if(info)info.textContent='Location not supported';return;}
  if(info)info.textContent='Getting your location...';
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude,lon=pos.coords.longitude,dir=calcQibla(lat,lon);
    if(deg)deg.textContent=`${Math.round(dir)}° from North`;
    if(info)info.textContent='Point the 🕋 toward Mecca';
    if(window.DeviceOrientationEvent){
      const h=(e)=>{const a=e.webkitCompassHeading||e.alpha||0,n=document.getElementById('qibla-needle');if(n)n.style.transform=`rotate(${dir-a}deg)`;};
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        DeviceOrientationEvent.requestPermission().then(()=>window.addEventListener('deviceorientation',h,true)).catch(()=>staticQibla(dir,info));
      }else{window.addEventListener('deviceorientation',h,true);}
    }else{staticQibla(dir,info);}
  },()=>{if(info)info.textContent='Location denied.';});
}
function staticQibla(dir,info){const n=document.getElementById('qibla-needle');if(n)n.style.transform=`rotate(${dir}deg)`;if(info)info.textContent=`Qibla: ${Math.round(dir)}° from North`;}
function calcQibla(lat,lon){
  const mLat=21.4225*Math.PI/180,mLon=39.8262*Math.PI/180,uLat=lat*Math.PI/180,uLon=lon*Math.PI/180,dl=mLon-uLon;
  return(Math.atan2(Math.cos(mLat)*Math.sin(dl),Math.cos(uLat)*Math.sin(mLat)-Math.sin(uLat)*Math.cos(mLat)*Math.cos(dl))*180/Math.PI+360)%360;
}

// 99 NAMES ALLAH — plain Arabic (renders everywhere)
const ALLAH_NAMES=[
  {n:'الله',t:'Allah',m:'The One True God'},{n:'الرحمن',t:'Ar-Rahman',m:'The Most Gracious'},
  {n:'الرحيم',t:'Ar-Rahim',m:'The Most Merciful'},{n:'الملك',t:'Al-Malik',m:'The Sovereign King'},
  {n:'القدوس',t:'Al-Quddus',m:'The Most Holy'},{n:'السلام',t:'As-Salam',m:'The Source of Peace'},
  {n:'المؤمن',t:'Al-Mumin',m:'The Guardian of Faith'},{n:'المهيمن',t:'Al-Muhaymin',m:'The Protector'},
  {n:'العزيز',t:'Al-Aziz',m:'The Almighty'},{n:'الجبار',t:'Al-Jabbar',m:'The Compeller'},
  {n:'المتكبر',t:'Al-Mutakabbir',m:'The Supreme'},{n:'الخالق',t:'Al-Khaliq',m:'The Creator'},
  {n:'البارئ',t:'Al-Bari',m:'The Evolver'},{n:'المصور',t:'Al-Musawwir',m:'The Fashioner'},
  {n:'الغفار',t:'Al-Ghaffar',m:'The Repeatedly Forgiving'},{n:'القهار',t:'Al-Qahhar',m:'The Subduer'},
  {n:'الوهاب',t:'Al-Wahhab',m:'The Bestower'},{n:'الرزاق',t:'Ar-Razzaq',m:'The Provider'},
  {n:'الفتاح',t:'Al-Fattah',m:'The Opener'},{n:'العليم',t:'Al-Alim',m:'The All-Knowing'},
  {n:'القابض',t:'Al-Qabid',m:'The Withholder'},{n:'الباسط',t:'Al-Basit',m:'The Extender'},
  {n:'الخافض',t:'Al-Khafid',m:'The Reducer'},{n:'الرافع',t:'Ar-Rafi',m:'The Exalter'},
  {n:'المعز',t:'Al-Muizz',m:'The Honourer'},{n:'المذل',t:'Al-Mudhill',m:'The Dishonourer'},
  {n:'السميع',t:'As-Sami',m:'The All-Hearing'},{n:'البصير',t:'Al-Basir',m:'The All-Seeing'},
  {n:'الحكم',t:'Al-Hakam',m:'The Judge'},{n:'العدل',t:'Al-Adl',m:'The Just'},
  {n:'اللطيف',t:'Al-Latif',m:'The Subtle One'},{n:'الخبير',t:'Al-Khabir',m:'The All-Aware'},
  {n:'الحليم',t:'Al-Halim',m:'The Forbearing'},{n:'العظيم',t:'Al-Azim',m:'The Magnificent'},
  {n:'الغفور',t:'Al-Ghafur',m:'The Forgiving'},{n:'الشكور',t:'Ash-Shakur',m:'The Appreciative'},
  {n:'العلي',t:'Al-Ali',m:'The Most High'},{n:'الكبير',t:'Al-Kabir',m:'The Greatest'},
  {n:'الحفيظ',t:'Al-Hafiz',m:'The Preserver'},{n:'المقيت',t:'Al-Muqit',m:'The Sustainer'},
  {n:'الحسيب',t:'Al-Hasib',m:'The Reckoner'},{n:'الجليل',t:'Al-Jalil',m:'The Majestic'},
  {n:'الكريم',t:'Al-Karim',m:'The Generous'},{n:'الرقيب',t:'Ar-Raqib',m:'The Watchful'},
  {n:'المجيب',t:'Al-Mujib',m:'The Responder'},{n:'الواسع',t:'Al-Wasi',m:'The All-Encompassing'},
  {n:'الحكيم',t:'Al-Hakim',m:'The All-Wise'},{n:'الودود',t:'Al-Wadud',m:'The Loving'},
  {n:'المجيد',t:'Al-Majid',m:'The Glorious'},{n:'الباعث',t:'Al-Baith',m:'The Resurrector'},
  {n:'الشهيد',t:'Ash-Shahid',m:'The Witness'},{n:'الحق',t:'Al-Haqq',m:'The Truth'},
  {n:'الوكيل',t:'Al-Wakil',m:'The Trustee'},{n:'القوي',t:'Al-Qawi',m:'The All-Strong'},
  {n:'المتين',t:'Al-Matin',m:'The Firm'},{n:'الولي',t:'Al-Wali',m:'The Protecting Friend'},
  {n:'الحميد',t:'Al-Hamid',m:'The Praiseworthy'},{n:'المحصي',t:'Al-Muhsi',m:'The Counter'},
  {n:'المبدئ',t:'Al-Mubdi',m:'The Originator'},{n:'المعيد',t:'Al-Muid',m:'The Restorer'},
  {n:'المحيي',t:'Al-Muhyi',m:'The Giver of Life'},{n:'المميت',t:'Al-Mumit',m:'The Taker of Life'},
  {n:'الحي',t:'Al-Hayy',m:'The Ever-Living'},{n:'القيوم',t:'Al-Qayyum',m:'The Self-Sustaining'},
  {n:'الواجد',t:'Al-Wajid',m:'The Finder'},{n:'الماجد',t:'Al-Majid',m:'The Noble'},
  {n:'الواحد',t:'Al-Wahid',m:'The One'},{n:'الأحد',t:'Al-Ahad',m:'The Unique'},
  {n:'الصمد',t:'As-Samad',m:'The Eternal Absolute'},{n:'القادر',t:'Al-Qadir',m:'The All-Capable'},
  {n:'المقتدر',t:'Al-Muqtadir',m:'The Powerful'},{n:'المقدم',t:'Al-Muqaddim',m:'The Expediter'},
  {n:'المؤخر',t:'Al-Muakhkhir',m:'The Delayer'},{n:'الأول',t:'Al-Awwal',m:'The First'},
  {n:'الآخر',t:'Al-Akhir',m:'The Last'},{n:'الظاهر',t:'Az-Zahir',m:'The Manifest'},
  {n:'الباطن',t:'Al-Batin',m:'The Hidden'},{n:'الوالي',t:'Al-Wali',m:'The Governor'},
  {n:'المتعالي',t:'Al-Mutaali',m:'The Self Exalted'},{n:'البر',t:'Al-Barr',m:'The Source of Goodness'},
  {n:'التواب',t:'At-Tawwab',m:'The Accepter of Repentance'},{n:'المنتقم',t:'Al-Muntaqim',m:'The Avenger'},
  {n:'العفو',t:'Al-Afuw',m:'The Pardoner'},{n:'الرؤوف',t:'Ar-Rauf',m:'The Most Kind'},
  {n:'مالك الملك',t:'Malik-ul-Mulk',m:'Owner of All Sovereignty'},{n:'ذو الجلال والإكرام',t:'Dhul-Jalali-wal-Ikram',m:'Lord of Majesty & Bounty'},
  {n:'المقسط',t:'Al-Muqsit',m:'The Equitable'},{n:'الجامع',t:'Al-Jami',m:'The Gatherer'},
  {n:'الغني',t:'Al-Ghani',m:'The Self-Sufficient'},{n:'المغني',t:'Al-Mughni',m:'The Enricher'},
  {n:'المانع',t:'Al-Mani',m:'The Withholder'},{n:'الضار',t:'Ad-Darr',m:'The Distresser'},
  {n:'النافع',t:'An-Nafi',m:'The Propitious'},{n:'النور',t:'An-Nur',m:'The Light'},
  {n:'الهادي',t:'Al-Hadi',m:'The Guide'},{n:'البديع',t:'Al-Badi',m:'The Incomparable Originator'},
  {n:'الباقي',t:'Al-Baqi',m:'The Everlasting'},{n:'الوارث',t:'Al-Warith',m:'The Inheritor'},
  {n:'الرشيد',t:'Ar-Rashid',m:'The Guide to Right Path'},{n:'الصبور',t:'As-Sabur',m:'The Patient One'},
];
function loadNames(){
  const c=document.getElementById('names-grid');if(!c)return;c.innerHTML='';
  ALLAH_NAMES.forEach((nm,i)=>{
    const d=document.createElement('div');d.className='name-card';
    d.innerHTML=`<div class="nc-num">${i+1}</div><div class="nc-ar">${nm.n}</div><div class="nc-tr">${nm.t}</div><div class="nc-mn">${nm.m}</div>`;
    c.appendChild(d);
  });
}

// PROPHET NAMES
const PROPHET_NAMES=[
  {n:'محمد',t:'Muhammad',m:'The Praised One'},{n:'أحمد',t:'Ahmad',m:'The Most Praiseworthy'},
  {n:'الماحي',t:'Al-Mahi',m:'The Obliterator of Disbelief'},{n:'الحاشر',t:'Al-Hashir',m:'The Gatherer'},
  {n:'العاقب',t:'Al-Aqib',m:'The Last of the Prophets'},{n:'طه',t:'Taha',m:'Pure and Good'},
  {n:'يس',t:'Yasin',m:'O Leader'},{n:'المصطفى',t:'Al-Mustafa',m:'The Chosen One'},
  {n:'المجتبى',t:'Al-Mujtaba',m:'The Selected'},{n:'الأمين',t:'Al-Amin',m:'The Trustworthy'},
  {n:'الرسول',t:'Ar-Rasul',m:'The Messenger'},{n:'النبي',t:'An-Nabi',m:'The Prophet'},
  {n:'الصادق',t:'As-Sadiq',m:'The Truthful'},{n:'المبشر',t:'Al-Mubashshir',m:'The Herald of Good News'},
  {n:'النذير',t:'An-Nadhir',m:'The Warner'},{n:'الداعي',t:'Ad-Dai',m:'The Caller to Allah'},
  {n:'السراج المنير',t:'As-Siraj al-Munir',m:'The Luminous Lamp'},{n:'رحمة للعالمين',t:'Rahmatun lil-Alamin',m:'Mercy to All Worlds'},
  {n:'حبيب الله',t:'Habibullah',m:"Allah's Beloved"},{n:'خليل الله',t:'Khalilullah',m:"Allah's Friend"},
  {n:'نبي الرحمة',t:'Nabi ar-Rahma',m:'Prophet of Mercy'},{n:'نبي التوبة',t:'Nabi at-Tawba',m:'Prophet of Repentance'},
  {n:'الشفيع',t:'Ash-Shafi',m:'The Intercessor'},{n:'الفاتح',t:'Al-Fatih',m:'The Opener'},
  {n:'الخاتم',t:'Al-Khatam',m:'The Seal of Prophets'},{n:'المختار',t:'Al-Mukhtar',m:'The Elected One'},
  {n:'أبو القاسم',t:'Abu al-Qasim',m:'Father of Qasim'},{n:'الرؤوف',t:'Ar-Rauf',m:'The Compassionate'},
  {n:'الرحيم',t:'Ar-Rahim',m:'The Merciful'},{n:'سيد المرسلين',t:'Sayyid al-Mursalin',m:'Master of the Messengers'},
  {n:'إمام المتقين',t:'Imam al-Muttaqin',m:'Leader of the Pious'},{n:'الكريم',t:'Al-Karim',m:'The Noble'},
  {n:'ذو الخلق العظيم',t:'Dhul-Khuluqil-Azim',m:'Owner of Great Character'},{n:'الأمي',t:'Al-Ummi',m:'The Unlettered Prophet'},
  {n:'صفي الله',t:'Safiyyullah',m:"Allah's Pure Chosen"},{n:'نور الله',t:'Nurullah',m:'Light of Allah'},
  {n:'البشير',t:'Al-Bashir',m:'The Herald of Glad Tidings'},{n:'الشهيد',t:'Ash-Shahid',m:'The Witness'},
  {n:'المكرم',t:'Al-Mukarram',m:'The Honoured One'},{n:'قائد الغر',t:'Qaid al-Ghurr',m:'Leader of the Radiant Ones'},
];
function loadProphetNames(){
  const c=document.getElementById('prophet-grid');if(!c)return;c.innerHTML='';
  PROPHET_NAMES.forEach((nm,i)=>{
    const d=document.createElement('div');d.className='name-card prophet-card';
    d.innerHTML=`<div class="nc-num">${i+1}</div><div class="nc-ar">${nm.n}</div><div class="nc-tr">${nm.t}</div><div class="nc-mn">${nm.m}</div>`;
    c.appendChild(d);
  });
}

// DHIKR
const DHIKR_LIST=[
  {cat:'Morning Adhkar',icon:'🌅',items:[
    {ar:'أصبحنا وأصبح الملك لله',tr:'Asbahna wa asbahal mulku lillah',en:'We have entered morning and the kingdom belongs to Allah',count:1,ref:'Abu Dawud'},
    {ar:'لا إله إلا الله وحده لا شريك له',tr:'La ilaha illAllah wahdahu la sharika lah',en:'None worthy of worship but Allah alone, no partner',count:10,ref:'Bukhari — equal to freeing 4 slaves'},
    {ar:'سبحان الله وبحمده',tr:'SubhanAllahi wa bihamdihi',en:'Glory be to Allah and praise Him',count:100,ref:'Bukhari — 100 sins forgiven'},
    {ar:'اللهم بك أصبحنا وبك أمسينا',tr:'Allahumma bika asbahna wa bika amsayna',en:'O Allah, by You we enter morning and evening',count:1,ref:'Abu Dawud'},
    {ar:'اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك',tr:'Allahumma anta rabbi la ilaha illa anta khalaqtani wa ana abduk',en:'O Allah You are my Lord, none has the right to be worshipped but You. You created me and I am Your servant',count:1,ref:'Bukhari — Sayyid al-Istighfar, whoever says it enters Jannah'},
  ]},
  {cat:'Evening Adhkar',icon:'🌙',items:[
    {ar:'أمسينا وأمسى الملك لله',tr:'Amsayna wa amsal mulku lillah',en:'We have entered evening and the kingdom belongs to Allah',count:1,ref:'Abu Dawud'},
    {ar:'أعوذ بكلمات الله التامات من شر ما خلق',tr:"A'udhu bikalimatillahit-tammati min sharri ma khalaq",en:'I seek refuge in the perfect words of Allah from all evil He created',count:3,ref:'Muslim — protection from all harm'},
    {ar:'بسم الله الذي لا يضر مع اسمه شيء',tr:"Bismillahil ladhi la yadurru ma'asmihi shay'",en:'In the name of Allah, with Whose name nothing can cause harm',count:3,ref:'Abu Dawud — nothing harms him that night'},
  ]},
  {cat:'After Prayer',icon:'🕌',items:[
    {ar:'أستغفر الله',tr:'Astaghfirullah',en:'I seek forgiveness from Allah',count:3,ref:'Muslim — after every prayer'},
    {ar:'اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام',tr:'Allahumma antas-salam wa minkas-salam tabarakta ya dhal-jalali wal-ikram',en:'O Allah, You are As-Salam and from You is all peace, blessed are You O Lord of Majesty and Honour',count:1,ref:'Muslim — after salam'},
    {ar:'سبحان الله',tr:'SubhanAllah',en:'Glory be to Allah',count:33,ref:'Muslim — after every prayer'},
    {ar:'الحمد لله',tr:'Alhamdulillah',en:'All praise is due to Allah',count:33,ref:'Muslim — after every prayer'},
    {ar:'الله أكبر',tr:'Allahu Akbar',en:'Allah is the Greatest',count:34,ref:'Muslim — after every prayer'},
    {ar:'لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير',tr:'La ilaha illAllah wahdahu la sharika lahu lahul-mulku wa lahul-hamdu wa huwa ala kulli shay\'in qadir',en:'None worthy of worship but Allah alone, His is the dominion, praise, and He is over all things capable',count:10,ref:'Ahmad — after Fajr & Maghrib'},
    {ar:'اللهم أعني على ذكرك وشكرك وحسن عبادتك',tr:"Allahumma a'inni ala dhikrika wa shukrika wa husni ibadatik",en:'O Allah, help me to remember You, thank You, and worship You in the best manner',count:1,ref:'Abu Dawud — Prophet ﷺ instructed Muadh ibn Jabal'},
  ]},
  {cat:'Tasbih & Praise',icon:'📿',items:[
    {ar:'سبحان الله وبحمده سبحان الله العظيم',tr:'SubhanAllahi wa bihamdihi SubhanAllahil Azim',en:'Glory be to Allah, Most Magnificent',count:1,ref:'Bukhari — two phrases most beloved to Allah'},
    {ar:'سبحان الله وبحمده',tr:'SubhanAllahi wa bihamdihi',en:'Glory be to Allah and praise Him',count:100,ref:'Bukhari — 100 sins forgiven even if like sea foam'},
    {ar:'لا إله إلا الله وحده لا شريك له له الملك وله الحمد يحيي ويميت وهو على كل شيء قدير',tr:'La ilaha illAllah wahdahu la sharika lahu lahul-mulku wa lahul-hamdu yuhyi wa yumitu wa huwa ala kulli shay\'in qadir',en:'None worthy of worship but Allah alone, His is the dominion and praise, He gives life and causes death',count:10,ref:'Tirmidhi — after Fajr & Maghrib before speaking'},
  ]},
  {cat:'Istighfar',icon:'🤲',items:[
    {ar:'أستغفر الله',tr:'Astaghfirullah',en:'I seek forgiveness from Allah',count:100,ref:'Prophet ﷺ said it 100 times daily'},
    {ar:'أستغفر الله وأتوب إليه',tr:'Astaghfirullah wa atubu ilayh',en:'I seek forgiveness from Allah and repent to Him',count:70,ref:'Bukhari'},
    {ar:'رب اغفر لي وتب علي إنك أنت التواب الرحيم',tr:"Rabbighfirli wa tub 'alayya innaka antat-tawwabur-rahim",en:'My Lord, forgive me and accept my repentance, You are the Accepter of repentance, the Merciful',count:100,ref:'Ibn Umar: Prophet ﷺ 100x in one sitting'},
    {ar:'اللهم أنت ربي لا إله إلا أنت أستغفرك وأتوب إليك',tr:'Allahumma anta rabbi la ilaha illa anta astaghfiruka wa atubu ilayk',en:'O Allah, You are my Lord, none worthy of worship but You, I seek Your forgiveness and repent to You',count:1,ref:'Ahmad'},
  ]},
  {cat:'Salawat on Prophet ﷺ',icon:'💚',items:[
    {ar:'صلى الله عليه وسلم',tr:'SallAllahu alayhi wa sallam',en:'May Allah send blessings and peace upon him',count:1,ref:'When Prophet ﷺ is mentioned'},
    {ar:'اللهم صل على محمد',tr:"Allahumma salli 'ala Muhammad",en:'O Allah, send blessings upon Muhammad ﷺ',count:10,ref:'Muslim — 10 blessings returned for each one'},
    {ar:'اللهم صل وسلم على نبينا محمد',tr:"Allahumma salli wa sallim 'ala nabiyyina Muhammad",en:'O Allah, send complete blessings and peace upon our Prophet Muhammad ﷺ',count:10,ref:'Complete Salawat'},
    {ar:'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم',tr:"Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad kama sallayta 'ala Ibrahim",en:'O Allah, send blessings upon Muhammad and the family of Muhammad as You sent blessings upon Ibrahim',count:1,ref:'Bukhari — Salawat Ibrahimiyyah (in prayer)'},
  ]},
  {cat:'Protection & Ruqyah',icon:'🛡️',items:[
    {ar:'أعوذ بالله من الشيطان الرجيم',tr:'Audhu billahi minash-shaytanir-rajim',en:'I seek refuge in Allah from the accursed Satan',count:1,ref:'Before reciting Quran'},
    {ar:'بسم الله الرحمن الرحيم',tr:'Bismillahir-Rahmanir-Rahim',en:'In the name of Allah, the Most Gracious, the Most Merciful',count:1,ref:'Before every action'},
    {ar:'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم',tr:'HasbiAllahu la ilaha illa huwa alayhi tawakkaltu wa huwa rabbul arshil azim',en:'Sufficient for me is Allah, there is no god but He, upon Him I rely, He is Lord of the Magnificent Throne',count:7,ref:'Abu Dawud — 7x morning & evening, Allah suffices him for all that worries him'},
    {ar:'أعوذ بكلمات الله التامات من شر ما خلق',tr:"A'udhu bikalimatillahit-tammati min sharri ma khalaq",en:'I seek refuge in the perfect words of Allah from all evil He created',count:3,ref:'Muslim'},
    {ar:'بسم الله أرقي نفسي من كل شيء يؤذيني',tr:'Bismillahi arqi nafsi min kulli shay\'in yu\'dhini',en:'In the name of Allah I perform ruqyah upon myself from everything that harms me',count:3,ref:'Ruqyah — Muslim'},
  ]},
  {cat:'Duas from Quran',icon:'📖',items:[
    {ar:'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',tr:"Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",en:'Our Lord, give us good in this world, good in the Hereafter, and protect us from the punishment of the Fire',count:1,ref:'Quran 2:201 — most comprehensive dua'},
    {ar:'لا إله إلا أنت سبحانك إني كنت من الظالمين',tr:'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',en:'None worthy of worship but You, Glory to You, I was among the wrongdoers',count:1,ref:"Quran 21:87 — Dua of Yunus ﷺ, answered by Allah"},
    {ar:'رب اشرح لي صدري ويسر لي أمري واحلل عقدة من لساني يفقهوا قولي',tr:'Rabbish rahli sadri wa yassirli amri wahlul uqdatan min lisani yafqahu qawli',en:'My Lord, expand my breast, ease my task, and untie the knot in my tongue so they may understand my speech',count:1,ref:"Quran 20:25-28 — Dua of Musa ﷺ"},
    {ar:'حسبنا الله ونعم الوكيل',tr:"HasbunAllah wa ni'mal wakil",en:'Allah is sufficient for us and He is the best disposer of affairs',count:1,ref:"Quran 3:173 — what Ibrahim ﷺ said when thrown into the fire"},
    {ar:'ربنا لا تزغ قلوبنا بعد إذ هديتنا وهب لنا من لدنك رحمة',tr:"Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah",en:'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself',count:1,ref:'Quran 3:8'},
    {ar:'رب زدني علما',tr:'Rabbi zidni ilma',en:'My Lord, increase me in knowledge',count:1,ref:'Quran 20:114 — dua for knowledge'},
    {ar:'ربي إني مسني الضر وأنت أرحم الراحمين',tr:"Rabbi inni massaniyad-durru wa anta arhamur-rahimin",en:'My Lord, indeed adversity has touched me, and You are the Most Merciful of the merciful',count:1,ref:"Quran 21:83 — Dua of Ayyub ﷺ"},
  ]},
  {cat:'Dua for Anxiety & Hardship',icon:'🙏',items:[
    {ar:'اللهم إني أعوذ بك من الهم والحزن والعجز والكسل والجبن والبخل وضلع الدين وغلبة الرجال',tr:"Allahumma inni a'udhu bika minal-hammi wal-hazan wal-ajzi wal-kasali wal-jubni wal-bukhli wa dala'id-dayni wa ghalabatir-rijal",en:'O Allah, I seek refuge in You from worry, grief, incapacity, laziness, cowardice, miserliness, overwhelming debt, and being overpowered by men',count:1,ref:'Bukhari — complete dua for anxiety and sorrow'},
    {ar:'اللهم إني أسألك العفو والعافية في الدنيا والآخرة',tr:"Allahumma inni as'alukal-afwa wal-afiyata fid-dunya wal-akhirah",en:'O Allah, I ask You for pardon and well-being in this world and the Hereafter',count:1,ref:'Tirmidhi — best dua after certainty of faith'},
    {ar:'لا حول ولا قوة إلا بالله',tr:'La hawla wa la quwwata illa billah',en:'There is no power and no strength except with Allah',count:1,ref:'Bukhari — treasure from the treasures of Jannah'},
    {ar:'يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين',tr:'Ya Hayyu Ya Qayyumu birahmatika astaghith aslih li sha\'ni kullahu wa la takilni ila nafsi tarfata ayn',en:'O Ever-Living, O Self-Sustaining, by Your mercy I seek help. Rectify all my affairs and do not leave me to myself even for the blink of an eye',count:1,ref:'Hakim — Prophet ﷺ dua in distress, graded authentic'},
    {ar:'اللهم لا سهل إلا ما جعلته سهلا وأنت تجعل الحزن إذا شئت سهلا',tr:"Allahumma la sahla illa ma ja'altahu sahlan wa anta taj'alul hazna idha shi'ta sahla",en:'O Allah, nothing is easy except what You make easy, and You make the difficult easy when You will',count:1,ref:'Ibn Hibban — dua for difficulty'},
  ]},
];
function renderDhikrList(){
  const c=document.getElementById('dhikr-content');if(!c)return;c.innerHTML='';
  DHIKR_LIST.forEach(cat=>{
    const sec=document.createElement('div');
    sec.innerHTML=`<div class="dhikr-cat-hdr"><span>${cat.icon}</span><span>${cat.cat}</span></div>`;
    cat.items.forEach(item=>{
      const card=document.createElement('div');card.className='dhikr-card';
      card.innerHTML=`<div class="dhikr-ar">${item.ar}</div>
        <div class="dhikr-tr">${item.tr}</div>
        <div class="dhikr-en">${item.en}</div>
        <div class="dhikr-footer"><span class="dhikr-count">× ${item.count}</span><span class="dhikr-benefit">${item.ref}</span></div>`;
      sec.appendChild(card);
    });c.appendChild(sec);
  });
}

// TASBEEH
function doCount(){
  S.tCount++;S.tTotal++;
  document.getElementById('t-count').textContent=S.tCount;
  document.getElementById('t-total').textContent=S.tTotal;
  if(navigator.vibrate)navigator.vibrate(25);
  const prog=document.getElementById('t-prog');
  if(prog){const c=2*Math.PI*95;prog.style.strokeDashoffset=c*(1-Math.min(S.tCount/S.tTarget,1));}
  if(S.tCount>=S.tTarget){
    S.tSets++;document.getElementById('t-sets').textContent=S.tSets;S.tCount=0;
    document.getElementById('t-count').textContent='0';
    if(navigator.vibrate)navigator.vibrate([100,50,100,50,200]);
    showToast(`✨ MashaAllah! Set ${S.tSets} complete!`);
    const prog=document.getElementById('t-prog');if(prog){const c=2*Math.PI*95;prog.style.strokeDashoffset=c;}
  }
}
function resetT(){
  S.tCount=0;S.tSets=0;S.tTotal=0;
  ['t-count','t-sets','t-total'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0';});
  const prog=document.getElementById('t-prog');if(prog){const c=2*Math.PI*95;prog.style.strokeDashoffset=c;}
}
function setTarget(n){
  S.tTarget=n;S.tCount=0;
  document.getElementById('t-target').textContent=n;
  document.getElementById('t-count').textContent='0';
  const prog=document.getElementById('t-prog');if(prog){const c=2*Math.PI*95;prog.style.strokeDashoffset=c;}
}
function changeZikr(){
  const sel=document.getElementById('zikr-sel').value.split('|');
  const ar=document.getElementById('t-arabic');if(ar)ar.textContent=sel[0];
  resetT();
}

// ZAKAT
const CURRENCY_NISAB={USD:5000,PKR:1400000,AFN:360000,GBP:4000,EUR:4600,SAR:18750};
function calcZakat(){
  const cur=document.getElementById('z-currency')?.value||'USD';
  const total=(parseFloat(document.getElementById('z-savings')?.value)||0)+(parseFloat(document.getElementById('z-gold')?.value)||0)+(parseFloat(document.getElementById('z-silver')?.value)||0)+(parseFloat(document.getElementById('z-business')?.value)||0)-(parseFloat(document.getElementById('z-debts')?.value)||0);
  const nisab=CURRENCY_NISAB[cur]||5000,sym={USD:'$',PKR:'₨',AFN:'؋',GBP:'£',EUR:'€',SAR:'﷼'}[cur]||'';
  const a=document.getElementById('zr-amt'),sb=document.getElementById('zr-sub');
  if(total<nisab){if(a)a.textContent='0';if(sb)sb.textContent=`Below Nisab (${sym}${nisab.toLocaleString()}). No Zakat due.`;}
  else{const z=total*0.025;if(a)a.textContent=`${sym}${z.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;if(sb)sb.textContent=`2.5% of ${sym}${total.toLocaleString()}. Alhamdulillah! 💚`;}
}

// STYLES
const xs=document.createElement('style');
xs.textContent=`
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes pageIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes barFill{from{width:0}to{width:100%}}
@keyframes ringSpin{to{transform:rotate(360deg)}}
@keyframes iconGlow{from{text-shadow:0 0 10px rgba(201,150,58,0.3)}to{text-shadow:0 0 30px rgba(201,150,58,0.8)}}
@keyframes orbF{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,150,58,0.7)}70%{box-shadow:0 0 0 8px rgba(201,150,58,0)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{width:26px;height:26px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;}
.loading-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;color:var(--text2);font-size:13px;gap:6px;}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--text2);font-size:14px;}
.empty-ico{font-size:52px;margin-bottom:14px;}
.mushaf-page{padding:8px 4px 20px;}
.mushaf-arabic{font-family:'Noto Naskh Arabic','Traditional Arabic',serif;font-size:26px;line-height:2.5;text-align:justify;direction:rtl;padding:20px 16px;background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:12px;color:var(--text);}
.mushaf-ayah.playing{background:rgba(201,150,58,0.2);border-radius:4px;}
.ayah-marker{font-size:16px;color:var(--gold);}
.mushaf-trans{background:var(--card2);border:1px solid var(--border2);border-radius:12px;padding:14px;margin-bottom:12px;}
.mushaf-trans-row{display:flex;gap:8px;margin-bottom:8px;font-size:13px;color:var(--text2);line-height:1.6;}
.mtr-num{color:var(--gold);font-family:var(--fd);font-size:11px;flex-shrink:0;padding-top:2px;min-width:20px;}
.page-nav{display:flex;justify-content:space-between;align-items:center;padding:8px 0;}
.pnav-btn{background:var(--card);border:1px solid var(--border);color:var(--gold);border-radius:10px;padding:8px 18px;font-family:var(--fd);font-size:12px;cursor:pointer;transition:all 0.2s;}
.pnav-btn:disabled{opacity:0.3;cursor:not-allowed;}
.pnav-info{font-family:var(--fd);font-size:11px;color:var(--text2);letter-spacing:1px;}
.adhan-item-l{display:flex;align-items:center;gap:8px;font-size:14px;}
.adhan-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;}
.dhikr-cat-hdr{display:flex;align-items:center;gap:8px;font-family:var(--fd);font-size:11px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;padding:16px 20px 6px;}
.dhikr-card{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);margin:0 16px 10px;padding:16px;}
.dhikr-ar{font-family:'Noto Naskh Arabic','Traditional Arabic',serif;font-size:22px;color:var(--gold2);text-align:right;direction:rtl;line-height:1.9;margin-bottom:8px;}
.dhikr-tr{font-size:13px;color:var(--text);font-style:italic;margin-bottom:4px;line-height:1.5;}
.dhikr-en{font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px;}
.dhikr-footer{display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border2);gap:8px;}
.dhikr-count{font-family:var(--fd);font-size:12px;color:var(--gold);background:rgba(201,150,58,0.1);padding:3px 10px;border-radius:10px;border:1px solid rgba(201,150,58,0.2);flex-shrink:0;}
.dhikr-benefit{font-size:10px;color:var(--text3);flex:1;text-align:right;line-height:1.4;}
`;
document.head.appendChild(xs);
