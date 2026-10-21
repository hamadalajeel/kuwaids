const TEMPLATE_LIST = [
  { id: 'text', name: 'نص فقط' },
  { id: 'photo', name: 'صورة كاملة' },
  { id: 'panel', name: 'صورة ولوحة' },
  { id: 'cutout', name: 'شخص أو مبنى' },
  { id: 'offer', name: 'عرض منتج' },
  { id: 'blade', name: 'صورة وقطعة خضراء' },
  { id: 'quiz', name: 'سؤال الجمعة' },
];

const QUIZ_BG_LIST = [
  { id: 'arch', name: 'قوس' },
  { id: 'stars', name: 'نجوم' },
  { id: 'sun', name: 'شمسة' },
  { id: 'leaves', name: 'ظلال' },
  { id: 'plain', name: 'أبيض' },
];

// A first quiz opens filled with last week's example so the layout is visible straight away.
const QUIZ_SAMPLE = {
  kicker: 'جاوب واربح جائزة بقيمة', number: '50', unit: 'د.ك',
  headline: 'قال النبي ﷺ: "إنما الأعمال..."', options: 'بالاجتهاد\nبالنيات\nبالنتائج',
};

const BLADE_LIST = [
  { id: 'tr', name: 'فوق يمين' },
  { id: 'bottom', name: 'تحت' },
  { id: 'photoTop', name: 'الصورة فوق' },
  { id: 'left', name: 'يسار مع شعار' },
  { id: 'corner', name: 'زاوية صغيرة' },
];

const FORMAT_NAMES = { post: 'البوست', story: 'الستوري', square: 'المربع' };

const state = {
  template: 'text', format: 'post', combo: 'dark', align: 'right',
  kicker: '', headline: 'بيت التمويل الكويتي\nيحصد جائزة جديدة', sub: '',
  headScale: 1, headWeight: '600',
  numPrefix: '', numLabel: '', number: '', unit: '', numScale: 1, numPos: 'top',
  infoTitle: '', infoText: '',
  cta: '', ctaColor: 'green', ctaStyle: 'fill', terms: '', bladePos: 'tr',
  options: '', quizBg: 'arch',
  curve: true, wedge: false, deco: 'curve', shade: 0.6,
  curveDir: '', // '' = the layout's own orientation, else 0 / 90 / 180 / -90
  photo: null, fx: 0.5, fy: 0.5, zoom: 1, cutScale: 1, logo: null, logoScale: 1,
  crops: {},                                  // photo crop per size: { post: {fx, fy, zoom}, ... }
  offsets: { post: {}, story: {}, square: {} }, // dragged positions per size: { top: {dx, dy}, ... }
};

// Per-template defaults applied when switching, so each starts looking right.
const DEFAULTS = {
  text: { combo: 'dark', curve: true },
  photo: { curve: false },
  panel: {},
  cutout: { combo: 'dark' },
  offer: { combo: 'white' },
  blade: {},
  quiz: { headWeight: '600' },
};

const canvas = document.getElementById('canvas');
const twinCanvas = document.getElementById('twinCanvas');
const warn = document.getElementById('warn');
let boxes = [];
let hover = null;
let showGrid = false;

// The size shown next to the main preview: the story for a post, the post for a story.
const twinFormat = () => (state.format === 'story' ? 'post' : 'story');

function render() {
  const r = renderPost(canvas, state, 1);
  boxes = r.boxes;
  warn.hidden = !r.overflow;
  if (showGrid) drawGrid();
  if (hover) outline(hover);
  renderPost(twinCanvas, state, 0.2, twinFormat());
}

const currentGrid = () => grid(...FORMATS[state.format]);

// Brand grid drawn over the preview only; downloads never include it.
function drawGrid() {
  const g = currentGrid(), [W, H] = FORMATS[state.format];
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = 'rgba(229,57,53,.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of g.xs) { ctx.moveTo(x, g.ys[0]); ctx.lineTo(x, g.ys[g.ys.length - 1]); }
  for (const y of g.ys) { ctx.moveTo(g.xs[0], y); ctx.lineTo(g.xs[8], y); }
  ctx.stroke();
  ctx.restore();
}

