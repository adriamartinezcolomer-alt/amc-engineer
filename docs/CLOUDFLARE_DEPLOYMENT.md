# Cloudflare Deployment Guide — amc-engineer.com

> Step-by-step, written for a non-specialist. Follow the sections in order.
> Total time: ~20–30 minutes. You only do this once.
>
> Everything here is done in the **Cloudflare dashboard** at https://dash.cloudflare.com
> → select the **amc-engineer.com** zone. Nothing in this guide touches the code.

_Last reviewed: 16 June 2026_

---

## 0. Before you start
- Log in to Cloudflare and click the **amc-engineer.com** site so you're "inside" the zone.
- Make sure the DNS record for the site is **Proxied** (orange cloud ☁️, not grey).
  `DNS → Records` → the `A`/`CNAME` for the root should say **Proxied**.
  *(Headers, caching, HTTPS and Turnstile only work when traffic goes through Cloudflare.)*
  > 📷 *Screenshot reference: DNS → Records, "Proxy status" column shows an orange cloud.*

---

## 1. SSL / TLS settings (HTTPS)

**1.1 SSL mode** — `SSL/TLS → Overview` → **Configure** → choose **Full (strict)**.
> Why: GitHub Pages serves a valid certificate, so "Full (strict)" gives end-to-end
> encryption. **Never** pick "Flexible" (it would be insecure).
> 📷 *Screenshot reference: SSL/TLS → Overview, radio buttons; "Full (strict)" selected.*

**1.2 Edge Certificates** — `SSL/TLS → Edge Certificates`, set:
| Setting | Value |
|---|---|
| Always Use HTTPS | **On** |
| Automatic HTTPS Rewrites | **On** |
| Minimum TLS Version | **TLS 1.2** |
| TLS 1.3 | **On** |

**1.3 HSTS** (forces browsers to always use HTTPS) — same page → **HTTP Strict Transport Security (HSTS)** → **Enable** and set:
| Field | Value |
|---|---|
| Enable HSTS | **On** |
| Max-Age | **12 months** |
| Apply to subdomains (includeSubDomains) | **On** |
| Preload | **On** |
| No-Sniff header | **On** |
> Read the on-screen warning: only keep this on if the site stays HTTPS-only (it will).
> This replaces the need to set the HSTS header manually in Section 3.
> 📷 *Screenshot reference: SSL/TLS → Edge Certificates → HSTS modal with the toggles above.*

---

## 2. Performance & general security toggles
| Where | Setting | Value |
|---|---|---|
| `Network` | HTTP/3 (with QUIC) | **On** |
| `Speed → Optimization` | Brotli compression | **On** *(if shown; newer plans do this automatically)* |
| `Security → Settings` | Security Level | **Medium** |
| `Security → Bots` | Bot Fight Mode | **On** |
| `Scrape Shield` | Email Address Obfuscation | **On** |
| `Scrape Shield` | Server-side Excludes | **On** |
| `Caching → Configuration` | Browser Cache TTL | **Respect Existing Headers** (or **4 hours**) |

> These are all free-plan settings appropriate for a personal site. Do **not** enable
> "Auto Minify" (it can interfere with already-optimised assets), and you do **not**
> need any paid WAF rules.

### 2.1 Cache Rule — never edge-cache the translation files
The multilingual text lives in `/locales/*.json` and is loaded by the browser at
runtime. If Cloudflare edge-caches these files, different visitors (and different
Cloudflare locations) can be served **stale translations** after you publish an update.
Add a small Cache Rule so these files always come fresh from the origin:

`Caching → Cache Rules → Create rule`
- **Name:** `Bypass cache for locales`
- **If:** `URI Path starts with /locales/`  *(optionally also `or URI Path starts with /js/`)*
- **Then:** **Bypass cache**

Deploy. (The site code also appends a `?v=` version string to each locale request as a
second safety net — see `js/i18n.js` → `ASSET_VERSION`. Bump that value whenever you
change a translation file so even cached copies are invalidated.)

---

## 3. Response Header Transform Rule (security headers)

This adds the security headers that GitHub Pages cannot send. HSTS is **not** here
(you set it in 1.3).

Go to `Rules → Transform Rules → Modify Response Header` → **Create rule**.

**3.1 Name:** `Security headers`

**3.2 If… (matching)** — choose **Custom filter expression** and set:
- Field: **Hostname** — Operator: **equals** — Value: `amc-engineer.com`

*(Or simply choose "All incoming requests".)*

**3.3 Then… (Set static headers)** — click **+ Set static** once per row:

| Header name | Value |
|---|---|
| `Content-Security-Policy` | *(the single line in Section 4)* |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

