console.log("Qur'an App Loaded ✅");

const surahList = document.getElementById("surah-list");
const ayahsDiv = document.getElementById("ayahs");
const surahTitle = document.getElementById("surah-title");
const loading = document.getElementById("loading");

/* LOAD SURAH LIST */
fetch("https://api.alquran.cloud/v1/surah")
  .then(res => res.json())
  .then(data => {
    loading.remove();

    data.data.forEach(surah => {
      const btn = document.createElement("button");
      btn.textContent = `${surah.number}. ${surah.englishName}`;
      btn.onclick = () => loadSurah(surah.number, surah.englishName);
      surahList.appendChild(btn);
    });
  })
  .catch(err => {
    loading.textContent = "Failed to load surahs ❌";
    console.error(err);
  });

/* LOAD SURAH (ARABIC + ENGLISH) */
function loadSurah(number, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}`).then(r => r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/en.sahih`).then(r => r.json())
  ])
  .then(([arabic, english]) => {
    ayahsDiv.innerHTML = "";

    arabic.data.ayahs.forEach((ayah, i) => {
      const ar = document.createElement("div");
      ar.className = "arabic";
      ar.textContent = ayah.text;

      const en = document.createElement("div");
      en.className = "translation";
      en.textContent = english.data.ayahs[i].text;

      ayahsDiv.appendChild(ar);
      ayahsDiv.appendChild(en);
    });
  })
  .catch(err => {
    ayahsDiv.innerHTML = "Error loading surah ❌";
    console.error(err);
  });
}
