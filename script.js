const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");
const bismillahDiv = document.getElementById("bismillah");
const langSelect = document.getElementById("lang-select");
const timesList = document.getElementById("times-list");

let currentSurahNumber = null;
let currentSurahName = "";

// --- PRAYER TIMES LOGIC ---
function loadPrayerTimes() {
    // We use a free IP API to guess the city and country for Adhan times
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(location => {
            const { city, country_name } = location;
            return fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country_name}&method=2`);
        })
        .then(res => res.json())
        .then(data => {
            const t = data.data.timings;
            timesList.innerHTML = `
                <div class="prayer-row"><span>Fajr</span> <b>${t.Fajr}</b></div>
                <div class="prayer-row"><span>Dhuhr</span> <b>${t.Dhuhr}</b></div>
                <div class="prayer-row"><span>Asr</span> <b>${t.Asr}</b></div>
                <div class="prayer-row"><span>Maghrib</span> <b>${t.Maghrib}</b></div>
                <div class="prayer-row"><span>Isha</span> <b>${t.Isha}</b></div>
            `;
        })
        .catch(() => {
            timesList.innerHTML = "Enable location for times.";
        });
}

// --- 24/7 ROBUST SURAH LIST LOAD ---
function initApp() {
    const loadingElement = document.getElementById("loading");
    
    fetch("https://api.alquran.cloud/v1/surah")
      .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
      })
      .then(data => {
        loadingElement.style.display = "none";
        surahList.innerHTML += ""; // Keep current content
        
        data.data.forEach(surah => {
          const btn = document.createElement("button");
          btn.className = "surah-btn";
          btn.innerText = `${surah.number}. ${surah.englishName}`;
          btn.onclick = () => {
            currentSurahNumber = surah.number;
            currentSurahName = surah.englishName;
            loadSurah();
          };
          surahList.appendChild(btn);
        });
      })
      .catch(err => {
        loadingElement.innerHTML = `<button onclick="location.reload()" class="surah-btn">Retry Loading 🔄</button>`;
      });
}

// --- SURAH LOADING ---
function loadSurah() {
  const number = currentSurahNumber;
  const name = currentSurahName;
  const lang = langSelect.value;
  
  ayahsDiv.innerHTML = "Loading Ayahs...";
  bismillahDiv.innerHTML = "";
  surahTitle.innerText = `Surah ${name}`;

  fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,${lang}`)
    .then(r => r.json())
    .then(data => {
      ayahsDiv.innerHTML = "";
      const arabicData = data.data[0];
      const transData = data.data[1];
      
      if (number != 1 && number != 9) {
        bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
      }

      arabicData.ayahs.forEach((ayah, index) => {
        const ayahRow = document.createElement("div");
        ayahRow.className = "ayah-row";

        let arabicText = ayah.text;
        if (number != 1 && index === 0) {
            arabicText = arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
        }

        const isRtlLang = lang.startsWith('ur') || lang.startsWith('ps') || lang.startsWith('fa');
        const transClass = isRtlLang ? "translation rtl-text" : "translation ltr-text";

        ayahRow.innerHTML = `
          <div class="arabic-side">
            <span class="arabic-text">${arabicText}</span>
            <span class="inline-ayah-number">${ayah.numberInSurah}</span>
            ${ayah.ruku ? `<span class="ruku-marker">ع</span>` : ""}
          </div>
          <div class="${transClass}">${transData.ayahs[index].text}</div>
        `;
        ayahsDiv.appendChild(ayahRow);
      });
      document.getElementById("content").scrollTop = 0;
    })
    .catch(() => {
        surahTitle.innerText = "Error loading. Try again.";
    });
}

langSelect.onchange = () => { if(currentSurahNumber) loadSurah(); };

// Initial Launch
loadPrayerTimes();
initApp();
