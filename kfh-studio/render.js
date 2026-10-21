/* KFH post renderer — draws a finished, on-brand post onto a 2D canvas.
   All brand rules live here so the UI can never break them. */

const KFH = {
  green: '#43B02A',
  dark: '#2D7864',
  white: '#FFFFFF',
  shade: '12,34,29', // very dark green used only for photo readability gradients
};

const FORMATS = {
  post: [1080, 1350],
  story: [1080, 1920],
  square: [1080, 1080],
};

const M = 90; // side margin

const TEXT_FONT = (w, s) => `${w} ${s}px "KFH Figtree", "KFH Kufi"`;
const NUM_FONT = (s, w = 800) => `${w} ${s}px "KFH Figtree", "KFH Kufi"`;

const COMBOS = {
  dark:  { bg: KFH.dark,  line: KFH.green, kicker: KFH.white, head: KFH.white, sub: KFH.white, num: KFH.white, label: KFH.green, wedge: KFH.green, fine: KFH.white },
  green: { bg: KFH.green, line: KFH.white, kicker: KFH.white, head: KFH.white, sub: KFH.white, num: KFH.white, label: KFH.white, wedge: KFH.white, fine: KFH.white },
  white: { bg: KFH.white, line: KFH.green, kicker: KFH.green, head: KFH.dark,  sub: KFH.dark,  num: KFH.green, label: KFH.green, wedge: KFH.green, fine: KFH.dark },
};

/* ---------- shapes ---------- */

// The official KFH curve, taken from brand/KFH_Curve.svg:
//   M116.22,657.42 V0 L906.37,788.73 L708.69,986.41 C636.08,1059.02 517.82,1059.02 445.21,986.41 L116.22,657.42 Z
// Its two 45° sides meet in one rounded bowl (708.69 → 445.21). Every decorative shape in KFH posts is this
// curve — as a line, as the edge of a photo, or as a filled block — placed by its bowl's lowest point
// (cx, bottom), the bowl's width w and a rotation in degrees.
const OFFICIAL = (() => {
  const right = 708.69, left = 445.21, top = 986.41, ctrlY = 1059.02, ctrlR = 636.08;
  const w = right - left, mid = (right + left) / 2, bottom = top + 0.75 * (ctrlY - top);
  return { y0: (top - bottom) / w, cy: (ctrlY - bottom) / w, k: (ctrlR - mid) / w };
})();

function brandCurve({ cx, bottom, w, rot = 0 }) {
  const half = w / 2, y0 = OFFICIAL.y0 * w, cy = OFFICIAL.cy * w, k = OFFICIAL.k * w, L = 4000, BIG = 9000;
  const trace = (p) => {
    p.moveTo(-half - L, y0 - L);
    p.lineTo(-half, y0);
    p.bezierCurveTo(-k, cy, k, cy, half, y0);
    p.lineTo(half + L, y0 - L);
  };
  const line = new Path2D(); trace(line);
  const inside = new Path2D(); trace(inside); inside.closePath();
  const outside = new Path2D(); trace(outside);
  outside.lineTo(half + L, BIG); outside.lineTo(-half - L, BIG); outside.closePath();
  const m = new DOMMatrix().translate(cx, bottom).rotate(rot);
  const place = (local) => { const out = new Path2D(); out.addPath(local, m); return out; };
  return { line: place(line), inside: place(inside), outside: place(outside) };
}

// The bowl never changes size: on a 1080-wide post it is always 680 wide (official base file).
const CURVE_W = 680;

// A layout's main curve with the viewer's adjustments: one of the four brand orientations
// (bowl facing down 0, left 90, up 180, right -90) and a drag (per size).
// Its bowl is the handle the viewer grabs to drag it.
function userCurve(s, W, { cx, bottom, rot = 0 }) {
  const o = s.offsets.curve || { dx: 0, dy: 0 };
  const r = { cx: cx + o.dx, bottom: bottom + o.dy, w: CURVE_W, rot: s.curveDir === '' || s.curveDir == null ? rot : Number(s.curveDir) };
  s._boxes.push({ id: 'curve', x: r.cx - 80, y: r.bottom - 80, w: 160, h: 160 });
  return brandCurve(r);
}

