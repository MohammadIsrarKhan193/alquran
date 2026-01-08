// 1. Correct Spelling Variable
const CORRECT_BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

// 2. Tasbeeh Logic
let count = 0;
function countUp() { count++; document.getElementById('counter-box').innerText = count; }
function resetCount() { count = 0; document.getElementById('counter-box').innerText = count; }

// 3. Updated Quran Engine (Fixes Double Bismillah & Spelling)
async function loadSurah(num, name) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<h4>Loading...</h4>";

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();

    // Only show separate Bismillah for Surahs that DON'T have it in Ayah 1
    // And use your correct spelling
    let html = "";
    if (num !== 1 && num !== 9) {
        html = `<p class="arabic-font" style="text-align:center; margin-bottom:20px;">${CORRECT_BISMILLAH}</p>`;
    }

    html += data.data[0].ayahs.map((ayah, i) => {
        let cleanText = ayah.text;
        // This removes the Bismillah from the start of the Ayah text if it exists
        if (num !== 1 && num !== 9 && i === 0) {
            cleanText = cleanText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ", "");
            cleanText = cleanText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
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

// 4. Updated Hijri Logic
navigator.geolocation.getCurrentPosition(async (pos) => {
    const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
    const d = await res.json();
    document.getElementById('hijri-date-display').innerText = d.data.date.hijri.day + " " + d.data.date.hijri.month.ar + " " + d.data.date.hijri.year;
    document.getElementById('gregorian-date').innerText = d.data.date.readable;
    
    // Fill prayer times
    const t = d.data.timings;
    document.getElementById('fajr').innerText = t.Fajr;
    document.getElementById('dzuhr').innerText = t.Dhuhr;
    document.getElementById('asr').innerText = t.Asr;
    document.getElementById('maghrib').innerText = t.Maghrib;
    document.getElementById('isha').innerText = t.Isha;
});
