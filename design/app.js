/* snag — weekly grocery specials (demo, no backend). */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const device = $('#device');

/* ---------------- Icons ---------------- */
const svg = (p, sw = 2) => `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg></span>`;
const I = {
  compass: svg('<circle cx="12" cy="12" r="9.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  store: svg('<path d="M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0M5 12.5V20h14v-7.5M10 20v-5h4v5"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 2.2),
  list: svg('<path d="M6 7h.01M6 12h.01M6 17h.01M10 7h9M10 12h9M10 17h9"/>', 2.4),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2.6),
  minus: svg('<path d="M5 12h14"/>', 2.6),
  pin: svg('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  chev: svg('<path d="m6 9 6 6 6-6"/>', 2.6),
  back: svg('<path d="m15 18-6-6 6-6"/>', 2.6),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 2.6),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 2.2),
  heart: svg('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
  share: svg('<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>', 3.2),
  tag: svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  fire: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
  trend: svg('<path d="m22 17-8.5-8.5-5 5L2 7M16 17h6v-6"/>'),
  sort: svg('<path d="M3 6h18M6 12h12M10 18h4"/>', 2.4),
  bag: svg('<path d="M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0"/>'),
};

/* ---------------- Data ---------------- */
const STORES = {
  coles:  { id: 'coles',  name: 'Coles',       mono: 'C',   color: '#E01A22', img: 'banner-pantry', dist: '1.2 km', hours: 'Open till 10pm', type: 'Supermarket' },
  woolies:{ id: 'woolies',name: 'Woolworths',  mono: 'W',   color: '#1C8A45', img: 'banner-fresh',  dist: '0.8 km', hours: 'Open till 11pm', type: 'Supermarket' },
  aldi:   { id: 'aldi',   name: 'ALDI',        mono: 'A',   color: '#1B2D6B', img: 'sourdough',     dist: '2.4 km', hours: 'Open till 9pm',  type: 'Discount' },
  iga:    { id: 'iga',    name: 'IGA Local',   mono: 'IGA', color: '#111216', img: 'strawberries',  dist: '0.4 km', hours: 'Open till 9pm',  type: 'Local' },
  harris: { id: 'harris', name: 'Harris Farm', mono: 'HF',  color: '#2F6B3A', img: 'avocados',      dist: '3.1 km', hours: 'Open till 8pm',  type: 'Grocer' },
};
const CATS = [
  { id: 'fruit', name: 'Fruit & veg', img: 'avocados', bg: '#E4F5E9', fg: '#1E6B39' },
  { id: 'meat', name: 'Meat & seafood', img: 'salmon', bg: '#FFE9E1', fg: '#9A3A1E' },
  { id: 'bakery', name: 'Bakery', img: 'sourdough', bg: '#FFF3D6', fg: '#8A5A00' },
  { id: 'pantry', name: 'Pantry', img: 'olive-oil', bg: '#EEF1E2', fg: '#4E5A1E' },
  { id: 'sweets', name: 'Snacks & sweets', img: 'chocolate', bg: '#EFE8FB', fg: '#5B3C99' },
  { id: 'drinks', name: 'Drinks', img: 'sparkling', bg: '#E0F6F6', fg: '#14706E' },
  { id: 'frozen', name: 'Frozen', img: 'icecream', bg: '#FFF8D9', fg: '#7F6A00' },
  { id: 'household', name: 'Household', img: 'detergent', bg: '#E6F2FD', fg: '#1D5E99' },
];
const D = (id, img, name, size, store, price, was, cat, unit = '') => ({ id, img, name, size, store, price, was, cat, unit });
const DEALS = [
  D('d1', 'strawberries', 'Strawberries', '250g punnet', 'woolies', 2.5, 5, 'fruit', '$1.00 / 100g'),
  D('d2', 'strawberries', 'Strawberries', '250g punnet', 'coles', 3, 5.5, 'fruit', '$1.20 / 100g'),
  D('d3', 'avocados', 'Hass Avocados', 'each', 'coles', 1.25, 2.5, 'fruit'),
  D('d4', 'avocados', 'Hass Avocados', 'each', 'harris', 1.5, 2.8, 'fruit'),
  D('d5', 'salmon', 'Tasmanian Salmon Fillets', '2 pack · 240g', 'woolies', 8, 13, 'meat', '$3.33 / 100g'),
  D('d6', 'coffee', 'Single Origin Coffee Beans', '1kg bag', 'coles', 18, 36, 'pantry', '$1.80 / 100g'),
  D('d7', 'chocolate', 'Dark Chocolate 70%', '180g block', 'woolies', 3, 6, 'sweets', '$1.67 / 100g'),
  D('d8', 'chocolate', 'Dark Chocolate 70%', '180g block', 'aldi', 2.29, 3.49, 'sweets', '$1.27 / 100g'),
  D('d9', 'olive-oil', 'Extra Virgin Olive Oil', '750ml', 'coles', 9.5, 19, 'pantry', '$1.27 / 100ml'),
  D('d10', 'detergent', 'Laundry Liquid Concentrate', '2L', 'woolies', 12, 24, 'household', '$0.60 / 100ml'),
  D('d11', 'sparkling', 'Sparkling Water Variety', '10 × 375ml', 'aldi', 4.99, 7.49, 'drinks', '$0.13 / 100ml'),
  D('d12', 'sparkling', 'Sparkling Water Variety', '10 × 375ml', 'iga', 6, 10, 'drinks', '$0.16 / 100ml'),
  D('d13', 'sourdough', 'Stone-baked Sourdough', '680g loaf', 'harris', 4.5, 6.5, 'bakery', '$0.66 / 100g'),
  D('d14', 'chicken', 'Chicken Breast Fillets', 'per kg', 'coles', 9, 13, 'meat'),
  D('d15', 'chicken', 'Chicken Breast Fillets', 'per kg', 'woolies', 9.5, 13, 'meat'),
  D('d16', 'icecream', 'Vanilla Bean Ice Cream', '1L tub', 'iga', 5.5, 11, 'frozen', '$0.55 / 100ml'),
  D('d17', 'bananas', 'Cavendish Bananas', 'per kg', 'aldi', 2.99, 3.99, 'fruit'),
  D('d18', 'bananas', 'Cavendish Bananas', 'per kg', 'woolies', 3.5, 4.5, 'fruit'),
  D('d19', 'icecream', 'Vanilla Bean Ice Cream', '1L tub', 'coles', 6, 12, 'frozen', '$0.60 / 100ml'),
  D('d20', 'coffee', 'Single Origin Coffee Beans', '1kg bag', 'aldi', 13.99, 17.99, 'pantry', '$1.40 / 100g'),
  D('d21', 'olive-oil', 'Extra Virgin Olive Oil', '750ml', 'iga', 11, 16, 'pantry', '$1.47 / 100ml'),
  D('d22', 'salmon', 'Tasmanian Salmon Fillets', '2 pack · 240g', 'harris', 9, 12.5, 'meat', '$3.75 / 100g'),
];
const deal = id => DEALS.find(d => d.id === id);
const off = d => Math.round((1 - d.price / d.was) * 100);
const saving = d => d.was - d.price;
const money = n => '$' + n.toFixed(2);
const imgTag = (name, cls = '') => `<img class="${cls}" src="assets/${name}.jpg" alt="" draggable="false" loading="lazy">`;
const storeDeals = sid => DEALS.filter(d => d.store === sid);

