'use strict';
// ═══ STATE ═══
const S = {
  surah:null, ayah:1, lang:'en.sahih', reciter:'ar.alafasy',
  prayers:{}, adhan:{Fajr:true,Dhuhr:false,Asr:false,Maghrib:true,Isha:true},
  bookmarks:JSON.parse(localStorage.getItem('mik_bm')||'[]'),
  tCount:0, tTarget:33, tSets:0, tTotal:0,
  zikr:{ar:'سُبْحَانَ اللَّهِ',name:'SubhanAllah'},
  playing:false, repeat:false, asz:28,
  theme:localStorage.getItem('mik_theme')||'dark',
  allSurahs:[], cache:{}, tafsirMode:false,
  lastRead:JSON.parse(localStorage.getItem('mik_lr')||'null'),
  lat:null, lon:null,
};

// ═══ INIT ═══
window.addEventListener('DOMContentLoaded', ()=>{
  applyTheme();
  setTimeout(()=>{
    const sp = document.getElementById('splash');
    if(sp){ sp.style.transition='opacity 0.6s'; sp.style.opacity='0'; }
    setTimeout(()=>{
      if(sp) sp.style.display='none';
      showPage('page-home');
    }, 600);
  }, 2800);
  startClock();
  loadHijri();
  getLocation();
  loadSurahs();
  loadNames();
  loadProphetNames();
  setupAdhanToggles();
  renderBookmarks();
  renderLastRead();
});

// ═══ TOAST ═══
function showToast(msg, dur=2500){
  let t=document.getElementById('toast');
  if(!t){
    t=document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,28,20,0.95);color:#f5d07a;padding:10px 22px;border-radius:24px;font-size:13px;z-index:9999;border:1px solid rgba(201,150,58,0.3);backdrop-filter:blur(12px);pointer-events:none;transition:opacity 0.3s;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    document.body.appendChild(t);
  }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t);
  t._t=setTimeout(()=>{ t.style.opacity='0'; }, dur);
}

// ═══ THEME ═══
function applyTheme(){ document.documentElement.setAttribute('data-theme', S.theme==='light'?'light':''); }
function toggleTheme(){
  S.theme = S.theme==='dark'?'light':'dark';
  localStorage.setItem('mik_theme', S.theme); applyTheme();
  const btn=document.getElementById('theme-btn');
  if(btn) btn.textContent=S.theme==='dark'?'☀️':'🌙';
}

