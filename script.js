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
  // Ramadan (month 9)
  if(h.m===9){
    const rem=30-h.d;
    if(r) r.textContent=rem>0?`Ramadan: ${rem} days left 🌙`:'Ramadan: Last day! 🌙';
  } else {
    // calc remaining days in current month + months until Ramadan
    const monthLengths=[30,29,30,29,30,29,30,29,30,29,30,29];
    let days=monthLengths[h.m-1]-h.d; // remaining days this month
    let m=h.m%12+1;
    while(m!==9){ days+=monthLengths[m-1]; m=m%12+1; }
    if(r) r.textContent=`Ramadan in ~${days} days 🌙`;
  }
  // Eid al-Fitr (Shawwal 1 = month 10)
  if(h.m===10&&h.d<=3){
    if(e) e.textContent=`Eid al-Fitr: Day ${h.d}! 🎉`;
  } else if(h.m===9){
    const rem=30-h.d+1;
    if(e) e.textContent=`Eid al-Fitr in ${rem} days 🎁`;
  } else {
    if(e) e.textContent='Eid al-Fitr: Shawwal 1 🎁';
  }
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
  fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.ibn-kathir`)
    .then(r=>r.json()).then(d=>{
      const text=d.data?.text||'';
      el.textContent=text||'Tafsir not available for this verse.';
    }).catch(()=>{ el.textContent='Tafsir unavailable (check internet).'; });
}

// ═══ TAFSIR BOTTOM SHEET ═══
function openTafsirSheet(ayahNum, arabicText){
  const sheet=document.getElementById('tafsir-sheet');
  const title=document.getElementById('sheet-title');
  const ar=document.getElementById('sheet-ar');
  const txt=document.getElementById('sheet-txt');
  if(!sheet) return;
  if(title) title.textContent=`Verse ${ayahNum} · ${S.surah?.nameEn||''}`;
  if(ar) ar.textContent=arabicText;
  if(txt) txt.innerHTML='<div class="loading-state"><div class="spinner"></div></div>';
  sheet.classList.remove('hidden');
  if(!S.surah) return;
  fetch(`https://api.alquran.cloud/v1/ayah/${S.surah.num}:${ayahNum}/en.ibn-kathir`)
    .then(r=>r.json()).then(d=>{
      const text=d.data?.text||'Tafsir not available for this verse.';
      if(txt) txt.textContent=text;
    }).catch(()=>{ if(txt) txt.textContent='Tafsir unavailable. Check internet.'; });
}
function closeSheet(){ const s=document.getElementById('tafsir-sheet'); if(s) s.classList.add('hidden'); }
function cleanTafsir(html){
  const tmp=document.createElement('div'); tmp.innerHTML=html;
  const text=tmp.textContent||tmp.innerText||'';
  return text.replace(/\n{3,}/g,'\n\n').trim();
}

