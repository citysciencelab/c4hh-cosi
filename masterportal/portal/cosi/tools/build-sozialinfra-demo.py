#!/usr/bin/env python3
"""
Build the FICTIONAL demo data for the "Förderung & Öffnungszeiten" prototype.

Why
---
The prototype has to answer three questions before any real data exists:

1. Where does funding money flow — to which address, and where is it actually
   spent? An association (Träger) is paid at one address but often runs several
   sites, so "paid here" and "used here" are two different maps.
2. When are facilities open over a week?
3. How many people do they reach (weekly visitors, plus the existing
   Erreichbarkeitsanalyse)?

Real vs. fictional — the line is drawn here, once
-------------------------------------------------
REAL (FHH open data, fetched live):
    location, facility name, offer type, Kita capacity, pupil numbers,
    Stadtteil boundaries, population.
FICTIONAL (generated below, seeded and reproducible):
    Träger and their names, which sites belong together, funding amounts and
    programmes, opening hours, weekly visitors.

The fiction is shaped by real hints where the source offers them, so it stays
plausible: OKJA records publish the share of evening and weekend opening and the
average number of regular users (durchsch_stammnutzer); Kita records list the
longest care module offered (up to 12 h). Those drive hours and visitor numbers.
Schools and Kitas get opening hours but no funding and no visitor numbers.

Scope: the five neighbouring Stadtteile in STADTTEILE. Every Träger network stays
inside them, so the Stadtteil sums are complete for the demo area.

Output (assets/, EPSG:25832)
----------------------------
    demo-sozialinfra-jugend.geojson       funded youth sites
    demo-sozialinfra-familie.geojson      funded family sites
    demo-sozialinfra-kitas.geojson        Kitas (opening hours only)
    demo-sozialinfra-schulen.geojson      schools (opening hours only)
    demo-sozialinfra-traegernetz.geojson  lines Hauptsitz -> Standort
    demo-sozialinfra-stadtteile.geojson   Stadtteil statistics (long table format)

Opening hours are stored twice: ``oeffnungszeiten`` in OSM opening_hours syntax
(subset: "Mo-Fr 08:00-16:00; Sa 10:00-14:00") for the prototype to parse, and
``oeffnungszeiten_text`` in German for the GFI.

Usage
-----
    python3 tools/build-sozialinfra-demo.py            # real facility names
    python3 tools/build-sozialinfra-demo.py --anonym   # generic names for the
                                                       # funded sites (public demos)

Then register the layers in tools/local-services.json (already done for these
ids) and re-run tools/build-registries.py. api.hamburg.de is down for nightly
maintenance roughly 22:00-05:00 — run this outside that window.
"""
import argparse
import json
import math
import random
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

PORTAL_DIR = Path(__file__).resolve().parent.parent
SERVICES_JSON = PORTAL_DIR / "services.json"
ASSETS_DIR = PORTAL_DIR / "assets"
PREFIX = "demo-sozialinfra"
TIMEOUT = 120

SEED = 2025
FOERDERJAHR = "2025"
DATENSTATUS = ("DEMO – Lage, Name und Angebotstyp: Open Data FHH; Träger, Förderung, "
               "Öffnungszeiten und Besuche: fiktiv")

STADTTEILE = ["Hamm", "Horn", "Eilbek", "Wandsbek", "Rothenburgsort"]
BEZIRKSAMT = {
    "Hamm": "Bezirksamt Hamburg-Mitte",
    "Horn": "Bezirksamt Hamburg-Mitte",
    "Rothenburgsort": "Bezirksamt Hamburg-Mitte",
    "Eilbek": "Bezirksamt Wandsbek",
    "Wandsbek": "Bezirksamt Wandsbek",
}

STADTTEIL_LAYER = "28201"
POPULATION_LAYER = "31240"
KITA_LAYER = "753"
SCHOOL_LAYERS = ["8712", "21067"]

