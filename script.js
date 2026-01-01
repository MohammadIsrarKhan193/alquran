const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");
const bismillahDiv = document.getElementById("bismillah");

// 1. LOAD SURAH LIST
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    document.getElementById("loading").style.display = "none";
    data.data.forEach(surah => {
      const btn = document.createElement("button");
      btn.className = "surah-btn";
      btn.innerText = `${surah.number}. ${surah.englishName}`;
      btn.onclick = () => loadSurah(surah.number, surah.englishName);
      surahList.appendChild(btn);
    });
  });

// 2. LOAD SURAH AYĀHS
function loadSurah(number, name) {
  ayahsDiv.innerHTML = "";
  bismillahDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`)
    .then(r => r.json())
    .then(data => {
      const arabicData = data.data[0];
      const englishData = data.data[1];
      
      surahTitle.innerText = `Surah ${name}`;

      if (number != 1 && number != 9) {
        bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
      }

      // Create a container for the Flowing Arabic Text (like the screenshot)
      const arabicFlow = document.createElement("div");
      arabicFlow.className = "arabic-container";

      // Create a container for English Translation (list style)
      const englishFlow = document.createElement("div");
      englishFlow.className = "english-container";

      arabicData.ayahs.forEach((ayah, index) => {
        let arabicText = ayah.text;
        if (number != 1 && index === 0) {
            arabicText = arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
        }

        // Add Arabic Text + Inline Ayah Number
        // We use a span for the number to style it like a circle
        arabicFlow.innerHTML += `
          <span class="arabic-text">${arabicText}</span>
          <span class="inline-ayah-number">${ayah.numberInSurah}</span>
          ${ayah.ruku ? `<span class="ruku-marker">ع</span>` : ""}
          ${ayah.sajdah ? `<span class="sajdah-marker">۩</span>` : ""}
        `;

        // Add English Translation in a separate list below
        englishFlow.innerHTML += `
          <div class="en-box">
            <small>${ayah.numberInSurah}.</small> ${englishData.ayahs[index].text}
          </div>
        `;
      });

      ayahsDiv.appendChild(arabicFlow);
      ayahsDiv.appendChild(document.createElement("hr")); // Separator
      ayahsDiv.appendChild(englishFlow);

      document.getElementById("content").scrollTop = 0;
    })
    .catch(err => {
      console.error(err);
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
