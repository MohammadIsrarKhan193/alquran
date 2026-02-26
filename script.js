const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let curSurah = 1, curName = "Al-Fatihah";

window.onload = () => {
    initGPS();
    loadSurahList();
    load99Names();
    loadProphetNames();
    setInterval(updateClock, 1000);
};

function updateClock() {
    const d = new Date();
    document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
}

// Fixed Surah List with SS Design
async function loadSurahList() {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list-container').innerHTML = data.data.map(s => `
        <div class="surah-card" onclick="loadSurah(${s.number},'${s.englishName}')">
            <div class="surah-num-star">${s.number}</div>
            <div class="surah-info">
                <h4>${s.englishName}</h4>
                <p>${s.revelationType} • ${s.numberOfAyahs} Ayahs</p>
            </div>
            <div class="surah-arabic">${s.name}</div>
        </div>`).join('');
}

// 99 Names of Allah
async function load99Names() {
    const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
    const data = await res.json();
    document.getElementById('names-container').innerHTML = data.data.map(n => `
        <div class="name-card">
            <span class="ar">${n.name}</span>
            <span class="en">${n.transliteration}</span>
        </div>`).join('');
}

// 99 Names of Prophet Muhammad ﷺ
function loadProphetNames() {
    const pNames = [
        {ar: "مُحَمَّد", en: "Muhammad"}, {ar: "أَحْمَد", en: "Ahmad"}, {ar: "حَامِد", en: "Hamid"},
        {ar: "مَحْمُود", en: "Mahmud"}, {ar: "قَاسِم", en: "Qasim"}, {ar: "عَاقِب", en: "Aqib"},
        {ar: "فَاتِح", en: "Fatih"}, {ar: "شَاهِد", en: "Shahid"}, {ar: "حَاشِر", en: "Hashir"}
    ]; // You can add more names to this list
    document.getElementById('prophet-names-container').innerHTML = pNames.map(n => `
        <div class="name-card">
            <span class="ar">${n.ar}</span>
            <span class="en">${n.en}</span>
        </div>`).join('');
}

// Logic for Quran Reader
async function loadSurah(num, name) {
    curSurah = num; curName = name;
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const lang = document.getElementById('lang-select').value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    let html = (num != 1 && num != 9) ? `<div style="text-align:center; color:var(--emerald); font-family:'Amiri'; font-size:24px; padding:20px;">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div style="padding:20px; border-bottom:1px solid var(--soft-emerald); background:var(--card);">
            <p style="font-family:'Amiri'; font-size:28px; text-align:right; direction:rtl; line-height:2;">${a.text} <span style="color:var(--gold);">﴿${a.numberInSurah}﴾</span></p>
            <p style="color:var(--text); font-size:16px; margin-top:10px;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
}

// --- GPS, Alarms, and Navigation (Preserved) ---
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        const h = data.data.date.hijri;
        document.getElementById('hijri-today').innerText = `${h.day} ${h.month.en} ${h.year}`;
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
            <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
            <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
}

let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; if(navigator.vibrate) navigator.vibrate(50); }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
function changeLanguage() { loadSurah(curSurah, curName); }
function stopAudio() { document.getElementById('quran-player').pause(); }