# Funded offers: source layer -> profile.
#   eur    annual funding range for one offer
#   hours  opening-hours template (see TEMPLATES)
#   rate   visitors per opening hour, used when the source has no user count
OFFERS = {
    # --- Kinder und Jugend ---
    "33505": {"kategorie": "Jugend", "typ": "Haus der Jugend",
              "programm": "Offene Kinder- und Jugendarbeit (OKJA)",
              "eur": (280_000, 520_000), "hours": "haus_der_jugend", "rate": (4, 8)},
    "33526": {"kategorie": "Jugend", "typ": "Jugendklub",
              "programm": "Offene Kinder- und Jugendarbeit (OKJA)",
              "eur": (140_000, 300_000), "hours": "jugendklub", "rate": (3, 7)},
    "33507": {"kategorie": "Jugend", "typ": "Jugendtreff im Stadtteilzentrum",
              "programm": "Offene Kinder- und Jugendarbeit (OKJA)",
              "eur": (90_000, 200_000), "hours": "jugendtreff", "rate": (3, 6)},
    "33523": {"kategorie": "Jugend", "typ": "Spielhaus",
              "programm": "Offene Kinder- und Jugendarbeit (OKJA)",
              "eur": (70_000, 160_000), "hours": "spielhaus", "rate": (3, 7)},
    "33548": {"kategorie": "Jugend", "typ": "Sonstiges OKJA-Angebot",
              "programm": "Offene Kinder- und Jugendarbeit (OKJA)",
              "eur": (20_000, 80_000), "hours": "okja_sonstige", "rate": (2, 5)},
    "18689": {"kategorie": "Jugend", "typ": "Straßensozialarbeit",
              "programm": "Jugendsozialarbeit",
              "eur": (120_000, 260_000), "hours": "strassensozialarbeit", "rate": (1, 3)},
    "19610": {"kategorie": "Jugend", "typ": "Jugendberatung",
              "programm": "Sozialräumliche Angebote der Jugend- und Familienhilfe (SAJF)",
              "eur": (60_000, 150_000), "hours": "jugendberatung", "rate": (1, 3)},
    # --- Familie ---
    "19944": {"kategorie": "Familie", "typ": "Eltern-Kind-Zentrum",
              "programm": "Programm Eltern-Kind-Zentren",
              "eur": (70_000, 130_000), "hours": "ekiz", "rate": (4, 9)},
    "34597": {"kategorie": "Familie", "typ": "Elternschule / Familienberatung",
              "programm": "Familienförderung",
              "eur": (80_000, 200_000), "hours": "elternschule", "rate": (3, 7)},
    "19947": {"kategorie": "Familie", "typ": "Familienteam",
              "programm": "Familienförderung",
              "eur": (90_000, 180_000), "hours": "familienteam", "rate": (1, 2.5)},
    "19948": {"kategorie": "Familie", "typ": "Erziehungsberatung",
              "programm": "Erziehungsberatung",
              "eur": (180_000, 420_000), "hours": "erziehungsberatung", "rate": (1, 2)},
    "19950": {"kategorie": "Familie", "typ": "Familienbildungsstätte",
              "programm": "Familienförderung",
              "eur": (120_000, 260_000), "hours": "familienbildungsstaette", "rate": (4, 8)},
    "30570": {"kategorie": "Familie", "typ": "Mütterberatung",
              "programm": "Familienförderung",
              "eur": (25_000, 60_000), "hours": "muetterberatung", "rate": (6, 12)},
    "19613": {"kategorie": "Familie", "typ": "Familienangebot im Stadtteil",
              "programm": "Sozialräumliche Angebote der Jugend- und Familienhilfe (SAJF)",
              "eur": (30_000, 110_000), "hours": "familiencafe", "rate": (4, 10)},
    "19612": {"kategorie": "Familie", "typ": "Familienrat",
              "programm": "Sozialräumliche Angebote der Jugend- und Familienhilfe (SAJF)",
              "eur": (40_000, 90_000), "hours": "familienrat", "rate": (0.2, 0.6)},
}

# Days: 0 = Monday ... 6 = Sunday.
MO_FR = [0, 1, 2, 3, 4]
MO_TH = [0, 1, 2, 3]

# Opening-hours templates: list of (days, "HH:MM", "HH:MM"). None for the days
# means "pick n random weekdays" (see pick_days), for offers that run once or
# twice a week.
TEMPLATES = {
    "haus_der_jugend": [(MO_FR, "14:00", "20:00")],
    "jugendklub": [([1, 2, 3, 4], "15:00", "20:00")],
    "jugendtreff": [([0, 2, 4], "15:00", "20:00")],
    "spielhaus": [(MO_FR, "13:00", "18:00")],
    "okja_sonstige": [(("pick", 1), "16:00", "19:00")],
    "strassensozialarbeit": [(MO_FR, "12:00", "20:00")],
    "jugendberatung": [(MO_TH, "10:00", "17:00")],
    "ekiz": [(MO_FR, "09:00", "12:30"), ([1, 3], "14:30", "17:00")],
    "elternschule": [(MO_TH, "09:00", "13:00"), (MO_TH, "15:00", "18:00"), ([4], "09:00", "12:00")],
    "familienteam": [(MO_FR, "09:00", "16:00")],
    "erziehungsberatung": [(MO_TH, "09:00", "17:00"), ([4], "09:00", "14:00")],
    "familienbildungsstaette": [(MO_FR, "09:00", "13:00"), (MO_TH, "17:00", "21:00"), ([5], "10:00", "14:00")],
    "muetterberatung": [(("pick", 1), "09:30", "11:00")],
    "familiencafe": [(("pick", 2), "09:30", "12:00")],
    "familienrat": [(MO_FR, "10:00", "15:00")],
}

