const reader = document.getElementById('reader');
const dashboard = document.getElementById('dashboard');
const ayahContainer = document.getElementById('ayah-container');
const langSelect = document.getElementById('lang-select');

async function init() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        displaySurahList(data.data);
        document.getElementById('splash-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('splash-screen').classList.add('hidden'), 500);
    } catch (e) { console.log("Offline or Error"); }
}

function displaySurahList(surahs) {
    document.getElementById('surah-list').innerHTML = surahs.map(s => `
        <div class="surah-item" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <strong>${s.number}. ${s.englishName}</strong><br>
            <small>${s.name} • ${s.numberOfAyahs} Ayahs</small>
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    toggleSidebar(); // Close menu
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    ayahContainer.innerHTML = "<p>Loading Holy Verses...</p>";
    document.getElementById('surah-name-header').innerText = name;

    const lang = langSelect.value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    const arabic = data.data[0].ayahs;
    const trans = data.data[1].ayahs;

    // Show Bismillah except for Surah Fatiha (1) and Surah Tawbah (9)
    document.getElementById('bismillah').style.display = (num === 1 || num === 9) ? 'none' : 'block';

    ayahContainer.innerHTML = arabic.map((ayah, i) => `
        <div style="background:white; margin-bottom:10px; padding:15px; border-radius:10px;">
            <p class="arabic-text">${ayah.text} 🌙</p>
            <p style="color:#444; font-size:14px; line-height:1.6;">${trans[i].text}</p>
            ${ayah.sajdah ? '<p style="color:red; font-weight:bold;">۩ Sajdah</p>' : ''}
        </div>
    `).join('');
    window.scrollTo(0,0);
}

function backToDashboard() {
    reader.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('hidden'); }
document.getElementById('menu-btn').onclick = toggleSidebar;

window.onload = init;
