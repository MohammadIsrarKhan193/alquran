const surahList = document.getElementById("surah-list");
const ayahsDiv = document.getElementById("ayah-container");
const bismillahDiv = document.getElementById("bismillah");
const searchInput = document.getElementById("surah-search");
const splashScreen = document.getElementById("splash-screen");

let allSurahs = [];

async function init() {
    loadPrayerTimes();
    try {
        const res = await fetch("https://api.alquran.cloud/v1/surah");
        const data = await res.json();
        allSurahs = data.data; 
        displaySurahs(allSurahs);
        
        setTimeout(() => {
            splashScreen.style.opacity = "0";
            setTimeout(() => splashScreen.style.display = "none", 500);
        }, 2000);
    } catch (e) {
        document.getElementById("surah-list").innerHTML = "<p>Network Error. Check VPN.</p>";
    }
}

function displaySurahs(list) {
    surahList.innerHTML = "";
    list.forEach(s => {
        const btn = document.createElement("div");
        btn.className = "surah-card";
        btn.innerHTML = `<div><b>${s.number}. ${s.englishName}</b><br><small>${s.name}</small></div>`;
        btn.onclick = () => loadSurah(s.number, s.englishName);
        surahList.appendChild(btn);
    });
}

searchInput.oninput = (e) => {
    const term = e.target.value.trim().toLowerCase();
    const filtered = allSurahs.filter(s => s.englishName.toLowerCase().includes(term) || s.number.toString() === term);
    displaySurahs(filtered);
};

async function loadSurah(num, name) {
    ayahsDiv.innerHTML = "<div class='loader-small'></div>";
    bismillahDiv.innerText = "";
    document.getElementById("surah-title").innerText = `Surah ${name}`;
    if(window.innerWidth < 768) document.getElementById("sidebar").classList.add("hidden");

    const lang = document.getElementById("lang-select").value;
    try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,${lang}`);
        const data = await res.json();
        ayahsDiv.innerHTML = "";
        if (num != 1 && num != 9) bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

        data.data[0].ayahs.forEach((ayah, i) => {
            const card = document.createElement("div");
            card.className = "ayah-card";
            const arText = (num != 1 && i === 0) ? ayah.text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "") : ayah.text;
            card.innerHTML = `<div class="ar-line"><span class="arabic-text">${arText}</span><span class="ay-num">${ayah.numberInSurah}</span></div><div class="tr-line">${data.data[1].ayahs[i].text}</div>`;
            ayahsDiv.appendChild(card);
        });
    } catch (e) { ayahsDiv.innerHTML = "Error loading. Check connection."; }
}

function loadPrayerTimes() {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(loc => {
        fetch(`https://api.aladhan.com/v1/timingsByCity?city=${loc.city}&country=${loc.country_name}&method=2`)
        .then(r => r.json()).then(d => {
            const t = d.data.timings;
            document.getElementById("times-list").innerHTML = `
                <div class="prayer-row"><span>Fajr</span> <b>${t.Fajr}</b></div>
                <div class="prayer-row"><span>Sunrise (Ishraq)</span> <b>${t.Sunrise}</b></div>
                <div class="prayer-row"><span>Dhuhr</span> <b>${t.Dhuhr}</b></div>
                <div class="prayer-row"><span>Asr</span> <b>${t.Asr}</b></div>
                <div class="prayer-row"><span>Maghrib</span> <b>${t.Maghrib}</b></div>
                <div class="prayer-row"><span>Isha</span> <b>${t.Isha}</b></div>
            `;
        });
    });
}

document.getElementById("settings-btn").onclick = () => document.getElementById("settings-panel").classList.toggle("hidden");
document.getElementById("menu-btn").onclick = () => document.getElementById("sidebar").classList.toggle("hidden");
document.getElementById("theme-toggle").onclick = () => document.body.classList.toggle("dark-theme");
document.getElementById("font-slider").oninput = (e) => {
    document.querySelectorAll(".arabic-text").forEach(t => t.style.fontSize = e.target.value + "px");
};
init();
