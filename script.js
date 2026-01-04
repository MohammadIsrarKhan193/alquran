const reader = document.getElementById('reader');
const dashboard = document.getElementById('dashboard');
const ayahContainer = document.getElementById('ayah-container');
const langSelect = document.getElementById('lang-select');
const sidebar = document.getElementById('sidebar');

async function init() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        displaySurahList(data.data);
        // Hides splash screen
        const splash = document.getElementById('splash-screen');
        if(splash) {
            setTimeout(() => splash.classList.add('hidden'), 1000);
        }
    } catch (e) { console.error("Error loading Surahs"); }
}

function displaySurahList(surahs) {
    document.getElementById('surah-list').innerHTML = surahs.map(s => `
        <div class="surah-item" style="padding:15px; border-bottom:1px solid #eee; cursor:pointer;" onclick="loadSurah(${s.number}, '${s.englishName}')">
            ${s.number}. ${s.englishName} (${s.name})
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    // This part switches the screen from Dashboard to Quran
    sidebar.classList.add('hidden');
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    
    ayahContainer.innerHTML = "<h4>Loading Holy Verses...</h4>";
    document.getElementById('surah-title').innerText = name;
    
    const lang = langSelect.value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    const arabic = data.data[0].ayahs;
    const trans = data.data[1].ayahs;

    document.getElementById('bismillah').style.display = (num === 1 || num === 9) ? 'none' : 'block';

    ayahContainer.innerHTML = arabic.map((ayah, i) => `
        <div class="ayah-box">
            <p class="arabic-text">${ayah.text} 🌙</p>
            <p style="color: #444; font-size: 15px;">${trans[i].text}</p>
        </div>
    `).join('');
    window.scrollTo(0,0);
}

function toggleSidebar() { 
    sidebar.classList.toggle('hidden'); 
}

function backToDashboard() {
    reader.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

// Ensure the menu button works
document.getElementById('menu-btn').onclick = toggleSidebar;

window.onload = init;
