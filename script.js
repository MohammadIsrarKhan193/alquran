const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let curSurah = 1, curName = "Al-Fatihah";
let allSurahs = [];

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-hijri') loadHijri();
    if (id === 'page-home') updateLastReadUI();
    window.scrollTo(0,0);
}

// Memory: Save Last Read
function saveLastRead(num, name) {
    localStorage.setItem("lastReadNum", num);
    localStorage.setItem("lastReadName", name);
}

function updateLastReadUI() {
    const name = localStorage.getItem("lastReadName");
    if(name) {
        document.getElementById('last-read-name').innerText = name;
        document.getElementById('last-read-container').style.display = "block";
    } else {
        document.getElementById('last-read-container').style.display = "none";
    }
}

function resumeReading() {
    const num = localStorage.getItem("lastReadNum");
    const name = localStorage.getItem("lastReadName");
    if(num) loadSurah(num, name);
}

// Search Logic
function filterSurahs() {
    const query = document.getElementById('surahSearch').value.toLowerCase();
    const filtered = allSurahs.filter(s => 
        s.englishName.toLowerCase().includes(query) || 
        s.number.toString().includes(query)
    );
    renderSurahList(filtered);
}

function renderSurahList(list) {
    document.getElementById('surah-list-container').innerHTML = list.map(s => `
        <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
            <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
        </div>`).join('');
}

// Core Surah Loader
async function loadSurah(num, name) {
    curSurah = num; curName = name;
    saveLastRead(num, name);
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    
    const reciter = document.getElementById('reciter-select').value;
    const lang = document.getElementById('lang-select').value;
    const player = document.getElementById('quran-player');
    
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
        const data = await res.json();
        
        let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
        
        data.data[0].ayahs.forEach((a, i) => {
            let txt = a.text;
            if (num != 1 && num != 9 && i === 0) txt = txt.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
            html += `<div style="padding:20px; border-bottom:1px solid #eee; background:white;">
                <p class="arabic-font">${txt} ﴿${a.numberInSurah}﴾</p>
                <p style="color:#222; font-weight:600; text-align:right; direction:rtl;">${data.data[1].ayahs[i].text}</p>
            </div>`;
        });
        document.getElementById('ayah-content').innerHTML = html;
        player.play();
    } catch(e) { alert("Language error, try again Jani!"); }
}

function changeLanguage() { loadSurah(curSurah, curName); }

// GPS & Adhan
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
            <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
            <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;

        document.getElementById('prayer-settings-list').innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => `
            <div class="prayer-setting-item">
                <div><b>${p}</b><br><small>${t[p]}</small></div>
                <label class="switch"><input type="checkbox" ${adhanSettings[p]?'checked':''} onchange="toggleAdhan('${p}',this.checked)"><span class="slider"></span></label>
            </div>`).join('');

        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
        
        setInterval(() => {
            const now = new Date();
            const cur = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
            ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
                if (adhanSettings[p] && t[p] === cur) document.getElementById('adhan-audio').play();
            });
        }, 50000);
    }, () => { document.getElementById('prayer-times-bar').innerHTML = "Enable GPS"; });
}

function toggleAdhan(p, val) { adhanSettings[p] = val; localStorage.setItem("adhanSettings", JSON.stringify(adhanSettings)); }
let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; if(navigator.vibrate) navigator.vibrate(50); }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function stopAudio() { document.getElementById('quran-player').pause(); }

function loadHijri() {
    const ev = [{title:"Ramadan", date:"18 Feb", img:"https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=200"},{title:"Eid", date:"20 Mar", img:"https://images.unsplash.com/photo-1519810755548-39cd217da494?w=200"}];
    document.getElementById('hijri-list').innerHTML = ev.map(e => `<div class="event-card"><img src="${e.img}" class="event-img"><div><h4>${e.title}</h4><p>${e.date}</p></div></div>`).join('');
}

window.addEventListener('deviceorientation', function(e) {
    var a = e.webkitCompassHeading || Math.abs(e.alpha - 360);
    const n = document.getElementById('qibla-needle');
    if (n) n.style.transform = `rotate(${-a}deg)`;
});

window.onload = () => {
    initGPS();
    updateLastReadUI();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        allSurahs = data.data;
        renderSurahList(allSurahs);
    });
};
