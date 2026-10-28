import {Circle, Fill, Icon, Stroke, Style, Text} from "ol/style.js";
import {ACCENT_COLOR, CATEGORY_BY_KEY, CLOSED_COLOR, FUNDED_KEYS, glyphUrl, hexToRgb, mixRgb, rgba} from "./categories.js";
import {areaRadius} from "./format.js";
import {openness} from "./openingHours.js";

/**
 * Symbol sizes in px. Funding and reach use area-proportional radii (see areaRadius).
 */
export const RADII = {
    fundingMax: 30,
    fundingMin: 6,
    hoursOpen: 9,
    hoursClosed: 4,
    reachRingMax: 34,
    reachRingMin: 6,
    reachDiscMax: 14,
    reachDiscMin: 4
};

/** Surface ring around marks so they stay legible where they overlap. */
const RING = new Stroke({color: "#ffffff", width: 2});

const cache = new Map();

/**
 * Returns a cached style; creating a fresh ol/style/Circle rasterises a new
 * canvas, which per feature per animation frame would stutter.
 * @param {String} key - Cache key, must cover every input.
 * @param {Function} create - Factory for a cache miss.
 * @returns {module:ol/style/Style} The style.
 */
function cached (key, create) {
    let style = cache.get(key);

    if (!style) {
        style = create();
        cache.set(key, style);
    }
    return style;
}

/**
 * Rounds to a step, to keep the cache small while animating.
 * @param {Number} value - The value.
 * @param {Number} step - The step.
 * @returns {Number} The rounded value.
 */
function quantise (value, step) {
    return Math.round(value / step) * step;
}

/**
 * A filled circle.
 * @param {Number} radius - Radius in px.
 * @param {String|null} fill - CSS fill colour.
 * @param {module:ol/style/Stroke|null} stroke - Outline.
 * @param {Number} zIndex - Draw order; smaller symbols on top of larger ones.
 * @returns {module:ol/style/Style} The style.
 */
function circle (radius, fill, stroke, zIndex) {
    const r = quantise(radius, 0.25),
        strokeKey = stroke ? `${stroke.getColor()}/${stroke.getWidth()}` : "-";

    return cached(`c|${r}|${fill}|${strokeKey}|${zIndex}`, () => new Style({
        image: new Circle({
            radius: r,
            fill: fill ? new Fill({color: fill}) : undefined,
            stroke: stroke || undefined
        }),
        zIndex
    }));
}

/**
 * The category pictogram, sized to its circle.
 * @param {String} key - Category key.
 * @param {Number} radius - Radius of the circle underneath.
 * @param {Number} opacity - 0..1.
 * @param {Number} zIndex - Draw order.
 * @returns {module:ol/style/Style} The style.
 */
function glyph (key, radius, opacity, zIndex) {
    const size = quantise(Math.min(radius * 1.15, 15), 0.5),
        alpha = quantise(opacity, 0.1);

    return cached(`g|${key}|${size}|${alpha}|${zIndex}`, () => new Style({
        image: new Icon({
            src: glyphUrl(key),
            width: size,
            height: size,
            opacity: alpha
        }),
        zIndex
    }));
}

/**
 * An outline ring, used for selection.
 * @param {Number} radius - Radius in px.
 * @param {String} color - Stroke colour.
 * @param {Number} width - Stroke width.
 * @param {Number} zIndex - Draw order.
 * @returns {module:ol/style/Style} The style.
 */
function ring (radius, color, width, zIndex) {
    return circle(radius, null, new Stroke({color, width}), zIndex);
}

/**
 * Funding view: Hauptsitz and single sites sized by the money paid to their
 * address; a selected Träger's other sites appear sized by what is spent there,
 * linked to the Hauptsitz with straight lines.
 * @param {module:ol/Feature} feature - Site or link feature.
 * @param {Object} state - View state.
 * @param {String[]} state.categories - Visible funded categories.
 * @param {Boolean} state.showAllNetworks - Show every Träger's sites and links.
 * @param {String|null} state.selectedTraegerId - The selected Träger.
 * @param {Number} state.maxEuro - Value that gets the largest symbol.
 * @returns {module:ol/style/Style[]|null} The styles, null to hide.
 */