// ═══ TAFSIR PAGE ═══
function loadTafsirSurahList(){
  const c=document.getElementById('tafsir-surah-list'); if(!c||!S.allSurahs.length) return;
  c.innerHTML='';
  S.allSurahs.forEach(s=>{
    const d=document.createElement('div'); d.className='si';
    d.onclick=()=>openTafsirPage(s.number,s.englishName,s.name,s.numberOfAyahs);
    d.innerHTML=`<div class="si-num">${s.number}</div><div class="si-info"><div class="si-en">${s.englishName}</div><div class="si-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses</div></div><div class="si-ar">${s.name}</div>`;
    c.appendChild(d);
  });
}
function openTafsirPage(num,nameEn,nameAr,ayahCount){
  document.getElementById('tafsir-title').textContent=`${nameEn} — Tafsir`;
  const c=document.getElementById('tafsir-content');
  c.innerHTML=`<div class="loading-state"><div class="spinner"></div><span>Loading Tafsir...</span></div>`;
  showPage('page-tafsir-reader');
  fetch(`https://api.alquran.cloud/v1/surah/${num}`)
    .then(r=>r.json()).then(({data})=>{
      c.innerHTML='';
      data.ayahs.forEach((a,i)=>{
        const block=document.createElement('div'); block.className='tafsir-ayah-block';
        block.innerHTML=`<div class="tab-num">VERSE ${a.numberInSurah}</div><div class="tab-arabic">${a.text}</div><div class="tab-text" id="tf-${num}-${a.numberInSurah}"><div class="loading-state"><div class="spinner"></div></div></div>`;
        c.appendChild(block);
        if(i<4) loadTafsirText(num,a.numberInSurah);
      });
      c.addEventListener('scroll', ()=>{
        data.ayahs.forEach(a=>{
          const el=document.getElementById(`tf-${num}-${a.numberInSurah}`);
          if(el&&el.querySelector('.spinner')){
            const rect=el.getBoundingClientRect();
            if(rect.top<window.innerHeight+300) loadTafsirText(num,a.numberInSurah);
          }
        });
      },{passive:true});
    }).catch(()=>{ c.innerHTML='<div class="loading-state">Failed to load. Check internet.</div>'; });
}
function loadTafsirText(surahNum,ayahNum){
  const el=document.getElementById(`tf-${surahNum}-${ayahNum}`); if(!el||!el.querySelector('.spinner')) return;
  fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.ibn-kathir`)
    .then(r=>r.json()).then(d=>{
      const text=d.data?.text||'';
      el.textContent=text||'Tafsir not available for this verse.';
    }).catch(()=>{ el.textContent='Tafsir unavailable.'; });
}

// ═══ AUDIO ═══
function playAyah(num){
  if(!S.surah) return;
  S.ayah=num; S.playing=true;
  const surahStr=String(S.surah.num).padStart(3,'0'), ayahStr=String(num).padStart(3,'0');
  const url=`https://cdn.islamic.network/quran/audio/128/${S.reciter}/${S.surah.num*1000+num}.mp3`;
  const audio=document.getElementById('quran-audio');
  audio.src=url;
  audio.play().catch(()=>{
    const fb=`https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`;
    audio.src=fb; audio.play().catch(()=>showToast('Audio unavailable'));
  });
  document.querySelectorAll('.ayah-item').forEach(e=>e.classList.remove('playing'));
  const el=document.getElementById(`ay-${num}`);
  if(el){ el.classList.add('playing'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
  document.getElementById('play-btn').textContent='⏸';
  document.getElementById('ap-label').textContent=`Playing Verse ${num} of ${S.surah.ayahCount}`;
  saveLastRead(S.surah.num,S.surah.nameAr,S.surah.nameEn,num,S.surah.ayahCount);
}
function togglePlay(){
  const a=document.getElementById('quran-audio');
  if(a.paused){ a.play(); S.playing=true; document.getElementById('play-btn').textContent='⏸'; }
  else{ a.pause(); S.playing=false; document.getElementById('play-btn').textContent='▶'; }
}
function nextAyah(){ if(S.surah&&S.ayah<S.surah.ayahCount) playAyah(S.ayah+1); }
function prevAyah(){ if(S.ayah>1) playAyah(S.ayah-1); }
function onAudioEnd(){
  if(S.repeat){ playAyah(S.ayah); return; }
  if(S.surah&&S.ayah<S.surah.ayahCount) setTimeout(()=>nextAyah(),600);
  else{ document.getElementById('play-btn').textContent='▶'; S.playing=false; }
}
function toggleRepeat(){
  S.repeat=!S.repeat;
  const btn=document.getElementById('repeat-btn');
  btn.style.color=S.repeat?'var(--gold)':''; btn.style.borderColor=S.repeat?'var(--gold)':'';
}
function stopAudio(){ const a=document.getElementById('quran-audio'); a.pause(); a.src=''; S.playing=false; }
function updateProgress(){
  const a=document.getElementById('quran-audio'); if(!a.duration) return;
  const f=document.getElementById('ap-fill'); if(f) f.style.width=((a.currentTime/a.duration)*100)+'%';
}
function copyAyah(num,ar,tr){
  const text=`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num}\nAl-Qur'an Pro · MÎK Edition`;
  navigator.clipboard.writeText(text).then(()=>showToast('Copied! 📋')).catch(()=>showToast('Copy failed'));
}
function shareAyah(num,ar,tr){
  const text=`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num}\nAl-Qur'an Pro · MÎK Edition`;
  if(navigator.share) navigator.share({title:"Al-Qur'an — MÎK Edition",text}).catch(()=>{});
  else copyAyah(num,ar,tr);
}

// ═══ LAST READ ═══
function saveLastRead(surahNum,nameAr,nameEn,ayahNum,ayahCount){
  S.lastRead={surahNum,nameAr,nameEn,ayahNum,ayahCount};
  localStorage.setItem('mik_lr',JSON.stringify(S.lastRead));
  renderLastRead();
}
function renderLastRead(){
  const wrap=document.getElementById('last-read-wrap'); if(!wrap) return;
  if(!S.lastRead){ wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');
  const nm=document.getElementById('lr-name'), sb=document.getElementById('lr-sub');
  if(nm) nm.textContent=S.lastRead.nameEn;
  if(sb) sb.textContent=`Verse ${S.lastRead.ayahNum} of ${S.lastRead.ayahCount}`;
}
function continueReading(){
  if(!S.lastRead) return;
  const lr=S.lastRead;
  const surah=S.allSurahs.find(s=>s.number===lr.surahNum);
  if(surah){
    openSurah(lr.surahNum,lr.nameAr,lr.nameEn,lr.ayahCount,'');
    setTimeout(()=>{
      const el=document.getElementById(`ay-${lr.ayahNum}`);
      if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
    },800);
  }
}

// ═══ BOOKMARKS ═══
function toggleBookmarkSurah(){
  if(!S.surah) return;
  const idx=S.bookmarks.findIndex(b=>b.surahNum===S.surah.num&&!b.ayahNum);
  if(idx>-1){ S.bookmarks.splice(idx,1); showToast('Bookmark removed'); }
  else{ S.bookmarks.push({surahNum:S.surah.num,nameEn:S.surah.nameEn,nameAr:S.surah.nameAr}); showToast('Bookmarked! 🔖'); }
  localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));
  updateBmBtn();
}
function bmAyah(num){
  if(!S.surah) return;
  const idx=S.bookmarks.findIndex(b=>b.surahNum===S.surah.num&&b.ayahNum===num);
  if(idx>-1){ S.bookmarks.splice(idx,1); showToast('Bookmark removed'); }
  else{ S.bookmarks.push({surahNum:S.surah.num,ayahNum:num,nameEn:S.surah.nameEn,nameAr:S.surah.nameAr}); showToast('Verse bookmarked! 🔖'); }
  localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));
}
function updateBmBtn(){
  const btn=document.getElementById('bm-btn'); if(!btn||!S.surah) return;
  const saved=S.bookmarks.some(b=>b.surahNum===S.surah.num&&!b.ayahNum);
  btn.style.color=saved?'var(--gold)':'';
}
function renderBookmarks(){
  const c=document.getElementById('bm-list'); if(!c) return;
  if(!S.bookmarks.length){
    c.innerHTML='<div class="empty-state"><div class="empty-ico">🔖</div><div>No bookmarks yet</div><div style="font-size:12px;color:var(--text3);margin-top:6px">Tap 🔖 on any Surah or verse</div></div>';
    return;
  }
  c.innerHTML='';
  S.bookmarks.forEach((b,i)=>{
    const d=document.createElement('div'); d.className='bm-item';
    d.onclick=()=>{
      const s=S.allSurahs.find(x=>x.number===b.surahNum);
      if(s) openSurah(s.number,s.name,s.englishName,s.numberOfAyahs,s.revelationType);
    };
    d.innerHTML=`
      <div class="bm-ico">${b.ayahNum?'📝':'📖'}</div>
      <div class="bm-info">
        <div class="bm-name">${b.nameEn}${b.ayahNum?' — Verse '+b.ayahNum:''}</div>
        <div class="bm-ar">${b.nameAr}</div>
      </div>
      <button class="bm-del" onclick="event.stopPropagation();deleteBm(${i})">✕</button>`;
    c.appendChild(d);
  });
}
function deleteBm(i){
  S.bookmarks.splice(i,1);
  localStorage.setItem('mik_bm',JSON.stringify(S.bookmarks));
  renderBookmarks();
}

