#!/usr/bin/env python3
"""Génère les pages du site LLC Facile en français, darija (ar) et anglais.

Usage : python3 tools/build.py   (depuis la racine du dépôt)
Le contenu est dans tools/content_fr.py, content_ar.py, content_en.py.
Les pages légales (cgv.html, mentions-legales.html, confidentialite.html) sont écrites à la main, en français.
"""
import html, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content_fr import T as FR  # noqa: E402
from content_ar import T as AR  # noqa: E402
from content_en import T as EN  # noqa: E402

SITE = "https://llcfacile.com"
LANGS = {"fr": FR, "ar": AR, "en": EN}
PREFIX = {"fr": "", "ar": "/ar", "en": "/en"}
# clé de page -> chemin (sans préfixe de langue)
SLUGS = {
    "fr": {"home": "/", "benefits": "/avantages", "how": "/comment-ca-marche", "pricing": "/tarifs", "faq": "/faq", "order": "/commander"},
    "ar": {"home": "/", "benefits": "/avantages", "how": "/comment-ca-marche", "pricing": "/tarifs", "faq": "/faq", "order": "/commander"},
    "en": {"home": "/", "benefits": "/benefits", "how": "/how-it-works", "pricing": "/pricing", "faq": "/faq", "order": "/order"},
}
NAV = ["benefits", "how", "pricing", "faq"]
WA_MA = "212663285119"
WA_FR = "33780803130"
FUNCTION_URL = "https://gbdjiczesmhhsrqhvrgj.supabase.co/functions/v1/llcfacile-commande"
PRICES = {"basic": (299, 3290), "ultimate": (499, 5390), "ultimate_launch": (699, 7590)}
ITIN = (249, 2690)
RENEW = (290, 3150)

e = html.escape


def url(lang, key):
    p = PREFIX[lang] + SLUGS[lang][key]
    return p if p == "/" else p.rstrip("/") if not p.endswith("/") or p == "/ar/" else p


def href(lang, key):
    p = PREFIX[lang] + SLUGS[lang][key]
    if p in ("/ar/", "/en/"):
        return p
    return p if p == "/" else p.rstrip("/")


def money(eur, mad, lang, plus=False, per=""):
    s = "+ " if plus else ""
    de = f"{s}{eur} €{per}"
    dm = f"{s}{mad:,} MAD{per}".replace(",", " ")
    first = dm if lang == "ar" else de
    return f'<span class="price" data-eur="{e(de)}" data-mad="{e(dm)}">{e(first)}</span>'


def wa_link(num, text):
    from urllib.parse import quote
    return f"https://wa.me/{num}?text={quote(text)}"


CHECK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>'
ARROW = '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>'
CHAT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg>'
ICONS = {
    "card": '<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20M6 15h4"></path>',
    "bank": '<path d="M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"></path>',
    "globe": '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"></path>',
    "shield": '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"></path>',
    "coin": '<path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"></path>',
    "mail": '<path d="M4 6h16v12H4zM4 8l8 5 8-5"></path>',
    "star": '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"></path>',
    "doc": '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"></path>',
}


def icon(name):
    return f'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'


