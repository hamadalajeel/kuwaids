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
    "main": "assets/images/words/dresha.svg",
    "variations": [
      "assets/images/words/dresha-alt1.svg",
      "assets/images/words/dresha-alt2.svg",
      "assets/images/words/dresha-small.svg",
      "assets/images/words/dresha-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "2": {
    "alt": "فناء البيت",
    "main": "assets/images/words/hoosh.svg",
    "variations": [
      "assets/images/words/hoosh-alt1.svg",
      "assets/images/words/hoosh-alt2.svg",
      "assets/images/words/hoosh-small.svg",
      "assets/images/words/hoosh-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "3": {
    "alt": "وسادة",
    "main": "assets/images/words/mkhadda.svg",
    "variations": [
      "assets/images/words/mkhadda-alt1.svg",
      "assets/images/words/mkhadda-alt2.svg",
      "assets/images/words/mkhadda-small.svg",
      "assets/images/words/mkhadda-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "4": {
    "alt": "خزانة",
    "main": "assets/images/words/doolab.svg",
    "variations": [
      "assets/images/words/doolab-alt1.svg",
      "assets/images/words/doolab-alt2.svg",
      "assets/images/words/doolab-small.svg",
      "assets/images/words/doolab-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "5": {
    "alt": "علبة",
    "main": "assets/images/words/gooti.svg",
    "variations": [
      "assets/images/words/gooti-alt1.svg",
      "assets/images/words/gooti-alt2.svg",
      "assets/images/words/gooti-small.svg",
      "assets/images/words/gooti-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "6": {
    "alt": "استكانة شاي",
    "main": "assets/images/words/istikana.svg",
    "variations": [
      "assets/images/words/istikana-alt1.svg",
      "assets/images/words/istikana-alt2.svg",
      "assets/images/words/istikana-small.svg",
      "assets/images/words/istikana-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "7": {
    "alt": "ملعقة",
    "main": "assets/images/words/mallas.svg",
    "variations": [
      "assets/images/words/mallas-alt1.svg",
      "assets/images/words/mallas-alt2.svg",
      "assets/images/words/mallas-small.svg",
      "assets/images/words/mallas-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "8": {
    "alt": "قِدر",
    "main": "assets/images/words/jidir.svg",
    "variations": [
      "assets/images/words/jidir-alt1.svg",
      "assets/images/words/jidir-alt2.svg",
      "assets/images/words/jidir-small.svg",
      "assets/images/words/jidir-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "9": {
    "alt": "حقيبة مدرسية",
    "main": "assets/images/words/junta.svg",
    "variations": [
      "assets/images/words/junta-alt1.svg",
      "assets/images/words/junta-alt2.svg",
      "assets/images/words/junta-small.svg",
      "assets/images/words/junta-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "10": {
    "alt": "مبراة",
    "main": "assets/images/words/barraya.svg",
    "variations": [
      "assets/images/words/barraya-alt1.svg",
      "assets/images/words/barraya-alt2.svg",
      "assets/images/words/barraya-small.svg",
      "assets/images/words/barraya-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "11": {
    "alt": "دفتر",
    "main": "assets/images/words/daftar.svg",
    "variations": [
      "assets/images/words/daftar-alt1.svg",
      "assets/images/words/daftar-alt2.svg",
      "assets/images/words/daftar-small.svg",
      "assets/images/words/daftar-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "12": {
    "alt": "دشداشة كويتية",
    "main": "assets/images/words/dishdasha.svg",
    "variations": [
      "assets/images/words/dishdasha-alt1.svg",
      "assets/images/words/dishdasha-alt2.svg",
      "assets/images/words/dishdasha-small.svg",
      "assets/images/words/dishdasha-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "13": {
    "alt": "حذاء رياضي",
    "main": "assets/images/words/jooti.svg",
    "variations": [
      "assets/images/words/jooti-alt1.svg",
      "assets/images/words/jooti-alt2.svg",
      "assets/images/words/jooti-small.svg",
      "assets/images/words/jooti-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "14": {
    "alt": "غترة وعقال",
    "main": "assets/images/words/ghitra.svg",
    "variations": [
      "assets/images/words/ghitra-alt1.svg",
      "assets/images/words/ghitra-alt2.svg",
      "assets/images/words/ghitra-small.svg",
      "assets/images/words/ghitra-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "15": {
    "alt": "نعال",
    "main": "assets/images/words/naal.svg",
    "variations": [
      "assets/images/words/naal-alt1.svg",
      "assets/images/words/naal-alt2.svg",
      "assets/images/words/naal-small.svg",
      "assets/images/words/naal-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "16": {
    "alt": "قطة",
    "main": "assets/images/words/gattu.svg",
    "variations": [
      "assets/images/words/gattu-alt1.svg",
      "assets/images/words/gattu-alt2.svg",
      "assets/images/words/gattu-small.svg",
      "assets/images/words/gattu-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "17": {
    "alt": "دجاجة",
    "main": "assets/images/words/diyaya.svg",
    "variations": [
      "assets/images/words/diyaya-alt1.svg",
      "assets/images/words/diyaya-alt2.svg",
      "assets/images/words/diyaya-small.svg",
      "assets/images/words/diyaya-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "18": {
    "alt": "جمل",
    "main": "assets/images/words/baeer.svg",
    "variations": [
      "assets/images/words/baeer-alt1.svg",
      "assets/images/words/baeer-alt2.svg",
      "assets/images/words/baeer-small.svg",
      "assets/images/words/baeer-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "19": {
    "alt": "سمكة",
    "main": "assets/images/words/simcha.svg",
    "variations": [
      "assets/images/words/simcha-alt1.svg",
      "assets/images/words/simcha-alt2.svg",
      "assets/images/words/simcha-small.svg",
      "assets/images/words/simcha-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "20": {
    "alt": "صمونة",
    "main": "assets/images/words/samoon.svg",
    "variations": [
      "assets/images/words/samoon-alt1.svg",
      "assets/images/words/samoon-alt2.svg",
      "assets/images/words/samoon-small.svg",
      "assets/images/words/samoon-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "21": {
    "alt": "صحن عيش",
    "main": "assets/images/words/aish.svg",
    "variations": [
      "assets/images/words/aish-alt1.svg",
      "assets/images/words/aish-alt2.svg",
      "assets/images/words/aish-small.svg",
      "assets/images/words/aish-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "22": {
    "alt": "كوب ماء",
    "main": "assets/images/words/mai.svg",
    "variations": [
      "assets/images/words/mai-alt1.svg",
      "assets/images/words/mai-alt2.svg",
      "assets/images/words/mai-small.svg",
      "assets/images/words/mai-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "23": {
    "alt": "ريوق — بيضة",
    "main": "assets/images/words/rayoog.svg",
    "variations": [
      "assets/images/words/rayoog-alt1.svg",
      "assets/images/words/rayoog-alt2.svg",
      "assets/images/words/rayoog-small.svg",
      "assets/images/words/rayoog-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "24": {
    "alt": "سيارة",
    "main": "assets/images/words/motar.svg",
    "variations": [
      "assets/images/words/motar-alt1.svg",
      "assets/images/words/motar-alt2.svg",
      "assets/images/words/motar-small.svg",
      "assets/images/words/motar-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "25": {
    "alt": "دراجة",
    "main": "assets/images/words/seekal.svg",
    "variations": [
      "assets/images/words/seekal-alt1.svg",
      "assets/images/words/seekal-alt2.svg",
      "assets/images/words/seekal-small.svg",
      "assets/images/words/seekal-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "26": {
    "alt": "فريج — بيوت",
    "main": "assets/images/words/freej.svg",
    "variations": [
      "assets/images/words/freej-alt1.svg",
      "assets/images/words/freej-alt2.svg",
      "assets/images/words/freej-small.svg",
      "assets/images/words/freej-tilt.svg"
    ],
    "needsCustomIllustration": true
  },
  "27": {
    "alt": "طريق",
    "main": "assets/images/words/darb.svg",
    "variations": [
      "assets/images/words/darb-alt1.svg",
      "assets/images/words/darb-alt2.svg",
      "assets/images/words/darb-small.svg",
      "assets/images/words/darb-tilt.svg"
    ],
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
    "main": "assets/images/words/rassasi.svg",
    "variations": [
      "assets/images/words/rassasi-alt1.svg",
      "assets/images/words/rassasi-alt2.svg",
      "assets/images/words/rassasi-small.svg",
      "assets/images/words/rassasi-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "33": {
    "alt": "اللون السماوي",
    "main": "assets/images/words/samawi.svg",
    "variations": [
      "assets/images/words/samawi-alt1.svg",
      "assets/images/words/samawi-alt2.svg",
      "assets/images/words/samawi-small.svg",
      "assets/images/words/samawi-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "34": {
    "alt": "اللون الوردي",
    "main": "assets/images/words/wardi.svg",
    "variations": [
      "assets/images/words/wardi-alt1.svg",
      "assets/images/words/wardi-alt2.svg",
      "assets/images/words/wardi-small.svg",
      "assets/images/words/wardi-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "35": {
    "alt": "تحية — يد تلوّح",
    "main": "assets/images/words/shlonak.svg",
    "variations": [
      "assets/images/words/shlonak-alt1.svg",
      "assets/images/words/shlonak-alt2.svg",
      "assets/images/words/shlonak-small.svg",
      "assets/images/words/shlonak-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "36": {
    "alt": "نجوم كثيرة",
    "main": "assets/images/words/wayed.svg",
    "variations": [
      "assets/images/words/wayed-alt1.svg",
      "assets/images/words/wayed-alt2.svg",
      "assets/images/words/wayed-small.svg",
      "assets/images/words/wayed-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "37": {
    "alt": "إبهام لأعلى",
    "main": "assets/images/words/zain.svg",
    "variations": [
      "assets/images/words/zain-alt1.svg",
      "assets/images/words/zain-alt2.svg",
      "assets/images/words/zain-small.svg",
      "assets/images/words/zain-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "38": {
    "alt": "طفل يركض",
    "main": "assets/images/words/yalla.svg",
    "variations": [
      "assets/images/words/yalla-alt1.svg",
      "assets/images/words/yalla-alt2.svg",
      "assets/images/words/yalla-small.svg",
      "assets/images/words/yalla-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "39": {
    "alt": "إصبع يشير",
    "main": "assets/images/words/chithee.svg",
    "variations": [
      "assets/images/words/chithee-alt1.svg",
      "assets/images/words/chithee-alt2.svg",
      "assets/images/words/chithee-small.svg",
      "assets/images/words/chithee-tilt.svg"
    ],
    "needsCustomIllustration": false
  },
  "40": {
    "alt": "قلب شكر",
    "main": "assets/images/words/mashkoor.svg",
    "variations": [
      "assets/images/words/mashkoor-alt1.svg",
      "assets/images/words/mashkoor-alt2.svg",
      "assets/images/words/mashkoor-small.svg",
      "assets/images/words/mashkoor-tilt.svg"
    ],
    "needsCustomIllustration": false
  }
};

window.WORD_IMAGES = WORD_IMAGES;
window.IMAGE_FALLBACK = IMAGE_FALLBACK;
