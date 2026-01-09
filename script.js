// Global reciter map for Sudais/Maher/Minshawi fix
const RECITERS = {
    'alafasy': 'ar.alafasy',
    'sudais': 'ar.abdurrahmansudais',
    'muaiqly': 'ar.mahermuaiqly',
    'minshawi': 'ar.minshawi'
};

let currentReciter = RECITERS.alafasy;

function changeReciter(key) {
    currentReciter = RECITERS[key];
    const surah = localStorage.getItem('lastSurah');
    if(surah) loadSurah(surah, localStorage.getItem('lastName'));
}

// Prayer Times Logic (Automatic Location)
async function getPrayerTimes() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        updatePrayerUI(data.data.timings);
    });
}

function updatePrayerUI(t) {
    const list = document.getElementById('prayer-list');
    list.innerHTML = `
        <div class="p-row"><span>Fajr</span> <b>${t.Fajr}</b></div>
        <div class="p-row"><span>Dhuhr</span> <b>${t.Dhuhr}</b></div>
        <div class="p-row"><span>Asr</span> <b>${t.Asr}</b></div>
        <div class="p-row"><span>Maghrib</span> <b>${t.Maghrib}</b></div>
        <div class="p-row"><span>Isha</span> <b>${t.Isha}</b></div>
    `;
}

// Qibla Logic
function initQibla() {
    window.addEventListener('deviceorientation', (e) => {
        const compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
        const needle = document.getElementById('qibla-needle');
        if(needle) needle.style.transform = `rotate(${-compass}deg)`;
    });
}
