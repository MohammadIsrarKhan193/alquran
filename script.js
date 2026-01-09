const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

// --- GLOBAL LOCATION & PRAYER TIMES ---
async function initApp() {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // Worldwide Prayer Times
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div>
            <div>Sunrise<br><b>${t.Sunrise}</b></div>
            <div>Dhuhr<br><b>${t.Dhuhr}</b></div>
            <div>Asr<br><b>${t.Asr}</b></div>
            <div>Maghrib<br><b>${t.Maghrib}</b></div>
            <div>Isha<br><b>${t.Isha}</b></div>
        `;
        
        // Hijri Date
        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
    });
}

// --- AUDIO RECITERS FIX ---
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    
    // Updated Logic: Uses official CDN links to ensure Sudais & Maher work
    const reciter = document.getElementById('reciter-select').value;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    player.play();

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    
    // Check for correct Bismillah (only once)
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--primary);">${CORRECT_BISMILLAH}</div>` : "";
    
    data.data[0].ayahs.forEach((ayah, i) => {
        let text = ayah.text;
        // Clean first ayah of bismillah if it's already at top
        if (num != 1 && num != 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        
        html += `
            <div class="ayah-card" style="padding:20px; border-bottom:1px solid #eee; background:white;">
                <p class="arabic-font">${text} <span style="color:var(--primary); font-size:18px;">﴿${ayah.numberInSurah}﴾</span></p>
                <p style="color:#666; font-size:14px; margin-top:10px;">${data.data[1].ayahs[i].text}</p>
            </div>`;
    });
    document.getElementById('ayah-container').innerHTML = html;
}

// --- NAVIGATION & TASBEEH ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
}

let tCount = 0;
function doCount() {
    tCount++;
    document.getElementById('t-count').innerText = tCount;
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
}
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }

function stopAudio() { document.getElementById('quran-player').pause(); }

window.onload = () => {
    initApp();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    
    // Load Surah List
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        document.getElementById('surah-list').innerHTML = data.data.map(s => `
            <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span>
                <span class="arabic-font" style="font-size:18px;">${s.name}</span>
            </div>`).join('');
    });
};
