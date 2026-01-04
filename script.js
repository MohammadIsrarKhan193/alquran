const reader = document.getElementById('reader');
const dashboard = document.getElementById('dashboard');
const ayahContainer = document.getElementById('ayah-container');
const langSelect = document.getElementById('lang-select');

async function init() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        displaySurahList(data.data);
        // Hide splash when data is ready
        document.getElementById('splash-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('splash-screen').classList.add('hidden'), 500);
    } catch (e) { console.log("Connection Error"); }
}

async function loadSurah(num, name) {
    dashboard.classList.add('hidden');
    reader.classList.remove('hidden');
    ayahContainer.innerHTML = "<h3>Loading Holy Verses...</h3>";
    
    const lang = langSelect.value;
    // Fetching Arabic + Selected Translation
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    const arabic = data.data[0].ayahs;
    const translation = data.data[1].ayahs;

    // Bismillah logic: Show for all except Surah 1 and 9
    document.getElementById('bismillah').style.display = (num === 1 || num === 9) ? 'none' : 'block';

    ayahContainer.innerHTML = arabic.map((ayah, i) => `
        <div class="ayah-row">
            <p class="arabic-text">${ayah.text} <span>(${ayah.numberInSurah})</span></p>
            <p class="trans-text">${translation[i].text}</p>
            ${ayah.sajdah ? '<div class="indicator">۩ Sajdah</div>' : ''}
            ${ayah.ruku ? '<div class="indicator">ع Ruku</div>' : ''}
        </div>
    `).join('');
    
    // Feature: Auto-load next surah button at the bottom
    if(num < 114) {
        ayahContainer.innerHTML += `<button class="next-btn" onclick="loadSurah(${num + 1})">Next Surah →</button>`;
    }
    window.scrollTo(0,0);
}