// ═══ QIBLA ═══
function startQibla(){
  const info=document.getElementById('qibla-info'), deg=document.getElementById('qibla-deg');
  if(!navigator.geolocation){ if(info) info.textContent='Location not supported'; return; }
  if(info) info.textContent='Getting your location...';
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude, lon=pos.coords.longitude;
    const qiblaDir=calcQibla(lat,lon);
    if(deg) deg.textContent=`${Math.round(qiblaDir)}° from North`;
    if(info) info.textContent='Point the arrow toward Mecca 🕋';
    // Start compass
    if(window.DeviceOrientationEvent){
      const handler=(e)=>{
        const alpha=e.alpha||e.webkitCompassHeading||0;
        const needle=document.getElementById('qibla-needle');
        if(needle) needle.style.transform=`rotate(${qiblaDir-alpha}deg)`;
      };
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        DeviceOrientationEvent.requestPermission().then(()=>window.addEventListener('deviceorientation',handler,true)).catch(()=>staticQibla(qiblaDir,info));
      } else {
        window.addEventListener('deviceorientation',handler,true);
      }
    } else { staticQibla(qiblaDir,info); }
  },()=>{ if(info) info.textContent='Location permission denied. Using Mecca as default.'; });
}
function staticQibla(dir,info){
  const needle=document.getElementById('qibla-needle');
  if(needle) needle.style.transform=`rotate(${dir}deg)`;
  if(info) info.textContent=`Qibla is ${Math.round(dir)}° from North (compass not available on this device)`;
}
function calcQibla(lat,lon){
  const mLat=21.4225*Math.PI/180, mLon=39.8262*Math.PI/180;
  const uLat=lat*Math.PI/180, uLon=lon*Math.PI/180;
  const dLon=mLon-uLon;
  const x=Math.cos(mLat)*Math.sin(dLon);
  const y=Math.cos(uLat)*Math.sin(mLat)-Math.sin(uLat)*Math.cos(mLat)*Math.cos(dLon);
  const brng=Math.atan2(x,y)*180/Math.PI;
  return (brng+360)%360;
}

