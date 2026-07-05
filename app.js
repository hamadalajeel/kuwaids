/* ═══════════════════════════════════════════════════════════════
   كلماتي الكويتية — منطق التطبيق (app.js)

   يعتمد على:
   - words.js  → window.KUWAITI_WORDS و window.WORD_CATEGORIES
   - index.html → معرّفات العناصر
   - Local Storage فقط (بدون خادم أو قاعدة بيانات)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ═══════════════ إعدادات عامة ═══════════════ */

  const STORAGE_KEY = "kuwaids_state_v1";

  // عدد كلمات الدرس اليومي — غيّر هذين الرقمين لتغيير حجم الدرس
  const NEW_WORDS_PER_DAY = 3;
  const REVIEW_WORDS_PER_DAY = 2;
  const DAILY_TOTAL = NEW_WORDS_PER_DAY + REVIEW_WORDS_PER_DAY;

  // فواصل التكرار المتباعد (بالأيام): غداً، بعد ٣، بعد ٧، بعد ١٤
  const SRS_INTERVALS = [1, 3, 7, 14];
  // الكلمة "متقنة" عندما تصل لآخر فاصل (١٤ يوم)
  const MASTERED_INDEX = SRS_INTERVALS.length - 1;

  const STARS_PER_LEVEL = 20;

  const AVATARS = ["🦊", "🐱", "🐰", "🦁", "🐼", "🐸", "🐥", "🦄", "🐙", "🐢", "🐬", "🦜"];

  const FAVORITE_COLORS = [
    "#ff6b6b", "#ff8a3d", "#ffc93c", "#58c96b",
    "#4ecdc4", "#4d96ff", "#9b5de5", "#f15bb5",
  ];

  // درجات هادئة قليلة لتنويع عرض الكلمة دون إغراق الشاشة بالألوان
  const WORD_COLORS = ["#333a48", "#248079", "#a3622e"];

  const PRAISE_MESSAGES = [
    { emoji: "🎉", text: "ممتاز! برافو عليك!" },
    { emoji: "🌟", text: "يا سلام! إجابة صح!" },
    { emoji: "👏", text: "شاطر! كفو عليك!" },
    { emoji: "💪", text: "زين! استمر چذي!" },
  ];

  // رسائل تشجيعية — بدون أي لغة سلبية
  const ENCOURAGE_MESSAGES = [
    { emoji: "😊", text: "قريب! جرّب مرة ثانية" },
    { emoji: "👂", text: "اسمع الكلمة مرة ثانية" },
    { emoji: "🌈", text: "تقدر! حاول مرة ثانية" },
  ];

  const BADGES = [
    { id: "first-lesson", emoji: "🎉", name: "أول درس",        desc: "خلّصت أول درس لك",          check: (s) => s.totalLearningDays >= 1 },
    { id: "streak-3",     emoji: "🔥", name: "٣ أيام متتالية",  desc: "تعلمت ٣ أيام ورا بعض",       check: (s) => s.streak >= 3 },
    { id: "streak-7",     emoji: "🏅", name: "أسبوع كامل",      desc: "تعلمت ٧ أيام ورا بعض",       check: (s) => s.streak >= 7 },
    { id: "stars-50",     emoji: "⭐", name: "٥٠ نجمة",         desc: "جمعت ٥٠ نجمة",               check: (s) => s.stars >= 50 },
    { id: "stars-100",    emoji: "🌟", name: "١٠٠ نجمة",        desc: "جمعت ١٠٠ نجمة",              check: (s) => s.stars >= 100 },
    { id: "words-10",     emoji: "📚", name: "١٠ كلمات",        desc: "تعلمت ١٠ كلمات كويتية",      check: (s) => introducedCount(s) >= 10 },
    { id: "words-25",     emoji: "📖", name: "٢٥ كلمة",         desc: "تعلمت ٢٥ كلمة كويتية",       check: (s) => introducedCount(s) >= 25 },
    { id: "mastered-10",  emoji: "🏆", name: "بطل الإتقان",     desc: "أتقنت ١٠ كلمات",             check: (s) => masteredCount(s) >= 10 },
    { id: "perfect",      emoji: "💯", name: "درس كامل",        desc: "درس كامل من أول محاولة",     check: (s) => s.hadPerfectLesson === true },
    { id: "level-5",      emoji: "🎖️", name: "المستوى ٥",       desc: "وصلت المستوى الخامس",        check: (s) => levelFromStars(s.stars) >= 5 },
  ];

  const WORDS = window.KUWAITI_WORDS || [];
  const CATEGORIES = window.WORD_CATEGORIES || {};

  /* ═══════════════ أيقونات SVG خطية مودرن (بدل الإيموجي في الأزرار) ═══════════════ */

  const svgIcon = (paths) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  const ICONS = {
    speaker: svgIcon('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.2 6a9 9 0 0 1 0 12"/>'),
    slow: svgIcon('<path d="M4.5 14.5a7.5 6 0 0 1 14.6-2"/><path d="M2.5 16h17"/><circle cx="20.2" cy="14" r="1.7"/><path d="M7.5 16v2.2M14.5 16v2.2"/>'),
    replay: svgIcon('<path d="M3.5 12a8.5 8.5 0 1 0 2.9-6.4"/><path d="M3.5 4.5v5.2h5.2"/>'),
    back: svgIcon('<path d="M9.5 5.5 16 12l-6.5 6.5"/>'),
    user: svgIcon('<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20c.9-3.6 3.9-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/>'),
    trophy: svgIcon('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H4.8A3.2 3.2 0 0 0 8 9M16 5.5h3.2A3.2 3.2 0 0 1 16 9"/><path d="M12 13v3.5"/><path d="M8.5 20.5h7M9.5 16.5h5v4h-5z"/>'),
    bulb: svgIcon('<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1.1 1.2 1.3 2.1h4.4c.2-.9.6-1.6 1.3-2.1A6 6 0 0 0 12 3z"/>'),
  };

  // حقن الأيقونات في الأزرار الثابتة (الإيموجي في HTML يبقى احتياطاً بلا JS)
  function injectIcons() {
    const set = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
    set("btn-lesson-audio", ICONS.speaker + "<span>اسمع الكلمة</span>");
    set("btn-lesson-audio-slow", ICONS.slow);
    set("btn-audio-replay", ICONS.replay);
    set("btn-example-audio", ICONS.speaker);
    set("btn-example-audio-slow", ICONS.slow);
    set("btn-parents", ICONS.user);
    set("btn-quiz-help", ICONS.bulb + "<span>علّمني الجواب</span>");
    set("btn-rewards", ICONS.trophy + "<span>جوائزي وأوسمتي</span>");
    set("btn-review-words", ICONS.replay + "<span>راجع كلماتي السابقة</span>");
    ["btn-lesson-back", "btn-quiz-back", "btn-rewards-back", "btn-parents-back"].forEach((id) =>
      set(id, "<span>رجوع</span>" + ICONS.back));
  }

  /* ═══════════════ النطق عند مرور الماوس (لطفل لا يقرأ بعد) ═══════════════ */

  let hoverKey = "";
  let hoverAt = 0;

  // ينطق مرة واحدة لكل عنصر خلال ثانية ونصف حتى لا يتكرر الصوت بإزعاج
  function hoverSpeak(key, play) {
    const now = Date.now();
    if (key === hoverKey && now - hoverAt < 1500) return;
    hoverKey = key;
    hoverAt = now;
    play();
  }

  // يجعل العنصر ناطقاً: مرور الماوس يسمع النطق، وتلميح نصي يعرض التشكيل
  function makeSpeakable(el, getPlay, opts = {}) {
    el.classList.add("speakable");
    el.addEventListener("mouseenter", () => hoverSpeak(opts.key || el.textContent, getPlay()));
    if (opts.clickToo) {
      el.addEventListener("click", () => getPlay()());
    }
  }

  /* ═══════════════ أدوات مساعدة ═══════════════ */

  const $ = (id) => document.getElementById(id);

  function todayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function toArabicDigits(n) {
    return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function wordById(id) {
    return WORDS.find((w) => w.id === id);
  }

  function difficultyLabel(d) {
    return d >= 3 ? "⭐⭐⭐ صعبة" : d === 2 ? "⭐⭐ متوسطة" : "⭐ سهلة";
  }

  function categoryLabel(key) {
    const c = CATEGORIES[key];
    return c ? `${c.emoji} ${c.label}` : key;
  }

  function levelFromStars(stars) {
    return Math.floor(stars / STARS_PER_LEVEL) + 1;
  }

  /* ═══════════════ صور الكلمات ═══════════════ */

  // يختار عشوائياً بين الصورة الأساسية وبدائلها (ألوان/أحجام/زوايا
  // مختلفة) حتى يتعلم الطفل معنى الكلمة لا شكل صورة واحدة.
  function pickImageSrc(word) {
    const list = [word.image, ...(word.imageVariations || [])].filter(Boolean);
    return list.length ? pick(list) : null;
  }

  // ينشئ عنصر صورة مع سلسلة احتياط لا تكسر الدرس أبداً:
  // البديل المختار ← الصورة الأساسية ← placeholder.svg ← إيموجي
  function makeWordImg(word) {
    const src = pickImageSrc(word);
    if (!src) return emojiFallback(word);

    const img = document.createElement("img");
    img.className = "word-img";
    img.alt = word.imageAlt || word.standardArabic;
    img.decoding = "async";
    img.draggable = false;

    let step = 0;
    img.onerror = () => {
      step++;
      if (step === 1 && src !== word.image && word.image) {
        img.src = word.image;
      } else if (step <= 2 && window.IMAGE_FALLBACK && img.src.indexOf(window.IMAGE_FALLBACK) === -1) {
        img.src = window.IMAGE_FALLBACK;
      } else {
        img.onerror = null;
        img.replaceWith(emojiFallback(word));
      }
    };
    img.src = src;
    return img;
  }

  function emojiFallback(word) {
    const span = document.createElement("span");
    span.textContent = word.emoji || "🖼️";
    span.setAttribute("role", "img");
    span.setAttribute("aria-label", word.standardArabic);
    return span;
  }

  /* ═══════════════ الحالة و Local Storage ═══════════════ */

  function defaultState() {
    return {
      profile: null, // {username, avatar, color}
      stars: 0,
      streak: 0,
      lastLessonDate: null,   // آخر يوم اكتمل فيه الدرس
      totalLearningDays: 0,
      totalTimeMs: 0,
      attemptsTotal: 0,
      attemptsCorrect: 0,
      hadPerfectLesson: false,
      badges: [],
      settings: { sound: true },
      // تقدم كل كلمة: يبدأ من قيم words.js الافتراضية وينسخ هنا
      // { [id]: {introduced, intervalIndex, reviewDate, correctAnswers, wrongAnswers} }
      wordsProgress: {},
      // درس اليوم
      daily: null, // {date, wordIds, newIds, answeredIds, completed, starsEarned, correctCount}
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* مساحة التخزين ممتلئة — نتجاهل بأمان في النموذج الأولي */
    }
  }

  function progressFor(id) {
    if (!state.wordsProgress[id]) {
      const w = wordById(id);
      state.wordsProgress[id] = {
        introduced: null,
        intervalIndex: -1,
        reviewDate: w ? w.reviewDate : null,
        correctAnswers: w ? w.correctAnswers : 0,
        wrongAnswers: w ? w.wrongAnswers : 0,
      };
    }
    return state.wordsProgress[id];
  }

  function introducedCount(s) {
    return Object.values(s.wordsProgress).filter((p) => p.introduced).length;
  }

  function masteredCount(s) {
    return Object.values(s.wordsProgress).filter((p) => p.intervalIndex >= MASTERED_INDEX).length;
  }

  function dueReviewIds(s, date = todayStr()) {
    return Object.entries(s.wordsProgress)
      .filter(([, p]) => p.introduced && p.reviewDate && p.reviewDate <= date)
      // الكلمات الأكثر خطأً تظهر أولاً (وبالتالي أكثر تكراراً)
      .sort((a, b) => (b[1].wrongAnswers - b[1].correctAnswers) - (a[1].wrongAnswers - a[1].correctAnswers))
      .map(([id]) => Number(id));
  }

  /* ═══════════════ الصوت: نطق عربي تلقائي (Web Speech API) ═══════════════ */

  /*
    نظام الصوت معياري ومعزول عن نظام الدروس بالكامل:
    الدروس تستدعي AudioPlayer.playWord / playExample / replay فقط.
    لاستبداله لاحقاً بتسجيلات كويتية حقيقية أو صوت مولّد بالذكاء
    الاصطناعي: أضف للكلمة حقل audio بمسارات ملفات، مثال:
      audio: { word: "audio/dresha.mp3", example: "audio/dresha-ex.mp3" }
    فيشغّل المشغّل الملف تلقائياً بدل نطق المتصفح — دون أي تغيير
    في نظام الدروس. (لا توجد حالياً أي مسارات ملفات في البيانات.)
  */

  const SPEED = { normal: 0.85, slow: 0.55 };

  // أصوات المتصفح فصيحة ولا تعرف بعض حروف اللهجة، فنقرّب النص لها:
  // چ → تش، گ → ق، پ → ب، ڤ → ف، مع حذف التطويل
  function normalizeForTTS(text) {
    return String(text)
      .replace(/چ/g, "تش")
      .replace(/گ/g, "ق")
      .replace(/پ/g, "ب")
      .replace(/ڤ/g, "ف")
      .replace(/ـ/g, "");
  }

  let arabicVoice = null;

  // يكتشف تلقائياً أفضل صوت عربي متاح على جهاز المستخدم:
  // ar-KW أولاً، ثم ar-SA، ثم أي صوت عربي. لا نستخدم صوتاً إنجليزياً أبداً.
  function detectArabicVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices();
    arabicVoice =
      voices.find((v) => /^ar[-_]KW/i.test(v.lang)) ||
      voices.find((v) => /^ar[-_]SA/i.test(v.lang)) ||
      voices.find((v) => /^ar/i.test(v.lang)) ||
      null;
  }

  /**
   * ينطق نصاً عربياً بالسرعة المطلوبة.
   * @param {string} text  النص العربي
   * @param {"normal"|"slow"} speed  سرعة النطق
   * @param {HTMLElement} [btn]  زر يُضاء أثناء التشغيل
   */
  function speakArabic(text, speed = "normal", btn) {
    try {
      if (!("speechSynthesis" in window) || !text) return;
      speechSynthesis.cancel(); // أوقف أي نطق جارٍ

      const u = new SpeechSynthesisUtterance(normalizeForTTS(text));
      // صوت عربي فقط — إن لم يوجد أي صوت عربي نكتفي بتحديد اللغة
      // ونترك المتصفح يختار، ولا نُسند صوتاً غير عربي إطلاقاً.
      if (arabicVoice) {
        u.voice = arabicVoice;
        u.lang = arabicVoice.lang;
      } else {
        u.lang = "ar-KW";
      }
      u.rate = SPEED[speed] || SPEED.normal;
      u.pitch = 1.05;

      if (btn) {
        btn.classList.add("playing");
        u.onend = u.onerror = () => btn.classList.remove("playing");
      }
      speechSynthesis.speak(u);
    } catch {
      // أي خطأ في النطق لا يكسر الدرس أبداً
      if (btn) btn.classList.remove("playing");
    }
  }

  const AudioPlayer = {
    last: null, // آخر تشغيل — لزر الإعادة 🔁

    init() {
      if (!("speechSynthesis" in window)) return;
      detectArabicVoice();
      speechSynthesis.onvoiceschanged = detectArabicVoice;
    },

    playWord(word, speed = "normal", btn) {
      // tts: نص منطوق مُشكَّل بالحركات لتحسين نطق أصوات المتصفح
      this.last = { text: word.tts || word.kuwaitiWord, speed, file: word.audio && word.audio.word };
      this._play(this.last, btn);
    },

    playExample(word, speed = "normal", btn) {
      this.last = { text: word.ttsExample || word.example, speed, file: word.audio && word.audio.example };
      this._play(this.last, btn);
    },

    replay(btn) {
      if (this.last) this._play(this.last, btn);
    },

    _play(item, btn) {
      if (item.file) {
        this._playFile(item.file, btn);
      } else {
        speakArabic(item.text, item.speed, btn);
      }
    },

    _playFile(src, btn) {
      try {
        const a = new Audio(src);
        if (btn) {
          btn.classList.add("playing");
          a.onended = a.onerror = () => btn.classList.remove("playing");
        }
        a.play().catch(() => btn && btn.classList.remove("playing"));
      } catch {
        if (btn) btn.classList.remove("playing");
      }
    },
  };

  // مؤثرات صوتية بسيطة عبر Web Audio (تُطفأ من لوحة الأهل)
  const SFX = {
    ctx: null,

    _ensure() {
      if (!state.settings.sound) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },

    _tone(freq, start, dur, type = "sine", gain = 0.12) {
      const ctx = this._ensure();
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    },

    correct() { this._tone(660, 0, 0.15); this._tone(880, 0.12, 0.2); },
    tryAgain() { this._tone(330, 0, 0.25, "triangle", 0.08); },
    star() { this._tone(1046, 0, 0.12); this._tone(1318, 0.1, 0.18); },
    levelUp() { [523, 659, 784, 1046].forEach((f, i) => this._tone(f, i * 0.12, 0.18)); },
    click() { this._tone(500, 0, 0.06, "square", 0.05); },
  };

  /* ═══════════════ التنقل بين الشاشات ═══════════════ */

  const SCREENS = ["screen-setup", "screen-dashboard", "screen-lesson", "screen-quiz", "screen-results", "screen-rewards", "screen-parents"];

  function showScreen(id) {
    SCREENS.forEach((s) => { $(s).hidden = s !== id; });
    window.scrollTo({ top: 0 });
  }

  function applyAccent() {
    if (state.profile && state.profile.color) {
      document.documentElement.style.setProperty("--accent", state.profile.color);
    }
  }

  /* ═══════════════ 1) شاشة الإعداد ═══════════════ */

  let chosenAvatar = AVATARS[0];
  let chosenColor = FAVORITE_COLORS[0];

  function buildSetupScreen() {
    const avatarGrid = $("avatar-grid");
    avatarGrid.innerHTML = "";
    AVATARS.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "avatar-option";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === 0 ? "true" : "false");
      b.setAttribute("aria-label", `الشخصية ${a}`);
      b.textContent = a;
      b.addEventListener("click", () => {
        chosenAvatar = a;
        avatarGrid.querySelectorAll(".avatar-option").forEach((el) => el.setAttribute("aria-checked", "false"));
        b.setAttribute("aria-checked", "true");
        SFX.click();
      });
      avatarGrid.appendChild(b);
    });

    const colorGrid = $("color-grid");
    colorGrid.innerHTML = "";
    FAVORITE_COLORS.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "color-option";
      b.style.background = c;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === 0 ? "true" : "false");
      b.setAttribute("aria-label", `لون ${c}`);
      b.addEventListener("click", () => {
        chosenColor = c;
        colorGrid.querySelectorAll(".color-option").forEach((el) => el.setAttribute("aria-checked", "false"));
        b.setAttribute("aria-checked", "true");
        document.documentElement.style.setProperty("--accent", c);
        SFX.click();
      });
      colorGrid.appendChild(b);
    });

    $("setup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const username = $("input-username").value.trim();
      if (!username) {
        $("input-username").focus();
        return;
      }
      state.profile = { username, avatar: chosenAvatar, color: chosenColor };
      saveState();
      applyAccent();
      SFX.levelUp();
      renderDashboard();
      showScreen("screen-dashboard");
    });
  }

  /* ═══════════════ درس اليوم: اختيار الكلمات ═══════════════ */

  function ensureDaily() {
    const today = todayStr();
    if (state.daily && state.daily.date === today) {
      // إذا تغيّر حجم الدرس في تحديث ولم يكتمل درس اليوم، نولّده من جديد
      if (state.daily.completed || state.daily.wordIds.length === DAILY_TOTAL) {
        return state.daily;
      }
    }

    const introduced = new Set(
      Object.entries(state.wordsProgress)
        .filter(([, p]) => p.introduced)
        .map(([id]) => Number(id))
    );

    // كلمات المراجعة المستحقة (الأخطاء أولاً)
    let reviewIds = dueReviewIds(state, today).slice(0, REVIEW_WORDS_PER_DAY);

    // كلمات جديدة لم تُعرض من قبل
    let newIds = shuffle(WORDS.filter((w) => !introduced.has(w.id)).map((w) => w.id))
      .slice(0, NEW_WORDS_PER_DAY);

    // تعبئة النواقص: جديدة إضافية بدل المراجعة أو العكس
    let need = DAILY_TOTAL - (reviewIds.length + newIds.length);
    if (need > 0) {
      const extraNew = shuffle(
        WORDS.filter((w) => !introduced.has(w.id) && !newIds.includes(w.id)).map((w) => w.id)
      ).slice(0, need);
      newIds = newIds.concat(extraNew);
      need = DAILY_TOTAL - (reviewIds.length + newIds.length);
    }
    if (need > 0) {
      // كل الكلمات الجديدة انتهت — نراجع الأقدم مراجعةً
      const extraReview = Object.entries(state.wordsProgress)
        .filter(([id, p]) => p.introduced && !reviewIds.includes(Number(id)))
        .sort((a, b) => String(a[1].reviewDate).localeCompare(String(b[1].reviewDate)))
        .map(([id]) => Number(id))
        .slice(0, need);
      reviewIds = reviewIds.concat(extraReview);
    }

    state.daily = {
      date: today,
      newIds,
      reviewIds,
      wordIds: newIds.concat(reviewIds),
      answeredIds: [],
      completed: false,
      starsEarned: 0,
      correctCount: 0,
    };
    saveState();
    return state.daily;
  }

  /* ═══════════════ 2) لوحة الطفل ═══════════════ */

  function renderDashboard() {
    const daily = ensureDaily();
    const p = state.profile;

    $("dash-avatar").textContent = p.avatar;
    $("dash-username").textContent = p.username;
    $("dash-level").textContent = `المستوى ${toArabicDigits(levelFromStars(state.stars))}`;

    $("stat-stars").textContent = toArabicDigits(state.stars);
    $("stat-streak").textContent = toArabicDigits(state.streak);
    $("stat-words").textContent = toArabicDigits(introducedCount(state));

    renderLevelProgress("level-progressbar", "level-progress-fill", "level-progress-stars");

    // نقاط تقدم اليوم
    const dots = $("today-dots");
    dots.innerHTML = "";
    const total = daily.wordIds.length || DAILY_TOTAL;
    for (let i = 0; i < total; i++) {
      const d = document.createElement("span");
      d.className = "today-dot" + (i < daily.answeredIds.length ? " done" : "");
      dots.appendChild(d);
    }

    const startBtn = $("btn-start-lesson");
    if (daily.completed) {
      $("today-status").textContent = "خلّصت درس اليوم! 🎉 تقدر تراجع كلماتك";
      startBtn.textContent = "مراجعة إضافية";
    } else if (daily.answeredIds.length > 0) {
      $("today-status").textContent = `كمّلت ${toArabicDigits(daily.answeredIds.length)} من ${toArabicDigits(total)} — كمّل!`;
      startBtn.textContent = "كمّل درس اليوم";
    } else {
      $("today-status").textContent = "جاهز حق درس اليوم؟";
      startBtn.textContent = "ابدأ درس اليوم";
    }
  }

  function renderLevelProgress(barId, fillId, starsId) {
    const into = state.stars % STARS_PER_LEVEL;
    const pct = Math.round((into / STARS_PER_LEVEL) * 100);
    $(fillId).style.width = pct + "%";
    $(barId).setAttribute("aria-valuenow", pct);
    $(starsId).textContent = `⭐ ${toArabicDigits(into)} / ${toArabicDigits(STARS_PER_LEVEL)}`;
  }

  /* ═══════════════ جلسة التعلم (درس + اختبار) ═══════════════ */

  let session = null;

  function startDailySession() {
    const daily = ensureDaily();
    if (daily.completed) {
      startReviewSession();
      return;
    }
    const remaining = daily.wordIds.filter((id) => !daily.answeredIds.includes(id));
    session = {
      mode: "daily",
      lessonQueue: remaining.slice(),
      lessonIdx: 0,
      quizQueue: shuffle(remaining),
      quizIdx: 0,
      correctCount: 0,
      starsEarned: 0,
      allFirstTry: true,
      wrongThisQuestion: false,
      startTime: Date.now(),
    };
    showLessonCard();
    showScreen("screen-lesson");
  }

  function startReviewSession() {
    const introduced = Object.entries(state.wordsProgress)
      .filter(([, p]) => p.introduced)
      .map(([id]) => Number(id));

    if (introduced.length === 0) {
      $("today-status").textContent = "أول شي خلّص درس اليوم، بعدين راجع 😊";
      return;
    }

    // المستحقة أولاً ثم البقية بالأقدم مراجعة
    const due = dueReviewIds(state);
    const rest = introduced.filter((id) => !due.includes(id));
    const queue = due.concat(shuffle(rest)).slice(0, DAILY_TOTAL);

    session = {
      mode: "review",
      lessonQueue: [],
      lessonIdx: 0,
      quizQueue: shuffle(queue),
      quizIdx: 0,
      correctCount: 0,
      starsEarned: 0,
      allFirstTry: true,
      wrongThisQuestion: false,
      startTime: Date.now(),
    };
    showQuizQuestion();
    showScreen("screen-quiz");
  }

  function endSessionTime() {
    if (session && session.startTime) {
      state.totalTimeMs += Date.now() - session.startTime;
      session.startTime = null;
      saveState();
    }
  }

  /* ── مرحلة الدرس: النشاط ١ (شوف الصورة واسمع الكلمة) ── */

  function showLessonCard() {
    const daily = state.daily;
    const id = session.lessonQueue[session.lessonIdx];
    const w = wordById(id);
    const total = session.lessonQueue.length;

    const pct = Math.round(((session.lessonIdx + 1) / total) * 100);
    $("lesson-progress-fill").style.width = pct + "%";
    $("lesson-progressbar").setAttribute("aria-valuenow", pct);
    $("lesson-counter").textContent = `${toArabicDigits(session.lessonIdx + 1)} / ${toArabicDigits(total)}`;

    const isNew = daily.newIds.includes(id);
    const tag = $("lesson-word-tag");
    tag.textContent = isNew ? "كلمة جديدة ✨" : "مراجعة 🔁";
    tag.classList.toggle("review", !isNew);

    // تنويع العرض: صورة مختلفة (لون/حجم/زاوية) كل مرة + ميلان بسيط
    const img = $("lesson-word-image");
    img.innerHTML = "";
    img.appendChild(makeWordImg(w));
    img.style.transform = `rotate(${(Math.random() * 8 - 4).toFixed(1)}deg) scale(${(0.94 + Math.random() * 0.12).toFixed(2)})`;

    const kw = $("lesson-word-kuwaiti");
    kw.textContent = w.kuwaitiWord;
    kw.setAttribute("data-tts", w.tts || w.kuwaitiWord);
    kw.style.color = pick(WORD_COLORS);
    kw.style.fontSize = `clamp(2.2rem, ${(8 + Math.random() * 3).toFixed(1)}vw, ${(2.8 + Math.random() * 0.8).toFixed(2)}rem)`;

    $("lesson-word-meaning").textContent = w.standardArabic;
    $("lesson-word-english").textContent = w.english || "";
    $("lesson-word-example").textContent = w.example;
    $("lesson-word-category").textContent = categoryLabel(w.category);
    $("lesson-word-difficulty").textContent = difficultyLabel(w.difficulty);

    // إعادة تشغيل حركة البطاقة
    const card = $("lesson-word-card");
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";

    $("btn-lesson-next").textContent =
      session.lessonIdx + 1 >= total ? "يلّا نلعب!" : "التالي";

    AudioPlayer.playWord(w, "normal", $("btn-lesson-audio"));
  }

  function lessonNext() {
    SFX.click();
    if (session.lessonIdx + 1 >= session.lessonQueue.length) {
      showQuizQuestion();
      showScreen("screen-quiz");
    } else {
      session.lessonIdx++;
      showLessonCard();
    }
  }

  /* ── مرحلة الاختبار: الأنشطة ٢ و ٣ و ٤ ── */

  function currentQuizWord() {
    return wordById(session.quizQueue[session.quizIdx]);
  }

  // نوع النشاط لكل سؤال: يتناوب بين ٢ (اسمع→صورة) و٣ (صورة→كلمة) و٤ (أكمل الجملة)
  function questionType(word, idx) {
    const cycle = [2, 3, 4][idx % 3];
    if (cycle === 4 && !exampleTokenFor(word)) return 3;
    return cycle;
  }

  // يرجع الكلمة (المقطع) داخل الجملة التي تحتوي الكلمة الكويتية، أو null
  function exampleTokenFor(word) {
    const base = word.kuwaitiWord.replace(/[؟!.,،]/g, "");
    if (!base) return null;
    const tokens = word.example.split(/\s+/);
    const hit = tokens.find((t) => t.replace(/[؟!.,،]/g, "").includes(base));
    return hit || null;
  }

  function distractorsFor(word, count, unique) {
    const sameCat = WORDS.filter((w) => w.id !== word.id && w.category === word.category);
    const others = WORDS.filter((w) => w.id !== word.id && w.category !== word.category);
    const pool = shuffle(sameCat).concat(shuffle(others));
    const out = [];
    const seen = new Set([unique(word)]);
    for (const w of pool) {
      if (out.length >= count) break;
      const k = unique(w);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(w);
    }
    return out;
  }

  function showQuizQuestion() {
    const w = currentQuizWord();
    const total = session.quizQueue.length;
    const type = questionType(w, session.quizIdx);
    session.wrongThisQuestion = false;

    const pct = Math.round((session.quizIdx / total) * 100);
    $("quiz-progress-fill").style.width = pct + "%";
    $("quiz-progressbar").setAttribute("aria-valuenow", pct);
    $("quiz-counter").textContent = `${toArabicDigits(session.quizIdx + 1)} / ${toArabicDigits(total)}`;

    $("quiz-feedback").hidden = true;
    $("btn-quiz-help").hidden = false;
    const stimulus = $("quiz-stimulus");
    const options = $("quiz-options");
    stimulus.innerHTML = "";
    options.innerHTML = "";

    if (type === 2) buildListenChooseImage(w, stimulus, options);
    else if (type === 3) buildImageChooseWord(w, stimulus, options);
    else buildCompleteSentence(w, stimulus, options);
  }

  /* النشاط ٢: اسمع الكلمة واختر الصورة */
  function buildListenChooseImage(w, stimulus, options) {
    $("quiz-question").textContent = "اسمع الكلمة واختر الصورة الصحيحة 👂";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stimulus-audio-btn";
    btn.setAttribute("aria-label", "اسمع الكلمة بسرعة عادية");
    btn.innerHTML = ICONS.speaker;
    btn.addEventListener("click", () => AudioPlayer.playWord(w, "normal", btn));
    stimulus.appendChild(btn);

    const caption = document.createElement("span");
    caption.className = "stimulus-caption";
    caption.textContent = "اضغط السماعة واسمع الكلمة 👆";
    stimulus.appendChild(caption);

    const slow = document.createElement("button");
    slow.type = "button";
    slow.className = "btn btn-audio btn-audio-small";
    slow.setAttribute("aria-label", "اسمع الكلمة ببطء");
    slow.innerHTML = ICONS.slow;
    slow.addEventListener("click", () => AudioPlayer.playWord(w, "slow", slow));
    stimulus.appendChild(slow);

    const choices = shuffle([w, ...distractorsFor(w, 3, (x) => x.image || x.emoji)]);
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-option";
      b.setAttribute("aria-label", c.standardArabic);
      const holder = document.createElement("span");
      holder.className = "option-image";
      holder.appendChild(makeWordImg(c));
      // تنويع بسيط في عرض الصورة
      holder.style.transform = `scale(${(0.92 + Math.random() * 0.16).toFixed(2)}) rotate(${(Math.random() * 8 - 4).toFixed(1)}deg)`;
      b.appendChild(holder);
      b.dataset.correct = c.id === w.id ? "1" : "";
      b.addEventListener("click", () => handleAnswer(b, c.id === w.id, w));
      options.appendChild(b);
    });

    AudioPlayer.playWord(w, "normal", btn);
  }

  // تلميح صغير يظهر في أنشطة اختيار الكلمة: كل خيار له سماعة
  function addSpeakHint(stimulus) {
    const hint = document.createElement("span");
    hint.className = "stimulus-caption";
    hint.textContent = "اضغط السماعة في كل خيار واسمعه 🔊";
    stimulus.appendChild(hint);
  }

  /* النشاط ٣: شوف الصورة واختر الكلمة الكويتية */
  function buildImageChooseWord(w, stimulus, options) {
    $("quiz-question").textContent = "شوف الصورة واختر الكلمة الكويتية 👀";

    const holder = document.createElement("div");
    holder.className = "stimulus-image";
    holder.appendChild(makeWordImg(w));
    holder.style.transform = `rotate(${(Math.random() * 8 - 4).toFixed(1)}deg)`;
    stimulus.appendChild(holder);
    addSpeakHint(stimulus);

    buildWordOptions(w, options);
  }

  /* النشاط ٤: أكمل الجملة الكويتية */
  function buildCompleteSentence(w, stimulus, options) {
    $("quiz-question").textContent = "أكمل الجملة الكويتية ✍️";

    const token = exampleTokenFor(w);
    const sentence = document.createElement("div");
    sentence.className = "stimulus-sentence";
    sentence.setAttribute("lang", "ar");

    w.example.split(/\s+/).forEach((t, i, arr) => {
      if (t === token) {
        const blank = document.createElement("span");
        blank.className = "blank";
        blank.textContent = "؟";
        sentence.appendChild(blank);
      } else {
        sentence.appendChild(document.createTextNode(t));
      }
      if (i < arr.length - 1) sentence.appendChild(document.createTextNode(" "));
    });
    makeSpeakable(sentence, () => () => AudioPlayer.playExample(w), { key: w.example });
    stimulus.appendChild(sentence);

    const hint = document.createElement("button");
    hint.type = "button";
    hint.className = "btn btn-audio btn-audio-small";
    hint.setAttribute("aria-label", "اسمع الجملة كاملة");
    hint.innerHTML = ICONS.speaker;
    hint.addEventListener("click", () => AudioPlayer.playExample(w, "normal", hint));
    stimulus.appendChild(hint);
    addSpeakHint(stimulus);

    buildWordOptions(w, options, () => {
      // عند الإجابة الصحيحة نظهر الكلمة في الفراغ
      const blank = sentence.querySelector(".blank");
      if (blank) blank.textContent = token;
    });
  }

  function buildWordOptions(w, options, onCorrectExtra) {
    const choices = shuffle([w, ...distractorsFor(w, 3, (x) => x.kuwaitiWord)]);
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-option quiz-option-word";

      // زر سماعة داخل كل خيار: الطفل الذي لا يقرأ يسمع الخيار
      // أولاً ثم يختار — الضغط عليه لا يُحسب إجابة أبداً
      const sp = document.createElement("span");
      sp.className = "option-speak";
      sp.setAttribute("role", "button");
      sp.setAttribute("tabindex", "0");
      sp.setAttribute("aria-label", "اسمع هذا الخيار");
      sp.innerHTML = ICONS.speaker;
      sp.addEventListener("click", (e) => {
        e.stopPropagation();
        AudioPlayer.playWord(c, "normal");
      });
      sp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          AudioPlayer.playWord(c, "normal");
        }
      });
      b.appendChild(sp);
      const span = document.createElement("span");
      span.className = "option-word";
      span.setAttribute("lang", "ar");
      span.textContent = c.kuwaitiWord;
      // تنويع اللون والحجم حتى لا يرتبط الشكل بالإجابة
      span.style.color = pick(WORD_COLORS);
      span.style.fontSize = (1.15 + Math.random() * 0.45).toFixed(2) + "rem";
      b.appendChild(span);
      b.dataset.correct = c.id === w.id ? "1" : "";
      b.setAttribute("data-tts", c.tts || c.kuwaitiWord);
      makeSpeakable(b, () => () => AudioPlayer.playWord(c), { key: c.kuwaitiWord });
      b.addEventListener("click", () => {
        const ok = c.id === w.id;
        if (ok && onCorrectExtra) onCorrectExtra();
        handleAnswer(b, ok, w);
      });
      options.appendChild(b);
    });
  }

  /* ── معالجة الإجابة ── */

  function handleAnswer(btn, isCorrect, word) {
    state.attemptsTotal++;
    if (isCorrect) state.attemptsCorrect++;

    const prog = progressFor(word.id);

    if (!isCorrect) {
      prog.wrongAnswers++;
      session.wrongThisQuestion = true;
      session.allFirstTry = false;
      saveState();

      btn.classList.add("wrong");
      SFX.tryAgain();
      // رسالة تشجيعية ثم إتاحة المحاولة من جديد
      const msg = pick(ENCOURAGE_MESSAGES);
      showFeedback(msg.emoji, msg.text, false);
      setTimeout(() => {
        $("quiz-feedback").hidden = true;
        btn.classList.remove("wrong");
        btn.classList.add("dimmed");
        btn.disabled = true;
      }, 1500);
      // نعيد سماع الكلمة ببطء لمساعدته
      AudioPlayer.playWord(word, "slow");
      return;
    }

    // إجابة صحيحة
    const firstTry = !session.wrongThisQuestion;
    $("btn-quiz-help").hidden = true;
    btn.classList.add("correct");
    $("quiz-options").querySelectorAll(".quiz-option").forEach((el) => {
      el.disabled = true;
      if (el !== btn) el.classList.add("dimmed");
    });

    prog.correctAnswers++;
    applySRS(word.id, firstTry);

    session.correctCount++;
    if (firstTry) {
      session.starsEarned++;
      state.stars++;
      SFX.star();
    } else {
      SFX.correct();
    }

    if (session.mode === "daily") {
      const daily = state.daily;
      if (!daily.answeredIds.includes(word.id)) daily.answeredIds.push(word.id);
      daily.correctCount = session.correctCount;
      daily.starsEarned += firstTry ? 1 : 0;
    }
    saveState();

    const msg = pick(PRAISE_MESSAGES);
    showFeedback(msg.emoji, firstTry ? `${msg.text} ⭐ +١` : msg.text, true);
  }

  function showFeedback(emoji, text, withNext) {
    const fb = $("quiz-feedback");
    fb.hidden = false;
    fb.classList.toggle("celebrate", withNext);
    fb.classList.toggle("encourage", !withNext);
    $("feedback-emoji").textContent = emoji;
    $("feedback-text").textContent = text;
    $("btn-quiz-next").hidden = !withNext;
    if (withNext) {
      $("btn-quiz-next").textContent =
        session.quizIdx + 1 >= session.quizQueue.length ? "شوف نتيجتك!" : "كمّل";
    }
  }

  /* زر "علّمني الجواب": يكشف الإجابة الصحيحة بلطف ويجدول الكلمة
     للمراجعة، حتى لا يعلق الطفل في أي سؤال */
  function quizHelp() {
    const word = currentQuizWord();
    if (!word || !$("quiz-feedback").hidden) return;

    state.attemptsTotal++;
    const prog = progressFor(word.id);
    prog.wrongAnswers++;
    session.wrongThisQuestion = true;
    session.allFirstTry = false;
    applySRS(word.id, false);

    $("btn-quiz-help").hidden = true;
    $("quiz-options").querySelectorAll(".quiz-option").forEach((el) => {
      el.disabled = true;
      if (el.dataset.correct === "1") el.classList.add("correct");
      else el.classList.add("dimmed");
    });

    if (session.mode === "daily") {
      const daily = state.daily;
      if (!daily.answeredIds.includes(word.id)) daily.answeredIds.push(word.id);
    }
    saveState();

    AudioPlayer.playWord(word, "slow");
    showFeedback("🌟", `ولا يهمك! الجواب هو: ${word.kuwaitiWord}`, true);
  }

  function quizNext() {
    SFX.click();
    if (session.quizIdx + 1 >= session.quizQueue.length) {
      finishSession();
    } else {
      session.quizIdx++;
      showQuizQuestion();
    }
  }

  /* ── التكرار المتباعد (SRS) ── */

  function applySRS(wordId, success) {
    const prog = progressFor(wordId);
    const today = todayStr();

    if (!prog.introduced) {
      // كلمة جديدة: أول مراجعة بكرة
      prog.introduced = today;
      prog.intervalIndex = 0;
      prog.reviewDate = todayStr(SRS_INTERVALS[0]);
      return;
    }

    if (success) {
      // نجاح: ننتقل للفاصل الأطول التالي (١ ← ٣ ← ٧ ← ١٤)
      prog.intervalIndex = Math.min(prog.intervalIndex + 1, MASTERED_INDEX);
      prog.reviewDate = todayStr(SRS_INTERVALS[prog.intervalIndex]);
    } else {
      // تعثّر: نرجع للبداية فتظهر الكلمة أكثر (بكرة)
      prog.intervalIndex = 0;
      prog.reviewDate = todayStr(SRS_INTERVALS[0]);
    }
  }

  /* ═══════════════ 5) شاشة النتائج ═══════════════ */

  function finishSession() {
    endSessionTime();

    const total = session.quizQueue.length;
    const levelBefore = levelFromStars(state.stars - session.starsEarned);
    const levelAfter = levelFromStars(state.stars);

    let newBadge = null;

    if (session.mode === "daily") {
      const daily = state.daily;
      const today = todayStr();

      if (!daily.completed && daily.answeredIds.length >= daily.wordIds.length) {
        daily.completed = true;

        // عدّاد الأيام والسلسلة (مرة واحدة يومياً)
        if (state.lastLessonDate !== today) {
          state.totalLearningDays++;
          state.streak = state.lastLessonDate === todayStr(-1) ? state.streak + 1 : 1;
          state.lastLessonDate = today;
        }
        if (session.allFirstTry && total >= DAILY_TOTAL) state.hadPerfectLesson = true;
      }
    }

    // فحص الأوسمة الجديدة
    for (const b of BADGES) {
      if (!state.badges.includes(b.id) && b.check(state)) {
        state.badges.push(b.id);
        if (!newBadge) newBadge = b;
      }
    }
    saveState();

    // تعبئة الشاشة
    const isReview = session.mode === "review";
    $("results-trophy").textContent = isReview ? "🔁" : levelAfter > levelBefore ? "🎖️" : "🏆";
    $("results-title").textContent =
      levelAfter > levelBefore
        ? `وصلت المستوى ${toArabicDigits(levelAfter)}! 🎉`
        : session.allFirstTry
        ? "يا سلام عليك! 🎉"
        : "أحسنت! تعلمت شي يديد!";
    $("results-subtitle").textContent = isReview ? "خلّصت المراجعة!" : "خلّصت درس اليوم!";

    $("results-correct").textContent = `${toArabicDigits(session.correctCount)} / ${toArabicDigits(total)}`;
    $("results-stars-earned").textContent = toArabicDigits(session.starsEarned);
    $("results-streak").textContent = toArabicDigits(state.streak);

    // نجوم متحركة من ٥ حسب نسبة أول محاولة
    const starsBox = $("results-stars");
    starsBox.innerHTML = "";
    const earnedOf5 = Math.max(1, Math.round((session.starsEarned / Math.max(total, 1)) * 5));
    for (let i = 0; i < 5; i++) {
      const s = document.createElement("span");
      s.className = "result-star" + (i < earnedOf5 ? "" : " dim");
      s.textContent = "⭐";
      starsBox.appendChild(s);
    }

    const badgeBox = $("results-new-badge");
    if (newBadge) {
      badgeBox.hidden = false;
      $("new-badge-emoji").textContent = newBadge.emoji;
      $("new-badge-text").textContent = `وسام جديد: ${newBadge.name} — ${newBadge.desc}`;
    } else {
      badgeBox.hidden = true;
    }

    showScreen("screen-results");
    launchConfetti();
    if (levelAfter > levelBefore) SFX.levelUp();
    else SFX.star();
  }

  function launchConfetti() {
    const box = $("confetti-container");
    box.innerHTML = "";
    const colors = FAVORITE_COLORS.concat(["#ffd166", "#fff"]);
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = pick(colors);
      c.style.width = c.style.height = 8 + Math.random() * 8 + "px";
      c.style.animationDuration = 2 + Math.random() * 2.5 + "s";
      c.style.animationDelay = Math.random() * 0.8 + "s";
      box.appendChild(c);
    }
    setTimeout(() => (box.innerHTML = ""), 6000);
  }

  /* ═══════════════ 6) شاشة الجوائز ═══════════════ */

  function renderRewards() {
    $("rewards-stars").textContent = toArabicDigits(state.stars);
    $("rewards-level").textContent = toArabicDigits(levelFromStars(state.stars));
    $("rewards-streak").textContent = toArabicDigits(state.streak);
    renderLevelProgress("rewards-progressbar", "rewards-progress-fill", "rewards-level-stars");

    const grid = $("badges-grid");
    grid.innerHTML = "";
    BADGES.forEach((b) => {
      const unlocked = state.badges.includes(b.id);
      const card = document.createElement("div");
      card.className = "badge-card" + (unlocked ? "" : " locked");

      const emoji = document.createElement("span");
      emoji.className = "badge-emoji";
      emoji.textContent = unlocked ? b.emoji : "🔒";

      const name = document.createElement("span");
      name.className = "badge-name";
      name.textContent = b.name;

      const desc = document.createElement("span");
      desc.className = "badge-desc";
      desc.textContent = b.desc;

      card.append(emoji, name, desc);
      grid.appendChild(card);
    });
  }

  /* ═══════════════ 7) لوحة الأهل ═══════════════ */

  function renderParents() {
    $("parent-days").textContent = toArabicDigits(state.totalLearningDays);
    $("parent-mastered").textContent = toArabicDigits(masteredCount(state));
    $("parent-review").textContent = toArabicDigits(dueReviewIds(state).length);

    const acc = state.attemptsTotal
      ? Math.round((state.attemptsCorrect / state.attemptsTotal) * 100)
      : 0;
    $("parent-accuracy").textContent = toArabicDigits(acc) + "٪";

    const mins = Math.round(state.totalTimeMs / 60000);
    $("parent-time").textContent = `${toArabicDigits(mins)} د`;

    // الفئات
    const list = $("parent-categories-list");
    list.innerHTML = "";
    let completedCats = 0;

    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const catWords = WORDS.filter((w) => w.category === key);
      if (!catWords.length) return;
      const mastered = catWords.filter(
        (w) => (state.wordsProgress[w.id] || {}).intervalIndex >= MASTERED_INDEX
      ).length;
      const complete = mastered === catWords.length;
      if (complete) completedCats++;

      const row = document.createElement("div");
      row.className = "category-row" + (complete ? " complete" : "");

      const head = document.createElement("div");
      head.className = "category-row-head";

      const name = document.createElement("span");
      name.textContent = `${cat.emoji} ${cat.label}` + (complete ? " ✅" : "");

      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = `${toArabicDigits(mastered)} / ${toArabicDigits(catWords.length)} متقنة`;

      head.append(name, count);

      const track = document.createElement("div");
      track.className = "progress-track";
      const fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.width = Math.round((mastered / catWords.length) * 100) + "%";
      track.appendChild(fill);

      row.append(head, track);
      list.appendChild(row);
    });

    $("parent-categories").textContent = toArabicDigits(completedCats);

    $("toggle-sound").setAttribute("aria-checked", state.settings.sound ? "true" : "false");
  }

  /* ═══════════════ ربط الأحداث ═══════════════ */

  function bindEvents() {
    // اللوحة الرئيسية
    $("btn-start-lesson").addEventListener("click", () => { SFX.click(); startDailySession(); });
    $("btn-review-words").addEventListener("click", () => { SFX.click(); startReviewSession(); });
    $("btn-rewards").addEventListener("click", () => { SFX.click(); renderRewards(); showScreen("screen-rewards"); });
    $("btn-parents").addEventListener("click", () => { SFX.click(); renderParents(); showScreen("screen-parents"); });

    // الدرس — أزرار الصوت: عادي 🔊، بطيء 🐢، إعادة 🔁
    const lessonWord = () => wordById(session.lessonQueue[session.lessonIdx]);
    $("btn-lesson-audio").addEventListener("click", () =>
      AudioPlayer.playWord(lessonWord(), "normal", $("btn-lesson-audio")));
    $("btn-lesson-audio-slow").addEventListener("click", () =>
      AudioPlayer.playWord(lessonWord(), "slow", $("btn-lesson-audio-slow")));
    $("btn-audio-replay").addEventListener("click", () =>
      AudioPlayer.replay($("btn-audio-replay")));
    $("btn-example-audio").addEventListener("click", () =>
      AudioPlayer.playExample(lessonWord(), "normal", $("btn-example-audio")));
    $("btn-example-audio-slow").addEventListener("click", () =>
      AudioPlayer.playExample(lessonWord(), "slow", $("btn-example-audio-slow")));

    // النطق عند مرور الماوس أو لمس الكلمة/الجملة — لطفل لا يقرأ بعد
    makeSpeakable($("lesson-word-kuwaiti"), () => () => AudioPlayer.playWord(lessonWord()), { clickToo: true });
    makeSpeakable($("lesson-word-example"), () => () => AudioPlayer.playExample(lessonWord()), { clickToo: true });
    $("btn-lesson-next").addEventListener("click", lessonNext);
    $("btn-lesson-back").addEventListener("click", () => { endSessionTime(); goHome(); });

    // الاختبار
    $("btn-quiz-next").addEventListener("click", quizNext);
    $("btn-quiz-help").addEventListener("click", quizHelp);
    $("btn-quiz-back").addEventListener("click", () => { endSessionTime(); goHome(); });

    // النتائج
    $("btn-results-home").addEventListener("click", () => { SFX.click(); goHome(); });
    $("btn-results-rewards").addEventListener("click", () => { SFX.click(); renderRewards(); showScreen("screen-rewards"); });

    // الجوائز ولوحة الأهل
    $("btn-rewards-back").addEventListener("click", goHome);
    $("btn-parents-back").addEventListener("click", goHome);

    // مفتاح المؤثرات الصوتية
    $("toggle-sound").addEventListener("click", () => {
      state.settings.sound = !state.settings.sound;
      saveState();
      $("toggle-sound").setAttribute("aria-checked", state.settings.sound ? "true" : "false");
      SFX.click();
    });

    // إعادة تعيين التقدم
    $("btn-reset-progress").addEventListener("click", () => { $("modal-reset").hidden = false; });
    $("btn-reset-cancel").addEventListener("click", () => { $("modal-reset").hidden = true; });
    $("btn-reset-confirm").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    $("modal-reset").addEventListener("click", (e) => {
      if (e.target === $("modal-reset")) $("modal-reset").hidden = true;
    });
  }

  function goHome() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    renderDashboard();
    showScreen("screen-dashboard");
  }

  /* ═══════════════ الإقلاع ═══════════════ */

  function init() {
    if (!WORDS.length) {
      document.body.textContent = "خطأ: ملف الكلمات words.js غير محمّل.";
      return;
    }
    AudioPlayer.init();
    injectIcons();
    buildSetupScreen();
    bindEvents();

    if (state.profile) {
      applyAccent();
      renderDashboard();
      showScreen("screen-dashboard");
    } else {
      showScreen("screen-setup");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
