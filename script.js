const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

// Tasbeeh Logic
let count = 0;
function countUp() { count++; document.getElementById('counter-box').innerText = count; }
function resetCount() { count = 0; document.getElementById('counter-box').innerText = count; }

// Auto-Save Logic
function saveLastRead(num, name) {
    const progress = { number: num, name: name, date: new Date().toLocaleDateString() };
    localStorage.setItem('lastReadSurah', JSON.stringify(progress));
    updateLastReadUI();
}

function updateLastReadUI() {
    const saved = JSON.parse(localStorage.getItem('lastReadSurah'));
    const container = document.getElementById('last-read-container');
    if (saved && container) {
        container.innerHTML = `
            <div class="ayah-card" onclick="loadSurah(${saved.number}, '${saved.name}')" style="background: #f0fdf4; cursor: pointer;">
                <p style="margin:0; font-size:12px; color:var(--emerald); font-weight:bold;">CONTINUE TILAWAT</p>
                <h3 style="margin:5px 0;">Surah ${saved.name}</h3>
                <small style="color:#666;">Last opened: ${saved.date}</small>
            </div>
        `;
    }
}

async function init() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    }, 1000);

    updateLastReadUI();

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const d = await res.json();
        const t = d.data.timings;
        document.getElementById('fajr').innerText = t.Fajr;
        document.getElementById('dzuhr').innerText = t.Dhuhr;
        document.getElementById('asr').innerText = t.Asr;
        document.getElementById('maghrib').innerText = t.Maghrib;
        document.getElementById('isha').innerText = t.Isha;

        document.getElementById('hijri-date-display').innerText = d.data.date.hijri.day + " " + d.data.date.hijri.month.ar + " " + d.data.date.hijri.year;
        document.getElementById('gregorian-date').innerText = d.data.date.readable;
    });

    const sRes = await fetch('https://api.alquran.cloud/v1/surah');
    const sData = await sRes.json();
    document.getElementById('surah-list').innerHTML = sData.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number}, '${s.englishName}')" style="cursor:pointer;">
            <strong>${s.number}. ${s.englishName}</strong>
            <span style="float:right" class="arabic-font">${s.name}</span>
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    showPage('page-reader');
    saveLastRead(num, name);
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<h4 style='text-align:center;'>Opening Revelations...</h4>";

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();

    let html = "";
    if (num !== 1 && num !== 9) {
        html = `<p class="arabic-font" style="text-align:center; padding-bottom: 20px; color:var(--emerald);">${CORRECT_BISMILLAH}</p>`;
    }

    html += data.data[0].ayahs.map((ayah, i) => {
        let cleanText = ayah.text;
        if (num !== 1 && num !== 9 && i === 0) {
            cleanText = cleanText.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        }
        return `
            <div class="ayah-card">
                <p class="arabic-font">${cleanText} <span style="color:var(--emerald)">(${ayah.numberInSurah})</span></p>
                <p style="color:#666; margin-top:10px; font-size:14px;">${data.data[1].ayahs[i].text}</p>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
}

window.onload = init;
