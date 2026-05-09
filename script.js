const STATE = {
  surahs: [],
  currentSurah: null,
  currentAyah: 1,
  reciter: 'ar.alafasy',
  translation: 'en.sahih',
  tafsirMode: false,
  fontSize: 26,
  repeat: false,
  bookmarks: JSON.parse(localStorage.getItem('mik_bookmarks') || '[]'),
  lastRead: JSON.parse(localStorage.getItem('mik_last_read') || 'null')
};

const META = [
[1,'Al-Fatihah','الفاتحة',7,'Meccan'],[2,'Al-Baqarah','البقرة',286,'Medinan'],[3,'Aal-E-Imran','آل عمران',200,'Medinan'],[4,'An-Nisa','النساء',176,'Medinan'],[5,'Al-Ma'idah','المائدة',120,'Medinan'],[6,'Al-An'am','الأنعام',165,'Meccan'],[7,'Al-A'raf','الأعراف',206,'Meccan'],[8,'Al-Anfal','الأنفال',75,'Medinan'],[9,'At-Tawbah','التوبة',129,'Medinan'],[10,'Yunus','يونس',109,'Meccan'],[11,'Hud','هود',123,'Meccan'],[12,'Yusuf','يوسف',111,'Meccan'],[13,'Ar-Ra'd','الرعد',43,'Medinan'],[14,'Ibrahim','إبراهيم',52,'Meccan'],[15,'Al-Hijr','الحجر',99,'Meccan'],[16,'An-Nahl','النحل',128,'Meccan'],[17,'Al-Isra','الإسراء',111,'Meccan'],[18,'Al-Kahf','الكهف',110,'Meccan'],[19,'Maryam','مريم',98,'Meccan'],[20,'Taha','طه',135,'Meccan'],[21,'Al-Anbya','الأنبياء',112,'Meccan'],[22,'Al-Hajj','الحج',78,'Medinan'],[23,'Al-Mu'minun','المؤمنون',118,'Meccan'],[24,'An-Nur','النور',64,'Medinan'],[25,'Al-Furqan','الفرقان',77,'Meccan'],[26,'Ash-Shu'ara','الشعراء',227,'Meccan'],[27,'An-Naml','النمل',93,'Meccan'],[28,'Al-Qasas','القصص',88,'Meccan'],[29,'Al-Ankabut','العنكبوت',69,'Meccan'],[30,'Ar-Rum','الروم',60,'Meccan'],[31,'Luqman','لقمان',34,'Meccan'],[32,'As-Sajdah','السجدة',30,'Meccan'],[33,'Al-Ahzab','الأحزاب',73,'Medinan'],[34,'Saba','سبأ',54,'Meccan'],[35,'Fatir','فاطر',45,'Meccan'],[36,'Ya-Sin','يس',83,'Meccan'],[37,'As-Saffat','الصافات',182,'Meccan'],[38,'Sad','ص',88,'Meccan'],[39,'Az-Zumar','الزمر',75,'Meccan'],[40,'Ghafir','غافر',85,'Meccan'],[41,'Fussilat','فصلت',54,'Meccan'],[42,'Ash-Shura','الشورى',53,'Meccan'],[43,'Az-Zukhruf','الزخرف',89,'Meccan'],[44,'Ad-Dukhan','الدخان',59,'Meccan'],[45,'Al-Jathiyah','الجاثية',37,'Meccan'],[46,'Al-Ahqaf','الأحقاف',35,'Meccan'],[47,'Muhammad','محمد',38,'Medinan'],[48,'Al-Fath','الفتح',29,'Medinan'],[49,'Al-Hujurat','الحجرات',18,'Medinan'],[50,'Qaf','ق',45,'Meccan'],[51,'Adh-Dhariyat','الذاريات',60,'Meccan'],[52,'At-Tur','الطور',49,'Meccan'],[53,'An-Najm','النجم',62,'Meccan'],[54,'Al-Qamar','القمر',55,'Meccan'],[55,'Ar-Rahman','الرحمن',78,'Medinan'],[56,'Al-Waqi'ah','الواقعة',96,'Meccan'],[57,'Al-Hadid','الحديد',29,'Medinan'],[58,'Al-Mujadila','المجادلة',22,'Medinan'],[59,'Al-Hashr','الحشر',24,'Medinan'],[60,'Al-Mumtahanah','الممتحنة',13,'Medinan'],[61,'As-Saff','الصف',14,'Medinan'],[62,'Al-Jumu'ah','الجمعة',11,'Medinan'],[63,'Al-Munafiqun','المنافقون',11,'Medinan'],[64,'At-Taghabun','التغابن',18,'Medinan'],[65,'At-Talaq','الطلاق',12,'Medinan'],[66,'At-Tahrim','التحريم',12,'Medinan'],[67,'Al-Mulk','الملك',30,'Meccan'],[68,'Al-Qalam','القلم',52,'Meccan'],[69,'Al-Haqqah','الحاقة',52,'Meccan'],[70,'Al-Ma'arij','المعارج',44,'Meccan'],[71,'Nuh','نوح',28,'Meccan'],[72,'Al-Jinn','الجن',28,'Meccan'],[73,'Al-Muzzammil','المزمل',20,'Meccan'],[74,'Al-Muddaththir','المدثر',56,'Meccan'],[75,'Al-Qiyamah','القيامة',40,'Meccan'],[76,'Al-Insan','الإنسان',31,'Medinan'],[77,'Al-Mursalat','المرسلات',50,'Meccan'],[78,'An-Naba','النبأ',40,'Meccan'],[79,'An-Nazi'at','النازعات',46,'Meccan'],[80,'Abasa','عبس',42,'Meccan'],[81,'At-Takwir','التكوير',29,'Meccan'],[82,'Al-Infitar','الإنفطار',19,'Meccan'],[83,'Al-Mutaffifin','المطففين',36,'Meccan'],[84,'Al-Inshiqaq','الإنشقاق',25,'Meccan'],[85,'Al-Buruj','البروج',22,'Meccan'],[86,'At-Tariq','الطارق',17,'Meccan'],[87,'Al-Ala','الأعلى',19,'Meccan'],[88,'Al-Ghashiyah','الغاشية',26,'Meccan'],[89,'Al-Fajr','الفجر',30,'Meccan'],[90,'Al-Balad','البلد',20,'Meccan'],[91,'Ash-Shams','الشمس',15,'Meccan'],[92,'Al-Layl','الليل',21,'Meccan'],[93,'Ad-Duha','الضحى',11,'Meccan'],[94,'Ash-Sharh','الشرح',8,'Meccan'],[95,'At-Tin','التين',8,'Meccan'],[96,'Al-Alaq','العلق',19,'Meccan'],[97,'Al-Qadr','القدر',5,'Meccan'],[98,'Al-Bayyinah','البينة',8,'Medinan'],[99,'Az-Zalzalah','الزلزلة',8,'Medinan'],[100,'Al-Adiyat','العاديات',11,'Meccan'],[101,'Al-Qari'ah','القارعة',11,'Meccan'],[102,'At-Takathur','التكاثر',8,'Meccan'],[103,'Al-Asr','العصر',3,'Meccan'],[104,'Al-Humazah','الهمزة',9,'Meccan'],[105,'Al-Fil','الفيل',5,'Meccan'],[106,'Quraysh','قريش',4,'Meccan'],[107,'Al-Ma'un','الماعون',7,'Meccan'],[108,'Al-Kawthar','الكوثر',3,'Meccan'],[109,'Al-Kafirun','الكافرون',6,'Meccan'],[110,'An-Nasr','النصر',3,'Medinan'],[111,'Al-Masad','المسد',5,'Meccan'],[112,'Al-Ikhlas','الإخلاص',4,'Meccan'],[113,'Al-Falaq','الفلق',5,'Meccan'],[114,'An-Nas','الناس',6,'Meccan']
];

