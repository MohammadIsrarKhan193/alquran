document.addEventListener("DOMContentLoaded", () => {

  const surahList = document.getElementById("surahList");
  const surahTitle = document.getElementById("surahTitle");
  const ayahsDiv = document.getElementById("ayahs");

  // SAFETY CHECK
  if (!surahList) {
    alert("HTML not loaded properly");
    return;
  }

  // LOAD SURAH LIST
  fetch("https://api.quran.com/api/v4/chapters")
    .then(res => res.json())
    .then(data => {
      surahList.innerHTML = "";

      data.chapters.forEach(ch => {
        const btn = document.createElement("button");
        btn.textContent = `${ch.id}. ${ch.name_simple}`;
        btn.style.display = "block";
        btn.style.margin = "5px 0";
        btn.onclick = () => loadSurah(ch.id, ch.name_simple);
        surahList.appendChild(btn);
      });
    })
    .catch(err => {
      surahList.innerHTML = "❌ Failed to load Surahs";
      console.error(err);
    });

  // LOAD SURAH AYATS (ARABIC ONLY)
  function loadSurah(id, name) {
    surahTitle.textContent = `Surah ${name}`;
    ayahsDiv.innerHTML = "Loading...";

    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`)
      .then(res => res.json())
      .then(data => {
        ayahsDiv.innerHTML = "";

        data.verses.forEach(v => {
          const div = document.createElement("div");
          div.style.fontSize = "22px";
          div.style.marginBottom = "15px";
          div.style.direction = "rtl";
          div.textContent = `${v.text_uthmani} ﴿${v.verse_number}﴾`;

          // SAJDAH INDICATOR
          if (v.sajdah_number) {
            const saj = document.createElement("div");
            saj.textContent = "🟢 Sajdah";
            saj.style.color = "green";
            saj.style.fontSize = "14px";
            div.appendChild(saj);
          }

          ayahsDiv.appendChild(div);
        });
      })
      .catch(err => {
        ayahsDiv.innerHTML = "❌ Failed to load Ayahs";
        console.error(err);
      });
  }

});