// Where a symmetric curve's arm crosses the left edge, given its bowl.
function curveForIntercept(intercept, cx = 540, w = 680) {
  return { cx, w, bottom: intercept + (cx - w / 2) - OFFICIAL.y0 * w };
}

// Green block in the bottom-left corner (the curve flipped, filled).
const cornerBottom = (H) => brandCurve({ cx: 170, bottom: H - 235, w: CURVE_W, rot: 180 }).inside;

/* ---------- images ---------- */

function drawCover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
}

function containRect(img, cx, cy, maxW, maxH, scale, anchor) {
  const k = Math.min(maxW / img.width, maxH / img.height) * scale;
  const w = img.width * k, h = img.height * k;
  return { x: cx - w / 2, y: anchor === 'bottom' ? cy - h : cy - h / 2, w, h };
}

// Cut-out / product image the viewer can drag.
function placeImage(ctx, s, r) {
  moved(ctx, s, 'image', r, () => ctx.drawImage(s.photo, r.x, r.y, r.w, r.h));
}

function placeholder(ctx, x, y, w, h, label, dark) {
  ctx.save();
  ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : '#E3ECE8';
  ctx.fillRect(x, y, w, h);
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.45)' : 'rgba(45,120,100,.45)';
  ctx.strokeRect(x + 30, y + 30, w - 60, h - 60);
  ctx.fillStyle = dark ? 'rgba(255,255,255,.75)' : KFH.dark;
  ctx.font = TEXT_FONT(600, 44);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

// Partner logo, sized by the viewer's logo scale; returns the height it takes up.
function placeLogo(ctx, s, x, y, h, anchor = 'left') {
  if (!s.logo) return 0;
  const img = s.logo;
  h *= s.logoScale || 1;
  const w = (img.width / img.height) * h;
  const maxW = 360 * (s.logoScale || 1);
  const k = w > maxW ? maxW / w : 1;
  const dw = w * k, dh = h * k;
  const dx = anchor === 'center' ? x - dw / 2 : anchor === 'right' ? x - dw : x;
  const r = { x: dx, y: y + (h - dh) / 2, w: dw, h: dh };
  moved(ctx, s, 'logo', r, () => ctx.drawImage(img, r.x, r.y, r.w, r.h));
  return h;
}

/* ---------- movable blocks ---------- */

// Draws a block shifted by the viewer's drag offset for this size, and records where it landed.
function moved(ctx, s, id, box, draw) {
  const o = s.offsets[id] || { dx: 0, dy: 0 };
  ctx.save(); ctx.translate(o.dx, o.dy); draw(); ctx.restore();
  s._boxes.push({ id, x: box.x + o.dx, y: box.y + o.dy, w: box.w, h: box.h });
}

function stackWidth(ctx, st) {
  let w = 0;
  for (const it of st.items) {
    if (it.kind === 'text') { ctx.font = TEXT_FONT(it.weight, it.size); for (const l of it.lines) w = Math.max(w, ctx.measureText(l).width); }
    else if (it.kind === 'num') w = Math.max(w, numberWidth(ctx, it, it.size).total);
    else if (it.kind === 'cta') { ctx.font = TEXT_FONT(600, it.size); w = Math.max(w, ctx.measureText(it.text).width + it.size * 2.4); }
    else if (it.kind === 'bar') w = Math.max(w, 120);
  }
  return w;
}

function placeStack(ctx, s, id, st, x, y, align) {
  if (!st.items.length) return;
  const w = stackWidth(ctx, st);
  moved(ctx, s, id, { x: align === 'center' ? x - w / 2 : x - w, y, w, h: st.h }, () => drawStack(ctx, st, x, y, align));
}

/* ---------- text ---------- */

