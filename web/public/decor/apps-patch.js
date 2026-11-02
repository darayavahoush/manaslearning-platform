/* Adds Vaaksudhi and Vaakify cards under the Phonics Jungle card on the homepage.
   Self-contained: own markup + own CSS, no copied inline animation styles, solid white
   cards that sit above the page's decorative illustration. Shows a phone AND a laptop. */
(function () {
  if (window.__itwApps) return;
  window.__itwApps = true;

  var APPS = [
    {
      id: "vaaksudhi",
      name: "Vaaksudhi",
      href: "https://vaaksudhi.manaslearning.com",
      title: "Playful speech and breathing practice",
      text: " gives children playful breathing, sound and voice games on a phone or laptop, and gives therapists and parents a clear view of progress after every session.",
      chips: ["Breathing games", "Sound games", "Voice games", "Therapist and parent progress"],
      accent: "#2f9e6a",
      tint: "#cdf7c4"
    },
    {
      id: "vaakify",
      name: "Vaakify",
      href: "https://vaakify.manaslearning.com",
      title: "Practise words and hear how they sounded",
      text: " listens as your child repeats words aloud, on a phone or laptop, and shows how clearly each one was said, so practice at home stays on track.",
      chips: ["Word repetition", "Clarity feedback", "Replay each attempt", "Home practice"],
      accent: "#e0762a",
      tint: "#fde9bd"
    }
  ];

  // Official app favicon SVGs (from respective repositories: agenti_ai and speech-repeater)
  var FAVICONS = {
    vaaksudhi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="52" height="52"><defs><linearGradient id="windGrad_vk" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#A8FF6F"/><stop offset="100%" stop-color="#1D9E75"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="#12122A"/><g transform="translate(3,5) scale(1.85)" fill="none" stroke="url(#windGrad_vk)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></g></svg>',
    vaakify: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="52" height="52"><defs><linearGradient id="vk_bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4A3630"/><stop offset="100%" stop-color="#2B201D"/></linearGradient><linearGradient id="vk_gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F3D27A"/><stop offset="100%" stop-color="#D9A441"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#vk_bg)"/><path d="M33.73 11.51 A22 22 0 1 0 48.12 43.89 A18 18 0 0 1 33.73 11.51 Z" fill="url(#vk_gold)"/><path d="M12 33 H19 L23 24 L28 42 L33 20 L38 44 L42 29 L45 33 H51" fill="none" stroke="#2B201D" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 33 H19 L23 24 L28 42 L33 20 L38 44 L42 29 L45 33 H51" fill="none" stroke="url(#vk_gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M51 12 Q51.6 17.4 57 18 Q51.6 18.6 51 24 Q50.4 18.6 45 18 Q50.4 17.4 51 12 Z" fill="#F3D27A"/></svg>'
  };

  // Screen art: laptop = real live screenshot of homepage, phone = centered app favicon on clean wallpaper
  function laptopScreen(a) {
    var src = "/decor/" + a.id + "-home-screen.webp";
    return '<img src="' + src + '" alt="' + esc(a.name) + ' live homepage" style="width:100%;height:100%;object-fit:cover;object-position:top left;display:block" loading="lazy" decoding="async" />';
  }
  function phoneScreen(a) {
    var fav = FAVICONS[a.id] || FAVICONS.vaaksudhi;
    return '<svg viewBox="0 0 90 180" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:100%">' +
      '<rect width="90" height="180" fill="' + a.tint + '"/>' +
      '<circle cx="16" cy="155" r="32" fill="#fff" opacity=".35"/>' +
      '<circle cx="78" cy="28" r="24" fill="#fff" opacity=".35"/>' +
      '<rect x="27" y="7" width="36" height="3.5" rx="1.75" fill="rgba(0,0,0,0.18)"/>' +
      '<g transform="translate(19, 44)">' + fav + '</g>' +
      '<text x="45" y="126" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11.5" font-weight="800" fill="' + a.accent + '">' + esc(a.name) + '</text>' +
      '<text x="45" y="140" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="8.5" font-weight="600" fill="rgba(34,34,34,0.55)">Mobile App</text>' +
      '</svg>';
  }

  var CSS =
    "@keyframes itw-app-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
    "@keyframes itw-phonics-shake{0%{transform:rotate(0deg) translate(0,0)}5.7%{transform:rotate(-3deg) translate(-1px,-1px)}11.4%{transform:rotate(3deg) translate(1px,1px)}17.1%{transform:rotate(-3deg) translate(-1px,-1px)}22.8%{transform:rotate(3deg) translate(1px,1px)}28.5%,100%{transform:rotate(0deg) translate(0,0)}}" +
    ".itw-app{position:relative;z-index:5;margin-bottom:0 !important;padding-bottom:24px;animation:itw-app-in .5s ease both}" +
    ".itw-app::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:24px;background:rgba(253,248,238,.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}" +
    ".itw-app-card{background:#fff;border-radius:24px;padding:28px 24px;display:flex;flex-direction:column;align-items:center;gap:28px;box-shadow:0 1px 2px rgba(0,0,0,.05);overflow:hidden}" +
    "@media(min-width:768px){.itw-app-card{flex-direction:row;gap:56px;padding:36px 44px}}" +
    ".itw-app-art{position:relative;flex:0 0 auto;width:min(300px,100%);aspect-ratio:300/220}" +
    ".itw-app-blob{position:absolute;left:-4%;top:-5%;width:62%;height:88%;border-radius:40px;opacity:.8}" +
    ".itw-laptop{position:absolute;left:0;bottom:4%;width:74%;filter:drop-shadow(0 12px 14px rgba(0,0,0,.18))}" +
    ".itw-laptop-screen{aspect-ratio:16/10;border:5px solid #2b2b2b;border-bottom-width:6px;border-radius:10px 10px 0 0;background:#fff;overflow:hidden}" +
    ".itw-laptop-screen svg,.itw-phone-screen svg{display:block;width:100%;height:100%}" +
    ".itw-laptop-screen img,.itw-phone-screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}" +
    ".itw-laptop-base{height:9px;width:112%;margin-left:-6%;background:linear-gradient(#e3e3e3,#b9b9b9);border-radius:0 0 12px 12px}" +
    ".itw-phone{position:absolute;right:0;bottom:0;width:29%;aspect-ratio:9/18;border:4px solid #1f1f1f;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 16px 26px rgba(0,0,0,.28);animation:itw-phonics-shake 1.4s ease-in-out infinite;transform-origin:center center;transition:transform .2s ease}" +
    ".itw-phone:hover{transform:scale(1.05)}" +
    ".itw-app[data-itw-app='vaakify'] .itw-phone{animation-delay:0.7s}" +
    ".itw-phone::before{content:'';position:absolute;top:3px;left:50%;width:30%;height:4px;margin-left:-15%;border-radius:3px;background:#1f1f1f;z-index:2}" +
    ".itw-phone-screen{width:100%;height:100%}" +
    ".itw-app-body{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0}" +
    "@media(min-width:768px){.itw-app-body{align-items:flex-start;text-align:left}}" +
    ".itw-app-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 12px;margin-bottom:12px;background:var(--t);color:var(--a)}" +
    ".itw-app-title{font-size:clamp(1.5rem,2.6vw,1.95rem);margin:0 0 10px}" +
    ".itw-app-text{max-width:34rem;margin:0 0 16px;font-size:clamp(1rem,1.5vw,1.15rem);line-height:1.55}" +
    ".itw-app-chips{list-style:none;padding:0;margin:0 0 20px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}" +
    "@media(min-width:768px){.itw-app-chips{justify-content:flex-start}}" +
    ".itw-app-chips li{font-size:13px;padding:5px 12px;border-radius:999px;border:1px solid var(--t);background:#fff;color:#5c4a32}" +
    ".itw-app-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:center}" +
    "@media(min-width:768px){.itw-app-actions{justify-content:flex-start}}" +
    ".itw-app-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:999px;border:1.5px solid var(--a);color:var(--a);font-weight:700;text-decoration:none;background:#fff;transition:background .2s,color .2s}" +
    ".itw-app-btn:hover{background:var(--a);color:#fff}" +
    ".itw-app-note{font-size:13px;color:#8a7a62}";

  var NAV_CSS =
    "header a,header button,nav a{white-space:nowrap !important}" +
    "@media (min-width:1024px){header nav,header ul{column-gap:clamp(10px,1.4vw,28px) !important}}" +
    "@media (min-width:1024px) and (max-width:1400px){header a,header button{font-size:clamp(14px,1.3vw,19px) !important}}";

  function addNavCss() {
    if (document.getElementById("itw-nav-css") || !document.head) return;
    var s = document.createElement("style");
    s.id = "itw-nav-css";
    s.textContent = NAV_CSS;
    document.head.appendChild(s);
  }

  function addCss() {
    if (document.getElementById("itw-apps-css")) return;
    var s = document.createElement("style");
    s.id = "itw-apps-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function build(a) {
    var d = document.createElement("div");
    d.className = "mb-6 itw-app";
    d.setAttribute("data-itw-app", a.id);
    d.style.setProperty("--a", a.accent);
    d.style.setProperty("--t", a.tint);
    d.innerHTML =
      '<article class="itw-app-card">' +
      '<div class="itw-app-art" aria-hidden="true">' +
      '<span class="itw-app-blob" style="background:' + a.tint + '"></span>' +
      '<div class="itw-laptop"><div class="itw-laptop-screen">' + laptopScreen(a) + '</div><div class="itw-laptop-base"></div></div>' +
      '<div class="itw-phone"><div class="itw-phone-screen">' + phoneScreen(a) + "</div></div>" +
      "</div>" +
      '<div class="itw-app-body">' +
      '<span class="itw-app-badge">' + esc(a.name) + " &middot; Phone and laptop</span>" +
      '<h3 class="font-atkinson font-bold text-foreground leading-tight itw-app-title">' + esc(a.title) + "</h3>" +
      '<p class="font-patrick text-brown itw-app-text"><span class="text-primary font-semibold">' + esc(a.name) + "</span>" + esc(a.text) + "</p>" +
      '<ul class="itw-app-chips">' + a.chips.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
      '<div class="itw-app-actions">' +
      '<a class="itw-app-btn" href="' + a.href + '" target="_blank" rel="noopener noreferrer">Open ' + esc(a.name) + " &rarr;</a>" +
      '<span class="itw-app-note">Opens in your browser, on phone or laptop</span>' +
      "</div></div></article>";
    return d;
  }


  function hydrated(el) {
    return Object.keys(el).some(function (k) {
      return k.indexOf("__reactFiber") === 0 || k.indexOf("__reactProps") === 0;
    });
  }


  // No falling leaves over the footer: hide the fixed falling-leaf layer while the footer is in view.
  var LEAF_CSS =
    "html.itw-footer-view .leaf-fall,html.itw-footer-view [data-itw-leaf]{opacity:0 !important;visibility:hidden !important}";

  function hasFixedAncestor(el) {
    for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
      if (getComputedStyle(e).position === "fixed") return true;
    }
    return false;
  }

  function markFallingLeaves() {
    var imgs = document.querySelectorAll('img[src*="leaf"]');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.hasAttribute("data-itw-leaf") || im.closest("footer")) continue;
      if (hasFixedAncestor(im)) im.setAttribute("data-itw-leaf", "1");
    }
  }

  var footerWatched = false;
  function watchFooter() {
    if (footerWatched) return;
    var f = document.querySelector("footer");
    if (!f || !("IntersectionObserver" in window)) return;
    footerWatched = true;
    if (!document.getElementById("itw-leaf-css")) {
      var st = document.createElement("style");
      st.id = "itw-leaf-css";
      st.textContent = LEAF_CSS;
      document.head.appendChild(st);
    }
    markFallingLeaves();
    setInterval(markFallingLeaves, 3000); // leaves can be (re)created later
    new IntersectionObserver(
      function (entries) {
        markFallingLeaves();
        document.documentElement.classList.toggle("itw-footer-view", entries[0].isIntersecting);
      },
      { rootMargin: "0px 0px -25% 0px" } // footer counts as "in view" once it fills the lower ~25% of the screen
    ).observe(f);
  }

  function unifyMiloLauncher() {
    var btn = document.querySelector('button[aria-label*="Milo"], button[aria-label*="chat with Milo"], button[aria-label*="Milo the Owl"]');
    if (!btn || btn.querySelector('.itw-milo-dot')) return;
    var dot = document.createElement('span');
    dot.className = 'itw-milo-dot';
    dot.style.cssText = 'position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:9999px;background:#f47522;border:2.5px solid #fff;box-shadow:0 0 6px rgba(244,117,34,0.6);pointer-events:none;z-index:10;';
    dot.setAttribute('aria-hidden', 'true');
    btn.appendChild(dot);
  }

  function ensure() {
    addNavCss();
    watchFooter();
    unifyMiloLauncher();
    var img = document.querySelector('img[alt*="Phonics"]');
    if (!img) return;
    var art = img.closest("article");
    if (!art || !hydrated(art)) return;
    var wrap = art.parentElement;
    if (!wrap || !wrap.parentNode) return;
    addCss();
    var anchor = wrap;
    APPS.forEach(function (a) {
      var have = document.querySelector('[data-itw-app="' + a.id + '"]');
      if (have && have.previousElementSibling === anchor) {
        anchor = have;
        return;
      }
      if (have) have.remove();
      var node = build(a);
      anchor.parentNode.insertBefore(node, anchor.nextSibling);
      anchor = node;
    });
  }

  var tries = 0;
  var timer = setInterval(function () {
    ensure();
    if (++tries > 120) clearInterval(timer); // ~1 minute of polling after load
  }, 500);

  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      ensure();
    }, 300);
  }).observe(document.body, { childList: true, subtree: true });
})();