// specials end next Tuesday 11:59pm (AU weekly catalogue cycle)
const END = (() => { const d = new Date(); const add = (2 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + add); d.setHours(23, 59, 0, 0); return d; })();
const endLabel = END.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
function left() { const ms = END - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d ? `${d}d ${h}h` : `${h}h ${m}m`; }

/* ---------------- State ---------------- */
const KEY = 'snag.v1';
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } })() || { list: {}, done: {}, favs: ['woolies'], recent: ['avocado', 'coffee', 'salmon'] };
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const qty = id => S.list[id] || 0;
const listItems = () => Object.entries(S.list).filter(([, q]) => q > 0).map(([id, q]) => ({ d: deal(id), q }));
const listTotals = () => listItems().reduce((a, { d, q }) => (a.n += q, a.total += d.price * q, a.saved += saving(d) * q, a), { n: 0, total: 0, saved: 0 });

/* ---------------- Components ---------------- */
const logo = (s, cls = 'logo') => `<span class="${cls}" style="background:${s.color}">${s.mono}</span>`;
const discBadge = d => { const o = off(d); return `<span class="disc ${o >= 48 ? 'half' : ''}">${o >= 48 ? '½ price' : `−${o}%`}</span>`; };
function addBtn(d) {
  const q = qty(d.id);
  return q ? `<span class="add has" data-add="${d.id}"><span class="b" data-dec="${d.id}">${I.minus}</span><span class="q num">${q}</span><span class="b" data-inc="${d.id}">${I.plus}</span></span>`
           : `<span class="add" data-add="${d.id}"><span class="b" data-inc="${d.id}">${I.plus}</span></span>`;
}
function pcard(d, i = 0) {
  const s = STORES[d.store];
  return `<div class="pcard" data-open="${d.id}" style="animation-delay:${i * 35}ms">
    <div class="pimg">${imgTag(d.img)}${discBadge(d)}${addBtn(d)}</div>
    <div class="price"><b class="num">${money(d.price)}</b><s class="num">${money(d.was)}</s></div>
    <div class="pname">${d.name}</div>
    <div class="psub"><span class="sdot" style="background:${s.color}">${s.mono[0]}</span>${s.name} · ${d.size}</div></div>`;
}
function vcard(s) {
  const ds = storeDeals(s.id), avg = Math.round(ds.reduce((a, d) => a + off(d), 0) / ds.length), max = Math.max(...ds.map(off));
  return `<button class="vcard" data-store="${s.id}">
    <div class="vimg">${imgTag(s.img)}<div class="tagl"><span class="chip-w blue">${I.tag}Up to ${max}% off</span><span class="chip-w">${I.clock}Ends ${endLabel.split(',')[0]}</span></div></div>
    <div class="vrow">${logo(s)}<div class="t"><b>${s.name}</b><span>${ds.length} specials · avg −${avg}%</span></div><span class="dist">${s.dist}</span></div></button>`;
}
function srow(d, i, rank) {
  const s = STORES[d.store];
  return `<button class="srow" data-open="${d.id}">${rank ? `<span class="rank">${i + 1}</span>` : ''}
    <span class="th">${imgTag(d.img)}</span>
    <span class="mid"><b>${d.name}</b><span class="psub"><span class="sdot" style="background:${s.color}">${s.mono[0]}</span>${s.name} · ${d.size}</span>
    <span class="save-pill">Save ${money(saving(d))}</span></span>
    <span class="rp"><b class="num">${money(d.price)}</b><s class="num">${money(d.was)}</s></span></button>`;
}