# ---------------------------------------------------------------- mise en page
def layout(lang, key, title, desc, body, extra_head=""):
    t = LANGS[lang]
    d = "rtl" if lang == "ar" else "ltr"
    canon = SITE + href(lang, key)
    alts = "".join(f'<link rel="alternate" hreflang="{l}" href="{SITE}{href(l, key)}">\n' for l in LANGS)
    alts += f'<link rel="alternate" hreflang="x-default" href="{SITE}{href("fr", key)}">'
    nav = "".join(
        f'<a href="{href(lang, k)}"{" aria-current=page" if k == key else ""}>{e(t["nav"][k])}</a>' for k in NAV)
    langs = "".join(
        f'<a href="{href(l, key)}" hreflang="{l}" lang="{l}"{" aria-current=true" if l == lang else ""}>{n}</a>'
        for l, n in (("fr", "FR"), ("ar", "دارجة"), ("en", "EN")))
    fonts = "family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700"
    if lang == "ar":
        fonts += "&family=Noto+Kufi+Arabic:wght@400;600;700"
    og_locale = {"fr": "fr_FR", "ar": "ar_MA", "en": "en_US"}[lang]
    legal = "".join(f'<a href="/{p}">{e(n)}</a>' for p, n in t["legal_links"])
    footnav = "".join(f'<a href="{href(lang, k)}">{e(t["nav"][k])}</a>' for k in ["home"] + NAV + ["order"])
    return f'''<!doctype html>
<html lang="{lang}" dir="{d}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="LLC Facile">
<meta property="og:locale" content="{og_locale}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/hero.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B1A33">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fonts}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=3">
{extra_head}
</head>
<body>
<a class="sr" href="#main">{e(t["skip"])}</a>
<header class="top">
<div class="wrap">
<a class="logo" href="{href(lang, "home")}" aria-label="LLC Facile">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A63A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M7.5 12.5l3 3 6-7"></path></svg>
<span><span class="l">LLC</span><span class="w">Facile</span><span class="c">.com</span></span>
</a>
<button class="burger" type="button" aria-expanded="false" aria-controls="menu">{e(t["menu"])}</button>
<nav class="menu" id="menu" aria-label="{e(t["menu"])}">
{nav}
<a class="cta" href="{href(lang, "order")}"{" aria-current=page" if key == "order" else ""}>{e(t["nav"]["order"])}</a>
<div class="langs" aria-label="Langue / Language">{langs}</div>
</nav>
</div>
</header>
<main id="main">
{body}
</main>
<footer class="foot">
<div class="wrap">
<div class="cols">
<strong style="font-family:'Space Grotesk',sans-serif;font-size:16px;color:#0E1B2C">LLC Facile</strong>
<nav aria-label="{e(t["footer_nav"])}">{footnav}</nav>
<nav aria-label="{e(t["legal"])}">{legal}</nav>
</div>
<p>{e(t["contact_line"])} <a href="mailto:contact@llcfacile.com">contact@llcfacile.com</a> · WhatsApp <span class="price">+212 6 63 28 51 19</span> · <span class="price">+33 7 80 80 31 30</span></p>
<p class="legal">{e(t["disclaimer"])}</p>
</div>
</footer>
<script src="/assets/site.js?v=1" defer></script>
</body>
</html>
'''


# ---------------------------------------------------------------- blocs
def cta_band(lang):
    t = LANGS[lang]
    c = t["cta"]
    return f'''<section class="band"><div class="wrap">
<div class="ctaband">
<div style="flex:1 1 420px"><h2>{e(c["title"])}</h2><p>{e(c["text"])}</p></div>
<div class="row">
<a class="btn btn-gold" href="{href(lang, "order")}">{e(t["nav"]["order"])} {ARROW}</a>
<a class="btn btn-wa" href="{wa_link(WA_MA, t["wa_text"])}" target="_blank" rel="noopener">{CHAT}<span class="wa">{e(c["wa_ma"])}<small>+212 6 63 28 51 19</small></span></a>
<a class="btn btn-navy" href="{wa_link(WA_FR, t["wa_text"])}" target="_blank" rel="noopener">{CHAT}<span class="wa">{e(c["wa_fr"])}<small>+33 7 80 80 31 30</small></span></a>
</div>
</div>
</div></section>'''


def page_head(kicker, title, lead, dark=False):
    return f'''<section class="band {"dark" if dark else "white"}" style="padding-bottom:48px"><div class="wrap"><div class="head" style="margin-bottom:0">
<span class="kicker">{e(kicker)}</span><h1>{e(title)}</h1><p class="lead">{e(lead)}</p></div></div></section>'''


def benefits_grid(lang, limit=None):
    items = LANGS[lang]["benefits"]["items"][:limit] if limit else LANGS[lang]["benefits"]["items"]
    return '<div class="grid">' + "".join(
        f'<article class="card">{icon(i["icon"])}<h3>{e(i["t"])}</h3><p>{e(i["d"])}</p></article>' for i in items) + "</div>"


def steps_grid(lang, detail=False):
    items = LANGS[lang]["how"]["steps"]
    out = '<ol class="grid" style="list-style:none;margin:0;padding:0">'
    for n, s in enumerate(items, 1):
        extra = f'<p>{e(s["more"])}</p>' if detail else ""
        out += f'<li class="card"><span class="num">0{n}</span><h3>{e(s["t"])}</h3><p>{e(s["d"])}</p>{extra}</li>'
    return out + "</ol>"


