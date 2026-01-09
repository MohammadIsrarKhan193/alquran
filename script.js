const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";

// --- CORE NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

// --- TASBEEH ---
let count = 0;
function countUp() { 
    count++; 
    document.getElementById('counter-box').innerText = count; 
}

// --- BOOKMARKS ---
function toggleBookmark(sName, sNum, aNum) {
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    const id = `${sNum}-${aNum}`;
    const exists = bookmarks.findIndex(b => b.id === id);
    
    if (exists > -1) {
        bookmarks.splice(exists, 1);
    } else {
        bookmarks.push({ id, name: sName, sNum, aNum });
    }
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    updateBookmarksUI();
}

function updateBookmarksUI() {
    const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    const container = document.getElementById('bookmarks-container');
    if (bookmarks.length === 0) {
        container.innerHTML = '<p style="color:#999; font-size:13px;">No bookmarks yet.</p>';
        return;
    }
    container.innerHTML = bookmarks.map(b => `
        <div class="ayah-card" onclick="loadSurah(${b.sNum}, '${b.name}', ${b.aNum})" style="background:#fffdf0; border-left:5px solid gold;">
            <strong>${b.name} - Ayah ${b.aNum}</strong>
        </div>
    `).join('');
}

// --- AUDIO ---
function stopAudio() {
    const player = document.getElementById('quran-player');
    player.pause();
    player.src = "";
}

async function changeReciter() {
    // Basic logic to reload audio with new reciter
    alert("Reciter updated. Tap Surah to play.");
}

// --- QURAN ENGINE ---
async function loadSurah(num, name, scrollAyah = null) {
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<p style='text-align:center;'>Loading...</p>";

    // Audio setup
    const player = document.getElementById('quran-player');
    const reciter = document.getElementById('reciter-select').value;
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;

    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
        const data = await res.json();

        let html = (num !== 1 && num !== 9) ? `<p class="arabic-font" style="text-align:center;">${CORRECT_BISMILLAH}</p>` : "";

        html += data.data[0].ayahs.map((ayah, i) => {
            let text = ayah.text;
            if (num !== 1 && num !== 9 && i === 0) text = text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
            
            return `
                <div class="ayah-card" id="ayah-${ayah.numberInSurah}">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--emerald)">${ayah.numberInSurah}</span>
                        <button onclick="toggleBookmark('${name}', ${num}, ${ayah.numberInSurah})">🔖</button>
                    </div>
                    <p class="arabic-font">${text}</p>
                    <p style="color:#666; font-size:14px;">${data.data[1].ayahs[i].text}</p>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        if(scrollAyah) {
            setTimeout(() => {
                document.getElementById(`ayah-${scrollAyah}`).scrollIntoView({behavior: 'smooth'});
            }, 500);
        }
    } catch (e) { container.innerHTML = "Error loading Surah."; }
}

// --- INIT ---
window.onload = async () => {
    updateBookmarksUI();
    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false});
    }, 1000);

    const sRes = await fetch('https://api.alquran.cloud/v1/surah');
    const sData = await sRes.json();
    document.getElementById('surah-list').innerHTML = sData.data.map(s => `
        <div class="ayah-card" onclick="loadSurah(${s.number}, '${s.englishName}')">
            <strong>${s.number}. ${s.englishName}</strong>
            <span style="float:right" class="arabic-font">${s.name}</span>
        </div>
    `).join('');
};
