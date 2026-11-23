'use strict';
// Pupusas To Go preview: the comal (count, fillings, ticket, read-out line), the "right now" strip, hours, party form, reveals.
// Opens half full (6 of 12) so the first screen shows pupusas; ?fill= (empty) starts bare.
// Stills: ?n=12&fill=loroco:4,frijolqueso:4,mixtas:4&at=12:30&day=2   (day 0 = Sunday)

const FILLINGS = [   // their menu, IG carousel 2026-05-19: "Pupusas de: ... a solo $3.00 c/u"
  { id: 'queso', es: 'Queso', en: 'cheese', say: 'de queso', tag: 'Queso', c: '#e9a21c' },
  { id: 'loroco', es: 'Queso y loroco', en: 'cheese & loroco', say: 'de queso y loroco', tag: 'Loroco', c: '#5a9a2a' },
  { id: 'frijolqueso', es: 'Frijol y queso', en: 'bean & cheese', say: 'de frijol y queso', tag: 'Frijol/queso', c: '#8a4a26' },
  { id: 'mixtas', es: 'Mixtas', en: 'mix', say: 'mixtas', one: 'mixta', tag: 'Mixta', c: '#d2362b' },
  { id: 'polloqueso', es: 'Pollo y queso', en: 'chicken & cheese', say: 'de pollo y queso', tag: 'Pollo/queso', c: '#2f5bd3' },
  { id: 'pollo', es: 'Pollo', en: 'chicken', say: 'de pollo', tag: 'Pollo', c: '#1b2470' },
  { id: 'frijol', es: 'Frijol', en: 'bean', say: 'de frijol', tag: 'Frijol', c: '#5b2d16' },
  { id: 'ayote', es: 'Ayote', en: 'squash', say: 'de ayote', tag: 'Ayote', c: '#e0701a' },
  { id: 'jalapeno', es: 'Queso y jalapeños', en: 'cheese & jalapeño', say: 'de queso y jalapeños', tag: 'Jalapeño', c: '#1d6b3c' },
];
const PRICE = 3;
const FACES = ['assets/pupusa-a.webp', 'assets/pupusa-b.webp'];   // real photos (Google listing), cut round
const byId = Object.fromEntries(FILLINGS.map(f => [f.id, f]));
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const qs = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Spanish numbers (feminine: una pupusa) ---------- */
const U = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuna', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const T = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta' };
const num = n => n < 30 ? U[n] : T[Math.floor(n / 10)] + (n % 10 ? ' y ' + U[n % 10] : '');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const list = (a, and) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1];

/* ---------- comal state ---------- */
const wrap = $('#comal'), spotsEl = $('.spots', wrap), iron = $('.iron', wrap);
let N = 12, slots = [], geo = [];
const rnd = i => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };

function layout(n) {   // slot centres and size, as fractions of the comal box
  const pts = [];
  if (n === 6) { for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; pts.push([.5 + .25 * Math.cos(a), .5 + .25 * Math.sin(a)]); } return { pts, d: .25 }; }
  if (n === 12) {
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 4 + i * Math.PI / 2; pts.push([.5 + .118 * Math.cos(a), .5 + .118 * Math.sin(a)]); }
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4; pts.push([.5 + .318 * Math.cos(a), .5 + .318 * Math.sin(a)]); }
    return { pts, d: .19 };
  }
  const d = n === 24 ? .158 : .108, R = .425 - d / 2, g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const r = R * Math.sqrt((i + .5) / n), a = i * g; pts.push([.5 + r * Math.cos(a), .5 + r * Math.sin(a)]); }
  return { pts, d };
}

function setN(n, keep = true) {
  const old = slots.filter(Boolean);
  N = n; const L = layout(n); geo = L;
  slots = new Array(n).fill(null);
  if (keep) old.slice(0, n).forEach((id, i) => slots[i] = id);
  $$('.counts button').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.n === n)));
  wrap.classList.toggle('crowd', n > 12);
  $('#badge-of').textContent = n;
  drawSlots(false); render();
}