# School hours by school type (kapitelbezeichnung). Ganztag: 8 to 16 o'clock;
# secondary schools finish early on Fridays.
SCHOOL_HOURS = {
    "Grundschulen": [(MO_FR, "08:00", "16:00")],
    "Stadtteilschulen": [(MO_TH, "08:00", "16:00"), ([4], "08:00", "13:30")],
    "Gymnasien": [(MO_TH, "08:00", "15:30"), ([4], "08:00", "13:15")],
    "Langformschulen": [(MO_FR, "08:00", "16:00")],
    "Sonderschulen": [(MO_FR, "08:00", "15:00")],
    "Berufliche Schulen": [(MO_FR, "07:30", "17:00")],
}
SCHOOL_TYPE_LABEL = {
    "Grundschulen": "Grundschule",
    "Stadtteilschulen": "Stadtteilschule",
    "Gymnasien": "Gymnasium",
    "Langformschulen": "Langformschule",
    "Sonderschulen": "Sonderschule / ReBBZ",
    "Berufliche Schulen": "Berufliche Schule",
}

# Träger networks: sizes of the multi-site networks; every remaining site becomes
# a single-site Träger. One big network spread over several Stadtteile shows the
# "paid in one district, spent in others" case; the rest cluster locally, which
# is how small associations actually grow.
NETWORK_SIZES = [5, 3, 3, 2, 2, 2]

# Invented names. Checked against the real Träger in the source layers, but a
# coincidental match with some real association elsewhere is possible — review
# before a public showing.
NETWORK_NAMES = [
    "Kinder- und Familienwerk Hamburg-Ost gGmbH",
    "Stadtteilnetz Kinder & Familie e.V.",
    "Jugendwerk Ost gGmbH",
    "Familienforum Nachbarschaft e.V.",
    "Brückenbau Jugendhilfe gGmbH",
    "Lernwerkstatt Quartier e.V.",
]
# Place-free on purpose: names are dealt out in order, so a place name would end
# up on a Träger seated somewhere else — locals notice that at once.
SINGLE_NAMES = [
    "Spielraum Ost e.V.", "Familienzeit e.V.", "Jugendinitiative Ostkreuz e.V.",
    "Elterncafé am Markt e.V.", "Kinderinsel e.V.", "Beratungsnetz Familie e.V.",
    "Offene Tür Jugend e.V.", "Wegweiser Familie e.V.", "Junges Quartier e.V.",
    "Deichkinder Ost e.V.", "Vielfalt im Viertel e.V.", "Anker Familienarbeit e.V.",
    "Kiezkompass e.V.", "Elternwerk Ost e.V.", "Lichtblick Jugend e.V.",
    "Sprungbrett Familie e.V.", "Freiraum Jugend e.V.", "Brückenschlag e.V.",
    "Grüne Insel Kinderhilfe e.V.", "Stadtteilmütter Ost e.V.",
]

DAY_OSM = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
DAY_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

# Offers closer than this are one site (same building, neighbouring entrances).
SITE_MERGE_METRES = 25


# --------------------------------------------------------------------------
# Fetching
# --------------------------------------------------------------------------

def load_services():
    """Map layer id -> service entry, tolerating the list-valued ids upstream uses."""
    services = json.loads(SERVICES_JSON.read_text(encoding="utf-8-sig"))
    by_id = {}
    for entry in services:
        raw = entry.get("id")
        ids = [str(x) for x in raw] if isinstance(raw, list) else [str(raw)]
        for i in ids:
            by_id.setdefault(i, entry)
    return by_id


def get_json(url):
    with urllib.request.urlopen(url, timeout=TIMEOUT) as response:
        payload = response.read().decode("utf-8-sig")
    if not payload.lstrip().startswith("{"):
        raise RuntimeError(f"not JSON (service exception?): {payload[:200]}")
    return json.loads(payload)


def fetch_wfs(entry):
    """GetFeature as GeoJSON in EPSG:25832. Returns the feature list."""
    params = {
        "SERVICE": "WFS",
        "VERSION": "2.0.0",
        "REQUEST": "GetFeature",
        "TYPENAMES": f"{entry.get('featurePrefix', 'de.hh.up')}:{entry['featureType']}",
        "SRSNAME": "urn:ogc:def:crs:EPSG::25832",
        "outputFormat": "application/geo+json",
    }
    return get_json(entry["url"] + "?" + urllib.parse.urlencode(params, safe=":")).get("features", [])


