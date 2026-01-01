console.log("Qur'an script loaded");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");

/* ===============================
   LOAD SURAH LIST
================================ */
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
  .catch(err => console.error("Surah list error:", err));

/* ===============================
   LOAD SURAH AYĀHS (AR + EN)
================================ */
function loadSurah(chapterId, surahName) {
  ayahsDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  // Arabic
  fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapterId}`)
    .then(res => res.json())
    .then(arabicData => {

      // English
      fetch(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${chapterId}`)
        .then(res => res.json())
        .then(englishData => {

          surahTitle.innerText = `Surah ${surahName}`;

          arabicData.verses.forEach((verse, index) => {
            const block = document.createElement("div");
            block.className = "ayah-block";

            const ar = document.createElement("p");
            ar.className = "ayah-ar";
            ar.innerText = verse.text_uthmani;

            const en = document.createElement("p");
            en.className = "ayah-en";
            en.innerText =
              englishData.translations[index]?.text.replace(/<[^>]*>/g, "") 
              || "";

            block.appendChild(ar);
            block.appendChild(en);
            ayahsDiv.appendChild(block);
          });

        });
    })
    .catch(err => {
      surahTitle.innerText = "Failed to load ayahs";
      console.error("Ayah error:", err);
    });
}
