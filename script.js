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
};

// ═══ INIT ═══
window.addEventListener('DOMContentLoaded', ()=>{
  applyTheme();
  setTimeout(()=>{
    const sp = document.getElementById('splash');
    sp.style.transition='opacity 0.5s'; sp.style.opacity='0';
    setTimeout(()=>{ sp.style.display='none'; showPage('page-home'); }, 500);
  }, 2800);
  startClock(); loadHijri(); getLocation();
  loadSurahs(); loadNames(); loadProphetNames();
  setupAdhanToggles(); renderBookmarks(); renderLastRead();
});

// ═══ THEME ═══
function applyTheme(){ document.documentElement.setAttribute('data-theme', S.theme==='light'?'light':''); }
function toggleTheme(){
  S.theme = S.theme==='dark'?'light':'dark';
  localStorage.setItem('mik_theme', S.theme); applyTheme();
  const btn = document.getElementById('theme-btn');
  if(btn) btn.textContent = S.theme==='dark'?'☀️':'🌙';
}

// ═══ NAVIGATION ═══
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const p = document.getElementById(id);
  if(p) p.classList.remove('hidden');
  if(id==='page-bookmarks') renderBookmarks();
  if(id==='page-tafsir-home') loadTafsirSurahList();
}
function setNav(el){
  const nav = el.closest('.bnav');
  if(nav) nav.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
}
function toggleSearch(){
  const b = document.getElementById('sbar');
  if(b){ b.classList.toggle('hidden'); if(!b.classList.contains('hidden')) document.getElementById('sinput').focus(); }
}
function filterSurahs(){
  const q = (document.getElementById('sinput').value||'').toLowerCase();
  renderSurahList(S.allSurahs.filter(s=>
    s.englishName.toLowerCase().includes(q)||s.englishNameTranslation.toLowerCase().includes(q)||String(s.number).includes(q)
  ));
}
function setTab(el, type){
  el.closest('.jtabs').querySelectorAll('.jtab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if(type==='surah') renderSurahList(S.allSurahs);
  else if(type==='fav'){
    const favNums = S.bookmarks.filter(b=>!b.ayahNum).map(b=>b.surahNum);
    renderSurahList(S.allSurahs.filter(s=>favNums.includes(s.number)));
  }
  else if(type==='juz') renderJuzList();
}

// ═══ CLOCK ═══
function startClock(){
  const tick=()=>{
    const now=new Date(), h=String(now.getHours()).padStart(2,'0'), m=String(now.getMinutes()).padStart(2,'0');
    const el=document.getElementById('current-time'); if(el) el.textContent=`${h}:${m}`;
    updateNextPrayer();
  };
  tick(); setInterval(tick,1000);
}

// ═══ HIJRI DATE ═══
function loadHijri(){
  const months=['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaaban','Ramadan','Shawwal','Dhul Qidah','Dhul Hijjah'];
  try{
    const now=new Date(), h=toHijri(now.getFullYear(),now.getMonth()+1,now.getDate());
    const el=document.getElementById('hijri-today');
    if(el) el.textContent=`${h.d} ${months[h.m-1]} ${h.y} AH`;
    calcEvents(h);
  }catch(e){ const el=document.getElementById('hijri-today'); if(el) el.textContent='Islamic Calendar'; }
}
function toHijri(y,m,d){
  if(m<=2){y--;m+=12;}
  const A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  const jd=Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524;
  const z=jd-1948440+10632, n=Math.floor((z-1)/10631), zz=z-10631*n+354;
  const j=Math.floor((10985-zz)/5316)*Math.floor(50*zz/17719)+Math.floor(zz/5670)*Math.floor(43*zz/15238);
  const zzz=zz-Math.floor((30-j)/15)*Math.floor(17719*j/50)-Math.floor(j/16)*Math.floor(15238*j/43)+29;
  return{y:30*n+j-30, m:Math.floor(24*zzz/709), d:zzz-Math.floor(709*Math.floor(24*zzz/709)/24)};
}
function calcEvents(h){
  const r=document.getElementById('ramadan-txt'), e=document.getElementById('eid-txt');
  if(h.m===9){ const rem=30-h.d; if(r) r.textContent=rem>0?`Ramadan: ${rem}d left`:'Ramadan: Last day!'; }
  else{ if(r) r.textContent='Ramadan: Month 9'; }
  if(h.m===10&&h.d<=3){ if(e) e.textContent=`Eid al-Fitr: Day ${h.d}! 🎉`; }
  else{ if(e) e.textContent='Eid: Shawwal 1'; }
}

// ═══ LOCATION & PRAYER ═══
function getLocation(){
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos=>{
    fetchPrayers(pos.coords.latitude, pos.coords.longitude);
    reverseGeo(pos.coords.latitude, pos.coords.longitude);
  }, ()=>{ fetchPrayers(21.3891, 39.8579); const l=document.getElementById('prayer-loc'); if(l) l.textContent='📍 Mecca (default)'; });
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
      renderPrayers(); scheduleAdhans();
    }).catch(()=>{});
}
function fmt12(t24){
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
      const el=document.getElementById('next-prayer-name'), tel=document.getElementById('next-prayer-time');
      if(el) el.textContent=name;
      if(tel) tel.textContent=`${fmt12(t)} · in ${rem}min`;
      const fp=document.getElementById(`fp-${name.toLowerCase()}`); if(fp) fp.classList.add('next');
      return;
    }
  }
}
function scheduleAdhans(){
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name=>{
    if(!S.prayers[name]||!S.adhan[name]) return;
    const[h,m]=S.prayers[name].split(':').map(Number);
    const now=new Date(), pt=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
    const delay=pt-now;
    if(delay>0&&delay<86400000) setTimeout(()=>{ const a=document.getElementById('adhan-audio'); if(a) a.play().catch(()=>{}); showToast(`🕌 ${name} Adhan`); }, delay);
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
function toggleAdhan(name,btn){ S.adhan[name]=!S.adhan[name]; btn.classList.toggle('on',S.adhan[name]); }

// ═══ SURAH LIST ═══
function loadSurahs(){
  fetch('https://api.alquran.cloud/v1/surah').then(r=>r.json()).then(d=>{
    S.allSurahs=d.data; renderSurahList(d.data);
    loadTafsirSurahList();
  }).catch(()=>showToast('No internet connection'));
}
function renderSurahList(surahs){
  const c=document.getElementById('surah-list'); if(!c) return;
  c.innerHTML='';
  if(!surahs.length){ c.innerHTML='<div class="empty-state"><div class="empty-ico">📭</div><div>No surahs found</div></div>'; return; }
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
  for(let j=1;j<=30;j++){
    const d=document.createElement('div'); d.className='si';
    d.onclick=()=>showToast(`Juz ${j} coming soon! 🌟`);
    d.innerHTML=`<div class="si-num">${j}</div><div class="si-info"><div class="si-en">Juz ${j}</div><div class="si-meta">Part ${j} of 30</div></div><div class="si-ar">جزء ${j}</div>`;
    c.appendChild(d);
  }
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
  c.innerHTML=`<div class="loading-state"><div class="spinner"></div>Loading...</div>`;
  const key=num+'_'+S.lang;
  if(S.cache[key]){ renderAyahs(S.cache[key]); return; }
  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${num}`).then(r=>r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${num}/${S.lang}`).then(r=>r.json())
  ]).then(([ar,tr])=>{
    const combined=ar.data.ayahs.map((a,i)=>({n:a.numberInSurah,ar:a.text,tr:tr.data.ayahs[i]?.text||''}));
    S.cache[key]=combined; renderAyahs(combined);
  }).catch(()=>{ c.innerHTML='<div class="loading-state">Failed to load. Check internet.</div>'; });
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
function esc(s){ return (s||'').replace(/`/g,"'").replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function changeLang(){ S.lang=document.getElementById('lang-sel').value; S.cache={}; if(S.surah) loadReader(S.surah.num); }
function changeReciter(){ S.reciter=document.getElementById('reciter-sel').value; if(S.playing) playAyah(S.ayah); }
function changeFontSize(d){ S.asz=Math.max(18,Math.min(44,S.asz+d)); document.querySelectorAll('.ayah-arabic').forEach(el=>el.style.fontSize=S.asz+'px'); }

// ═══ TAFSIR MODE (inline) ═══
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

// ═══ TAFSIR SHEET (bottom popup per verse) ═══
function openTafsirSheet(ayahNum, arabicText){
  const sheet=document.getElementById('tafsir-sheet');
  const title=document.getElementById('sheet-title');
  const ar=document.getElementById('sheet-ar');
  const txt=document.getElementById('sheet-txt');
  if(!sheet) return;
  if(title) title.textContent=`Tafsir — Verse ${ayahNum}`;
  if(ar) ar.textContent=arabicText;
  if(txt) txt.innerHTML='<div class="loading-state"><div class="spinner"></div>Loading...</div>';
  sheet.classList.remove('hidden');
  if(!S.surah) return;
  fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah?ayah_key=${S.surah.num}:${ayahNum}`)
    .then(r=>r.json()).then(d=>{
      const text=d.tafsir?.text||'Tafsir not available for this verse.';
      if(txt) txt.innerHTML=cleanTafsir(text);
    }).catch(()=>{ if(txt) txt.textContent='Tafsir unavailable. Check internet.'; });
}
function closeSheet(){ const s=document.getElementById('tafsir-sheet'); if(s) s.classList.add('hidden'); }
function cleanTafsir(html){
  const tmp=document.createElement('div'); tmp.innerHTML=html;
  return tmp.textContent||tmp.innerText||'';
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
  c.innerHTML=`<div class="loading-state"><div class="spinner"></div>Loading Tafsir...</div>`;
  showPage('page-tafsir-reader');
  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${num}`).then(r=>r.json()),
  ]).then(([ar])=>{
    c.innerHTML='';
    ar.data.ayahs.forEach((a,i)=>{
      const block=document.createElement('div'); block.className='tafsir-ayah-block';
      block.innerHTML=`<div class="tab-num">VERSE ${a.numberInSurah}</div><div class="tab-arabic">${a.text}</div><div class="tab-text" id="tf-${num}-${a.numberInSurah}"><div class="loading-state"><div class="spinner"></div></div></div>`;
      c.appendChild(block);
      if(i<5) loadTafsirText(num,a.numberInSurah);
    });
    // Lazy load rest on scroll
    c.addEventListener('scroll', ()=>{
      ar.data.ayahs.forEach(a=>{
        const el=document.getElementById(`tf-${num}-${a.numberInSurah}`);
        if(el&&el.querySelector('.spinner')){
          const rect=el.getBoundingClientRect();
          if(rect.top<window.innerHeight+200) loadTafsirText(num,a.numberInSurah);
        }
      });
    });
  }).catch(()=>{ c.innerHTML='<div class="loading-state">Failed to load. Check internet.</div>'; });
}
function loadTafsirText(surahNum,ayahNum){
  const el=document.getElementById(`tf-${surahNum}-${ayahNum}`); if(!el) return;
  fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah?ayah_key=${surahNum}:${ayahNum}`)
    .then(r=>r.json()).then(d=>{
      const text=cleanTafsir(d.tafsir?.text||'');
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
  document.getElementById('ap-label').textContent=`Verse ${num} of ${S.surah.ayahCount}`;
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
  btn.style.color=S.repeat?'var(--gold)':'';
  btn.style.borderColor=S.repeat?'var(--gold)':'';
}
function stopAudio(){ const a=document.getElementById('quran-audio'); a.pause(); a.src=''; S.playing=false; }
function updateProgress(){
  const a=document.getElementById('quran-audio'); if(!a.duration) return;
  const f=document.getElementById('ap-fill'); if(f) f.style.width=((a.currentTime/a.duration)*100)+'%';
}
function copyAyah(num,ar,tr){
  const text=`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num} | Al-Qur'an Pro · MÎK Edition`;
  navigator.clipboard.writeText(text).then(()=>showToast('Copied! 📋'));
}
function shareAyah(num,ar,tr){
  const text=`${ar}\n\n${tr}\n\n— Surah ${S.surah?.nameEn||''}, Verse ${num}\nAl-Qur'an Pro · MÎK Edition`;
  if(navigator.share) navigator.share({title:'Al-Qur\'an — MÎK Edition',text}).catch(()=>{});
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
  if(nm) nm.textContent=S.
