/* Anti-flicker theme guard — applies the saved theme before first paint.
   Externalised (no inline script) so the CSP needs no 'unsafe-inline' for scripts. */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