def plans(lang, dark=True):
    t = LANGS[lang]
    p = t["pricing"]
    out = '<div class="grid" style="align-items:stretch">'
    for k in ("basic", "ultimate", "ultimate_launch"):
        pl = p["plans"][k]
        hi = k == "ultimate"
        feats = "".join(f'<li>{CHECK.format(c="#D4A63A" if not hi else "#8A6514")}<span>{e(f)}</span></li>' for f in pl["features"])
        badge = f'<span class="badge">{e(p["popular"])}</span>' if hi else ""
        eur, mad = PRICES[k]
        out += f'''<article class="plan{" hi" if hi else ""}">
<div class="top-l"><h3 style="font-size:24px">{e(pl["name"])}</h3>{badge}</div>
<p class="d">{e(pl["desc"])}</p>
<div class="amount">{money(eur, mad, lang)}<span class="d">{e(p["once"])}</span></div>
<ul class="feat">{feats}</ul>
<a class="btn" href="{href(lang, "order")}?formule={k}">{e(p["choose"])} {e(pl["name"])}</a>
</article>'''
    out += "</div>"
    out += f'''<div class="extra gold"><div style="flex:1 1 420px;display:flex;flex-direction:column;gap:6px">
<strong style="font-size:17px">{e(p["itin_t"])} {money(*ITIN, lang, plus=True)}</strong><span>{e(p["itin_d"])}</span></div></div>
<div class="extra"><div style="display:flex;flex-direction:column;gap:6px">
<strong style="font-size:17px">{e(p["renew_t"])} {money(*RENEW, lang, per=p["per_year"])}</strong><span>{e(p["renew_d"])}</span></div></div>'''
    return out


def cur_toggle(lang, light=False):
    t = LANGS[lang]
    first = "MAD" if lang == "ar" else "EUR"
    b = lambda c, lbl: f'<button type="button" data-cur="{c}" aria-pressed="{"true" if c == first else "false"}">{lbl}</button>'
    return f'<div class="cur{" " if not light else ""}" role="group" aria-label="{e(t["currency"])}">{b("EUR", "EUR €")}{b("MAD", "MAD")}</div>'


def faq_list(lang, items):
    return "".join(
        f'<details class="faq"{" open" if i == 0 else ""}><summary>{e(q)}</summary><p>{e(a)}</p></details>'
        for i, (q, a) in enumerate(items))


# ---------------------------------------------------------------- pages
def p_home(lang):
    t = LANGS[lang]
    h = t["home"]
    chips = "".join(f'<span class="chip">{e(c)}</span>' for c in h["chips"])
    ticks = "".join(f'<li>{CHECK.format(c="#8A6514")}{e(x)}</li>' for x in h["ticks"])
    who = "".join(f'''<article class="card soft"><h3 style="font-size:26px">{e(w["t"])}</h3><p style="font-size:16px">{e(w["d"])}</p>
<ul>{"".join(f"<li>{e(x)}</li>" for x in w["list"])}</ul></article>''' for w in h["who"])
    teasers = "".join(f'''<article class="card"><span class="kicker">{e(x["k"])}</span><h3>{e(x["t"])}</h3><p>{e(x["d"])}</p>
<a class="more" href="{href(lang, x["page"])}">{e(x["link"])} {ARROW}</a></article>''' for x in h["teasers"])
    body = f'''<section class="hero"><div class="wrap">
<div class="txt">
<div class="chips">{chips}</div>
<h1>{e(h["title"])}</h1>
<p class="lead">{e(h["lead"])}</p>
<div class="row"><a class="btn btn-gold" href="{href(lang, "order")}">{e(t["nav"]["order"])} {ARROW}</a>
<a class="btn btn-line" href="{href(lang, "pricing")}">{e(h["see_prices"])}</a></div>
<ul class="ticks">{ticks}</ul>
</div>
<div class="pic"><img src="/hero.jpg" width="1200" height="800" fetchpriority="high" alt="{e(h["img_alt"])}"></div>
</div></section>
<section class="band white" style="border-top:0"><div class="wrap">
<div class="head"><span class="kicker">{e(h["who_k"])}</span><h2>{e(h["who_t"])}</h2></div>
<div class="grid grid-2">{who}</div>
</div></section>
<section class="band"><div class="wrap">
<div class="head"><span class="kicker">{e(t["benefits"]["k"])}</span><h2>{e(t["benefits"]["title"])}</h2></div>
{benefits_grid(lang, 4)}
<p style="margin-top:24px"><a class="more" href="{href(lang, "benefits")}">{e(h["all_benefits"])} {ARROW}</a></p>
</div></section>
<section class="band white"><div class="wrap">
<div class="head"><span class="kicker">{e(h["more_k"])}</span><h2>{e(h["more_t"])}</h2></div>
<div class="grid">{teasers}</div>
</div></section>
{cta_band(lang)}'''
    ld = {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "LLC Facile", "url": SITE + href(lang, "home"),
          "image": SITE + "/hero.jpg", "email": "contact@llcfacile.com", "telephone": "+212663285119",
          "areaServed": ["MA", "FR", "BE", "CH", "CA"], "description": t["seo"]["home"][1],
          "parentOrganization": {"@type": "Organization", "name": "Sovereignlife immo SARL", "address": {"@type": "PostalAddress", "addressLocality": "Casablanca", "addressCountry": "MA"}},
          "makesOffer": [{"@type": "Offer", "name": t["pricing"]["plans"][k]["name"], "price": PRICES[k][0], "priceCurrency": "EUR"} for k in PRICES]}
    return body, f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'


