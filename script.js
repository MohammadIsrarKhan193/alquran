console.log("Qur'an App Loaded ✅");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");

/* LOAD SURAH LIST */
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    data.data.forEach(surah => {
      const btn = document.createElement("button");
      btn.className = "surah-btn";
      btn.innerText = `${surah.number}. ${surah.englishName}`;
      btn.onclick = () => loadSurah(surah.number, surah.englishName);
      surahList.appendChild(btn);
    });
  })
  .catch(err => console.error(err));

/* LOAD SURAH AYĀHS */
function loadSurah(number, name) {
  surahTitle.innerText = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}`).then(r => r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/en.sahih`).then(r => r.json())
  ])
  .then(([arabic, english]) => {
    ayahsDiv.innerHTML = "";

    arabic.data.ayahs.forEach((ayah, i) => {
      const ar = document.createElement("p");
      ar.className = "ayah arabic";
      ar.innerText = ayah.text;

      const en = document.createElement("p");
      en.className = "ayah translation";
      en.innerText = english.data.ayahs[i].text;

      ayahsDiv.appendChild(ar);
      ayahsDiv.appendChild(en);
    });
  })
  .catch(err => {
    ayahsDiv.innerText = "Error loading ayahs ❌";
    console.error(err);
  });
}
