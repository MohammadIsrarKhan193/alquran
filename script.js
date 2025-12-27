document.addEventListener("DOMContentLoaded", () => {

  const surahList = document.getElementById("surahList");
  const surahTitle = document.getElementById("surahTitle");
  const ayahsDiv = document.getElementById("ayahs");

  if (!surahList || !surahTitle || !ayahsDiv) {
    alert("ID mismatch in HTML ❌");
    return;
  }

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
    })
    .catch(() => {
      surahList.innerHTML = "❌ Failed to load surahs";
    });

  function loadSurah(id, name) {
    surahTitle.textContent = `Surah ${name}`;
    ayahsDiv.innerHTML = "Loading...";

    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`)
      .then(res => res.json())
      .then(data => {
        ayahsDiv.innerHTML = "";

        data.verses.forEach(v => {
          const p = document.createElement("p");
          p.className = "ayah";
          p.textContent = `${v.text_uthmani} ﴿${v.verse_number}﴾`;

          if (v.sajdah_number) {
            const s = document.createElement("span");
            s.textContent = " 🟢 Sajdah";
            s.style.color = "green";
            p.appendChild(s);
          }

          ayahsDiv.appendChild(p);
        });
      })
      .catch(() => {
        ayahsDiv.innerHTML = "❌ Failed to load ayahs";
      });
  }

});
