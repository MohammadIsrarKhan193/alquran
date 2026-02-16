const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let allSurahs = [], curSurah = 1, curName = "Al-Fatihah", deferredPrompt;

// Navigation
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-wallpapers') loadWallpapers();
    if (id === 'page-names') load99Names();
    if (id === 'page-duas') loadDuas();
    if (id === 'page-home') updateLastReadUI();
    window.scrollTo(0,0);
}

// Professional Prayer Times API (Region Based)
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Fetch City Name and Prayer Times
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        const meta = data.data.meta;
        
        // Update UI
        document.getElementById('city-display').innerText = meta.timezone.split('/')[1].replace('_', ' ');
        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
        
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
            <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
            <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;

        // Load Adhan Settings UI
        document.getElementById('prayer-settings-list').innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => `
            <div class="prayer-setting-item" style="display:flex; justify-content:space-between; padding:20px; background:var(--card); margin:10px; border-radius:15px;">
                <div><b>${p}</b><br><small>${t[p]}</small></div>
                <button onclick="toggleAdhan('${p}')" style="background:none; border:none; font-size:20px;">${adhanSettings[p]?'🔔':'🔕'}</button>
            </div>`).join('');
    }, () => { document.getElementById('prayer-times-bar').innerHTML = "Enable GPS for Times"; });
}

// Zakat Calculator
function calculateZakat() {
    const amount = document.getElementById('zakat-amount').value;
    const result = amount * 0.025;
    document.getElementById('zakat-result').innerText = result > 0 ? "Amount to Pay: " + result.toFixed(2) : "Enter a valid amount";
}

// Wallpapers
function loadWallpapers() {
    const walls = [
        "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400",
        "https://images.unsplash.com/photo-1590076215667-875d4ef2d99c?w=400",
        "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=400",
        "https://images.unsplash.com/photo-1551041777-ed07fa39103b?w=400"
    ];
    document.getElementById('wallpaper-container').innerHTML = walls.map(w => `<img src="${w}" class="wall-thumb" onclick="window.open('${w}')">`).join('');
}

// Quran Functions
async function loadSurah(num, name) {
    curSurah = num; curName = name;
    localStorage.setItem("lastReadNum", num); localStorage.setItem("lastReadName", name);
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const lang = document.getElementById('lang-select').value;
    const reciter = document.getElementById('reciter-select').value;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        let txt = a.text;
        if (num != 1 && num != 9 && i === 0) txt = txt.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        html += `<div style="padding:20px; border-bottom:1px solid #eee; background:var(--card);"><p class="arabic-font">${txt} ﴿${a.numberInSurah}﴾</p><p style="text-align:right; direction:rtl;">${data.data[1].ayahs[i].text}</p></div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
    player.play();
}

function updateLastReadUI() {
    const name = localStorage.getItem("lastReadName");
    if(name) {
        document.getElementById('last-read-name').innerText = name;
        document.getElementById('last-read-container').style.display = "block";
    }
}

function resumeReading() {
    const num = localStorage.getItem("lastReadNum");
    const name = localStorage.getItem("lastReadName");
    if(num) loadSurah(num, name);
}

// Standard Init
window.onload = () => {
    initGPS();
    updateLastReadUI();
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        allSurahs = data.data;
        renderSurahList(allSurahs);
    });
    // Dark mode check
    if(localStorage.getItem('dark-mode') === 'true') toggleDarkMode();
    // Clock
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
};

function renderSurahList(list) {
    document.getElementById('surah-list-container').innerHTML = list.map(s => `
        <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
            <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px;">${s.name}</span>
        </div>`).join('');
}

function filterSurahs() {
    const q = document.getElementById('surahSearch').value.toLowerCase();
    const filtered = allSurahs.filter(s => s.englishName.toLowerCase().includes(q) || s.number.toString().includes(q));
    renderSurahList(filtered);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
}

// Placeholder Duas & Names
function loadDuas() {
    const d = [{ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", en:"Our Lord, give us in this world good."}];
    document.getElementById('duas-container').innerHTML = d.map(x => `<div class="dua-card"><span class="dua-ar">${x.ar}</span><br><small>${x.en}</small></div>`).join('');
}

