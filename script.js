/* ═══════════════════════════════════════════
   AL-QUR'AN PRO — MÎK Edition — script.js
   ═══════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────
const State = {
  currentSurah: null,
  currentAyah: 1,
  currentLang: 'en.sahih',
  currentReciter: 'ar.alafasy',
  prayerTimes: {},
  adhanEnabled: { Fajr: true, Dhuhr: false, Asr: false, Maghrib: true, Isha: true },
  bookmarks: JSON.parse(localStorage.getItem('mik_bookmarks') || '[]'),
  tasbeehCount: 0,
  tasbeehTarget: 33,
  tasbeehSets: 0,
  currentZikr: { arabic: 'سُبْحَانَ اللَّهِ', name: 'SubhanAllah' },
  isPlaying: false,
  isRepeat: false,
  arabicFontSize: 28,
  theme: localStorage.getItem('mik_theme') || 'dark',
  allSurahs: [],
};

// ── INIT ──────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      showPage('page-home');
    }, 500);
  }, 2800);

  startClock();
  loadHijriDate();
  getLocation();
  loadSurahList();
  loadNames();
  loadProphetNames();
  setupPrayerToggles();
  loadBookmarks();
  setupRingSVG();
});

// ── THEME ──────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', State.theme === 'light' ? 'light' : '');
}
function toggleDarkLight() {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('mik_theme', State.theme);
  applyTheme();
  document.getElementById('theme-btn').textContent = State.theme === 'dark' ? '☀️' : '🌙';
}

// ── PAGE NAVIGATION ──────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(id);
  if (page) { page.classList.remove('hidden'); }
  if (id === 'page-bookmarks') loadBookmarks();
}
function setNav(el) {
  el.closest('.bottom-nav').querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
}
function setTab(el, type) {
  el.closest('.juz-tabs').querySelectorAll('.juz-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (type === 'surah') renderSurahList(State.allSurahs);
  else showToast('Coming soon! 🌟');
}
function toggleSearch() {
  const bar = document.getElementById('search-bar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) document.getElementById('search-input').focus();
}
function filterSurahs() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = State.allSurahs.filter(s =>
    s.englishName.toLowerCase().includes(q) ||
    s.englishNameTranslation.toLowerCase().includes(q) ||
    String(s.number).includes(q)
  );
  renderSurahList(filtered);
}

// ── CLOCK ──────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('current-time');
    if (el) el.textContent = `${h}:${m}`;
    updateNextPrayer();
  }
  tick();
  setInterval(tick, 1000);
}

// ── HIJRI DATE ──────────────────────────────────
function loadHijriDate() {
  const now = new Date();
  const months = ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaaban','Ramadan','Shawwal','Dhul Qidah','Dhul Hijjah'];
  try {
    const hijri = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const el = document.getElementById('hijri-today');
    if (el) el.textContent = `${hijri.d} ${months[hijri.m - 1]} ${hijri.y} AH`;
    calcIslamicEvents(hijri);
  } catch(e) {
    const el = document.getElementById('hijri-today');
    if (el) el.textContent = 'Islamic Calendar';
  }
}

function toHijri(year, month, day) {
  const jd = gregorianToJulian(year, month, day);
  return julianToHijri(jd);
}
function gregorianToJulian(year, month, day) {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524;
}
function julianToHijri(jd) {
  jd = Math.floor(jd) + 0.5;
  const z = jd - 1948440 + 10632;
  const n = Math.floor((z - 1) / 10631);
  const zz = z - 10631 * n + 354;
  const j = Math.floor((10985 - zz) / 5316) * Math.floor(50 * zz / 17719) + Math.floor(zz / 5670) * Math.floor(43 * zz / 15238);
  const zzz = zz - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const m = Math.floor(24 * zzz / 709);
  const d = zzz - Math.floor(709 * m / 24);
  const y = 30 * n + j - 30;
  return { y, m, d };
}

function calcIslamicEvents(hijri) {
  const ramadanEl = document.getElementById('ramadan-countdown');
  const eidEl = document.getElementById('eid-fitr-countdown');
  if (hijri.m === 9) {
    const rem = 30 - hijri.d;
    if (ramadanEl) ramadanEl.textContent = rem > 0 ? `Ramadan: ${rem} days left` : 'Ramadan: Last day!';
  } else {
    if (ramadanEl) ramadanEl.textContent = `Ramadan: Month 9`;
  }
  if (hijri.m === 10 && hijri.d <= 3) {
    if (eidEl) eidEl.textContent = `Eid al-Fitr: Day ${hijri.d}! 🎉`;
  } else {
    if (eidEl) eidEl.textContent = 'Eid: Shawwal 1';
  }
}

// ── LOCATION & PRAYER TIMES ──────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
    reverseGeocode(pos.coords.latitude, pos.coords.longitude);
  }, () => {
    // fallback: Mecca
    fetchPrayerTimes(21.3891, 39.8579);
    const loc = document.getElementById('prayer-location');
    if (loc) loc.textContent = '📍 Mecca (default)';
  });
}

function reverseGeocode(lat, lon) {
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    .then(r => r.json()).then(data => {
      const city = data.address.city || data.address.town || data.address.village || 'Your Location';
      const country = data.address.country || '';
      const loc = document.getElementById('prayer-location');
      if (loc) loc.textContent = `📍 ${city}, ${country}`;
    }).catch(() => {});
}

function fetchPrayerTimes(lat, lon) {
  const today = new Date();
  const d = today.getDate(), m = today.getMonth() + 1, y = today.getFullYear();
  fetch(`https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lon}&method=2`)
    .then(r => r.json()).then(data => {
      const t = data.data.timings;
      State.prayerTimes = {
        Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr,
        Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha
      };
      renderPrayerTimes();
      scheduleAdhans();
    }).catch(() => {});
}

function renderPrayerTimes() {
  const p = State.prayerTimes;
  const map = { Fajr:'p-fajr', Dhuhr:'p-dhuhr', Asr:'p-asr', Maghrib:'p-maghrib', Isha:'p-isha' };
  Object.entries(map).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (el && p[name]) el.textContent = formatTime12(p[name]);
  });
  const fullMap = { Fajr:'fp-fajr', Sunrise:'fp-sunrise', Dhuhr:'fp-dhuhr', Asr:'fp-asr', Maghrib:'fp-maghrib', Isha:'fp-isha' };
  Object.entries(fullMap).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (el && p[name]) el.querySelector('.fp-time').textContent = formatTime12(p[name]);
  });
  updateNextPrayer();
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function updateNextPrayer() {
  const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const name of prayers) {
    const t = State.prayerTimes[name];
    if (!t) continue;
    const [h, m] = t.split(':').map(Number);
    const pMins = h * 60 + m;
    if (pMins > nowMins) {
      const rem = pMins - nowMins;
      const el = document.getElementById('next-prayer-name');
      const tel = document.getElementById('next-prayer-time');
      const nextPillId = name.toLowerCase();
      document.querySelectorAll('.prayer-pill').forEach(p => p.classList.remove('active'));
      if (el) el.textContent = name;
      if (tel) tel.textContent = `${formatTime12(t)} · in ${rem}min`;

      // Full prayer page highlight
      document.querySelectorAll('.full-prayer-item').forEach(i => i.classList.remove('next-prayer'));
      const fp = document.getElementById(`fp-${name.toLowerCase()}`);
      if (fp) fp.classList.add('next-prayer');
      return;
    }
  }
}

function scheduleAdhans() {
  const prayers = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
  prayers.forEach(name => {
    const t = State.prayerTimes[name];
    if (!t || !State.adhanEnabled[name]) return;
    const [h, m] = t.split(':').map(Number);
    const now = new Date();
    const pTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    const delay = pTime - now;
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        const audio = document.getElementById('adhan-audio');
        if (audio) audio.play().catch(() => {});
        showToast(`🕌 ${name} Adhan`);
      }, delay);
    }
  });
}

function setupPrayerToggles() {
  const list = document.getElementById('prayer-settings-list');
  if (!list) return;
  ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach(name => {
    const div = document.createElement('div');
    div.className = 'adhan-item';
    const on = State.adhanEnabled[name];
    div.innerHTML = `
      <span class="adhan-item-name">🕌 ${name}</span>
      <button class="toggle-btn ${on ? 'on' : ''}" onclick="toggleAdhan('${name}', this)"></button>
    `;
    list.appendChild(div);
  });
}

function toggleAdhan(name, btn) {
  State.adhanEnabled[name] = !State.adhanEnabled[name];
  btn.classList.toggle('on', State.adhanEnabled[name]);
}

// ── SURAH LIST ──────────────────────────────────
function loadSurahList() {
  fetch('https://api.alquran.cloud/v1/surah')
    .then(r => r.json()).then(data => {
      State.allSurahs = data.data;
      renderSurahList(data.data);
    }).catch(() => showToast('Failed to load Quran data'));
}

function renderSurahList(surahs) {
  const container = document.getElementById('surah-list-container');
  if (!container) return;
  container.innerHTML = '';
  const revelationMap = { Meccan: 'مكية', Medinan: 'مدنية' };
  surahs.forEach(s => {
    const div = document.createElement('div');
    div.className = 'surah-item';
    div.onclick = () => openSurah(s.number, s.name, s.englishName, s.numberOfAyahs, s.revelationType);
    div.innerHTML = `
      <div class="surah-num-badge">${s.number}</div>
      <div class="surah-info">
        <div class="surah-name-en">${s.englishName}</div>
        <div class="surah-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses · ${s.revelationType}</div>
      </div>
      <div class="surah-name-ar">${s.name}</div>
    `;
    container.appendChild(div);
  });
}

// ── READER ──────────────────────────────────
let surahAyahsCache = {};

function openSurah(num, nameAr, nameEn, ayahCount, type) {
  State.currentSurah = { num, nameAr, nameEn, ayahCount, type };
  State.currentAyah = 1;

  document.getElementById('surah-title-display').textContent = nameEn;
  document.getElementById('surah-info-display').textContent = `${nameAr} · ${ayahCount} verses`;
  document.getElementById('bismillah-banner').style.display = num === 9 ? 'none' : 'block';

  const bm = document.getElementById('bookmark-btn');
  if (bm) {
    const isBookmarked = State.bookmarks.some(b => b.surahNum === num);
    bm.textContent = isBookmarked ? '🔖' : '🔖';
    bm.style.opacity = isBookmarked ? '1' : '0.5';
  }

  showPage('page-reader');
  loadSurahContent(num);
}

function loadSurahContent(num) {
  const container = document.getElementById('ayah-content');
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Loading...</div>';

  if (surahAyahsCache[num + '_' + State.currentLang]) {
    renderAyahs(surahAyahsCache[num + '_' + State.currentLang]);
    return;
  }

  const arabicUrl = `https://api.alquran.cloud/v1/surah/${num}`;
  const transUrl = `https://api.alquran.cloud/v1/surah/${num}/${State.currentLang}`;

  Promise.all([fetch(arabicUrl).then(r => r.json()), fetch(transUrl).then(r => r.json())])
    .then(([arabicData, transData]) => {
      const combined = arabicData.data.ayahs.map((a, i) => ({
        number: a.numberInSurah,
        arabic: a.text,
        translation: transData.data.ayahs[i]?.text || ''
      }));
      surahAyahsCache[num + '_' + State.currentLang] = combined;
      renderAyahs(combined);
    }).catch(() => {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Failed to load. Check internet.</div>';
    });
}

function renderAyahs(ayahs) {
  const container = document.getElementById('ayah-content');
  container.innerHTML = '';
  ayahs.forEach(a => {
    const div = document.createElement('div');
    div.className = 'ayah-item';
    div.id = `ayah-${a.number}`;
    div.innerHTML = `
      <div class="ayah-top">
        <div class="ayah-num">${a.number}</div>
        <div class="ayah-actions">
          <button class="ayah-action-btn" onclick="playAyah(${a.number})" title="Play">▶</button>
          <button class="ayah-action-btn" onclick="bookmarkAyah(${a.number})" title="Bookmark">🔖</button>
          <button class="ayah-action-btn" onclick="copyAyah(${a.number}, \`${escapeQuotes(a.arabic)}\`, \`${escapeQuotes(a.translation)}\`)" title="Copy">📋</button>
        </div>
      </div>
      <div class="ayah-arabic" style="font-size:${State.arabicFontSize}px">${a.arabic}</div>
      <div class="ayah-translation">${a.translation}</div>
    `;
    container.appendChild(div);
  });
}

function escapeQuotes(str) {
  return str.replace(/`/g, "'").replace(/\\/g, '\\\\');
}

function changeLanguage() {
  State.currentLang = document.getElementById('lang-select').value;
  surahAyahsCache = {};
  if (State.currentSurah) loadSurahContent(State.currentSurah.num);
}

function changeFontSize(delta) {
  State.arabicFontSize = Math.max(18, Math.min(42, State.arabicFontSize + delta));
  document.querySelectorAll('.ayah-arabic').forEach(el => {
    el.style.fontSize = State.arabicFontSize + 'px';
  });
}

// ── AUDIO ──────────────────────────────────
function playAyah(num) {
  if (!State.currentSurah) return;
  State.currentAyah = num;
  State.isPlaying = true;

  const surahStr = String(State.currentSurah.num).padStart(3, '0');
  const ayahStr = String(num).padStart(3, '0');
  const url = `https://cdn.islamic.network/quran/audio/128/${State.currentReciter}/${State.currentSurah.num * 1000 + num}.mp3`;

  const audio = document.getElementById('quran-player');
  audio.src = url;
  audio.play().catch(() => {
    // Fallback URL
    const fallback = `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`;
    audio.src = fallback;
    audio.play().catch(() => showToast('Audio not available'));
  });

  document.querySelectorAll('.ayah-item').forEach(el => el.classList.remove('playing'));
  const active = document.getElementById(`ayah-${num}`);
  if (active) {
    active.classList.add('playing');
    active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.getElementById('play-pause-btn').textContent = '⏸';
  document.getElementById('audio-ayah-label').textContent = `Verse ${num} of ${State.currentSurah.ayahCount}`;
}

function togglePlay() {
  const audio = document.getElementById('quran-player');
  if (audio.paused) {
    audio.play();
    State.isPlaying = true;
    document.getElementById('play-pause-btn').textContent = '⏸';
  } else {
    audio.pause();
    State.isPlaying = false;
    document.getElementById('play-pause-btn').textContent = '▶';
  }
}

function nextAyah() {
  if (!State.currentSurah) return;
  if (State.currentAyah < State.currentSurah.ayahCount) playAyah(State.currentAyah + 1);
}
function prevAyah() {
  if (State.currentAyah > 1) playAyah(State.currentAyah - 1);
}

function onAudioEnd() {
  if (State.isRepeat) { playAyah(State.currentAyah); return; }
  if (State.currentSurah && State.currentAyah < State.currentSurah.ayahCount) {
    setTimeout(() => nextAyah(), 500);
  } else {
    document.getElementById('play-pause-btn').textContent = '▶';
    State.isPlaying = false;
  }
}

function toggleRepeat() {
  State.isRepeat = !State.isRepeat;
  const btn = document.getElementById('repeat-btn');
  btn.style.color = State.isRepeat ? 'var(--gold)' : '';
  btn.style.borderColor = State.isRepeat ? 'var(--gold)' : '';
}

function changeReciter() {
  State.currentReciter = document.getElementById('reciter-select').value;
  if (State.isPlaying) playAyah(State.currentAyah);
}

function stopAudio() {
  const audio = document.getElementById('quran-player');
  audio.pause(); audio.src = '';
  State.isPlaying = false;
}

function updateProgress() {
  const audio = document.getElementById('quran-player');
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
}

function copyAyah(num, arabic, translation) {
  const text = `${arabic}\n\n${translation}\n\n— Surah ${State.currentSurah?.englishName}, Verse ${num} | Al-Qur'an Pro · MÎK Edition`;
  navigator.clipboard.writeText(text).then(() => showToast('Copied! 📋'));
}

// ── BOOKMARKS ──────────────────────────────────
function toggleBookmarkSurah() {
  if (!State.currentSurah) return;
  const { num, nameAr, nameEn, ayahCount } = State.currentSurah;
  const idx = State.bookmarks.findIndex(b => b.surahNum === num);
  if (idx >= 0) {
    State.bookmarks.splice(idx, 1);
    showToast('Bookmark removed');
    document.getElementById('bookmark-btn').style.opacity = '0.5';
  } else {
    State.bookmarks.push({ surahNum: num, nameAr, nameEn, ayahCount, date: new Date().toLocaleDateString() });
    showToast('Bookmarked! 🔖');
    document.getElementById('bookmark-btn').style.opacity = '1';
  }
  localStorage.setItem('mik_bookmarks', JSON.stringify(State.bookmarks));
}

function bookmarkAyah(num) {
  if (!State.currentSurah) return;
  const existing = State.bookmarks.find(b => b.surahNum === State.currentSurah.num && b.ayahNum === num);
  if (!existing) {
    State.bookmarks.push({
      surahNum: State.currentSurah.num,
      nameEn: State.currentSurah.nameEn,
      nameAr: State.currentSurah.nameAr,
      ayahNum: num,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('mik_bookmarks', JSON.stringify(State.bookmarks));
    showToast(`Verse ${num} bookmarked 🔖`);
  } else {
    showToast('Already bookmarked');
  }
}

function loadBookmarks() {
  const list = document.getElementById('bookmarks-list');
  if (!list) return;
  list.innerHTML = '';
  if (State.bookmarks.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔖</div><div>No bookmarks yet.<br>Tap 🔖 while reading to save.</div></div>';
    return;
  }
  State.bookmarks.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'bookmark-item';
    div.innerHTML = `
      <div class="bookmark-info" onclick="openSurah(${b.surahNum}, '${b.nameAr}', '${b.nameEn}', ${b.ayahCount || 0}, '')">
        <div class="bookmark-title">${b.nameEn}${b.ayahNum ? ` · Verse ${b.ayahNum}` : ''}</div>
        <div class="bookmark-sub">Saved ${b.date}</div>
      </div>
      <div class="bookmark-arabic">${b.nameAr}</div>
      <button class="bookmark-del" onclick="deleteBookmark(${i})">🗑</button>
    `;
    list.appendChild(div);
  });
}

function deleteBookmark(i) {
  State.bookmarks.splice(i, 1);
  localStorage.setItem('mik_bookmarks', JSON.stringify(State.bookmarks));
  loadBookmarks();
  showToast('Removed');
}

// ── 99 NAMES ──────────────────────────────────
const ALLAH_NAMES = [
  ['الرَّحْمَنُ','Ar-Rahman','The Most Gracious'],['الرَّحِيمُ','Ar-Rahim','The Most Merciful'],
  ['الْمَلِكُ','Al-Malik','The King'],['الْقُدُّوسُ','Al-Quddus','The Most Holy'],
  ['السَّلَامُ','As-Salam','The Source of Peace'],['الْمُؤْمِنُ','Al-Mumin','The Guardian of Faith'],
  ['الْمُهَيْمِنُ','Al-Muhaymin','The Protector'],['الْعَزِيزُ','Al-Aziz','The Almighty'],
  ['الْجَبَّارُ','Al-Jabbar','The Compeller'],['الْمُتَكَبِّرُ','Al-Mutakabbir','The Majestic'],
  ['الْخَالِقُ','Al-Khaliq','The Creator'],['الْبَارِئُ','Al-Bari','The Evolver'],
  ['الْمُصَوِّرُ','Al-Musawwir','The Fashioner'],['الْغَفَّارُ','Al-Ghaffar','The Forgiver'],
  ['الْقَهَّارُ','Al-Qahhar','The Subduer'],['الْوَهَّابُ','Al-Wahhab','The Bestower'],
  ['الرَّزَّاقُ','Ar-Razzaq','The Provider'],['الْفَتَّاحُ','Al-Fattah','The Opener'],
  ['الْعَلِيمُ','Al-Alim','The All-Knowing'],['الْقَابِضُ','Al-Qabid','The Restrainer'],
  ['الْبَاسِطُ','Al-Basit','The Expander'],['الْخَافِضُ','Al-Khafid','The Abaser'],
  ['الرَّافِعُ','Ar-Rafi','The Exalter'],['الْمُعِزُّ','Al-Muizz','The Giver of Honor'],
  ['الْمُذِلُّ','Al-Muzil','The Humiliator'],['السَّمِيعُ','As-Sami','The All-Hearing'],
  ['الْبَصِيرُ','Al-Basir','The All-Seeing'],['الْحَكَمُ','Al-Hakam','The Judge'],
  ['الْعَدْلُ','Al-Adl','The Just'],['اللَّطِيفُ','Al-Latif','The Subtle'],
  ['الْخَبِيرُ','Al-Khabir','The All-Aware'],['الْحَلِيمُ','Al-Halim','The Forbearing'],
  ['الْعَظِيمُ','Al-Azim','The Magnificent'],['الْغَفُورُ','Al-Ghafur','The Forgiving'],
  ['الشَّكُورُ','Ash-Shakur','The Appreciative'],['الْعَلِيُّ','Al-Ali','The Most High'],
  ['الْكَبِيرُ','Al-Kabir','The Greatest'],['الْحَفِيظُ','Al-Hafiz','The Preserver'],
  ['الْمُقِيتُ','Al-Muqit','The Nourisher'],['الْحَسِيبُ','Al-Hasib','The Reckoner'],
  ['الْجَلِيلُ','Al-Jalil','The Majestic'],['الْكَرِيمُ','Al-Karim','The Most Generous'],
  ['الرَّقِيبُ','Ar-Raqib','The Watchful'],['الْمُجِيبُ','Al-Mujib','The Responsive'],
  ['الْوَاسِعُ','Al-Wasi','The All-Encompassing'],['الْحَكِيمُ','Al-Hakim','The Wise'],
  ['الْوَدُودُ','Al-Wadud','The Loving'],['الْمَجِيدُ','Al-Majid','The Glorious'],
  ['الْبَاعِثُ','Al-Baith','The Resurrector'],['الشَّهِيدُ','Ash-Shahid','The Witness'],
  ['الْحَقُّ','Al-Haqq','The Truth'],['الْوَكِيلُ','Al-Wakil','The Trustee'],
  ['الْقَوِيُّ','Al-Qawi','The Strong'],['الْمَتِينُ','Al-Matin','The Firm'],
  ['الْوَلِيُّ','Al-Wali','The Protector'],['الْحَمِيدُ','Al-Hamid','The Praiseworthy'],
  ['الْمُحْصِي','Al-Muhsi','The Counter'],['الْمُبْدِئُ','Al-Mubdi','The Originator'],
  ['الْمُعِيدُ','Al-Muid','The Restorer'],['الْمُحْيِي','Al-Muhyi','The Giver of Life'],
  ['الْمُمِيتُ','Al-Mumit','The Taker of Life'],['الْحَيُّ','Al-Hayy','The Ever-Living'],
  ['الْقَيُّومُ','Al-Qayyum','The Self-Subsisting'],['الْوَاجِدُ','Al-Wajid','The Finder'],
  ['الْمَاجِدُ','Al-Majid','The Noble'],['الْوَاحِدُ','Al-Wahid','The One'],
  ['الْأَحَدُ','Al-Ahad','The Unique'],['الصَّمَدُ','As-Samad','The Eternal'],
  ['الْقَادِرُ','Al-Qadir','The Capable'],['الْمُقْتَدِرُ','Al-Muqtadir','The All-Powerful'],
  ['الْمُقَدِّمُ','Al-Muqaddim','The Expediter'],['الْمُؤَخِّرُ','Al-Muakhkhir','The Delayer'],
  ['الْأَوَّلُ','Al-Awwal','The First'],['الْآخِرُ','Al-Akhir','The Last'],
  ['الظَّاهِرُ','Az-Zahir','The Manifest'],['الْبَاطِنُ','Al-Batin','The Hidden'],
  ['الْوَالِي','Al-Wali','The Governor'],['الْمُتَعَالِي','Al-Mutaali','The Most Exalted'],
  ['الْبَرُّ','Al-Barr','The Source of Goodness'],['التَّوَّابُ','At-Tawwab','The Accepter of Repentance'],
  ['الْمُنْتَقِمُ','Al-Muntaqim','The Avenger'],['الْعَفُوُّ','Al-Afu','The Pardoner'],
  ['الرَّءُوفُ','Ar-Rauf','The Most Kind'],['مَالِكُ الْمُلْكِ','Malik al-Mulk','Owner of Sovereignty'],
  ['ذُو الْجَلَالِ','Dhul-Jalal','Lord of Majesty'],['الْمُقْسِطُ','Al-Muqsit','The Equitable'],
  ['الْجَامِعُ','Al-Jami','The Gatherer'],['الْغَنِيُّ','Al-Ghani','The Self-Sufficient'],
  ['الْمُغْنِي','Al-Mughni','The Enricher'],['الْمَانِعُ','Al-Mani','The Preventer'],
  ['الضَّارُّ','Ad-Darr','The Distressor'],['النَّافِعُ','An-Nafi','The Propitious'],
  ['النُّورُ','An-Nur','The Light'],['الْهَادِي','Al-Hadi','The Guide'],
  ['الْبَدِيعُ','Al-Badi','The Incomparable'],['الْبَاقِي','Al-Baqi','The Everlasting'],
  ['الْوَارِثُ','Al-Warith','The Inheritor'],['الرَّشِيدُ','Ar-Rashid','The Guide to Right'],
  ['الصَّبُورُ','As-Sabur','The Patient'],
];

function loadNames() {
  const container = document.getElementById('names-container');
  if (!container) return;
  ALLAH_NAMES.forEach((n, i) => {
    const div = document.createElement('div');
    div.className = 'name-card';
    div.innerHTML = `
      <div class="name-num">${String(i+1).padStart(2,'0')}</div>
      <div class="name-arabic">${n[0]}</div>
      <div class="name-transliteration">${n[1]}</div>
      <div class="name-meaning">${n[2]}</div>
    `;
    container.appendChild(div);
  });
}

const PROPHET_NAMES = [
  ['مُحَمَّدٌ','Muhammad','The Praised One'],['أَحْمَدُ','Ahmad','Most Praiseworthy'],
  ['الْمُصْطَفَى','Al-Mustafa','The Chosen'],['الْمُخْتَارُ','Al-Mukhtar','The Selected'],
  ['الْأَمِينُ','Al-Amin','The Trustworthy'],['الصَّادِقُ','As-Sadiq','The Truthful'],
  ['خَاتَمُ النَّبِيِّينَ','Khatam al-Nabiyyin','Seal of Prophets'],['رَسُولُ اللَّهِ','Rasulullah','Messenger of Allah'],
  ['نَبِيُّ الرَّحْمَةِ','Nabiyy ur-Rahmah','Prophet of Mercy'],['الشَّفِيعُ','Ash-Shafi','The Intercessor'],
  ['الْحَاشِرُ','Al-Hashir','The Gatherer'],['الْعَاقِبُ','Al-Aqib','The Last Prophet'],
  ['الْمَاحِي','Al-Mahi','The Obliterator of sins'],['طَهَ','Taha','Pure'],
  ['يَس','Yasin','Ya Seen'],['الْمُزَّمِّلُ','Al-Muzzammil','The Wrapped'],
  ['الْمُدَّثِّرُ','Al-Muddaththir','The Enveloped'],['عَبْدُ اللَّهِ','Abdullah','Servant of Allah'],
  ['حَبِيبُ اللَّهِ','Habibullah','Beloved of Allah'],['نُورٌ','Nur','Light'],
  ['سِرَاجًا مُنِيرًا','Siraj Munir','Illuminating Lamp'],['رَحْمَةٌ لِلْعَالَمِينَ','Rahmatullil Alamin','Mercy to all Worlds'],
  ['الشَّاهِدُ','Ash-Shahid','The Witness'],['الْمُبَشِّرُ','Al-Mubashir','The Bringer of Glad Tidings'],
  ['النَّذِيرُ','An-Nadhir','The Warner'],['الْبَشِيرُ','Al-Bashir','The Bearer of Good News'],
  ['الدَّاعِي','Ad-Daai','The Caller'],['الشَّهِيدُ','Ash-Shahid','The Witness'],
  ['الْكَرِيمُ','Al-Karim','The Noble'],['الْكَرِيمُ عَلَى اللَّهِ','Al-Karim alAllah','Noble before Allah'],
  ['الرَّؤُوفُ','Ar-Rauf','The Kind'],['الرَّحِيمُ','Ar-Rahim','The Merciful'],
  ['الْمُعَلِّمُ','Al-Muallim','The Teacher'],['الْفَارُوقُ','Al-Faruq','Distinguisher of Truth'],
  ['الصِّرَاطُ الْمُسْتَقِيمُ','As-Sirat al-Mustaqim','The Straight Path'],
  ['أَبُو إِبْرَاهِيمَ','Abu Ibrahim','Father of Ibrahim'],['الصَّالِحُ','As-Salih','The Righteous'],
  ['الطَّاهِرُ','At-Tahir','The Pure'],['الزَّكِيُّ','Az-Zaki','The Chaste'],
  ['الْوَلِيُّ','Al-Wali','The Friend of Allah'],['الْحَقُّ','Al-Haqq','The Truth'],
  ['الْكَاشِفُ','Al-Kashif','The Revealer'],['الْمُرْشِدُ','Al-Murshid','The Guide'],
  ['الشَّرِيفُ','Ash-Sharif','The Noble'],['الْأَشْرَفُ','Al-Ashraf','The Most Noble'],
  ['الْمُكَرَّمُ','Al-Mukarram','The Honored'],['الْمُعَظَّمُ','Al-Muazzam','The Exalted'],
  ['الْمَمْدُوحُ','Al-Mamduh','The Praised'],['الْمَحْمُودُ','Al-Mahmud','The Commendable'],
];

function loadProphetNames() {
  const container = document.getElementById('prophet-names-container');
  if (!container) return;
  PROPHET_NAMES.forEach((n, i) => {
    const div = document.createElement('div');
    div.className = 'name-card';
    div.innerHTML = `
      <div class="name-num">${String(i+1).padStart(2,'0')}</div>
      <div class="name-arabic">${n[0]}</div>
      <div class="name-transliteration">${n[1]}</div>
      <div class="name-meaning">${n[2]}</div>
    `;
    container.appendChild(div);
  });
}

// ── TASBEEH ──────────────────────────────────
function setupRingSVG() {
  const svg = document.querySelector('.ring-svg');
  if (!svg) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c9963a"/>
      <stop offset="100%" style="stop-color:#f5d07a"/>
    </linearGradient>`;
  svg.insertBefore(defs, svg.firstChild);
}

function doCount() {
  State.tasbeehCount++;
  const countEl = document.getElementById('t-count');
  if (countEl) {
    countEl.textContent = State.tasbeehCount;
    countEl.classList.remove('count-pop');
    void countEl.offsetWidth;
    countEl.classList.add('count-pop');
  }
  updateRing();
  if (State.tasbeehCount >= State.tasbeehTarget) {
    State.tasbeehSets++;
    State.tasbeehCount = 0;
    if (countEl) countEl.textContent = '0';
    const setsEl = document.getElementById('tasbeeh-sets');
    if (setsEl) setsEl.textContent = State.tasbeehSets;
    showToast(`MashaAllah! Set ${State.tasbeehSets} complete! 🤲`);
    updateRing();
  }
}

function updateRing() {
  const ring = document.getElementById('ring-progress');
  if (!ring) return;
  const pct = Math.min(State.tasbeehCount / State.tasbeehTarget, 1);
  const circumference = 2 * Math.PI * 88;
  ring.style.strokeDashoffset = circumference * (1 - pct);
}

function resetT() {
  State.tasbeehCount = 0;
  State.tasbeehSets = 0;
  const countEl = document.getElementById('t-count');
  const setsEl = document.getElementById('tasbeeh-sets');
  if (countEl) countEl.textContent = '0';
  if (setsEl) setsEl.textContent = '0';
  updateRing();
}

function setTarget(n) {
  State.tasbeehTarget = n;
  const el = document.getElementById('tasbeeh-target-display');
  if (el) el.textContent = n;
  updateRing();
}

function changeZikr() {
  const val = document.getElementById('zikr-select').value;
  const [arabic, name] = val.split('|');
  State.currentZikr = { arabic, name };
  const el = document.getElementById('tasbeeh-arabic');
  if (el) el.textContent = arabic;
  resetT();
}

// ── ZAKAT ──────────────────────────────────
function calcZakat() {
  const savings = parseFloat(document.getElementById('zakat-savings').value) || 0;
  const gold = parseFloat(document.getElementById('zakat-gold').value) || 0;
  const silver = parseFloat(document.getElementById('zakat-silver').value) || 0;
  const business = parseFloat(document.getElementById('zakat-business').value) || 0;
  const debts = parseFloat(document.getElementById('zakat-debts').value) || 0;
  const currency = document.getElementById('zakat-currency').value;

  const symbols = { USD: '$', PKR: '₨', AFN: '؋', GBP: '£', EUR: '€', SAR: '﷼' };
  const sym = symbols[currency] || '$';

  const nisab = 4874;
  const total = savings + gold + silver + business - debts;
  const amountEl = document.getElementById('zakat-amount');
  const subEl = document.getElementById('zakat-sub');

  if (total <= 0) {
    if (amountEl) amountEl.textContent = '—';
    if (subEl) subEl.textContent = 'Enter your savings above';
    return;
  }

  if (total < nisab) {
    if (amountEl) amountEl.textContent = '0';
    if (subEl) subEl.textContent = `Below Nisab threshold (${sym}${nisab.toLocaleString()})`;
    return;
  }

  const zakat = total * 0.025;
  if (amountEl) amountEl.textContent = `${sym}${zakat.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  if (subEl) subEl.textContent = `2.5% of ${sym}${total.toLocaleString(undefined, {maximumFractionDigits:0})} total assets`;
}

// ── TOAST ──────────────────────────────────
let toastTimer;
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2500);
}

// ── SERVICE WORKER ──────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