/* ---------------- Discover ---------------- */
let catFilter = null;
function renderDiscover() {
  const half = DEALS.filter(d => off(d) >= 48);
  const bySaving = [...DEALS].sort((a, b) => saving(b) - saving(a)).slice(0, 5);
  const cat = catFilter ? DEALS.filter(d => d.cat === catFilter) : null;
  $('#screen-discover').innerHTML = `
    <div class="topbar">
      <button class="loc"><span class="pin">${I.pin}</span><span><small>Specials near</small><b>Surry Hills 2010 ${I.chev}</b></span></button>
      <span class="wordmark">snag</span>
    </div>
    <div class="hs" id="heroes">
      <button class="banner" data-cat="fruit">${imgTag('banner-fresh')}<div class="txt"><span class="kick">This week</span><h2>Fresh produce, half the price</h2><span class="cta">Shop fresh</span></div></button>
      <button class="banner" data-cat="pantry">${imgTag('banner-pantry')}<div class="txt"><span class="kick">Stock-up</span><h2>Pantry heroes up to 50% off</h2><span class="cta">Browse pantry</span></div></button>
    </div>
    <div class="hdots" id="hdots"><i class="on"></i><i></i></div>
    <div class="cats">${CATS.map(c => `<button class="cat ${catFilter === c.id ? 'on' : ''}" data-cat="${c.id}"><span class="ci">${imgTag(c.img)}</span>${c.name}</button>`).join('')}</div>
    ${cat ? `
      <div class="sec"><div class="sec-h"><div><h3>${CATS.find(c => c.id === catFilter).name}</h3><p>${cat.length} specials across ${new Set(cat.map(d => d.store)).size} stores</p></div><button class="see" data-cat="${catFilter}">Clear</button></div>
      <div class="grid">${cat.map(pcard).join('')}</div></div>` : `
      <div class="sec"><div class="sec-h"><div><h3>Half price this week</h3><p>${half.length} deals · don't sleep on these</p></div><span class="timer">${I.clock}<span class="tleft">${left()}</span></span></div>
        <div class="hs">${half.map(pcard).join('')}</div></div>
      <div class="sec"><div class="sec-h"><div><h3>Stores near you</h3><p>Catalogues refresh every Wednesday</p></div><button class="see" data-go="stores">See all</button></div>
        <div class="hs">${Object.values(STORES).map(vcard).join('')}</div></div>
      <div class="sec"><div class="sec-h"><div><h3>Biggest savings</h3><p>Ranked by dollars off</p></div></div>
        <div class="slist">${bySaving.map((d, i) => srow(d, i, true)).join('')}</div></div>
      <div class="sec"><div class="sec-h"><div><h3>Under $5</h3><p>Cheap thrills</p></div></div>
        <div class="hs">${DEALS.filter(d => d.price < 5).map(pcard).join('')}</div></div>
      <p class="foot">Prices are demo data · updated ${new Date().toLocaleDateString('en-AU', { weekday: 'long' })}</p>`}`;
  const hs = $('#heroes');
  hs.addEventListener('scroll', () => { const i = Math.round(hs.scrollLeft / 328); $$('#hdots i').forEach((d, j) => d.classList.toggle('on', i === j)); }, { passive: true });
}

