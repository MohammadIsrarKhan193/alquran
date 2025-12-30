console.log("Qur'an Step 2 FIXED ✅");

const surahList = document.getElementById("surah-list");
const surahTitle = document.getElementById("surah-title");
const ayahsDiv = document.getElementById("ayahs");
const loading = document.getElementById("loading");

/* LOAD SURAH LIST */
fetch("https://api.quran.com/api/v4/chapters")
  .then(res => res.json())
  .then(data => {
    loading.remove();
    data.chapters.forEach(chapter => {
      const btn = document.createElement("button");
      btn.textContent = `${chapter.id}. ${chapter.name_simple}`;
      btn.onclick = () => loadSurah(chapter.id, chapter.name_simple);
      surahList.appendChild(btn);
    });
  })
  .catch(err => {
    loading.textContent = "Failed to load surahs ❌";
    console.error(err);
  });

/* LOAD AYĀHS (ARABIC + ENGLISH) */
function loadSurah(id, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`).then(r => r.json()),
    fetch(`https://api.quran.com/api/v4/quran/translations/20?chapter_number=${id}`).then(r => r.json())
  ])
  .then(([arabicData, englishData]) => {
    ayahsDiv.innerHTML = "";

    arabicData.verses.forEach((v, i) => {
      const wrapper = document.createElement("div");
      wrapper.className = "ayah";

      const arabic = document.createElement("div");
      arabic.className = "arabic";
      arabic.textContent = v.text_uthmani;

      const english = document.createElement("div");
      english.className = "translation";
      english.innerHTML = englishData.translations[i].text;

      const number = document.createElement("div");
      number.className = "ayah-number";
      number.textContent = `Ayah ${i + 1}`;

      wrapper.appendChild(arabic);
      wrapper.appendChild(english);
      wrapper.appendChild(number);

      ayahsDiv.appendChild(wrapper);
    });
  })
  .catch(err => {
    ayahsDiv.innerHTML = "Failed to load ayahs ❌";
    console.error(err);
  });
}
