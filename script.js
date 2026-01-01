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
  })
  .catch(err => {
    console.error("Error:", err);
    document.getElementById("loading").innerText = "Failed to load ❌";
  });

// 2. LOAD SURAH AYĀHS
function loadSurah(number, name) {
  ayahsDiv.innerHTML = "";
  bismillahDiv.innerHTML = ""; 
  surahTitle.innerText = "Loading...";

  // Fetching Arabic (Uthmani) and English (Sahih) together
  fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`)
    .then(r => r.json())
    .then(data => {
      const arabicData = data.data[0];
      const englishData = data.data[1];
      
      surahTitle.innerText = `Surah ${name}`;

      // Show Bismillah except for Fatiha (1) and Tawbah (9)
      if (number != 1 && number != 9) {
        bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
      }

      arabicData.ayahs.forEach((ayah, index) => {
        const ayahBox = document.createElement("div");
        ayahBox.className = "ayah-box";

        // Logic for Sajdah and Ruku Indicators
        let markers = "";
        if (ayah.sajdah) markers += `<span class="marker sajdah-tag">۩ SAJDAH</span>`;
        if (ayah.ruku) markers += `<span class="marker ruku-tag">RUKŪ ${ayah.ruku}</span>`;

        // Remove Bismillah from text if it's already at the top
        let arabicText = ayah.text;
        if (number != 1 && index === 0) {
            arabicText = arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
        }

        ayahBox.innerHTML = `
          <div class="ayah-header">
            <span class="ayah-number">${ayah.numberInSurah}</span>
            <div class="markers-container">${markers}</div>
          </div>
          <p class="ayah arabic">${arabicText}</p>
          <p class="ayah english">${englishData.ayahs[index].text}</p>
        `;

        ayahsDiv.appendChild(ayahBox);
      });
      // Scroll to top of content when new surah loads
      document.getElementById("content").scrollTop = 0;
    })
    .catch(err => {
      console.error(err);
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
