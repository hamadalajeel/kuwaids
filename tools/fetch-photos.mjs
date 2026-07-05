/*
  جلب صور حقيقية مفتوحة الرخصة من Wikimedia Commons لكلمات الموقع.

  الوضعان:
    node tools/fetch-photos.mjs candidates   ← ينزّل ٣ مرشحات لكل كلمة (للمعاينة)
    node tools/fetch-photos.mjs final        ← ينسخ المختارة من SELECTION إلى المشروع
                                                ويكتب credits وimages.js

  صور العائلة تبقى رسوماً (خصوصية الأطفال)، وكل صورة تُحفظ محلياً
  في assets/images/photos/ فلا يعتمد الموقع على أي رابط خارجي.
*/

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAND = "/tmp/claude-0/-home-user-kuwaids/c4ee84c3-3996-5bd4-a388-d06b09fbffd3/scratchpad/photo-candidates";
const OUT = join(ROOT, "assets", "images", "photos");
const UA = "KuwaidsKidsApp/1.0 (educational prototype; contact: none)";

/* استعلام البحث لكل كلمة (الكلمات العائلية غير مدرجة عمداً) */
const QUERIES = {
  dresha:    "white window frame house",
  hoosh:     "courtyard traditional house",
  mkhadda:   "white pillow bed",
  doolab:    "wooden wardrobe furniture",
  gooti:     "tin can food unopened",
  istikana:  "istikan tea glass",
  mallas:    "cooking ladle spoon",
  jidir:     "stainless cooking pot",
  junta:     "school backpack",
  barraya:   "pencil sharpener",
  daftar:    "spiral notebook",
  dishdasha: "dishdasha thobe white garment",
  jooti:     "sneakers shoes pair",
  ghitra:    "ghutra agal headdress",
  naal:      "flip flops sandals pair",
  gattu:     "cute kitten cat",
  diyaya:    "hen chicken standing",
  baeer:     "dromedary camel desert",
  simcha:    "goldfish fish",
  samoon:    "samoon bread",
  aish:      "cooked white rice plate",
  mai:       "glass of drinking water",
  rayoog:    "fried egg breakfast plate",
  motar:     "red car side view",
  seekal:    "children bicycle",
  freej:     "kuwait old town houses",
  darb:      "straight asphalt road",
  rassasi:   "grey storm clouds sky",
  samawi:    "clear blue sky",
  wardi:     "pink rose flower",
  shlonak:   "waving hand gesture",
  wayed:     "many colorful marbles",
  zain:      "thumbs up hand",
  yalla:     "children running silhouette",
  chithee:   "index finger pointing hand",
  mashkoor:  "heart hands gesture",
};

const api = (q) =>
  "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
  "&generator=search&gsrnamespace=6&gsrlimit=8" +
  "&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap") +
  "&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata%7Csize&iiurlwidth=640";

function fetchJson(url) {
  const raw = execSync(`curl -sS -A "${UA}" "${url.replace(/"/g, '\\"')}"`, {
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

function candidatesFor(slug, query) {
  const data = fetchJson(api(query));
  const pages = Object.values((data.query || {}).pages || {});
  const good = pages
    .map((p) => (p.imageinfo || [])[0])
    .filter((ii) => ii && /image\/(jpeg|png)/.test(ii.mime))
    // استبعاد الصور الصغيرة جداً أو الشديدة الاستطالة
    .filter((ii) => ii.width >= 500 && ii.height >= 400)
    .filter((ii) => ii.width / ii.height < 2.4 && ii.height / ii.width < 2.4)
    .slice(0, 3);
  return good.map((ii, i) => {
    const meta = ii.extmetadata || {};
    return {
      slug, index: i,
      thumb: ii.thumburl || ii.url,
      page: ii.descriptionurl,
      author: (meta.Artist || {}).value?.replace(/<[^>]*>/g, "").trim() || "غير معروف",
      license: (meta.LicenseShortName || {}).value || "غير محددة",
    };
  });
}

const mode = process.argv[2] || "candidates";

if (mode === "candidates") {
  mkdirSync(CAND, { recursive: true });
  const all = {};
  for (const [slug, query] of Object.entries(QUERIES)) {
    try {
      const cands = candidatesFor(slug, query);
      all[slug] = cands;
      for (const c of cands) {
        const f = join(CAND, `${slug}-${c.index}.img`);
        execSync(`curl -sS -A "${UA}" "${c.thumb}" -o "${f}"`);
      }
      console.log(slug, "→", cands.length, "candidates");
    } catch (e) {
      all[slug] = [];
      console.log(slug, "→ FAILED:", e.message.split("\n")[0]);
    }
  }
  writeFileSync(join(CAND, "meta.json"), JSON.stringify(all, null, 2));
  console.log("done → meta.json");
}

if (mode === "final") {
  /* SELECTION: slug → رقم المرشح المختار (يُحرَّر يدوياً بعد المعاينة) */
  const SELECTION = JSON.parse(readFileSync(join(CAND, "selection.json"), "utf8"));
  const meta = JSON.parse(readFileSync(join(CAND, "meta.json"), "utf8"));
  mkdirSync(OUT, { recursive: true });

  const chosen = {};
  let credits = "# حقوق الصور\n\nكل الصور من Wikimedia Commons، محفوظة محلياً في `assets/images/photos/`.\n\n";
  for (const [slug, idx] of Object.entries(SELECTION)) {
    if (idx === null || idx === undefined) continue;
    const c = (meta[slug] || [])[idx];
    if (!c) { console.log("skip", slug); continue; }
    const src = join(CAND, `${slug}-${idx}.img`);
    if (!existsSync(src)) { console.log("missing file", slug); continue; }
    const dst = join(OUT, `${slug}.jpg`);
    copyFileSync(src, dst);
    chosen[slug] = true;
    credits += `- **${slug}.jpg** — المؤلف: ${c.author} — الرخصة: ${c.license} — المصدر: ${c.page}\n`;
  }
  writeFileSync(join(OUT, "CREDITS.md"), credits);
  console.log("copied", Object.keys(chosen).length, "photos + CREDITS.md");
  console.log("الآن شغّل: node tools/build-images-manifest.mjs");
}
