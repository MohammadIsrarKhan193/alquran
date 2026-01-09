const CORRECT_BISMILLAH = "بِسْمِ ٱللهِ ٱلرَّحْمَٰنِ ٱلرَّحِيْمِ";
let adhanSettings = JSON.parse(localStorage.getItem("adhanSettings")) || { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true };
let currentTimings = null;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'page-hijri') loadHijri();
}

// ⏰ ADHAN ALARM LOGIC
function toggleAdhan(prayer, isChecked) {
    adhanSettings[prayer] = isChecked;
    localStorage.setItem("adhanSettings", JSON.stringify(adhanSettings));
}

function checkAdhanAlarm(timings) {
    setInterval(() => {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
        
        ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach(prayer => {
            if (adhanSettings[prayer] && timings[prayer] === currentTime) {
                const adhan = document.getElementById('adhan-audio');
                if (adhan.paused) {
                    adhan.play().catch(e => console.log("Interaction needed to play Adhan"));
                }
            }
        });
    }, 40000); // Check every 40 seconds
}

async function loadPrayerTimes() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`);
        const data = await res.json();
        currentTimings = data.data.timings;
        
        // Hero Card Update
        document.getElementById('prayer-times-bar').innerHTML = `
            <div>Fajr<br><b>${currentTimings.Fajr}</b></div>
            <div>Sun<br><b>${currentTimings.Sunrise}</b></div>
            <div>Zohr<br><b>${currentTimings.Dhuhr}</b></div>
            <div>Asr<br><b>${currentTimings.Asr}</b></div>
            <div>Magh<br><b>${currentTimings.Maghrib}</b></div>
            <div>Isha<br><b>${currentTimings.Isha}</b></div>`;

        // Settings Page Update (Like Quran Majeed)
        const list = document.getElementById('prayer-settings-list');
        list.innerHTML = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(p => `
            <div class="prayer-setting-item">
                <div><b>${p}</b><br><small>${currentTimings[p]}</small></div>
                <label class="switch">
                    <input type="checkbox" ${adhanSettings[p] ? 'checked' : ''} onchange="toggleAdhan('${p}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `).join('');

        document.getElementById('hijri-today').innerText = `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year}`;
        checkAdhanAlarm(currentTimings);
    });
}

// Keep your existing loadSurah, loadHijri, doCount, etc. below this point...
// [COPY YOUR OLD QURAN/TASBEEH/HIJRI LOGIC HERE]

window.onload = () => {
    loadPrayerTimes();
    setInterval(() => {
        const d = new Date();
        document.getElementById('current-time').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    // Fetch Surah list as before
    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        document.getElementById('surah-list-container').innerHTML = data.data.map(s => `
            <div class="f-item-pro" onclick="loadSurah(${s.number},'${s.englishName}')" style="display:flex; justify-content:space-between; width:90%; margin:10px auto;">
                <span>${s.number}. ${s.englishName}</span><span class="arabic-font" style="font-size:18px; padding:0;">${s.name}</span>
            </div>`).join('');
    });
};
