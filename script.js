const dashboard = document.getElementById('dashboard');
const reader = document.getElementById('reader');
const qiblaView = document.getElementById('qibla-view');
const ayahContainer = document.getElementById('ayah-container');

async function init() {
    // 1. World Prayer Times (Worldwide API)
    navigator.geolocation.getCurrentPosition(async (p) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&method=2`);
        const d = await res.json();
        document.getElementById('prayer-time').innerText = `Next: ${d.data.timings.Fajr} (Fajr)`;
        document.getElementById('hijri-date').innerText = d.data.date.hijri.date;
    });

    // 2. Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="surah-item" style="padding:15px; border-bottom:1px solid #eee;" onclick="loadSurah(${s.number}, '${s.englishName}')">
            ${s.number}. ${s.englishName} (${s.name})
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    toggleSidebar();
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    qiblaView.classList.add('hidden');
    ayahContainer.innerHTML = "<h4>Loading...</h4>";

    const lang = document.getElementById('lang-select').value;
    const reciter = document.getElementById('reciter-select').value;
    
    const [qRes, aRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`),
        fetch(`https://api.alquran.cloud/v1/surah/${num}/${reciter}`)
    ]);
    const qData = await qRes.json();
    const aData = await aRes.json();

    let html = `
        <div style="text-align:center; padding:20px; background:#e8f5e9; border-radius:10px;">
            <h2 class="arabic-font">سُورَةُ ${qData.data[0].name}</h2>
            ${num !== 1 && num !== 9 ? '<p class="arabic-font">بِسْمِ ٱللَّهِ ٱلرَّهْمَٰنِ ٱلرَّحِيمِ</p>' : ''}
        </div>`;

    html += qData.data[0].ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <p class="arabic-font">${ayah.text} <span class="ayah-num">${ayah.numberInSurah}</span></p>
            <p style="color:#555;">${qData.data[1].ayahs[i].text}</p>
            <div style="margin-top:10px;">
                ${ayah.sajdah ? '<span class="marker">۩ Sajdah</span>' : ''}
                ${ayah.ruku ? '<span class="marker">ع Ruku</span>' : ''}
                <button onclick="playVoice('${aData.data.ayahs[i].audio}')">▶ Listen</button>
            </div>
        </div>
    `).join('');

    if(num < 114) html += `<button class="next-btn" onclick="loadSurah(${num+1}, '')">Next Surah →</button>`;
    ayahContainer.innerHTML = html;
    window.scrollTo(0,0);
}

function playVoice(url) {
    const audio = document.getElementById('main-audio');
    document.getElementById('audio-player').classList.remove('hidden');
    audio.src = url;
    audio.play();
}

// QIBLA SENSOR LOGIC
function openQibla() {
    dashboard.classList.add('hidden');
    qiblaView.classList.remove('hidden');
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            const compass = document.getElementById('compass-needle');
            if (compass) compass.style.transform = `rotate(${-e.alpha}deg)`;
        }, true);
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden'); }
function backHome() { dashboard.classList.remove('hidden'); reader.classList.add('hidden'); qiblaView.classList.add('hidden'); }

window.onload = init;
