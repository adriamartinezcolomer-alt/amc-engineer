#!/usr/bin/env python3
"""
Pre-render the multilingual portfolio into SEO-friendly per-language pages.

Reads  : index.template.html  +  locales/{en,es,ca,de}.json   (single source of truth)
Writes : /index.html (en) , /es/index.html , /ca/index.html , /de/index.html

Each output is a complete, translated, static document with its own <html lang>,
<title>/meta, self-referencing canonical, a full reciprocal hreflang cluster, and
localised Open Graph — so every language is independently indexable.

Run before each deploy:   python build.py
After editing a translation, just re-run this; no other step needed.
"""
import json, io, os, datetime
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://amc-engineer.com"
TEMPLATE = os.path.join(ROOT, "index.template.html")
YEAR = datetime.date.today().year

LANGS = [
    {"code": "en", "ogLocale": "en_US", "path": "/",    "outdir": ""},
    {"code": "es", "ogLocale": "es_ES", "path": "/es/",  "outdir": "es"},
    {"code": "ca", "ogLocale": "ca_ES", "path": "/ca/",  "outdir": "ca"},
    {"code": "de", "ogLocale": "de_DE", "path": "/de/",  "outdir": "de"},
]
HREFLANG = {l["code"]: SITE + l["path"] for l in LANGS}
HREFLANG["x-default"] = SITE + "/"

# data-i18n-<suffix>  ->  real attribute to set
ATTR_SUFFIXES = ["content", "placeholder", "title", "href", "aria-label"]

# data-* baked onto #contactForm (read by main.js) <- locale key
FORM_MSGS = {
    "data-msg-required": "form.errRequired",
    "data-msg-email":    "form.errEmail",
    "data-msg-consent":  "form.errConsent",
    "data-msg-captcha":  "form.errCaptcha",
    "data-msg-sending":  "form.sending",
    "data-msg-sent":     "form.sent",
    "data-msg-success":  "form.success",
    "data-msg-submit":   "contact.submit",
}


def load_locale(code):
    with io.open(os.path.join(ROOT, "locales", code + ".json"), encoding="utf-8") as f:
        return json.load(f)


def resolve(data, path):
    cur = data
    for key in path.split("."):
        if cur is None:
            return None
        if isinstance(cur, list):
            try:
                cur = cur[int(key)]
            except (ValueError, IndexError):
                return None
        elif isinstance(cur, dict):
            cur = cur.get(key)
        else:
            return None
    return cur


def set_html(el, html_str):
    """Replace innerHTML of el with parsed markup (for data-i18n-html)."""
    el.clear()
    frag = BeautifulSoup(html_str, "html.parser")
    for child in list(frag.contents):
        el.append(child)


def build_one(template_html, lang):
    code = lang["code"]
    d = load_locale(code)
    soup = BeautifulSoup(template_html, "html.parser")

    # <html lang> + drop the anti-flicker guard (content is already correct)
    html = soup.find("html")
    html["lang"] = code
    classes = html.get("class", [])
    classes = [c for c in classes if c != "i18n-pending"]
    if classes:
        html["class"] = classes
    elif html.has_attr("class"):
        del html["class"]

    # 1) text / innerHTML
    for el in soup.select("[data-i18n]"):
        val = resolve(d, el["data-i18n"])
        if not isinstance(val, str):
            continue
        if el.has_attr("data-i18n-html"):
            set_html(el, val)
        else:
            el.string = val

    # 2) attribute translations
    for suffix in ATTR_SUFFIXES:
        for el in soup.select("[data-i18n-%s]" % suffix):
            val = resolve(d, el["data-i18n-%s" % suffix])
            if isinstance(val, str):
                el[suffix] = val

    # 3) per-page SEO: canonical, og:url, og:locale, hreflang
    can = soup.find("link", rel="canonical")
    if can:
        can["href"] = SITE + lang["path"]
    ogurl = soup.find("meta", attrs={"property": "og:url"})
    if ogurl:
        ogurl["content"] = SITE + lang["path"]
    oglocale = soup.find("meta", attrs={"property": "og:locale"})
    if oglocale:
        oglocale["content"] = lang["ogLocale"]
    for link in soup.find_all("link", rel="alternate"):
        hl = link.get("hreflang")
        if hl in HREFLANG:
            link["href"] = HREFLANG[hl]

    # 4) localised form strings onto #contactForm
    form = soup.find(id="contactForm")
    if form:
        for attr, key in FORM_MSGS.items():
            val = resolve(d, key)
            if isinstance(val, str):
                form[attr] = val

    # 5) relative asset refs -> root-absolute, so pages under /es/ /ca/ /de/
    #    resolve them correctly (otherwise e.g. assets/avatar.svg -> /es/assets/... 404)
    PREFIXES = ("css/", "js/", "assets/", "cv/")
    for tag, attr in (("link", "href"), ("script", "src"), ("img", "src"),
                      ("a", "href"), ("source", "src")):
        for el in soup.find_all(tag):
            v = el.get(attr)
            if v and v.startswith(PREFIXES):
                el[attr] = "/" + v

    out = str(soup)
    out = out.replace("{year}", str(YEAR))

    outdir = os.path.join(ROOT, lang["outdir"]) if lang["outdir"] else ROOT
    os.makedirs(outdir, exist_ok=True)
    with io.open(os.path.join(outdir, "index.html"), "w", encoding="utf-8") as f:
        f.write(out)
    return os.path.relpath(os.path.join(outdir, "index.html"), ROOT)


def main():
    with io.open(TEMPLATE, encoding="utf-8") as f:
        template_html = f.read()
    for lang in LANGS:
        rel = build_one(template_html, lang)
        print("  built %-3s -> %s" % (lang["code"], rel))
    print("Done. Pre-rendered %d languages (year=%d)." % (len(LANGS), YEAR))


if __name__ == "__main__":
    main()
