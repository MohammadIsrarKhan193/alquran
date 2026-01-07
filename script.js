let currentSurahNum = 1;

// 1. PAGE NAVIGATION
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    window.scrollTo(0,0);
}

// 2. INITIALIZATION (Times & Surah List)
async function init() {
    // Live Clock
    setInterval(() => {
        document.getElementById('current-time').innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    }, 1000);

    // Global Prayer Times
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const d = await res.json();
        const t = d.data.timings;
        document.getElementById('fajr').innerText = t.Fajr;
        document.getElementById('dzuhr').innerText = t.Dhuhr;
        document.getElementById('asr').innerText = t.Asr;
        document.getElementById('maghrib').innerText = t.Maghrib;
        document.getElementById('isha').innerText = t.Isha;
        document.getElementById('hijri-text').innerText = d.data.date.hijri.day + " " + d.data.date.hijri.month.en;
    });

    // Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number})">
            <span style="color:var(--emerald); font-weight:bold;">${s.number}</span>
            <span style="margin-left:15px;">${s.englishName}</span>
            <span style="float:right;" class="arabic-font">${s.name}</span>
        </div>
    `).join('');
}

// 3. QURAN READER ENGINE
async function loadSurah(num) {
    currentSurahNum = num;
    showPage('reader-page');
    const ayahContainer = document.getElementById('ayah-container');
    ayahContainer.innerHTML = "<p style='text-align:center;'>Loading Revelations...</p>";

    const reciter = document.getElementById('reciter-select').value;
    const [qRes, aRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`),
        fetch(`https://api.alquran.cloud/v1/surah/${num}/${reciter}`)
    ]);
    const qData = await qRes.json();
    const aData = await aRes.json();

    let html = `<div style="text-align:center; padding:20px;">
        <h2 class="arabic-font">سُورَةُ ${qData.data[0].name}</h2>
        ${num !== 1 && num !== 9 ? '<p class="arabic-font">بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ</p>' : ''}
    </div>`;

    html += qData.data[0].ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <p class="arabic-font">${ayah.text} <span style="color:var(--emerald)">(${ayah.numberInSurah})</span></p>
            <p style="color:#666; font-size:14px; margin-top:10px;">${qData.data[1].ayahs[i].text}</p>
            <div style="margin-top:15px; display:flex; align-items:center;">
                ${ayah.sajdah ? '<span class="marker">۩ Sajdah</span>' : ''}
                ${ayah.ruku ? '<span class="marker">ع Ruku</span>' : ''}
                <button onclick="playAudio('${aData.data.ayahs[i].audio}')" style="background:var(--emerald); color:white; border:none; padding:8px 15px; border-radius:12px; margin-left:auto;">▶ Play</button>
            </div>
        </div>
    `).join('');
    
    ayahContainer.innerHTML = html;
}

function playAudio(url) {
    const player = document.getElementById('main-audio');
    document.getElementById('audio-player').classList.remove('hidden');
    player.src = url;
    player.play();
}

function reloadSurah() { loadSurah(currentSurahNum); }
function closeAudio() { document.getElementById('audio-player').classList.add('hidden'); document.getElementById('main-audio').pause(); }

// 4. QIBLA SENSOR
window.addEventListener('deviceorientation', (e) => {
    const needle = document.getElementById('compass-needle');
    if (needle) needle.style.transform = `rotate(${-e.alpha}deg)`;
}, true);

window.onload = init;