function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const t = line + ' ' + words[i];
      if (ctx.measureText(t).width <= maxW) line = t;
      else { out.push(line); line = words[i]; }
    }
    out.push(line);
  }
  return out;
}

// Shrinks a text item until it fits its line budget and width.
function fit(ctx, it, maxW, scale) {
  let size = Math.round(it.size * scale);
  const min = Math.round((it.min || it.size * 0.6) * Math.min(1, scale + 0.15));
  for (;;) {
    ctx.font = TEXT_FONT(it.weight, size);
    const lines = wrap(ctx, it.text, maxW);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if ((lines.length <= it.maxLines && widest <= maxW) || size <= min) {
      return { ...it, size, lines, overflow: lines.length > it.maxLines || widest > maxW };
    }
    size -= 2;
  }
}

// Big number laid out right to left: [prefix] [number] [unit], e.g. «بـ 0% أرباح».
function numberWidth(ctx, it, size) {
  const gap = size * 0.08;
  ctx.font = NUM_FONT(size, it.weight);
  const nw = ctx.measureText(it.number).width;
  ctx.font = TEXT_FONT(600, Math.round(size * 0.36));
  const pw = it.prefix ? ctx.measureText(it.prefix).width + gap : 0;
  const uw = it.unit ? ctx.measureText(it.unit).width + gap : 0;
  return { nw, pw, uw, gap, total: pw + nw + uw };
}

function measure(ctx, items, maxW, scale) {
  const out = [];
  for (const it of items) {
    if (it.kind === 'text') {
      if (!it.text || !it.text.trim()) continue;
      const f = fit(ctx, it, maxW, scale);
      f.h = f.lines.length * f.size * f.lh;
      out.push(f);
    } else if (it.kind === 'num') {
      if (!it.number) continue;
      let size = Math.round(it.size * scale);
      while (numberWidth(ctx, it, size).total > maxW && size > 60) size -= 4;
      out.push({ ...it, size, h: size * 0.78 });
    } else if (it.kind === 'cta') {
      if (!it.text || !it.text.trim()) continue;
      const size = Math.round(34 * Math.min(1, scale + 0.1));
      out.push({ ...it, size, h: size * 2.3 });
    } else if (it.kind === 'bar') {
      out.push({ ...it, h: 8 });
    }
  }
  return out;
}

function stackHeight(m) {
  return m.reduce((s, it, i) => s + it.h + (i < m.length - 1 ? (it.gap ?? 20) : 0), 0);
}

// Lays out a vertical stack, auto-shrinking everything to fit maxH.
function layout(ctx, items, maxW, maxH) {
  let scale = 1, m = measure(ctx, items, maxW, scale);
  while (stackHeight(m) > maxH && scale > 0.55) { scale -= 0.04; m = measure(ctx, items, maxW, scale); }
  return { items: m, h: stackHeight(m), overflow: stackHeight(m) > maxH || m.some((i) => i.overflow) };
}

