console.log("Qur'an App Loaded ✅");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");

/* LOAD SURAH LIST */
fetch("https://api.quran.com/api/v4/chapters")
  .then(res => res.json())
  .then(data => {
    surahList.innerHTML = "";
    data.chapters.forEach(surah => {
      const btn = document.createElement("button");
      btn.textContent = `${surah.id}. ${surah.name_simple}`;
      btn.onclick = () => loadSurah(surah.id, surah.name_simple);
      surahList.appendChild(btn);
    });
  })
  .catch(() => {
    surahList.innerHTML = "Failed to load surahs ❌";
  });

/* LOAD AYĀHS */
function loadSurah(id, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading…";

  Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`).then(r => r.json()),
    fetch(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${id}`).then(r => r.json())
  ])
  .then(([ar, en]) => {
    ayahsDiv.innerHTML = "";

    ar.verses.forEach((v, i) => {
      const arabic = document.createElement("div");
      arabic.className = "arabic";
      arabic.textContent = v.text_uthmani;

      const english = document.createElement("div");
      english.className = "english";
      english.textContent = en.translations[i].text.replace(/<[^>]+>/g, "");

      ayahsDiv.appendChild(arabic);
      ayahsDiv.appendChild(english);
    });
  })
  .catch(() => {
    ayahsDiv.innerHTML = "Failed to load ayahs ❌";
  });
}