// Pulls a dragged box onto the nearest grid line when it comes within reach.
// Text and images snap by their edges; the curve snaps its bowl to a grid crossing.
const SNAP = 18;
function snapAxis(edges, lines) {
  let best = null;
  for (const e of edges) for (const l of lines) {
    const d = l - e;
    if (Math.abs(d) <= SNAP && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  }
  return best ?? 0;
}

function snapped(id, base, dx, dy) {
  const g = currentGrid(), x = base.x + dx, y = base.y + dy;
  // Text snaps by the edge it is aligned on: right for Arabic, the middle when centred.
  const centred = state.template === 'offer' || (state.align === 'center' && state.template !== 'cutout');
  const isText = id === 'top' || id === 'bottom';
  const xEdges = id === 'curve' || (isText && centred) ? [x + base.w / 2] : isText ? [x + base.w] : [x, x + base.w];
  const yEdges = id === 'curve' ? [y + base.h / 2] : [y, y + base.h];
  return { dx: Math.round(dx + snapAxis(xEdges, g.xs)), dy: Math.round(dy + snapAxis(yEdges, g.ys)) };
}

function outline(id) {
  const b = boxes.find((x) => x.id === id);
  if (!b) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.strokeRect(b.x - 14, b.y - 14, b.w + 28, b.h + 28);
  ctx.strokeStyle = 'rgba(67,176,42,.95)';
  ctx.lineDashOffset = 12;
  ctx.strokeRect(b.x - 14, b.y - 14, b.w + 28, b.h + 28);
  ctx.restore();
}

const crop = () => state.crops[state.format] || state.crops.post || { fx: state.fx, fy: state.fy, zoom: state.zoom };

function syncUI() {
  document.querySelectorAll('[data-show]').forEach((el) => {
    el.hidden = !el.dataset.show.split(' ').includes(state.template);
  });
  document.querySelectorAll('.seg[data-field], .swatches[data-field], .positions[data-field]').forEach((g) => {
    g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(String(state[g.dataset.field]) === b.dataset.value)));
  });
  document.querySelectorAll('#templates .tpl').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.template)));
  document.querySelectorAll('input[data-field], textarea[data-field]').forEach((el) => {
    if (el.type === 'checkbox') el.checked = !!state[el.dataset.field];
    else if (document.activeElement !== el) el.value = state[el.dataset.field];
  });
  const c = crop();
  document.querySelectorAll('input[data-crop]').forEach((el) => { el.value = c[el.dataset.crop]; });
  document.getElementById('clearLogo').hidden = !state.logo;
  document.getElementById('logoSize').hidden = !state.logo;
  const other = twinFormat();
  document.getElementById('twinTitle').textContent = FORMAT_NAMES[other];
  document.getElementById('twinNote').textContent = `يتجهز تلقائياً من نفس التصميم. اضغط لتعديل ${FORMAT_NAMES[other]}.`;
  document.getElementById('download').textContent = `تحميل ${FORMAT_NAMES[state.format]}`;
}

function update() { syncUI(); render(); }

function buildTemplates() {
  const wrap = document.getElementById('templates');
  for (const t of TEMPLATE_LIST) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tpl';
    b.dataset.id = t.id;
    const c = document.createElement('canvas');
    renderPost(c, {
      ...state, ...DEFAULTS[t.id], template: t.id, format: 'post', photo: null, logo: null,
      kicker: t.id === 'panel' || t.id === 'cutout' ? 'تقديراً لإنجاز جديد' : '',
      headline: t.id === 'offer' ? 'على جميع المنتجات' : 'بيت التمويل الكويتي\nيحصد جائزة جديدة',
      number: t.id === 'offer' ? '15%' : '', numLabel: t.id === 'offer' ? 'خصم' : '',
      ...(t.id === 'quiz' ? QUIZ_SAMPLE : {}),
    }, 0.2);
    const label = document.createElement('span');
    label.textContent = t.name;
    b.append(c, label);
    b.addEventListener('click', () => {
      Object.assign(state, DEFAULTS[t.id], { template: t.id, offsets: { post: {}, story: {}, square: {} } });
      if (t.id === 'quiz' && !state.options.trim()) Object.assign(state, QUIZ_SAMPLE);
      update();
    });
    wrap.append(b);
  }
}

function loadQuizBackgrounds() {
  return Promise.all(QUIZ_BG_LIST.filter((b) => b.id !== 'plain').map((b) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { QUIZ_BG[b.id] = img; resolve(); };
    img.onerror = resolve;
    img.src = `backgrounds/${b.id}.webp`;
  })));
}

function buildQuizBackgrounds() {
  const wrap = document.getElementById('quizBg');
  for (const b of QUIZ_BG_LIST) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tpl';
    btn.dataset.value = b.id;
    const c = document.createElement('canvas');
    c.width = 108; c.height = 135;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 108, 135);
    if (QUIZ_BG[b.id]) ctx.drawImage(QUIZ_BG[b.id], 0, 0, 108, 135);
    const label = document.createElement('span');
    label.textContent = b.name;
    btn.append(c, label);
    wrap.append(btn);
  }
}

function buildBladePositions() {
  const wrap = document.getElementById('bladePos');
  for (const p of BLADE_LIST) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tpl';
    b.dataset.value = p.id;
    const c = document.createElement('canvas');
    renderPost(c, { ...state, template: 'blade', bladePos: p.id, format: 'post', photo: null, logo: null, kicker: '', sub: '', number: '', cta: '', headline: 'كل عام\nوالكويت بخير' }, 0.12);
    const label = document.createElement('span');
    label.textContent = p.name;
    b.append(c, label);
    wrap.append(b);
  }
}

