const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");
const bismillahDiv = document.getElementById("bismillah");
const langSelect = document.getElementById("lang-select");

let currentSurahNumber = null;
let currentSurahName = "";

// 1. LOAD SURAH LIST
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    document.getElementById("loading").style.display = "none";
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
  });

// Reload when language changes
langSelect.onchange = () => {
    if(currentSurahNumber) loadSurah();
};

// 2. LOAD SURAH AYĀHS
function loadSurah() {
  const number = currentSurahNumber;
  const name = currentSurahName;
  const lang = langSelect.value;
  
  ayahsDiv.innerHTML = "";
  bismillahDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,${lang}`)
    .then(r => r.json())
    .then(data => {
      const arabicData = data.data[0];
      const transData = data.data[1];
      
      surahTitle.innerText = `Surah ${name}`;

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

        // Translation logic - uses Arabic RTL for Urdu/Pashto/Persian
        const isRtlLang = lang.startsWith('ur') || lang.startsWith('ps') || lang.startsWith('fa');
        const transClass = isRtlLang ? "translation rtl-text" : "translation ltr-text";

        ayahRow.innerHTML = `
          <div class="arabic-side">
            <span class="arabic-text">${arabicText}</span>
            <span class="inline-ayah-number">${ayah.numberInSurah}</span>
            ${ayah.ruku ? `<span class="ruku-marker">ع</span>` : ""}
            ${ayah.sajdah ? `<span class="sajdah-marker">۩</span>` : ""}
          </div>
          <div class="${transClass}">${transData.ayahs[index].text}</div>
        `;

        ayahsDiv.appendChild(ayahRow);
      });

      document.getElementById("content").scrollTop = 0;
    })
    .catch(err => {
      console.error(err);
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
