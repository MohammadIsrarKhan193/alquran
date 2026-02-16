const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let allSurahs = [], curSurah = 1, curName = "Al-Fatihah";

// 1. FORCE LOAD EVERYTHING ON START
window.onload = async () => {
    console.log("Jani, App is starting...");
    if(localStorage.getItem('dark-mode') === 'true') document.body.classList.add('dark-mode');
    
    // Run all features
    initGPS();
    loadDailyVerse();
    load99Names(); // This was likely the one failing
    loadDuas();
    updateLastReadUI();
    
    // Load Surah List
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        allSurahs = data.data;
        renderSurahList(allSurahs);
    } catch(e) { console.error("Surah list failed, Jani!"); }

    // Clock
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
};

// 2. FIXED: 99 NAMES API
async function load99Names() {
    const container = document.getElementById('names-container');
    try {
        const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
        const data = await res.json();
        if(data.data) {
            container.innerHTML = data.data.map(n => `
                <div class="name-card">
                    <span class="name-ar" style="color:var(--emerald); font-size:24px;">${n.name}</span>
                    <div style="font-weight:700; margin-top:5px;">${n.transliteration}</div>
                    <small style="opacity:0.7;">${n.en.meaning}</small>
                </div>
            `).join('');
        }
    } catch(e) { 
        container.innerHTML = "<p style='padding:20px;'>Connect to internet to see Names, Jani!</p>"; 
    }
}

// 3. FIXED: DAILY VERSE (Uses a random Ayah if the day-index fails)
async function loadDailyVerse() {
    const randomAyah = Math.floor(Math.random() * 6236) + 1;
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        document.getElementById('daily-ar').innerText = data.data[0].text;
        document.getElementById('daily-en').innerText = data.data[1].text + ` — (${data.data[0].surah.englishName})`;
    } catch(e) { 
        document.getElementById('daily-ar').innerText = "Please check internet connection.";
    }
}

// 4. FIXED: DAILY DUAS (Hardcoded so they ALWAYS show up)
function loadDuas() {
    const duas = [
        {ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً", en: "Our Lord, give us in this world that which is good and in the Hereafter that which is good."},
        {ar: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", en: "O Allah, You are Forgiving and love forgiveness, so forgive me."},
        {ar: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي", en: "My Lord, make me an establisher of prayer, and from my descendants."}
    ];
    const container = document.getElementById('duas-container');
    if(container) {
        container.innerHTML = duas.map(d => `
            <div class="dua-card" style="margin:10px; padding:15px; background:var(--card); border-radius:15px; border-left:4px solid var(--emerald);">
                <span class="arabic-font" style="font-size:20px; display:block; text-align:right;">${d.ar}</span>
                <p style="font-size:13px; margin-top:10px;">${d.en}</p>
            </div>
        `).join('');
    }
}

// 5. FIXED: GPS & PRAYER TIMES
async function initGPS() {
    const timeBar = document.getElementById('prayer-times-bar');
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
            const data = await res.json();
            const t = data.data.timings;
            
            document.getElementById('city-display').innerText = "As-salamu alaykum";
            document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
            
            timeBar.innerHTML = `
                <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
                <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
                <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
        } catch(e) { timeBar.innerHTML = "API Error"; }
    }, () => { 
        timeBar.innerHTML = "<button onclick='initGPS()' style='color:white; background:none; border:1px solid white; border-radius:5px;'>Enable GPS</button>"; 
    });
}

// 6. WALLPAPERS (Added real high-quality Islamic links)
function loadWallpapers() {
    const walls = [
        "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=400",
        "https://images.unsplash.com/photo-1590076215667-875d4ef2d99c?auto=format&fit=crop&w=400",
        "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=400",
        "https://images.unsplash.com/photo-1551041777-ed07fa39103b?auto=format&fit=crop&w=400"
    ];
    document.getElementById('wallpaper-container').innerHTML = walls.map(w => `
        <div style="position:relative;">
            <img src="${w}" class="wall-thumb" style="width:100%; border-radius:15px;">
            <a href="${w}" download target="_blank" style="position:absolute; bottom:10px; right:10px; background:white; padding:5px; border-radius:50%; text-decoration:none;">📥</a>
        </div>
    `).join('');
}

// --- KEEP YOUR EXISTING loadSurah, showPage, and toggleDarkMode FUNCTIONS BELOW THIS LINE ---
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-wallpapers') loadWallpapers();
    if (id === 'page-names') load99Names();
    if (id === 'page-duas') loadDuas();
}

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

function renderSurahList(list) {
    document.getElementById('surah-list-container').innerHTML = list.map(s => `
        <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
            <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px;">${s.name}</span>
        </div>`).join('');
}

function updateLastReadUI() {
    const name = localStorage.getItem("lastReadName");
    if(name) {
        document.getElementById('last-read-name').innerText = name;
        document.getElementById('last-read-container').style.display = "block";
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
}

