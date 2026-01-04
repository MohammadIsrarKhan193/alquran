// 1. Global Prayer Times (Worldwide)
async function getGlobalData() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const data = await res.json();
        
        // Update Dashboard with local city and timings
        document.getElementById('hijri-date').innerText = data.data.date.hijri.date;
        document.getElementById('next-prayer').innerText = `Next: ${data.data.timings.Fajr} (Fajr)`;
    }, () => {
        document.getElementById('next-prayer').innerText = "Kabul, AF (Default)";
    });
}

// 2. Load Surah with Markers and Audio
async function loadSurah(num, name) {
    const lang = document.getElementById('lang-select').value;
    const reciter = document.getElementById('reciter-select').value;
    
    // Fetch Arabic, Translation, and Audio
    const [quranRes, audioRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`),
        fetch(`https://api.alquran.cloud/v1/surah/${num}/${reciter}`)
    ]);
    
    const qData = await quranRes.json();
    const aData = await audioRes.json();

    const ayahs = qData.data[0].ayahs;
    const trans = qData.data[1].ayahs;

    document.getElementById('ayah-container').innerHTML = ayahs.map((ayah, i) => `
        <div class="ayah-card">
            <div class="ayah-header">
                <span class="ayah-num">${ayah.numberInSurah}</span>
                ${ayah.sajdah ? '<span class="marker">۩ Sajdah</span>' : ''}
                ${ayah.ruku ? '<span class="marker">Ruku</span>' : ''}
                <button onclick="playAyah('${aData.data.ayahs[i].audio}')">▶ Play</button>
            </div>
            <p class="arabic-text-pro">${ayah.text}</p>
            <p class="translation-text">${trans[i].text}</p>
        </div>
    `).join('');
}

function playAyah(url) {
    const player = document.getElementById('main-audio');
    player.src = url;
    player.play();
}