**3.4 Deploy** — click **Deploy**.
> 📷 *Screenshot reference: Transform Rules → your rule showing 7 "Set static" header rows, status "Active".*

> Note: the site's HTML already ships a CSP via a `<meta>` tag. Setting it here as a
> real header **as well** is intentional and safe — the header version additionally
> enforces `frame-ancestors` (clickjacking), which a meta tag cannot.

---

## 4. Exact CSP header value (copy/paste as one line)

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com; connect-src 'self' https://formspree.io https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; form-action 'self' https://formspree.io; manifest-src 'self'; upgrade-insecure-requests
```

This is the same policy shipped in the HTML, **plus `frame-ancestors 'none'`**. It allows
exactly: this site's own files, Google Analytics (after consent), Formspree (the form),
and Cloudflare Turnstile. Everything else is blocked.

> If you ever remove Turnstile permanently, you may delete the two
> `https://challenges.cloudflare.com` entries — but leaving them is harmless.

---

## 5. Cloudflare Turnstile (optional anti-spam for the contact form)

Only needed if you start getting spam; the form already has a honeypot + Formspree's filter.

**5.1 Create the widget** — left sidebar **Turnstile** → **Add widget**:
| Field | Value |
|---|---|
| Widget name | `amc-engineer contact` |
| Hostnames | `amc-engineer.com` (add `www.amc-engineer.com` if you use www; add `localhost` only for local testing) |
| Widget Mode | **Managed** |
> 📷 *Screenshot reference: Turnstile → Add widget form with hostname and "Managed" mode.*

**5.2 Copy the keys** — Cloudflare shows a **Site Key** (public) and a **Secret Key** (private).

**5.3 Activate it in the code** — open `js/main.js`, find:
```js
const TURNSTILE_SITEKEY = '';
```
and paste your **Site Key** between the quotes:
```js
const TURNSTILE_SITEKEY = '0x4AAAAAAA...your-site-key...';
```
Commit & push. The widget will now appear above the Send button.

**5.4 Important caveat (read this):**
- The **Site Key** is safe to put in the code (it's public).
- **Never** put the **Secret Key** in the code or the repo — keep it in Cloudflare only.
- Formspree does **not** verify the Turnstile token on its servers. The widget deters
  bots client-side; real server-side spam blocking is still handled by the **honeypot**
  and **Formspree's built-in filter**. For a personal site this is enough. (Full
  server verification would need a Cloudflare Worker — not necessary here.)

---

## 6. Validation procedure (after everything is deployed)

Do these checks once after applying the settings. Allow ~1–2 minutes for changes to propagate.

**6.1 Headers grade (easiest)**
- Go to **https://securityheaders.com**, enter `https://amc-engineer.com`, scan.
- Expect **A or A+**, with `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` all green.

**6.2 Headers via command line (optional)**
```
curl -sI https://amc-engineer.com | findstr /I "content-security strict-transport x-frame x-content referrer permissions cross-origin"
```
*(On macOS/Linux use `grep -i` instead of `findstr /I`.)* You should see each header listed once.

**6.3 HTTPS is forced**
- Visit `http://amc-engineer.com` (note: **http**). It must auto-redirect to `https://`.

**6.4 No CSP breakage / no console errors**
- Open the site in Chrome → press **F12** → **Console** tab → reload.
- There must be **no red errors**, especially none mentioning "Content Security Policy".
- Click around, switch language, open a legal page — still no errors.

**6.5 Analytics consent still works**
- F12 → **Network** tab → filter `google`. On first load (before clicking the banner)
  there should be **no** `googletagmanager`/`google-analytics` requests.
- Click **Accept** in the cookie banner → now `gtag/js` should load. ✔
- Clear the choice (footer **Cookie settings** → Reject) → no analytics. ✔

**6.6 Contact form works**
- Send yourself a test message → it should arrive via Formspree, and the success
  message should appear. If Turnstile is enabled, the widget must appear and pass.

**6.7 Fonts are local (privacy)**
- F12 → Network → filter `font` → reload. Requests should come from **amc-engineer.com**,
  **not** from `fonts.gstatic.com` / `fonts.googleapis.com`.

**6.8 Re-scan in 6 months** — repeat 6.1 and the checklist in `SECURITY.md §7`.

---

## Quick reference — what you set where
| Thing | Location |
|---|---|
| HTTPS mode (Full strict), HSTS, Always-HTTPS | SSL/TLS section |
| HTTP/3, Brotli, Security Level, Bots, Email obfuscation, cache | Network / Speed / Security / Scrape Shield / Caching |
| CSP + 6 other security headers | Rules → Transform Rules → Modify Response Header |
| Turnstile site key | Turnstile dashboard + `js/main.js` |
| Sitemap resubmit | Google Search Console (after deploy) |