// ═══ 99 NAMES ALLAH ═══
const ALLAH_NAMES=[
  {n:'الرَّحْمَنُ',t:'Ar-Rahman',m:'The Most Gracious'},{n:'الرَّحِيمُ',t:'Ar-Rahim',m:'The Most Merciful'},
  {n:'الْمَلِكُ',t:'Al-Malik',m:'The King'},{n:'الْقُدُّوسُ',t:'Al-Quddus',m:'The Most Holy'},
  {n:'السَّلَامُ',t:'As-Salam',m:'The Source of Peace'},{n:'الْمُؤْمِنُ',t:'Al-Mumin',m:'The Infuser of Faith'},
  {n:'الْمُهَيْمِنُ',t:'Al-Muhaymin',m:'The Guardian'},{n:'الْعَزِيزُ',t:'Al-Aziz',m:'The Almighty'},
  {n:'الْجَبَّارُ',t:'Al-Jabbar',m:'The Compeller'},{n:'الْمُتَكَبِّرُ',t:'Al-Mutakabbir',m:'The Supreme'},
  {n:'الْخَالِقُ',t:'Al-Khaliq',m:'The Creator'},{n:'الْبَارِئُ',t:'Al-Bari',m:'The Evolver'},
  {n:'الْمُصَوِّرُ',t:'Al-Musawwir',m:'The Fashioner'},{n:'الْغَفَّارُ',t:'Al-Ghaffar',m:'The Forgiver'},
  {n:'الْقَهَّارُ',t:'Al-Qahhar',m:'The Subduer'},{n:'الْوَهَّابُ',t:'Al-Wahhab',m:'The Bestower'},
  {n:'الرَّزَّاقُ',t:'Ar-Razzaq',m:'The Provider'},{n:'الْفَتَّاحُ',t:'Al-Fattah',m:'The Opener'},
  {n:'الْعَلِيمُ',t:'Al-Alim',m:'The All-Knowing'},{n:'الْقَابِضُ',t:'Al-Qabid',m:'The Withholder'},
  {n:'الْبَاسِطُ',t:'Al-Basit',m:'The Extender'},{n:'الْخَافِضُ',t:'Al-Khafid',m:'The Reducer'},
  {n:'الرَّافِعُ',t:'Ar-Rafi',m:'The Exalter'},{n:'الْمُعِزُّ',t:'Al-Muizz',m:'The Honourer'},
  {n:'الْمُذِلُّ',t:'Al-Mudhill',m:'The Dishonourer'},{n:'السَّمِيعُ',t:'As-Sami',m:'The All-Hearing'},
  {n:'الْبَصِيرُ',t:'Al-Basir',m:'The All-Seeing'},{n:'الْحَكَمُ',t:'Al-Hakam',m:'The Judge'},
  {n:'الْعَدْلُ',t:'Al-Adl',m:'The Just'},{n:'اللَّطِيفُ',t:'Al-Latif',m:'The Subtle One'},
  {n:'الْخَبِيرُ',t:'Al-Khabir',m:'The All-Aware'},{n:'الْحَلِيمُ',t:'Al-Halim',m:'The Forbearing'},
  {n:'الْعَظِيمُ',t:'Al-Azim',m:'The Magnificent'},{n:'الْغَفُورُ',t:'Al-Ghafur',m:'The Forgiving'},
  {n:'الشَّكُورُ',t:'Ash-Shakur',m:'The Appreciative'},{n:'الْعَلِيُّ',t:'Al-Ali',m:'The Most High'},
  {n:'الْكَبِيرُ',t:'Al-Kabir',m:'The Greatest'},{n:'الْحَفِيظُ',t:'Al-Hafiz',m:'The Preserver'},
  {n:'الْمُقِيتُ',t:'Al-Muqit',m:'The Sustainer'},{n:'الْحَسِيبُ',t:'Al-Hasib',m:'The Reckoner'},
  {n:'الْجَلِيلُ',t:'Al-Jalil',m:'The Majestic'},{n:'الْكَرِيمُ',t:'Al-Karim',m:'The Generous'},
  {n:'الرَّقِيبُ',t:'Ar-Raqib',m:'The Watchful'},{n:'الْمُجِيبُ',t:'Al-Mujib',m:'The Responder'},
  {n:'الْوَاسِعُ',t:'Al-Wasi',m:'The All-Encompassing'},{n:'الْحَكِيمُ',t:'Al-Hakim',m:'The Wise'},
  {n:'الْوَدُودُ',t:'Al-Wadud',m:'The Loving'},{n:'الْمَجِيدُ',t:'Al-Majid',m:'The Glorious'},
  {n:'الْبَاعِثُ',t:'Al-Baith',m:'The Resurrector'},{n:'الشَّهِيدُ',t:'Ash-Shahid',m:'The Witness'},
  {n:'الْحَقُّ',t:'Al-Haqq',m:'The Truth'},{n:'الْوَكِيلُ',t:'Al-Wakil',m:'The Trustee'},
  {n:'الْقَوِيُّ',t:'Al-Qawi',m:'The All-Strong'},{n:'الْمَتِينُ',t:'Al-Matin',m:'The Firm'},
  {n:'الْوَلِيُّ',t:'Al-Wali',m:'The Protecting Friend'},{n:'الْحَمِيدُ',t:'Al-Hamid',m:'The Praiseworthy'},
  {n:'الْمُحْصِي',t:'Al-Muhsi',m:'The Counter'},{n:'الْمُبْدِئُ',t:'Al-Mubdi',m:'The Originator'},
  {n:'الْمُعِيدُ',t:'Al-Muid',m:'The Restorer'},{n:'الْمُحْيِي',t:'Al-Muhyi',m:'The Giver of Life'},
  {n:'الْمُمِيتُ',t:'Al-Mumit',m:'The Taker of Life'},{n:'الْحَيُّ',t:'Al-Hayy',m:'The Ever-Living'},
  {n:'الْقَيُّومُ',t:'Al-Qayyum',m:'The Self-Sustaining'},{n:'الْوَاجِدُ',t:'Al-Wajid',m:'The Finder'},
  {n:'الْمَاجِدُ',t:'Al-Majid',m:'The Noble'},{n:'الْوَاحِدُ',t:'Al-Wahid',m:'The One'},
  {n:'الْأَحَدُ',t:'Al-Ahad',m:'The Unique'},{n:'الصَّمَدُ',t:'As-Samad',m:'The Eternal'},
  {n:'الْقَادِرُ',t:'Al-Qadir',m:'The Capable'},{n:'الْمُقْتَدِرُ',t:'Al-Muqtadir',m:'The Powerful'},
  {n:'الْمُقَدِّمُ',t:'Al-Muqaddim',m:'The Expediter'},{n:'الْمُؤَخِّرُ',t:'Al-Muakhkhir',m:'The Delayer'},
  {n:'الْأَوَّلُ',t:'Al-Awwal',m:'The First'},{n:'الْآخِرُ',t:'Al-Akhir',m:'The Last'},
  {n:'الظَّاهِرُ',t:'Az-Zahir',m:'The Manifest'},{n:'الْبَاطِنُ',t:'Al-Batin',m:'The Hidden'},
  {n:'الْوَالِي',t:'Al-Wali',m:'The Governor'},{n:'الْمُتَعَالِي',t:'Al-Mutaali',m:'The Self Exalted'},
  {n:'الْبَرُّ',t:'Al-Barr',m:'The Source of Goodness'},{n:'التَّوَّابُ',t:'At-Tawwab',m:'The Accepter of Repentance'},
  {n:'الْمُنْتَقِمُ',t:'Al-Muntaqim',m:'The Avenger'},{n:'الْعَفُوُّ',t:'Al-Afuw',m:'The Pardoner'},
  {n:'الرَّءُوفُ',t:'Ar-Rauf',m:'The Most Kind'},{n:'مَالِكُ الْمُلْكِ',t:'Malik-ul-Mulk',m:'Owner of All Sovereignty'},
  {n:'ذُو الْجَلَالِ وَالْإِكْرَامِ',t:'Dhul-Jalali-wal-Ikram',m:'Lord of Majesty and Bounty'},
  {n:'الْمُقْسِطُ',t:'Al-Muqsit',m:'The Equitable'},{n:'الْجَامِعُ',t:'Al-Jami',m:'The Gatherer'},
  {n:'الْغَنِيُّ',t:'Al-Ghani',m:'The Self-Sufficient'},{n:'الْمُغْنِي',t:'Al-Mughni',m:'The Enricher'},
  {n:'الْمَانِعُ',t:'Al-Mani',m:'The Withholder'},{n:'الضَّارُّ',t:'Ad-Darr',m:'The Distresser'},
  {n:'النَّافِعُ',t:'An-Nafi',m:'The Propitious'},{n:'النُّورُ',t:'An-Nur',m:'The Light'},
  {n:'الْهَادِي',t:'Al-Hadi',m:'The Guide'},{n:'الْبَدِيعُ',t:'Al-Badi',m:'The Incomparable'},
  {n:'الْبَاقِي',t:'Al-Baqi',m:'The Everlasting'},{n:'الْوَارِثُ',t:'Al-Warith',m:'The Inheritor'},
  {n:'الرَّشِيدُ',t:'Ar-Rashid',m:'The Guide to the Right Path'},{n:'الصَّبُورُ',t:'As-Sabur',m:'The Patient'},
];
function loadNames(){
  const c=document.getElementById('names-grid'); if(!c) return;
  ALLAH_NAMES.forEach((nm,i)=>{
    const d=document.createElement('div'); d.className='name-card';
    d.innerHTML=`<div class="nc-num">${i+1}</div><div class="nc-ar">${nm.n}</div><div class="nc-tr">${nm.t}</div><div class="nc-mn">${nm.m}</div>`;
    c.appendChild(d);
  });
}

