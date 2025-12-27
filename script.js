console.log("Qur'an App Loaded ✅");

const surahList = document.getElementById("surahList");
const surahTitle = document.getElementById("surahTitle");
const ayahsDiv = document.getElementById("ayahs");
const audio = document.getElementById("audio");

// AUDIO
function playAudio() {
  audio.play();
}
function pauseAudio() {
  audio.pause();
}

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
  })
  .catch(err => {
    surahList.innerHTML = "❌ Failed to load surahs";
    console.error(err);
  });

// LOAD SURAH CONTENT
function loadSurah(id, name) {
  surahTitle.textContent = `Surah ${name}`;
  ayahsDiv.innerHTML = "Loading...";

  // AUDIO (Mishary Alafasy)
  audio.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${id}.mp3`;

  Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${id}`).then(r => r.json()),
    fetch(`https://api.alquran.cloud/v1/surah/${id}/en.sahih`).then(r => r.json())
  ])
  .then(([ar, en]) => {
    ayahsDiv.innerHTML = "";
    ar.data.ayahs.forEach((a, i) => {
      const arDiv = document.createElement("div");
      arDiv.className = "arabic";
      arDiv.textContent = a.text;

      const enDiv = document.createElement("div");
      enDiv.className = "translation";
      enDiv.textContent = en.data.ayahs[i].text;

      ayahsDiv.appendChild(arDiv);
      ayahsDiv.appendChild(enDiv);
    });
  })
  .catch(err => {
    ayahsDiv.innerHTML = "❌ Failed to load surah";
    console.error(err);
  });
}
