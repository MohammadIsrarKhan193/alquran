const reader = document.getElementById('ayah-container');
const surahList = document.getElementById('surah-list');
const surahTitle = document.getElementById('surah-title');
const timesList = document.getElementById('times-list');

async function init() {
    console.log("App initializing...");
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        if(data.data) {
            displaySurahList(data.data);
            getPrayerTimes();
        }
    } catch (err) {
        console.error("Connection error:", err);
    }
}

function displaySurahList(surahs) {
    surahList.innerHTML = surahs.map(s => `
        <div class="surah-item" style="padding:15px; border-bottom:1px solid #eee; cursor:pointer;" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <span>${s.number}. ${s.englishName}</span>
        </div>
    `).join('');
}

async function getPrayerTimes() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Kabul&country=Afghanistan&method=2');
        const data = await res.json();
        const t = data.data.timings;
        timesList.innerHTML = `<p>Fajr: ${t.Fajr} | Dhuhr: ${t.Dhuhr} | Maghrib: ${t.Maghrib}</p>`;
    } catch (e) { timesList.innerHTML = "Times Offline"; }
}

// Button listeners
document.getElementById('menu-btn').onclick = () => document.getElementById('sidebar').classList.toggle('hidden');

// Auto-start
window.onload = init;
// Backup start if onload fails
setTimeout(init, 3000);
