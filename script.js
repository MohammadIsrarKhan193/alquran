const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

const hijriEvents = [
    { title: "27 Rajab", date: "16 Jan, 2026", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200" },
    { title: "1 Ramadan", date: "18 Feb, 2026", img: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?q=80&w=200" },
    { title: "Eid ul Fitr", date: "20 Mar, 2026", img: "https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=200" },
    { title: "Eid ul Adha", date: "27 May, 2026", img: "https://images.unsplash.com/photo-1563293750-2594662daee1?q=80&w=200" }
];

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-hijri') loadHijri();
    window.scrollTo(0,0);
}

function loadHijri() {
    document.getElementById('hijri-list').innerHTML = hijriEvents.map(e => `
        <div class="event-card">
            <img src="${e.img}" class="event-img">
            <div class="event-info"><h4>${e.title}</h4><p>${e.date}</p></div>
        </div>`).join('');
}

// Qibla logic
window.addEventListener('deviceorientation', function(e) {
    var alpha = e.webkitCompassHeading || Math.abs(e.alpha - 360);
    const needle = document.getElementById('qibla-needle');
    if (needle) needle.style.transform = `rotate(${-alpha}deg)`;
});

async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title-display').innerText = name;
    const reciter = document.getElementById('reciter-select').value;
    const player = document.getElementById('quran-player');
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    player.play();

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";
    data.data[0].ayahs.forEach((a, i) => {
        let text = a.text;
        if (num != 1 && num != 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        html += `<div style="padding:20px; border-bottom:1px solid #eee; background:white;">
            <p class="arabic-font">${text} ﴿${a.numberInSurah}﴾</p>
            <p style="color:#666; font-size:14px;">${data.data[1].ayahs[i].text}</p>
        </div>`;
    });
    document.getElementById('ayah-content').innerHTML = html;
}

function changeReciter() {
    const num = localStorage.getItem('lastSurah');
    const name = localStorage.getItem('lastName');
    if(num) loadSurah(num, name);
}

let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; if(navigator.vibrate) navigator.vibrate(50); }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }
function stopAudio() { document.getElementById('quran-player').pause(); }

window.onload = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        const t = data.data.timings;
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${t.Fajr}</b></div><div>Sun<br><b>${t.Sunrise}</b></div>
            <div>Dhu<br><b>${t.Dhuhr}</b></div><div>Asr<br><b>${t.Asr}</b></div>
            <div>Mag<br><b>${t.Maghrib}</b></div><div>Ish<br><b>${t.Isha}</b></div>`;
        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
    });

    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);

    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        document.getElementById('surah-list-container').innerHTML = data.data.map(s => `
            <div class="f-item-pro" onclick="localStorage.setItem('lastSurah',${s.number});localStorage.setItem('lastName','${s.englishName}');loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
            </div>`).join('');
    });
};
