const ayahContainer = document.getElementById('ayah-container');
const surahList = document.getElementById('surah-list');

async function init() {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    surahList.innerHTML = data.data.map(s => `
        <div class="surah-item" onclick="loadSurah(${s.number}, '${s.englishName}')">
            ${s.number}. ${s.englishName}
        </div>
    `).join('');
    document.getElementById('splash-screen').classList.add('hidden');
}

async function loadSurah(num, name) {
    toggleSidebar();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('reader').classList.remove('hidden');
    document.getElementById('surah-title').innerText = name;
    ayahContainer.innerHTML = "Loading...";

    const lang = document.getElementById('lang-select').value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    ayahContainer.innerHTML = data.data[0].ayahs.map((ayah, i) => `
        <div style="background:white; margin:10px; padding:15px; border-radius:10px;">
            <p class="arabic-text">${ayah.text}</p>
            <p>${data.data[1].ayahs[i].text}</p>
        </div>
    `).join('');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden'); }
function backHome() {
    document.getElementById('reader').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

window.onload = init;
