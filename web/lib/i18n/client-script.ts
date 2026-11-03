// Browser script served at /api/i18n/client. It adds the language switcher to the top bar, translates every page's
// text at runtime (own pages and the proxied live site), and routes all spoken audio through neural voices.
// Keep this file free of backticks and dollar-brace sequences: it is a raw string.
export const CLIENT_BODY = String.raw`
var LS = 'ml_lang', TRK = 'ml_tr2_';
var LANGS = CFG.langs, BY = {};
LANGS.forEach(function (l) { BY[l.code] = l; });
var path = location.pathname;
if (path.indexOf('/team') === 0) return;

function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
var cur = 'en';
(function () {
  var q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  var s = q || store(LS);
  if (s && BY[s]) cur = s;
})();

var SKIPTAGS = {SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, KBD: 1, SAMP: 1, TEXTAREA: 1, IFRAME: 1};
var ATTRS = ['placeholder', 'title', 'alt', 'aria-label', 'aria-description'];
var nodeOrig = new WeakMap(), nodeApplied = new WeakMap(), attrOrig = new WeakMap(), lastMut = new WeakMap();
var touchedNodes = new Set(), touchedAttrs = new Set();
var mem = {}, gen = 0, pending = 0, failed = false, saveTimer = null;

function skipEl(el) {
  if (SKIPTAGS[el.tagName]) return true;
  if (el.getAttribute && (el.getAttribute('translate') === 'no' || el.hasAttribute('data-no-translate'))) return true;
  if (el.classList && el.classList.contains('notranslate')) return true;
  if (el.id === 'ml-lang' || el.id === 'ml-panel') return true;
  return false;
}
function worth(t) {
  if (!t || t.length > 2500) return false;
  if (!/[A-Za-z]{2,}/.test(t)) return false;
  if (/^\S+@\S+\.\S+$/.test(t) || /^(https?:\/\/|www\.)\S+$/.test(t)) return false;
  return true;
}
function split(s) { var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); return [m[1], m[2], m[3]]; }

function collectAttrs(el, acc) {
  if (!el.getAttribute) return;
  var list = ATTRS;
  for (var i = 0; i < list.length; i++) {
    var a = list[i], v = el.getAttribute(a);
    if (!v) continue;
    var rec = attrOrig.get(el); rec = rec || {};
    if (rec[a] && rec[a].applied === v) continue;
    if (!worth(v.trim())) continue;
    rec[a] = {orig: v, applied: null};
    attrOrig.set(el, rec);
    acc.push({el: el, a: a, s: v});
  }
  if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type || '')) {
    var val = el.getAttribute('value');
    if (val && worth(val.trim())) {
      var r2 = attrOrig.get(el) || {};
      if (!(r2.value && r2.value.applied === val)) { r2.value = {orig: val, applied: null}; attrOrig.set(el, r2); acc.push({el: el, a: 'value', s: val}); }
    }
  }
}
function collect(root, acc) {
  if (!root) return;
  if (root.nodeType === 3) { considerText(root, acc); return; }
  if (root.nodeType !== 1 || skipEl(root)) return;
  collectAttrs(root, acc);
  var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      if (n.nodeType === 1) { if (skipEl(n)) return NodeFilter.FILTER_REJECT; collectAttrs(n, acc); return NodeFilter.FILTER_SKIP; }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var n;
  while ((n = w.nextNode())) considerText(n, acc);
}
function considerText(n, acc) {
  var s = n.nodeValue;
  if (!s || nodeApplied.get(n) === s) return;
  var p = n.parentElement;
  if (p && p.closest && p.closest('[translate="no"],.notranslate,[data-no-translate],script,style,noscript,code,pre,textarea,#ml-lang,#ml-panel')) return;
  if (!worth(s.trim())) return;
  nodeOrig.set(n, s);
  acc.push({n: n, s: s});
}

function loadMem(code) {
  mem = {};
  var raw = store(TRK + code);
  if (raw) { try { mem = JSON.parse(raw) || {}; } catch (e) { mem = {}; } }
}
function saveMem() {
  if (saveTimer) return;
  saveTimer = setTimeout(function () {
    saveTimer = null;
    try { var s = JSON.stringify(mem); if (s.length < 1500000) store(TRK + cur, s); } catch (e) {}
  }, 1500);
}

function api(path2, body) {
  return fetch(path2, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
}
function translateKeys(code, keys) {
  return api('/api/i18n/translate', {lang: code, texts: keys}).then(function (r) {
    if (!r.ok) return r.json().then(function (j) { throw new Error((j && j.error) || 'error'); }, function () { throw new Error('error'); });
    return r.json();
  }).then(function (j) { return j.translations; });
}

function apply(items) {
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (it.done) continue;
    var parts = split(it.s), tr = mem[parts[1]];
    if (tr === undefined) continue;
    if (it.n) {
      if (!it.n.isConnected || it.n.nodeValue !== it.s) { it.done = true; continue; }
      var nv = parts[0] + tr + parts[2];
      nodeApplied.set(it.n, nv); it.n.nodeValue = nv; touchedNodes.add(it.n);
    } else {
      if (it.el.getAttribute(it.a) !== it.s) { it.done = true; continue; }
      var rec = attrOrig.get(it.el); if (rec && rec[it.a]) rec[it.a].applied = tr;
      it.el.setAttribute(it.a, tr); touchedAttrs.add(it.el);
    }
    it.done = true;
  }
}

function run(acc) {
  if (cur === 'en' || !acc.length) return;
  var myGen = gen, myLang = cur, need = [], seen = {};
  acc.forEach(function (it) { var k = split(it.s)[1]; if (mem[k] === undefined && !seen[k]) { seen[k] = 1; need.push(k); } });
  apply(acc);
  if (!need.length) return;
  var batches = [], b = [], chars = 0;
  need.forEach(function (k) {
    if (b.length >= 50 || chars + k.length > 6000) { batches.push(b); b = []; chars = 0; }
    b.push(k); chars += k.length;
  });
  if (b.length) batches.push(b);
  pending++; bar(true);
  var idx = 0;
  function next() {
    if (idx >= batches.length || gen !== myGen) return Promise.resolve();
    var cur2 = batches[idx++];
    return translateKeys(myLang, cur2).then(function (tr) {
      if (gen !== myGen) return;
      cur2.forEach(function (k, i) { mem[k] = tr[i]; });
      saveMem(); apply(acc);
    }).then(next);
  }
  Promise.all([next(), next(), next()]).catch(function (e) {
    if (gen !== myGen) return;
    failure(e && e.message);
  }).then(function () { pending--; if (!pending) bar(false); });
}
function failure(code) {
  if (failed) return;
  failed = true;
  var msg = code === 'not_configured' ? 'Translation is not switched on for this site yet.'
    : code === 'rate_limited' || code === 'budget' ? 'Too many translation requests right now. Please try again in a little while.'
    : 'Could not translate this page. Please try again.';
  toast(msg);
  setTimeout(function () { failed = false; }, 8000);
  if (code === 'not_configured') setLang('en', {silent: true});
}

function fullScan() { var acc = []; collect(document.documentElement, acc); run(acc); }

function revert() {
  touchedNodes.forEach(function (n) {
    if (n.isConnected && nodeApplied.get(n) === n.nodeValue && nodeOrig.has(n)) n.nodeValue = nodeOrig.get(n);
    nodeApplied.delete(n);
  });
  touchedNodes.clear();
  touchedAttrs.forEach(function (el) {
    var rec = attrOrig.get(el); if (!rec) return;
    Object.keys(rec).forEach(function (a) { if (rec[a].applied !== null && el.getAttribute(a) === rec[a].applied) el.setAttribute(a, rec[a].orig); rec[a].applied = null; });
  });
  touchedAttrs.clear();
}

/* ---------- mutation handling ---------- */
var queue = new Set(), qTimer = null;
function schedule() { if (!qTimer) qTimer = setTimeout(flush, 300); }
function flush() {
  qTimer = null;
  if (cur === 'en') { queue.clear(); return; }
  var now = Date.now(), acc = [], again = false;
  var roots = Array.from(queue); queue.clear();
  roots.forEach(function (r) {
    if (!r.isConnected) return;
    if (r.nodeType === 3 && now - (lastMut.get(r) || 0) < 600) { queue.add(r); again = true; return; }
    collect(r, acc);
  });
  run(acc);
  if (again) schedule();
}
var mo = new MutationObserver(function (muts) {
  var sawHeader = false;
  for (var i = 0; i < muts.length; i++) {
    var m = muts[i];
    if (m.type === 'childList') {
      for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; if (a.nodeType === 1 || a.nodeType === 3) queue.add(a); }
      sawHeader = true;
    } else if (m.type === 'characterData') {
      if (nodeApplied.get(m.target) === m.target.nodeValue) continue;
      lastMut.set(m.target, Date.now()); queue.add(m.target);
    } else if (m.type === 'attributes') {
      queue.add(m.target);
    }
  }
  if (sawHeader && wrap && !wrap.isConnected) mount();
  if (cur !== 'en' && queue.size) schedule();
});

/* ---------- fonts, direction, document language ---------- */
var fontLink = null;
function applyLook(code) {
  var l = BY[code], h = document.documentElement;
  if (code === 'en') { h.removeAttribute('data-ml-lang'); h.removeAttribute('data-ml-font'); h.lang = 'en'; h.dir = 'ltr'; h.style.removeProperty('--ml-font'); }
  else {
    h.setAttribute('data-ml-lang', code); h.lang = code; h.dir = l.rtl ? 'rtl' : 'ltr';
    if (l.font) {
      h.style.setProperty('--ml-font', '"' + l.font + '"'); h.setAttribute('data-ml-font', '1');
      if (!fontLink) { fontLink = document.createElement('link'); fontLink.rel = 'stylesheet'; document.head.appendChild(fontLink); }
      fontLink.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(l.font).replace(/%20/g, '+') + ':wght@400;500;600;700&display=swap';
    } else { h.style.removeProperty('--ml-font'); h.removeAttribute('data-ml-font'); }
  }
}

/* ---------- set language ---------- */
function setLang(code, opts) {
  opts = opts || {};
  if (!BY[code]) return;
  var prev = cur;
  cur = code; gen++; pending = 0; bar(false);
  store(LS, code);
  try { document.cookie = 'ml_lang=' + code + ';path=/;max-age=31536000;samesite=lax'; } catch (e) {}
  revert(); stopAudio();
  applyLook(code);
  updateButton();
  if (code !== 'en') { loadMem(code); fullScan(); }
  document.dispatchEvent(new CustomEvent('ml:langchange', {detail: {lang: code, previous: prev}}));
  // Recorded-clip samples are decoded once when the Experience page opens, so reload it to pick up the new language.
  if (!opts.silent && prev !== code && path.indexOf('/experience') === 0) location.reload();
}

/* ---------- audio ---------- */
var activeAudio = null, activeUtt = null, speakId = 0, audioCache = {}, noVoiceWarned = false;
function stopAudio() {
  speakId++;
  if (activeAudio) { try { activeAudio.pause(); } catch (e) {} activeAudio = null; }
  activeUtt = null;
}
function ttsBlob(code, text, rate) {
  var key = code + '|' + rate + '|' + text;
  if (audioCache[key]) return audioCache[key];
  var p = api('/api/i18n/speech', {lang: code, text: text, rate: rate}).then(function (r) {
    if (!r.ok) return r.json().then(function (j) { throw new Error((j && j.error) || 'error'); }, function () { throw new Error('error'); });
    return r.blob();
  });
  audioCache[key] = p;
  p.catch(function () { delete audioCache[key]; });
  return p;
}
function translated(text, code) {
  var k = split(text)[1];
  if (code === cur && mem[k] !== undefined) return Promise.resolve(mem[k]);
  return translateKeys(code, [k]).then(function (t) { if (code === cur) { mem[k] = t[0]; saveMem(); } return t[0]; });
}
function fire(u, type) {
  try { var h = u['on' + type]; if (typeof h === 'function') h.call(u, new Event(type)); } catch (e) {}
  try { u.dispatchEvent(new Event(type)); } catch (e) {}
}
var synth = window.speechSynthesis;
if (synth && !synth.__ml) {
  var oSpeak = synth.speak.bind(synth), oCancel = synth.cancel.bind(synth), oPause = synth.pause.bind(synth), oResume = synth.resume.bind(synth);
  synth.__ml = true;
  synth.speak = function (u) {
    if (cur === 'en') return oSpeak(u);
    var id = ++speakId, code = cur;
    activeUtt = u;
    translated(u.text, code).then(function (text) {
      if (id !== speakId) return;
      return ttsBlob(code, text, u.rate || 1).then(function (blob) {
        if (id !== speakId) return;
        var a = new Audio(URL.createObjectURL(blob));
        a.volume = Math.min(1, Math.max(0, u.volume === undefined ? 1 : u.volume));
        activeAudio = a;
        a.onplaying = function () { if (activeUtt === u && !u.__started) { u.__started = true; fire(u, 'start'); } };
        a.onended = function () { URL.revokeObjectURL(a.src); if (activeAudio === a) { activeAudio = null; activeUtt = null; } fire(u, 'end'); };
        a.onerror = function () { if (activeAudio === a) { activeAudio = null; activeUtt = null; } fire(u, 'error'); };
        return a.play();
      });
    }).catch(function (e) {
      if (id !== speakId) return;
      if (e && e.name === 'NotAllowedError') { activeUtt = null; fire(u, 'end'); return; }
      if (e && e.message === 'no_voice' && !noVoiceWarned) { noVoiceWarned = true; toast('Spoken audio is not available in ' + BY[code].name + ' yet. The text is translated.'); }
      else if (e && e.message !== 'no_voice') toast('Could not play audio in ' + BY[code].name + '.');
      activeUtt = null; fire(u, 'end');
    });
  };
  synth.cancel = function () { if (activeAudio || activeUtt) stopAudio(); return oCancel(); };
  synth.pause = function () { if (activeAudio) { try { activeAudio.pause(); } catch (e) {} return; } return oPause(); };
  synth.resume = function () { if (activeAudio) { try { activeAudio.play(); } catch (e) {} return; } return oResume(); };
}
// The recorded teacher clips are English. In another language, answer the request with synthesized speech of the translated transcript.
var oFetch = window.fetch;
window.fetch = function (input, init) {
  try {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var m = url.match(/\/sounds\/(teacher_[a-z0-9]+)\.mp3/);
    if (m && cur !== 'en' && CFG.clips[m[1]] && BY[cur].tts && !(init && init.method === 'HEAD')) {
      var code = cur;
      return translated(CFG.clips[m[1]], code).then(function (t) { return ttsBlob(code, t, 1); }).then(function (blob) {
        return new Response(blob, {status: 200, headers: {'Content-Type': 'audio/mpeg'}});
      }).catch(function () { return oFetch.call(window, input, init); });
    }
  } catch (e) {}
  return oFetch.apply(window, arguments);
};

/* ---------- UI ---------- */
var wrap = null, btn = null, panel = null, bartEl = null, toastEl = null;
var css = '#ml-lang{position:relative;display:inline-flex;align-items:center;margin:0 10px;font-family:inherit;z-index:60}'
  + '#ml-lang.ml-float{position:fixed;top:10px;right:10px;margin:0}'
  + '#ml-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:6px 12px;border:1px solid rgba(0,0,0,.18);border-radius:999px;background:#fff;color:#111;font-family:inherit;font-weight:500;font-size:16px;line-height:1;cursor:pointer;direction:ltr}'
  + '#ml-btn:hover{background:#f4f4f4}#ml-btn:focus-visible,#ml-panel button:focus-visible,#ml-q:focus-visible{outline:3px solid #2563eb;outline-offset:2px}'
  + '#ml-btn svg{width:22px;height:22px;flex:none}'
  + '#ml-panel{position:fixed;z-index:2147483000;width:min(420px,calc(100vw - 20px));max-height:min(70vh,560px);display:none;flex-direction:column;background:#fff;color:#111;border:1px solid rgba(0,0,0,.15);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.22);overflow:hidden;font-family:system-ui,sans-serif}'
  + '#ml-panel.open{display:flex}'
  + '#ml-q{margin:10px;padding:10px 12px;border:1px solid #bbb;border-radius:10px;font-size:16px}'
  + '#ml-list{overflow:auto;padding:0 8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}'
  + '#ml-list button{display:flex;flex-direction:column;align-items:flex-start;text-align:start;padding:8px 10px;border:1px solid #e3e3e3;border-radius:10px;background:#fff;color:#111;cursor:pointer;min-height:48px}'
  + '#ml-list button:hover{background:#f3f7ff}#ml-list button[aria-current=true]{border-color:#2563eb;background:#eaf1ff}'
  + '#ml-list b{font-size:17px;font-weight:600}#ml-list small{font-size:12px;color:#555}'
  + '@media(max-width:640px){#ml-panel{left:10px!important;right:10px!important;top:auto!important;bottom:10px;max-height:75vh}#ml-list{grid-template-columns:1fr}#ml-btn .ml-lab{display:none}}'
  + '#ml-bar{position:fixed;top:0;left:0;height:3px;width:0;background:#2563eb;z-index:2147483001;transition:width .4s;pointer-events:none}'
  + '#ml-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:min(90vw,460px);padding:12px 16px;background:#222;color:#fff;border-radius:10px;font:500 15px/1.4 system-ui,sans-serif;z-index:2147483002;display:none}'
  + 'html[data-ml-font] body,html[data-ml-font] body *:not(svg):not(svg *):not(#ml-lang *):not(#ml-panel *){font-family:var(--ml-font,system-ui),system-ui,sans-serif!important}';
var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c2.6 2.6 4 5.9 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-5.9-4-9.5s1.4-6.9 4-9.5z"/></svg>';

function build() {
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  wrap = document.createElement('div'); wrap.id = 'ml-lang'; wrap.setAttribute('translate', 'no');
  btn = document.createElement('button'); btn.id = 'ml-btn'; btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Change language'); btn.title = 'Language';
  btn.innerHTML = GLOBE + '<span class="ml-lab"></span>';
  wrap.appendChild(btn);
  panel = document.createElement('div'); panel.id = 'ml-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Choose language'); panel.setAttribute('translate', 'no');
  var q = document.createElement('input'); q.id = 'ml-q'; q.type = 'search'; q.placeholder = 'Search language'; q.setAttribute('aria-label', 'Search language'); q.autocomplete = 'off';
  var list = document.createElement('div'); list.id = 'ml-list';
  LANGS.forEach(function (l) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-code', l.code);
    b.setAttribute('data-q', (l.name + ' ' + l.native).toLowerCase());
    var n = document.createElement('b'); n.textContent = l.native; n.lang = l.code; if (l.rtl) n.dir = 'rtl';
    var s = document.createElement('small'); s.textContent = l.name + (l.tts ? '' : ' \u00b7 text only');
    b.appendChild(n); b.appendChild(s);
    b.addEventListener('click', function () { closePanel(); setLang(l.code); });
    list.appendChild(b);
  });
  q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase();
    Array.prototype.forEach.call(list.children, function (c) { c.style.display = !v || c.getAttribute('data-q').indexOf(v) >= 0 ? '' : 'none'; });
  });
  panel.appendChild(q); panel.appendChild(list);
  document.body.appendChild(panel);
  btn.addEventListener('click', function () { panel.classList.contains('open') ? closePanel() : openPanel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) { closePanel(); btn.focus(); } });
  document.addEventListener('click', function (e) { if (panel.classList.contains('open') && !panel.contains(e.target) && !wrap.contains(e.target)) closePanel(); });
  window.addEventListener('resize', function () { if (panel.classList.contains('open')) placePanel(); });
  bartEl = document.createElement('div'); bartEl.id = 'ml-bar'; bartEl.setAttribute('translate', 'no'); document.body.appendChild(bartEl);
  toastEl = document.createElement('div'); toastEl.id = 'ml-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); toastEl.setAttribute('translate', 'no'); document.body.appendChild(toastEl);
  updateButton();
}
function placePanel() {
  var r = btn.getBoundingClientRect();
  panel.style.top = (r.bottom + 8) + 'px';
  var right = Math.max(10, window.innerWidth - r.right);
  panel.style.right = right + 'px'; panel.style.left = 'auto';
}
function openPanel() {
  placePanel(); panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
  Array.prototype.forEach.call(panel.querySelectorAll('#ml-list button'), function (b) { b.setAttribute('aria-current', b.getAttribute('data-code') === cur ? 'true' : 'false'); });
  var q = document.getElementById('ml-q'); q.value = ''; q.dispatchEvent(new Event('input')); q.focus();
}
function closePanel() { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
function updateButton() {
  if (!btn) return;
  var l = BY[cur];
  btn.querySelector('.ml-lab').textContent = l.native;
  btn.setAttribute('aria-label', 'Change language. Current language: ' + l.name);
}
function mount() {
  if (!wrap) return false;
  var slot = document.getElementById('ml-lang-slot');
  if (slot) { if (wrap.parentNode !== slot) slot.appendChild(wrap); wrap.classList.remove('ml-float'); return true; }
  var hdr = document.querySelector('header');
  if (hdr) {
    var login = null, as = hdr.querySelectorAll('a,button');
    for (var i = 0; i < as.length; i++) { if (/login/i.test(as[i].getAttribute('href') || '') || /^\s*(log\s*in|login|sign\s*in)\s*$/i.test(as[i].textContent)) { login = as[i]; break; } }
    if (login) {
      var el = login;
      while (el.parentElement && el.parentElement !== hdr && el.parentElement.children.length === 1) el = el.parentElement;
      if (el.parentNode) { el.parentNode.insertBefore(wrap, el); wrap.classList.remove('ml-float'); return true; }
    }
    var row = hdr.firstElementChild;
    if (row && row.children.length) { row.appendChild(wrap); wrap.classList.remove('ml-float'); return true; }
  }
  if (!wrap.isConnected) document.body.appendChild(wrap);
  wrap.classList.add('ml-float');
  return false;
}
function bar(on) {
  if (!bartEl) return;
  bartEl.style.width = on ? '70%' : '100%';
  if (!on) setTimeout(function () { if (!pending) bartEl.style.width = '0'; }, 400);
}
var toastT = null;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg; toastEl.style.display = 'block';
  clearTimeout(toastT); toastT = setTimeout(function () { toastEl.style.display = 'none'; }, 6000);
}

function start() {
  build(); mount();
  var tries = 0, t = setInterval(function () { if (mount() || ++tries > 20) clearInterval(t); }, 500);
  mo.observe(document.documentElement, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  applyLook(cur);
  if (cur !== 'en') { loadMem(cur); fullScan(); }
}
window.mlI18n = {get lang() { return cur; }, set: setLang, languages: LANGS};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
`