/* ---------------- Stores ---------------- */
let storeFilter = 'All';
function renderStores() {
  const types = ['All', 'Favourites', 'Supermarket', 'Discount', 'Local', 'Grocer'];
  const list = Object.values(STORES).filter(s => storeFilter === 'All' || (storeFilter === 'Favourites' ? S.favs.includes(s.id) : s.type === storeFilter));
  $('#screen-stores').innerHTML = `<h1 class="ptitle">Stores</h1>
    <div class="chips">${types.map(t => `<button class="chip ${t === storeFilter ? 'on' : ''}" data-sf="${t}">${t === 'Favourites' ? I.heart : ''}${t}</button>`).join('')}</div>
    <div class="pad vlist">${list.length ? list.map(vcard).join('') : `<div class="empty"><h3>No favourites yet</h3><p>Tap the heart on a store to save it here.</p></div>`}</div>`;
  $$('[data-sf]').forEach(b => b.onclick = () => { storeFilter = b.dataset.sf; renderStores(); });
}

/* ---------------- Store view ---------------- */
const view = $('#store-view');
let viewStore = null, viewCat = 'all';
function openStore(id) {
  viewStore = STORES[id]; viewCat = 'all'; renderStoreView();
  view.scrollTop = 0; requestAnimationFrame(() => view.classList.add('open'));
  $('.statusbar').classList.add('light');
}
function renderStoreView() {
  const s = viewStore, ds = storeDeals(s.id), cats = ['all', ...new Set(ds.map(d => d.cat))];
  const shown = viewCat === 'all' ? ds : ds.filter(d => d.cat === viewCat);
  const totalSave = ds.reduce((a, d) => a + saving(d), 0), fav = S.favs.includes(s.id);
  view.innerHTML = `
    <div class="v-nav" id="vnav"><div class="v-nav-inner"><button class="round" id="v-back">${I.back}</button><span class="ttl">${s.name}</span><button class="round ${fav ? 'on' : ''}" id="v-fav">${I.heart}</button></div></div>
    <div class="v-hero">${imgTag(s.img)}</div>
    <div class="v-head">${logo(s)}<h1>${s.name}</h1><div class="meta">${s.type} · ${s.dist} · ${s.hours}</div>
      <div class="v-stats"><div class="v-stat"><b class="num">${ds.length}</b><span>Specials</span></div><div class="v-stat"><b class="num">${money(totalSave)}</b><span>Total savings</span></div><div class="v-stat hot"><b class="num tleft">${left()}</b><span>Until reset</span></div></div></div>
    <div class="v-tabs">${cats.map(c => `<button class="vt ${c === viewCat ? 'on' : ''}" data-vc="${c}">${c === 'all' ? 'All specials' : CATS.find(x => x.id === c).name}</button>`).join('')}</div>
    <div class="grid">${shown.map(pcard).join('')}</div>`;
  $('#v-back').onclick = () => { view.classList.remove('open'); $('.statusbar').classList.remove('light'); };
  $('#v-fav').onclick = e => { S.favs = fav ? S.favs.filter(x => x !== s.id) : [...S.favs, s.id]; save(); toast(fav ? 'Removed from favourites' : `${s.name} saved to favourites`); renderStoreView(); };
  $$('[data-vc]', view).forEach(b => b.onclick = () => { viewCat = b.dataset.vc; const y = view.scrollTop; renderStoreView(); view.scrollTop = Math.min(y, 300); });
}
view.addEventListener('scroll', () => {
  const solid = view.scrollTop > 150; const n = $('#vnav'); n && n.classList.toggle('solid', solid);
  $('.statusbar').classList.toggle('light', !solid && view.classList.contains('open'));
}, { passive: true });

