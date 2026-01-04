async function init() {
    console.log("App starting...");
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        
        const list = document.getElementById('surah-list');
        list.innerHTML = data.data.map(s => `
            <div class="surah-item" onclick="loadSurah(${s.number}, '${s.englishName}')">
                ${s.number}. ${s.englishName}
            </div>
        `).join('');

        // THIS IS THE FIX: Only hide splash after data is 100% loaded
        const splash = document.getElementById('splash-screen');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 500);
        }
    } catch (e) {
        console.error("API Error:", e);
        alert("Please check your internet and refresh!");
    }
}

// Force load even if Service Worker is busy
window.addEventListener('load', init);