// ═══ NAVIGATION ═══
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const p=document.getElementById(id);
  if(p) p.classList.remove('hidden');
  if(id==='page-bookmarks') renderBookmarks();
  if(id==='page-tafsir-home') loadTafsirSurahList();
  if(id==='page-hijri') renderHijriPage();
  window.scrollTo(0,0);
}
function setNav(el){
  const nav=el.closest('.bnav');
  if(nav) nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
}
function toggleSearch(){
  const b=document.getElementById('sbar');
  if(b){ b.classList.toggle('hidden'); if(!b.classList.contains('hidden')) document.getElementById('sinput').focus(); }
}
function filterSurahs(){
  const q=(document.getElementById('sinput').value||'').toLowerCase();
  renderSurahList(S.allSurahs.filter(s=>
    s.englishName.toLowerCase().includes(q)||
    s.englishNameTranslation.toLowerCase().includes(q)||
    String(s.number).includes(q)
  ));
}
function setTab(el, type){
  el.closest('.jtabs').querySelectorAll('.jtab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if(type==='surah') renderSurahList(S.allSurahs);
  else if(type==='fav'){
    const favNums=S.bookmarks.filter(b=>!b.ayahNum).map(b=>b.surahNum);
    renderSurahList(S.allSurahs.filter(s=>favNums.includes(s.number)));
  }
  else if(type==='juz') renderJuzList();
}

// ═══ CLOCK ═══
function startClock(){
  const tick=()=>{
    const now=new Date();
    const h=String(now.getHours()).padStart(2,'0'), m=String(now.getMinutes()).padStart(2,'0');
    const el=document.getElementById('current-time'); if(el) el.textContent=`${h}:${m}`;
    updateNextPrayer();
  };
  tick(); setInterval(tick,1000);
}

// ═══ HIJRI DATE ═══
const HIJRI_MONTHS=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaʿban','Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah'];
const HIJRI_MONTHS_AR=['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'];

function toHijri(y,m,d){
  if(m<=2){y--;m+=12;}
  const A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  const jd=Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524;
  const z=jd-1948440+10632, n=Math.floor((z-1)/10631);
  const zz=z-10631*n+354;
  const j=Math.floor((10985-zz)/5316)*Math.floor(50*zz/17719)+Math.floor(zz/5670)*Math.floor(43*zz/15238);
  const zzz=zz-Math.floor((30-j)/15)*Math.floor(17719*j/50)-Math.floor(j/16)*Math.floor(15238*j/43)+29;
  const hm=Math.floor(24*zzz/709);
  return{y:30*n+j-30, m:hm, d:zzz-Math.floor(709*hm/24)};
}

function loadHijri(){
  try{
    const now=new Date();
    const h=toHijri(now.getFullYear(),now.getMonth()+1,now.getDate());
    const el=document.getElementById('hijri-today');
    if(el) el.textContent=`${h.d} ${HIJRI_MONTHS[h.m-1]} ${h.y} AH`;
    calcEvents(h);
  }catch(e){
    const el=document.getElementById('hijri-today'); if(el) el.textContent='Islamic Calendar';
  }
}

function calcEvents(h){
  const r=document.getElementById('ramadan-txt'), e=document.getElementById('eid-txt');
  // Ramadan info
  if(h.m===9){
    const rem=30-h.d;
    if(r) r.textContent=rem>0?`Ramadan: ${rem} days left`:'Ramadan: Last day! 🌙';
  } else if(h.m<9){
    const daysToRamadan=calcDaysToMonth(h,9);
    if(r) r.textContent=`Ramadan in ~${daysToRamadan} days`;
  } else {
    const daysToRamadan=calcDaysToMonth(h,9)+354;
    if(r) r.textContent=`Ramadan in ~${daysToRamadan} days`;
  }
  // Eid al-Fitr (Shawwal 1)
  if(h.m===10&&h.d<=3){ if(e) e.textContent=`Eid al-Fitr: Day ${h.d}! 🎉`; }
  else if(h.m===9){
    const rem=30-h.d+1;
    if(e) e.textContent=`Eid al-Fitr in ${rem} days 🎁`;
  } else {
    if(e) e.textContent='Eid al-Fitr: Shawwal 1 🎁';
  }
}

function calcDaysToMonth(h, targetMonth){
  let days=0, cm=h.m, cd=h.d;
  while(cm!==targetMonth){ days+=(cm%2===0&&cm!==12)?29:30; cm++; if(cm>12) cm=1; }
  return days - cd + 1;
}

// ═══ HIJRI PAGE (full calendar) ═══
function renderHijriPage(){
  const c=document.getElementById('hijri-page-content'); if(!c) return;
  const now=new Date();
  const h=toHijri(now.getFullYear(),now.getMonth()+1,now.getDate());
  const events=[
    {m:1,d:1,name:'Islamic New Year',ar:'رأس السنة الهجرية',icon:'🌙'},
    {m:1,d:10,name:'Day of Ashura',ar:'يوم عاشوراء',icon:'✨'},
    {m:3,d:12,name:'Mawlid al-Nabi ﷺ',ar:'المولد النبوي',icon:'💚'},
    {m:7,d:27,name:'Isra & Miraj',ar:'الإسراء والمعراج',icon:'⭐'},
    {m:8,d:15,name:'Shab-e-Barat',ar:'ليلة البراءة',icon:'🌟'},
    {m:9,d:1,name:'Ramadan Begins',ar:'بداية رمضان',icon:'🌙'},
    {m:9,d:27,name:'Laylat al-Qadr',ar:'ليلة القدر',icon:'✨'},
    {m:10,d:1,name:'Eid al-Fitr',ar:'عيد الفطر',icon:'🎉'},
    {m:12,d:9,name:'Day of Arafah',ar:'يوم عرفة',icon:'🕋'},
    {m:12,d:10,name:'Eid al-Adha',ar:'عيد الأضحى',icon:'🐑'},
  ];
  let html=`
    <div class="hijri-hero">
      <div class="hh-ar">${HIJRI_MONTHS_AR[h.m-1]}</div>
      <div class="hh-date">${h.d}</div>
      <div class="hh-year">${h.y} AH · ${HIJRI_MONTHS[h.m-1]}</div>
      <div class="hh-greg">${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    </div>
    <div class="sec-hdr" style="padding:12px 20px 6px">Islamic Events This Year</div>
  `;
  events.forEach(ev=>{
    let daysAway=0, status='upcoming';
    if(ev.m===h.m&&ev.d===h.d){ status='today'; daysAway=0; }
    else {
      // rough calc
      const evTotal=ev.m*30+ev.d, curTotal=h.m*30+h.d;
      daysAway=evTotal-curTotal;
      if(daysAway<0) daysAway+=354;
      status=daysAway===0?'today':daysAway<0?'passed':'upcoming';
    }
    const badge=status==='today'?'<span class="ev-badge today-badge">TODAY</span>':
      daysAway>0?`<span class="ev-badge">${daysAway}d away</span>`:
      '<span class="ev-badge passed-badge">Passed</span>';
    html+=`
      <div class="ev-card">
        <div class="ev-icon">${ev.icon}</div>
        <div class="ev-info">
          <div class="ev-name">${ev.name}</div>
          <div class="ev-ar">${ev.ar}</div>
          <div class="ev-date">${ev.d} ${HIJRI_MONTHS[ev.m-1]}</div>
        </div>
        ${badge}
      </div>`;
  });
  // Months grid
  html+=`<div class="sec-hdr" style="padding:12px 20px 6px">Hijri Months</div><div class="months-grid">`;
  HIJRI_MONTHS.forEach((mn,i)=>{
    const active=i+1===h.m?'active':'';
    html+=`<div class="month-pill ${active}"><div class="mp-num">${i+1}</div><div class="mp-ar">${HIJRI_MONTHS_AR[i]}</div><div class="mp-en">${mn}</div></div>`;
  });
  html+=`</div>`;
  c.innerHTML=html;
}

// ═══ LOCATION & PRAYER ═══
function getLocation(){
  if(!navigator.geolocation){ fetchPrayers(21.3891,39.8579); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    S.lat=pos.coords.latitude; S.lon=pos.coords.longitude;
    fetchPrayers(S.lat,S.lon);
    reverseGeo(S.lat,S.lon);
  }, ()=>{
    fetchPrayers(21.3891,39.8579);
    const l=document.getElementById('prayer-loc'); if(l) l.textContent='📍 Mecca (default)';
  });
}
function reverseGeo(lat,lon){
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    .then(r=>r.json()).then(d=>{
      const city=d.address.city||d.address.town||d.address.village||'Your City';
      const country=d.address.country||'';
      const l=document.getElementById('prayer-loc'); if(l) l.textContent=`📍 ${city}, ${country}`;
    }).catch(()=>{});
}
function fetchPrayers(lat,lon){
  const now=new Date();
  fetch(`https://api.aladhan.com/v1/timings/${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}?latitude=${lat}&longitude=${lon}&method=2`)
    .then(r=>r.json()).then(d=>{
      const t=d.data.timings;
      S.prayers={Fajr:t.Fajr,Sunrise:t.Sunrise,Dhuhr:t.Dhuhr,Asr:t.Asr,Maghrib:t.Maghrib,Isha:t.Isha};
      renderPrayers();
      scheduleAdhans();
    }).catch(()=>{});
}
function fmt12(t24){
  if(!t24) return '--:--';
  const[h,m]=t24.split(':').map(Number), ampm=h>=12?'PM':'AM', h12=h%12||12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}
