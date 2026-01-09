const events = [
    { title: "27 Rajab", date: "16 Jan, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Rajab" },
    { title: "15 Sha'ban", date: "03 Feb, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Shaban" },
    { title: "1 Ramadan", date: "18 Feb, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Ramadan" },
    { title: "27 Ramadan", date: "16 Mar, 2026", img: "https://placehold.co/100x100/145D4B/white?text=LaylatulQadr" },
    { title: "Eid ul Fitr", date: "20 Mar, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Eid" },
    { title: "1 Dhul Hijjah", date: "18 May, 2026", img: "https://placehold.co/100x100/145D4B/white?text=DhulHijjah" },
    { title: "Day of Arafah", date: "26 May, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Arafah" },
    { title: "Eid ul Adha", date: "27 May, 2026", img: "https://placehold.co/100x100/145D4B/white?text=EidAdha" },
    { title: "1 Muharram", date: "17 Jun, 2026", img: "https://placehold.co/100x100/145D4B/white?text=1448AH" },
    { title: "10 Muharram", date: "26 Jun, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Ashura" },
    { title: "12 Rabi ul Awwal", date: "26 Aug, 2026", img: "https://placehold.co/100x100/145D4B/white?text=Mawlid" }
];

function changeFont() {
    const f = document.getElementById('font-select').value;
    document.body.className = f;
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'page-hijri') loadHijri();
}

function loadHijri() {
    document.getElementById('hijri-list').innerHTML = events.map(e => `
        <div class="event-card">
            <img src="${e.img}" class="event-img">
            <div class="event-info"><h4>${e.title}</h4><p>${e.date}</p></div>
        </div>`).join('');
}

// Fixed Audio Logic
async function loadSurah(num, name) {
    localStorage.setItem('lastSurah', num);
    localStorage.setItem('lastName', name);
    showPage('page-reader');
    document.getElementById('surah-title').innerText = name;
    
    // SUDAYS FIX: use 'ar.abdurrahmansudais' for better compatibility
    const reciter = document.getElementById('reciter-select').value;
    document.getElementById('quran-player').src = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${num}.mp3`;
    
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
    const data = await res.json();
    let html = "";
    data.data[0].ayahs.forEach((a, i) => {
        html += `<div class="ayah-card"><p class="arabic-font">${a.text}</p><p style="font-size:14px; color:#666;">${data.data[1].ayahs[i].text}</p></div>`;
    });
    document.getElementById('ayah-container').innerHTML = html;
}

// Tasbeeh
let tCount = 0;
function doCount() { 
    tCount++; 
    document.getElementById('t-count').innerText = tCount;
    document.getElementById('current-dhikr-display').innerText = document.getElementById('dhikr-select').value;
    if (navigator.vibrate) navigator.vibrate(50);
}
function resetT() { tCount = 0; document.getElementById('t-count').innerText = 0; }

window.onload = async () => {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const data = await res.json();
    document.getElementById('surah-list').innerHTML = data.data.map(s => `
        <div class="pro-item" onclick="loadSurah(${s.number},'${s.englishName}')" style="cursor:pointer; padding:15px; background:white; margin:10px; border-radius:10px;">
            <span>${s.number}. ${s.englishName}</span>
            <span class="arabic-font" style="float:right;">${s.name}</span>
        </div>`).join('');
};
