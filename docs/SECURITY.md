# Security — amc-engineer.com

> Security architecture and the exact settings to apply. Designed for a personal
> professional portfolio: strong, modern, low-maintenance — no enterprise overhead.

_Last reviewed: 16 June 2026_

## 1. Security architecture (summary)
- **Transport:** HTTPS everywhere (Cloudflare Universal SSL + GitHub Pages cert), HSTS.
- **Content:** strict **Content-Security-Policy** (default-deny), shipped in-page via `<meta>` and mirrored as a real header at Cloudflare.
- **No inline scripts:** all JS is in external files → CSP needs no `script-src 'unsafe-inline'`.
- **No third-party fonts:** Inter + JetBrains Mono are self-hosted (`/assets/fonts/`).
- **Privacy:** analytics are consent-gated; no tracking before opt-in.
- **Form:** consent checkbox + honeypot + length limits + optional Turnstile.
- **Clickjacking:** `frame-ancestors 'none'` + `X-Frame-Options` (real headers at Cloudflare).

## 2. Why headers live at Cloudflare
**GitHub Pages cannot send custom HTTP response headers.** A `<meta http-equiv>` tag
can enforce CSP `script-src`/`connect-src`/etc., but **cannot** set `frame-ancestors`,
HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, or CORP.
Those must be added at **Cloudflare** (the proxy in front of the site).

### How to add them (Cloudflare dashboard → one Response Header Transform Rule)
`Rules → Transform Rules → Modify Response Header → Create rule`
- **If:** `Hostname equals amc-engineer.com` (or "All incoming requests").
- **Then — Set static** the following headers:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Content-Security-Policy` | _the production CSP from §3 (single line)_ |

Notes:
- HSTS `preload` is optional; only submit to hstspreload.org once you're sure all
  subdomains are HTTPS-only.
- `Cross-Origin-Embedder-Policy` is intentionally **omitted** — it can break
  third-party embeds (GA, Turnstile) and adds no value for this site.

## 3. Content Security Policy

### 3a. Production CSP (recommended — already shipped as `<meta>` in every page)
```
default-src 'self';
base-uri 'self';
object-src 'none';
img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com;
font-src 'self';
style-src 'self' 'unsafe-inline';
script-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com;
connect-src 'self' https://formspree.io https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
form-action 'self' https://formspree.io;
manifest-src 'self';
upgrade-insecure-requests
```
When set as a **Cloudflare header**, also add: `frame-ancestors 'none';` (the `<meta>`
version ignores `frame-ancestors`, which is why `X-Frame-Options: DENY` is set too).

### 3b. Strict CSP (optional hardening)
Remove `'unsafe-inline'` from `style-src` **only after** eliminating all inline
`style="…"` attributes and inline `<style>` blocks. For a personal site the small
residual risk of `style-src 'unsafe-inline'` is acceptable; not worth the maintenance.

### 3c. Directive-by-directive
| Directive | Why |
|---|---|
| `default-src 'self'` | Default-deny: anything not listed may load only from our origin. |
| `base-uri 'self'` | Blocks `<base>` hijacking. |
| `object-src 'none'` | No Flash/plugins. |
| `img-src 'self' data: …GA` | Site images + data-URI SVGs + GA pixel. |
| `font-src 'self'` | Fonts are self-hosted; no external font origins. |
| `style-src 'self' 'unsafe-inline'` | Stylesheet + a few inline styles/injected styles. |
| `script-src 'self' …gtm …cloudflare` | Our JS + GA loader + Turnstile. **No `unsafe-inline`.** |
| `connect-src …` | `fetch` to Formspree + GA beacons + Turnstile. |
| `frame-src challenges.cloudflare.com` | Turnstile iframe (only when enabled). |
| `form-action 'self' formspree.io` | Where the form may submit (JS-off fallback). |
| `upgrade-insecure-requests` | Auto-upgrade any stray `http://` to `https://`. |

## 4. Cloudflare configuration guide (personal-site appropriate)
| Setting | Recommended | Notes |
|---|---|---|
| SSL/TLS mode | **Full (strict)** | GitHub Pages presents a valid cert. Never use "Flexible". |
| Always Use HTTPS | **On** | Redirect http→https. |
| HSTS | **On** (values in §2) | |
| Minimum TLS | **1.2** | |
| HTTP/3 (QUIC) | **On** | Performance. |
| Brotli | **On** | Compression. |
| Security Level | **Medium** | Sensible default; raise to High only if attacked. |
| Bot Fight Mode | **On** (free) | Basic bot mitigation. |
| Email Address Obfuscation | **On** | Hides `mailto:` from scrapers. |
| Browser Cache TTL | **4 hours – 1 day** | Static site; safe. |
| WAF Managed Rules | Default free ruleset **On** | No custom enterprise rules needed. |
| Turnstile | Optional | See §5. |
| Auto Minify | Leave **off** | Assets are already lean; avoid double-processing. |

## 5. Cloudflare Turnstile (optional contact-form CAPTCHA)
1. Cloudflare dashboard → **Turnstile** → add a widget for `amc-engineer.com`.
2. Choose **Managed** (or Invisible) mode.
3. Copy the **Site key** → paste into `js/main.js`:
   ```js
   const TURNSTILE_SITEKEY = 'YOUR_SITE_KEY';
   ```
   The widget then renders and a token is required before the form submits.
4. **Server-side verification caveat:** Formspree does not verify the Turnstile
   token by itself. Client-side Turnstile already deters bots; the honeypot
   (`_gotcha`) and Formspree's own spam filter provide the server-side layer. For
   full token verification you would need a Cloudflare Worker proxy (not necessary
   for a personal site). Keep the **Secret key** in Cloudflare/Worker only — never commit it.

## 6. Maintenance procedures
- **Editing scripts:** keep JS in external files (no inline `<script>`), or the CSP
  will block it. If you must add an inline script, add its `sha256-` hash to `script-src`.
- **Adding a third-party origin** (new embed/API): add its origin to the matching CSP
  directive in **every** HTML `<meta>` **and** the Cloudflare header. Test before publishing.
- **Fonts:** to change weights, re-export woff2 into `/assets/fonts/` and update
  `@font-face` in `style.css`. Do not re-add Google Fonts links.
- **Secrets:** none live in the repo. Turnstile secret + account logins stay in their dashboards.

## 7. Security review checklist (run every ~6 months, or after big changes)
- [ ] HTTPS enforced; HSTS header present (check on securityheaders.com).
- [ ] CSP present and no console CSP violations on any page.
- [ ] `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` present.
- [ ] No mixed content; no requests to `fonts.googleapis.com`/`fonts.gstatic.com`.
- [ ] Analytics blocked before consent; loads after Accept; disabled after Reject.
- [ ] Contact form: required validation, honeypot, length limits, consent checkbox all working.
- [ ] Formspree submission limit + spam folder reviewed.
- [ ] Cloudflare SSL = Full (strict); Always Use HTTPS on.
- [ ] `security.txt` `Expires` date still in the future (renew yearly).
- [ ] Domain auto-renew on; 2FA active on Cloudflare/GitHub/Google.