function renderPrayers(){
  const p=S.prayers;
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    const id=name.toLowerCase();
    const pill=document.getElementById(`p-${id}`); if(pill&&p[name]) pill.textContent=fmt12(p[name]);
    const full=document.getElementById(`fpt-${id}`); if(full&&p[name]) full.textContent=fmt12(p[name]);
  });
  if(p.Sunrise){ const s=document.getElementById('fpt-sunrise'); if(s) s.textContent=fmt12(p.Sunrise); }
  updateNextPrayer();
}
function updateNextPrayer(){
  const names=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const now=new Date(), nm=now.getHours()*60+now.getMinutes();
  document.querySelectorAll('.fp-item').forEach(i=>i.classList.remove('next'));
  document.querySelectorAll('.ppill').forEach(i=>i.classList.remove('active'));
  for(const name of names){
    const t=S.prayers[name]; if(!t) continue;
    const[h,m]=t.split(':').map(Number), pm=h*60+m;
    if(pm>nm){
      const rem=pm-nm;
      const hrs=Math.floor(rem/60), mins=rem%60;
      const el=document.getElementById('next-prayer-name'), tel=document.getElementById('next-prayer-time');
      if(el) el.textContent=name;
      if(tel) tel.textContent=`${fmt12(t)} · in ${hrs>0?hrs+'h ':''} ${mins}m`;
      const fp=document.getElementById(`fp-${name.toLowerCase()}`); if(fp) fp.classList.add('next');
      const pp=document.getElementById(`p-${name.toLowerCase()}`);
      if(pp) pp.closest('.ppill')&&pp.closest('.ppill').classList.add('active');
      return;
    }
  }
  // All prayers done today
  const el=document.getElementById('next-prayer-name'), tel=document.getElementById('next-prayer-time');
  if(el) el.textContent='Fajr';
  if(tel) tel.textContent='Tomorrow · ' + (S.prayers.Fajr?fmt12(S.prayers.Fajr):'--:--');
}