function drawSlots(animateIdx) {
  spotsEl.textContent = '';
  const S = geo.d * 100, tags = document.createElement('div'); tags.className = 'tags';
  geo.pts.forEach(([x, y], i) => {
    const id = slots[i];
    if (!id) {
      const s = document.createElement('div'); s.className = 'slot';
      s.style.cssText = `left:${x * 100}%;top:${y * 100}%;width:${S}%;height:${S}%`;
      spotsEl.append(s); return;
    }
    const f = byId[id], b = document.createElement('button');
    b.type = 'button'; b.className = 'pp' + (animateIdx === i && !reduce ? ' in' : '');
    b.dataset.i = i; b.setAttribute('aria-label', `Remove one ${f.es} (${f.en})`); b.tabIndex = -1;
    b.style.cssText = `left:${x * 100}%;top:${y * 100}%;width:${S}%;height:${S}%;--c:${f.c};--tr:${(rnd(i + 9) * 8 - 4).toFixed(1)}deg`;
    const face = document.createElement('span'); face.className = 'face';
    face.style.cssText = `background-image:url(${FACES[(i * 7 + 3) % 5 < 3 ? 0 : 1]});--rot:${Math.round(rnd(i) * 360)}deg;--sc:${(.94 + rnd(i + 3) * .1).toFixed(3)};--fl:${rnd(i + 5) > .5 ? -1 : 1};--br:${(.9 + rnd(i + 11) * .16).toFixed(3)}`;
    b.append(face); spotsEl.append(b);
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = f.tag;
    tag.style.cssText = `left:${x * 100}%;top:${(y + geo.d * .44) * 100}%;--c:${f.c};--tr:${(rnd(i + 9) * 8 - 4).toFixed(1)}deg`;
    tags.append(tag);
  });
  spotsEl.append(tags);
  untangleTags();
  steamSpots();
}

// Neighbouring tags can overlap on a phone ("Frijol/queso" over "Loroco"): a tag that would cover an earlier one shrinks to its colour dot.
function untangleTags() {
  const all = [...spotsEl.querySelectorAll('.tag')], kept = [];
  all.forEach(t => t.classList.remove('dot'));
  all.forEach(t => {
    const r = t.getBoundingClientRect();
    if (kept.some(k => r.left < k.right - 2 && r.right > k.left + 2 && r.top < k.bottom - 2 && r.bottom > k.top + 2)) t.classList.add('dot');
    else kept.push(r);
  });
}
if (window.ResizeObserver) new ResizeObserver(() => untangleTags()).observe(spotsEl);
document.fonts && document.fonts.ready.then(untangleTags);

function steamSpots(burst) {
  const box = wrap.getBoundingClientRect(), D = box.width;
  const filled = slots.map((id, i) => id ? i : -1).filter(i => i >= 0);
  let pick = filled.slice(-8);
  if (!pick.length) pick = [];
  window.__steam = { spots: pick.map(i => [geo.pts[i][0] * D, geo.pts[i][1] * D, geo.d * D]), base: filled.length ? 1 : .35, burst: burst ?? (window.__steam?.burst || 0) };
}

function add(id) {
  if (!byId[id]) return;
  const step = N <= 12 ? 1 : N === 24 ? 4 : 10;
  let last = -1;
  for (let k = 0; k < step; k++) { const i = slots.indexOf(null); if (i < 0) break; slots[i] = id; last = i; }
  if (last < 0) { hint('The comal is full. Take one off, or pick a bigger number.'); return; }
  drawSlots(step === 1 ? last : -1);
  if (step > 1 && !reduce) $$('.pp', spotsEl).slice(-step).forEach(p => p.classList.add('in'));
  window.__steam && (window.__steam.burst = performance.now());
  render();
}
function removeAt(i) { if (slots[i]) { slots[i] = null; drawSlots(-1); render(); } }
function removeOne(id) { const i = slots.lastIndexOf(id); if (i >= 0) removeAt(i); }
function hint(t) { const h = $('#chips-hint'); h.textContent = t; }

function counts() { const c = {}; slots.forEach(id => id && (c[id] = (c[id] || 0) + 1)); return FILLINGS.filter(f => c[f.id]).map(f => [f, c[f.id]]); }

function lines() {
  const cs = counts(), total = cs.reduce((a, [, n]) => a + n, 0);
  if (!total) return { total, es: '', en: '' };
  const es = cap(num(total)) + (total === 1 ? ' pupusa: ' : ' pupusas: ') + list(cs.map(([f, n]) => num(n) + ' ' + (n === 1 && f.one ? f.one : f.say)), 'y') + '. Con curtido y salsa, por favor.';
  const en = `${total} pupusa${total === 1 ? '' : 's'}: ` + list(cs.map(([f, n]) => `${n} ${f.en}`), 'and') + '. Curtido and salsa, please.';
  return { total, es, en, plain: cs.map(([f, n]) => `${n} ${f.es.toLowerCase()}`).join(', ') };
}

