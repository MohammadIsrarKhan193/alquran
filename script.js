const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
}

// --- BOOKMARKS ---
function addBookmark(sName, sNum, aNum) {
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    const id = `${sNum}-${aNum}`;
    const exists = bookmarks.findIndex(b => b.id === id);
    if (exists > -1) {
        bookmarks.splice(exists, 1);
        alert("Bookmark removed");
    } else {
        bookmarks.push({ id, name: sName, sNum, aNum });
        alert("Ayah Bookmarked!");
    }
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    updateBookmarksUI();
}

function updateBookmarksUI() {
    const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    const container = document.getElementById('bookmarks-container');
    if (!container) return;
    if (bookmarks.length === 0) {
        container.innerHTML = '<p style="color:#999; font-size:13px;">No bookmarks yet.</p>';
        return;
    }
    container.innerHTML = bookmarks.map(b => `
        <div class="pro-item" onclick="loadSurah(${b.sNum}, '${b.name}', ${b.aNum})" style="cursor:pointer; border-left: 5px solid gold;">
            <span>${b.name} (Ayah ${b.aNum})</span>
            <p>Go →</p>
        </div>`).join('');
}

// --- AUDIO ---
function stopAudio() { 
    const p = document.getElementById('quran-player');
    p.pause(); p.src = ""; 
}

function changeReciter() {
    const num = localStorage.getItem('lastSurah');
    const name = localStorage.getItem('lastName');
    if(num) loadSurah(num, name);
}

// --- QURAN ENGINE ---
async function loadSurah(num, name, scrollAyah = null) {
    localStorage.setItem('lastSurah', num);
    localStorage.setItem('lastName', name);
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<p style='text-align:center; padding:20px;'>Loading...</p>";

    // FIXED Reciter ID for Sudais
    const reciter = document.getElementById('reciter-select').value;
    document.getElementById('quran-player').src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();
        let html = (num != 1 && num != 9) ? `<div class="arabic-font" style="text-align:center; color:var(--emerald);">${CORRECT_BISMILLAH}</div>` : "";

        data.data[0].ayahs.forEach((ayah, i) => {
            let text = ayah.text;
            if (num != 1 && num != 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
            html += `
                <div class="ayah-card" id="a-${ayah.numberInSurah}">
                    <div style="display:flex; justify-content:space-between; color:var(--emerald); font-weight:bold;">
                        <span>Ayah ${ayah.numberInSurah}</span>
                        <span onclick="addBookmark('${name}',${num},${ayah.numberInSurah})" style="cursor:pointer;">🔖</span>
                    </div>
                    <p class="arabic-font">${text}</p>
                    <p style="color:#666; font-size:14px;">${data.data[1].ayahs[i].text}</p>
                </div>`;
        });
        container.innerHTML = html;
        if(scrollAyah) {
            setTimeout(() => {
                document.getElementById(`a-${scrollAyah}`).scrollIntoView({behavior:'smooth'});
            }, 500);
        }
    } catch(e) { container.innerHTML = "Internet error."; }
}

// --- TASBEEH ---
let tCount = 0;
function doCount() { tCount++; document.getElementById('t-count').innerText = tCount; }
function resetT() { tCount = 0; document.getElementById('t-count').innerText = tCount; }

// --- INIT ---
window.onload = async () => {
    updateBookmarksUI();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);

    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="pro-item" onclick="loadSurah(${s.number},'${s.englishName}')" style="cursor:pointer;">
            <span>${s.number}. ${s.englishName}</span>
            <p class="arabic-font" style="font-size:20px;">${s.name}</p>
        </div>`).join('');
};
