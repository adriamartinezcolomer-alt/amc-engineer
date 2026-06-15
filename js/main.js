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

/* ── 5. TYPEWRITER EFFECT (i18n-aware) ──────────────────────── */
const typewriterEl = document.getElementById('typewriter');

// Default roles; replaced live by the active language (window.I18n).
let roles = [
  'BIW Welding Processes',
  'Industrial Automation',
  'Process Industrialization',
  'Industry 4.0 Systems',
  'Manufacturing Engineering',
  'Production Cell Design',
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeTimeout;
let typeGeneration = 0; // invalidates pending timeouts on language change

function getRoles() {
  const fromI18n = window.I18n && window.I18n.t('hero.roles');
  return Array.isArray(fromI18n) && fromI18n.length ? fromI18n : roles;
}

function typeWriter(generation) {
  if (generation !== typeGeneration) return; // a newer language took over
  const current = roles[roleIndex] || '';

  if (isDeleting) charIndex--; else charIndex++;

  if (typewriterEl) typewriterEl.textContent = current.slice(0, charIndex);

  let speed = isDeleting ? 40 : 80;

  if (!isDeleting && charIndex === current.length) {
    speed = 2200;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    speed = 400;
  }

  typeTimeout = setTimeout(() => typeWriter(generation), speed);
}

function startTypewriter() {
  clearTimeout(typeTimeout);
  roles = getRoles();
  roleIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typeGeneration++;
  typeWriter(typeGeneration);
}

// Restart with translated roles whenever the language changes.
document.addEventListener('i18n:changed', startTypewriter);

// Kick off immediately (in case i18n is delayed or unavailable).
startTypewriter();

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

/* ── 8. SKILL BAR ANIMATIONS ────────────────────────────────── */
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-bar__fill').forEach(bar => {
        const target = bar.dataset.target || '0';
        setTimeout(() => {
          bar.style.width = `${target}%`;
        }, 200);
      });
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skills__category').forEach(cat => skillObserver.observe(cat));

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

// Translatable strings with English fallback.
function tf(key, fallback) {
  const v = window.I18n && window.I18n.t(key);
  return v != null ? v : fallback;
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

  // Simulate submission (replace with actual endpoint)
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

  const div = document.createElement('div');
  div.className = `form__feedback form__feedback--${type}`;
  div.textContent = message;
  div.style.cssText = `
    padding:.75em 1em;
    border-radius:.5rem;
    font-size:.85rem;
    font-weight:500;
    margin-top:.5rem;
    background:${type === 'success' ? 'rgba(46,204,113,.12)' : 'rgba(231,76,60,.12)'};
    border:1px solid ${type === 'success' ? 'rgba(46,204,113,.3)' : 'rgba(231,76,60,.3)'};
    color:${type === 'success' ? '#2ECC71' : '#E74C3C'};
  `;

  contactForm.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

/* ── 12. SPIN ANIMATION FOR BUTTON ─────────────────────────── */
const style = document.createElement('style');
style.textContent = `
  .spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

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

/* ── 14. BACKGROUND CANVAS GRADIENT ANIMATION ───────────────── */
const canvas = document.getElementById('heroCanvas');
if (canvas) {
  let mouseX = 0.5, mouseY = 0.5;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }, { passive: true });
}

/* ── 15. KEYBOARD NAVIGATION ────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  }
});

console.log('%c Adrià Martínez Colomer — Portfolio', 'background:#0D1117;color:#00C9FF;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:4px;');
console.log('%c Process Engineer | Industrial Automation | Industry 4.0', 'color:#8B949E;font-size:11px;padding:4px 16px;');
