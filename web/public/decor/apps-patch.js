/* Adds VaakSiddhi + Vaakify next to the Phonics Jungle App card on the proxied manaslearning.com homepage. */
(function () {
  if (window.__itwApps) return;
  window.__itwApps = true;

  var ICON_WAVE = '<svg width="96" height="96" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#ffffff" fill-opacity=".75"/><path d="M12 32h6M20 24v16M28 18v28M36 22v20M44 27v10M52 32h0" stroke="#05b076" stroke-width="4" stroke-linecap="round"/></svg>';
  var ICON_MIC = '<svg width="96" height="96" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#ffffff" fill-opacity=".75"/><rect x="25" y="12" width="14" height="26" rx="7" stroke="#f47522" stroke-width="4"/><path d="M18 31c0 8 6 14 14 14s14-6 14-14M32 45v8" stroke="#f47522" stroke-width="4" stroke-linecap="round"/></svg>';

  var APPS = [
    {
      key: 'vaaksiddhi', name: 'VaakSiddhi', url: 'https://vaaksudhi.manaslearning.com', color: '#05b076', bg: '',
      title: 'Playful speech and breathing practice',
      text: ' gives children playful breathing, sound and voice games, and gives therapists and parents a clear view of progress after every session.',
      icon: ICON_WAVE
    },
    {
      key: 'vaakify', name: 'Vaakify', url: 'https://vaakify.manaslearning.com', color: '#f47522', bg: '#ffe7a6',
      title: 'Practise words and hear how they sounded',
      text: ' listens as your child repeats words aloud and shows how clearly each one was said, so practice at home stays on track.',
      icon: ICON_MIC
    }
  ];

  function html(a) {
    return '' +
      '<article class="bg-white rounded-3xl p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-16 lg:gap-20 shadow-sm overflow-hidden">' +
        '<div class="relative shrink-0 order-2 md:order-1 w-36 md:w-44 lg:w-56 flex items-end justify-center min-h-40 md:min-h-55">' +
          '<div class="absolute -left-4 md:-left-6 -top-4 md:-top-6 w-32 h-40 md:w-40 md:h-52 bg-accent-green rounded-[40px] opacity-70"' + (a.bg ? ' style="background:' + a.bg + '"' : '') + '></div>' +
          '<div class="relative z-10 flex items-center justify-center w-full" style="min-height:10rem">' + a.icon + '</div>' +
        '</div>' +
        '<div class="flex flex-col items-center md:items-start text-center md:text-left flex-1 order-1 md:order-2">' +
          '<h3 class="font-atkinson font-bold text-foreground leading-tight mb-3 xl:text-3xl">' + a.title + '</h3>' +
          '<p class="font-patrick text-brown mb-4 md:mb-6 max-w-lg lg:text-lg"><span class="text-primary font-semibold">' + a.name + '</span>' + a.text + '</p>' +
          '<a href="' + a.url + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 26px;border-radius:9999px;' +
            'border:1px solid ' + a.color + ';color:' + a.color + ';background:' + a.color + '0d;font-weight:600;text-decoration:none;white-space:nowrap">Open ' + a.name + ' &rarr;</a>' +
        '</div>' +
      '</article>';
  }

  function hydrated(el) {
    var ks = Object.keys(el);
    for (var i = 0; i < ks.length; i++) {
      if (ks[i].indexOf('__reactFiber') === 0 || ks[i].indexOf('__reactProps') === 0) return true;
    }
    return false;
  }

  function inject() {
    if (document.querySelector('[data-itw-app]')) return true;
    var img = document.querySelector('img[alt*="Phonics Jungle"]');
    var art = img && img.closest ? img.closest('article') : null;
    if (!art || !art.parentElement || !art.parentElement.parentNode) return false;
    if (!hydrated(art)) return false;            // wait until React has taken over, or it would reject the extra nodes
    var anchor = art.parentElement;
    for (var i = 0; i < APPS.length; i++) {
      var d = document.createElement('div');
      d.className = 'mb-6';
      d.setAttribute('data-itw-app', APPS[i].key);
      d.innerHTML = html(APPS[i]);
      anchor.parentNode.insertBefore(d, anchor.nextSibling);
      anchor = d;
    }
    return true;
  }

  var tries = 0;
  var poll = setInterval(function () {
    tries++;
    if (inject() || tries > 120) clearInterval(poll);
  }, 300);

  // client-side navigation back to the homepage, or a re-render that dropped the cards
  var pending = null;
  new MutationObserver(function () {
    if (pending) return;
    pending = setTimeout(function () { pending = null; inject(); }, 400);
  }).observe(document.body, { childList: true, subtree: true });
})();
