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
/index.html                 Main single-page site
/404.html                   Custom not-found page
/privacy-policy/index.html  Legal pages (clean URLs)
/cookie-policy/index.html
/legal-notice/index.html
/css/style.css              All styling + design tokens + @font-face
/js/
  theme-init.js             Pre-paint theme guard (no inline script → clean CSP)
  i18n.js                   Multilingual engine (loads /locales/*.json)
  main.js                   Nav, reveal, counters, contact form, year stamp
  consent.js                Cookie banner + consent-gated GA4
  legal.js                  Theme toggle + year for legal pages
/locales/{en,es,ca,de}.json Translations
/assets/                    Images, icons, og-image, self-hosted /fonts/
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

## 5. Internationalisation
- `js/i18n.js` detects language (`?lang=` → `localStorage.site_lang` → browser → `en`), fetches `/locales/<code>.json`, and fills `[data-i18n]` / `[data-i18n-*]` nodes.
- Adding a language = add one entry in `i18n.js` `LANGS` + one JSON file.
- Canonical stays `https://amc-engineer.com/`; `hreflang` alternates are static in `<head>` and kept in sync by `i18n.js`.
- **Single source of truth:** the `/locales/*.json` files are the *only* place translations live. (A legacy generator, `output/update_locales_ai.py`, used to embed a second copy of the AI-section text and overwrite the JSON — it caused stale/contradictory Catalan content and was removed. Edit the JSON directly.)
- **After changing any locale file, bump `ASSET_VERSION` in `js/i18n.js`** (e.g. to the deploy date). It is appended as `?v=` to each locale fetch so browsers/CDN can't serve stale translations. Pair with the Cloudflare "Bypass cache for locales" rule (see `CLOUDFLARE_DEPLOYMENT.md` §2.1).

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
