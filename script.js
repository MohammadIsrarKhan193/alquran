const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let allSurahs = [], curSurah = 1, curName = "Al-Fatihah";

window.onload = async () => {
    if(localStorage.getItem('dark-mode') === 'true') document.body.classList.add('dark-mode');
    initGPS(); // This also triggers Hijri Dates
    loadDailyVerse();
    load99Names();
    loadDuas();
    updateLastReadUI();
    
    // Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    allSurahs = data.data;
    renderSurahList(allSurahs);

    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
};

// --- NEW: Hijri Events Logic ---
async function updateIslamicEvents(day, month, year) {
    // Hijri Dates for Major Events (Month is 1-indexed)
    const events = [
        { name: "Ramadan", m: 9, d: 1, id: "ramadan-countdown" },
        { name: "Eid al-Fitr", m: 10, d: 1, id: "eid-fitr-countdown" },
        { name: "Eid al-Adha", m: 12, d: 10, id: "eid-adha-countdown" }
    ];

    events.forEach(event => {
        let diff;
        let currentTotalDays = (month * 30) + parseInt(day);
        let eventTotalDays = (event.m * 30) + event.d;

        if (eventTotalDays >= currentTotalDays) {
            diff = eventTotalDays - currentTotalDays;
        } else {
            diff = (354 - currentTotalDays) + eventTotalDays; // Days in Hijri year ~354
        }

        const el = document.getElementById(event.id);
        if (diff === 0) el.innerText = `${event.name}: Today! Mubarak!`;
        else el.innerText = `${event.name}: In ${diff} days`;
    });
}

// Fixed GPS & Hijri Integration
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
            const data = await res.json();
            const t = data.data.timings;
            const h = data.data.date.hijri;
            
            document.getElementById('hijri-today').innerText = `${h.day} ${h.month.en} ${h.year}`;
            document.getElementById('prayer-times-bar').innerHTML = `
                <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
                <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
                <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
            
            // Trigger the E-Card Countdown
            updateIslamicEvents(h.day, h.month.number, h.year);
            
        } catch(e) { console.log("Prayer error"); }
    });
}

// --- Keep Previous Core Functions (Same as last version) ---
async function load99Names() {
    const container = document.getElementById('names-container');
    const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
    const data = await res.json();
    container.innerHTML = data.data.map(n => `<div class="name-card"><span class="name-ar">${n.name}</span><br><b>${n.transliteration}</b><br><small>${n.en.meaning}</small></div>`).join('');
}

async function loadDailyVerse() {
    const randomAyah = Math.floor(Math.random() * 6000) + 1;
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    document.getElementById('daily-ar').innerText = data.data[0].text;
    document.getElementById('daily-en').innerText = data.data[1].text;
}

function loadDuas() {
    const duas = [{ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", en: "Our Lord, give us in this world good."}];
    document.getElementById('duas-container').innerHTML = duas.map(d => `<div class="dua-card"><p class="arabic-font">${d.ar}</p><p>${d.en}</p></div>`).join('');
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

async function loadSurah(num, name) {
    curSurah = num; curName = name;
    localStorage.setItem("lastReadNum", num); localStorage.setItem("lastReadName", name);
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${num}.mp3`;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    let html = "";
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div style="padding:15px; border-bottom:1px solid #eee;"><p class="arabic-font">${a.text}</p><p>${data.data[1].ayahs[i].text}</p></div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
}

function renderSurahList(list) {
    document.getElementById('surah-list-container').innerHTML = list.map(s => `
        <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; margin:10px;">
            <span>${s.number}. ${s.englishName}</span><span>${s.name}</span>
        </div>`).join('');
}

function updateLastReadUI() {
    const name = localStorage.getItem("lastReadName");
    if(name) { document.getElementById('last-read-name').innerText = name; document.getElementById('last-read-container').style.display = "block"; }
}

function resumeReading() {
    const num = localStorage.getItem("lastReadNum");
    const name = localStorage.getItem("lastReadName");
    if(num) loadSurah(num, name);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
}