export function fundingStyle (feature, {categories, showAllNetworks, selectedTraegerId, maxEuro}) {
    const traegerId = feature.get("traeger_id"),
        selected = Boolean(selectedTraegerId) && traegerId === selectedTraegerId,
        dimmed = Boolean(selectedTraegerId) && !selected;

    if (feature.get("_kind") === "link") {
        const visible = (showAllNetworks || selected)
            && (categories.includes(feature.get("category_from")) || categories.includes(feature.get("category_to")));

        if (!visible) {
            return null;
        }
        return [cached(`l|${selected}|${dimmed}`, () => new Style({
            stroke: new Stroke({
                color: rgba(hexToRgb(ACCENT_COLOR), dimmed ? 0.25 : 0.85),
                width: selected ? 3 : 1.5,
                lineCap: "round"
            }),
            zIndex: 1
        }))];
    }

    const key = feature.get("kategorie"),
        role = feature.get("rolle");

    if (!FUNDED_KEYS.includes(key) || !categories.includes(key) || role === "Standort" && !showAllNetworks && !selected) {
        return null;
    }
    const value = role === "Standort" ? feature.get("foerderung_standort_eur") : feature.get("foerderung_zahlung_eur"),
        radius = areaRadius(value, maxEuro, RADII.fundingMax, RADII.fundingMin),
        color = rgba(hexToRgb(CATEGORY_BY_KEY[key].color), dimmed ? 0.3 : 0.92),
        z = Math.round(1000 - radius * 10),
        styles = [circle(radius, color, RING, z)];

    if (radius >= 8) {
        styles.push(glyph(key, radius, dimmed ? 0.4 : 1, z + 1));
    }
    if (selected && role !== "Standort") {
        styles.push(ring(radius + 4, ACCENT_COLOR, 3, z + 2));
    }
    return styles;
}

/**
 * Opening-hours view: open facilities in their category colour at full size
 * with a glow that flares at opening time; closed ones small and grey.
 * @param {module:ol/Feature} feature - Site feature.
 * @param {Object} state - View state.
 * @param {String[]} state.categories - Visible categories.
 * @param {Number} state.minute - Minute of the week.
 * @param {String|null} state.selectedId - The selected facility.
 * @returns {module:ol/style/Style[]|null} The styles, null to hide.
 */
export function hoursStyle (feature, {categories, minute, selectedId}) {
    const key = feature.get("kategorie");

    if (feature.get("_kind") !== "site" || !categories.includes(key)) {
        return null;
    }
    const category = CATEGORY_BY_KEY[key],
        {level, glow} = openness(feature.get("_intervals"), minute),
        l = quantise(level, 0.05),
        g = quantise(glow, 0.05),
        radius = RADII.hoursClosed + (RADII.hoursOpen - RADII.hoursClosed) * l,
        fill = rgba(mixRgb(CLOSED_COLOR, category.color, l), 0.55 + 0.4 * l),
        z = Math.round(100 + l * 100),
        styles = [];

    if (l > 0) {
        styles.push(circle(radius * (1.5 + 0.9 * g), rgba(hexToRgb(category.color), 0.1 + 0.3 * g), null, 10));
    }
    styles.push(circle(radius, fill, l > 0.5 ? RING : new Stroke({color: "rgba(255,255,255,0.8)", width: 1}), z));
    if (l > 0.35) {
        styles.push(glyph(key, radius, l, z + 1));
    }
    if (selectedId && feature.get("id") === selectedId) {
        styles.push(ring(radius + 4, ACCENT_COLOR, 3, 300));
    }
    return styles;
}

/**
 * Reach view: a solid disc for the funding spent at the site inside a ring for
 * its weekly visits. A wide ring around a small disc = many visits per euro.
 * @param {module:ol/Feature} feature - Site feature.
 * @param {Object} state - View state.
 * @param {String[]} state.categories - Visible funded categories.
 * @param {Number} state.maxVisits - Visits that get the largest ring.
 * @param {Number} state.maxEuro - Funding that gets the largest disc.
 * @param {String|null} state.selectedId - The selected site.
 * @returns {module:ol/style/Style[]|null} The styles, null to hide.
 */
export function reachStyle (feature, {categories, maxVisits, maxEuro, selectedId}) {
    const key = feature.get("kategorie");

    if (feature.get("_kind") !== "site" || !FUNDED_KEYS.includes(key) || !categories.includes(key)) {
        return null;
    }
    const rgb = hexToRgb(CATEGORY_BY_KEY[key].color),
        selected = selectedId && feature.get("id") === selectedId,
        dimmed = selectedId && !selected,
        ringRadius = areaRadius(feature.get("besuche_woche"), maxVisits, RADII.reachRingMax, RADII.reachRingMin),
        discRadius = areaRadius(feature.get("foerderung_standort_eur"), maxEuro, RADII.reachDiscMax, RADII.reachDiscMin),
        zRing = Math.round(500 - ringRadius * 10),
        zDisc = Math.round(1000 - discRadius * 10),
        styles = [
            circle(ringRadius, rgba(rgb, dimmed ? 0.05 : 0.14), new Stroke({color: rgba(rgb, dimmed ? 0.3 : 0.9), width: 2}), zRing),
            circle(discRadius, rgba(rgb, dimmed ? 0.3 : 1), RING, zDisc)
        ];

    // A ring smaller than its disc would vanish underneath — draw its edge on top.
    if (ringRadius < discRadius + 2) {
        styles.push(ring(ringRadius, "rgba(255,255,255,0.9)", 1.5, zDisc + 2));
    }
    if (discRadius >= 7) {
        styles.push(glyph(key, discRadius, dimmed ? 0.4 : 1, zDisc + 1));
    }
    if (selected) {
        styles.push(ring(ringRadius + 4, ACCENT_COLOR, 3, 2000));
    }
    return styles;
}