// ═══ 99 NAMES PROPHET ﷺ ═══
const PROPHET_NAMES=[
  {n:'مُحَمَّدٌ',t:'Muhammad',m:'The Praised One'},{n:'أَحْمَدُ',t:'Ahmad',m:'The Most Praiseworthy'},
  {n:'الْمَاحِي',t:'Al-Mahi',m:'The Obliterator (of disbelief)'},{n:'الْحَاشِرُ',t:'Al-Hashir',m:'The Gatherer'},
  {n:'الْعَاقِبُ',t:'Al-Aqib',m:'The Last of the Prophets'},{n:'طَه',t:'Taha',m:'Pure and Good'},
  {n:'يَس',t:'Yasin',m:'O Human / Leader'},{n:'الْمُصْطَفَى',t:'Al-Mustafa',m:'The Chosen One'},
  {n:'الْمُجْتَبَى',t:'Al-Mujtaba',m:'The Selected'},{n:'الْأَمِينُ',t:'Al-Amin',m:'The Trustworthy'},
  {n:'الرَّسُولُ',t:'Ar-Rasul',m:'The Messenger'},{n:'النَّبِيُّ',t:'An-Nabi',m:'The Prophet'},
  {n:'الصَّادِقُ',t:'As-Sadiq',m:'The Truthful'},{n:'الشَّاهِدُ',t:'Ash-Shahid',m:'The Witness'},
  {n:'الشَّهِيدُ',t:'Ash-Shahid',m:'The Martyr/Witness'},{n:'الْمُبَشِّرُ',t:'Al-Mubashshir',m:'The Bringer of Good News'},
  {n:'النَّذِيرُ',t:'An-Nadhir',m:'The Warner'},{n:'الدَّاعِي',t:'Ad-Dai',m:'The Caller to Allah'},
  {n:'السِّرَاجُ الْمُنِيرُ',t:'As-Siraj al-Munir',m:'The Luminous Lamp'},{n:'رَحْمَةٌ لِّلْعَالَمِينَ',t:'Rahmatun lil-Alamin',m:'Mercy to All Worlds'},
  {n:'الْكَرِيمُ',t:'Al-Karim',m:'The Noble'},{n:'الشَّفِيعُ',t:'Ash-Shafi',m:'The Intercessor'},
  {n:'حَبِيبُ اللَّهِ',t:'Habibullah',m:"Allah's Beloved"},{n:'خَلِيلُ اللَّهِ',t:'Khalilullah',m:"Allah's Close Friend"},
  {n:'كَلِيمُ اللَّهِ',t:'Kalimullah',m:'The One Allah Spoke To (in regard to Musa)'},{n:'صَفِيُّ اللَّهِ',t:'Safiyyullah',m:"Allah's Chosen Pure One"},
  {n:'نَبِيُّ الرَّحْمَةِ',t:"Nabi ar-Rahma",m:'Prophet of Mercy'},{n:'نَبِيُّ التَّوْبَةِ',t:'Nabi at-Tawba',m:'Prophet of Repentance'},
  {n:'نَبِيُّ الْمَلَاحِمِ',t:'Nabi al-Malahim',m:'Prophet of Great Battles'},{n:'الْفَاتِحُ',t:'Al-Fatih',m:'The Opener'},
  {n:'الْخَاتَمُ',t:'Al-Khatam',m:'The Seal (Last Prophet)'},{n:'الْمُخْتَارُ',t:'Al-Mukhtar',m:'The Elected'},
  {n:'أَبُو الْقَاسِمِ',t:'Abu al-Qasim',m:'Father of Qasim'},{n:'الرَّؤُوفُ',t:'Ar-Rauf',m:'The Compassionate'},
  {n:'الرَّحِيمُ',t:'Ar-Rahim',m:'The Merciful'},{n:'الشَّكُورُ',t:'Ash-Shakur',m:'The Grateful'},
  {n:'أَوَّلُ الْأَنْبِيَاءِ',t:"Awwal al-Anbiya'",m:'First of the Prophets (in creation)'},{n:'سَيِّدُ الْمُرْسَلِينَ',t:'Sayyid al-Mursalin',m:'Master of the Messengers'},
  {n:'إِمَامُ الْمُتَّقِينَ',t:'Imam al-Muttaqin',m:'Leader of the Pious'},{n:'قَائِدُ الْغُرِّ الْمُحَجَّلِينَ',t:'Leader of the Radiant',m:'Leader of the Radiant Ones'},
];
function loadProphetNames(){
  const c=document.getElementById('prophet-grid'); if(!c) return;
  PROPHET_NAMES.forEach((nm,i)=>{
    const d=document.createElement('div'); d.className='name-card prophet-card';
    d.innerHTML=`<div class="nc-num">${i+1}</div><div class="nc-ar">${nm.n}</div><div class="nc-tr">${nm.t}</div><div class="nc-mn">${nm.m}</div>`;
    c.appendChild(d);
  });
}