function render() {
  const cs = counts(), L = lines(), ul = $('#lines');
  ul.textContent = '';
  if (!cs.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing on the comal yet. Tap a filling.'; ul.append(li); }
  cs.forEach(([f, n]) => {
    const li = document.createElement('li'); li.style.setProperty('--c', f.c);
    li.innerHTML = `<span class="qty">${n}</span><span class="nm"><b lang="es">${f.es}</b><span>${f.en}</span></span><span class="step"><button type="button" aria-label="One less ${f.es}">−</button><button type="button" aria-label="One more ${f.es}">+</button></span>`;
    const [minus, plus] = li.querySelectorAll('button');
    minus.onclick = () => removeOne(f.id);
    plus.onclick = () => { const i = slots.indexOf(null); if (i < 0) return hint('The comal is full. Pick a bigger number for more.'); slots[i] = f.id; drawSlots(i); render(); };
    ul.append(li);
  });
  $('#say').hidden = !L.total;
  $('#say-es').textContent = L.es; $('#say-en').textContent = L.en;
  $('#tot-n').textContent = `${L.total} of ${N} pupusa${N === 1 ? '' : 's'}`;
  $('#tot-p').textContent = '$' + (L.total * PRICE).toFixed(2);
  $('#badge-n').textContent = L.total;
  const crowd = N > 12;
  $('#party-go').hidden = !crowd; $('#dd').hidden = crowd;
  $$('.chip').forEach(c => { c.querySelector('i').textContent = crowd ? '+' + (N === 24 ? 4 : 10) : ''; });
  if (slots.indexOf(null) < 0 && L.total) hint(crowd ? 'Full comal. Send it as a party order and they call you back.' : 'Full comal. Call it in, and read them the line above.');
  else if (L.total) hint(crowd ? `Each tap adds ${N === 24 ? 4 : 10}. Use − and + on the ticket to fine-tune.` : 'Tap a pupusa to take it off.');
  else hint('Tap a filling to lay one on the comal. Tap a pupusa to take it off.');
}

/* ---------- the iron (drawn once per size) ---------- */
function drawIron() {
  const box = wrap.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  const W = Math.round(box.width * dpr); if (!W) return;
  iron.width = iron.height = W;
  const x = iron.getContext('2d'), c = W / 2, R = W * .462, Ri = R * .925;
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.clearRect(0, 0, W, W);
  // shadow + rim
  x.save(); x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = W * .03; x.shadowOffsetY = W * .012;
  x.beginPath(); x.arc(c, c, R, 0, 7); x.fillStyle = '#1a1a1d'; x.fill(); x.restore();
  let g = x.createLinearGradient(c - R, c - R, c + R, c + R);
  g.addColorStop(0, '#5a5a60'); g.addColorStop(.35, '#2a2a2f'); g.addColorStop(.7, '#121214'); g.addColorStop(1, '#2c2c31');
  x.beginPath(); x.arc(c, c, R, 0, 7); x.arc(c, c, Ri, 0, 7, true); x.fillStyle = g; x.fill();
  // cooking surface
  g = x.createRadialGradient(c - R * .15, c - R * .2, R * .05, c, c, Ri);
  g.addColorStop(0, '#26262a'); g.addColorStop(.6, '#161618'); g.addColorStop(1, '#0a0a0b');
  x.beginPath(); x.arc(c, c, Ri, 0, 7); x.fillStyle = g; x.fill();
  x.save(); x.beginPath(); x.arc(c, c, Ri, 0, 7); x.clip();
  // seasoning: mottled patina, a few worn brown patches where the masa sits
  for (let i = 0; i < 1400; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * Ri, s = W * (.004 + r() * .03);
    const warm = r() < .35;
    x.fillStyle = warm ? `rgba(${90 + r() * 40},${55 + r() * 20},${30},${.03 + r() * .05})` : `rgba(${r() < .5 ? 0 : 70},${r() < .5 ? 0 : 70},${r() < .5 ? 0 : 74},${.04 + r() * .06})`;
    x.beginPath(); x.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, s, s * (.5 + r() * .5), r() * 3, 0, 7); x.fill();
  }
  // turned rings from the lathe
  for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(255,255,255,${.008 + r() * .018})`; x.lineWidth = dpr * (.5 + r()); x.beginPath(); x.arc(c, c, Ri * (.08 + r() * .92), 0, 7); x.stroke(); }
  // sheen from the kitchen light, and the heat in the middle
  g = x.createRadialGradient(c - Ri * .42, c - Ri * .5, 0, c - Ri * .42, c - Ri * .5, Ri * .75);
  g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, W);
  g = x.createRadialGradient(c, c, 0, c, c, Ri * .7);
  g.addColorStop(0, 'rgba(255,120,40,.07)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, W);
  x.restore();
  // inner lip
  x.beginPath(); x.arc(c, c, Ri, 0, 7); x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = W * .006; x.stroke();
  x.beginPath(); x.arc(c, c, R - W * .002, Math.PI * 1.05, Math.PI * 1.7); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = W * .004; x.stroke();
}

/* ---------- build the controls ---------- */
const chips = $('.chips');
FILLINGS.forEach(f => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.style.setProperty('--c', f.c);
  b.innerHTML = `<b lang="es">${f.es}</b><span>${f.en}</span><i></i>`;
  b.setAttribute('aria-label', `Add ${f.es} (${f.en})`);
  b.onclick = () => add(f.id); chips.append(b);
});
$$('.counts button').forEach(b => b.onclick = () => setN(+b.dataset.n));
$('.counts').addEventListener('keydown', e => {   // arrow keys move between the radio buttons
  const bs = $$('.counts button'), i = bs.indexOf(document.activeElement);
  if (i < 0 || !/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
  e.preventDefault(); const j = (i + (/Right|Down/.test(e.key) ? 1 : bs.length - 1)) % bs.length; bs[j].focus(); setN(+bs[j].dataset.n);
});
spotsEl.addEventListener('click', e => { const p = e.target.closest('.pp'); if (!p) return; p.classList.add('out'); setTimeout(() => removeAt(+p.dataset.i), reduce ? 0 : 160); });
$('#clear').onclick = () => { slots.fill(null); drawSlots(-1); render(); };
$('#party-go').onclick = e => {
  const L = lines(); $('#f-count').value = L.total || N; $('#f-fill').value = L.plain || '';
  setTimeout(() => $('#party-form [name=name]').focus({ preventScroll: true }), reduce ? 0 : 700);
};

// start: 12, or what the URL says (for stills)
{
  const n = [6, 12, 24, 50].includes(+qs.get('n')) ? +qs.get('n') : 12;
  N = n; geo = layout(n); slots = new Array(n).fill(null);
  (qs.get('fill') ?? 'loroco:2,frijolqueso:2,queso:2').split(',').forEach(p => { const [id, k] = p.split(':'); for (let j = 0; j < (+k || 0); j++) { const i = slots.indexOf(null); if (i >= 0 && byId[id]) slots[i] = id; } });
  setN(n);
}
drawIron();
let lastW = 0;
new ResizeObserver(() => { const w = Math.round(wrap.getBoundingClientRect().width); if (w !== lastW) { lastW = w; drawIron(); steamSpots(); } }).observe(wrap);

/* ---------- right now strip + hours ---------- */
(() => {
  let day, mins;
  if (qs.get('at')) { const [h, m] = qs.get('at').split(':'); mins = +h * 60 + (+m || 0); day = +(qs.get('day') ?? new Date().getDay()); }
  else {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday); mins = (+p.hour % 24) * 60 + +p.minute;
  }
  const open = 390, close = day === 6 ? 990 : 1200, closeT = day === 6 ? '4:30pm' : '8pm';
  const isOpen = mins >= open && mins < close;
  $('#now-dot').classList.toggle('off', !isOpen);
  $('#now-open').textContent = isOpen ? (close - mins <= 45 ? `Open · closes at ${closeT}, call ahead` : `Open until ${closeT}`) : (mins < open ? 'Opens at 6:30am' : 'Closed · opens 6:30am tomorrow');
  let what;
  if (!isOpen) what = mins < open ? '· first up: desayuno típico, $10' : (day === 6 ? '· Sunday: sopa de gallina, only on Sundays' : '· back on the comal at 6:30');
  else if (day === 0) what = '· today only: sopa de gallina, hen soup, $13';
  else if (mins < 660) what = '· breakfast time: desayuno típico with beans, plantains, eggs, cheese and cream, $10';
  else what = '· pupusas $3 each, soups and plates from $13';
  $('#now-what').textContent = what;
  const tr = $(`#hours tr[data-d="${day}"]`); tr && tr.classList.add('today');
  const d = $('#f-date'); if (d) { const t = new Date(); d.min = new Date(t.getTime() - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }
})();

/* ---------- party form (front end only) ---------- */
$('#party-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target.elements, name = f['name'].value.trim(), phone = f.phone.value.trim();
  $('#f-err').hidden = !!(name && phone);
  if (!name || !phone) { (name ? f.phone : f['name']).focus(); return; }
  const bits = [];
  if (f.count.value) bits.push(`${f.count.value} pupusas`);
  if (f.fillings.value.trim()) bits[bits.length ? bits.length - 1 : 0] = (bits[bits.length - 1] || 'pupusas') + ` (${f.fillings.value.trim()})`;
  if (f.date.value) bits.push(new Date(f.date.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
  if (f.time.value) { const [h, m] = f.time.value.split(':'); bits.push(`pickup ${((+h + 11) % 12) + 1}:${m}${+h < 12 ? 'am' : 'pm'}`); }
  $('#f-done-h').textContent = `Party order request: ${bits.join(', ') || 'pupusas'}, for ${name}.`;
  const done = $('#f-done'); done.hidden = false; done.focus();
});

/* ---------- reveals (house recipe) ---------- */
(() => {
  const els = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();
