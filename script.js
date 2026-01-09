// --- AUDIO FIX ---
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const reciter = document.getElementById('reciter-select').value;
    
    // Updated audio URL for all reciters
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    player.play();

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    let html = "";
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div class="ayah-card" style="background:white; margin:15px; padding:20px; border-radius:15px;">
            <p style="text-align:right; font-family:'Amiri'; font-size:26px;">${a.text}</p>
            <p style="color:#666; font-size:14px;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-container').innerHTML = html;
}

// --- GLOBAL PRAYER TIMES & ALARMS ---
async function initAutoLocation() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Get Prayer Times
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        
        document.getElementById('prayer-list').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div>
            <div>Dhuhr<br><b>${t.Dhuhr}</b></div>
            <div>Asr<br><b>${t.Asr}</b></div>
            <div>Maghrib<br><b>${t.Maghrib}</b></div>
            <div>Isha<br><b>${t.Isha}</b></div>
        `;
        document.getElementById('date-hijri').innerText = data.data.date.hijri.day + " " + data.data.date.hijri.month.en + " " + data.data.date.hijri.year;
    });
}

// --- QIBLA COMPASS ---
function initQibla() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientationabsolute', (e) => {
            const compass = e.alpha || e.webkitCompassHeading;
            document.getElementById('needle').style.transform = `rotate(${-compass}deg)`;
            document.getElementById('qibla-degree').innerText = Math.floor(compass) + "°";
        }, true);
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

window.onload = () => {
    initAutoLocation();
    initQibla();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    // Fetch Surah list here...
};
