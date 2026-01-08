// PAGE SWITCHER
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

// APP START
async function init() {
    // 1. Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    }, 1000);

    // 2. Prayer Times (Based on your location Kabul)
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const d = await res.json();
        const t = d.data.timings;
        document.getElementById('fajr').innerText = t.Fajr;
        document.getElementById('dzuhr').innerText = t.Dhuhr;
        document.getElementById('asr').innerText = t.Asr;
        document.getElementById('maghrib').innerText = t.Maghrib;
        document.getElementById('isha').innerText = t.Isha;
    });

    // 3. Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <strong>${s.number}. ${s.englishName}</strong>
            <span style="float:right" class="arabic-font">${s.name}</span>
        </div>
    `).join('');
}

// QURAN ENGINE
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<h4>Loading...</h4>";

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();

    let html = (num !== 1 && num !== 9) ? '<p class="arabic-font" style="text-align:center">بِسْمِ ٱللَّهِ ٱلرَّهْمَٰنِ ٱلرَّحِيمِ</p>' : '';
    html += data.data[0].ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <p class="arabic-font">${ayah.text} <span style="color:var(--emerald)">(${ayah.numberInSurah})</span></p>
            <p style="color:#666; margin-top:10px;">${data.data[1].ayahs[i].text}</p>
        </div>
    `).join('');
    container.innerHTML = html;
}

// COMPASS SENSOR
window.addEventListener('deviceorientation', (e) => {
    const needle = document.getElementById('compass-needle');
    if(needle) needle.style.transform = `rotate(${-e.alpha}deg)`;
}, true);

window.onload = init;
