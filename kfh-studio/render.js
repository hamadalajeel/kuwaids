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

// The official KFH curve: two 45° arms joined by a rounded bowl (geometry taken from the brand base file).
function uCurve(cx, bottom, w) {
  const half = w / 2, y0 = bottom - 0.2069 * w, cy = y0 + 0.2759 * w, k = 0.2242 * w, L = 3000;
  const p = new Path2D();
  p.moveTo(cx - half - L, y0 - L);
  p.lineTo(cx - half, y0);
  p.bezierCurveTo(cx - k, cy, cx + k, cy, cx + half, y0);
  p.lineTo(cx + half + L, y0 - L);
  return { path: p, y0, half };
}

// Long sweeping arc used over full photos.
function arcCurve(W, H) {
  const p = new Path2D();
  p.moveTo(600, H + 20);
  p.bezierCurveTo(480, H - 190, 470, H - 420, 600, H - 590);
  p.bezierCurveTo(720, H - 750, 900, H - 930, 1100, H - 1120);
  return p;
}

// Bottom-left green hump (crop of the brand blade).
function wedge(H) {
  const p = new Path2D();
  p.moveTo(0, H);
  p.lineTo(0, H - 242);
  p.bezierCurveTo(50, H - 285, 150, H - 285, 250, H - 220);
  p.lineTo(600, H);
  p.closePath();
  return p;
}

// Photo area for the "photo + panel" layout: everything above a soft V.
function panelClip(W, H) {
  const yl = 0.22 * H, yr = 0.26 * H, c = { x: 450, y: 0.55 * H }, d = 220;
  const toward = (tx, ty) => {
    const dx = tx - c.x, dy = ty - c.y, n = Math.hypot(dx, dy);
    return { x: c.x + (dx / n) * d, y: c.y + (dy / n) * d };
  };
  const A = toward(W, yr), B = toward(0, yl);
  const p = new Path2D();
  p.moveTo(0, 0);
  p.lineTo(W, 0);
  p.lineTo(W, yr);
  p.lineTo(A.x, A.y);
  p.quadraticCurveTo(c.x, c.y, B.x, B.y);
  p.lineTo(0, yl);
  p.closePath();
  return { path: p, bottom: 0.25 * A.y + 0.5 * c.y + 0.25 * B.y };
}

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
    { kind: 'text', text: s.kicker, weight: 500, size: 38 * big, min: 26, maxLines: 2, lh: 1.5, color: c.kicker, gap: 14 },
    { kind: 'text', text: s.headline, weight: 800, size: 80 * big, min: 44, maxLines: 4, lh: 1.42, color: c.head, gap: 22 },
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
  // 1. Text only — solid institutional background + official curve.
  text(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500, top = story ? 300 : H < 1200 ? 120 : 170;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

    const bottom = story ? H - 330 : H - (H < 1200 ? 40 : 150);
    const curve = uCurve(710, bottom, 680);
    if (s.curve) { ctx.strokeStyle = c.line; ctx.lineWidth = 15; ctx.stroke(curve.path); }
    if (s.wedge) { ctx.fillStyle = c.wedge; ctx.fill(wedge(story ? H - 240 : H)); }

    let y = top;
    if (s.logo) { drawLogo(ctx, s.logo, s.align === 'center' ? W / 2 : M, y, 72, s.align === 'center' ? 'center' : 'left'); y += 140; }

    const ctaY = H - (story ? 300 : 130) - 72;
    const limit = s.curve ? curve.y0 - (710 - curve.half - M) - 40 : (s.cta ? ctaY - 50 : H - 160);
    const st = layout(ctx, [...topItems(s, c), ...numItems(s, c, 200)], W - 2 * M, limit - y);
    drawStack(ctx, st, s.align === 'center' ? W / 2 : W - M, y, s.align);

    if (s.cta && s.cta.trim()) drawStack(ctx, layout(ctx, [ctaItem(s)], W - 2 * M, 200), s.align === 'center' ? W / 2 : W - M, ctaY, s.align);
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
    if (s.curve) { ctx.strokeStyle = KFH.green; ctx.lineWidth = 12; ctx.stroke(arcCurve(W, H)); }

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

  // 3. Photo on top, dark green panel with text below (awards / news).
  panel(ctx, s, W, H) {
    const story = H > 1500;
    ctx.fillStyle = KFH.dark; ctx.fillRect(0, 0, W, H);
    const clip = panelClip(W, H);
    ctx.save(); ctx.clip(clip.path);
    if (s.photo) drawCover(ctx, s.photo, 0, 0, W, H * 0.58, s.fx, s.fy, s.zoom);
    else placeholder(ctx, 0, 0, W, H * 0.58, 'ارفع صورة', false);
    ctx.restore();

    ctx.fillStyle = KFH.green; ctx.fill(wedge(H));
    if (s.logo) drawLogo(ctx, s.logo, 60, H - 150, 70, 'left');

    const c = { ...COMBOS.dark, sub: KFH.green };
    const y = clip.bottom + (story ? 120 : 70);
    const st = layout(ctx, [...topItems(s, c, 0.92), ...numItems(s, c, 170), ctaItem(s)], W - 2 * M, H - (story ? 330 : 290) - y);
    drawStack(ctx, st, s.align === 'center' ? W / 2 : W - M, y, s.align);
    drawTerms(ctx, s.terms, W, H, KFH.white);
    return st.overflow;
  },

  // 4. Cut-out person/building standing inside the curve.
  cutout(ctx, s, W, H) {
    const c = COMBOS[s.combo];
    const story = H > 1500, top = story ? 300 : H < 1200 ? 100 : 150;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    if (s.logo) drawLogo(ctx, s.logo, M, top - (story ? 0 : 40), 64, 'left');

    const curve = uCurve(540, H * (story ? 0.6 : 0.63), 560);
    ctx.strokeStyle = c.line; ctx.lineWidth = 15; ctx.stroke(curve.path);

    const textTop = top + (s.logo ? 70 : 0);
    const limit = curve.y0 - (540 - curve.half - M) - 30;
    const st = layout(ctx, topItems(s, c, 0.9), W - 2 * M, limit - textTop);
    drawStack(ctx, st, W - M, textTop, 'right');

    const boxTop = Math.max(textTop + st.h + 40, limit + 10);
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
