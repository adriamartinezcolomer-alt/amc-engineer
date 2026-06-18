/* Anti-flicker theme guard — applies the saved theme before first paint.
   Externalised (no inline script) so the CSP needs no 'unsafe-inline' for scripts. */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}

  // Mark JS active BEFORE first paint. The scroll-reveal hidden state
  // (html.js .reveal { opacity:0 }) applies only when this class is present, so
  // with JS disabled the content is simply visible (no flash, no hidden cards).
  document.documentElement.classList.add('js');

  // Failsafe: if the main script never loads/runs (network error, blocked, etc.),
  // reveal everything after a short delay so content can never stay hidden.
  // main.js cancels this once the reveal logic is wired up.
  window.__amcRevealFailsafe = setTimeout(function () {
    document.documentElement.classList.add('reveal-all');
  }, 2500);
})();
