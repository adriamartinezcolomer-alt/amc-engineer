/* ================================================================
   AMC ENGINEER — Language Switcher (path-based, navigation only)
   ----------------------------------------------------------------
   Pages are pre-rendered per language into /, /es/, /ca/, /de/ by
   build.py, so there is NO runtime translation here. This script only:
     • builds the switcher menu as real <a href> links,
     • marks the current language active,
     • redirects legacy /?lang=xx URLs to the path version,
     • remembers the chosen language (so the consent banner matches).
   ================================================================ */
'use strict';

(function () {
  var LANGS = [
    { code: 'en', label: 'English',  flag: '🇬🇧', short: 'EN', path: '/' },
    { code: 'es', label: 'Español',  flag: '🇪🇸', short: 'ES', path: '/es/' },
    { code: 'ca', label: 'Català',   flag: '🏴󠁥󠁳󠁣󠁴󠁿', short: 'CA', path: '/ca/' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', short: 'DE', path: '/de/' }
  ];
  var codes = LANGS.map(function (l) { return l.code; });

  function current() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return codes.indexOf(l) >= 0 ? l : 'en';
  }
  function cfg(code) { return LANGS.find(function (l) { return l.code === code; }) || LANGS[0]; }

  /* Legacy support: /?lang=es  →  /es/  (also covered by a Cloudflare 301) */
  (function redirectLegacy() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && codes.indexOf(q) >= 0 && q !== current()) {
      location.replace(cfg(q).path + location.hash);
    }
  })();

  var cur = current();
  try { localStorage.setItem('site_lang', cur); } catch (e) {}

  function build() {
    document.querySelectorAll('[data-lang-switch]').forEach(function (container) {
      var btn = container.querySelector('[data-lang-btn]');
      var menu = container.querySelector('[data-lang-menu]');
      if (!btn || !menu) return;

      // current flag/code on the button
      var c = cfg(cur);
      var fEl = container.querySelector('[data-lang-current-flag]');
      var cEl = container.querySelector('[data-lang-current-code]');
      if (fEl) fEl.textContent = c.flag;
      if (cEl) cEl.textContent = c.short;

      // menu items = links to the same page in each language (keep the hash)
      menu.innerHTML = '';
      LANGS.forEach(function (l) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(l.code === cur));
        var a = document.createElement('a');
        a.className = 'lang-switch__option' + (l.code === cur ? ' active' : '');
        a.setAttribute('href', l.path + location.hash);
        a.setAttribute('hreflang', l.code);
        a.setAttribute('lang', l.code);
        if (l.code === cur) a.setAttribute('aria-current', 'true');
        a.innerHTML = '<span class="lang-switch__flag">' + l.flag + '</span>' +
                      '<span class="lang-switch__name">' + l.label + '</span>';
        li.appendChild(a);
        menu.appendChild(li);
      });

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = container.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      container.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { container.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      });
    });

    document.addEventListener('click', function (e) {
      document.querySelectorAll('[data-lang-switch].open').forEach(function (c) {
        if (!c.contains(e.target)) {
          c.classList.remove('open');
          var b = c.querySelector('[data-lang-btn]');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
