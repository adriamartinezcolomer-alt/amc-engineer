# Tech Stack & Architecture — amc-engineer.com

> How the website is built and deployed, so it can be maintained years from now
> without rediscovery.

_Last reviewed: 16 June 2026_

## 1. Overview
A **static, multilingual personal portfolio**. No build step, no framework, no
backend. Plain HTML + CSS + vanilla JavaScript, served as files.

```
Visitor ──▶ Cloudflare (DNS, TLS, CDN, headers, WAF) ──▶ GitHub Pages (static files)
                                  │
        Contact form ────────────┼──▶ Formspree (email delivery)
        Analytics (after consent)─┴──▶ Google Analytics 4
```

## 2. Repository layout (this folder = site root)
```
index.template.html         SOURCE template (edit this) — has data-i18n hooks
build.py                    Pre-renders the template + locales into the pages below
/index.html                 GENERATED — English home (do not edit by hand)
/es/index.html              GENERATED — Spanish   "
/ca/index.html              GENERATED — Catalan   "
/de/index.html              GENERATED — German    "
/404.html                   Custom not-found page
/privacy-policy/index.html  Legal pages (clean URLs, English)
/cookie-policy/index.html
/legal-notice/index.html
/css/style.css              All styling + design tokens + @font-face
/js/
  theme-init.js             Pre-paint theme guard (no inline script → clean CSP)
  lang-switch.js            Language menu links + legacy ?lang= redirect (no translation)
  main.js                   Nav, reveal, counters, contact form, year stamp
  consent.js                Cookie banner + consent-gated GA4
  legal.js                  Theme toggle + year for legal pages
/locales/{en,es,ca,de}.json Translations — single source of truth (build-time only)
/assets/                    Images, icons, og cover, self-hosted /fonts/
/sitemap.xml /robots.txt /site.webmanifest /CNAME /.nojekyll
/.well-known/security.txt
/docs/                      This documentation (disallowed in robots.txt)
```

## 3. Deployment (GitHub Pages)
- Push to the repo's published branch → GitHub Pages serves the files automatically.
- `CNAME` pins the custom domain `amc-engineer.com`.
- `.nojekyll` disables Jekyll so files (incl. `_`-prefixed) are served verbatim.
- **GitHub Pages cannot set custom HTTP headers** — security headers are applied at Cloudflare (see `SECURITY.md`).

## 4. Cloudflare
- DNS for the domain; proxied (orange cloud) so CDN, TLS, caching, WAF and header rewriting apply.
- Full config in `SECURITY.md` (SSL mode, HSTS, headers, Turnstile).

## 5. Internationalisation (path-based, pre-rendered)
The site uses **SEO-friendly language directories**, each a fully translated static page:

| Language | URL | File |
|---|---|---|
| English (default / x-default) | `https://amc-engineer.com/` | `index.html` |
| Spanish | `/es/` | `es/index.html` |
| Catalan | `/ca/` | `ca/index.html` |
| German | `/de/` | `de/index.html` |

- **Build step:** `python build.py` reads `index.template.html` + `locales/*.json` and writes the four `index.html` files. Run it before every deploy (or via a GitHub Action). **Edit `index.template.html` for structure/markup — never edit the generated `*/index.html` directly** (they're overwritten on each build).
- **Translations live only in `/locales/*.json`** (single source of truth). They are consumed at *build time*; they are **not** fetched at runtime anymore.
- Each generated page has its own `<html lang>`, `<title>`/meta, **self-referencing canonical**, a full reciprocal **hreflang** cluster (en→`/`, es→`/es/`, ca→`/ca/`, de→`/de/`, x-default→`/`), and localised Open Graph.
- **Runtime JS:** `js/lang-switch.js` only builds the language menu as `<a href>` links, marks the current language, and redirects legacy `/?lang=xx` → `/xx/`. (The old `js/i18n.js` runtime translator was removed — content is now static, which also fixed the stale-Catalan/caching class of bugs entirely.)
- **Adding a language:** add the JSON file, add one entry to `LANGS` in both `build.py` and `js/lang-switch.js`, add it to the hreflang block in `index.template.html` + `sitemap.xml`, then run `build.py`.
- A legacy generator `output/update_locales_ai.py` (which duplicated/overwrote AI-section text) was removed; edit the JSON directly.

## 6. Analytics architecture (privacy-first)
- **No analytics loads before consent.** `js/consent.js` owns this.
- On **Accept** → injects `gtag.js` for `G-YKE2JLHF12`, sets Consent Mode v2 (`analytics_storage: granted`), `anonymize_ip`.
- On **Reject** → GA never loads; `ga-disable-*` flag set; GA cookies cleared.
- Choice persisted in `localStorage.amc_cookie_consent` (+ version key to allow re-prompting).

## 7. Form architecture
- HTML form `POST`s to Formspree (`/f/mqeonjaj`); `main.js` intercepts and sends JSON via `fetch`.
- Protections: required fields + email regex + length limits, **GDPR consent checkbox**, **honeypot** (`_gotcha`), and **optional Cloudflare Turnstile** (set `TURNSTILE_SITEKEY` in `main.js`).
- No form data is stored on the site; Formspree forwards it by email.

## 8. Consent architecture
- `consent.js` renders the banner + preferences modal, in EN/ES/CA/DE (strings self-contained).
- Re-openable anywhere via any `[data-cookie-settings]` element (footer "Cookie settings").

## 9. Conventions to preserve
- Design tokens are CSS custom properties in `:root` / `[data-theme="light"]` — change colours there, not inline.
- Keep scripts external (no inline `<script>`) so the CSP stays strict.
- Keep fonts self-hosted in `/assets/fonts/` (no Google Fonts requests).