// ═══ ADHAN ALARM ═══
function scheduleAdhans(){
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    if(!S.prayers[name]||!S.adhan[name]) return;
    const[h,m]=S.prayers[name].split(':').map(Number);
    const now=new Date(), pt=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
    const delay=pt-now;
    if(delay>0&&delay<86400000){
      setTimeout(()=>{
        const a=document.getElementById('adhan-audio');
        if(a){ a.currentTime=0; a.play().catch(()=>{}); }
        showToast(`🕌 ${name} Adhan — الله أكبر`,5000);
        // vibrate if supported
        if(navigator.vibrate) navigator.vibrate([300,100,300,100,300]);
      }, delay);
    }
  });
}
function setupAdhanToggles(){
  const list=document.getElementById('adhan-list'); if(!list) return;
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    const d=document.createElement('div'); d.className='adhan-item';
    d.innerHTML=`<span>🕌 ${name}</span><button class="toggle ${S.adhan[name]?'on':''}" onclick="toggleAdhan('${name}',this)"></button>`;
    list.appendChild(d);
  });
}
function toggleAdhan(name,btn){
  S.adhan[name]=!S.adhan[name];
  btn.classList.toggle('on',S.adhan[name]);
  localStorage.setItem('mik_adhan',JSON.stringify(S.adhan));
  showToast(S.adhan[name]?`🔔 ${name} Adhan ON`:`🔕 ${name} Adhan OFF`);
}