def fetch_oaf(entry, **query):
    query.setdefault("f", "json")
    url = f"{entry['url']}/collections/{entry['collection']}/items?{urllib.parse.urlencode(query)}"
    return get_json(url).get("features", [])


def fetch_stadtteile(by_id):
    entry = by_id[STADTTEIL_LAYER]
    polygons = {}
    for name in STADTTEILE:
        features = fetch_oaf(entry, stadtteil_name=name,
                             crs="http://www.opengis.net/def/crs/EPSG/0/25832")
        if not features:
            raise RuntimeError(f"Stadtteil {name!r} not found in layer {STADTTEIL_LAYER}")
        geometry = features[0]["geometry"]
        polygons[name] = (geometry["coordinates"] if geometry["type"] == "MultiPolygon"
                          else [geometry["coordinates"]])
    return polygons


def fetch_population(by_id):
    """Latest year's total and under-18 population per Stadtteil."""
    entry = by_id[POPULATION_LAYER]
    population = {}
    for name in STADTTEILE:
        rows = [f["properties"] for f in fetch_oaf(entry, stadtteil=name, skipGeometry="true", limit=100)]
        rows = [r for r in rows if r.get("bev_insgesamt")]
        if not rows:
            print(f"  !! keine Bevölkerungszahl für {name}")
            continue
        latest = max(rows, key=lambda r: str(r.get("jahr")))
        population[name] = {"jahr": str(latest["jahr"]),
                            "bev": latest["bev_insgesamt"],
                            "bev_u18": latest.get("bev_u18")}
    return population


# --------------------------------------------------------------------------
# Geometry
# --------------------------------------------------------------------------

def point_of(geometry):
    """Reduce any geometry to a point (centre of its extent for non-points)."""
    if not geometry:
        return None
    if geometry["type"] == "Point":
        return list(geometry["coordinates"][:2])
    coords, stack = [], [geometry["coordinates"]]
    while stack:
        item = stack.pop()
        if item and isinstance(item[0], (int, float)):
            coords.append(item[:2])
        else:
            stack.extend(item)
    if not coords:
        return None
    xs, ys = [c[0] for c in coords], [c[1] for c in coords]
    return [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2]


def in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def stadtteil_of(point, polygons):
    x, y = point
    for name, multipolygon in polygons.items():
        for polygon in multipolygon:
            if in_ring(x, y, polygon[0]) and not any(in_ring(x, y, hole) for hole in polygon[1:]):
                return name
    return None


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


# --------------------------------------------------------------------------
# Opening hours
# --------------------------------------------------------------------------

