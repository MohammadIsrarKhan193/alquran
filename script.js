const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };

// 1. NAVIGATION (Fixed)
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-hijri') loadHijri();
    window.scrollTo(0,0);
}

// 2. ADHAN LOGIC
function toggleAdhan(p, isChecked) {
    adhanSettings[p] = isChecked;
    localStorage.setItem("adhanSettings", JSON.stringify(adhanSettings));
}

function checkAlarms(timings) {
    setInterval(() => {
        const now = new Date();
        const cur = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(p => {
            if (adhanSettings[p] && timings[p] === cur) {
                const audio = document.getElementById('adhan-audio');
                if (audio.paused) audio.play();
            }
        });
    }, 45000);
}

// 3. PRAYER TIMES & GPS
async function initGPS() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        
        // Update Hero Card
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
            <div>Zohr<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
            <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;

        // Update Settings Page
        document.getElementById('prayer-settings-list').innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => `
            <div class="prayer-setting-item">
                <div><b>${p}</b><br><small>${t[p]}</small></div>
                <label class="switch"><input type="checkbox" ${adhanSettings[p]?'checked':''} onchange="toggleAdhan('${p}',this.checked)"><span class="slider"></span></label>
            </div>`).join('');

        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
        checkAlarms(t);
    });
}

// 4. QURAN READER
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const reciter = document.getElementById('reciter-select').value;
    document.getElementById('quran-player').src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    document.getElementById('quran-player').play();

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        let txt = a.text;
        if (num != 1 && num != 9 && i === 0) txt = txt.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        html += `<div style="padding:20px; border-bottom:1px solid #eee; background:white;">
            <p class="arabic-font">${txt} ﴿${a.numberInSurah}﴾</p>
            <p style="color:#666; font-size:14px;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
}

// 5. TASBEEH, HIJRI, QIBLA
let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; if(navigator.vibrate) navigator.vibrate(50); }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function stopAudio() { document.getElementById('quran-player').pause(); }

function loadHijri() {
    const events = [
        { title: "27 Rajab", date: "16 Jan, 2026", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200" },
        { title: "1 Ramadan", date: "18 Feb, 2026", img: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?q=80&w=200" }
    ];
    document.getElementById('hijri-list').innerHTML = events.map(e => `
        <div class="event-card"><img src="${e.img}" class="event-img"><div><h4>${e.title}</h4><p>${e.date}</p></div></div>`).join('');
}

window.addEventListener('deviceorientation', function(e) {
    var alpha = e.webkitCompassHeading || Math.abs(e.alpha - 360);
    const needle = document.getElementById('qibla-needle');
    if (needle) needle.style.transform = `rotate(${-alpha}deg)`;
});

// INITIALIZE
window.onload = () => {
    initGPS();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        document.getElementById('surah-list-container').innerHTML = data.data.map(s => `
            <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
            </div>`).join('');
    });
};
