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
const NUM_FONT = (s) => `800 ${s}px "KFH Figtree", "KFH Kufi"`;

const COMBOS = {
  dark:  { bg: KFH.dark,  line: KFH.green, kicker: KFH.white, head: KFH.white, sub: KFH.white, num: KFH.white, label: KFH.green, wedge: KFH.green, fine: KFH.white },
  green: { bg: KFH.green, line: KFH.white, kicker: KFH.white, head: KFH.white, sub: KFH.white, num: KFH.white, label: KFH.white, wedge: KFH.white, fine: KFH.white },
  white: { bg: KFH.white, line: KFH.green, kicker: KFH.green, head: KFH.dark,  sub: KFH.dark,  num: KFH.green, label: KFH.green, wedge: KFH.green, fine: KFH.dark },
};

/* ---------- shapes ---------- */

// The one official KFH curve: two 45° arms joined by a rounded bowl (geometry from the brand base file).
// Every decorative shape in KFH posts is this curve — as a line, as the edge of a photo, or as a filled block —
// placed by its bowl's lowest point (cx, bottom), its width w and a rotation in degrees.
function brandCurve({ cx, bottom, w, rot = 0 }) {
  const half = w / 2, y0 = -0.2069 * w, cy = 0.0690 * w, k = 0.2242 * w, L = 4000, BIG = 9000;
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

// Where a symmetric curve's arm crosses the left edge, given its bowl.
function curveForIntercept(intercept, cx = 540, w = 680) {
  return { cx, w, bottom: intercept + (cx - w / 2) + 0.2069 * w };
}

// Green block in the bottom-left corner (the curve flipped, filled).
const cornerBottom = (H) => brandCurve({ cx: 170, bottom: H - 282, w: 520, rot: 180 }).inside;
// Green block in the top-left corner, for a partner logo.
const cornerTop = () => brandCurve({ cx: 200, bottom: 300, w: 820 }).inside;

/* ---------- images ---------- */

function drawCover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
}

function drawContainBottom(ctx, img, cx, bottom, maxW, maxH, scale = 1) {
  const s = Math.min(maxW / img.width, maxH / img.height) * scale;
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, cx - dw / 2, bottom - dh, dw, dh);
}

