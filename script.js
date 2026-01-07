// Page Switcher Logic
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    window.scrollTo(0,0);
}

async function init() {
    // 1. Live Time & Prayer
    setInterval(() => {
        document.getElementById('current-time').innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    }, 1000);

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

    // 2. Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <strong>${s.number}. ${s.englishName}</strong> <span style="float:right">${s.name}</span>
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    showPage('reader-page');
    const lang = document.getElementById('lang-select')?.value || 'en.sahih';
    const reciter = document.getElementById('reciter-select').value;
    
    const [qRes, aRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`),
        fetch(`https://api.alquran.cloud/v1/surah/${num}/${reciter}`)
    ]);
    const qData = await qRes.json();
    const aData = await aRes.json();

    let html = `<div style="text-align:center; padding:20px;">
        <h2 class="arabic-font">سُورَةُ ${qData.data[0].name}</h2>
        ${num !== 1 && num !== 9 ? '<p class="arabic-font">بِسْمِ ٱللَّهِ ٱلرَّهْمَٰنِ ٱلرَّحِيمِ</p>' : ''}
    </div>`;

    html += qData.data[0].ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <p class="arabic-font">${ayah.text} <span style="color:var(--emerald)">(${ayah.numberInSurah})</span></p>
            <p style="color:#666; font-size:14px;">${qData.data[1].ayahs[i].text}</p>
            <div style="margin-top:10px;">
                ${ayah.sajdah ? '<span class="marker">۩ Sajdah</span>' : ''}
                ${ayah.ruku ? '<span class="marker">Ruku</span>' : ''}
                <button onclick="playVoice('${aData.data.ayahs[i].audio}')" style="background:var(--emerald); color:white; border:none; padding:5px 15px; border-radius:10px;">▶ Play</button>
            </div>
        </div>
    `).join('');
    document.getElementById('ayah-container').innerHTML = html;
}

function playVoice(url) {
    const audio = document.getElementById('main-audio');
    document.getElementById('audio-bar').classList.remove('hidden');
    audio.src = url; audio.play();
}

window.onload = init;