def p_benefits(lang):
    t = LANGS[lang]
    b = t["benefits"]
    body = page_head(b["k"], b["title"], b["lead"]) + f'''<section class="band"><div class="wrap">
{benefits_grid(lang)}
<div class="card soft" style="margin-top:28px"><h2 style="font-size:26px">{e(b["what_t"])}</h2><p style="font-size:16px">{e(b["what_d"])}</p></div>
<p class="note">{e(b["tax_note"])}</p>
</div></section>{cta_band(lang)}'''
    return body, ""


def p_how(lang):
    t = LANGS[lang]
    h = t["how"]
    docs = "".join(f"<li>{e(x)}</li>" for x in h["docs"])
    body = page_head(h["k"], h["title"], h["lead"]) + f'''<section class="band"><div class="wrap">
{steps_grid(lang, detail=True)}
<div class="grid grid-2" style="margin-top:28px">
<article class="card soft"><h2 style="font-size:24px">{e(h["docs_t"])}</h2><ul>{docs}</ul></article>
<article class="card soft"><h2 style="font-size:24px">{e(h["delay_t"])}</h2><p style="font-size:16px">{e(h["delay_d"])}</p></article>
</div>
</div></section>{cta_band(lang)}'''
    return body, ""


def p_pricing(lang):
    t = LANGS[lang]
    p = t["pricing"]
    excl = "".join(f"<li>{e(x)}</li>" for x in p["excluded"])
    body = f'''<section class="band dark"><div class="wrap">
<div class="toolbar"><div class="head" style="margin:0"><span class="kicker">{e(p["k"])}</span><h1>{e(p["title"])}</h1><p class="lead">{e(p["lead"])}</p></div>{cur_toggle(lang)}</div>
{plans(lang)}
</div></section>
<section class="band"><div class="wrap"><div class="card soft"><h2 style="font-size:24px">{e(p["excluded_t"])}</h2><ul>{excl}</ul></div></div></section>
{cta_band(lang)}'''
    return body, ""


def p_faq(lang):
    t = LANGS[lang]
    f = t["faq"]
    body = page_head(f["k"], f["title"], f["lead"]) + f'''<section class="band"><div class="wrap" style="max-width:900px">{faq_list(lang, f["items"])}</div></section>{cta_band(lang)}'''
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in f["items"]]}
    return body, f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'