function bindInputs() {
  document.querySelectorAll('.seg[data-field], .swatches[data-field], .positions[data-field]').forEach((g) => {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state[g.dataset.field] = b.dataset.value;
      update();
    });
  });
  document.querySelectorAll('input[data-field], textarea[data-field]').forEach((el) => {
    el.addEventListener('input', () => {
      const f = el.dataset.field;
      state[f] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
      render();
    });
  });
  document.querySelectorAll('input[data-crop]').forEach((el) => {
    el.addEventListener('input', () => {
      state.crops[state.format] = { ...crop(), [el.dataset.crop]: parseFloat(el.value) };
      render();
    });
  });
  bindImage('photo', 'photoLabel', 'اختر صورة', (img) => {
    state.photo = img; state.crops = {}; state.cutScale = 1;
    if (state.template === 'quiz') state.quizBg = 'custom';
  });
  bindImage('logo', 'logoLabel', 'شعار جهة شريكة', (img) => { state.logo = img; });
  document.getElementById('clearLogo').addEventListener('click', () => {
    state.logo = null;
    document.getElementById('logo').value = '';
    document.getElementById('logoLabel').textContent = 'شعار جهة شريكة';
    update();
  });
  document.getElementById('resetPos').addEventListener('click', () => { state.offsets[state.format] = {}; render(); });
  const gridBtn = document.getElementById('gridToggle');
  gridBtn.addEventListener('click', () => {
    showGrid = !showGrid;
    gridBtn.setAttribute('aria-pressed', String(showGrid));
    render();
  });
  document.getElementById('curveReset').addEventListener('click', () => {
    state.curveDir = '';
    for (const f in state.offsets) delete state.offsets[f].curve;
    update();
  });
  document.getElementById('twin').addEventListener('click', () => { state.format = twinFormat(); update(); });
  document.getElementById('download').addEventListener('click', () => save([state.format]));
  document.getElementById('downloadBoth').addEventListener('click', () => save(['post', 'story']));
}

/* ---------- dragging blocks on the preview ---------- */

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
}

function hit(p) {
  // Smallest box under the pointer wins, so a logo on top of a photo is still grabbable;
  // the curve's handle yields to text and images sitting on it.
  const area = (b) => b.w * b.h * (b.id === 'curve' ? 100 : 1);
  return boxes
    .filter((b) => p.x >= b.x - 20 && p.x <= b.x + b.w + 20 && p.y >= b.y - 20 && p.y <= b.y + b.h + 20)
    .sort((a, b) => area(a) - area(b))[0];
}

function bindDrag() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e), b = hit(p);
    if (!b) return;
    const o = state.offsets[state.format][b.id] || { dx: 0, dy: 0 };
    drag = { id: b.id, start: p, o: { ...o }, base: { x: b.x - o.dx, y: b.y - o.dy, w: b.w, h: b.h } };
    hover = b.id;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toCanvas(e);
    if (!drag) {
      const b = hit(p);
      const id = b ? b.id : null;
      if (id !== hover) { hover = id; render(); }
      return;
    }
    state.offsets[state.format][drag.id] = snapped(drag.id, drag.base, drag.o.dx + p.x - drag.start.x, drag.o.dy + p.y - drag.start.y);
    render();
  });
  const end = () => {
    if (!drag) return;
    drag = null;
    canvas.classList.remove('dragging');
    render();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; render(); } });
}

function bindImage(id, labelId, emptyText, apply) {
  const input = document.getElementById(id);
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      apply(img);
      document.getElementById(labelId).textContent = 'تم ✓ اضغط للتغيير';
      update();
    };
    img.onerror = () => { document.getElementById(labelId).textContent = emptyText; };
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- saving ---------- */

function toBlob(format) {
  const out = document.createElement('canvas');
  renderPost(out, state, 1, format);
  return new Promise((resolve) => out.toBlob(resolve, 'image/png'));
}

async function save(formats) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  // Inside a Claude artifact, files are offered through the downloads capability; elsewhere a plain link works.
  const downloads = window.claude?.use ? await window.claude.use('downloads') : null;
  for (const f of formats) {
    const filename = `kfh-${f}-${stamp}.png`;
    const blob = await toBlob(f);
    if (downloads) {
      try { await downloads.save({ filename, data: blob }); } catch (e) { if (e?.code === 'declined') return; console.warn(e); }
    } else {
      const a = document.createElement('a');
      a.download = filename;
      a.href = URL.createObjectURL(blob);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  }
}

async function loadFonts() {
  const loads = [];
  for (const w of [400, 500, 600, 700, 800]) {
    loads.push(document.fonts.load(`${w} 40px "KFH Kufi"`, 'بيت'));
    loads.push(document.fonts.load(`${w} 40px "KFH Figtree"`, '2026'));
  }
  await Promise.all(loads);
}

Promise.all([loadFonts(), loadQuizBackgrounds()]).then(() => {
  buildTemplates();
  buildQuizBackgrounds();
  buildBladePositions();
  bindInputs();
  bindDrag();
  update();
});