function drawStack(ctx, stack, x, y, align) {
  ctx.save();
  ctx.direction = 'rtl';
  for (const it of stack.items) {
    if (it.kind === 'text') {
      ctx.font = TEXT_FONT(it.weight, it.size);
      ctx.fillStyle = it.color;
      ctx.textAlign = align === 'center' ? 'center' : 'right';
      ctx.textBaseline = 'middle';
      it.lines.forEach((l, i) => ctx.fillText(l, x, y + (i + 0.5) * it.size * it.lh + it.size * 0.06));
    } else if (it.kind === 'num') {
      const { nw, pw, gap, total } = numberWidth(ctx, it, it.size);
      const right = align === 'center' ? x + total / 2 : x;
      const base = y + it.size * 0.74;
      const small = TEXT_FONT(600, Math.round(it.size * 0.36));
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'right';
      ctx.fillStyle = it.color;
      if (it.prefix) { ctx.font = small; ctx.fillText(it.prefix, right, base); }
      ctx.font = NUM_FONT(it.size, it.weight);
      ctx.save(); ctx.direction = 'ltr'; ctx.textAlign = 'right'; ctx.fillText(it.number, right - pw, base); ctx.restore();
      if (it.unit) {
        ctx.font = small;
        ctx.fillStyle = it.unitColor || it.color;
        ctx.fillText(it.unit, right - pw - nw - gap, base);
      }
    } else if (it.kind === 'cta') {
      ctx.font = TEXT_FONT(600, it.size);
      const tw = ctx.measureText(it.text).width;
      const h = it.size * 2.1, w = tw + it.size * 2.4;
      const bx = align === 'center' ? x - w / 2 : x - w;
      ctx.beginPath(); ctx.roundRect(bx, y, w, h, h / 2);
      if (it.outline) { ctx.strokeStyle = it.outline; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = it.outline; }
      else { ctx.fillStyle = it.fill; ctx.fill(); ctx.fillStyle = KFH.white; }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, bx + w / 2, y + h / 2 + it.size * 0.06);
    } else if (it.kind === 'bar') {
      ctx.fillStyle = it.color;
      ctx.fillRect(align === 'center' ? x - 60 : x - 120, y, 120, 8);
    }
    y += it.h + (it.gap ?? 20);
  }
  ctx.restore();
}

