const TEMPLATE_LIST = [
  { id: 'text', name: 'نص فقط' },
  { id: 'photo', name: 'صورة كاملة' },
  { id: 'panel', name: 'صورة ولوحة' },
  { id: 'cutout', name: 'شخص أو مبنى' },
  { id: 'offer', name: 'عرض منتج' },
];

const state = {
  template: 'text', format: 'post', combo: 'dark', align: 'right',
  kicker: '', headline: 'بيت التمويل الكويتي\nيحصد جائزة جديدة', sub: '',
  numLabel: '', number: '', unit: '', cta: '', ctaColor: 'green', terms: '',
  curve: true, wedge: false,
  photo: null, fx: 0.5, fy: 0.5, zoom: 1, cutScale: 1, logo: null,
};

// Per-template defaults applied when switching, so each starts looking right.
const DEFAULTS = {
  text: { combo: 'dark', curve: true },
  photo: { curve: false },
  panel: {},
  cutout: { combo: 'dark' },
  offer: { combo: 'white' },
};

const canvas = document.getElementById('canvas');
const warn = document.getElementById('warn');

function render() {
  const overflow = renderPost(canvas, state, 1);
  warn.hidden = !overflow;
}

function syncUI() {
  document.querySelectorAll('[data-show]').forEach((el) => {
    el.hidden = !el.dataset.show.split(' ').includes(state.template);
  });
  document.querySelectorAll('.seg[data-field], .swatches[data-field]').forEach((g) => {
    g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(state[g.dataset.field] === b.dataset.value)));
  });
  document.querySelectorAll('.tpl').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.template)));
  document.querySelectorAll('input[data-field], textarea[data-field]').forEach((el) => {
    if (el.type === 'checkbox') el.checked = !!state[el.dataset.field];
    else if (document.activeElement !== el) el.value = state[el.dataset.field];
  });
  document.getElementById('clearLogo').hidden = !state.logo;
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
    }, 0.2);
    const label = document.createElement('span');
    label.textContent = t.name;
    b.append(c, label);
    b.addEventListener('click', () => { Object.assign(state, DEFAULTS[t.id], { template: t.id }); update(); });
    wrap.append(b);
  }
}

function bindInputs() {
  document.querySelectorAll('.seg[data-field], .swatches[data-field]').forEach((g) => {
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
  bindImage('photo', 'photoLabel', 'اختر صورة', (img) => { state.photo = img; state.fx = 0.5; state.fy = 0.5; state.zoom = 1; state.cutScale = 1; });
  bindImage('logo', 'logoLabel', 'شعار جهة شريكة', (img) => { state.logo = img; });
  document.getElementById('clearLogo').addEventListener('click', () => {
    state.logo = null;
    document.getElementById('logo').value = '';
    document.getElementById('logoLabel').textContent = 'شعار جهة شريكة';
    update();
  });
  document.getElementById('download').addEventListener('click', download);
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

function download() {
  const out = document.createElement('canvas');
  renderPost(out, state, 1);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    a.download = `kfh-${state.format}-${stamp}.png`;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

async function loadFonts() {
  const loads = [];
  for (const w of [400, 500, 600, 700, 800]) {
    loads.push(document.fonts.load(`${w} 40px "KFH Kufi"`, 'بيت'));
    loads.push(document.fonts.load(`${w} 40px "KFH Figtree"`, '2026'));
  }
  await Promise.all(loads);
}

loadFonts().then(() => {
  buildTemplates();
  bindInputs();
  update();
});
