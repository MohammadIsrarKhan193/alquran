const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let currentSurahNum = 1;

// --- BOOKMARK LOGIC ---
function toggleBookmark(surahName, surahNum, ayahNum) {
    let bookmarks = JSON.parse(localStorage.getItem('quranBookmarks')) || [];
    const bookmarkId = `${surahNum}-${ayahNum}`;
    
    const index = bookmarks.findIndex(b => b.id === bookmarkId);
    if (index > -1) {
        bookmarks.splice(index, 1);
        alert("Bookmark removed");
    } else {
        bookmarks.push({ id: bookmarkId, name: surahName, sNum: surahNum, aNum: ayahNum });
        alert(`Saved Ayah ${ayahNum} of ${surahName}`);
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
        <div class="ayah-card" onclick="loadSurah(${b.sNum}, '${b.name}', ${b.aNum})" style="padding:12px; border-left: 5px solid #FFD700; background:#fffdf0; margin-bottom:10px;">
            <strong>${b.name} - Ayah ${b.aNum}</strong>
        </div>
    `).join('');
}

// --- AUDIO LOGIC ---
function stopAudio() {
    const player = document.getElementById('quran-player');
    player.pause();
    player.src = "";
}

async function changeReciter() {
    const reciter = document.getElementById('reciter-select').value;
    const player = document.getElementById('quran-player');
    // Fetch audio for the entire surah
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${currentSurahNum}/${reciter}`);
    const data = await res.json();
    // We play the first Ayah's audio to start the stream
    player.src = data.data.ayahs[0].audio;
    player.play();
}

// --- UPDATED QURAN ENGINE ---
async function loadSurah(num, name, scrollAyah = null) {
    currentSurahNum = num;
    showPage('page-reader');
    saveLastRead(num, name);
    document.getElementById('surah-title').innerText = name;
    const container = document.getElementById('ayah-container');
    container.innerHTML = "<h4 style='text-align:center;'>Opening Revelations...</h4>";

    // Stop previous audio and load new reciter src
    const player = document.getElementById('quran-player');
    const reciter = document.getElementById('reciter-select').value;
    player.src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;

    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();

    let html = (num !== 1 && num !== 9) ? `<p class="arabic-font" style="text-align:center; padding-bottom: 20px; color:var(--emerald);">${CORRECT_BISMILLAH}</p>` : "";

    html += data.data[0].ayahs.map((ayah, i) => {
        let cleanText = ayah.text;
        if (num !== 1 && num !== 9 && i === 0) {
            cleanText = cleanText.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ )/, "");
        }
        return `
            <div class="ayah-card" id="ayah-${ayah.numberInSurah}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="color:var(--emerald); font-weight:bold;">Ayah ${ayah.numberInSurah}</span>
                    <button onclick="toggleBookmark('${name}', ${num}, ${ayah.numberInSurah})" style="background:none; border:none; font-size:18px; cursor:pointer;">🔖</button>
                </div>
                <p class="arabic-font">${cleanText}</p>
                <p style="color:#666; margin-top:10px; font-size:14px;">${data.data[1].ayahs[i].text}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    updateBookmarksUI();

    // Auto-scroll if it's a bookmark
    if(scrollAyah) {
        setTimeout(() => {
            const el = document.getElementById(`ayah-${scrollAyah}`);
            if(el) el.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
}

// Add updateBookmarksUI() inside your init() function too!
