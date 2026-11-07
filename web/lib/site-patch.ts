// Small script injected into the proxied live pages (before Milo).
// 1) Links/buttons that belong to THIS app are opened with a normal page load, because the live site's own
//    client-side router cannot navigate into our app (different build) and fails silently.
// 2) Adds a "Book a Consultation" item to the live header menu. (Gamified Quests is in the live Assessments dropdown.)
export const SITE_PATCH = '<script>' + String.raw`
(function () {
  var OWN = ['/consult', '/milo', '/experience', '/confirm', '/team', '/pay', '/gamified-assessments'];
  var TEXT = {
    'experience what they feel': '/experience',
    'book a consultation': '/consult',
    'book expert consultation': '/consult',
    'gamified quests': '/gamified-assessments',
    'play gamified quests': '/gamified-assessments'
  };

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
    if (!ul) return;
    if (!ul.querySelector('[data-bc]')) {
      var items = ul.querySelectorAll(':scope > li');
      var base = null;
      for (var i = 0; i < items.length; i++) if (/contact us/i.test(items[i].textContent)) base = items[i];
      if (!base) base = items[items.length - 1];
      if (base) {
        var li = base.cloneNode(true);
        li.setAttribute('data-bc', '1');
        var a = li.querySelector('a');
        if (a) {
          a.setAttribute('href', '/consult');
          var w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT), n, last = null;
          while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
          if (last) {
            last.nodeValue = 'Book a Consultation';
            li.style.opacity = '1'; li.style.transform = 'none';
            li.querySelectorAll('[style]').forEach(function (s) { s.style.opacity = '1'; s.style.transform = 'none'; });
            ul.insertBefore(li, base);
          }
        }
      }
    }
    // The live site's own Assessments dropdown now offers Gamified Quests. That link only exists in the page while the
    // dropdown is open, so it cannot be detected at load, and adding a copy of the Assessments item here made a second
    // "Assessments" appear and disappear as the dropdown opened and closed. Never add one, and remove any left over.
    ul.querySelectorAll('[data-gq]').forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
  }

  function addQuestBanner() {
    if (location.pathname !== '/assessments' && location.pathname !== '/assessments/') return;
    if (document.getElementById('gamified-quest-banner')) return;
    var target = document.querySelector('main section') || document.querySelector('main');
    if (!target) return;
    var banner = document.createElement('div');
    banner.id = 'gamified-quest-banner';
    banner.style.cssText = 'max-width:1200px;margin:20px auto 10px;padding:0 16px;box-sizing:border-box;';
    banner.innerHTML = '<a href="/gamified-assessments" style="display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%);border:2px solid #FDE68A;border-radius:18px;padding:16px 24px;text-decoration:none;box-shadow:0 6px 18px rgba(217,119,6,0.12);transition:transform .2s ease;font-family:inherit;">' +
      '<div style="display:flex;align-items:center;gap:16px;">' +
        '<span style="font-size:32px;line-height:1;">🎮</span>' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<span style="font-size:16px;font-weight:800;color:#92400E;letter-spacing:-0.2px;">Looking for interactive child-friendly game assessments?</span>' +
            '<span style="background:#F59E0B;color:#FFF;font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.5px;">Ages 4–12</span>' +
          '</div>' +
          '<p style="margin:4px 0 0;font-size:13.5px;color:#78350F;line-height:1.4;">Try our new 100% gamified pediatric quests (ADHD, Autism, Dyslexia) with pure visual & tactile games and zero reading questions.</p>' +
        '</div>' +
      '</div>' +
      '<span style="background:linear-gradient(135deg,#D97706,#B45309);color:#FFF;font-size:13.5px;font-weight:700;padding:10px 20px;border-radius:9999px;white-space:nowrap;box-shadow:0 2px 8px rgba(180,83,9,0.3);flex-shrink:0;">Play Gamified Quests →</span>' +
    '</a>';
    target.parentNode.insertBefore(banner, target);
  }

  function start() {
    addNav();
    addQuestBanner();
    new MutationObserver(function() {
      addNav();
      addQuestBanner();
    }).observe(document.documentElement, {childList: true, subtree: true});
  }
  if (document.readyState === 'complete') setTimeout(start, 1500);
  else window.addEventListener('load', function () { setTimeout(start, 1500); });
})();
` + '</script>'
