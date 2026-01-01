const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");
const bismillahDiv = document.getElementById("bismillah");

// 1. LOAD SURAH LIST
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    // Corrected ID reference
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
  bismillahDiv.innerHTML = ""; // Clear previous Bismillah
  surahTitle.innerText = "Loading...";

  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`).then(r => r.json())
  ])
    .then(([data]) => {
      const arabicData = data.data[0];
      const englishData = data.data[1];
      
      surahTitle.innerText = `Surah ${name}`;

      // Show Bismillah if it's not Surah Al-Fatihah (1) or Al-Tawbah (9)
      if (number != 1 && number != 9) {
        bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
      }

      arabicData.ayahs.forEach((ayah, index) => {
        const ayahBox = document.createElement("div");
        ayahBox.className = "ayah-box";

        // Clean up Arabic text (remove Bismillah from first ayah if present)
        let arabicText = ayah.text;
        if (number != 1 && index === 0) {
            arabicText = arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
        }

        const ar = document.createElement("p");
        ar.className = "ayah arabic";
        ar.innerText = arabicText;

        const en = document.createElement("p");
        en.className = "ayah english";
        en.innerText = englishData.ayahs[index].text;

        ayahBox.appendChild(ar);
        ayahBox.appendChild(en);
        ayahsDiv.appendChild(ayahBox);
      });
    })
    .catch(err => {
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
