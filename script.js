console.log("Qur'an script loaded");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");

// Load Surah list
fetch("https://api.quran.com/api/v4/chapters")
  .then(res => res.json())
  .then(data => {
    data.chapters.forEach(surah => {
      const btn = document.createElement("button");
      btn.className = "surah-btn";
      btn.innerText = `${surah.id}. ${surah.name_simple}`;
      btn.onclick = () => loadSurah(surah.id, surah.name_simple);
      surahList.appendChild(btn);
    });
  })
  .catch(() => {
    surahList.innerHTML = "<p>Failed to load surahs</p>";
  });

// Load Surah Ayahs (Arabic + English)
function loadSurah(chapterId, surahName) {
  ayahsDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapterId}`),
    fetch(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${chapterId}`)
  ])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([arabicData, englishData]) => {

    surahTitle.innerText = `Surah ${surahName}`;

    arabicData.verses.forEach((verse, i) => {
      const block = document.createElement("div");
      block.className = "ayah-block";

      const ar = document.createElement("p");
      ar.className = "ayah-ar";
      ar.innerText = verse.text_uthmani;

      const en = document.createElement("p");
      en.className = "ayah-en";
      en.innerText = englishData.translations[i].text;

      block.appendChild(ar);
      block.appendChild(en);
      ayahsDiv.appendChild(block);
    });

  })
  .catch(() => {
    surahTitle.innerText = "Failed to load ayahs";
  });
}
