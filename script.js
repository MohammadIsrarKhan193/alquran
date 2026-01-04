const reader = document.getElementById('reader');
const dashboard = document.getElementById('dashboard');
const ayahContainer = document.getElementById('ayah-container');
const langSelect = document.getElementById('lang-select');

async function init() {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    displaySurahList(data.data);
    setTimeout(() => document.getElementById('splash-screen').classList.add('hidden'), 1500);
}

function displaySurahList(surahs) {
    document.getElementById('surah-list').innerHTML = surahs.map(s => `
        <div class="surah-item" onclick="loadSurah(${s.number})">
            ${s.number}. ${s.englishName} (${s.name})
        </div>
    `).join('');
}

async function loadSurah(num) {
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    ayahContainer.innerHTML = "Loading...";
    
    const lang = langSelect.value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    const arabic = data.data[0].ayahs;
    const trans = data.data[1].ayahs;

    // Show Bismillah except for Surah Al-Tawbah (9)
    document.getElementById('bismillah').style.display = (num === 1 || num === 9) ? 'none' : 'block';

    ayahContainer.innerHTML = arabic.map((ayah, i) => `
        <div class="ayah-box">
            <p class="arabic-text">${ayah.text} <span style="color:var(--primary)">(${ayah.numberInSurah})</span></p>
            <p style="color: #555;">${trans[i].text}</p>
            ${ayah.sajdah ? '<div style="color:red; font-size:12px;">۩ SAJDAH</div>' : ''}
        </div>
    `).join('');
    window.scrollTo(0,0);
}

function backToDashboard() {
    reader.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden'); }

window.onload = init;
