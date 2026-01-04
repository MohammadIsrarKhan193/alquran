const reader = document.getElementById('ayah-container');
const surahList = document.getElementById('surah-list');
const surahTitle = document.getElementById('surah-title');
const timesList = document.getElementById('times-list');

async function init() {
    try {
        // Fetch Surah list
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        displaySurahList(data.data);
        
        // Load Prayer Times
        getPrayerTimes();
    } catch (err) {
        console.error("Error loading Quran data:", err);
    }
}

function displaySurahList(surahs) {
    surahList.innerHTML = surahs.map(s => `
        <div class="surah-item" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <span>${s.number}. ${s.englishName}</span>
            <span class="arabic-name">${s.name}</span>
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    surahTitle.innerText = "Loading...";
    reader.innerHTML = "";
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        surahTitle.innerText = name;
        
        const arabic = data.data[0].ayahs;
        const english = data.data[1].ayahs;

        reader.innerHTML = arabic.map((ayah, i) => `
            <div class="ayah-box">
                <p class="arabic-text">${ayah.text} <span>(${ayah.numberInSurah})</span></p>
                <p class="translation-text">${english[i].text}</p>
            </div>
        `).join('');
        
        // Close sidebar on mobile after selection
        document.getElementById('sidebar').classList.add('hidden');
    } catch (err) {
        surahTitle.innerText = "Error Loading Surah";
    }
}

async function getPrayerTimes() {
    // Using a fixed location (Kabul) for stability, can be updated to auto-detect later
    try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Kabul&country=Afghanistan&method=2');
        const data = await res.json();
        const t = data.data.timings;
        timesList.innerHTML = `
            <p>Fajr: ${t.Fajr}</p>
            <p>Dhuhr: ${t.Dhuhr}</p>
            <p>Asr: ${t.Asr}</p>
            <p>Maghrib: ${t.Maghrib}</p>
            <p>Isha: ${t.Isha}</p>
        `;
    } catch (err) {
        timesList.innerHTML = "Times Unavailable Offline";
    }
}

// Sidebar Toggle Logic
document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('hidden');
});

// START THE APP
window.addEventListener('DOMContentLoaded', init);