def p_order(lang):
    t = LANGS[lang]
    o = t["order"]
    p = t["pricing"]

    def fld(name, label, typ="text", req=False, hint="", attrs="", full=False):
        r = ' <span class="req" aria-hidden="true">*</span>' if req else ""
        hh = f'<span class="hint" id="h-{name}">{e(hint)}</span>' if hint else ""
        desc = f' aria-describedby="h-{name}"' if hint else ""
        st = ' style="grid-column:1/-1"' if full else ""
        if typ == "textarea":
            inp = f'<textarea id="{name}" name="{name}"{" required" if req else ""}{desc} {attrs}></textarea>'
        else:
            inp = f'<input id="{name}" name="{name}" type="{typ}"{" required" if req else ""}{desc} {attrs}>'
        return f'<div class="f"{st}><label for="{name}">{e(label)}{r}</label>{inp}{hh}</div>'

    def sel(name, label, options, req=False):
        r = ' <span class="req" aria-hidden="true">*</span>' if req else ""
        ops = f'<option value="">{e(o["select"])}</option>' + "".join(f'<option value="{e(v)}">{e(l)}</option>' for v, l in options)
        return f'<div class="f"><label for="{name}">{e(label)}{r}</label><select id="{name}" name="{name}"{" required" if req else ""}>{ops}</select></div>'

    choices = ""
    for k in ("basic", "ultimate", "ultimate_launch"):
        eur, mad = PRICES[k]
        choices += f'''<label class="choice"><input type="radio" name="formule" value="{k}" data-eur="{eur}" data-mad="{mad}"{" checked" if k == "ultimate" else ""} required>
<span><b>{e(p["plans"][k]["name"])}</b>{money(eur, mad, lang)}<em>{e(p["plans"][k]["desc"])}</em></span></label>'''

    body = page_head(o["k"], o["title"], o["lead"]) + f'''<section class="band light"><div class="wrap" style="max-width:920px">
<form class="form" id="order" novalidate data-endpoint="{FUNCTION_URL}" data-lang="{lang}">
<input type="hidden" name="langue" value="{lang}">
<input type="hidden" name="devise" value="{"MAD" if lang == "ar" else "EUR"}">
<input type="hidden" name="associes" value="[]">
<div class="hp" aria-hidden="true"><label>Site <input type="text" name="site_url" tabindex="-1" autocomplete="off"></label></div>

<fieldset><legend>{e(o["s_plan"])}</legend>
<div class="toolbar" style="margin:0;align-items:center"><span class="hint">{e(o["cur_hint"])}</span>{cur_toggle(lang, light=True)}</div>
<div class="choices">{choices}</div>
<label class="check"><input type="checkbox" name="option_itin" value="1"><span>{e(p["itin_t"])} {money(*ITIN, lang, plus=True)}<br><span class="hint">{e(o["itin_hint"])}</span></span></label>
</fieldset>

<fieldset><legend>{e(o["s_you"])}</legend>
<div class="fields">
{sel("civilite", o["civ"], o["civ_opts"])}
{fld("prenom", o["prenom"], req=True, attrs='autocomplete="given-name"')}
{fld("nom", o["nom"], req=True, attrs='autocomplete="family-name"', hint=o["nom_hint"])}
{fld("date_naissance", o["naissance"], "date", attrs='autocomplete="bday"')}
{fld("nationalite", o["nationalite"])}
{fld("pays_residence", o["pays"], req=True, attrs='autocomplete="country-name"')}
{fld("email", o["email"], "email", req=True, attrs='autocomplete="email"')}
{fld("telephone", o["tel"], "tel", req=True, attrs='autocomplete="tel" dir="ltr"', hint=o["tel_hint"])}
{fld("adresse", o["adresse"], req=True, attrs='autocomplete="street-address"', full=True)}
{fld("code_postal", o["cp"], attrs='autocomplete="postal-code"')}
{fld("ville", o["ville"], req=True, attrs='autocomplete="address-level2"')}
</div></fieldset>

<fieldset><legend>{e(o["s_co"])}</legend>
<p class="hint">{e(o["names_hint"])}</p>
<div class="fields">
{fld("nom_societe_1", o["name1"], req=True, attrs='dir="ltr"')}
{fld("nom_societe_2", o["name2"], attrs='dir="ltr"')}
{fld("nom_societe_3", o["name3"], attrs='dir="ltr"')}
{sel("suffixe", o["suffix"], [("LLC", "LLC"), ("L.L.C.", "L.L.C."), ("Limited Liability Company", "Limited Liability Company")], req=True)}
{sel("activite", o["activity"], o["activities"], req=True)}
{fld("site_web", o["website"], "url", attrs='placeholder="https://" dir="ltr"')}
{fld("description_activite", o["desc"], "textarea", full=True, hint=o["desc_hint"])}
</div>
<div class="f"><span class="lbl">{e(o["owners"])}</span>
<div class="choices">
<label class="choice"><input type="radio" name="type_associes" value="seul" checked><span><b>{e(o["alone"])}</b><em>{e(o["alone_d"])}</em></span></label>
<label class="choice"><input type="radio" name="type_associes" value="plusieurs"><span><b>{e(o["several"])}</b><em>{e(o["several_d"])}</em></span></label>
</div></div>
<div class="partners" id="partners" hidden>
<p class="hint">{e(o["partners_hint"])}</p>
<div id="partner-rows"></div>
<button type="button" class="btn btn-line" id="add-partner" style="align-self:flex-start">+ {e(o["add_partner"])}</button>
<template id="partner-tpl"><div class="partner"><input type="text" aria-label="{e(o["partner_name"])}" placeholder="{e(o["partner_name"])}" data-k="nom"><input type="number" min="1" max="100" aria-label="%" placeholder="%" data-k="part"><button type="button" class="icon-btn" aria-label="{e(o["remove"])}">×</button></div></template>
</div>
</fieldset>

<fieldset><legend>{e(o["s_doc"])}</legend>
<div class="f"><label for="piece_identite">{e(o["passport"])} <span class="req" aria-hidden="true">*</span></label>
<input id="piece_identite" name="piece_identite" type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" required aria-describedby="h-piece">
<span class="hint" id="h-piece">{e(o["passport_hint"])}</span></div>
{fld("message", o["message"], "textarea")}
</fieldset>

<fieldset><legend>{e(o["s_ok"])}</legend>
<label class="check"><input type="checkbox" name="accepte_cgv" value="1" required><span>{o["cgv_html"]}</span></label>
<label class="check"><input type="checkbox" name="demarrage_immediat" value="1"><span>{e(o["start_now"])}</span></label>
<p class="hint">{e(o["privacy"])}</p>
</fieldset>

<div class="alert err" id="form-err" role="alert" hidden></div>
<div class="total"><div><span class="hint" style="color:#B8C2D1">{e(o["total"])}</span><br><strong id="total" dir="ltr">—</strong></div>
<button class="btn btn-gold" type="submit" id="submit">{e(o["submit"])} {ARROW}</button></div>
</form>

<div class="done" id="done" hidden tabindex="-1">
<h2 style="font-size:30px">{e(o["done_t"])}</h2>
<p>{e(o["done_ref"])} <strong id="done-ref" dir="ltr"></strong></p>
<p id="done-pay-text">{e(o["done_pay"])}</p>
<div class="row"><a class="btn btn-gold" id="done-pay" href="#" hidden>{e(o["pay_btn"])} {ARROW}</a>
<a class="btn btn-navy" id="done-wa" href="#" target="_blank" rel="noopener">{CHAT} {e(o["done_wa"])}</a></div>
<p class="hint" id="done-nopay" hidden>{e(o["done_nopay"])}</p>
</div>
<script type="application/json" id="i18n">{json.dumps(o["js"], ensure_ascii=False)}</script>
</div></section>'''
    return body, '<meta name="robots" content="index, follow">'


PAGES = {"home": p_home, "benefits": p_benefits, "how": p_how, "pricing": p_pricing, "faq": p_faq, "order": p_order}


def out_path(lang, key):
    p = (PREFIX[lang] + SLUGS[lang][key]).strip("/")
    if p == "":
        return os.path.join(ROOT, "index.html")
    if key == "home":
        return os.path.join(ROOT, p, "index.html")
    return os.path.join(ROOT, p + ".html")


def main():
    urls = []
    for lang in LANGS:
        for key, fn in PAGES.items():
            body, head = fn(lang)
            title, desc = LANGS[lang]["seo"][key]
            path = out_path(lang, key)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(layout(lang, key, title, desc, body, head))
            urls.append((SITE + href(lang, key), key))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for lang in LANGS:
        for key in PAGES:
            alts = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{SITE}{href(l, key)}"/>' for l in LANGS)
            sm.append(f'  <url><loc>{SITE}{href(lang, key)}</loc>{alts}</url>')
    for p in ("cgv", "mentions-legales", "confidentialite"):
        sm.append(f"  <url><loc>{SITE}/{p}</loc></url>")
    sm.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(sm) + "\n")
    print("ok", len(urls), "pages")


if __name__ == "__main__":
    main()
