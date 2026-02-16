const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let curSurah = 1, curName = "Al-Fatihah", allSurahs = [], deferredPrompt;

// PWA Install Logic
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-btn').style.display = 'block';
});

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') document.getElementById('install-btn').style.display = 'none';
        deferredPrompt = null;
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-names') load99Names();
    if (id === 'page-duas') loadDuas();
    if (id === 'page-home') { updateLastReadUI(); loadDailyVerse(); }
    window.scrollTo(0,0);
}

// Daily Verse Logic
async function loadDailyVerse() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${dayOfYear}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        document.getElementById('daily-ar').innerText = data.data[0].text;
        document.getElementById('daily-en').innerText = data.data[1].text + ` (${data.data[0].surah.englishName} ${data.data[0].numberInSurah})`;
    } catch(e) { console.log("Verse error"); }
}

// Daily Duas Logic
function loadDuas() {
    const duas = [
        {ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً", en: "Our Lord, give us in this world that which is good and in the Hereafter that which is good."},
        {ar: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", en: "O Allah, You are Forgiving and love forgiveness, so forgive me."},
        {ar: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي", en: "My Lord, make me an establisher of prayer, and from my descendants."}
    ];
    document.getElementById('duas-container').innerHTML = duas.map(d => `
        <div class="dua-card">
            <span class="dua-ar">${d.ar}</span>
            <small style="color:var(--text); opacity:0.8;">${d.en}</small>
        </div>
    `).join('');
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDark);
    document.getElementById('dark-mode-btn').innerText = isDark ? '☀️' : '🌙';
}

// --- Rest of your existing functions (loadSurah, filterSurahs, initGPS, etc.) ---
// Ensure you keep loadSurah, renderSurahList, load99Names, and initGPS from the previous chat!

async function load99Names() {
    const container = document.getElementById('names-container');
    if(container.innerHTML !== "") return;
    const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
    const data = await res.json();
    container.innerHTML = data.data.map(n => `<div class="name-card"><span class="name-ar">${n.name}</span><div style="font-weight:700;">${n.transliteration}</div><small>${n.en.meaning}</small></div>`).join('');
}

function saveLastRead(num, name) { localStorage.setItem("lastReadNum", num); localStorage.setItem("lastReadName", name); }
function updateLastReadUI() {
    const name = localStorage.getItem("lastReadName");
    if(name) { document.getElementById('last-read-name').innerText = name; document.getElementById('last-read-container').style.display = "block"; }
}
function resumeReading() { const num = localStorage.getItem("lastReadNum"); const name = localStorage.getItem("lastReadName"); if(num) loadSurah(num, name); }

async function loadSurah(num, name) {
    curSurah = num; curName = name; saveLastRead(num, name);
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const reciter = document.getElementById('reciter-select').value;
    const lang = document.getElementById('lang-select').value;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        let txt = a.text;
        if (num != 1 && num != 9 && i === 0) txt = txt.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        html += `<div style="padding:20px; border-bottom:1px solid #eee; background:var(--card);"><p class="arabic-font">${txt} ﴿${a.numberInSurah}﴾</p><p style="text-align:right; direction:rtl;">${data.data[1].ayahs[i].text}</p></div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
    player.play();
}

window.onload = () => {
    if(localStorage.getItem('dark-mode') === 'true') toggleDarkMode();
    initGPS();
    updateLastReadUI();
    loadDailyVerse();
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        allSurahs = data.data;
        document.getElementById('surah-list-container').innerHTML = allSurahs.map(s => `
            <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
            </div>`).join('');
    });
};

function filterSurahs() {
    const query = document.getElementById('surahSearch').value.toLowerCase();
    const filtered = allSurahs.filter(s => s.englishName.toLowerCase().includes(query) || s.number.toString().includes(query));
    document.getElementById('surah-list-container').innerHTML = filtered.map(s => `<div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;"><span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px;">${s.name}</span></div>`).join('');
}

async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        document.getElementById('prayer-times-bar').innerHTML = `<div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div><div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div><div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
    });
}

