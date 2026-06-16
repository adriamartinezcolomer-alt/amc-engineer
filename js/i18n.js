/* ================================================================
   ADRIÀ MARTÍNEZ COLOMER — i18n Engine (Vanilla JS)
   ----------------------------------------------------------------
   Centralized multilingual system. Zero dependencies.
   To add a language: see the bottom of this file (1 line + 1 JSON).
   ================================================================ */

'use strict';

(function () {
  /* ── 1. CONFIGURATION ─────────────────────────────────────────
     Add a new language by appending one entry here and dropping a
     matching JSON file in /locales (e.g. fr.json). Nothing else. */
  const LANGS = [
    { code: 'en', label: 'English',  flag: '🇬🇧', short: 'EN', ogLocale: 'en_US', htmlLang: 'en' },
    { code: 'es', label: 'Español',  flag: '🇪🇸', short: 'ES', ogLocale: 'es_ES', htmlLang: 'es' },
    { code: 'ca', label: 'Català',   flag: '🏴󠁥󠁳󠁣󠁴󠁿', short: 'CA', ogLocale: 'ca_ES', htmlLang: 'ca' },
    { code: 'de', label: 'Deutsch',  flag: '🇩🇪', short: 'DE', ogLocale: 'de_DE', htmlLang: 'de' }
    /* { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR', ogLocale: 'fr_FR', htmlLang: 'fr' }, */
  ];

  const FALLBACK = 'en';
  const STORAGE_KEY = 'site_lang';
  const SITE_URL = 'https://amc-engineer.com'; // production web domain — used for hreflang / canonical
  const codes = LANGS.map(l => l.code);
  const cache = {};   // loaded dictionaries by code
  let current = FALLBACK;

  /* ── 2. UTILITIES ─────────────────────────────────────────────*/
  function resolve(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function getLangConfig(code) {
    return LANGS.find(l => l.code === code) || LANGS[0];
  }

  /* ── 3. LANGUAGE DETECTION ────────────────────────────────────
     Priority: URL ?lang=  →  localStorage  →  browser  →  fallback */
  function detectLang() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && codes.includes(urlLang)) return urlLang;

    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && codes.includes(stored)) return stored;

    const navLangs = navigator.languages || [navigator.language || ''];
    for (const l of navLangs) {
      const base = l.toLowerCase().split('-')[0];
      if (codes.includes(base)) return base;
    }
    return FALLBACK;
  }

  /* ── 4. LOADING (dynamic, on-demand) ──────────────────────────*/
  async function loadDict(code) {
    if (cache[code]) return cache[code];
    try {
      const res = await fetch(`locales/${code}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const dict = await res.json();
      cache[code] = dict;
      return dict;
    } catch (err) {
      console.warn(`[i18n] Could not load "${code}":`, err.message);
      if (code !== FALLBACK) return loadDict(FALLBACK);
      return null; // file:// or offline → default HTML (English) stays visible
    }
  }

  /* ── 5. APPLY TRANSLATIONS TO DOM ─────────────────────────────*/
  function applyDict(dict, code) {
    if (!dict) return;
    const cfg = getLangConfig(code);

    // text content / innerHTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = resolve(dict, el.getAttribute('data-i18n'));
      if (val == null) return;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
      else el.textContent = val;
    });

    // attributes (content, placeholder, title, href, aria-label)
    ['content', 'placeholder', 'title', 'href', 'aria-label'].forEach(attr => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        const val = resolve(dict, el.getAttribute(`data-i18n-${attr}`));
        if (val != null) el.setAttribute(attr, val);
      });
    });

    // <html lang>
    document.documentElement.setAttribute('lang', cfg.htmlLang);

    // SEO: og:locale + url (language-specific) + canonical (always the clean root,
    // so query-param language variants don't split ranking signals)
    setMeta('property', 'og:locale', cfg.ogLocale);
    setMeta('property', 'og:url', `${SITE_URL}/?lang=${code}`);
    setLink('canonical', `${SITE_URL}/`);

    // update language switcher UI
    updateSwitcherUI(code);

    // notify the rest of the app (dynamic year stamp, form strings, etc.)
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: code, dict } }));
  }

  function setMeta(attr, key, value) {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  function setLink(rel, href, hreflang) {
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  /* ── 6. HREFLANG TAGS (multilingual SEO) ──────────────────────*/
  function buildHreflang() {
    LANGS.forEach(l => setLink('alternate', `${SITE_URL}/?lang=${l.code}`, l.code));
    setLink('alternate', `${SITE_URL}/`, 'x-default');
  }

  /* ── 7. PUBLIC: set language ───────────────────────────────────*/
  async function setLang(code, persist = true) {
    if (!codes.includes(code)) code = FALLBACK;
    current = code;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    }
    // keep URL in sync (SEO-friendly, shareable) without reloading
    const params = new URLSearchParams(window.location.search);
    params.set('lang', code);
    history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);

    const dict = await loadDict(code);
    applyDict(dict, code);
  }

  /* ── 8. LANGUAGE SWITCHER (build + behavior) ──────────────────*/
  function buildSwitcher() {
    document.querySelectorAll('[data-lang-switch]').forEach(container => {
      const btn = container.querySelector('[data-lang-btn]');
      const menu = container.querySelector('[data-lang-menu]');
      if (!btn || !menu) return;

      // populate menu options
      menu.innerHTML = '';
      LANGS.forEach(l => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('data-lang', l.code);
        li.setAttribute('tabindex', '0');
        li.className = 'lang-switch__option';
        li.innerHTML = `<span class="lang-switch__flag">${l.flag}</span><span class="lang-switch__name">${l.label}</span>`;
        const choose = () => { setLang(l.code); closeMenu(container, btn); };
        li.addEventListener('click', choose);
        li.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
        });
        menu.appendChild(li);
      });

      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = container.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });

      // keyboard: Escape closes
      container.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu(container, btn);
      });
    });

    // close on outside click
    document.addEventListener('click', e => {
      document.querySelectorAll('[data-lang-switch].open').forEach(c => {
        if (!c.contains(e.target)) closeMenu(c, c.querySelector('[data-lang-btn]'));
      });
    });
  }

  function closeMenu(container, btn) {
    container.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function updateSwitcherUI(code) {
    const cfg = getLangConfig(code);
    document.querySelectorAll('[data-lang-switch]').forEach(container => {
      const flagEl = container.querySelector('[data-lang-current-flag]');
      const codeEl = container.querySelector('[data-lang-current-code]');
      if (flagEl) flagEl.textContent = cfg.flag;
      if (codeEl) codeEl.textContent = cfg.short;
      container.querySelectorAll('.lang-switch__option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-lang') === code);
        opt.setAttribute('aria-selected', String(opt.getAttribute('data-lang') === code));
      });
    });
  }

  /* ── 9. EXPOSE PUBLIC API ─────────────────────────────────────*/
  window.I18n = {
    setLang,
    get current() { return current; },
    langs: LANGS,
    t(path) { return resolve(cache[current], path); }
  };

  /* ── 10. INIT ─────────────────────────────────────────────────*/
  function init() {
    buildHreflang();
    buildSwitcher();
    const initial = detectLang();
    setLang(initial, false).finally(() => {
      // reveal page (anti-flicker guard set in <head>)
      document.documentElement.classList.remove('i18n-pending');
    });
    // safety net: never keep the page hidden
    setTimeout(() => document.documentElement.classList.remove('i18n-pending'), 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