function drawContainCenter(ctx, img, cx, cy, maxW, maxH, scale = 1) {
  const s = Math.min(maxW / img.width, maxH / img.height) * scale;
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
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

function drawLogo(ctx, img, x, y, h, anchor = 'left') {
  const w = (img.width / img.height) * h;
  const maxW = 360;
  const s = w > maxW ? maxW / w : 1;
  const dw = w * s, dh = h * s;
  const dx = anchor === 'center' ? x - dw / 2 : anchor === 'right' ? x - dw : x;
  ctx.drawImage(img, dx, y + (h - dh) / 2, dw, dh);
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

function numberWidth(ctx, it, size) {
  ctx.font = NUM_FONT(size);
  const nw = ctx.measureText(it.number).width;
  let uw = 0;
  if (it.unit) { ctx.font = TEXT_FONT(700, Math.round(size * 0.36)); uw = ctx.measureText(it.unit).width + size * 0.08; }
  return { nw, uw, total: nw + uw };
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
      const { nw, total } = numberWidth(ctx, it, it.size);
      const right = align === 'center' ? x + total / 2 : x;
      const base = y + it.size * 0.74;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'right';
      ctx.font = NUM_FONT(it.size);
      ctx.fillStyle = it.color;
      ctx.save(); ctx.direction = 'ltr'; ctx.textAlign = 'right'; ctx.fillText(it.number, right, base); ctx.restore();
      if (it.unit) {
        ctx.font = TEXT_FONT(700, Math.round(it.size * 0.36));
        ctx.fillStyle = it.unitColor || it.color;
        ctx.fillText(it.unit, right - nw - it.size * 0.08, base);
      }
    } else if (it.kind === 'cta') {
      ctx.font = TEXT_FONT(600, it.size);
      const tw = ctx.measureText(it.text).width;
      const h = it.size * 2.1, w = tw + it.size * 2.4;
      const bx = align === 'center' ? x - w / 2 : x - w;
      ctx.fillStyle = it.fill;
      ctx.beginPath(); ctx.roundRect(bx, y, w, h, h / 2); ctx.fill();
      ctx.fillStyle = KFH.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, bx + w / 2, y + h / 2 + it.size * 0.06);
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

function topItems(s, c, big = 1) {
  return [
    { kind: 'text', text: s.kicker, weight: 400, size: 38 * big, min: 26, maxLines: 2, lh: 1.5, color: c.kicker, gap: 14 },
    { kind: 'text', text: s.headline, weight: 600, size: 80 * big, min: 44, maxLines: 4, lh: 1.42, color: c.head, gap: 22 },
    { kind: 'text', text: s.sub, weight: 400, size: 40 * big, min: 28, maxLines: 3, lh: 1.55, color: c.sub, gap: 30 },
  ];
}

function numItems(s, c, size = 220) {
  return [
    { kind: 'text', text: s.numLabel, weight: 700, size: 56, min: 36, maxLines: 1, lh: 1.3, color: c.label, gap: 4 },
    { kind: 'num', number: (s.number || '').trim(), unit: (s.unit || '').trim(), size, color: c.num, unitColor: c.num, gap: 34 },
  ];
}

function ctaItem(s) {
  return { kind: 'cta', text: s.cta, fill: s.ctaColor === 'dark' ? KFH.dark : KFH.green, gap: 0 };
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
    if (s.logo) { drawLogo(ctx, s.logo, s.align === 'center' ? W / 2 : M, y, 72, s.align === 'center' ? 'center' : 'left'); y += 140; }

    const hasCta = s.cta && s.cta.trim();
    const ctaY = H - (story ? 300 : 130) - 72;
    const floor = hasCta ? ctaY - 40 : H - (story ? 300 : 90);
    const maxIntercept = floor - 200 - 141; // keeps the bowl above the floor
    const st = layout(ctx, [...topItems(s, c), ...numItems(s, c, 200)], W - 2 * M, (s.curve ? maxIntercept - 30 : floor - 40) - y);
    if (s.curve) {
      const intercept = Math.min(Math.max(y + st.h + 30, H * 0.3), maxIntercept);
      ctx.strokeStyle = c.line; ctx.lineWidth = 15;
      ctx.stroke(brandCurve(curveForIntercept(intercept)).line);
    }
    drawStack(ctx, st, s.align === 'center' ? W / 2 : W - M, y, s.align);

    if (hasCta) drawStack(ctx, layout(ctx, [ctaItem(s)], W - 2 * M, 200), s.align === 'center' ? W / 2 : W - M, ctaY, s.align);
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },

  // 2. Full-bleed photo with the headline on top.
  photo(ctx, s, W, H) {
    const story = H > 1500, top = story ? 290 : 120, bottomPad = story ? 290 : 110;
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, H, s.fx, s.fy, s.zoom);
    else { ctx.fillStyle = '#C9D8D2'; ctx.fillRect(0, 0, W, H); placeholder(ctx, 0, 0, W, H, 'ارفع صورة', false); }

    const c = COMBOS.dark;
    const hasBottom = (s.number && s.number.trim()) || (s.cta && s.cta.trim()) || (s.numLabel && s.numLabel.trim());
    let g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, `rgba(${KFH.shade},.62)`); g.addColorStop(1, `rgba(${KFH.shade},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.5);
    if (hasBottom || s.logo) {
      g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, `rgba(${KFH.shade},0)`); g.addColorStop(1, `rgba(${KFH.shade},.7)`);
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
    }
    // The curve turned on its side: arm enters top-right, bowl faces left, opens toward the bottom-right.
    if (s.curve) { ctx.strokeStyle = KFH.green; ctx.lineWidth = 14; ctx.stroke(brandCurve({ cx: 507, bottom: H * 0.788, w: 840, rot: 90 }).line); }

    const x = s.align === 'center' ? W / 2 : W - M;
    const st = layout(ctx, topItems(s, c), W - 2 * M, H * 0.4);
    drawStack(ctx, st, x, top, s.align);

    const bc = { ...c, label: KFH.white };
    const bs = layout(ctx, [...numItems(s, bc, 210), ctaItem(s)], W - 2 * M, H * 0.38);
    drawStack(ctx, bs, x, H - bottomPad - bs.h, s.align);
    if (s.logo) drawLogo(ctx, s.logo, M, H - bottomPad - 64, 64, 'left');
    drawTerms(ctx, s.terms, W, H, KFH.white);
    return st.overflow || bs.overflow;
  },

  // 3. Photo on top; the dark green panel below starts exactly at the curve (awards / news).
  panel(ctx, s, W, H) {
    const story = H > 1500;
    const bottom = H * 0.528;
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, bottom + 20, s.fx, s.fy, s.zoom);
    else placeholder(ctx, 0, 0, W, bottom + 20, 'ارفع صورة', false);
    ctx.fillStyle = KFH.dark; ctx.fill(brandCurve({ cx: 540, bottom, w: 680 }).outside);

    ctx.fillStyle = KFH.green; ctx.fill(cornerBottom(H));
    if (s.logo) drawLogo(ctx, s.logo, 60, H - 150, 70, 'left');

    const c = { ...COMBOS.dark, sub: KFH.green };
    const y = bottom + (story ? 110 : 60);
    const st = layout(ctx, [...topItems(s, c, 0.92), ...numItems(s, c, 170), ctaItem(s)], W - 2 * M, H - (story ? 330 : 290) - y);
    drawStack(ctx, st, s.align === 'center' ? W / 2 : W - M, y, s.align);
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
      ctx.fillStyle = c.wedge; ctx.fill(cornerTop());
      if (s.logo) drawLogo(ctx, s.logo, M, 95, 80, 'left');
      textTop = story ? 470 : H < 1200 ? 320 : 380;
    } else {
      textTop = story ? 300 : H < 1200 ? 100 : 150;
      if (s.logo) { drawLogo(ctx, s.logo, M, textTop - (story ? 0 : 40), 64, 'left'); textTop += 70; }
    }

    const sub = corner ? { ...c, sub: s.combo === 'dark' ? KFH.green : c.sub } : c;
    const maxIntercept = H * 0.42;
    const st = layout(ctx, topItems(s, sub, 0.9), W - 2 * M, (corner ? H * 0.62 : maxIntercept - 30) - textTop);
    let boxTop = textTop + st.h + 40;
    if (!corner) {
      const intercept = Math.min(Math.max(textTop + st.h + 30, H * 0.25), maxIntercept);
      ctx.strokeStyle = c.line; ctx.lineWidth = 15;
      ctx.stroke(brandCurve(curveForIntercept(intercept)).line);
      boxTop = intercept + 70;
    }
    drawStack(ctx, st, W - M, textTop, 'right');

    if (s.photo) drawContainBottom(ctx, s.photo, W / 2, H, W * 0.92, H - boxTop, s.cutScale);
    else placeholder(ctx, W * 0.22, boxTop + 30, W * 0.56, H - boxTop - 30, 'صورة بدون خلفية', s.combo !== 'white');
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },

  // 5. Offer — product cut-out with a big number, centred.
  offer(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500, top = story ? 280 : 90, bottomPad = story ? 300 : 100;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    if (s.logo) drawLogo(ctx, s.logo, W / 2, top, 96, 'center');

    const oc = { ...c, head: c.head, label: KFH.green === c.bg ? KFH.white : KFH.green, num: s.combo === 'white' ? KFH.green : KFH.white };
    const items = [
      ...numItems(s, oc, 280),
      { kind: 'text', text: s.headline, weight: 700, size: 52, min: 34, maxLines: 2, lh: 1.45, color: oc.head, gap: 12 },
      { kind: 'text', text: s.sub, weight: 400, size: 36, min: 26, maxLines: 2, lh: 1.5, color: oc.sub, gap: 26 },
      ctaItem(s),
    ];
    const st = layout(ctx, items, W - 2 * M, H * 0.42);
    const sy = H - bottomPad - st.h;
    drawStack(ctx, st, W / 2, sy, 'center');

    const pTop = top + (s.logo ? 140 : 40), pBottom = sy - 40;
    if (s.photo) drawContainCenter(ctx, s.photo, W / 2, (pTop + pBottom) / 2, W * 0.82, pBottom - pTop, s.cutScale);
    else placeholder(ctx, W * 0.18, pTop, W * 0.64, pBottom - pTop, 'صورة المنتج', s.combo !== 'white');
    drawTerms(ctx, s.terms, W, H, c.fine);
    return st.overflow;
  },
};

function renderPost(canvas, s, scale = 1) {
  const [W, H] = FORMATS[s.format];
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  return TEMPLATES[s.template](ctx, s, W, H);
}
