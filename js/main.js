/* ================================================================
   ADRIÀ MARTÍNEZ COLOMER — Portfolio JavaScript
   ================================================================ */

'use strict';

/* ── 1. THEME TOGGLE ────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ── 2. MOBILE NAVIGATION ───────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// Close menu on link click
document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Close menu on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.nav__container')) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  }
});

/* ── 3. NAVBAR SCROLL BEHAVIOR ──────────────────────────────── */
const navbar = document.getElementById('navbar');

function updateNav() {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ── 4. ACTIVE NAV LINK (INTERSECTION OBSERVER) ────────────── */
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav__link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navItems.forEach(link => {
        const matches = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', matches);
      });
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ── 5. DYNAMIC COPYRIGHT YEAR (i18n-aware) ─────────────────── */
// Keeps the footer year current forever. Works in three paths:
//  • no-JS / pre-i18n: the inline <span class="js-year"> shows a fallback year
//  • after i18n applies a locale string containing the {year} token
function stampYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach(el => {
    if (el.textContent.includes('{year}')) {
      el.textContent = el.textContent.replace('{year}', year);
    }
    const span = el.querySelector('.js-year');
    if (span) span.textContent = year;
  });
}
document.addEventListener('i18n:changed', stampYear);
stampYear();

/* ── 6. SCROLL REVEAL (INTERSECTION OBSERVER) ──────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, parseInt(delay));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── 7. HERO ENTRY ANIMATIONS ───────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.animate-fade-up').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0);
    setTimeout(() => {
      el.classList.add('in');
    }, delay + 200);
  });
});

/* ── 8. (removed) SKILL BAR ANIMATIONS ──────────────────────── */
// Percentage skill bars were replaced by a proficiency-level system
// (Expert / Advanced / Proficient / Working Knowledge) — no JS needed.

/* ── 9. COUNTER ANIMATION ───────────────────────────────────── */
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat__number[data-target]').forEach(el => {
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
      });
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero__stats');
if (heroStats) counterObserver.observe(heroStats);

/* ── 10. BACK TO TOP ────────────────────────────────────────── */
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (backToTop) {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }
}, { passive: true });

backToTop?.addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── 11. CONTACT FORM ───────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

// Localised form strings are baked onto the <form> as data-* attributes by
// build.py (per language). Falls back to the English literal if absent.
const MSG_MAP = {
  'form.errRequired': 'msgRequired',
  'form.errEmail':    'msgEmail',
  'form.errConsent':  'msgConsent',
  'form.errCaptcha':  'msgCaptcha',
  'form.sending':     'msgSending',
  'form.sent':        'msgSent',
  'form.success':     'msgSuccess',
  'contact.submit':   'msgSubmit'
};
function tf(key, fallback) {
  const ds = MSG_MAP[key] && contactForm ? contactForm.dataset[MSG_MAP[key]] : null;
  return ds != null ? ds : fallback;
}

/* Cloudflare Turnstile — privacy-friendly bot protection.
   Leave empty to keep it disabled (form still works). To enable: create a
   Turnstile widget in the Cloudflare dashboard and paste the SITE key below. */
const TURNSTILE_SITEKEY = '';

if (TURNSTILE_SITEKEY) {
  const widget = document.querySelector('.cf-turnstile');
  if (widget) {
    widget.setAttribute('data-sitekey', TURNSTILE_SITEKEY);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }
}

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(contactForm);
  const data = Object.fromEntries(formData.entries());

  // Basic validation
  if (!data.name || !data.email || !data.message) {
    showFormFeedback(tf('form.errRequired', 'Please fill in all required fields.'), 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    showFormFeedback(tf('form.errEmail', 'Please enter a valid email address.'), 'error');
    return;
  }

  // GDPR: explicit consent required before processing the enquiry
  if (!contactForm.querySelector('#consent')?.checked) {
    showFormFeedback(tf('form.errConsent', 'Please accept the Privacy Policy to send your message.'), 'error');
    return;
  }

  // Honeypot: real users never fill this field. If present, it's a bot — abort silently.
  if (data._gotcha) { return; }

  // Cloudflare Turnstile (only enforced when a site key is configured)
  if (TURNSTILE_SITEKEY && !data['cf-turnstile-response']) {
    showFormFeedback(tf('form.errCaptcha', 'Please complete the verification challenge.'), 'error');
    return;
  }

  // Submit to Formspree
  submitBtn.disabled = true;
submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${tf('form.sending', 'Sending…')}`;

try {
  const response = await fetch("https://formspree.io/f/mqeonjaj", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${tf('form.sent', 'Message Sent!')}`;

    showFormFeedback(
      tf('form.success', 'Thank you! I\'ll get back to you within 24 hours.'),
      'success'
    );

    contactForm.reset();
  } else {
    throw new Error('Submission failed');
  }
} catch (err) {
  showFormFeedback(
    'Error sending message. Please try again.',
    'error'
  );
}
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> ${tf('contact.submit', 'Send Message')}`;
  }, 4000);
});

function showFormFeedback(message, type) {
  const existing = document.querySelector('.form__feedback');
  if (existing) existing.remove();

  // Styling lives in style.css (.form__feedback) — no inline styles, CSP-friendly.
  const div = document.createElement('div');
  div.className = `form__feedback form__feedback--${type}`;
  div.setAttribute('role', type === 'error' ? 'alert' : 'status');
  div.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  div.textContent = message;

  contactForm.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

/* ── 12. (spin animation moved to style.css) ───────────────── */

/* ── 13. SMOOTH SCROLL FOR ALL ANCHOR LINKS ─────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── 14. KEYBOARD NAVIGATION ────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  }
});

console.log('%c Adrià Martínez Colomer — Portfolio', 'background:#0D1117;color:#00C9FF;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:4px;');
console.log('%c Process Engineer | Industrial Automation | Industry 4.0', 'color:#8B949E;font-size:11px;padding:4px 16px;');