/* ---------------- Search ---------------- */
let query = '', sortBy = 'saving';
function renderSearch(focus) {
  const q = query.trim().toLowerCase();
  const res = q ? DEALS.filter(d => (d.name + ' ' + STORES[d.store].name + ' ' + d.cat).toLowerCase().includes(q)) : [];
  res.sort((a, b) => sortBy === 'saving' ? saving(b) - saving(a) : sortBy === 'price' ? a.price - b.price : off(b) - off(a));
  const trending = ['d6', 'd10', 'd5', 'd9', 'd16'].map(deal);
  $('#screen-search').innerHTML = `
    <h1 class="ptitle">Search</h1>
    <div class="searchbar"><label class="sfield">${I.search}<input id="sq" placeholder="Products, stores or categories" value="${query.replace(/"/g, '&quot;')}" autocomplete="off">${query ? `<button class="clr" id="sclr">${I.x}</button>` : ''}</label></div>
    <div id="sres">${q ? `
      <div class="chips">${[['saving', 'Biggest saving'], ['pct', 'Highest % off'], ['price', 'Lowest price']].map(([k, l]) => `<button class="chip ${sortBy === k ? 'on' : ''}" data-sort="${k}">${l}</button>`).join('')}</div>
      ${res.length ? `<div class="grid">${res.map(pcard).join('')}</div>` : `<div class="empty"><h3>No specials for “${query}”</h3><p>Try “chocolate”, “Aldi” or “pantry”.</p></div>`}` : `
      <div class="sec" style="margin-top:6px"><div class="sec-h"><h3 style="font-size:18px">Recent</h3></div>
        <div class="recent">${S.recent.map(r => `<button class="chip" data-q="${r}">${I.clock}${r}</button>`).join('')}</div></div>
      <div class="sec"><div class="sec-h"><h3 style="font-size:18px">Trending this week</h3></div>
        <div class="slist">${trending.map((d, i) => srow(d, i, true)).join('')}</div></div>
      <div class="sec"><div class="sec-h"><h3 style="font-size:18px">Browse categories</h3></div>
        <div class="tiles">${CATS.map(c => `<button class="tile" data-q="${c.id}" style="background:${c.bg};color:${c.fg}"><span>${c.name}</span><small>${DEALS.filter(d => d.cat === c.id).length} deals</small>${imgTag(c.img)}</button>`).join('')}</div></div>`}
    </div>`;
  const inp = $('#sq');
  inp.oninput = e => { query = e.target.value; device.classList.add('still'); renderSearch(true); };
  inp.onkeydown = e => { if (e.key === 'Enter' && query.trim()) { S.recent = [query.trim(), ...S.recent.filter(r => r !== query.trim())].slice(0, 6); save(); inp.blur(); } };
  if (focus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  $('#sclr') && ($('#sclr').onclick = e => { e.preventDefault(); query = ''; renderSearch(true); });
  $$('[data-sort]').forEach(b => b.onclick = () => { sortBy = b.dataset.sort; renderSearch(); });
  $$('[data-q]').forEach(b => b.onclick = () => { query = b.dataset.q; renderSearch(); });
}

/* ---------------- List ---------------- */
function renderList() {
  const items = listItems(), t = listTotals();
  const el = $('#screen-list');
  if (!items.length) {
    el.innerHTML = `<h1 class="ptitle">Your list</h1><div class="empty" style="padding-top:60px">
      <div class="stack">${imgTag('strawberries')}${imgTag('coffee')}${imgTag('avocados')}</div>
      <h3>Your list is empty</h3><p>Add specials and we'll total up what you save.</p>
      <button class="btn blue inline-btn" data-go="discover">${I.tag}Browse specials</button></div>`;
    return;
  }
  const groups = {};
  items.forEach(it => (groups[it.d.store] ||= []).push(it));
  const doneN = items.filter(({ d }) => S.done[d.id]).length;
  el.innerHTML = `<h1 class="ptitle">Your list</h1>
    <div class="save-card"><small>You're saving</small><div class="big num">${money(t.saved)}</div>
      <div class="row"><div><b class="num">${money(t.total)}</b><span>Est. total</span></div><div><b class="num">${t.n}</b><span>Items</span></div><div><b class="num">${Object.keys(groups).length}</b><span>Stores</span></div></div>
      <div class="prog"><i style="width:${(doneN / items.length) * 100}%"></i></div></div>
    ${Object.entries(groups).map(([sid, its]) => { const s = STORES[sid]; return `
      <div class="group"><div class="g-head">${logo(s)}<b>${s.name}</b><span class="num">${money(its.reduce((a, { d, q }) => a + d.price * q, 0))}</span></div>
      ${its.map(({ d, q }) => `<div class="li ${S.done[d.id] ? 'done' : ''}">
        <button class="chk" data-chk="${d.id}">${I.check}</button>
        <span class="th" data-open="${d.id}">${imgTag(d.img)}</span>
        <span class="mid" data-open="${d.id}"><span class="li-n">${d.name}</span><span>${d.size} · </span><em class="num">${money(d.price * q)}</em></span>
        <span class="mstep"><button data-dec="${d.id}">${I.minus}</button><span class="num">${q}</span><button data-inc="${d.id}">${I.plus}</button></span></div>`).join('')}</div>`; }).join('')}
    <div class="list-actions"><button class="btn soft" id="share">${I.share}Share</button><button class="btn soft" id="clear-done">${I.check}Clear ticked</button></div>`;
  $$('[data-chk]').forEach(b => b.onclick = () => { const id = b.dataset.chk; S.done[id] = !S.done[id]; save(); renderList(); });
  $('#share').onclick = async () => {
    const txt = 'My snag list:\n' + items.map(({ d, q }) => `• ${q}× ${d.name} (${STORES[d.store].name}) ${money(d.price * q)}`).join('\n') + `\nSaving ${money(t.saved)}`;
    try { await navigator.clipboard.writeText(txt); toast('List copied to clipboard'); } catch { toast('Copy not available here'); }
  };
  $('#clear-done').onclick = () => { Object.keys(S.done).forEach(id => { if (S.done[id]) { delete S.list[id]; delete S.done[id]; } }); save(); refresh(); toast('Ticked items cleared'); };
}

/* ---------------- Product sheet ---------------- */
const sheet = $('#sheet'), backdrop = $('#backdrop');
let sheetId = null, sheetQty = 1;
function history(d) {
  // synthetic 12-week price history ending at the special
  let seed = d.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pts = Array.from({ length: 11 }, () => d.was * (0.85 + r() * 0.15)); pts.push(d.price);
  return pts;
}
function spark(d) {
  const pts = history(d), W = 326, H = 96, T = 10, B = 18, mx = Math.max(...pts) * 1.04, mn = Math.min(...pts) * .9;
  const x = i => 4 + i * (W - 8) / (pts.length - 1), y = v => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const lx = x(pts.length - 1), ly = y(d.price);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="100%">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#009DE0" stop-opacity=".18"/><stop offset="1" stop-color="#009DE0" stop-opacity="0"/></linearGradient></defs>
    <path d="${path} L${lx},${H - B} L4,${H - B} Z" fill="url(#sg)"/>
    <path class="draw" pathLength="1" d="${path}" fill="none" stroke="#009DE0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${lx - 2}" cy="${ly}" r="5" fill="#fff" stroke="#009DE0" stroke-width="3"/>
    <text x="4" y="${H - 3}">12 wks ago</text><text x="${W - 4}" y="${H - 3}" text-anchor="end">Now</text></svg>`;
}
function openProduct(id) {
  const d = deal(id), s = STORES[d.store]; sheetId = id; sheetQty = qty(id) || 1;
  const others = DEALS.filter(x => x.img === d.img).sort((a, b) => a.price - b.price);
  const fav = S.favs.includes('p:' + id);
  sheet.innerHTML = `<div class="sheet-scroll">
    <div class="d-img">${imgTag(d.img)}<button class="round fav ${fav ? 'on' : ''}" id="p-fav">${I.heart}</button><button class="round x" id="p-x">${I.x}</button>${discBadge(d)}</div>
    <div class="d-body">
      <button class="store-chip" data-store="${s.id}"><span class="sdot" style="background:${s.color}">${s.mono[0]}</span>${s.name} · ${s.dist}</button>
      <h2>${d.name}</h2><div class="size">${d.size}</div>
      <div class="d-price"><b class="num">${money(d.price)}</b><s class="num">${money(d.was)}</s><span class="save-pill">Save ${money(saving(d))}</span></div>
      ${d.unit ? `<div class="unit">${d.unit}</div>` : ''}
      <div class="info-row">${I.clock}<span>Ends ${endLabel}<br><small>Special price for <b class="tleft">${left()}</b> more</small></span></div>
      <div class="card-b"><h4>Price history <span class="low-tag">Lowest in 12 weeks</span></h4>${spark(d)}</div>
      ${others.length > 1 ? `<div class="card-b"><h4>Compare stores</h4>${others.map((o, i) => { const os = STORES[o.store]; return `<div class="cmp">${logo(os)}<span class="n">${os.name}${i === 0 ? '<span class="best">BEST</span>' : ''}<small>${os.dist} · −${off(o)}%</small></span><span class="pr num" style="color:${o.id === d.id ? 'var(--blue)' : 'inherit'}">${money(o.price)}</span></div>`; }).join('')}</div>` : ''}
    </div></div>
    <div class="d-foot"><div class="qty"><button id="q-m">${I.minus}</button><span class="num" id="q-v">${sheetQty}</span><button id="q-p">${I.plus}</button></div>
      <button class="btn blue" id="p-add"><span>${qty(id) ? 'Update list' : 'Add to list'}</span><span class="num" id="p-tot">${money(d.price * sheetQty)}</span></button></div>`;
  sheet.classList.remove('short'); backdrop.classList.add('open'); sheet.classList.add('open');
  const upd = () => { $('#q-v').textContent = sheetQty; $('#p-tot').textContent = money(d.price * sheetQty); };
  $('#q-m').onclick = () => { sheetQty = Math.max(qty(id) ? 0 : 1, sheetQty - 1); upd(); };
  $('#q-p').onclick = () => { sheetQty = Math.min(20, sheetQty + 1); upd(); };
  $('#p-x').onclick = closeSheet;
  $('#p-fav').onclick = e => { S.favs = fav ? S.favs.filter(x => x !== 'p:' + id) : [...S.favs, 'p:' + id]; save(); e.currentTarget.classList.toggle('on'); };
  $('#p-add').onclick = e => {
    const was = qty(id); S.list[id] = sheetQty; if (!sheetQty) delete S.list[id]; save();
    if (sheetQty > was) fly(d, $('.d-img img', sheet));
    closeSheet(); refresh();
    toast(sheetQty ? `${d.name} · ${sheetQty} on your list` : 'Removed from list');
  };
}
function closeSheet() { sheet.classList.remove('open'); backdrop.classList.remove('open'); }
backdrop.onclick = closeSheet;

/* ---------------- Add / fly ---------------- */
function change(id, delta, srcEl) {
  const d = deal(id), before = qty(id);
  S.list[id] = Math.max(0, before + delta); if (!S.list[id]) { delete S.list[id]; delete S.done[id]; }
  save();
  if (delta > 0 && srcEl) fly(d, srcEl);
  refresh();
}
function fly(d, src) {
  const dr = device.getBoundingClientRect(), sr = src.getBoundingClientRect(), tr = $('.tab[data-tab="list"] .ic').getBoundingClientRect();
  const k = dr.width / device.offsetWidth || 1; // account for fit-to-screen zoom
  const f = document.createElement('div'); f.className = 'fly'; f.innerHTML = imgTag(d.img);
  const x0 = (sr.left - dr.left + sr.width / 2) / k - 22, y0 = (sr.top - dr.top + sr.height / 2) / k - 22;
  const x1 = (tr.left - dr.left + tr.width / 2) / k - 22, y1 = (tr.top - dr.top + tr.height / 2) / k - 22;
  f.style.left = x0 + 'px'; f.style.top = y0 + 'px'; device.appendChild(f);
  const mx = (x1 - x0) * .5, my = Math.min(y0, y1) - y0 - 120;
  f.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${mx}px,${my}px) scale(1.15) rotate(-12deg)`, opacity: 1, offset: .45 },
    { transform: `translate(${x1 - x0}px,${y1 - y0}px) scale(.25) rotate(8deg)`, opacity: .6 },
  ], { duration: 750, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = () => { f.remove(); const b = $('.tab[data-tab="list"] .bdg'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); };
}

