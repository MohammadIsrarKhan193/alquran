const reader = document.getElementById('reader');
const dashboard = document.getElementById('dashboard');
const ayahContainer = document.getElementById('ayah-container');

async function init() {
    // 1. Get World Prayer Times
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const d = await res.json();
        document.getElementById('hijri-date').innerText = d.data.date.hijri.date;
        document.getElementById('location-display').innerText = "Your Location";
        document.getElementById('next-prayer').innerText = `Fajr: ${d.data.timings.Fajr} | Maghrib: ${d.data.timings.Maghrib}`;
    });

    // 2. Load Surah List
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="surah-item" onclick="loadSurah(${s.number}, '${s.englishName}')">
            ${s.number}. ${s.englishName}
        </div>
    `).join('');
    document.getElementById('splash-screen').classList.add('hidden');
}

async function loadSurah(num, name) {
    toggleSidebar();
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    document.getElementById('surah-title').innerText = name;
    ayahContainer.innerHTML = "Loading...";

    const lang = document.getElementById('lang-select').value;
    const reciter = document.getElementById('reciter-select').value;
    
    const [qRes, aRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`),
        fetch(`https://api.alquran.cloud/v1/surah/${num}/${reciter}`)
    ]);
    
    const qData = await qRes.json();
    const aData = await aRes.json();

    document.getElementById('bismillah').style.display = (num === 1 || num === 9) ? 'none' : 'block';

    ayahContainer.innerHTML = qData.data[0].ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <p class="arabic-font">${ayah.text} <span>(${ayah.numberInSurah})</span></p>
            <p>${qData.data[1].ayahs[i].text}</p>
            <div style="margin-top:10px;">
                ${ayah.sajdah ? '<span class="marker">۩ Sajdah</span>' : ''}
                <button onclick="playAudio('${aData.data.ayahs[i].audio}')">▶ Listen</button>
            </div>
        </div>
    `).join('');
}

function playAudio(url) {
    const audio = document.getElementById('main-audio');
    document.getElementById('audio-bar').classList.remove('hidden');
    audio.src = url;
    audio.play();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden'); }
function backHome() { reader.classList.add('hidden'); dashboard.classList.remove('hidden'); }

window.onload = init;
