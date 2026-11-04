// Accessible audio for every page: a "Listen to this page" bar (play/pause/stop/speed/previous/next, current section
// highlighted), speaker icons beside headings, cards and labels, and a "Tap to listen" mode.
// This is concatenated into the browser script served at /api/i18n/client (see client-script.ts), so it shares that
// script's scope: cur, BY, mem, pending, translated(), translateKeys(), ttsBlob(), store(), toast(), stopAudio(), path.
// Keep this file free of backticks and dollar-brace sequences: it is a raw string.
export const AUDIO_BODY = String.raw`
/* ================= accessible audio ================= */
var AUS = {
  listen:  {en: 'Listen to this page', hi: 'इस पृष्ठ को सुनें', ur: 'اس صفحے کو سنیں'},
  play:    {en: 'Play', hi: 'चलाएँ', ur: 'چلائیں'},
  pause:   {en: 'Pause', hi: 'विराम दें', ur: 'توقف کریں'},
  stop:    {en: 'Stop', hi: 'बंद करें', ur: 'بند کریں'},
  prev:    {en: 'Previous section', hi: 'पिछला भाग', ur: 'پچھلا حصہ'},
  next:    {en: 'Next section', hi: 'अगला भाग', ur: 'اگلا حصہ'},
  speed:   {en: 'Reading speed', hi: 'पढ़ने की गति', ur: 'پڑھنے کی رفتار'},
  tap:     {en: 'Tap to listen', hi: 'छूकर सुनें', ur: 'چھو کر سنیں'},
  icons:   {en: 'Speaker icons', hi: 'स्पीकर आइकन', ur: 'اسپیکر آئیکن'},
  close:   {en: 'Close listening bar', hi: 'सुनने की पट्टी बंद करें', ur: 'سننے کی پٹی بند کریں'},
  hear:    {en: 'Listen to this section', hi: 'इस भाग को सुनें', ur: 'اس حصے کو سنیں'},
  section: {en: 'Section', hi: 'भाग', ur: 'حصہ'},
  paused:  {en: 'Paused', hi: 'विराम पर', ur: 'توقف پر'},
  skip:    {en: 'Skip to listening controls', hi: 'सुनने के नियंत्रणों पर जाएँ', ur: 'سننے کے کنٹرولز پر جائیں'},
  tapOn:   {en: 'Tap any text to hear it. Links and buttons will not open while this is on.', hi: 'किसी भी पाठ को छूकर सुनें। इसके चालू रहने तक लिंक और बटन नहीं खुलेंगे।', ur: 'کسی بھی متن کو چھو کر سنیں۔ اس کے آن رہنے تک لنک اور بٹن نہیں کھلیں گے۔'},
  loading: {en: 'Getting the audio ready…', hi: 'ऑडियो तैयार हो रहा है…', ur: 'آڈیو تیار ہو رہی ہے…'},
  waiting: {en: 'Waiting for the page to finish translating…', hi: 'पृष्ठ का अनुवाद पूरा होने की प्रतीक्षा है…', ur: 'صفحے کے ترجمے کے مکمل ہونے کا انتظار ہے…'},
  nothing: {en: 'There is no text to read on this page.', hi: 'इस पृष्ठ पर पढ़ने के लिए कोई पाठ नहीं है।', ur: 'اس صفحے پر پڑھنے کے لیے کوئی متن نہیں ہے۔'},
  novoice: {en: 'Spoken audio is not available in this language yet. The page text is still translated.', hi: 'इस भाषा में बोला हुआ ऑडियो अभी उपलब्ध नहीं है। पृष्ठ का पाठ फिर भी अनूदित है।', ur: 'اس زبان میں بولی ہوئی آڈیو ابھی دستیاب نہیں ہے۔ صفحے کا متن پھر بھی ترجمہ شدہ ہے۔'},
  off:     {en: 'Audio is not switched on for this site yet.', hi: 'इस साइट पर ऑडियो अभी चालू नहीं किया गया है।', ur: 'اس سائٹ پر آڈیو ابھی آن نہیں کی گئی۔'},
  busy:    {en: 'Too many audio requests right now. Please try again in a little while.', hi: 'अभी ऑडियो के बहुत अनुरोध हो रहे हैं। कृपया थोड़ी देर बाद फिर प्रयास करें।', ur: 'اس وقت آڈیو کی بہت درخواستیں ہو رہی ہیں۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔'},
  fail:    {en: 'Could not play the audio. Please try again.', hi: 'ऑडियो नहीं चल सका। कृपया फिर से प्रयास करें।', ur: 'آڈیو نہیں چل سکی۔ براہِ کرم دوبارہ کوشش کریں۔'}
};
var AUK = Object.keys(AUS);
var AUL = {};
var AU = {
  state: 'idle',            // idle | loading | playing | paused
  token: 0, queue: [], qi: -1, chunks: [], ci: 0, single: false, target: null,
  speed: 1, icons: false, tap: false, open: false, primed: false, resume: null, note: '', url: '',
  reg: new Map(), root: null, ui: {}, timer: null, placeTimer: null
};
var auEl = null, auMem = {}, auHl = null;
var AUSKIP = {SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, CANVAS: 1, IFRAME: 1, VIDEO: 1, AUDIO: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, INPUT: 1, OBJECT: 1, EMBED: 1};
var AUNOLATIN = {};
function auT(k) { return AUL[k] || AUS[k].en; }

/* ---------- labels in the current language ---------- */
function auLoadLabels() {
  var code = cur;
  AUL = {};
  if (code !== 'en') {
    AUK.forEach(function (k) { if (AUS[k][code]) AUL[k] = AUS[k][code]; });
    if (Object.keys(AUL).length < AUK.length) {
      var raw = store('ml_au_' + code);
      if (raw) { try { var o = JSON.parse(raw); AUK.forEach(function (k) { if (!AUL[k] && o[k]) AUL[k] = o[k]; }); } catch (e) {} }
    }
  }
  auUi();
  if (code === 'en' || Object.keys(AUL).length >= AUK.length) return;
  var need = AUK.filter(function (k) { return !AUL[k]; });
  translateKeys(code, need.map(function (k) { return AUS[k].en; })).then(function (tr) {
    if (code !== cur) return;
    need.forEach(function (k, i) { if (tr[i]) AUL[k] = tr[i]; });
    var o2 = {}; AUK.forEach(function (k) { if (AUL[k]) o2[k] = AUL[k]; });
    store('ml_au_' + code, JSON.stringify(o2));
    auUi();
  }).catch(function () {});
}

/* ---------- finding the readable text ---------- */
function auSkipEl(el) {
  var t = el.tagName;
  if (AUSKIP[t] || t === 'NAV') return true;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true' || el.getAttribute('role') === 'navigation') return true;
  if (el.hasAttribute('data-no-listen') || el.hasAttribute('data-no-translate')) return true;
  if (el.id === 'ml-au' || el.id === 'ml-lang' || el.id === 'ml-panel' || el.id === 'ml-toast' || el.id === 'ml-bar') return true;
  if (el.classList && el.classList.contains('ml-au-x')) return true;
  if (t === 'HEADER' && (el.parentElement === document.body || el.querySelector('nav'))) return true;
  var cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return true;
  return false;
}
function auBlockOf(el, cache) {
  while (el && el !== document.body && el !== document.documentElement) {
    var d = cache.get(el);
    if (d === undefined) { d = getComputedStyle(el).display; cache.set(el, d); }
    if (d.indexOf('inline') !== 0 && d !== 'contents' && d !== 'none') return el;
    el = el.parentElement;
  }
  return el === document.body ? el : null;
}
function auClean(t) { return t.replace(/\s+/g, ' ').trim(); }
function auHasWord(t) { return t.length >= 2 && /[\p{L}]/u.test(t); }
function auSections() {
  var out = [], idx = new Map(), cache = new Map();
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) { return n.nodeType === 1 ? (auSkipEl(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT; }
  });
  var n;
  while ((n = w.nextNode())) {
    var s = n.nodeValue;
    if (!s || !/\S/.test(s)) continue;
    var b = auBlockOf(n.parentElement, cache);
    if (!b) continue;
    var rec = idx.get(b);
    if (!rec) { rec = {el: b, parts: []}; idx.set(b, rec); out.push(rec); }
    rec.parts.push(s);
  }
  var res = [];
  out.forEach(function (r) {
    var text = auClean(r.parts.join(' '));
    if (!auHasWord(text)) return;
    var rc = r.el.getBoundingClientRect();
    if (rc.width < 2 || rc.height < 2) return;
    res.push({el: r.el, text: text});
  });
  return res;
}
function auJoin(arr) { return arr.map(function (t) { return /[.!?:;,\u0964\u06D4\u061F]$/.test(t) ? t : t + '.'; }).join(' '); }
// Text of one element for a tap or an icon: its own text, or everything under it when it is a small container.
function auOwnText(el) {
  var cache = new Map(), own = [], all = [];
  var w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) { return n.nodeType === 1 ? (auSkipEl(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT; }
  });
  var n;
  while ((n = w.nextNode())) {
    var s = auClean(n.nodeValue || '');
    if (!s) continue;
    all.push(s);
    if (auBlockOf(n.parentElement, cache) === el) own.push(s);
  }
  var o = auClean(own.join(' '));
  if (auHasWord(o)) return o;
  var a = auJoin(all);
  return auHasWord(a) && a.length <= 500 ? a : '';
}
function auShort(t) { t = auClean(t); return t.length > 60 ? t.slice(0, 57) + '\u2026' : t; }

/* text that is sent to the voice */
var AUCUR = {en: ' rupees', hi: ' रुपये', ur: ' روپے'};
function auSay(t) {
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u2190-\u2193]/gu, ' ');
  t = t.replace(/\u20B9\s?([\d,.]+)/g, function (m, n) { return n + (AUCUR[cur] || ' INR'); });
  t = t.replace(/\s\u00B7\s/g, ', ').replace(/\s+/g, ' ').trim();
  return t;
}
function auLatinShare(t) {
  var l = (t.match(/\p{L}/gu) || []).length, a = (t.match(/[A-Za-z]/g) || []).length;
  return l ? a / l : 0;
}
function auNeedsTr(t) { return cur !== 'en' && cur !== 'fr' && cur !== 'de' && auLatinShare(t) > 0.6; }
function auChunks(text) {
  var out = [], max = 900, cur2 = '';
  var parts = text.match(/[^.!?\u0964\u06D4\u061F\n]+[.!?\u0964\u06D4\u061F]*\s*/g) || [text];
  parts.forEach(function (p) {
    if (cur2 && (cur2 + p).length > max) { out.push(cur2.trim()); cur2 = ''; }
    while (p.length > max) {
      var cut = p.lastIndexOf(' ', max);
      if (cut < max * 0.5) cut = max;
      if (cur2) { out.push(cur2.trim()); cur2 = ''; }
      out.push(p.slice(0, cut).trim()); p = p.slice(cut);
    }
    cur2 += p;
  });
  if (cur2.trim()) out.push(cur2.trim());
  return out.filter(function (c) { return c.length > 0; });
}

/* ---------- audio cache: memory + Cache Storage (survives reloads), on top of the server cache ---------- */
function auHash(s) {
  if (window.crypto && crypto.subtle && window.TextEncoder) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  var h = 5381, i;
  for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Promise.resolve('x' + (h >>> 0).toString(36) + '-' + s.length);
}
function auTrim(c) {
  c.keys().then(function (ks) { if (ks.length > 250) ks.slice(0, ks.length - 200).forEach(function (k) { c.delete(k); }); }).catch(function () {});
}
function auFetch(code, text, c, url) {
  return ttsBlob(code, text, 1).then(function (blob) {
    if (c) { try { c.put(url, new Response(blob, {headers: {'Content-Type': 'audio/mpeg'}})).then(function () { auTrim(c); }, function () {}); } catch (e) {} }
    return blob;
  });
}
function auBlob(code, text) {
  var key = code + '|' + text;
  if (auMem[key]) return auMem[key];
  var keys = Object.keys(auMem);
  if (keys.length > 60) delete auMem[keys[0]];
  var p = auHash(code + '|1|' + text).then(function (h) {
    var url = '/__ml-tts/v1/' + code + '/' + h;
    if (!window.caches) return auFetch(code, text, null, url);
    return caches.open('ml-tts-v1').then(function (c) {
      return c.match(url).then(function (hit) { return hit ? hit.blob() : auFetch(code, text, c, url); });
    }, function () { return auFetch(code, text, null, url); });
  });
  auMem[key] = p;
  p.catch(function () { delete auMem[key]; });
  return p;
}

/* ---------- playback ---------- */
function auAudio() {
  if (auEl) return auEl;
  auEl = new Audio(); auEl.preload = 'auto';
  try { auEl.preservesPitch = true; } catch (e) {}
  auEl.addEventListener('ended', auEnded);
  auEl.addEventListener('error', function () { if (auEl.__real && AU.state !== 'idle') auFail(new Error('error')); });
  return auEl;
}
function auSilence() {
  var n = 800, b = new ArrayBuffer(44 + n), v = new DataView(b), i;
  function s(o, t) { for (var k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); }
  s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); s(36, 'data'); v.setUint32(40, n, true);
  for (i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b], {type: 'audio/wav'}));
}
// Some phones only allow audio to start inside a tap. Play a moment of silence now so later chunks may follow.
function auPrime() {
  if (AU.primed) return;
  AU.primed = true;
  try { var a = auAudio(); a.__real = false; a.src = auSilence(); var p = a.play(); if (p && p.catch) p.catch(function () { AU.primed = false; }); } catch (e) { AU.primed = false; }
}
function auSet(s) { AU.state = s; auUi(); }
function auRelease() { if (AU.url) { try { URL.revokeObjectURL(AU.url); } catch (e) {} AU.url = ''; } }
function auHalt() {
  AU.token++; AU.resume = null; AU.note = '';
  if (auEl) { try { auEl.pause(); } catch (e) {} auEl.__real = false; }
  auRelease();
}
function auStop() {
  auHalt(); AU.queue = []; AU.qi = -1; AU.chunks = []; AU.ci = 0; AU.target = null; AU.single = false;
  auHighlight(null); auSet('idle');
}
function auFail(e) {
  var m = e && e.message, k = 'fail';
  if (m === 'no_voice') k = 'novoice'; else if (m === 'not_configured') k = 'off'; else if (m === 'rate_limited' || m === 'budget') k = 'busy';
  auStop(); toast(auT(k));
}
function auReady(text) {
  var code = cur, tries = 0;
  function wait() {
    if (pending > 0 && tries++ < 40) { AU.note = 'waiting'; auUi(); return new Promise(function (r) { setTimeout(r, 200); }).then(wait); }
    AU.note = '';
    return text;
  }
  return Promise.resolve().then(wait).then(function (t) { return auNeedsTr(t) ? translated(t, code) : t; });
}
function auHighlight(el) {
  if (auHl && auHl !== el) auHl.classList.remove('ml-au-hl');
  auHl = el;
  if (!el) return;
  el.classList.add('ml-au-hl');
  var r = el.getBoundingClientRect(), vh = window.innerHeight || 700;
  if (r.top < 70 || r.bottom > vh - 120) {
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { el.scrollIntoView({block: r.height > vh * 0.6 ? 'start' : 'center', behavior: calm ? 'auto' : 'smooth'}); } catch (e) { el.scrollIntoView(); }
  }
}
function auPlayItem(tk) {
  var it = AU.queue[AU.qi];
  if (!it) return auStop();
  AU.target = it.el; auHighlight(it.el); auSet('loading');
  auReady(it.text).then(function (text) {
    if (tk !== AU.token) return;
    var chunks = auChunks(auSay(text));
    if (!chunks.length) {
      if (!AU.single && AU.qi + 1 < AU.queue.length) { AU.qi++; return auPlayItem(tk); }
      return auStop();
    }
    AU.chunks = chunks; AU.ci = 0;
    auPlayChunk(tk);
  }).catch(function (e) { if (tk === AU.token) auFail(e); });
}
function auNextChunkText() {
  if (AU.ci + 1 < AU.chunks.length) return AU.chunks[AU.ci + 1];
  if (!AU.single && AU.qi + 1 < AU.queue.length) {
    var t = AU.queue[AU.qi + 1].text;
    if (auNeedsTr(t)) return '';
    var c = auChunks(auSay(t));
    return c[0] || '';
  }
  return '';
}
function auPlayChunk(tk) {
  if (tk !== AU.token) return;
  var code = cur, text = AU.chunks[AU.ci];
  auBlob(code, text).then(function (blob) {
    if (tk !== AU.token) return;
    var go = function () {
      if (tk !== AU.token) return;
      var a = auAudio();
      auRelease(); AU.url = URL.createObjectURL(blob);
      a.__real = true; a.src = AU.url; a.defaultPlaybackRate = AU.speed; a.playbackRate = AU.speed;
      var p = a.play();
      var ok = function () {
        if (tk !== AU.token) return;
        auSet('playing');
        var nx = auNextChunkText();
        if (nx) auBlob(code, nx).catch(function () {});
      };
      if (p && p.then) p.then(ok, function (e) { if (tk === AU.token) { if (e && e.name === 'NotAllowedError') { auStop(); toast(auT('fail')); } else auFail(e); } });
      else ok();
    };
    if (AU.state === 'paused') { AU.resume = go; return; }
    go();
  }).catch(function (e) { if (tk === AU.token) auFail(e); });
}
function auEnded() {
  if (!auEl || !auEl.__real || AU.state !== 'playing') return;
  var tk = AU.token;
  if (AU.ci + 1 < AU.chunks.length) { AU.ci++; return auPlayChunk(tk); }
  if (!AU.single && AU.qi + 1 < AU.queue.length) { AU.qi++; return auPlayItem(tk); }
  auStop();
}
function auSilenceOthers() {
  try { stopAudio(); } catch (e) {}
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e2) {}
}
function auVoiceOk() { return !!(BY[cur] && BY[cur].tts); }
function auBegin(queue, i, single) {
  if (!auVoiceOk()) { toast(auT('novoice')); return; }
  auPrime(); auSilenceOthers(); auHalt();
  AU.queue = queue; AU.qi = i; AU.single = !!single;
  auPlayItem(AU.token);
}
function auPlayPage(from) {
  var secs = auSections();
  if (!secs.length) { toast(auT('nothing')); return; }
  var i = 0;
  if (from === undefined) {
    for (var k = 0; k < secs.length; k++) { var r = secs[k].el.getBoundingClientRect(); if (r.bottom > 80 && r.top < (window.innerHeight || 700)) { i = k; break; } }
  } else i = Math.max(0, Math.min(secs.length - 1, from));
  auBegin(secs, i, false);
}
function auSingle(el, text) {
  text = auClean(text || '');
  if (!auHasWord(text)) return;
  if (AU.single && AU.target === el && (AU.state === 'playing' || AU.state === 'loading')) { auStop(); return; }
  auBegin([{el: el, text: text}], 0, true);
}
function auToggle() {
  if (AU.state === 'playing' || AU.state === 'loading') { auPause(); return; }
  if (AU.state === 'paused') { auResume(); return; }
  auPlayPage();
}
function auPause() {
  if (AU.state === 'playing') { try { auEl.pause(); } catch (e) {} auSet('paused'); }
  else if (AU.state === 'loading') auSet('paused');
}
function auResume() {
  if (AU.state !== 'paused') return;
  if (AU.resume) { var f = AU.resume; AU.resume = null; auSet('loading'); f(); return; }
  if (auEl && auEl.__real && auEl.src) { var p = auEl.play(); auSet('playing'); if (p && p.catch) p.catch(function () { auSet('paused'); }); return; }
  auSet('loading');
}
function auGo(d) {
  var secs = auSections();
  if (!secs.length) { toast(auT('nothing')); return; }
  var i = -1, t = AU.target, k;
  if (t) for (k = 0; k < secs.length; k++) if (secs[k].el === t) { i = k; break; }
  if (i < 0 && t) {
    // the current element is a card or heading that is not one section: use its place in the page
    for (k = 0; k < secs.length; k++) { if (t.contains(secs[k].el) || (t.compareDocumentPosition(secs[k].el) & 4)) { i = d > 0 ? k - 1 : k; break; } }
    if (i < 0) i = secs.length - 1;
  }
  if (i < 0) { auPlayPage(); return; }
  var n = i + d;
  if (n < 0) n = 0;
  if (n >= secs.length) { auStop(); return; }
  auBegin(secs, n, false);
}
function auSetSpeed(v) {
  v = Number(v) || 1; AU.speed = v; store('ml_au_speed', String(v));
  if (auEl) { auEl.defaultPlaybackRate = v; auEl.playbackRate = v; }
}

/* ---------- speaker icons ---------- */
var AUSPK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function auIsCard(el, memo) {
  var c = memo.get(el);
  if (c !== undefined) return c;
  var res = false, t = el.tagName;
  if (el !== document.body && t !== 'MAIN' && t !== 'HEADER' && t !== 'FOOTER' && t !== 'NAV' && t !== 'SECTION' || el.classList.contains('ml-card')) {
    var cs = getComputedStyle(el), rad = parseFloat(cs.borderTopLeftRadius) || 0, bw = parseFloat(cs.borderTopWidth) || 0;
    var bg = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    var vis = bw > 0 || (cs.boxShadow && cs.boxShadow !== 'none') || bg;
    var r = el.getBoundingClientRect();
    res = (t === 'ARTICLE' || (rad >= 12 && rad < 200 && vis)) && r.width >= 120 && r.height >= 50;
  }
  memo.set(el, res);
  return res;
}
function auWanted(secs) {
  var want = new Map(), memo = new Map(), groups = new Map();
  secs.forEach(function (s) {
    var h = s.el.closest('h1,h2,h3,h4,h5,h6,[role=heading]'), l = s.el.closest('label,legend,figcaption,caption');
    var host = h || l;
    if (host && !host.closest('a,button,[role=button],summary') && !want.has(host)) want.set(host, {kind: h ? 'heading' : 'label', el: host, text: s.text});
    var e = s.el, d = 0;
    while (e && e !== document.body && d < 7) {
      if (auIsCard(e, memo)) { if (!groups.has(e)) groups.set(e, []); groups.get(e).push(s); break; }
      e = e.parentElement; d++;
    }
  });
  groups.forEach(function (list, card) {
    if (list.length < 2 || list.length > 14) return;
    var host = card.closest('a,button,[role=button]') || card;
    if (want.has(host)) return;
    want.set(host, {kind: 'card', el: card, text: auJoin(list.map(function (s) { return s.text; }))});
  });
  return want;
}
function auMakeIcon() {
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'ml-au-x ml-au-icon'; b.setAttribute('translate', 'no');
  b.setAttribute('aria-pressed', 'false'); b.innerHTML = AUSPK;
  return b;
}
function auClearIcons() { AU.reg.forEach(function (rec) { rec.btn.remove(); }); AU.reg.clear(); }
function auDecorate() {
  AU.timer = null;
  auClearIcons();
  return;
}
function auPlace() {
  AU.placeTimer = null;
  AU.reg.forEach(function (rec, host) {
    var b = rec.btn;
    if (!host.isConnected) return;
    var hr = host.getBoundingClientRect(), cs = getComputedStyle(host);
    if (hr.width < 2 || hr.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') { b.style.display = 'none'; return; }
    b.style.display = '';
    var sz = b.offsetWidth || 32, rtl = cs.direction === 'rtl', op = b.offsetParent, ox, oy, vx, vy;
    var ps = op ? getComputedStyle(op).position : 'static';
    if (op && (ps !== 'static' || (op !== document.body && op !== document.documentElement))) {
      var pr = op.getBoundingClientRect(); ox = pr.left + op.clientLeft - op.scrollLeft; oy = pr.top + op.clientTop - op.scrollTop;
    } else { ox = -window.pageXOffset; oy = -window.pageYOffset; }
    if (rec.kind === 'card') {
      vy = hr.top + 8; vx = rtl ? hr.left + 8 : hr.right - sz - 8;
    } else {
      var rg = document.createRange(); rg.selectNodeContents(host);
      var rs = rg.getClientRects(), last = null, i;
      for (i = 0; i < rs.length; i++) {
        var q = rs[i];
        if (q.width <= 0) continue;
        if (!last || q.bottom > last.bottom + 1 || (Math.abs(q.bottom - last.bottom) <= 1 && (rtl ? q.left < last.left : q.right > last.right))) last = q;
      }
      if (!last) last = hr;
      vy = last.top + (last.height - sz) / 2;
      vx = rtl ? last.left - sz - 6 : last.right + 6;
    }
    var vw = document.documentElement.clientWidth || window.innerWidth;
    vx = Math.max(4, Math.min(vx, vw - sz - 4));
    b.style.left = (vx - ox) + 'px'; b.style.top = (vy - oy) + 'px';
  });
}
function auSchedule() { if (!AU.timer) AU.timer = setTimeout(auDecorate, 900); }
function auSchedulePlace() { if (!AU.placeTimer) AU.placeTimer = setTimeout(auPlace, 80); }
function auOurs(n) { var e = n.nodeType === 1 ? n : n.parentElement; return !!(e && e.closest && e.closest('.ml-au-x, #ml-au, #ml-lang, #ml-panel, #ml-toast, #ml-bar')); }

/* ---------- the bar ---------- */
var AUCSS = [
  '#ml-au{position:fixed;left:12px;bottom:12px;z-index:2147482000;font-family:system-ui,sans-serif;font-size:16px;line-height:1.3;color:#111;max-width:calc(100vw - 24px)}',
  '#ml-au *{box-sizing:border-box}',
  '#ml-au button,.ml-au-skip{font-family:inherit;cursor:pointer}',
  '#ml-au-pill{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:6px 14px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);color:#1f2937;font-size:13px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.08);transition:all .2s ease}',
  '#ml-au-pill:hover{background:#fff;border-color:rgba(5,176,118,.4);box-shadow:0 4px 16px rgba(0,0,0,.12);transform:translateY(-1px)}',
  '#ml-au-pill svg{width:16px;height:16px;color:#05b076;flex:none}',
  '#ml-au-bar svg{width:20px;height:20px;flex:none}',
  '#ml-au-bar{display:none;width:min(760px,calc(100vw - 108px));min-width:min(320px,calc(100vw - 24px));padding:10px 12px;background:#fff;color:#111;border:2px solid #05b076;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.2)}',
  '#ml-au[data-open="1"] #ml-au-bar{display:block}#ml-au[data-open="1"] #ml-au-pill{display:none}',
  '#ml-au .ml-au-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
  '#ml-au .ml-au-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:44px;min-height:44px;padding:6px 12px;border:1px solid #9ca3af;border-radius:12px;background:#fff;color:#111;font-size:15px;font-weight:600}',
  '#ml-au .ml-au-b:hover{background:#eef2ff}#ml-au .ml-au-b[aria-pressed="true"]{background:#05b076;border-color:#05b076;color:#fff}',
  '#ml-au .ml-au-b:disabled{opacity:.45;cursor:not-allowed}',
  '#ml-au .ml-au-main{background:#05b076;border-color:#05b076;color:#fff}#ml-au .ml-au-main:hover{background:#049a68}',
  '#ml-au select{min-height:44px;padding:6px 10px;border:1px solid #9ca3af;border-radius:12px;background:#fff;color:#111;font-size:15px;font-family:inherit}',
  '#ml-au .ml-au-sp{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600}',
  '#ml-au .ml-au-sp span{white-space:nowrap}',
  '#ml-au .ml-au-gap{flex:1 1 8px}',
  '#ml-au .ml-au-status{margin-top:8px;font-size:14px;color:#374151;min-height:1.3em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '#ml-au .ml-au-status b{color:#111}#ml-au .ml-au-status bdi{unicode-bidi:isolate}',
  '#ml-au .ml-au-tapnote{margin-top:6px;padding:8px 10px;border-radius:10px;background:#fef3c7;color:#451a03;font-size:14px}',
  'html[dir="rtl"] #ml-au .ml-au-flip svg{transform:scaleX(-1)}',
  '#ml-au button:focus-visible,#ml-au select:focus-visible,.ml-au-skip:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
  '.ml-au-skip{position:absolute;left:8px;top:-100px;z-index:2147482100;padding:10px 16px;border:2px solid #05b076;border-radius:10px;background:#fff;color:#05b076;font-size:16px;font-weight:700}.ml-au-skip:focus{top:8px}',
  '.ml-au-icon{display:none!important;visibility:hidden!important;pointer-events:none!important}',
  '.ml-au-hl{outline:3px solid #05b076!important;outline-offset:3px!important;box-shadow:0 0 0 7px rgba(5,176,118,.35)!important;border-radius:6px}',
  'html.ml-au-open body{margin-bottom:150px!important}html.ml-au-open #ml-toast{bottom:150px!important}',
  'html.ml-au-tap h1:hover,html.ml-au-tap h2:hover,html.ml-au-tap h3:hover,html.ml-au-tap h4:hover,html.ml-au-tap p:hover,html.ml-au-tap li:hover,html.ml-au-tap label:hover,html.ml-au-tap blockquote:hover,html.ml-au-tap td:hover,html.ml-au-tap a:hover,html.ml-au-tap button:hover{outline:2px dashed #1d4ed8;outline-offset:2px}',
  '@media (max-width:640px){#ml-au-bar{width:calc(100vw - 108px)}#ml-au .ml-au-b .ml-au-lab{display:none}}',
  '@media (forced-colors:active){.ml-au-hl{outline-color:Highlight!important}.ml-au-icon,#ml-au .ml-au-b,#ml-au-pill{border:2px solid ButtonText}}',
  '@media (prefers-reduced-motion:reduce){#ml-au *{transition:none!important}}'
].join('');
var AUI = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  tap: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 11V5a1.5 1.5 0 0 1 3 0v5.5l5 1a2 2 0 0 1 1.6 2L18 18a3 3 0 0 1-3 2.6H11a3 3 0 0 1-2.4-1.2L5 15.5a1.6 1.6 0 0 1 2.4-2L9 15z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
};
function auBtn(act, cls, icon) {
  var b = document.createElement('button');
  b.type = 'button'; b.setAttribute('data-act', act); b.className = 'ml-au-b ' + (cls || '');
  b.innerHTML = icon + '<span class="ml-au-lab"></span>';
  AU.ui[act] = b;
  return b;
}
function auBuild() {
  if (document.getElementById('ml-au')) return;
  if (location.pathname.indexOf('/assessments') === 0 || location.pathname.indexOf('/experience') === 0 || location.pathname.indexOf('/consult') === 0) return;
  var st = document.createElement('style'); st.id = 'ml-au-css'; st.textContent = AUCSS; document.head.appendChild(st);
  var root = document.createElement('div'); root.id = 'ml-au'; root.setAttribute('translate', 'no'); root.setAttribute('role', 'region');
  var pill = document.createElement('button'); pill.id = 'ml-au-pill'; pill.type = 'button'; pill.setAttribute('aria-expanded', 'false'); pill.setAttribute('aria-controls', 'ml-au-bar');
  pill.innerHTML = AUSPK + '<span class="ml-au-lab"></span>';
  var bar = document.createElement('div'); bar.id = 'ml-au-bar';
  var row = document.createElement('div'); row.className = 'ml-au-row';
  var prev = auBtn('prev', 'ml-au-flip', AUI.prev), play = auBtn('play', 'ml-au-main', AUI.play), next = auBtn('next', 'ml-au-flip', AUI.next), stop = auBtn('stop', '', AUI.stop);
  [prev, play, next, stop].forEach(function (b) { b.querySelector('.ml-au-lab').style.display = 'none'; });
  var sp = document.createElement('label'); sp.className = 'ml-au-sp';
  var spl = document.createElement('span'); var sel = document.createElement('select');
  [0.75, 1, 1.25, 1.5, 2].forEach(function (v) { var o = document.createElement('option'); o.value = String(v); o.textContent = v + '\u00d7'; sel.appendChild(o); });
  sel.value = String(AU.speed); sp.appendChild(spl); sp.appendChild(sel);
  AU.ui.speedLabel = spl; AU.ui.speed = sel;
  var gap = document.createElement('span'); gap.className = 'ml-au-gap';
  var tap = auBtn('tap', '', AUI.tap), icons = auBtn('icons', '', AUSPK), close = auBtn('close', '', AUI.close);
  close.querySelector('.ml-au-lab').style.display = 'none';
  [prev, play, next, stop, sp, gap, tap, icons, close].forEach(function (n) { row.appendChild(n); });
  var status = document.createElement('div'); status.className = 'ml-au-status'; AU.ui.status = status;
  var note = document.createElement('div'); note.className = 'ml-au-tapnote'; note.style.display = 'none'; AU.ui.tapnote = note;
  bar.appendChild(row); bar.appendChild(status); bar.appendChild(note);
  root.appendChild(pill); root.appendChild(bar);
  document.body.appendChild(root);
  AU.root = root; AU.ui.pill = pill; AU.ui.bar = bar;
  var skip = document.createElement('button'); skip.type = 'button'; skip.className = 'ml-au-skip ml-au-x'; skip.setAttribute('translate', 'no');
  document.body.insertBefore(skip, document.body.firstChild); AU.ui.skip = skip;

  pill.addEventListener('click', function () { auOpen(true, true); });
  skip.addEventListener('click', function () { auOpen(true, true); });
  bar.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-act');
    if (a === 'play') auToggle();
    else if (a === 'stop') auStop();
    else if (a === 'prev') auGo(-1);
    else if (a === 'next') auGo(1);
    else if (a === 'tap') auSetTap(!AU.tap);
    else if (a === 'icons') { AU.icons = !AU.icons; store('ml_au_icons', AU.icons ? '1' : '0'); if (!AU.icons) auClearIcons(); else auDecorate(); auUi(); }
    else if (a === 'close') { auOpen(false, true); }
  });
  sel.addEventListener('change', function () { auSetSpeed(sel.value); });
}
function auOpen(on, focus) {
  AU.open = on;
  try { sessionStorage.setItem('ml_au_open', on ? '1' : '0'); } catch (e) {}
  auUi();
  if (focus) { var t = on ? AU.ui.play : AU.ui.pill; if (t) t.focus(); }
}
function auSetTap(on) {
  AU.tap = on;
  try { sessionStorage.setItem('ml_au_tap', on ? '1' : '0'); } catch (e) {}
  if (on && !auVoiceOk()) { AU.tap = false; toast(auT('novoice')); }
  auUi();
}
function auUi() {
  if (!AU.root) return;
  var voice = auVoiceOk(), busy = AU.state === 'playing' || AU.state === 'loading';
  var h = document.documentElement;
  AU.root.lang = cur;
  AU.root.setAttribute('aria-label', auT('listen'));
  AU.root.setAttribute('data-open', AU.open ? '1' : '0');
  h.classList.toggle('ml-au-open', AU.open); h.classList.toggle('ml-au-tap', AU.tap && voice);
  AU.ui.pill.querySelector('.ml-au-lab').textContent = auT('listen');
  AU.ui.pill.setAttribute('aria-expanded', AU.open ? 'true' : 'false');
  AU.ui.skip.textContent = auT('skip');
  var lab = function (k, text) { var b = AU.ui[k]; b.setAttribute('aria-label', text); var s = b.querySelector('.ml-au-lab'); if (s && s.style.display !== 'none') s.textContent = text; };
  lab('prev', auT('prev')); lab('next', auT('next')); lab('stop', auT('stop')); lab('close', auT('close'));
  lab('play', busy ? auT('pause') : auT('play'));
  AU.ui.play.querySelector('svg').outerHTML = busy ? AUI.pause : AUI.play;
  lab('tap', auT('tap')); lab('icons', auT('icons'));
  AU.ui.tap.setAttribute('aria-pressed', AU.tap && voice ? 'true' : 'false');
  AU.ui.icons.setAttribute('aria-pressed', AU.icons ? 'true' : 'false');
  AU.ui.speedLabel.textContent = auT('speed'); AU.ui.speed.setAttribute('aria-label', auT('speed'));
  AU.ui.speed.value = String(AU.speed);
  ['play', 'prev', 'next', 'tap', 'icons'].forEach(function (k) { AU.ui[k].disabled = !voice; });
  AU.ui.stop.disabled = !voice || AU.state === 'idle';
  AU.ui.tapnote.style.display = AU.tap && voice ? 'block' : 'none';
  AU.ui.tapnote.textContent = auT('tapOn');
  var s = AU.ui.status;
  if (!voice) s.textContent = auT('novoice');
  else if (AU.note) s.textContent = auT(AU.note);
  else if (AU.state === 'idle') s.textContent = '';
  else {
    var cnt = AU.single ? '' : auT('section') + ' <bdi dir="ltr">' + (AU.qi + 1) + ' / ' + AU.queue.length + '</bdi>: ';
    var cur3 = AU.queue[AU.qi];
    s.innerHTML = '';
    var b2 = document.createElement('b'); b2.innerHTML = cnt; s.appendChild(b2);
    s.appendChild(document.createTextNode((AU.state === 'paused' ? auT('paused') + ' \u00b7 ' : AU.state === 'loading' ? auT('loading') + ' ' : '') + (cur3 ? auShort(cur3.text) : '')));
  }
  AU.reg.forEach(function (rec) {
    var on = busy && AU.target === rec.el && AU.single;
    rec.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ---------- tap to listen ---------- */
function auTapText(t) {
  if (t.tagName === 'IMG') return auClean(t.getAttribute('alt') || '');
  var cache = new Map(), b = auBlockOf(t, cache), hops = 0;
  while (b && hops < 5) {
    var x = auOwnText(b);
    if (x) return {el: b, text: x};
    b = b.parentElement ? auBlockOf(b.parentElement, cache) : null; hops++;
  }
  return null;
}
function auFieldText(f) {
  var id = f.id, lb = id ? document.querySelector('label[for="' + id.replace(/"/g, '') + '"]') : null;
  if (!lb && f.closest) lb = f.closest('label');
  return auClean((lb && lb.textContent) || f.getAttribute('aria-label') || f.getAttribute('placeholder') || '');
}
function auOnClick(e) {
  if (!AU.tap || !auVoiceOk()) return;
  var t = e.target;
  if (!t || !t.closest || t.closest('#ml-au, #ml-lang, #ml-panel, #ml-toast, .ml-au-icon')) return;
  var tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { var ft = auFieldText(t); if (ft) auSingle(t, ft); return; }
  var hit = auTapText(t);
  if (!hit) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (typeof hit === 'string') auSingle(t, hit); else auSingle(hit.el, hit.text);
}

/* ---------- start-up and hooks ---------- */
function auOnLang() {
  auStop(); auClearIcons();
  if (!AU.root) return;
  auLoadLabels();
  if (!auVoiceOk()) auSetTap(false);
  auSchedule();
}
function auInit() {
  if (/^\/milo(\/|$)/.test(path) || document.getElementById('ml-au')) return;
  var sp = Number(store('ml_au_speed')); if (sp >= 0.5 && sp <= 2.5) AU.speed = sp;
  AU.icons = store('ml_au_icons') === '1';
  try { AU.open = sessionStorage.getItem('ml_au_open') === '1'; AU.tap = sessionStorage.getItem('ml_au_tap') === '1'; } catch (e) {}
  auBuild(); auLoadLabels();
  var mo2 = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.type === 'characterData') { if (!auOurs(m.target)) { auSchedule(); return; } continue; }
      var nodes = Array.prototype.slice.call(m.addedNodes).concat(Array.prototype.slice.call(m.removedNodes));
      for (var j = 0; j < nodes.length; j++) if (!auOurs(nodes[j])) { auSchedule(); return; }
    }
  });
  mo2.observe(document.body, {childList: true, subtree: true, characterData: true});
  window.addEventListener('click', auOnClick, true);
  window.addEventListener('resize', auSchedulePlace);
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented || AU.state === 'idle') return;
    if (panel && panel.classList.contains('open')) return;
    auStop();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) auPause(); });
  if (window.ResizeObserver) { try { new ResizeObserver(auSchedulePlace).observe(document.body); } catch (e) {} }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(auSchedulePlace);
  document.addEventListener('ml:langchange', auSchedulePlace);
  // When the site's own voice (Milo, the simulations) starts, stop ours so the two never overlap.
  if (window.speechSynthesis && !window.speechSynthesis.__mlAu) {
    var sy = window.speechSynthesis, was = sy.speak.bind(sy);
    sy.__mlAu = true;
    sy.speak = function (u) { if (AU.state !== 'idle') auStop(); return was(u); };
  }
  auUi(); auSchedule();
}
`