def to_min(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def to_hhmm(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def jitter(rng, minutes, steps=(-30, -15, 0, 0, 15, 30)):
    return minutes + rng.choice(steps)


def build_week(rules, rng, *, start_steps=(-30, -15, 0, 0, 15, 30), end_steps=(-30, -15, 0, 0, 15, 30)):
    """Rules -> {day: [(start, end), ...]} with per-site jitter, merged per day."""
    week = defaultdict(list)
    for days, start, end in rules:
        if isinstance(days, tuple) and days[0] == "pick":
            days = sorted(rng.sample(MO_FR, days[1]))
        s = jitter(rng, to_min(start), start_steps)
        e = jitter(rng, to_min(end), end_steps)
        if e - s < 60:
            e = s + 60
        for day in days:
            week[day].append((s, e))
    return merge_week(week)


def merge_week(week):
    merged = {}
    for day, intervals in week.items():
        out = []
        for s, e in sorted(intervals):
            if out and s <= out[-1][1]:
                out[-1] = (out[-1][0], max(out[-1][1], e))
            else:
                out.append((s, e))
        merged[day] = out
    return merged


def union_weeks(weeks):
    combined = defaultdict(list)
    for week in weeks:
        for day, intervals in week.items():
            combined[day].extend(intervals)
    return merge_week(combined)


def day_spec(days, labels):
    """[0,1,2,3,4] -> 'Mo-Fr'; [0,2,4] -> 'Mo,We,Fr'; [1,2] -> 'Tu,We'."""
    runs, run = [], [days[0]]
    for d in days[1:]:
        if d == run[-1] + 1:
            run.append(d)
        else:
            runs.append(run)
            run = [d]
    runs.append(run)
    parts = []
    for r in runs:
        if len(r) >= 3:
            parts.append(f"{labels[r[0]]}-{labels[r[-1]]}")
        else:
            parts.extend(labels[d] for d in r)
    return ",".join(parts)


def format_week(week, labels, *, rule_sep, range_sep):
    groups = defaultdict(list)
    for day in range(7):
        if week.get(day):
            key = tuple(week[day])
            groups[key].append(day)
    rules = sorted(groups.items(), key=lambda item: item[1][0])
    return rule_sep.join(
        f"{day_spec(days, labels)} " + ", ".join(f"{to_hhmm(s)}{range_sep}{to_hhmm(e)}" for s, e in intervals)
        for intervals, days in rules)


def hours_props(week):
    minutes = sum(e - s for intervals in week.values() for s, e in intervals)
    late = any(e > 18 * 60 for intervals in week.values() for _s, e in intervals)
    weekend = bool(week.get(5) or week.get(6))
    return {
        "oeffnungszeiten": format_week(week, DAY_OSM, rule_sep="; ", range_sep="-"),
        "oeffnungszeiten_text": format_week(week, DAY_DE, rule_sep=" · ", range_sep="–"),
        "oeffnungsstunden_woche": round(minutes / 60, 1),
        "abend_oder_wochenende": "ja" if (late or weekend) else "nein",
    }


def offer_rules(profile, props, name):
    """Template rules, adjusted by the real OKJA opening shares where present."""
    rules = [(list(d) if isinstance(d, list) else d, s, e) for d, s, e in TEMPLATES[profile["hours"]]]
    evening = props.get("montag_bis_freitag_abendoeffnung_prozent")
    weekend = props.get("wochenende_tagsueber_prozent")
    # Only offers that already run into the evening get stretched; a Spielhaus
    # closing at 18:00 stays a daytime offer whatever its record says.
    if isinstance(evening, (int, float)) and evening >= 20 and to_min(rules[0][2]) >= to_min("19:00"):
        days, start, _end = rules[0]
        rules[0] = (days, start, "21:00")
    if isinstance(weekend, (int, float)) and weekend > 0:
        rules.append(([5], "14:00", "18:00"))
    if "sonntag" in (name or "").lower():
        rules = [([6], "10:00", "13:00")]
    return rules


# --------------------------------------------------------------------------
# Building blocks
# --------------------------------------------------------------------------

def site_rng(*parts):
    """Per-site random source: values for one site do not shift when another
    site appears or disappears upstream."""
    return random.Random(":".join(str(p) for p in (SEED, *parts)))


def round_to(value, step):
    return int(round(value / step) * step)


def offer_name(props):
    return (props.get("einrichtung") or props.get("name_des_angebotes")
            or props.get("zusatz_einrichtungsname") or props.get("objektname") or "").strip()


def address_of(props):
    return " ".join((props.get("adresse") or "").split())


def collect_offers(by_id, polygons):
    offers = []
    for layer_id, profile in OFFERS.items():
        features = fetch_wfs(by_id[layer_id])
        added = 0
        for feature in features:
            point = point_of(feature.get("geometry"))
            if point is None:
                continue
            stadtteil = stadtteil_of(point, polygons)
            if not stadtteil:
                continue
            props = feature.get("properties") or {}
            offers.append({"layer": layer_id, "profile": profile, "props": props, "point": point,
                           "stadtteil": stadtteil, "name": offer_name(props), "adresse": address_of(props),
                           "ort": " ".join(str(props.get("ort") or "").split())})
            added += 1
        print(f"  {profile['typ']:<34} {added:>3}  (von {len(features)} in Hamburg)")
    offers.sort(key=lambda o: (o["adresse"].lower(), o["layer"], o["name"].lower()))
    return offers


def group_sites(offers):
    """Offers at the same address or within SITE_MERGE_METRES are one site."""
    sites = []
    for offer in offers:
        for site in sites:
            if (site[0]["adresse"].lower() == offer["adresse"].lower()
                    or distance(site[0]["point"], offer["point"]) < SITE_MERGE_METRES):
                site.append(offer)
                break
        else:
            sites.append([offer])
    return sites


def price_offer(offer):
    rng = site_rng("offer", offer["layer"], offer["adresse"], offer["name"])
    profile = offer["profile"]
    week = build_week(offer_rules(profile, offer["props"], offer["name"]), rng)
    hours = sum(e - s for iv in week.values() for s, e in iv) / 60
    lo, hi = profile["eur"]
    regulars = offer["props"].get("durchsch_stammnutzer")
    if isinstance(regulars, (int, float)) and regulars > 0:
        # Regular users come about twice a week; occasional visitors on top.
        visits = regulars * rng.uniform(1.5, 2.5)
    else:
        visits = hours * rng.uniform(*profile["rate"])
    return {
        "week": week,
        "eur": round_to(rng.uniform(lo, hi), 10),
        "visits": max(5, round_to(visits, 5)),
        "weight": (lo + hi) / 2,
    }


def build_funded_sites(offers, anonym):
    sites = []
    for index, group in enumerate(group_sites(offers)):
        priced = [(offer, price_offer(offer)) for offer in group]
        priced.sort(key=lambda item: -item[1]["weight"])
        primary, _ = priced[0]
        week = union_weeks([p["week"] for _o, p in priced])
        sites.append({
            "primary": primary,
            "others": [o for o, _p in priced[1:]],
            "point": [round(c, 2) for c in primary["point"]],
            "stadtteil": primary["stadtteil"],
            "eur": sum(p["eur"] for _o, p in priced),
            "visits": sum(p["visits"] for _o, p in priced),
            "programmes": sorted({o["profile"]["programm"] for o, _p in priced}),
            "week": week,
            "index": index,
        })

    if anonym:
        counter = Counter()
        for site in sites:
            label = f"{site['primary']['profile']['typ']} {site['stadtteil']}"
            counter[label] += 1
            site["display_name"] = label
        seen = Counter()
        for site in sites:
            label = site["display_name"]
            if counter[label] > 1:
                seen[label] += 1
                site["display_name"] = f"{label} {seen[label]}"
    else:
        for site in sites:
            site["display_name"] = site["primary"]["name"]
    return sites


def assign_networks(sites):
    """Group sites into fictional Träger. Returns a list of site lists."""
    rng = random.Random(f"{SEED}:networks")
    unassigned = list(range(len(sites)))
    networks = []

    for n, size in enumerate(NETWORK_SIZES):
        if len(unassigned) < size:
            break
        if n == 0:
            # The big network: one site per Stadtteil as far as possible.
            seed = rng.choice(unassigned)
            members = [seed]
            while len(members) < size:
                covered = {sites[i]["stadtteil"] for i in members}
                pool = [i for i in unassigned if i not in members and sites[i]["stadtteil"] not in covered] \
                    or [i for i in unassigned if i not in members]
                members.append(rng.choice(pool))
        else:
            seed = rng.choice(unassigned)
            members = [seed]
            while len(members) < size:
                pool = sorted((i for i in unassigned if i not in members),
                              key=lambda i: distance(sites[i]["point"], sites[seed]["point"]))
                members.append(rng.choice(pool[:3]))
        for i in members:
            unassigned.remove(i)
        networks.append(members)

    networks.extend([i] for i in sorted(unassigned))
    return [[sites[i] for i in members] for members in networks]


# --------------------------------------------------------------------------
# Feature builders
# --------------------------------------------------------------------------

def feature(point, props):
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": point},
            "properties": {k: v for k, v in props.items() if v not in (None, "", [])}}


def funded_features(networks):
    features, lines, traeger_rows = [], [], []
    multi_names, single_names = iter(NETWORK_NAMES), iter(SINGLE_NAMES)
    counter = Counter()

    for members in networks:
        multi = len(members) > 1
        name = next(multi_names if multi else single_names, None) or f"Demo-Träger {len(traeger_rows) + 1}"
        traeger_id = f"T{len(traeger_rows) + 1:02d}"
        main = max(members, key=lambda s: s["eur"])
        total = sum(s["eur"] for s in members)
        funders = sorted({BEZIRKSAMT[s["stadtteil"]] for s in members})
        programmes = sorted({p for s in members for p in s["programmes"]})
        traeger_rows.append({"id": traeger_id, "name": name, "sites": members, "main": main, "total": total})

        for site in members:
            kategorie = site["primary"]["profile"]["kategorie"]
            counter[kategorie] += 1
            site["id"] = f"demo-{kategorie[0].lower()}{counter[kategorie]:03d}"

        for site in members:
            primary = site["primary"]
            is_main = site is main
            props = {
                "id": site["id"],
                "einrichtung": site["display_name"],
                "kategorie": primary["profile"]["kategorie"],
                "angebotstyp": primary["profile"]["typ"],
                "weitere_angebote": ", ".join(
                    f"{o['name']} ({o['profile']['typ']})" for o in site["others"]),
                "adresse": primary["adresse"],
                "ort": primary["ort"],
                "stadtteil": site["stadtteil"],
                "traeger_id": traeger_id,
                "traeger": name,
                "rolle": ("Hauptsitz" if is_main else "Standort") if multi else "Einzelstandort",
                "standorte_anz": len(members),
                "hauptsitz_id": None if is_main else main["id"],
                "zahlungsadresse": f"{main['primary']['adresse']}, {main['stadtteil']}",
                "foerderung_traeger_eur": total,
                "foerderung_zahlung_eur": total if is_main else 0,
                "foerderung_standort_eur": site["eur"],
                "foerderprogramme": ", ".join(programmes),
                "foerdergeber": ", ".join(funders),
                "foerderjahr": FOERDERJAHR,
                "besuche_woche": site["visits"],
                **hours_props(site["week"]),
                "quelle_layer": primary["layer"],
                "datenstatus": DATENSTATUS,
            }
            features.append(feature(site["point"], props))
            if multi and not is_main:
                lines.append({"type": "Feature",
                              "geometry": {"type": "LineString",
                                           "coordinates": [main["point"], site["point"]]},
                              "properties": {"traeger_id": traeger_id, "traeger": name,
                                             "von": main["display_name"], "nach": site["display_name"],
                                             "hauptsitz_id": main["id"], "standort_id": site["id"],
                                             "foerderung_standort_eur": site["eur"],
                                             "datenstatus": DATENSTATUS}})
    return features, lines, traeger_rows


def kita_features(by_id, polygons):
    out = []
    for f in fetch_wfs(by_id[KITA_LAYER]):
        point = point_of(f.get("geometry"))
        stadtteil = point and stadtteil_of(point, polygons)
        if not stadtteil:
            continue
        p = f.get("properties") or {}
        modules = " ".join(p.get("Leistungsname") or []) if isinstance(p.get("Leistungsname"), list) \
            else str(p.get("Leistungsname") or "")
        adresse = " ".join(f"{p.get('Strasse') or ''} {p.get('Hausnr') or ''}".split())
        rng = site_rng("kita", adresse, p.get("Name"))
        # The longest care module bounds the opening hours.
        if "12-stündige" in modules:
            rules = [(MO_FR, rng.choice(["06:00", "06:30", "06:30", "07:00"]),
                      rng.choice(["17:30", "18:00", "18:00", "18:30"]))]
        elif "10-stündige" in modules:
            rules = [(MO_FR, rng.choice(["06:30", "07:00", "07:00", "07:30"]), rng.choice(["17:00", "17:00", "17:30"]))]
        else:
            rules = [(MO_FR, rng.choice(["07:30", "08:00"]), rng.choice(["15:00", "16:00"]))]
        week = build_week(rules, rng, start_steps=(0,), end_steps=(0,))
        out.append(feature([round(c, 2) for c in point], {
            "einrichtung": (p.get("Name") or "").strip(),
            "kategorie": "Kita",
            "angebotstyp": "Kita",
            "Leistungsarten": p.get("Leistungsarten"),     # drives the existing Kita icon style
            "adresse": adresse,
            "ort": " ".join(f"{p.get('PLZ') or ''} {p.get('Ort') or ''}".split()),
            "stadtteil": stadtteil,
            "betreute_kinder": p.get("Anzahl_betreuter_Kinder"),
            **hours_props(week),
            "quelle_layer": KITA_LAYER,
            "datenstatus": DATENSTATUS,
        }))
    return with_ids(out, "kita")


def school_features(by_id, polygons):
    out = []
    for layer_id in SCHOOL_LAYERS:
        for f in fetch_wfs(by_id[layer_id]):
            point = point_of(f.get("geometry"))
            stadtteil = point and stadtteil_of(point, polygons)
            p = f.get("properties") or {}
            name = (p.get("schulname") or "").strip()
            if not stadtteil or not name or name == "ohne Angabe":
                continue
            kapitel = p.get("kapitelbezeichnung")
            rng = site_rng("schule", p.get("adresse_strasse_hausnr"), name)
            week = build_week(SCHOOL_HOURS.get(kapitel, SCHOOL_HOURS["Grundschulen"]), rng,
                              start_steps=(-15, 0, 0, 0), end_steps=(-30, 0, 0, 30))
            out.append(feature([round(c, 2) for c in point], {
                "einrichtung": name,
                "kategorie": "Schule",
                "angebotstyp": SCHOOL_TYPE_LABEL.get(kapitel, kapitel),
                "kapitelbezeichnung": kapitel,              # drives the existing school icon style
                "traegerschaft": "staatlich" if layer_id == "8712" else "nicht staatlich",
                "adresse": " ".join(str(p.get("adresse_strasse_hausnr") or "").split()),
                "ort": p.get("adresse_ort"),
                "stadtteil": stadtteil,
                "schueler": p.get("anzahl_schueler"),
                "ganztagsform": p.get("ganztagsform"),
                **hours_props(week),
                "quelle_layer": layer_id,
                "datenstatus": DATENSTATUS,
            }))
    return with_ids(out, "schule")


def with_ids(features, prefix):
    """Sort by Stadtteil and name, then number — ids follow the reading order."""
    features.sort(key=lambda f: (f["properties"]["stadtteil"], f["properties"]["einrichtung"]))
    for n, f in enumerate(features, 1):
        f["properties"] = {"id": f"demo-{prefix}-{n:03d}", **f["properties"]}
    return features


def stats_records(funded, population):
    rows = {name: Counter() for name in STADTTEILE}
    for f in funded:
        p = f["properties"]
        row = rows[p["stadtteil"]]
        row["zahlung"] += p["foerderung_zahlung_eur"]
        row["wirkung"] += p["foerderung_standort_eur"]
        row["standorte"] += 1
        row["hauptsitze"] += 1 if p["rolle"] != "Standort" else 0
        row["besuche"] += p["besuche_woche"]
        row["stunden"] += p["oeffnungsstunden_woche"]
        row["abend"] += 1 if p["abend_oder_wochenende"] == "ja" else 0

    records = []
    for name in STADTTEILE:
        r = rows[name]
        u18 = (population.get(name) or {}).get("bev_u18")
        records.append({
            "stadtteil": name,
            "jahr": FOERDERJAHR,
            "demo_foerd_zahladresse_eur": r["zahlung"],
            "demo_foerd_wirkungsort_eur": r["wirkung"],
            "demo_foerd_saldo_eur": r["wirkung"] - r["zahlung"],
            "demo_foerd_je_u18_eur": round(r["wirkung"] / u18, 2) if u18 else None,
            "demo_standorte_anz": r["standorte"],
            "demo_traeger_sitz_anz": r["hauptsitze"],
            "demo_besuche_woche": r["besuche"],
            "demo_oeffnungsstunden_woche": round(r["stunden"], 1),
            "demo_standorte_abend_we_anz": r["abend"],
        })
    return records


def write(name, features, *, crs=True):
    collection = {"type": "FeatureCollection", "name": name.replace("-", "_"), "features": features}
    if crs:
        collection["crs"] = {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::25832"}}
    out = ASSETS_DIR / f"{name}.geojson"
    out.write_text(json.dumps(collection, ensure_ascii=False), encoding="utf-8")
    print(f"  -> {out.relative_to(PORTAL_DIR)}  ({len(features)})")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--anonym", action="store_true",
                        help="generic names for the funded sites instead of the real facility names")
    args = parser.parse_args()

    by_id = load_services()
    try:
        print("Lade Stadtteilgrenzen und Bevölkerung …")
        polygons = fetch_stadtteile(by_id)
        population = fetch_population(by_id)
        print("Lade geförderte Angebotstypen …")
        offers = collect_offers(by_id, polygons)
        print("Lade Kitas und Schulen …")
        kitas = kita_features(by_id, polygons)
        schools = school_features(by_id, polygons)
    except Exception as exc:                                      # noqa: BLE001
        sys.exit(f"Abbruch: {exc}\n(api.hamburg.de wird nachts ~22-05 Uhr aktualisiert.)")

    sites = build_funded_sites(offers, args.anonym)
    networks = assign_networks(sites)
    funded, lines, traeger = funded_features(networks)
    records = stats_records(funded, population)

    print(f"\n{len(offers)} Angebote -> {len(sites)} Standorte, {len(traeger)} Träger, "
          f"{len(kitas)} Kitas, {len(schools)} Schulen")
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    write(f"{PREFIX}-jugend", [f for f in funded if f["properties"]["kategorie"] == "Jugend"])
    write(f"{PREFIX}-familie", [f for f in funded if f["properties"]["kategorie"] == "Familie"])
    write(f"{PREFIX}-kitas", kitas)
    write(f"{PREFIX}-schulen", schools)
    write(f"{PREFIX}-traegernetz", lines)
    write(f"{PREFIX}-stadtteile",
          [{"type": "Feature", "geometry": None, "properties": r} for r in records], crs=False)

    print("\nTräger mit mehreren Standorten:")
    for t in traeger:
        if len(t["sites"]) > 1:
            where = Counter(s["stadtteil"] for s in t["sites"])
            print(f"  {t['id']} {t['name']:<44} {len(t['sites'])} Standorte "
                  f"{t['total']:>10,} €  Sitz {t['main']['stadtteil']:<15} {dict(where)}")

    print(f"\n{'Stadtteil':<16}{'Zahladresse':>14}{'Wirkungsort':>14}{'Saldo':>12}{'€/u18':>8}"
          f"{'Besuche/Wo':>12}{'Std/Wo':>8}")
    for r in records:
        print(f"{r['stadtteil']:<16}{r['demo_foerd_zahladresse_eur']:>14,}{r['demo_foerd_wirkungsort_eur']:>14,}"
              f"{r['demo_foerd_saldo_eur']:>12,}{r['demo_foerd_je_u18_eur'] or 0:>8}"
              f"{r['demo_besuche_woche']:>12,}{r['demo_oeffnungsstunden_woche']:>8}")


if __name__ == "__main__":
    main()
