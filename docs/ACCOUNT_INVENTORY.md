# Account Inventory — amc-engineer.com

> The external services this website depends on, what each is for, and the
> manual actions only the owner can perform. Keep this file up to date when a
> provider, plan, or credential changes.

_Last reviewed: 16 June 2026 · Owner: Adrià Martínez i Colomer (adria@martinez.colomer.cat)_

| Service | Provider | Purpose | Credentials live in | Renewal / expiry | Owner actions |
|---|---|---|---|---|---|
| **Domain** `amc-engineer.com` | (registrar) via **Cloudflare** | Primary domain | Cloudflare account | **Domain auto-renew** — verify yearly | Keep registrant email current; enable auto-renew |
| **DNS + CDN + SSL** | **Cloudflare** | DNS, HTTPS, CDN, security headers, WAF, Turnstile | Cloudflare account (2FA) | n/a | Apply security headers + settings (see `SECURITY.md`) |
| **Hosting** | **GitHub Pages** | Serves the static site from the repo | GitHub account (2FA) | n/a | Keep repo + Pages enabled; custom domain `amc-engineer.com` set in repo settings |
| **TLS certificate** | Cloudflare (Universal SSL) + GitHub Pages cert | HTTPS | Automatic | **Auto-renews** | None (verify "Enforce HTTPS" stays on) |
| **Contact form** | **Formspree** | Receives contact-form submissions by email | Formspree account | Free tier limits apply | Confirm form ID `mqeonjaj`; check spam settings; verify monthly submission limit |
| **Analytics** | **Google Analytics 4** | Consent-gated traffic analytics | Google account | n/a | Property `G-YKE2JLHF12`; set data retention to 14 months; accept Google EU terms |
| **Search** | **Google Search Console** | Indexing + search performance | Google account | n/a | Keep domain verified; resubmit `sitemap.xml` after structural changes |
| **Bot protection (optional)** | **Cloudflare Turnstile** | CAPTCHA for the contact form | Cloudflare account | n/a | Create widget → paste SITE key in `js/main.js` (`TURNSTILE_SITEKEY`) |
| **Fonts** | Self-hosted (was Google Fonts) | Inter + JetBrains Mono | In repo `/assets/fonts/` | n/a | None — no external font dependency anymore |

## Critical "don't lose these"
- **Cloudflare account** (controls DNS, HTTPS, headers). Enable 2FA + recovery codes.
- **GitHub account** (hosts the site). Enable 2FA + recovery codes.
- **Google account** (Analytics + Search Console).
- **Domain registrar** login (renewal). Confirm auto-renew is ON.

## Public, non-secret identifiers (already in the code)
- Formspree endpoint: `https://formspree.io/f/mqeonjaj`
- GA4 Measurement ID: `G-YKE2JLHF12`
- These are public by design. The **only** secret would be a Turnstile **secret key** — never commit it; it stays in Cloudflare.
