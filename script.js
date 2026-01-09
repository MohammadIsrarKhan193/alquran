// Fix for Sudais and other reciters
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    
    // Correct API ID for Sudais
    const reciter = document.getElementById('reciter-select').value;
    document.getElementById('quran-player').src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; padding:20px; color:var(--emerald);">بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ</div>` : "";
    
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div class="ayah-card" style="background:white; margin:10px; padding:15px; border-radius:15px;">
            <p class="arabic-font" style="font-size:24px; text-align:right;">${a.text}</p>
            <p style="font-size:14px; color:#666;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-container').innerHTML = html;
}

// Auto-Location Prayer Times
async function initPrayer() {
    navigator.geolocation.getCurrentPosition(async (p) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&method=2`);
        const d = await res.json();
        const t = d.data.timings;
        document.getElementById('prayer-list').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div>
            <div>Dhuhr<br><b>${t.Dhuhr}</b></div>
            <div>Asr<br><b>${t.Asr}</b></div>
            <div>Maghrib<br><b>${t.Maghrib}</b></div>
            <div>Isha<br><b>${t.Isha}</b></div>
        `;
    });
}

// Initialization
window.onload = () => {
    initPrayer();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    // Add Surah list loading here...
};

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}
