// Correct Bismillah spelling as requested
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

async function init() {
    // 1. Live Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    }, 1000);

    // 2. Fetch Data (Location & Hijri)
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const d = await res.json();
        
        // Prayer Times
        const t = d.data.timings;
        document.getElementById('fajr').innerText = t.Fajr;
        document.getElementById('dzuhr').innerText = t.Dhuhr;
        document.getElementById('asr').innerText = t.Asr;
        document.getElementById('maghrib').innerText = t.Maghrib;
        document.getElementById('isha').innerText = t.Isha;

        // Hijri Page Date
        document.getElementById('hijri-date-display').innerText = d.data.date.hijri.day + " " + d.data.date.hijri.month.ar + " " + d.data.date.hijri.year;
        document.getElementById('gregorian-date').innerText = d.data.date.readable;
    });

    // 3. Surah List
    const sRes = await fetch('https://api.alquran.cloud/v1/surah');
    const sData = await sRes.json();
    document.getElementById('surah-list').innerHTML = sData.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <strong>${s.number}. ${s.englishName}</strong>
            <span style="float:right" class="arabic-font">${s.name}</span>
        </div>
    `).join('');
}

async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<h4 style='text-align:center;'>Opening...</h4>";

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();

    // Fix: Show Correct Spelling and No Double Bismillah
    let html = "";
    if (num !== 1 && num !== 9) {
        html = `<p class="arabic-font" style="text-align:center; padding-bottom: 15px;">${CORRECT_BISMILLAH}</p>`;
    }

    html += data.data[0].ayahs.map((ayah, i) => {
        let cleanText = ayah.text;
        // Strip Bismillah if it's already in the API text to avoid double showing
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
