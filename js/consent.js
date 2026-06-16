/* ================================================================
   AMC ENGINEER — Cookie Consent + Consent-gated Analytics
   ----------------------------------------------------------------
   GDPR / ePrivacy compliant. Zero dependencies.
   • No analytics (Google Analytics 4) loads before explicit consent.
   • Accept → loads GA4 (Consent Mode v2: analytics granted).
   • Reject → nothing non-essential loads; GA stays disabled.
   • Choice persisted in localStorage; banner only shows on first visit.
   • Re-openable any time via [data-cookie-settings] or AMCConsent.open().
   ================================================================ */
'use strict';

(function () {
  var GA_ID   = 'G-YKE2JLHF12';
  var STORE   = 'amc_cookie_consent';   // 'granted' | 'denied'
  var VERSION_KEY = 'amc_cookie_consent_v';
  var VERSION = '1';                     // bump to re-prompt all users

  /* ── i18n strings (self-contained: works with or without I18n) ── */
  var STR = {
    en: {
      title: 'We value your privacy',
      body: 'I use strictly necessary cookies to make this site work. With your consent, I also use Google Analytics to understand how visitors use the site.',
      accept: 'Accept all', reject: 'Reject non-essential', prefs: 'Preferences',
      save: 'Save preferences', prefsTitle: 'Cookie preferences', close: 'Close',
      necLabel: 'Strictly necessary', necDesc: 'Required for the site to function (security, language, theme and your cookie choice).',
      anaLabel: 'Analytics — Google Analytics 4', anaDesc: 'Anonymous, aggregated usage statistics. Loaded only with your consent.',
      always: 'Always on', more: 'Cookie Policy'
    },
    es: {
      title: 'Valoramos tu privacidad',
      body: 'Utilizo cookies estrictamente necesarias para el funcionamiento del sitio. Con tu consentimiento, también uso Google Analytics para entender cómo se utiliza la web.',
      accept: 'Aceptar todo', reject: 'Rechazar no esenciales', prefs: 'Preferencias',
      save: 'Guardar preferencias', prefsTitle: 'Preferencias de cookies', close: 'Cerrar',
      necLabel: 'Estrictamente necesarias', necDesc: 'Necesarias para que el sitio funcione (seguridad, idioma, tema y tu elección de cookies).',
      anaLabel: 'Analítica — Google Analytics 4', anaDesc: 'Estadísticas de uso anónimas y agregadas. Se cargan solo con tu consentimiento.',
      always: 'Siempre activas', more: 'Política de Cookies'
    },
    ca: {
      title: 'Valorem la teva privadesa',
      body: 'Faig servir galetes estrictament necessàries per al funcionament del lloc. Amb el teu consentiment, també uso Google Analytics per entendre com s’utilitza el web.',
      accept: 'Acceptar-ho tot', reject: 'Rebutjar no essencials', prefs: 'Preferències',
      save: 'Desar preferències', prefsTitle: 'Preferències de galetes', close: 'Tancar',
      necLabel: 'Estrictament necessàries', necDesc: 'Necessàries perquè el lloc funcioni (seguretat, idioma, tema i la teva elecció de galetes).',
      anaLabel: 'Analítica — Google Analytics 4', anaDesc: 'Estadístiques d’ús anònimes i agregades. Es carreguen només amb el teu consentiment.',
      always: 'Sempre actives', more: 'Política de Galetes'
    },
    de: {
      title: 'Wir respektieren Ihre Privatsphäre',
      body: 'Ich verwende unbedingt erforderliche Cookies, damit die Website funktioniert. Mit Ihrer Einwilligung nutze ich außerdem Google Analytics, um die Nutzung zu verstehen.',
      accept: 'Alle akzeptieren', reject: 'Nicht notwendige ablehnen', prefs: 'Einstellungen',
      save: 'Einstellungen speichern', prefsTitle: 'Cookie-Einstellungen', close: 'Schließen',
      necLabel: 'Unbedingt erforderlich', necDesc: 'Erforderlich für den Betrieb (Sicherheit, Sprache, Theme und Ihre Cookie-Auswahl).',
      anaLabel: 'Analyse — Google Analytics 4', anaDesc: 'Anonyme, aggregierte Nutzungsstatistik. Wird nur mit Ihrer Einwilligung geladen.',
      always: 'Immer aktiv', more: 'Cookie-Richtlinie'
    }
  };

  function lang() {
    var l;
    try { l = localStorage.getItem('site_lang'); } catch (e) {}
    if (!l) l = document.documentElement.getAttribute('lang') || 'en';
    return STR[l] ? l : 'en';
  }
  function t() { return STR[lang()]; }
  function policyHref() {
    // legal pages live at site root; works from any depth
    return '/cookie-policy/';
  }

  /* ── storage ── */
  function getConsent() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }
  function setConsent(v) {
    try { localStorage.setItem(STORE, v); localStorage.setItem(VERSION_KEY, VERSION); } catch (e) {}
  }

  /* ── Google Analytics 4 (loaded only on consent) ── */
  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded || window['ga-disable-' + GA_ID]) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied', analytics_storage: 'denied'
    });
    gtag('consent', 'update', { analytics_storage: 'granted' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }
  function disableGA() {
    window['ga-disable-' + GA_ID] = true;
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
    // best-effort clear of any GA cookies set in this/prior session
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga') === 0 || n === '_gid' || n === '_gat') {
        var exp = '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = n + exp;
        document.cookie = n + exp + ';domain=.' + location.hostname;
      }
    });
  }

  /* ── apply a decision ── */
  function apply(granted) {
    if (granted) { setConsent('granted'); loadGA(); }
    else { setConsent('denied'); disableGA(); }
  }

  /* ── DOM: banner + preferences modal ── */
  var bannerEl, modalEl;

  function buildBanner() {
    var s = t();
    var el = document.createElement('div');
    el.className = 'cc-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', s.title);
    el.innerHTML =
      '<div class="cc-banner__text">' +
        '<h2 class="cc-banner__title">' + s.title + '</h2>' +
        '<p class="cc-banner__body">' + s.body +
          ' <a class="cc-link" href="' + policyHref() + '">' + s.more + '</a>.</p>' +
      '</div>' +
      '<div class="cc-banner__actions">' +
        '<button type="button" class="btn btn--outline cc-btn" data-cc="prefs">' + s.prefs + '</button>' +
        '<button type="button" class="btn btn--secondary cc-btn" data-cc="reject">' + s.reject + '</button>' +
        '<button type="button" class="btn btn--primary cc-btn" data-cc="accept">' + s.accept + '</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'accept') { apply(true); hideBanner(); }
      else if (a === 'reject') { apply(false); hideBanner(); }
      else if (a === 'prefs') { openModal(); }
    });
    return el;
  }

  function showBanner() {
    if (bannerEl) { bannerEl.hidden = false; return; }
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
  }
  function hideBanner() { if (bannerEl) bannerEl.hidden = true; }

  function buildModal() {
    var s = t();
    var checked = getConsent() === 'granted' ? 'checked' : '';
    var el = document.createElement('div');
    el.className = 'cc-modal';
    el.hidden = true;
    el.innerHTML =
      '<div class="cc-modal__backdrop" data-cc="close"></div>' +
      '<div class="cc-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">' +
        '<button type="button" class="cc-modal__close" data-cc="close" aria-label="' + s.close + '">&times;</button>' +
        '<h2 class="cc-modal__title" id="cc-modal-title">' + s.prefsTitle + '</h2>' +
        '<div class="cc-option">' +
          '<div class="cc-option__head"><strong>' + s.necLabel + '</strong>' +
            '<span class="cc-pill cc-pill--on">' + s.always + '</span></div>' +
          '<p class="cc-option__desc">' + s.necDesc + '</p>' +
        '</div>' +
        '<div class="cc-option">' +
          '<div class="cc-option__head"><label class="cc-switch">' +
            '<input type="checkbox" id="cc-analytics" ' + checked + '>' +
            '<span class="cc-switch__track"></span></label>' +
            '<strong>' + s.anaLabel + '</strong></div>' +
          '<p class="cc-option__desc">' + s.anaDesc + '</p>' +
        '</div>' +
        '<div class="cc-modal__actions">' +
          '<button type="button" class="btn btn--secondary cc-btn" data-cc="reject">' + s.reject + '</button>' +
          '<button type="button" class="btn btn--primary cc-btn" data-cc="save">' + s.save + '</button>' +
        '</div>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'close') { closeModal(); }
      else if (a === 'reject') { apply(false); closeModal(); hideBanner(); }
      else if (a === 'save') {
        var on = el.querySelector('#cc-analytics').checked;
        apply(on); closeModal(); hideBanner();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl && !modalEl.hidden) closeModal();
    });
    return el;
  }

  function openModal() {
    if (!modalEl) { modalEl = buildModal(); document.body.appendChild(modalEl); }
    else { var cb = modalEl.querySelector('#cc-analytics'); if (cb) cb.checked = getConsent() === 'granted'; }
    modalEl.hidden = false;
    var f = modalEl.querySelector('#cc-analytics'); if (f) f.focus();
  }
  function closeModal() { if (modalEl) modalEl.hidden = true; }

  /* ── public API ── */
  window.AMCConsent = {
    open: openModal,
    accept: function () { apply(true); hideBanner(); },
    reject: function () { apply(false); hideBanner(); },
    state: getConsent
  };

  /* ── init ── */
  function init() {
    var c = getConsent();
    var v;
    try { v = localStorage.getItem(VERSION_KEY); } catch (e) {}
    if (c === 'granted' && v === VERSION) loadGA();
    else if (c === 'denied' && v === VERSION) disableGA();
    else showBanner(); // first visit or outdated consent version

    // allow any element to open preferences (e.g., footer "Cookie settings")
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cookie-settings]');
      if (trigger) { e.preventDefault(); openModal(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
