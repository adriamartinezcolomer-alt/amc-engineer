# Multilingual System — Documentation

The portfolio is fully internationalized in **English, Spanish, Catalan, and German**
without changing any of the existing design, layout, animations, or behavior.

It uses a **dependency-free vanilla-JS architecture** (no build step, no framework),
which suits the current static site and deploys anywhere.

---

## 1. Folder structure

```
website/
├── index.html              # markup annotated with data-i18n attributes
├── css/
│   └── style.css           # + sections 16–18: switcher, banner, anti-flicker
├── js/
│   ├── i18n.js             # the translation engine (new)
│   └── main.js             # typewriter + form now read translations
└── locales/                # one JSON file per language
    ├── en.json             # English  (default / fallback)
    ├── es.json             # Spanish
    ├── ca.json             # Catalan
    └── de.json             # German
```

## 2. How it works

- Every translatable element carries a `data-i18n="key.path"` attribute. The engine
  reads the matching value from the active language's JSON and sets `textContent`.
- Rich strings (with `<strong>`/`<span>`) use `data-i18n` **plus** `data-i18n-html`.
- Attributes are translated with `data-i18n-placeholder`, `data-i18n-aria-label`,
  `data-i18n-title`, `data-i18n-content` (meta tags), `data-i18n-href` (localized CV).
- Arrays use index paths, e.g. `exp.jobs.0.bullets.2`.

### Language detection (first visit)
Priority order: **`?lang=` URL param → `localStorage` → browser language → English**.
The choice is saved to `localStorage` (`site_lang`) and reflected in the URL
(`?lang=de`) for shareable, SEO-friendly links.

### No flicker
`<html>` starts with the class `i18n-pending`, which hides `<body>` until the
correct language is applied (with an 900 ms safety timeout). A previously chosen
language never flashes English first.

## 3. SEO

On every language change the engine updates:
- `<title>`, `meta description`, `meta keywords`
- Open Graph (`og:title`, `og:description`, `og:locale`, `og:url`) + Twitter Card
- `<html lang>`
- `<link rel="canonical">` → `…/?lang=<code>`
- `<link rel="alternate" hreflang>` for **en, es, ca, de** + `x-default`

## 4. Adding a new language (< 10 minutes)

Example — adding **French**:

1. **Copy** `locales/en.json` → `locales/fr.json` and translate the values
   (keys must stay identical — there are 252).
2. **Register** the language in `js/i18n.js`, in the `LANGS` array (one line):
   ```js
   { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR', ogLocale: 'fr_FR', htmlLang: 'fr' }
   ```
That's it. The switcher, detection, hreflang, persistence, and SEO all pick it up
automatically. The same applies to Dutch (`nl`), Italian (`it`), Portuguese (`pt`).

> Tip: run the key-parity check before shipping a new locale:
> ```bash
> python -c "import json;a=set();b=set();..."   # compare fr.json keys to en.json
> ```

## 5. Deployment considerations

- The site fetches `locales/*.json`, so it must be **served over HTTP(S)**
  (GitHub Pages, Netlify, Vercel, any static host — all fine). Opening
  `index.html` directly from disk (`file://`) blocks `fetch`; in that case the page
  still renders in English but live switching is disabled.
- **Localized path URLs** (`/de/`, `/es/about`) are optional and require host-level
  rewrites. With this static setup the `?lang=` query param is the canonical,
  zero-config approach and is already wired into hreflang/canonical tags. To move to
  path-based URLs later, add rewrite rules (e.g. Netlify `_redirects`) mapping
  `/:lang/*` → `/index.html` and read the path segment instead of the query param in
  `detectLang()`.
- Cache: locale JSON is fetched with `cache: 'no-cache'` during development; for
  production you can drop that and rely on normal HTTP caching + filename hashing.

## 6. Local preview

```bash
cd website
python -m http.server 8123
# open http://localhost:8123/?lang=de
```
