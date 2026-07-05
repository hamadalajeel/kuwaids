/*
  مولّد الرسوم التوضيحية — assets/images/words/*.svg و images.js

  يرسم كل كلمة بأسلوب موحّد (أشكال مسطحة، حدود داكنة مستديرة، خلفية
  شفافة، عنصر واحد واضح، بدون نصوص أو شعارات) وينتج لكل كلمة:
    slug.svg        الصورة الأساسية
    slug-alt1.svg   تلوين مختلف
    slug-alt2.svg   تلوين مختلف ثانٍ
    slug-small.svg  حجم أصغر داخل الإطار
    slug-tilt.svg   زاوية مائلة (+ تلوين مختلف)

  التشغيل:  node tools/generate-images.mjs
*/

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "images", "words");
mkdirSync(OUT, { recursive: true });

/* أسلوب موحّد */
const S = "#3a4159"; // لون الحدود
const K = `stroke="${S}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
const SKIN = "#f8cfa6";
const CREAM = "#fbf7ef";

const line2 = (x1, y1, x2, y2, c, w = 12) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${S}" stroke-width="${w + 6}" stroke-linecap="round" fill="none"/>` +
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

const path2 = (d, c, w = 12) =>
  `<path d="${d}" stroke="${S}" stroke-width="${w + 6}" stroke-linecap="round" fill="none"/>` +
  `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

function starPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}
const star = (cx, cy, r, fill) => `<path d="${starPath(cx, cy, r)}" fill="${fill}" ${K}/>`;

const face = (cx, cy) =>
  `<circle cx="${cx - 11}" cy="${cy - 3}" r="3.5" fill="${S}"/>` +
  `<circle cx="${cx + 11}" cy="${cy - 3}" r="3.5" fill="${S}"/>` +
  `<path d="M${cx - 9} ${cy + 9} Q${cx} ${cy + 17} ${cx + 9} ${cy + 9}" stroke="${S}" stroke-width="4" fill="none" stroke-linecap="round"/>`;

/* ── تعريف رسمة كل كلمة ──
   colors: [أساسي، بديل١، بديل٢] — كلمات الألوان تُبقي لونها ثابتاً
   needsCustom: يحتاج رسماً نهائياً مخصصاً (عنصر كويتي ثقافي)        */
const WORDS = [
  { id: 1, slug: "dresha", alt: "نافذة", colors: ["#fb923c", "#60a5fa", "#34d399"],
    draw: (c) =>
      `<rect x="45" y="30" width="110" height="135" rx="12" fill="${c}" ${K}/>` +
      `<rect x="59" y="44" width="82" height="107" rx="6" fill="#cfe9ff" ${K}/>` +
      `<line x1="100" y1="46" x2="100" y2="149" ${K}/>` +
      `<line x1="61" y1="98" x2="139" y2="98" ${K}/>` +
      `<circle cx="78" cy="66" r="9" fill="#fff" opacity="0.8"/>` },

  { id: 2, slug: "hoosh", alt: "فناء البيت", needsCustom: true, colors: ["#f87171", "#60a5fa", "#34d399"],
    draw: (c) =>
      `<rect x="62" y="72" width="76" height="58" fill="${CREAM}" ${K}/>` +
      `<path d="M50 74 L100 34 L150 74 Z" fill="${c}" ${K}/>` +
      `<rect x="88" y="94" width="24" height="36" rx="4" fill="${c}" ${K}/>` +
      [0, 1, 2, 3, 4].map((i) => `<rect x="${42 + i * 29}" y="136" width="12" height="30" rx="5" fill="#fff" ${K}/>`).join("") +
      `<line x1="40" y1="150" x2="160" y2="150" ${K}/>` },

  { id: 3, slug: "mkhadda", alt: "وسادة", colors: ["#a78bfa", "#2dd4bf", "#f472b6"],
    draw: (c) =>
      `<path d="M40 70 Q100 58 160 70 Q168 100 160 130 Q100 142 40 130 Q32 100 40 70 Z" fill="${c}" ${K}/>` +
      `<circle cx="80" cy="100" r="4" fill="#fff"/><circle cx="100" cy="100" r="4" fill="#fff"/><circle cx="120" cy="100" r="4" fill="#fff"/>` },

  { id: 4, slug: "doolab", alt: "خزانة", colors: ["#b08968", "#60a5fa", "#2dd4bf"],
    draw: (c) =>
      `<rect x="55" y="28" width="90" height="138" rx="10" fill="${c}" ${K}/>` +
      `<line x1="100" y1="28" x2="100" y2="166" ${K}/>` +
      `<circle cx="89" cy="98" r="4.5" fill="${S}"/><circle cx="111" cy="98" r="4.5" fill="${S}"/>` +
      `<rect x="62" y="166" width="12" height="10" fill="${S}"/><rect x="126" y="166" width="12" height="10" fill="${S}"/>` },

  { id: 5, slug: "gooti", alt: "علبة", colors: ["#f87171", "#34d399", "#fb923c"],
    draw: (c) =>
      `<rect x="63" y="52" width="74" height="110" rx="12" fill="${c}" ${K}/>` +
      `<rect x="63" y="86" width="74" height="38" fill="#fff" ${K}/>` +
      `<ellipse cx="100" cy="52" rx="37" ry="13" fill="#e7edf4" ${K}/>` +
      `<ellipse cx="100" cy="52" rx="20" ry="6" fill="#cdd7e1" stroke="${S}" stroke-width="3"/>` },

  { id: 6, slug: "istikana", alt: "استكانة شاي", needsCustom: true, colors: ["#2dd4bf", "#f87171", "#a78bfa"],
    draw: (c) =>
      `<ellipse cx="100" cy="154" rx="48" ry="11" fill="${c}" ${K}/>` +
      `<path d="M68 52 L132 52 C132 78 114 86 114 100 C114 116 128 124 128 148 L72 148 C72 124 86 116 86 100 C86 86 68 78 68 52 Z" fill="#eef6f9" ${K}/>` +
      `<path d="M76 60 L124 60 C122 78 108 86 108 98 L92 98 C92 86 78 78 76 60 Z" fill="#c46d1f"/>` +
      `<line x1="68" y1="52" x2="132" y2="52" stroke="#d9a92c" stroke-width="6" stroke-linecap="round"/>` },

  { id: 7, slug: "mallas", alt: "ملعقة", colors: ["#94a3b8", "#fb923c", "#2dd4bf"],
    draw: (c) =>
      line2(92, 92, 148, 148, c, 13) +
      `<g transform="rotate(45 68 70)"><ellipse cx="68" cy="70" rx="25" ry="34" fill="${c}" ${K}/>` +
      `<ellipse cx="68" cy="66" rx="14" ry="20" fill="#fff" opacity="0.35"/></g>` },

  { id: 8, slug: "jidir", alt: "قِدر", colors: ["#60a5fa", "#f87171", "#94a3b8"],
    draw: (c) =>
      `<path d="M74 34 Q80 22 86 34 M108 30 Q114 18 120 30" stroke="${S}" stroke-width="4" fill="none" opacity="0.5" stroke-linecap="round"/>` +
      `<circle cx="100" cy="62" r="8" fill="${S}"/>` +
      `<ellipse cx="100" cy="80" rx="54" ry="13" fill="#e7edf4" ${K}/>` +
      `<path d="M50 80 L150 80 L146 138 Q100 156 54 138 Z" fill="${c}" ${K}/>` +
      `<circle cx="42" cy="98" r="10" fill="none" ${K}/><circle cx="158" cy="98" r="10" fill="none" ${K}/>` },

  { id: 9, slug: "junta", alt: "حقيبة مدرسية", needsCustom: true, colors: ["#f87171", "#60a5fa", "#34d399"],
    draw: (c) =>
      `<path d="M78 52 C78 32 122 32 122 52" fill="none" ${K}/>` +
      `<rect x="53" y="52" width="94" height="110" rx="26" fill="${c}" ${K}/>` +
      `<rect x="70" y="104" width="60" height="48" rx="14" fill="#fff" ${K}/>` +
      `<line x1="70" y1="122" x2="130" y2="122" ${K}/>` +
      `<circle cx="100" cy="138" r="5" fill="${S}"/>` },

  { id: 10, slug: "barraya", alt: "مبراة", colors: ["#34d399", "#f87171", "#60a5fa"],
    draw: (c) =>
      `<rect x="70" y="84" width="82" height="56" rx="12" fill="${c}" ${K}/>` +
      `<circle cx="94" cy="112" r="11" fill="${S}"/>` +
      `<circle cx="134" cy="98" r="4" fill="${S}"/>` +
      `<g transform="rotate(18 52 108)">` +
      `<rect x="8" y="100" width="62" height="17" rx="4" fill="#fbbf24" ${K}/>` +
      `<path d="M70 100 L90 108.5 L70 117 Z" fill="${CREAM}" ${K}/>` +
      `<path d="M82 103.5 L90 108.5 L82 113.5 Z" fill="${S}"/></g>` +
      `<path d="M156 66 Q170 58 166 44 M148 60 Q156 52 154 44" stroke="${S}" stroke-width="4" fill="none" opacity="0.4" stroke-linecap="round"/>` },

  { id: 11, slug: "daftar", alt: "دفتر", colors: ["#fb923c", "#a78bfa", "#2dd4bf"],
    draw: (c) =>
      `<rect x="58" y="38" width="88" height="124" rx="10" fill="${c}" ${K}/>` +
      [0, 1, 2, 3].map((i) => `<circle cx="58" cy="${58 + i * 28}" r="6" fill="#fff" ${K}/>`).join("") +
      `<line x1="78" y1="72" x2="132" y2="72" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      `<line x1="78" y1="98" x2="132" y2="98" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      `<line x1="78" y1="124" x2="118" y2="124" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` },

  { id: 12, slug: "dishdasha", alt: "دشداشة كويتية", needsCustom: true, colors: ["#2dd4bf", "#fb923c", "#a78bfa"],
    draw: (c) =>
      `<circle cx="100" cy="100" r="78" fill="${c}" opacity="0.22"/>` +
      `<path d="M82 36 L118 36 L126 50 L146 162 L54 162 L74 50 Z" fill="${CREAM}" ${K}/>` +
      `<path d="M88 36 Q100 48 112 36" fill="none" ${K}/>` +
      `<line x1="100" y1="44" x2="100" y2="96" ${K}/>` +
      `<circle cx="100" cy="56" r="2.8" fill="${S}"/><circle cx="100" cy="70" r="2.8" fill="${S}"/>` },

  { id: 13, slug: "jooti", alt: "حذاء رياضي", colors: ["#60a5fa", "#f87171", "#34d399"],
    draw: (c) =>
      `<path d="M42 122 C42 100 62 94 80 94 C96 94 100 106 116 113 C136 122 158 122 158 136 L158 144 L42 144 Z" fill="${c}" ${K}/>` +
      `<rect x="38" y="140" width="124" height="16" rx="8" fill="#fff" ${K}/>` +
      `<line x1="78" y1="102" x2="92" y2="112" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` +
      `<line x1="88" y1="98" x2="102" y2="108" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` },

  { id: 14, slug: "ghitra", alt: "غترة وعقال", needsCustom: true, colors: ["#fb923c", "#2dd4bf", "#a78bfa"],
    draw: (c) =>
      `<circle cx="100" cy="108" r="80" fill="${c}" opacity="0.2"/>` +
      `<path d="M60 96 L60 150 L82 112 L118 112 L140 150 L140 96 Z" fill="${CREAM}" ${K}/>` +
      `<circle cx="100" cy="96" r="34" fill="${SKIN}" ${K}/>` +
      `<path d="M62 88 C62 44 138 44 138 88 C126 66 74 66 62 88 Z" fill="${CREAM}" ${K}/>` +
      `<path d="M68 70 C82 56 118 56 132 70" stroke="#222" stroke-width="9" fill="none" stroke-linecap="round"/>` +
      face(100, 100) },

  { id: 15, slug: "naal", alt: "نعال", needsCustom: true, colors: ["#34d399", "#60a5fa", "#fb923c"],
    draw: (c) =>
      `<g transform="rotate(8 128 96)"><ellipse cx="128" cy="96" rx="26" ry="46" fill="${c}" opacity="0.75" ${K}/>` +
      `<path d="M128 66 L116 92 M128 66 L140 92" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/></g>` +
      `<g transform="rotate(-6 78 112)"><ellipse cx="78" cy="112" rx="28" ry="50" fill="${c}" ${K}/>` +
      `<path d="M78 80 L64 108 M78 80 L92 108" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/></g>` },

  { id: 16, slug: "gattu", alt: "قطة", colors: ["#fb923c", "#94a3b8", "#b08968"],
    draw: (c) =>
      `<ellipse cx="100" cy="132" rx="46" ry="32" fill="${c}" ${K}/>` +
      `<path d="M148 128 C168 122 172 100 160 92" fill="none" stroke="${S}" stroke-width="15" stroke-linecap="round"/>` +
      `<path d="M148 128 C166 123 169 103 159 96" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M74 58 L70 32 L92 46 Z" fill="${c}" ${K}/><path d="M126 58 L130 32 L108 46 Z" fill="${c}" ${K}/>` +
      `<circle cx="100" cy="76" r="33" fill="${c}" ${K}/>` +
      face(100, 76) +
      `<path d="M60 72 L42 68 M60 80 L42 82 M140 72 L158 68 M140 80 L158 82" stroke="${S}" stroke-width="3.5" stroke-linecap="round"/>` },

  { id: 17, slug: "diyaya", alt: "دجاجة", colors: ["#fb923c", "#b08968", "#f87171"],
    draw: (c) =>
      `<path d="M78 44 Q74 28 86 32 Q86 20 96 26 Q100 14 106 28" fill="#f87171" ${K}/>` +
      `<path d="M58 96 C58 62 116 52 138 74 C158 94 146 144 104 148 C70 150 58 122 58 96 Z" fill="#fff" ${K}/>` +
      `<path d="M60 78 L44 84 L60 92 Z" fill="#fb923c" ${K}/>` +
      `<circle cx="76" cy="72" r="4" fill="${S}"/>` +
      `<path d="M96 96 C112 88 132 96 128 112 C124 126 100 124 96 96 Z" fill="${c}" ${K}/>` +
      line2(96, 148, 92, 168, "#fb923c", 6) + line2(116, 148, 118, 168, "#fb923c", 6) },

  { id: 18, slug: "baeer", alt: "جمل", colors: ["#e6be82", "#d4a86c", "#b08968"],
    draw: (c) =>
      `<ellipse cx="92" cy="118" rx="44" ry="27" fill="${c}" ${K}/>` +
      `<circle cx="92" cy="86" r="20" fill="${c}" ${K}/>` +
      path2("M128 108 C146 102 148 78 146 64", c, 15) +
      `<ellipse cx="149" cy="58" rx="15" ry="11" fill="${c}" ${K}/>` +
      `<circle cx="146" cy="55" r="3" fill="${S}"/>` +
      `<path d="M138 50 L132 42" stroke="${S}" stroke-width="4" stroke-linecap="round"/>` +
      line2(66, 136, 62, 168, c, 10) + line2(84, 140, 82, 170, c, 10) +
      line2(104, 140, 104, 170, c, 10) + line2(120, 136, 124, 168, c, 10) },

  { id: 19, slug: "simcha", alt: "سمكة", colors: ["#60a5fa", "#f87171", "#fb923c"],
    draw: (c) =>
      `<circle cx="168" cy="58" r="6" fill="none" stroke="${S}" stroke-width="3" opacity="0.5"/>` +
      `<circle cx="154" cy="40" r="4" fill="none" stroke="${S}" stroke-width="3" opacity="0.5"/>` +
      `<path d="M132 100 L164 78 L164 122 Z" fill="${c}" ${K}/>` +
      `<ellipse cx="88" cy="100" rx="50" ry="32" fill="${c}" ${K}/>` +
      `<path d="M80 68 Q92 52 104 68" fill="${c}" ${K}/>` +
      `<circle cx="62" cy="92" r="5" fill="${S}"/>` +
      `<path d="M84 100 Q92 108 100 100 M104 92 Q112 100 120 92" stroke="${S}" stroke-width="3.5" fill="none" opacity="0.5" stroke-linecap="round"/>` },

  { id: 20, slug: "samoon", alt: "صمونة", needsCustom: true, colors: ["#e8b04b", "#d99b32", "#c98a28"],
    draw: (c) =>
      `<path d="M36 100 C58 66 142 66 164 100 C142 134 58 134 36 100 Z" fill="${c}" ${K}/>` +
      `<path d="M72 88 L84 106 M96 84 L108 104 M120 88 L132 106" stroke="${S}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>` +
      `<ellipse cx="86" cy="86" rx="16" ry="6" fill="#fff" opacity="0.35"/>` },

  { id: 21, slug: "aish", alt: "صحن عيش", colors: ["#2dd4bf", "#f87171", "#a78bfa"],
    draw: (c) =>
      `<path d="M84 52 Q90 40 96 52 M108 48 Q114 36 120 48" stroke="${S}" stroke-width="4" fill="none" opacity="0.45" stroke-linecap="round"/>` +
      `<path d="M56 118 C56 82 144 82 144 118 Z" fill="#fff" ${K}/>` +
      [[76, 100], [92, 92], [110, 94], [124, 104], [98, 108]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.5" fill="none" stroke="${S}" stroke-width="2.5" opacity="0.5"/>`).join("") +
      `<path d="M42 118 L158 118 C154 140 128 150 100 150 C72 150 46 140 42 118 Z" fill="${c}" ${K}/>` },

  { id: 22, slug: "mai", alt: "كوب ماء", colors: ["#60a5fa", "#2dd4bf", "#a78bfa"],
    draw: (c) =>
      `<path d="M100 26 C110 40 116 46 116 54 C116 63 108 68 100 68 C92 68 84 63 84 54 C84 46 90 40 100 26 Z" fill="${c}" ${K}/>` +
      `<path d="M66 80 L134 80 L124 164 L76 164 Z" fill="#eaf6ff" ${K}/>` +
      `<path d="M72 104 Q86 96 100 104 Q114 112 128 104 L122 158 L78 158 Z" fill="${c}" opacity="0.75"/>` },

  { id: 23, slug: "rayoog", alt: "ريوق — بيضة", colors: ["#fb923c", "#2dd4bf", "#f472b6"],
    draw: (c) =>
      `<ellipse cx="100" cy="110" rx="66" ry="44" fill="${c}" ${K}/>` +
      `<path d="M64 104 C56 80 84 62 108 68 C136 74 148 96 136 112 C124 128 92 130 76 120 C68 115 66 110 64 104 Z" fill="#fff" ${K}/>` +
      `<circle cx="102" cy="96" r="15" fill="#fbbf24" ${K}/>` },

  { id: 24, slug: "motar", alt: "سيارة", colors: ["#f87171", "#60a5fa", "#fbbf24"],
    draw: (c) =>
      `<path d="M52 112 L60 88 C64 76 76 70 92 70 L114 70 C130 70 140 78 146 90 L154 112 Z" fill="${c}" ${K}/>` +
      `<path d="M70 88 C74 79 82 76 92 76 L96 76 L96 108 L64 108 Z" fill="#cfe9ff" ${K}/>` +
      `<path d="M104 76 L112 76 C124 76 132 82 136 90 L140 108 L104 108 Z" fill="#cfe9ff" ${K}/>` +
      `<rect x="38" y="108" width="124" height="28" rx="14" fill="${c}" ${K}/>` +
      `<circle cx="70" cy="140" r="16" fill="${S}"/><circle cx="70" cy="140" r="7" fill="#fff"/>` +
      `<circle cx="130" cy="140" r="16" fill="${S}"/><circle cx="130" cy="140" r="7" fill="#fff"/>` },

  { id: 25, slug: "seekal", alt: "دراجة", colors: ["#34d399", "#f87171", "#60a5fa"],
    draw: (c) =>
      `<circle cx="58" cy="128" r="30" fill="none" ${K}/><circle cx="142" cy="128" r="30" fill="none" ${K}/>` +
      `<circle cx="58" cy="128" r="5" fill="${S}"/><circle cx="142" cy="128" r="5" fill="${S}"/>` +
      `<path d="M58 128 L86 84 L128 84 L142 128 M86 84 L104 128 L58 128 M104 128 L128 84" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M80 84 L96 84 M128 84 L124 68 L136 64" stroke="${S}" stroke-width="6" fill="none" stroke-linecap="round"/>` },

  { id: 26, slug: "freej", alt: "فريج — بيوت", needsCustom: true, colors: ["#fb923c", "#2dd4bf", "#f472b6"],
    draw: (c) =>
      `<rect x="30" y="100" width="44" height="60" fill="${CREAM}" ${K}/><path d="M24 100 L52 76 L80 100 Z" fill="${c}" ${K}/>` +
      `<rect x="126" y="100" width="44" height="60" fill="${CREAM}" ${K}/><path d="M120 100 L148 76 L176 100 Z" fill="${c}" ${K}/>` +
      `<rect x="72" y="84" width="56" height="76" fill="#fff" ${K}/><path d="M66 84 L100 54 L134 84 Z" fill="${c}" ${K}/>` +
      `<rect x="90" y="122" width="20" height="38" rx="3" fill="${c}" ${K}/>` +
      `<rect x="42" y="112" width="16" height="14" fill="#cfe9ff" ${K}/><rect x="140" y="112" width="16" height="14" fill="#cfe9ff" ${K}/>` },

  { id: 27, slug: "darb", alt: "طريق", colors: ["#94a3b8", "#95a1b3", "#a5b0bc"],
    draw: (c) =>
      `<circle cx="156" cy="48" r="18" fill="#fbbf24" ${K}/>` +
      `<path d="M84 44 L116 44 L152 164 L48 164 Z" fill="${c}" ${K}/>` +
      `<line x1="100" y1="56" x2="100" y2="72" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` +
      `<line x1="100" y1="92" x2="100" y2="114" stroke="#fff" stroke-width="7" stroke-linecap="round"/>` +
      `<line x1="100" y1="134" x2="100" y2="158" stroke="#fff" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="38" cy="150" r="12" fill="#34d399" ${K}/><circle cx="166" cy="140" r="10" fill="#34d399" ${K}/>` },

  { id: 28, slug: "yadda", alt: "جدة", colors: ["#a78bfa", "#2dd4bf", "#f87171"],
    draw: (c) =>
      `<path d="M56 120 C48 44 152 44 144 120 C150 150 132 164 100 164 C68 164 50 150 56 120 Z" fill="${c}" ${K}/>` +
      `<circle cx="100" cy="102" r="38" fill="${SKIN}" ${K}/>` +
      `<path d="M62 92 C66 62 134 62 138 92 C124 76 76 76 62 92 Z" fill="${c}" ${K}/>` +
      `<circle cx="87" cy="99" r="10" fill="none" stroke="${S}" stroke-width="4"/>` +
      `<circle cx="113" cy="99" r="10" fill="none" stroke="${S}" stroke-width="4"/>` +
      `<line x1="97" y1="99" x2="103" y2="99" stroke="${S}" stroke-width="4"/>` +
      `<circle cx="87" cy="100" r="3" fill="${S}"/><circle cx="113" cy="100" r="3" fill="${S}"/>` +
      `<path d="M92 118 Q100 126 108 118" stroke="${S}" stroke-width="4" fill="none" stroke-linecap="round"/>` },

  { id: 29, slug: "yumma", alt: "أم", colors: ["#f472b6", "#2dd4bf", "#fb923c"],
    draw: (c) =>
      `<path d="M58 118 C50 46 150 46 142 118 C148 148 130 164 100 164 C70 164 52 148 58 118 Z" fill="${c}" ${K}/>` +
      `<circle cx="100" cy="100" r="38" fill="${SKIN}" ${K}/>` +
      `<path d="M62 92 C66 60 134 60 138 92 C124 74 76 74 62 92 Z" fill="${c}" ${K}/>` +
      face(100, 102) +
      `<circle cx="79" cy="108" r="6" fill="#f87171" opacity="0.35"/><circle cx="121" cy="108" r="6" fill="#f87171" opacity="0.35"/>` },

  { id: 30, slug: "iyal", alt: "أطفال", colors: ["#60a5fa", "#f472b6", "#34d399"],
    draw: (c) =>
      `<circle cx="68" cy="72" r="26" fill="${SKIN}" ${K}/>` +
      `<path d="M46 66 C50 44 86 44 90 66 C78 56 58 56 46 66 Z" fill="#5b4632" ${K}/>` +
      face(68, 76) +
      `<path d="M44 160 L48 116 C50 104 60 98 68 98 C76 98 86 104 88 116 L92 160 Z" fill="${c}" ${K}/>` +
      `<circle cx="132" cy="72" r="26" fill="${SKIN}" ${K}/>` +
      `<path d="M110 68 C112 44 152 44 154 68 L154 84 C146 66 118 66 110 84 Z" fill="#7a5c3e" ${K}/>` +
      face(132, 76) +
      `<path d="M108 160 L112 116 C114 104 124 98 132 98 C140 98 150 104 152 116 L156 160 Z" fill="#fbbf24" ${K}/>` +
      `<line x1="92" y1="126" x2="108" y2="126" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>` },

  { id: 31, slug: "baby", alt: "طفل رضيع", colors: ["#f472b6", "#60a5fa", "#34d399"],
    draw: (c) =>
      `<circle cx="100" cy="92" r="52" fill="${SKIN}" ${K}/>` +
      `<path d="M100 40 C96 28 108 22 112 32" stroke="${S}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<circle cx="82" cy="86" r="4.5" fill="${S}"/><circle cx="118" cy="86" r="4.5" fill="${S}"/>` +
      `<circle cx="72" cy="102" r="7" fill="#f87171" opacity="0.35"/><circle cx="128" cy="102" r="7" fill="#f87171" opacity="0.35"/>` +
      `<circle cx="100" cy="112" r="12" fill="${c}" ${K}/><circle cx="100" cy="112" r="5" fill="#fff" ${K}/>` +
      `<path d="M64 150 Q100 170 136 150 L130 168 Q100 180 70 168 Z" fill="${c}" ${K}/>` },

  { id: 32, slug: "rassasi", alt: "اللون الرصاصي", colors: ["#94a3b8", "#94a3b8", "#94a3b8"],
    draw: (c) =>
      `<path d="M100 40 C132 34 164 62 156 94 C172 106 158 138 132 132 C126 158 90 166 76 144 C50 150 36 122 50 106 C34 88 54 52 80 58 C84 46 92 42 100 40 Z" fill="${c}" ${K}/>` +
      `<circle cx="150" cy="150" r="9" fill="${c}" ${K}/><circle cx="52" cy="58" r="7" fill="${c}" ${K}/>` +
      `<ellipse cx="86" cy="84" rx="18" ry="10" fill="#fff" opacity="0.35"/>` },

  { id: 33, slug: "samawi", alt: "اللون السماوي", colors: ["#7dd3fc", "#7dd3fc", "#7dd3fc"],
    draw: (c) =>
      `<path d="M100 40 C132 34 164 62 156 94 C172 106 158 138 132 132 C126 158 90 166 76 144 C50 150 36 122 50 106 C34 88 54 52 80 58 C84 46 92 42 100 40 Z" fill="${c}" ${K}/>` +
      `<circle cx="150" cy="150" r="9" fill="${c}" ${K}/><circle cx="52" cy="58" r="7" fill="${c}" ${K}/>` +
      `<ellipse cx="86" cy="84" rx="18" ry="10" fill="#fff" opacity="0.45"/>` },

  { id: 34, slug: "wardi", alt: "اللون الوردي", colors: ["#f472b6", "#f472b6", "#f472b6"],
    draw: (c) =>
      `<path d="M100 40 C132 34 164 62 156 94 C172 106 158 138 132 132 C126 158 90 166 76 144 C50 150 36 122 50 106 C34 88 54 52 80 58 C84 46 92 42 100 40 Z" fill="${c}" ${K}/>` +
      `<circle cx="150" cy="150" r="9" fill="${c}" ${K}/><circle cx="52" cy="58" r="7" fill="${c}" ${K}/>` +
      `<ellipse cx="86" cy="84" rx="18" ry="10" fill="#fff" opacity="0.4"/>` },

  { id: 35, slug: "shlonak", alt: "تحية — يد تلوّح", colors: [SKIN, SKIN, SKIN],
    draw: (c) =>
      `<path d="M40 66 C30 76 28 92 34 104 M50 74 C44 82 43 92 47 100" stroke="${S}" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>` +
      `<rect x="72" y="78" width="58" height="62" rx="20" fill="${c}" ${K}/>` +
      [[76, 40], [92, 34], [108, 34], [124, 42]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="15" height="${86 - y}" rx="7.5" fill="${c}" ${K}/>`).join("") +
      `<rect x="122" y="92" width="34" height="17" rx="8.5" fill="${c}" ${K}/>` +
      `<path d="M84 156 L120 156 C124 148 122 140 118 136 L86 136 C80 140 80 150 84 156 Z" fill="#2dd4bf" ${K}/>` },

  { id: 36, slug: "wayed", alt: "نجوم كثيرة", colors: ["#fbbf24", "#fbbf24", "#fbbf24"],
    draw: (c) =>
      star(100, 92, 44, c) +
      star(46, 56, 18, c) + star(158, 60, 16, c) +
      star(48, 140, 14, c) + star(154, 138, 18, c) +
      star(100, 170, 11, c) },

  { id: 37, slug: "zain", alt: "إبهام لأعلى", colors: [SKIN, SKIN, SKIN],
    draw: (c) =>
      `<path d="M52 60 L60 46 M100 40 L100 26 M144 58 L152 46" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="52" y="98" width="26" height="60" rx="8" fill="#2dd4bf" ${K}/>` +
      `<path d="M78 158 L128 158 C142 158 148 148 144 138 C150 134 150 124 144 120 C150 114 148 104 140 102 L104 102 C108 88 112 70 102 62 C94 56 86 62 86 72 C86 88 78 98 78 106 Z" fill="${c}" ${K}/>` },

  { id: 38, slug: "yalla", alt: "طفل يركض", colors: ["#60a5fa", "#f87171", "#34d399"],
    draw: (c) =>
      `<path d="M26 78 L48 78 M20 100 L44 100 M28 122 L48 122" stroke="${S}" stroke-width="4" stroke-linecap="round" opacity="0.4"/>` +
      `<circle cx="124" cy="52" r="22" fill="${SKIN}" ${K}/>` +
      `<path d="M104 46 C108 26 140 26 144 48 C132 36 112 38 104 46 Z" fill="#5b4632" ${K}/>` +
      `<circle cx="130" cy="52" r="3.5" fill="${S}"/>` +
      `<path d="M126 60 Q132 65 138 60" stroke="${S}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
      `<path d="M96 118 L108 82 C112 72 122 72 126 80 L124 118 Z" fill="${c}" ${K}/>` +
      line2(110, 84, 74, 96, SKIN, 9) + line2(122, 86, 152, 106, SKIN, 9) +
      line2(102, 118, 76, 142, c, 10) + line2(118, 118, 138, 148, c, 10) +
      `<ellipse cx="70" cy="150" rx="14" ry="8" fill="#f87171" ${K}/>` +
      `<ellipse cx="144" cy="156" rx="14" ry="8" fill="#f87171" ${K}/>` },

  { id: 39, slug: "chithee", alt: "إصبع يشير", colors: [SKIN, SKIN, SKIN],
    draw: (c) =>
      `<rect x="74" y="86" width="56" height="58" rx="18" fill="${c}" ${K}/>` +
      `<rect x="82" y="34" width="17" height="70" rx="8.5" fill="${c}" ${K}/>` +
      `<path d="M104 96 L128 96 M104 112 L128 112" stroke="${S}" stroke-width="4" opacity="0.4" stroke-linecap="round"/>` +
      `<rect x="120" y="98" width="26" height="16" rx="8" fill="${c}" ${K}/>` +
      `<path d="M70 40 L60 32 M92 26 L92 16 M112 38 L120 30" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M84 160 L120 160 C124 152 122 148 118 144 L86 144 C82 148 80 154 84 160 Z" fill="#a78bfa" ${K}/>` },

  { id: 40, slug: "mashkoor", alt: "قلب شكر", colors: ["#f87171", "#f472b6", "#fb923c"],
    draw: (c) =>
      `<path d="M100 152 C36 110 52 48 100 76 C148 48 164 110 100 152 Z" fill="${c}" ${K}/>` +
      star(48, 48, 12, "#fbbf24") + star(156, 52, 14, "#fbbf24") + star(100, 26, 10, "#fbbf24") +
      `<ellipse cx="80" cy="92" rx="12" ry="7" fill="#fff" opacity="0.4" transform="rotate(-25 80 92)"/>` },
];

/* ── تجميع الملفات ── */
const shadow = `<ellipse cx="100" cy="180" rx="54" ry="9" fill="${S}" opacity="0.07"/>`;

const svg = (inner, transform = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">\n${shadow}` +
  (transform ? `<g transform="${transform}">${inner}</g>` : inner) +
  `\n</svg>\n`;

const manifest = {};

for (const w of WORDS) {
  const [c0, c1, c2] = w.colors;
  const files = {
    [`${w.slug}.svg`]: svg(w.draw(c0)),
    [`${w.slug}-alt1.svg`]: svg(w.draw(c1)),
    [`${w.slug}-alt2.svg`]: svg(w.draw(c2)),
    [`${w.slug}-small.svg`]: svg(w.draw(c0), "translate(100 100) scale(0.72) translate(-100 -100)"),
    [`${w.slug}-tilt.svg`]: svg(w.draw(c1), "rotate(-10 100 100)"),
  };
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(OUT, name), content);
  }
  const base = `assets/images/words/`;
  manifest[w.id] = {
    alt: w.alt,
    main: base + `${w.slug}.svg`,
    variations: [
      base + `${w.slug}-alt1.svg`,
      base + `${w.slug}-alt2.svg`,
      base + `${w.slug}-small.svg`,
      base + `${w.slug}-tilt.svg`,
    ],
    needsCustomIllustration: !!w.needsCustom,
  };
}