function drawTerms(ctx, text, W, H, color) {
  if (!text || !text.trim()) return;
  ctx.save();
  ctx.translate(W - 34, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = TEXT_FONT(500, 15);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText(text.trim(), 0, 0);
  ctx.restore();
}

/* ---------- item builders ---------- */

// Kicker, headline, (optional number in between) and subline.
function topItems(s, c, big = 1, between = []) {
  const hs = s.headScale || 1;
  return [
    { kind: 'text', text: s.kicker, weight: 400, size: 38 * Math.min(big, 1), min: 26, maxLines: 2, lh: 1.5, color: c.kicker, gap: 14 },
    { kind: 'text', text: s.headline, weight: Number(s.headWeight) || 600, size: 80 * big * hs, min: 44 * Math.min(1, hs), maxLines: 4, lh: 1.42, color: c.head, gap: 22 },
    ...between,
    { kind: 'text', text: s.sub, weight: 400, size: 37 * Math.min(big, 1), min: 28, maxLines: 3, lh: 1.55, color: c.sub, gap: 30 },
  ];
}

function numItems(s, c, size = 220) {
  size *= s.numScale || 1;
  return [
    { kind: 'text', text: s.numLabel, weight: 700, size: 56, min: 36, maxLines: 1, lh: 1.3, color: c.label, gap: 4 },
    // The number follows the headline: a light headline gets a light number.
    { kind: 'num', weight: Number(s.headWeight) <= 400 ? 500 : 800, number: (s.number || '').trim(), prefix: (s.numPrefix || '').trim(), unit: (s.unit || '').trim(), size, color: c.num, unitColor: c.num, gap: 26 },
  ];
}

// Info block at the bottom: short green bar, a title and a details line (place, dates).
function infoItems(s, c) {
  if (!(s.infoTitle || '').trim() && !(s.infoText || '').trim()) return [];
  return [
    { kind: 'bar', color: KFH.green, gap: 26 },
    { kind: 'text', text: s.infoTitle, weight: 600, size: 44, min: 32, maxLines: 2, lh: 1.4, color: c.head, gap: 8 },
    { kind: 'text', text: s.infoText, weight: 400, size: 33, min: 24, maxLines: 2, lh: 1.5, color: c.sub, gap: 30 },
  ];
}

// Filled pill, or an outlined one (drawn in `line`, white unless the background is white).
function ctaItem(s, line = KFH.white) {
  return { kind: 'cta', text: s.cta, fill: s.ctaColor === 'dark' ? KFH.dark : KFH.green, outline: s.ctaStyle === 'outline' ? line : null, gap: 0 };
}

/* ---------- templates ---------- */

const TEMPLATES = {
  // 1. Text only — solid institutional background; the curve sweeps just under the text.
  text(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500, top = story ? 300 : H < 1200 ? 120 : 170;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    if (s.wedge) { ctx.fillStyle = c.wedge; ctx.fill(cornerBottom(story ? H - 240 : H)); }

    let y = top;
    if (s.logo) y += placeLogo(ctx, s, s.align === 'center' ? W / 2 : M, y, 72, s.align === 'center' ? 'center' : 'left') + 68;

    const hasCta = s.cta && s.cta.trim();
    const ctaY = H - (story ? 300 : 130) - 72;
    const floor = hasCta ? ctaY - 40 : H - (story ? 300 : 90);
    const maxIntercept = floor - 200 - 141; // keeps the bowl above the floor
    const st = layout(ctx, [...topItems(s, c), ...numItems(s, c, 200)], W - 2 * M, (s.curve ? maxIntercept - 30 : floor - 40) - y);
    if (s.curve) {
      const intercept = Math.min(Math.max(y + st.h + 30, H * 0.3), maxIntercept);
      ctx.strokeStyle = c.line; ctx.lineWidth = 15;
      ctx.stroke(userCurve(s, W, curveForIntercept(intercept)).line);
    }
    placeStack(ctx, s, 'top', st, s.align === 'center' ? W / 2 : W - M, y, s.align);

    if (hasCta) placeStack(ctx, s, 'bottom', layout(ctx, [ctaItem(s, c.head)], W - 2 * M, 200), s.align === 'center' ? W / 2 : W - M, ctaY, s.align);
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },

  // 2. Full-bleed photo: headline (and number) on top, info block and button at the bottom.
  photo(ctx, s, W, H) {
    const story = H > 1500, top = story ? 290 : 110, bottomPad = story ? 290 : 100;
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, H, s.fx, s.fy, s.zoom);
    else { ctx.fillStyle = '#C9D8D2'; ctx.fillRect(0, 0, W, H); placeholder(ctx, 0, 0, W, H, 'ارفع صورة', false); }

    const c = COMBOS.dark, nc = { ...c, label: KFH.white };
    const numTop = s.numPos !== 'bottom';
    const x = s.align === 'center' ? W / 2 : W - M;
    const bs = layout(ctx, [...infoItems(s, c), ...(numTop ? [] : numItems(s, nc, 210)), ctaItem(s)], W - 2 * M, H * 0.38);

    const shade = s.shade ?? 0.6;
    let g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, `rgba(${KFH.shade},${shade})`); g.addColorStop(1, `rgba(${KFH.shade},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
    if (bs.items.length) {
      g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, `rgba(${KFH.shade},0)`); g.addColorStop(1, `rgba(${KFH.shade},${Math.min(1, shade * 1.15)})`);
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    }
    // The curve turned on its side: arm enters top-right, bowl faces left, opens toward the bottom-right.
    if (s.curve) { ctx.strokeStyle = KFH.green; ctx.lineWidth = 14; ctx.stroke(userCurve(s, W, { cx: 460, bottom: H * 0.788, rot: 90 }).line); }

    let y = top;
    if (s.logo) y += placeLogo(ctx, s, s.align === 'center' ? W / 2 : M, y, 110, s.align === 'center' ? 'center' : 'left') + 80;
    const st = layout(ctx, topItems(s, c, 1, numTop ? numItems(s, nc, 170) : []), W - 2 * M, H * 0.52 - (y - top));
    placeStack(ctx, s, 'top', st, x, y, s.align);
    placeStack(ctx, s, 'bottom', bs, x, H - bottomPad - bs.h, s.align);
    drawTerms(ctx, s.terms, W, H, KFH.white);
    return st.overflow || bs.overflow;
  },

  // 3. Photo on top; the dark green panel below starts exactly at the curve (awards / news).
  panel(ctx, s, W, H) {
    const story = H > 1500;
    const bottom = H * 0.528;
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, bottom + 20, s.fx, s.fy, s.zoom);
    else placeholder(ctx, 0, 0, W, bottom + 20, 'ارفع صورة', false);
    ctx.fillStyle = KFH.dark; ctx.fill(userCurve(s, W, { cx: 540, bottom }).outside);

    ctx.fillStyle = KFH.green; ctx.fill(cornerBottom(H));
    placeLogo(ctx, s, 60, H - 150, 70, 'left');

    const c = { ...COMBOS.dark, sub: KFH.green };
    const y = bottom + (story ? 110 : 60);
    const st = layout(ctx, [...topItems(s, c, 0.92), ...numItems(s, c, 170), ctaItem(s)], W - 2 * M, H - (story ? 330 : 290) - y);
    placeStack(ctx, s, 'top', st, s.align === 'center' ? W / 2 : W - M, y, s.align);
    drawTerms(ctx, s.terms, W, H, KFH.white);
    return st.overflow;
  },

  // 4. Cut-out person/building standing inside the curve, or under a green corner with a partner logo.
  cutout(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    const corner = s.deco === 'corner';

    let textTop;
    if (corner) {
      ctx.fillStyle = c.wedge; ctx.fill(userCurve(s, W, { cx: 200, bottom: 341 }).inside);
      placeLogo(ctx, s, M, 95, 80, 'left');
      textTop = story ? 470 : H < 1200 ? 320 : 380;
    } else {
      textTop = story ? 300 : H < 1200 ? 100 : 150;
      if (s.logo) textTop += placeLogo(ctx, s, M, textTop - (story ? 0 : 40), 64, 'left') + 6;
    }

    const sub = corner ? { ...c, sub: s.combo === 'dark' ? KFH.green : c.sub } : c;
    const maxIntercept = H * 0.42;
    const st = layout(ctx, topItems(s, sub, 0.9), W - 2 * M, (corner ? H * 0.62 : maxIntercept - 30) - textTop);
    let boxTop = textTop + st.h + 40;
    if (!corner) {
      const intercept = Math.min(Math.max(textTop + st.h + 30, H * 0.25), maxIntercept);
      ctx.strokeStyle = c.line; ctx.lineWidth = 15;
      ctx.stroke(userCurve(s, W, curveForIntercept(intercept)).line);
      boxTop = intercept + 70;
    }
    placeStack(ctx, s, 'top', st, W - M, textTop, 'right');

    if (s.photo) placeImage(ctx, s, containRect(s.photo, W / 2, H, W * 0.92, H - boxTop, s.cutScale, 'bottom'));
    else placeholder(ctx, W * 0.22, boxTop + 30, W * 0.56, H - boxTop - 30, 'صورة بدون خلفية', s.combo !== 'white');
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },

  // 6. Photo with a large bright-green block cut from the official curve. Placements measured from live posts:
  //    tr — top right, text inside (national days) · bottom — text inside (occasions)
  //    photoTop — photo above the curve, text in the green (products) · left / corner — partner logo inside.
  blade(ctx, s, W, H) {
    const v = s.bladePos || 'tr', k = H / 1350, story = H > 1500;
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, H, s.fx, s.fy, s.zoom);
    else { ctx.fillStyle = '#C9D8D2'; ctx.fillRect(0, 0, W, H); placeholder(ctx, 0, 0, W, H, 'ارفع صورة', false); }

    const c = COMBOS.green, nc = { ...c, label: KFH.white };
    const right = s.align === 'center' ? null : W - M;
    const pad = story ? 300 : 100;
    const textOnPhoto = v === 'left' || v === 'corner';
    if (textOnPhoto) {
      const shade = s.shade ?? 0.6;
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      g.addColorStop(0, `rgba(${KFH.shade},${shade})`); g.addColorStop(1, `rgba(${KFH.shade},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
    }

    ctx.fillStyle = KFH.green;
    let st, box;
    // Big headlines inside the green block sit tighter, like the posts.
    const items = (big) => [...topItems(s, c, big, numItems(s, nc, 200)), ctaItem(s)]
      .map((it) => (big > 1.2 && it.text === s.headline && it.kind === 'text' ? { ...it, lh: 1.28 } : it));
    if (v === 'tr') {
      ctx.fill(userCurve(s, W, { cx: 259, bottom: 270 * k, rot: 90 }).inside);
      const y = story ? 320 : 160;
      st = layout(ctx, items(1.3), W - M - 300, 0.36 * H);
      box = { y };
      placeLogo(ctx, s, M, H - pad - 90, 90, 'left');
    } else if (v === 'bottom') {
      const apex = story ? H * 0.52 : 793 * k;
      ctx.fill(userCurve(s, W, { cx: 750, bottom: apex - 5, rot: 180 }).inside);
      const y = apex + 140;
      st = layout(ctx, items(1.55), 600, H - (story ? pad : 60) - y);
      box = { y };
      placeLogo(ctx, s, M, story ? 300 : 90, 90, 'left');
    } else if (v === 'photoTop') {
      const bottom = 850 * k;
      ctx.fill(userCurve(s, W, { cx: 820, bottom: bottom - 14 }).outside);
      st = layout(ctx, items(1.1), W - 2 * M, H - pad - bottom - 60);
      box = { y: H - pad - st.h };
      placeLogo(ctx, s, M, H - pad - 80, 80, 'left');
    } else {
      const big = v === 'left';
      ctx.fill(big
        ? userCurve(s, W, { cx: 458, bottom: 1014 * k, rot: -90 }).inside
          : userCurve(s, W, { cx: 229, bottom: 1200 * k, rot: -90 }).inside);
      const lh = big ? 170 : 140, cy = (big ? 1140 : 1185) * k;
      placeLogo(ctx, s, big ? 185 : 170, cy - lh / 2, lh, 'center');
      const y = story ? 300 : 140;
      st = layout(ctx, items(0.82), big ? W - M - 300 : W - 2 * M, 0.42 * H);
      box = { y };
    }
    placeStack(ctx, s, 'top', st, right ?? W / 2, box.y, s.align);
    drawTerms(ctx, s.terms, W, H, KFH.white);
    return st.overflow;
  },

  // 5. Offer — product cut-out with a big number, centred.
  offer(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500, top = story ? 280 : 90, bottomPad = story ? 300 : 100;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    placeLogo(ctx, s, W / 2, top, 96, 'center');

    const oc = { ...c, head: c.head, label: KFH.green === c.bg ? KFH.white : KFH.green, num: s.combo === 'white' ? KFH.green : KFH.white };
    const items = [
      ...numItems(s, oc, 280),
      { kind: 'text', text: s.headline, weight: 700, size: 52, min: 34, maxLines: 2, lh: 1.45, color: oc.head, gap: 12 },
      { kind: 'text', text: s.sub, weight: 400, size: 36, min: 26, maxLines: 2, lh: 1.5, color: oc.sub, gap: 26 },
      ctaItem(s, c.head),
    ];
    const st = layout(ctx, items, W - 2 * M, H * 0.42);
    const sy = H - bottomPad - st.h;
    placeStack(ctx, s, 'top', st, W / 2, sy, 'center');

    const pTop = top + (s.logo ? 96 * (s.logoScale || 1) + 44 : 40), pBottom = sy - 40;
    if (s.photo) placeImage(ctx, s, containRect(s.photo, W / 2, (pTop + pBottom) / 2, W * 0.82, pBottom - pTop, s.cutScale, 'center'));
    else placeholder(ctx, W * 0.18, pTop, W * 0.64, pBottom - pTop, 'صورة المنتج', s.combo !== 'white');
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },
};

// Renders one size of the post. Photo crop and dragged positions are kept per size;
// a size that was never adjusted falls back to the post's crop and to automatic layout.
function renderPost(canvas, state, scale = 1, format = state.format) {
  const s = {
    ...state, format,
    ...(state.crops?.[format] || state.crops?.post || {}),
    offsets: state.offsets?.[format] || {},
    _boxes: [],
  };
  const [W, H] = FORMATS[format];
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  const overflow = TEMPLATES[s.template](ctx, s, W, H);
  return { overflow, boxes: s._boxes };
}