// ═══ SURAH LIST ═══
function loadSurahs(){
  fetch('https://api.alquran.cloud/v1/surah').then(r=>r.json()).then(d=>{
    S.allSurahs=d.data;
    renderSurahList(d.data);
    loadTafsirSurahList();
  }).catch(()=>showToast('No internet connection'));
}
function renderSurahList(surahs){
  const c=document.getElementById('surah-list'); if(!c) return;
  c.innerHTML='';
  if(!surahs.length){
    c.innerHTML='<div class="empty-state"><div class="empty-ico">📭</div><div>No surahs found</div></div>'; return;
  }
  surahs.forEach(s=>{
    const d=document.createElement('div'); d.className='si';
    d.onclick=()=>openSurah(s.number,s.name,s.englishName,s.numberOfAyahs,s.revelationType);
    d.innerHTML=`<div class="si-num">${s.number}</div><div class="si-info"><div class="si-en">${s.englishName}</div><div class="si-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses · ${s.revelationType}</div></div><div class="si-ar">${s.name}</div>`;
    c.appendChild(d);
  });
}
function renderJuzList(){
  const c=document.getElementById('surah-list'); if(!c) return;
  c.innerHTML='';
  const juzData=[
    {j:1,from:'Al-Fatihah 1',to:'Al-Baqarah 141'},
    {j:2,from:'Al-Baqarah 142',to:'Al-Baqarah 252'},
    {j:3,from:'Al-Baqarah 253',to:'Al-Imran 92'},
    {j:4,from:'Al-Imran 93',to:'An-Nisa 23'},
    {j:5,from:'An-Nisa 24',to:'An-Nisa 147'},
    {j:6,from:'An-Nisa 148',to:'Al-Maidah 81'},
    {j:7,from:'Al-Maidah 82',to:'Al-Anam 110'},
    {j:8,from:'Al-Anam 111',to:'Al-Araf 87'},
    {j:9,from:'Al-Araf 88',to:'Al-Anfal 40'},
    {j:10,from:"Al-Anfal 41",to:'At-Tawbah 92'},
    {j:11,from:'At-Tawbah 93',to:'Hud 5'},
    {j:12,from:'Hud 6',to:'Yusuf 52'},
    {j:13,from:'Yusuf 53',to:'Ibrahim 52'},
    {j:14,from:'Al-Hijr 1',to:'An-Nahl 128'},
    {j:15,from:'Al-Isra 1',to:'Al-Kahf 74'},
    {j:16,from:'Al-Kahf 75',to:'Ta-Ha 135'},
    {j:17,from:'Al-Anbiya 1',to:'Al-Hajj 78'},
    {j:18,from:'Al-Muminun 1',to:'Al-Furqan 20'},
    {j:19,from:'Al-Furqan 21',to:'An-Naml 55'},
    {j:20,from:'An-Naml 56',to:'Al-Ankabut 45'},
    {j:21,from:'Al-Ankabut 46',to:'Al-Ahzab 30'},
    {j:22,from:'Al-Ahzab 31',to:'Ya-Sin 27'},
    {j:23,from:'Ya-Sin 28',to:'Az-Zumar 31'},
    {j:24,from:'Az-Zumar 32',to:'Fussilat 46'},
    {j:25,from:'Fussilat 47',to:'Al-Jathiya 37'},
    {j:26,from:'Al-Ahqaf 1',to:'Adh-Dhariyat 30'},
    {j:27,from:'Adh-Dhariyat 31',to:'Al-Hadid 29'},
    {j:28,from:'Al-Mujadila 1',to:'At-Tahrim 12'},
    {j:29,from:'Al-Mulk 1',to:'Al-Mursalat 50'},
    {j:30,from:'An-Naba 1',to:'An-Nas 6'},
  ];
  juzData.forEach(juz=>{
    const d=document.createElement('div'); d.className='si';
    d.onclick=()=>showToast(`Juz ${juz.j} — Full reader coming soon! 🌟`);
    d.innerHTML=`<div class="si-num">${juz.j}</div><div class="si-info"><div class="si-en">Juz ${juz.j}</div><div class="si-meta">${juz.from} → ${juz.to}</div></div><div class="si-ar">جزء ${juz.j}</div>`;
    c.appendChild(d);
  });
}