/* صورة احتياطية محايدة (إطار صورة بسيط) */
writeFileSync(
  join(OUT, "placeholder.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img">
<rect x="36" y="44" width="128" height="112" rx="16" fill="#eef1f5" ${K}/>
<circle cx="76" cy="82" r="12" fill="#fbbf24" ${K}/>
<path d="M52 140 L88 104 L110 126 L128 108 L148 140 Z" fill="#94a3b8" ${K}/>
</svg>\n`
);

/* توليد images.js */
const needsCustomList = WORDS.filter((w) => w.needsCustom).map((w) => w.slug).join("، ");
const manifestJs = `/* ═══════════════════════════════════════════════════════════════
   كلماتي الكويتية — فهرس الصور (images.js)

   ملف مولَّد بواسطة tools/generate-images.mjs — أعد تشغيله بعد أي
   تعديل على الرسوم:  node tools/generate-images.mjs

   يربط كل كلمة (بمعرّفها id في words.js) بصورتها الأساسية وبدائلها.
   الأنشطة تبدّل عشوائياً بين main و variations حتى يتعلم الطفل
   معنى الكلمة لا شكل صورة واحدة.

   needsCustomIllustration = true : عنصر كويتي ثقافي يحتاج رسماً
   نهائياً مخصصاً يطابق الشكل الكويتي بدقة (حالياً: ${needsCustomList}).
   الرسوم الحالية له مؤقتة تقريبية.
   ═══════════════════════════════════════════════════════════════ */

// الصورة الاحتياطية عند فشل تحميل أي صورة
const IMAGE_FALLBACK = "assets/images/words/placeholder.svg";

const WORD_IMAGES = ${JSON.stringify(manifest, null, 2)};

window.WORD_IMAGES = WORD_IMAGES;
window.IMAGE_FALLBACK = IMAGE_FALLBACK;
`;
writeFileSync(join(ROOT, "images.js"), manifestJs);

console.log(`generated ${WORDS.length * 5 + 1} SVGs in assets/images/words/ + images.js`);
