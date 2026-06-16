/* Legal pages: theme toggle + dynamic copyright year.
   Externalised (no inline script) so the CSP needs no 'unsafe-inline' for scripts. */
(function () {
  var t = document.getElementById('themeToggle');
  if (t) t.addEventListener('click', function () {
    var c = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', c);
    try { localStorage.setItem('theme', c); } catch (e) {}
  });
  var y = String(new Date().getFullYear());
  document.querySelectorAll('.js-year').forEach(function (s) { s.textContent = y; });
})();
