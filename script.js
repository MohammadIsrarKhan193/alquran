console.log("Qur'an App Loaded ✅");

const surahList = document.getElementById("surah-list");
const ayahsDiv = document.getElementById("ayahs");
const surahTitle = document.getElementById("surah-title");
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

/* LOAD SURAH (ARABIC + ENGLISH) */
function loadSurah(id, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`).then(r => r.json()),
    fetch(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${id}`).then(r => r.json())
  ])
  .then(([arabicData, englishData]) => {
    ayahsDiv.innerHTML = "";

    /* BISMILLAH (Except Surah 9) */
    if (id !== 9) {
      const bismillah = document.createElement("div");
      bismillah.className = "arabic";
      bismillah.style.textAlign = "center";
      bismillah.textContent = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
      ayahsDiv.appendChild(bismillah);
    }

    arabicData.verses.forEach((v, i) => {
      const arabic = document.createElement("div");
      arabic.className = "arabic";
      arabic.textContent = v.text_uthmani;

      const english = document.createElement("div");
      english.className = "translation";
      english.textContent = englishData.translations[i].text.replace(/<[^>]*>/g, "");

      const num = document.createElement("div");
      num.className = "ayah-number";
      num.textContent = `Ayah ${i + 1}`;

      ayahsDiv.appendChild(arabic);
      ayahsDiv.appendChild(english);
      ayahsDiv.appendChild(num);
    });
  })
  .catch(err => {
    ayahsDiv.innerHTML = "Error loading surah ❌";
    console.error(err);
  });
}
