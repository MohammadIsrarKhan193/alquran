const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

// --- 1. Navigation Logic ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

// --- 2. Worldwide Prayer Times (GPS) ---
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div>
            <div>Dhuhr<br><b>${t.Dhuhr}</b></div>
            <div>Asr<br><b>${t.Asr}</b></div>
            <div>Maghrib<br><b>${t.Maghrib}</b></div>
            <div>Isha<br><b>${t.Isha}</b></div>
        `;
        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
    });
}

// --- 3. Quran Reader & Fixed Audio ---
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const container = document.getElementById('ayah-content');
    container.innerHTML = "<p style='text-align:center; padding:20px;'>Loading...</p>";

    // FIXED: Correct reciter links for Sudais, Maher, Alafasy
    const reciter = document.getElementById('reciter-select').value;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    player.play();

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        
        let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
        
        data.data[0].ayahs.forEach((ayah, i) => {
            let text = ayah.text;
            if (num != 1 && num != 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
            html += `
                <div style="padding:20px; border-bottom:1px solid #eee; background:white;">
                    <p class="arabic-font">${text} <span style="color:var(--emerald); font-size:18px;">﴿${ayah.numberInSurah}﴾</span></p>
                    <p style="color:#666; font-size:14px; margin-top:10px;">${data.data[1].ayahs[i].text}</p>
                </div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = "Error loading. Check connection."; }
}

// --- 4. Tasbeeh Logic ---
let tCount = 0;
function doCount() {
    tCount++;
    document.getElementById('t-count').innerText = tCount;
    if (navigator.vibrate) navigator.vibrate(50);
}
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function stopAudio() { document.getElementById('quran-player').pause(); }

// --- 5. Initial Load ---
window.onload = () => {
    initGPS();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);

    // Load Surah List
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        document.getElementById('surah-list-container').innerHTML = data.data.map(s => `
            <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span>
                <span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
            </div>`).join('');
    });
};
