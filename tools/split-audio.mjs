/*
  تقطيع ملف صوتي واحد إلى مقاطع كلمات — للأصوات الكويتية الحقيقية.

  الفكرة: المستخدم يسجل/يولّد ملفاً واحداً يقرأ فيه كل الكلمات
  بترتيب دليل RECORDING-GUIDE.md مع سكتة واضحة (ثانية+) بين كل
  كلمة. هذا السكربت يكشف السكتات ويقص المقاطع ويسميها بأسماء
  الكلمات تلقائياً.

  الاستخدام:
    node tools/split-audio.mjs <ملف الصوت> words     ← مقاطع الكلمات الأربعين
    node tools/split-audio.mjs <ملف الصوت> examples  ← مقاطع الجمل الأربعين

  الناتج: ملفات mp3 في assets/audio/ بأسماء <slug>.mp3 أو
  <slug>-example.mp3، ويطبع تقريراً بعدد المقاطع المكتشفة —
  إن لم يطابق ٤٠ فسيقترح ضبط عتبات الكشف.
*/

import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ffmpeg كامل (نسخة Playwright المدمجة مقصوصة ولا تصلح):
//   npm install @ffmpeg-installer/linux-x64
// أو مرر مساراً آخر عبر متغير البيئة FFMPEG_PATH
const FFMPEG =
  process.env.FFMPEG_PATH ||
  "/tmp/claude-0/-home-user-kuwaids/c4ee84c3-3996-5bd4-a388-d06b09fbffd3/scratchpad/node_modules/@ffmpeg-installer/linux-x64/ffmpeg";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "audio");

// عتبات كشف السكوت: مدة السكوت الفاصل بالثواني ومستواه بالديسيبل
const SILENCE_DUR = process.env.SIL_DUR || "0.7";
const SILENCE_DB = process.env.SIL_DB || "-35dB";

const [, , input, mode = "words"] = process.argv;
if (!input) {
  console.error("الاستخدام: node tools/split-audio.mjs <ملف> words|examples");
  process.exit(1);
}

/* ترتيب الكلمات نفسه المعتمد في دليل التسجيل (من words.js) */
const win = {};
eval(readFileSync(join(ROOT, "images.js"), "utf8").replace(/window\./g, "win."));
eval(readFileSync(join(ROOT, "words.js"), "utf8").replace(/window\./g, "win."));
const slugs = win.KUWAITI_WORDS.map((w) =>
  win.WORD_IMAGES[w.id].main.split("/").pop().replace(/\.(jpg|svg)$/, "")
);

/* ١) كشف السكتات */
const log = execSync(
  `"${FFMPEG}" -i "${input}" -af silencedetect=noise=${SILENCE_DB}:d=${SILENCE_DUR} -f null - 2>&1`,
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
);

const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
const durMatch = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
const total = durMatch ? +durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3] : 0;

/* ٢) بناء مقاطع الكلام بين السكتات */
const segments = [];
let cursor = 0;
for (let i = 0; i < starts.length; i++) {
  if (starts[i] - cursor > 0.25) segments.push([cursor, starts[i]]);
  cursor = ends[i] ?? starts[i];
}
if (total - cursor > 0.25) segments.push([cursor, total]);

console.log(`المقاطع المكتشفة: ${segments.length} (المطلوب: ${slugs.length})`);
if (segments.length !== slugs.length) {
  console.log("⚠️ العدد لا يطابق — جرّب تعديل العتبات، مثال:");
  console.log("   SIL_DUR=0.5 SIL_DB=-30dB node tools/split-audio.mjs ...");
  console.log("أطوال المقاطع:", segments.map(([a, b]) => (b - a).toFixed(1)).join(", "));
  process.exit(2);
}

/* ٣) قص كل مقطع وتسميته (مع هامش ١٠٠م.ث حول الكلام) */
mkdirSync(OUT, { recursive: true });
segments.forEach(([a, b], i) => {
  const name = mode === "examples" ? `${slugs[i]}-example.mp3` : `${slugs[i]}.mp3`;
  const from = Math.max(0, a - 0.1);
  const dur = b - a + 0.2;
  execSync(
    `"${FFMPEG}" -y -i "${input}" -ss ${from.toFixed(2)} -t ${dur.toFixed(2)} ` +
    `-codec:a libmp3lame -b:a 96k "${join(OUT, name)}" 2>/dev/null`
  );
  console.log(`✓ ${name} (${(b - a).toFixed(1)} ثانية)`);
});
console.log("تم! المقاطع في assets/audio/");