const NAMES = [
['1','الرَّحْمَٰن','Ar-Rahman','The Most Merciful'],
['2','الرَّحِيم','Ar-Raheem','The Especially Merciful'],
['3','الْمَلِك','Al-Malik','The King'],
['4','الْقُدُّوس','Al-Quddus','The Most Holy'],
['5','السَّلَام','As-Salam','The Source of Peace'],
['6','الْمُؤْمِن','Al-Mu’min','The Giver of Faith'],
['7','الْمُهَيْمِن','Al-Muhaymin','The Protector'],
['8','الْعَزِيز','Al-Aziz','The Almighty'],
['9','الْجَبَّار','Al-Jabbar','The Compeller'],
['10','الْمُتَكَبِّر','Al-Mutakabbir','The Supreme'],
['11','الْخَالِق','Al-Khaliq','The Creator'],
['12','الْبَارِئ','Al-Bari','The Maker'],
['13','الْمُصَوِّر','Al-Musawwir','The Fashioner'],
['14','الْغَفَّار','Al-Ghaffar','The Constant Forgiver'],
['15','الْقَهَّار','Al-Qahhar','The Subduer'],
['16','الْوَهَّاب','Al-Wahhab','The Bestower'],
['17','الرَّزَّاق','Ar-Razzaq','The Provider'],
['18','الْفَتَّاح','Al-Fattah','The Opener'],
['19','الْعَلِيم','Al-Alim','The All-Knowing'],
['20','الْقَابِض','Al-Qabid','The Withholder'],
['21','الْبَاسِط','Al-Basit','The Extender'],
['22','الْخَافِض','Al-Khafid','The Abaser'],
['23','الرَّافِع','Ar-Rafi','The Exalter'],
['24','الْمُعِزّ','Al-Muizz','The Honorer'],
['25','الْمُذِلّ','Al-Mudhill','The Dishonorer'],
['26','السَّمِيع','As-Sami','The All-Hearing'],
['27','الْبَصِير','Al-Basir','The All-Seeing'],
['28','الْحَكَم','Al-Hakam','The Judge'],
['29','الْعَدْل','Al-Adl','The Utterly Just'],
['30','اللَّطِيف','Al-Latif','The Subtle One'],
['31','الْخَبِير','Al-Khabir','The All-Aware'],
['32','الْحَلِيم','Al-Halim','The Forbearing'],
['33','الْعَظِيم','Al-Azim','The Magnificent'],
['34','الْغَفُور','Al-Ghafur','The Forgiving'],
['35','الشَّكُور','Ash-Shakur','The Grateful'],
['36','الْعَلِيّ','Al-Ali','The Most High'],
['37','الْكَبِير','Al-Kabir','The Most Great'],
['38','الْحَفِيظ','Al-Hafiz','The Preserver'],
['39','الْمُقِيت','Al-Muqit','The Sustainer'],
['40','الْحَسِيب','Al-Hasib','The Reckoner'],
['41','الْجَلِيل','Al-Jalil','The Majestic'],
['42','الْكَرِيم','Al-Karim','The Most Generous'],
['43','الرَّقِيب','Ar-Raqib','The Watchful'],
['44','الْمُجِيب','Al-Mujib','The Responsive'],
['45','الْوَاسِع','Al-Wasi','The All-Encompassing'],
['46','الْحَكِيم','Al-Hakim','The Wise'],
['47','الْوَدُود','Al-Wadud','The Most Loving'],
['48','الْمَجِيد','Al-Majid','The Glorious'],
['49','الْبَاعِث','Al-Baith','The Resurrector'],
['50','الشَّهِيد','Ash-Shahid','The Witness'],
['51','الْحَق','Al-Haqq','The Truth'],
['52','الْوَكِيل','Al-Wakil','The Trustee'],
['53','الْقَوِيّ','Al-Qawiyy','The Strong'],
['54','الْمَتِين','Al-Matin','The Firm'],
['55','الْوَلِيّ','Al-Wali','The Protecting Friend'],
['56','الْحَمِيد','Al-Hamid','The Praiseworthy'],
['57','الْمُحْصِي','Al-Muhsi','The Enumerator'],
['58','الْمُبْدِئ','Al-Mubdi','The Originator'],
['59','الْمُعِيد','Al-Mu'id','The Restorer'],
['60','الْمُحْيِي','Al-Muhyi','The Giver of Life'],
['61','الْمُمِيت','Al-Mumit','The Giver of Death'],
['62','الْحَيّ','Al-Hayy','The Ever-Living'],
['63','الْقَيُّوم','Al-Qayyum','The Sustainer'],
['64','الْوَاجِد','Al-Wajid','The Finder'],
['65','الْمَاجِد','Al-Majid','The Noble'],
['66','الْوَاحِد','Al-Wahid','The One'],
['67','الْأَحَد','Al-Ahad','The Unique'],
['68','الصَّمَد','As-Samad','The Eternal'],
['69','الْقَادِر','Al-Qadir','The Able'],
['70','الْمُقْتَدِر','Al-Muqtadir','The Powerful'],
['71','الْمُقَدِّم','Al-Muqaddim','The Promoter'],
['72','الْمُؤَخِّر','Al-Mu’akhkhir','The Delayer'],
['73','الأَوَّل','Al-Awwal','The First'],
['74','الآخِر','Al-Akhir','The Last'],
['75','الظَّاهِر','Az-Zahir','The Manifest'],
['76','الْبَاطِن','Al-Batin','The Hidden'],
['77','الْوَالِي','Al-Wali','The Governor'],
['78','الْمُتَعَالِي','Al-Muta'ali','The Exalted'],
['79','الْبَرّ','Al-Barr','The Source of Goodness'],
['80','التَّوَاب','At-Tawwab','The Ever-Pardoning'],
['81','الْمُنْتَقِم','Al-Muntaqim','The Avenger'],
['82','الْعَفُوّ','Al-Afuww','The Pardoner'],
['83','الرَّؤُوف','Ar-Ra’uf','The Most Kind'],
['84','مَالِكُ الْمُلْك','Malik al-Mulk','Master of the Kingdom'],
['85','ذُو الْجَلَالِ وَالْإِكْرَام','Dhul-Jalali wal-Ikram','Lord of Majesty and Honor'],
['86','الْمُقْسِط','Al-Muqsit','The Equitable'],
['87','الْجَامِع','Al-Jami','The Gatherer'],
['88','الْغَنِيّ','Al-Ghani','The Rich'],
['89','الْمُغْنِي','Al-Mughni','The Enricher'],
['90','الْمَانِع','Al-Mani','The Withholder'],
['91','الضَّارّ','Ad-Darr','The Distresser'],
['92','النَّافِع','An-Nafi','The Propitious'],
['93','النُّور','An-Nur','The Light'],
['94','الْهَادِي','Al-Hadi','The Guide'],
['95','الْبَدِيع','Al-Badi','The Incomparable Originator'],
['96','الْبَاقِي','Al-Baqi','The Ever-Surviving'],
['97','الْوَارِث','Al-Warith','The Inheritor'],
['98','الرَّشِيد','Ar-Rashid','The Guide to the Right Path'],
['99','الصَّبُور','As-Sabur','The Most Patient']
];

const P = [
['1','المصطفى','Al-Mustafa','The Chosen One'],
['2','الرسول','Ar-Rasul','The Messenger'],
['3','النبي','An-Nabi','The Prophet'],
['4','الهادي','Al-Hadi','The Guide'],
['5','السراج المنير','As-Siraj al-Munir','The Illuminating Lamp']
];

const DH = [
['Morning Adhkar',['Ayat al-Kursi','Last 3 Surahs','SubhanAllah 33','Alhamdulillah 33','Allahu Akbar 34']],
['Evening Adhkar',['Ayat al-Kursi','Last 3 Surahs','Protection duas','Istighfar']],
['After Prayer',['SubhanAllah 33','Alhamdulillah 33','Allahu Akbar 34']],
['Tasbeeh',['SubhanAllah','Alhamdulillah','Allahu Akbar']]
];

const $ = s => document.querySelector(s);

function showPage(id){ document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden')); $('#'+id)?.classList.remove('hidden'); }
function toggleSearch(){ $('#sbar').classList.toggle('hidden'); }
function changeLang(){ STATE.translation = $('#lang-sel').value; renderReader(); loadSurah(STATE.currentSurah); }
function changeReciter(){ STATE.reciter = $('#reciter-sel').value; }
function changeFontSize(v){ STATE.fontSize = Math.max(18, Math.min(34, STATE.fontSize + v)); document.querySelectorAll('.ayah-arabic').forEach(a=>a.style.fontSize = STATE.fontSize + 'px'); }
function toggleTafsirMode(){ STATE.tafsirMode = !STATE.tafsirMode; renderReader(); }
function toggleBookmarkSurah(){
  if(!STATE.currentSurah) return;
  const i = STATE.bookmarks.indexOf(STATE.currentSurah);
  if(i > -1) STATE.bookmarks.splice(i,1); else STATE.bookmarks.push(STATE.currentSurah);
  localStorage.setItem('mik_bookmarks', JSON.stringify(STATE.bookmarks));
}
function setSurahList(id, filter=''){
  const w = document.getElementById(id);
  if(!w) return;
  w.innerHTML = '';
  META.filter(s=>`${s[0]} ${s[1]} ${s[2]}`.toLowerCase().includes(filter)).forEach(s=>{
    const d=document.createElement('div');
    d.className='si';
    d.onclick=()=>openSurah(s[0]);
    d.innerHTML=`<div class="si-num">${s[0]}</div><div class="si-info"><div class="si-en">${s[1]}</div><div class="si-meta">${s[4]} • ${s[3]} Ayahs</div></div><div class="si-ar">${s[2]}</div>`;
    w.appendChild(d);
  });
}
function filterSurahs(){ setSurahList('surah-list', $('#sinput').value.toLowerCase()); }

async function openSurah(n){
  STATE.currentSurah = n;
  STATE.currentAyah = 1;
  showPage('page-reader');
  await loadSurah(n);
}
async function loadSurah(n){
  const r = await fetch(`https://api.alquran.cloud/v1/surah/${n}/${STATE.translation}`);
  const j = await r.json();
  STATE.data = j.data;
  renderReader();
}

function renderReader(){
  const s = STATE.data;
  if(!s){ $('#reader-title').textContent='Loading...'; return; }
  $('#reader-title').textContent = s.englishName;
  $('#reader-sub').textContent = `${s.numberOfAyahs} Ayahs • ${s.revelationType}`;
  const box = $('#ayah-content');
  box.innerHTML = '';
  s.ayahs.forEach(a=>{
    const item = document.createElement('div');
    item.className='ayah-item';
    item.innerHTML = `
      <div class="ayah-top">
        <div class="ayah-num">${a.numberInSurah}</div>
        <div class="ayah-acts"><button class="aab" onclick="playAyah(${a.numberInSurah})">▶</button></div>
      </div>
      <div class="ayah-arabic" style="font-size:${STATE.fontSize}px">${a.text}</div>
      <div class="ayah-trans">${a.text}</div>
      ${STATE.tafsirMode ? `<div class="ayah-tafsir-inline"><span class="tafsir-label">Tafsir</span>Tafsir will be connected here.</div>` : ''}
    `;
    box.appendChild(item);
  });
}

function playAyah(n){
  STATE.currentAyah = n;
  const url = `https://cdn.islamic.network/quran/audio-surah/128/${STATE.reciter}/${STATE.currentSurah}.mp3`;
  $('#quran-audio').src = url;
  $('#quran-audio').play().catch(()=>{});
  $('#ap-label').textContent = `Playing ${STATE.currentSurah}:${n}`;
}
function togglePlay(){ const a=$('#quran-audio'); a.paused ? a.play().catch(()=>{}) : a.pause(); }
function prevAyah(){ STATE.currentAyah = Math.max(1, STATE.currentAyah - 1); playAyah(STATE.currentAyah); }
function nextAyah(){ STATE.currentAyah++; playAyah(STATE.currentAyah); }
function onAudioEnd(){
  const s = STATE.data;
  if(STATE.currentAyah < s.numberOfAyahs){ STATE.currentAyah++; playAyah(STATE.currentAyah); }
  else if(STATE.currentSurah < 114){ openSurah(STATE.currentSurah + 1); }
}
function updateProgress(){
  const a = $('#quran-audio');
  if(a.duration) $('#ap-fill').style.width = (a.currentTime / a.duration * 100) + '%';
}

function renderNames(){
  const g = $('#names-grid');
  if(g) g.innerHTML = NAMES.map(x=>`<div class='name-card'><div class='name-no'>${x[0]}</div><div class='name-ar'>${x[1]}</div><div class='name-en'>${x[2]}</div><div class='name-me'>${x[3]}</div></div>`).join('');
  const p = $('#prophet-grid');
  if(p) p.innerHTML = P.map(x=>`<div class='name-card'><div class='name-no'>${x[0]}</div><div class='name-ar'>${x[1]}</div><div class='name-en'>${x[2]}</div><div class='name-me'>${x[3]}</div></div>`).join('');
}
function renderDhikr(){
  const g = $('#dhikr-content');
  if(g) g.innerHTML = DH.map(x=>`<div class='dh-card'><h3>${x[0]}</h3><ul>${x[1].map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('');
}

function init(){
  setSurahList('surah-list');
  setSurahList('tafsir-surah-list');
  renderNames();
  renderDhikr();
  setInterval(()=>{ const el = $('#current-time'); if(el) el.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }, 1000);
  setTimeout(()=>$('#splash')?.classList.add('hidden'), 700);
  showPage('page-home');
  if(STATE.lastRead) openSurah(STATE.lastRead);
}

init();
