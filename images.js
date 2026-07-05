/* ═══════════════════════════════════════════════════════════════
   كلماتي الكويتية — فهرس الصور (images.js)

   ملف مولَّد بواسطة tools/generate-images.mjs — أعد تشغيله بعد أي
   تعديل على الرسوم:  node tools/generate-images.mjs

   يربط كل كلمة (بمعرّفها id في words.js) بصورتها الأساسية وبدائلها.
   الأنشطة تبدّل عشوائياً بين main و variations حتى يتعلم الطفل
   معنى الكلمة لا شكل صورة واحدة.

   needsCustomIllustration = true : عنصر كويتي ثقافي يحتاج رسماً
   نهائياً مخصصاً يطابق الشكل الكويتي بدقة (حالياً: hoosh، istikana، junta، dishdasha، ghitra، naal، samoon، freej).
   الرسوم الحالية له مؤقتة تقريبية.
   ═══════════════════════════════════════════════════════════════ */

// الصورة الاحتياطية عند فشل تحميل أي صورة
const IMAGE_FALLBACK = "assets/images/words/placeholder.svg";

const WORD_IMAGES = {
  "1": {
    "alt": "نافذة",
    "main": "assets/images/photos/dresha.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "2": {
    "alt": "فناء البيت",
    "main": "assets/images/photos/hoosh.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "3": {
    "alt": "وسادة",
    "main": "assets/images/photos/mkhadda.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "4": {
    "alt": "خزانة",
    "main": "assets/images/photos/doolab.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "5": {
    "alt": "علبة",
    "main": "assets/images/photos/gooti.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "6": {
    "alt": "استكانة شاي",
    "main": "assets/images/photos/istikana.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "7": {
    "alt": "ملعقة",
    "main": "assets/images/photos/mallas.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "8": {
    "alt": "قِدر",
    "main": "assets/images/photos/jidir.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "9": {
    "alt": "حقيبة مدرسية",
    "main": "assets/images/photos/junta.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "10": {
    "alt": "مبراة",
    "main": "assets/images/photos/barraya.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "11": {
    "alt": "دفتر",
    "main": "assets/images/photos/daftar.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "12": {
    "alt": "دشداشة كويتية",
    "main": "assets/images/photos/dishdasha.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "13": {
    "alt": "حذاء رياضي",
    "main": "assets/images/photos/jooti.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "14": {
    "alt": "غترة وعقال",
    "main": "assets/images/photos/ghitra.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "15": {
    "alt": "نعال",
    "main": "assets/images/photos/naal.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "16": {
    "alt": "قطة",
    "main": "assets/images/photos/gattu.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "17": {
    "alt": "دجاجة",
    "main": "assets/images/photos/diyaya.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "18": {
    "alt": "جمل",
    "main": "assets/images/photos/baeer.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "19": {
    "alt": "سمكة",
    "main": "assets/images/photos/simcha.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "20": {
    "alt": "صمونة",
    "main": "assets/images/photos/samoon.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "21": {
    "alt": "صحن عيش",
    "main": "assets/images/photos/aish.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "22": {
    "alt": "كوب ماء",
    "main": "assets/images/photos/mai.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "23": {
    "alt": "ريوق — بيضة",
    "main": "assets/images/photos/rayoog.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "24": {
    "alt": "سيارة",
    "main": "assets/images/photos/motar.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "25": {
    "alt": "دراجة",
    "main": "assets/images/photos/seekal.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "26": {
    "alt": "فريج — بيوت",
    "main": "assets/images/photos/freej.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "27": {
    "alt": "طريق",
    "main": "assets/images/photos/darb.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "28": {
    "alt": "جدة",
    "main": "assets/images/words/yadda.svg",
    "variations": [
      "assets/images/words/yadda-alt1.svg",
      "assets/images/words/yadda-alt2.svg",
      "assets/images/words/yadda-small.svg",
      "assets/images/words/yadda-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "29": {
    "alt": "أم",
    "main": "assets/images/words/yumma.svg",
    "variations": [
      "assets/images/words/yumma-alt1.svg",
      "assets/images/words/yumma-alt2.svg",
      "assets/images/words/yumma-small.svg",
      "assets/images/words/yumma-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "30": {
    "alt": "أطفال",
    "main": "assets/images/words/iyal.svg",
    "variations": [
      "assets/images/words/iyal-alt1.svg",
      "assets/images/words/iyal-alt2.svg",
      "assets/images/words/iyal-small.svg",
      "assets/images/words/iyal-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "31": {
    "alt": "طفل رضيع",
    "main": "assets/images/words/baby.svg",
    "variations": [
      "assets/images/words/baby-alt1.svg",
      "assets/images/words/baby-alt2.svg",
      "assets/images/words/baby-small.svg",
      "assets/images/words/baby-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "32": {
    "alt": "اللون الرصاصي",
    "main": "assets/images/photos/rassasi.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "33": {
    "alt": "اللون السماوي",
    "main": "assets/images/photos/samawi.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "34": {
    "alt": "اللون الوردي",
    "main": "assets/images/photos/wardi.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "35": {
    "alt": "تحية — يد تلوّح",
    "main": "assets/images/photos/shlonak.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "36": {
    "alt": "نجوم كثيرة",
    "main": "assets/images/photos/wayed.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "37": {
    "alt": "إبهام لأعلى",
    "main": "assets/images/photos/zain.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "38": {
    "alt": "طفل يركض",
    "main": "assets/images/photos/yalla.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "39": {
    "alt": "إصبع يشير",
    "main": "assets/images/photos/chithee.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  },
  "40": {
    "alt": "قلب شكر",
    "main": "assets/images/photos/mashkoor.jpg",
    "variations": [],
    "isPhoto": true,
    "needsCustomIllustration": false
  }
};

window.WORD_IMAGES = WORD_IMAGES;
window.IMAGE_FALLBACK = IMAGE_FALLBACK;
