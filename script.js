const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

// 1. Navigation
function showPage(id) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

// 2. Tasbeeh
let count = 0;
function doCount() { count++; document.getElementById('t-count').innerText = count; }
function resetT() { count = 0; document.getElementById('t-count').innerText = count; }

// 3. Audio
function stopAudio() { 
    const p = document.getElementById('quran-player');
    p.pause(); p.src = ""; 
}

// 4. Quran Engine
async function loadSurah(num, name, scrollAyah = null) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<p style='padding:20px; text-align:center;'>Loading Ayahs...</p>";

    const reciter = document.getElementById('reciter-select').value;
    document.getElementById('quran-player').src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        
        let html = (num !== 1 && num !== 9) ? `<div style="text-align:center; padding:20px;" class="arabic-font">${CORRECT_BISMILLAH}</div>` : "";
        
        data.data[0].ayahs.forEach((ayah, i) => {
            let text = ayah.text;
            if (num !== 1 && num !== 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
            
            html += `
                <div class="ayah-card" id="a-${ayah.numberInSurah}">
                    <div style="display:flex; justify-content:space-between; color:var(--emerald); font-weight:bold;">
                        <span>Ayah ${ayah.numberInSurah}</span>
                        <span onclick="addBookmark('${name}',${num},${ayah.numberInSurah})" style="cursor:pointer;">🔖</span>
                    </div>
                    <p class="arabic-font">${text}</p>
                    <p style="color:#666; font-size:14px; margin-top:10px;">${data.data[1].ayahs[i].text}</p>
                </div>`;
        });
        container.innerHTML = html;
        if(scrollAyah) document.getElementById(`a-${scrollAyah}`).scrollIntoView();
    } catch(e) { container.innerHTML = "Internet error. Try again."; }
}

// 5. Init (Runs on startup)
window.onload = async () => {
    // Clock
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);

    // Surahs
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        const list = document.getElementById('surah-list');
        list.innerHTML = data.data.map(s => `
            <div class="ayah-card" onclick="loadSurah(${s.number},'${s.englishName}')" style="cursor:pointer;">
                <strong>${s.number}. ${s.englishName}</strong>
                <span style="float:right;" class="arabic-font">${s.name}</span>
            </div>`).join('');
    } catch(e) { console.log("List failed"); }
};
