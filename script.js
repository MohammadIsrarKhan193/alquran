function loadSurah(number, name) {
  ayahsDiv.innerHTML = "";
  bismillahDiv.innerHTML = "";
  surahTitle.innerText = "Loading...";

  // Using 'quran-uthmani' ensures we get the metadata for Sajdah and Ruku
  fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`)
    .then(r => r.json())
    .then(data => {
      const arabicData = data.data[0];
      const englishData = data.data[1];
      
      surahTitle.innerText = `Surah ${name}`;

      if (number != 1 && number != 9) {
        bismillahDiv.innerText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
      }

      arabicData.ayahs.forEach((ayah, index) => {
        const ayahBox = document.createElement("div");
        ayahBox.className = "ayah-box";

        // Logic for Sajdah and Ruku Indicators
        let markers = "";
        if (ayah.sajdah) markers += `<span class="marker sajdah-tag">۩ SAJDAH</span>`;
        if (ayah.ruku) markers += `<span class="marker ruku-tag">RUKŪ ${ayah.ruku}</span>`;

        let arabicText = ayah.text;
        if (number != 1 && index === 0) {
            arabicText = arabicText.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "");
        }

        ayahBox.innerHTML = `
          <div class="ayah-header">
            <span class="ayah-number">${ayah.numberInSurah}</span>
            <div class="markers-container">${markers}</div>
          </div>
          <p class="ayah arabic">${arabicText}</p>
          <p class="ayah english">${englishData.ayahs[index].text}</p>
        `;

        ayahsDiv.appendChild(ayahBox);
      });
    })
    .catch(err => {
      console.error(err);
      surahTitle.innerText = "Failed to load ayahs ❌";
    });
}
