// Small script injected into the proxied live pages (before Milo).
// 1) Links/buttons that belong to THIS app are opened with a normal page load, because the live site's own
//    client-side router cannot navigate into our app (different build) and fails silently.
// 2) Adds a "Book a Consultation" item to the live header menu.
export const SITE_PATCH = '<script>' + String.raw`
(function () {
  var OWN = ['/consult', '/milo', '/experience', '/confirm', '/team'];
  var TEXT = {'experience what they feel': '/experience', 'book a consultation': '/consult', 'book expert consultation': '/consult'};

  function ownPath(href) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      if (u.pathname === '/experience-what-they-feel') return '/experience';
      for (var i = 0; i < OWN.length; i++) {
        if (u.pathname === OWN[i] || u.pathname.indexOf(OWN[i] + '/') === 0) return u.pathname + u.search;
      }
    } catch (e) {}
    return null;
  }

  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var dest = null;
    var a = t.closest('a[href]');
    if (a) dest = ownPath(a.getAttribute('href'));
    if (!dest) {
      var el = t.closest('a,button,[role=button]');
      if (el) {
        var label = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (TEXT[label]) dest = TEXT[label];
      }
    }
    if (!dest) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.assign(dest);
  }, true);

  function addNav() {
    var ul = document.querySelector('header nav[aria-label="Main"] ul');
    if (!ul || ul.querySelector('[data-bc]')) return;
    var items = ul.querySelectorAll(':scope > li');
    var base = null;
    for (var i = 0; i < items.length; i++) if (/contact us/i.test(items[i].textContent)) base = items[i];
    if (!base) base = items[items.length - 1];
    if (!base) return;
    var li = base.cloneNode(true);
    li.setAttribute('data-bc', '1');
    var a = li.querySelector('a');
    if (!a) return;
    a.setAttribute('href', '/consult');
    var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n, last = null;
    while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
    if (!last) return;
    last.nodeValue = 'Book a Consultation';
    li.style.opacity = '1'; li.style.transform = 'none';
    li.querySelectorAll('[style]').forEach(function (s) { s.style.opacity = '1'; s.style.transform = 'none'; });
    ul.insertBefore(li, base);
  }

  function start() {
    addNav();
    new MutationObserver(addNav).observe(document.documentElement, {childList: true, subtree: true});
  }
  if (document.readyState === 'complete') setTimeout(start, 1500);
  else window.addEventListener('load', function () { setTimeout(start, 1500); });
})();
` + '</script>'
