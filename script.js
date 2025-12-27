const surahList = document.getElementById("surahList");
const surahTitle = document.getElementById("surahTitle");
const ayahsDiv = document.getElementById("ayahs");

// LOAD SURAH LIST
fetch("https://api.quran.com/api/v4/chapters")
  .then(res => res.json())
  .then(data => {
    surahList.innerHTML = "";
    data.chapters.forEach(ch => {
      const btn = document.createElement("button");
      btn.textContent = `${ch.id}. ${ch.name_simple}`;
      btn.onclick = () => loadSurah(ch.id, ch.name_simple);
      surahList.appendChild(btn);
    });
  });

// LOAD SURAH CONTENT
function loadSurah(id, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`)
    .then(res => res.json())
    .then(data => {
      ayahsDiv.innerHTML = "";

      data.verses.forEach(v => {
        const div = document.createElement("div");
        div.className = "arabic";
        div.textContent = `${v.text_uthmani} ﴿${v.verse_number}﴾`;

        // Sajdah indicator
        if (v.sajdah_number) {
          const saj = document.createElement("span");
          saj.textContent = " 🟢 Sajdah";
          saj.style.color = "green";
          div.appendChild(saj);
        }

        ayahsDiv.appendChild(div);
      });
    })
    .catch(() => {
      ayahsDiv.innerHTML = "❌ Failed to load surah";
    });
}