// ═══ TASBEEH ═══
function doCount(){
  S.tCount++; S.tTotal++;
  document.getElementById('t-count').textContent=S.tCount;
  document.getElementById('t-total').textContent=S.tTotal;
  if(navigator.vibrate) navigator.vibrate(30);
  const prog=document.getElementById('t-prog');
  if(prog){
    const pct=Math.min(S.tCount/S.tTarget,1);
    const circ=2*Math.PI*95; prog.style.strokeDashoffset=circ*(1-pct);
  }
  if(S.tCount>=S.tTarget){
    S.tSets++;
    document.getElementById('t-sets').textContent=S.tSets;
    S.tCount=0;
    document.getElementById('t-count').textContent='0';
    if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
    showToast(`✨ SubhanAllah! Set ${S.tSets} complete!`);
    const prog=document.getElementById('t-prog');
    if(prog){ const circ=2*Math.PI*95; prog.style.strokeDashoffset=circ; }
  }
}
function resetT(){
  S.tCount=0; S.tSets=0; S.tTotal=0;
  document.getElementById('t-count').textContent='0';
  document.getElementById('t-sets').textContent='0';
  document.getElementById('t-total').textContent='0';
  const prog=document.getElementById('t-prog');
  if(prog){ const circ=2*Math.PI*95; prog.style.strokeDashoffset=circ; }
}
function setTarget(n){
  S.tTarget=n; S.tCount=0;
  document.getElementById('t-target').textContent=n;
  document.getElementById('t-count').textContent='0';
  const prog=document.getElementById('t-prog');
  if(prog){ const circ=2*Math.PI*95; prog.style.strokeDashoffset=circ; }
}
function changeZikr(){
  const sel=document.getElementById('zikr-sel').value.split('|');
  S.zikr={ar:sel[0],name:sel[1]};
  const ar=document.getElementById('t-arabic'); if(ar) ar.textContent=sel[0];
  resetT();
}
// Init tasbeeh circle
window.addEventListener('DOMContentLoaded',()=>{
  const prog=document.getElementById('t-prog');
  if(prog){ const circ=2*Math.PI*95; prog.style.strokeDasharray=circ; prog.style.strokeDashoffset=circ; }
});

