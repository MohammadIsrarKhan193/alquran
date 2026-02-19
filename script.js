const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let allSurahs = [], curSurah = 1, curName = "Al-Fatihah";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };

window.onload = async () => {
    if(localStorage.getItem('dark-mode') === 'true') document.body.classList.add('dark-mode');
    initGPS();
    loadDailyVerse();
    load99Names();
    loadDuas();
    updateLastReadUI();
    
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    allSurahs = data.data;
    renderSurahList(allSurahs);

    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
};

// --- Adhan Alarm Logic ---
function toggleAdhan(p, val) { 
    adhanSettings[p] = val; 
    localStorage.setItem("adhanSettings", JSON.stringify(adhanSettings)); 
}

function checkAdhan(timings) {
    setInterval(() => {
        const now = new Date();
        const cur = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
            if (adhanSettings[p] && timings[p] === cur) {
                const audio = document.getElementById('adhan-audio');
                if(audio.paused) audio.play();
            }
        });
    }, 50000);
}

// --- GPS & Events ---
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
            const data = await res.json();
            const t = data.data.timings;
            const h = data.data.date.hijri;
            
            document.getElementById('hijri-today').innerText = `${h.day} ${h.month.en} ${h.year}`;
            document.getElementById('prayer-times-bar').innerHTML = `
                <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
                <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
                <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
            
            // Render Switches
            document.getElementById('prayer-settings-list').innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => `
                <div class="prayer-setting-item">
                    <div><b>${p}</b><br><small>${t[p]}</small></div>
                    <label class="switch"><input type="checkbox" ${adhanSettings[p]?'checked':''} onchange="toggleAdhan('${p}',this.checked)"><span class="slider"></span></label>
                </div>`).join('');

            checkAdhan(t);
            updateIslamicEvents(h.day, h.month.number, h.year);
        } catch(e) { console.log("Prayer error"); }
    });
}

// --- Quran Reader with 7 Languages ---
async function loadSurah(num, name) {
    curSurah = num; curName = name;
    localStorage.setItem("lastReadNum", num); localStorage.setItem("lastReadName", name);
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    
    const lang = document.getElementById('lang-select').value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();
    
    let html = (num != 1 && num != 9) ? `<div style="text-align:center; color:var(--emerald); font-family:'Amiri'; font-size:24px; padding:10px;">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div style="padding:15px; border-bottom:1px solid #eee; background:var(--card);">
            <p style="font-family:'Amiri'; font-size:26px; text-align:right; direction:rtl; line-height:1.8;">${a.text}</p>
            <p style="color:var(--text); font-size:15px; margin-top:10px; direction:rtl; text-align:right;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
}

function changeLanguage() { loadSurah(curSurah, curName); }
function stopAudio() { document.getElementById('quran-player').pause(); }

// --- Your Other Core Logic (Preserved) ---
async function updateIslamicEvents(day, month, year) {
    const events = [{name:"Ramadan",m:9,d:1,id:"ramadan-countdown"},{name:"Eid al-Fitr",m:10,d:1,id:"eid-fitr-countdown"},{name:"Eid al-Adha",m:12,d:10,id:"eid-adha-countdown"}];
    events.forEach(ev => {
        let currentTotal = (month*30)+parseInt(day);
        let eventTotal = (ev.m*30)+ev.d;
        let diff = eventTotal >= currentTotal ? eventTotal - currentTotal : (354 - currentTotal) + eventTotal;
        document.getElementById(ev.id).innerText = diff === 0 ? `${ev.name}: Today!` : `${ev.name}: In ${diff} days`;
    });
}

async function load99Names() {
    const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
    const data = await res.json();
    document.getElementById('names-container').innerHTML = data.data.map(n => `<div class="f-item-pro"><b>${n.name}</b><br><small>${n.en.meaning}</small></div>`).join('');
}

async function loadDailyVerse() {
    const randomAyah = Math.floor(Math.random() * 6000) + 1;
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    document.getElementById('daily-ar').innerText = data.data[0].text;
    document.getElementById('daily-en').innerText = data.data[1].text;
}

function calculateZakat() {
    const amount = document.getElementById('zakat-amount').value;
    document.getElementById('zakat-result').innerText = amount >= 100000 ? "Zakat: " + (amount * 0.025) : "Below Nisab";
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function renderSurahList(list) {
    document.getElementById('surah-list-container').innerHTML = list.map(s => `
        <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; margin:10px;">
            <span>${s.number}. ${s.englishName}</span><span>${s.name}</span>
        </div>`).join('');
}

let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode')); }
function updateLastReadUI() { const name = localStorage.getItem("lastReadName"); if(name) { document.getElementById('last-read-name').innerText = name; document.getElementById('last-read-container').style.display = "block"; } }
function resumeReading() { const num = localStorage.getItem("lastReadNum"); const name = localStorage.getItem("lastReadName"); if(num) loadSurah(num, name); }
function loadDuas() { document.getElementById('duas-container').innerHTML = `<div class="f-item-pro"><p>رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً</p></div>`; }
