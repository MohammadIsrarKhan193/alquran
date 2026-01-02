const surahList = document.getElementById("surah-list");
const ayahsDiv = document.getElementById("ayah-container");
const bismillahDiv = document.getElementById("bismillah");
const searchInput = document.getElementById("surah-search");
const fontSlider = document.getElementById("font-slider");
const splashScreen = document.getElementById("splash-screen");

let allSurahs = [];
let currentSurah = null;

// --- INITIALIZE APP ---
async function init() {
    loadPrayerTimes();
    try {
        const res = await fetch("https://api.alquran.cloud/v1/surah");
        const data = await res.json();
        allSurahs = data.data;
        displaySurahs(allSurahs);
        
        // Hide splash screen after 2.5 seconds
        setTimeout(() => {
            splashScreen.style.opacity = "0";
            setTimeout(() => splashScreen.style.display = "none", 500);
        }, 2500);
    } catch (e) {
        document.getElementById("loading").innerText = "Failed to load. 🔄";
    }
}

function displaySurahs(list) {
    surahList.innerHTML = "";
    list.forEach(s => {
        const btn = document.createElement("div");
        btn.className = "surah-card";
        btn.innerHTML = `<span>${s.number}. ${s.englishName}</span> <small>${s.name}</small>`;
        btn.onclick = () => {
            currentSurah = s;
            loadSurah(s.number, s.englishName);
            if(window.innerWidth < 768) sidebar.classList.add("hidden");
        };
        surahList.appendChild(btn);
    });
}

// --- SEARCH LOGIC ---
searchInput.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSurahs.filter(s => s.englishName.toLowerCase().includes(term));
    displaySurahs(filtered);
};

// --- SETTINGS CONTROLS ---
document.getElementById("settings-btn").onclick = () => document.getElementById("settings-panel").classList.toggle("hidden");
document.getElementById("menu-btn").onclick = () => document.getElementById("sidebar").classList.toggle("hidden");
document.getElementById("theme-toggle").onclick = () => document.body.classList.toggle("dark-theme");

fontSlider.oninput = (e) => {
    document.querySelectorAll(".arabic-text").forEach(t => t.style.fontSize = e.target.value + "px");
};

// --- LOAD SURAH AYĀHS ---
async function loadSurah(num, name) {
    ayahsDiv.innerHTML = "<p class='center'>Loading Ayahs...</p>";
    bismillahDiv.innerHTML = "";
    document.getElementById("surah-title").innerText = name;

    const lang = document.getElementById("lang-select").value;
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
    const data = await res.json();

    ayahsDiv.innerHTML = "";
    if (num != 1 && num != 9) bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

    data.data[0].ayahs.forEach((ayah, i) => {
        const card = document.createElement("div");
        card.className = "ayah-card";
        
        let arText = ayah.text;
        if(num != 1 && i === 0) arText = arText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");

        card.innerHTML = `
            <div class="ar-line">
                <span class="arabic-text" style="font-size: ${fontSlider.value}px">${arText}</span>
                <span class="ay-num">${ayah.numberInSurah}</span>
                ${ayah.ruku ? '<span class="ruku">ع</span>' : ''}
            </div>
            <div class="tr-line">${data.data[1].ayahs[i].text}</div>
        `;
        ayahsDiv.appendChild(card);
    });
    document.getElementById("reader").scrollTop = 0;
}

function loadPrayerTimes() {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(loc => {
        fetch(`https://api.aladhan.com/v1/timingsByCity?city=${loc.city}&country=${loc.country_name}&method=2`)
        .then(r => r.json()).then(d => {
            const t = d.data.timings;
            document.getElementById("times-list").innerHTML = `
                <p>Fajr: ${t.Fajr} | Dhuhr: ${t.Dhuhr} | Maghrib: ${t.Maghrib}</p>
            `;
        });
    });
}

init();
