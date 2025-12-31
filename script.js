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
      btn.onclick = () => loadSurah(surah.id);
      surahList.appendChild(btn);
    });
  })
  .catch(err => console.error("Surah list error:", err));

/* ===============================
   LOAD SURAH AYĀHS
================================ */
function loadSurah(chapterId) {
  ayahsDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapterId}`)
    .then(res => res.json())
    .then(data => {
      surahTitle.innerText = `Surah ${chapterId}`;

      data.verses.forEach(verse => {
        const p = document.createElement("p");
        p.className = "ayah";
        p.innerText = verse.text_uthmani;
        ayahsDiv.appendChild(p);
      });
    })
    .catch(err => {
      surahTitle.innerText = "Failed to load ayahs";
      console.error("Ayah error:", err);
    });
}