/**
 * Stadtteil outlines with an optional colour fill and a name label.
 * @param {module:ol/Feature} feature - District feature.
 * @param {Object} state - View state.
 * @param {Function|null} state.fillFor - Value colouring, null for outlines only.
 * @param {String|null} state.selectedName - The highlighted district.
 * @returns {module:ol/style/Style[]} The styles.
 */
export function districtStyle (feature, {fillFor, selectedName}) {
    const name = feature.get("stadtteil"),
        selected = name === selectedName,
        fill = fillFor ? fillFor(feature.getProperties()) : null;

    return [
        new Style({
            fill: new Fill({color: fill ? rgba(hexToRgb(fill), 0.55) : "rgba(255,255,255,0.01)"}),
            stroke: new Stroke({color: rgba(hexToRgb(ACCENT_COLOR), 0.9), width: selected ? 4 : 2}),
            zIndex: 0
        }),
        new Style({
            geometry: feature.get("_labelPoint"),
            text: new Text({
                text: name,
                font: "600 13px sans-serif",
                fill: new Fill({color: "#0b0b0b"}),
                stroke: new Stroke({color: "#ffffff", width: 3})
            }),
            zIndex: 1
        })
    ];
}

const DIVERGING = {
    strongOut: "#e34948",
    lightOut: "#f0a3a2",
    neutral: "#f0efec",
    lightIn: "#9ec5f4",
    strongIn: "#2a78d6"
};
const SEQUENTIAL = ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#1c5cab"];

/**
 * Diverging class for a value relative to the largest absolute value.
 * @param {Number} t - Value / max |value|, in [-1, 1].
 * @returns {String} The fill colour.
 */
function divergingColor (t) {
    if (Math.abs(t) < 0.15) {
        return DIVERGING.neutral;
    }
    if (t > 0) {
        return t < 0.6 ? DIVERGING.lightIn : DIVERGING.strongIn;
    }
    return t > -0.6 ? DIVERGING.lightOut : DIVERGING.strongOut;
}

/**
 * Colouring for the district fill and its legend.
 *
 * saldo   diverging blue (more spent here than paid here) <-> red (money is paid
 *         to addresses here but spent elsewhere), grey midpoint for near zero.
 * perU18  sequential blue, five equal classes between the lowest and highest value.
 *
 * @param {String} mode - "none", "saldo" or "perU18".
 * @param {Object[]} rows - District attribute rows.
 * @param {Function} formatValue - Formats a class boundary for the legend.
 * @returns {{fillFor: Function|null, legend: Array<{color: String, label: String}>}} Colouring and legend.
 */
export function districtColoring (mode, rows, formatValue) {
    if (mode === "saldo") {
        const field = "demo_foerd_saldo_eur",
            maxAbs = Math.max(...rows.map(row => Math.abs(row[field] || 0))) || 1;

        return {
            fillFor: properties => divergingColor((properties[field] || 0) / maxAbs),
            legend: [
                {color: DIVERGING.strongOut, label: `≤ −${formatValue(maxAbs * 0.6)}`},
                {color: DIVERGING.lightOut, label: `−${formatValue(maxAbs * 0.15)} … −${formatValue(maxAbs * 0.6)}`},
                {color: DIVERGING.neutral, label: `± ${formatValue(maxAbs * 0.15)}`},
                {color: DIVERGING.lightIn, label: `+${formatValue(maxAbs * 0.15)} … +${formatValue(maxAbs * 0.6)}`},
                {color: DIVERGING.strongIn, label: `≥ +${formatValue(maxAbs * 0.6)}`}
            ]
        };
    }
    if (mode === "perU18") {
        const field = "demo_foerd_je_u18_eur",
            values = rows.map(row => row[field]).filter(value => typeof value === "number"),
            min = Math.min(...values),
            max = Math.max(...values),
            width = (max - min) / SEQUENTIAL.length || 1;

        return {
            fillFor: properties => typeof properties[field] === "number"
                ? SEQUENTIAL[Math.min(SEQUENTIAL.length - 1, Math.floor((properties[field] - min) / width))]
                : null,
            legend: SEQUENTIAL.map((color, i) => ({
                color,
                label: `${formatValue(min + i * width)} – ${formatValue(min + (i + 1) * width)}`
            }))
        };
    }
    return {fillFor: null, legend: []};
}