/* ---------------- Global delegation ---------------- */
device.addEventListener('click', e => {
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (inc) { e.stopPropagation(); const card = inc.closest('.pcard, .li'); return change(inc.dataset.inc, 1, card ? $('img', card) : inc); }
  if (dec) { e.stopPropagation(); return change(dec.dataset.dec, -1); }
  if (e.target.closest('.add')) return;
  const st = e.target.closest('[data-store]'); if (st) { if (sheet.classList.contains('open')) closeSheet(); return openStore(st.dataset.store); }
  const op = e.target.closest('[data-open]'); if (op) return openProduct(op.dataset.open);
  const cat = e.target.closest('[data-cat]'); if (cat && cat.closest('#screen-discover')) { catFilter = catFilter === cat.dataset.cat ? null : cat.dataset.cat; renderDiscover(); if (catFilter) $('#screen-discover').scrollTo({ top: 330, behavior: 'smooth' }); return; }
  const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
});

/* ---------------- Tabs / cart bar ---------------- */
const TABS = [['discover', 'Discover', I.compass], ['stores', 'Stores', I.store], ['search', 'Search', I.search], ['list', 'List', I.list]];
$('#tabbar').innerHTML = TABS.map(([k, l, ic]) => `<button class="tab ${k === 'discover' ? 'active' : ''}" data-tab="${k}">${ic}<span>${l}</span>${k === 'list' ? '<span class="bdg num"></span>' : ''}</button>`).join('');
$$('.tab').forEach(t => t.onclick = () => go(t.dataset.tab));
let current = 'discover';
function go(tab) {
  current = tab; device.classList.remove('still');
  view.classList.remove('open'); $('.statusbar').classList.remove('light'); closeSheet();
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  TABS.forEach(([k]) => $('#screen-' + k).classList.toggle('hidden', k !== tab));
  render(tab); $('#screen-' + tab).scrollTop = 0; updateBar();
}
function render(tab) { ({ discover: renderDiscover, stores: renderStores, search: renderSearch, list: renderList })[tab](); }
function refresh() {
  // re-render in place, keeping scroll positions
  device.classList.add('still');
  const scr = $('#screen-' + current), y = scr.scrollTop, hs = $$('.hs', scr).map(h => h.scrollLeft);
  if (current === 'search') { const yy = y; renderSearch(); scr.scrollTop = yy; } else render(current);
  scr.scrollTop = y; $$('.hs', scr).forEach((h, i) => h.scrollLeft = hs[i] || 0);
  if (view.classList.contains('open')) { const vy = view.scrollTop; renderStoreView(); view.scrollTop = vy; }
  updateBar();
}
function updateBar() {
  const t = listTotals(), bar = $('#cartbar'), b = $('.tab[data-tab="list"] .bdg');
  b.textContent = t.n; b.classList.toggle('show', t.n > 0);
  bar.innerHTML = `<span class="cnt num">${t.n}</span><span class="lbl">View list<small>Saving ${money(t.saved)}</small></span><span class="tot num">${money(t.total)}</span>`;
  bar.classList.toggle('show', t.n > 0 && current !== 'list');
}
$('#cartbar').onclick = () => go('list');

/* ---------------- Toast / clock / timers ---------------- */
let tt;
function toast(m) { const t = $('#toast'); t.innerHTML = `${I.tag}${m}`; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); }
const pad = n => String(n).padStart(2, '0');
const clock = () => { const d = new Date(); $('#clock').textContent = `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`; $$('.tleft').forEach(e => e.textContent = left()); };
clock(); setInterval(clock, 30000);

go('discover');
})();