// ═══ ZAKAT ═══
const NISAB_USD=5000;
const CURRENCY_NISAB={USD:5000,PKR:1400000,AFN:360000,GBP:4000,EUR:4600,SAR:18750};
function calcZakat(){
  const cur=document.getElementById('z-currency')?.value||'USD';
  const savings=parseFloat(document.getElementById('z-savings')?.value)||0;
  const gold=parseFloat(document.getElementById('z-gold')?.value)||0;
  const silver=parseFloat(document.getElementById('z-silver')?.value)||0;
  const business=parseFloat(document.getElementById('z-business')?.value)||0;
  const debts=parseFloat(document.getElementById('z-debts')?.value)||0;
  const total=savings+gold+silver+business-debts;
  const nisab=CURRENCY_NISAB[cur]||NISAB_USD;
  const amtEl=document.getElementById('zr-amt'), subEl=document.getElementById('zr-sub');
  const symbols={USD:'$',PKR:'₨',AFN:'؋',GBP:'£',EUR:'€',SAR:'﷼'};
  const sym=symbols[cur]||'';
  if(total<nisab){
    if(amtEl) amtEl.textContent='0';
    if(subEl) subEl.textContent=`Below Nisab (${sym}${nisab.toLocaleString()}). No Zakat due.`;
  } else {
    const z=total*0.025;
    if(amtEl) amtEl.textContent=`${sym}${z.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    if(subEl) subEl.textContent=`2.5% of ${sym}${total.toLocaleString()} net assets. Alhamdulillah! 💚`;
  }
}

// ═══ ANIMATIONS ═══
const style=document.createElement('style');
style.textContent=`
@keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes pageIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes barFill{from{width:0}to{width:100%}}
@keyframes ringSpin{to{transform:rotate(360deg)}}
@keyframes iconGlow{from{text-shadow:0 0 10px rgba(201,150,58,0.3)}to{text-shadow:0 0 30px rgba(201,150,58,0.8)}}
@keyframes orbF{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.1) translate(10px,-10px)}}
@keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(201,150,58,0.7)}70%{box-shadow:0 0 0 8px rgba(201,150,58,0)}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{width:24px;height:24px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 8px;}
.loading-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;color:var(--text2);font-size:13px;gap:4px;}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--text2);font-size:14px;}
.empty-ico{font-size:48px;margin-bottom:12px;}
/* Bookmark page items */
.bm-list{flex:1;overflow-y:auto;padding:12px 16px;}
.bm-item{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:14px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;}
.bm-ico{font-size:22px;}
.bm-info{flex:1;}
.bm-name{font-size:14px;font-weight:600;color:var(--text);}
.bm-ar{font-family:var(--fa);font-size:14px;color:var(--gold);margin-top:2px;}
.bm-del{background:none;border:none;color:var(--text3);font-size:16px;cursor:pointer;padding:6px;}
/* Name cards */
.names-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:12px 16px 80px;overflow-y:auto;flex:1;}
.name-card{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:14px 12px;text-align:center;transition:all 0.2s;position:relative;overflow:hidden;}
.name-card:active{transform:scale(0.97);}
.prophet-card{border-color:rgba(61,189,125,0.15);}
.nc-num{font-family:var(--fd);font-size:9px;color:var(--text3);position:absolute;top:8px;left:10px;letter-spacing:1px;}
.nc-ar{font-family:var(--fa);font-size:20px;color:var(--gold2);margin:8px 0 4px;line-height:1.4;}
.nc-tr{font-family:var(--fd);font-size:11px;color:var(--text);letter-spacing:0.5px;margin-bottom:3px;}
.nc-mn{font-size:11px;color:var(--text2);line-height:1.3;}
/* Hijri page */
.hijri-hero{margin:12px 16px;background:linear-gradient(135deg,rgba(201,150,58,0.12),rgba(201,150,58,0.02));border:1px solid var(--border);border-radius:20px;padding:24px;text-align:center;}
.hh-ar{font-family:var(--fa);font-size:22px;color:var(--gold);margin-bottom:6px;}
.hh-date{font-family:var(--fd);font-size:64px;font-weight:900;color:var(--text);line-height:1;}
.hh-year{font-family:var(--fd);font-size:14px;color:var(--gold2);margin:6px 0 4px;letter-spacing:2px;}
.hh-greg{font-size:12px;color:var(--text2);}
.ev-card{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:12px 16px;margin:0 16px 8px;}
.ev-icon{font-size:24px;flex-shrink:0;}
.ev-info{flex:1;}
.ev-name{font-size:14px;font-weight:600;color:var(--text);}
.ev-ar{font-family:var(--fa);font-size:13px;color:var(--gold);margin:1px 0;}
.ev-date{font-size:11px;color:var(--text2);}
.ev-badge{font-family:var(--fd);font-size:9px;letter-spacing:1px;padding:3px 8px;border-radius:12px;background:rgba(201,150,58,0.1);color:var(--gold);border:1px solid rgba(201,150,58,0.2);white-space:nowrap;}
.today-badge{background:rgba(201,150,58,0.25);color:var(--gold2);}
.passed-badge{background:rgba(107,99,85,0.1);color:var(--text3);}
.months-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px 80px;}
.month-pill{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:12px 8px;text-align:center;}
.month-pill.active{border-color:var(--gold);background:rgba(201,150,58,0.08);}
.mp-num{font-family:var(--fd);font-size:9px;color:var(--text3);margin-bottom:3px;}
.mp-ar{font-family:var(--fa);font-size:14px;color:var(--gold);margin-bottom:2px;}
.mp-en{font-size:9px;color:var(--text2);}
`;
document.head.appendChild(style);