// ═══ READER ═══
function openSurah(num,nameAr,nameEn,ayahCount,type){
  S.surah={num,nameAr,nameEn,ayahCount,type}; S.ayah=1;
  document.getElementById('reader-title').textContent=nameEn;
  document.getElementById('reader-sub').textContent=`${nameAr} · ${ayahCount} verses`;
  document.getElementById('bismillah-el').style.display=num===9?'none':'block';
  updateBmBtn();
  saveLastRead(num,nameAr,nameEn,1,ayahCount);
  showPage('page-reader');
  loadReader(num);
}
function loadReader(num){
  const c=document.getElementById('ayah-content');
  c.innerHTML=`<div class="loading-state"><div class="spinner"></div><span>Loading Surah...</span></div>`;
  const key=num+'_'+S.lang;
  if(S.cache[key]){ renderAyahs(S.cache[key]); return; }
  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${num}`).then(r=>r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${num}/${S.lang}`).then(r=>r.json())
  ]).then(([ar,tr])=>{
    const combined=ar.data.ayahs.map((a,i)=>({n:a.numberInSurah,ar:a.text,tr:tr.data.ayahs[i]?.text||''}));
    S.cache[key]=combined; renderAyahs(combined);
  }).catch(()=>{ c.innerHTML='<div class="loading-state">Failed to load. Check internet. 😕</div>'; });
}
function renderAyahs(ayahs){
  const c=document.getElementById('ayah-content'); c.innerHTML='';
  ayahs.forEach(a=>{
    const d=document.createElement('div'); d.className='ayah-item'; d.id=`ay-${a.n}`;
    d.innerHTML=`
      <div class="ayah-top">
        <div class="ayah-num">${a.n}</div>
        <div class="ayah-acts">
          <button class="aab" onclick="playAyah(${a.n})" title="Play">▶</button>
          <button class="aab" onclick="openTafsirSheet(${a.n},'${esc(a.ar)}')" title="Tafsir">📚</button>
          <button class="aab" onclick="bmAyah(${a.n})" title="Bookmark">🔖</button>
          <button class="aab" onclick="copyAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')" title="Copy">📋</button>
          <button class="aab" onclick="shareAyah(${a.n},'${esc(a.ar)}','${esc(a.tr)}')" title="Share">📤</button>
        </div>
      </div>
      <div class="ayah-arabic" style="font-size:${S.asz}px">${a.ar}</div>
      <div class="ayah-trans">${a.tr}</div>
      ${S.tafsirMode?`<div class="ayah-tafsir-inline" id="ti-${a.n}"><span class="tafsir-label">📚 TAFSIR — IBN KATHIR</span><div id="ti-txt-${a.n}">Loading...</div></div>`:''}
    `;
    c.appendChild(d);
    if(S.tafsirMode) loadInlineTafsir(a.n, S.surah?.num);
  });
}
function esc(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/`/g,"'"); }
function changeLang(){ S.lang=document.getElementById('lang-sel').value; S.cache={}; if(S.surah) loadReader(S.surah.num); }
function changeReciter(){ S.reciter=document.getElementById('reciter-sel').value; if(S.playing) playAyah(S.ayah); }
function changeFontSize(d){ S.asz=Math.max(18,Math.min(44,S.asz+d)); document.querySelectorAll('.ayah-arabic').forEach(el=>el.style.fontSize=S.asz+'px'); }

// ═══ TAFSIR INLINE ═══
function toggleTafsirMode(){
  S.tafsirMode=!S.tafsirMode;
  const btn=document.getElementById('tafsir-mode-btn');
  if(btn) btn.classList.toggle('active',S.tafsirMode);
  if(S.surah) loadReader(S.surah.num);
  showToast(S.tafsirMode?'Tafsir mode ON 📚':'Tafsir mode OFF');
}
function loadInlineTafsir(ayahNum, surahNum){
  const el=document.getElementById(`ti-txt-${ayahNum}`); if(!el) return;
  fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah?ayah_key=${surahNum}:${ayahNum}`)
    .then(r=>r.json()).then(d=>{
      const text=d.tafsir?.text||'';
      el.innerHTML=cleanTafsir(text)||'Tafsir not available for this verse.';
    }).catch(()=>{ el.textContent='Tafsir unavailable.'; });
}

// ═══ TAFSIR BOTTOM SHEET ═══
function openTafsirSheet(ayahNum, arabicText){
  const sheet=
