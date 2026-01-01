console.log("Qur'an script loaded");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");

/* ===============================
   LOAD SURAH LIST
================================ */
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
    console.error("Surah list error:", err);
    document.getElementById("loading").innerText = "Failed to load surahs ❌";
  });

/* ===============================
   LOAD SURAH AYĀHS
================================ */
function loadSurah(number, name) {
  ayahsDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`).then(r => r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/en.sahih`).then(r => r.json())
  ])
    .then(([arabic, english]) => {
      surahTitle.innerText = `Surah ${name}`;

      arabic.data.ayahs.forEach((ayah, index) => {
        const ayahBox = document.createElement("div");
        ayahBox.className = "ayah-box";

        // Arabic
        const ar = document.createElement("p");
        ar.className = "ayah arabic";
        ar.innerText = ayah.text;

        // English
        const en = document.createElement("p");
        en.className = "ayah english";
        en.innerText = english.data.ayahs[index].text;

        ayahBox.appendChild(ar);
        ayahBox.appendChild(en);
        ayahsDiv.appendChild(ayahBox);
      });
    })
    .catch(err => {
      console.error("Ayah error:", err);
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
