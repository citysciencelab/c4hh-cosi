/**
 * Classification maths and colour palettes of the LayerStyler. Port of c4hh-app
 * `shared/classify.ts` (same ramps, same palette "Standard", same rules), without
 * simple-statistics: natural breaks (Jenks) is computed here on a sample.
 */

export const COLOR_RAMPS = {
    viridis: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
    plasma: ["#0d0887", "#7e03a8", "#cc4778", "#f89540", "#f0f921"],
    reds: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
    blues: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
    greens: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
    oranges: ["#feedde", "#fdbe85", "#fd8d3c", "#e6550d", "#a63603"],
    rdylbu: ["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"],
    spectral: ["#d53e4f", "#fdae61", "#ffffbf", "#abdda4", "#3288bd"]
};

export const RAMP_LABELS = {
    viridis: "Viridis",
    plasma: "Plasma",
    reds: "Rot",
    blues: "Blau",
    greens: "Grün",
    oranges: "Orange",
    rdylbu: "Rot–Gelb–Blau (divergierend)",
    spectral: "Spectral"
};

export const METHOD_LABELS = {
    jenks: "Natürliche Brüche",
    quantile: "Gleich viele je Klasse",
    equalInterval: "Gleich breite Klassen",
    stddev: "Standardabweichung"
};

/**
 * Palette "Standard" of c4hh-app (STIL-1): 24 colours, chosen for the largest
 * smallest CIEDE2000 distance, all colourful, readable on a light base map.
 * NOT to be re-ordered: maps colour by position.
 */
export const STANDARD_PALETTE = [
    "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#5a3c00",
    "#960f3c", "#00b4d2", "#a5b41e", "#b496ff", "#004b2d", "#a52d00", "#87783c", "#e100e1",
    "#780078", "#f01e4b", "#1e3c69", "#965a87", "#008787", "#4b5a00", "#1ec300", "#b46900"
];

/** The grey of "Sonstige" (values beyond the palette). */
export const OTHER_COLOR = "#c9ccd1";
export const OTHER_LABEL = "Sonstige";
/** The grey of features without a value. */
export const NULL_COLOR = "#e5e5e5";
export const NULL_LABEL = "ohne Wert";

/** Jenks is quadratic: it runs on at most this many (evenly picked) sorted values. */
const JENKS_SAMPLE = 1000;

/**
 * Numeric order when both parse as numbers, else lexical (de).
 * @param {String} a First value.
 * @param {String} b Second value.
 * @returns {Number} Sort order.
 */
export function numOrLexical (a, b) {
    const na = Number(a),
        nb = Number(b);

    if (Number.isFinite(na) && Number.isFinite(nb)) {
        return na - nb;
    }
    return String(a).localeCompare(String(b), "de");
}

/**
 * "#rrggbb" to [r, g, b].
 * @param {String} hex The colour.
 * @returns {Number[]} The channels.
 */
function hexToRgb (hex) {
    const h = hex.replace("#", "");

    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * [r, g, b] to "#rrggbb".
 * @param {Number} r Red.
 * @param {Number} g Green.
 * @param {Number} b Blue.
 * @returns {String} The colour.
 */
function rgbToHex (r, g, b) {
    return "#" + [r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
}

/**
 * A colour with an alpha. Understands #rgb, #rrggbb(aa), rgb() and rgba(); anything
 * else comes back unchanged.
 * @param {String} color The colour.
 * @param {Number} alpha Alpha 0–1.
 * @returns {String} "rgba(…)".
 */
export function colorWithAlpha (color, alpha) {
    const c = String(color ?? "").trim();

    if (c.startsWith("#")) {
        const h = c.slice(1),
            full = h.length === 3 || h.length === 4 ? h.slice(0, 3).split("").map(ch => ch + ch).join("") : h.slice(0, 6);

        if (!(/^[0-9a-f]{6}$/i).test(full)) {
            return color;
        }
        const [r, g, b] = hexToRgb(full);

        return `rgba(${r},${g},${b},${alpha})`;
    }
    const m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);

    return m ? `rgba(${Math.round(Number(m[1]))},${Math.round(Number(m[2]))},${Math.round(Number(m[3]))},${alpha})` : color;
}

/**
 * A colour between the stops of a ramp.
 * @param {String[]} ramp Stops.
 * @param {Number} t Position 0–1.
 * @returns {String} "#rrggbb".
 */
function sampleRamp (ramp, t) {
    const n = ramp.length - 1,
        idx = Math.min(Math.floor(t * n), n - 1),
        f = t * n - idx,
        a = hexToRgb(ramp[idx]),
        b = hexToRgb(ramp[idx + 1]);

    return rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
}

/**
 * The stops of a ramp key (unknown keys: Viridis).
 * @param {String} key Ramp key.
 * @returns {String[]} The stops.
 */
export function rampStops (key) {
    return COLOR_RAMPS[key] ?? COLOR_RAMPS.viridis;
}

/**
 * n colours along a ramp.
 * @param {String} key Ramp key.
 * @param {Number} n How many.
 * @param {Boolean} [reversed=false] Dark to light instead.
 * @returns {String[]} The colours.
 */
export function expandRamp (key, n, reversed = false) {
    const ramp = rampStops(key),
        colors = n <= 1
            ? [ramp[Math.floor(ramp.length / 2)]]
            : Array.from({length: n}, (_, i) => sampleRamp(ramp, i / (n - 1)));

    return reversed ? colors.slice().reverse() : colors;
}

/**
 * One Jenks step: a class starting at i3 improves the k-class splits of a prefix.
 * @param {Int32Array} lowerRow Class starts of the prefix.
 * @param {Float64Array} varRow Best variances of the prefix.
 * @param {Float64Array} prevVarRow Best variances of the prefix before i3.
 * @param {Number} v Variance of the class i3 … end.
 * @param {Number} i3 Start of the class (1-based).
 * @param {Number} k Number of classes.
 * @returns {void}
 */
function relax (lowerRow, varRow, prevVarRow, v, i3, k) {
    for (let j = 2; j <= k; j++) {
        if (varRow[j] >= v + prevVarRow[j - 1]) {
            lowerRow[j] = i3;
            varRow[j] = v + prevVarRow[j - 1];
        }
    }
}

/**
 * Upper bounds of natural-breaks classes (Fisher–Jenks, minimal within-class variance).
 * @param {Number[]} sorted Ascending values.
 * @param {Number} k Number of classes.
 * @returns {Number[]} k-1 upper class bounds.
 */
export function jenksBreaks (sorted, k) {
    const n = sorted.length,
        lower = Array.from({length: n + 1}, () => new Int32Array(k + 1)),
        variance = Array.from({length: n + 1}, () => new Float64Array(k + 1).fill(Infinity)),
        breaks = [];

    for (let j = 1; j <= k; j++) {
        lower[1][j] = 1;
        variance[1][j] = 0;
    }
    for (let l = 2; l <= n; l++) {
        let s1 = 0,
            s2 = 0,
            v = 0;

        for (let m = 1; m <= l; m++) {
            const i3 = l - m + 1,
                val = sorted[i3 - 1],
                i4 = i3 - 1;

            s2 += val * val;
            s1 += val;
            v = s2 - s1 * s1 / m;
            if (i4 !== 0) {
                relax(lower[l], variance[l], variance[i4], v, i3, k);
            }
        }
        lower[l][1] = 1;
        variance[l][1] = v;
    }
    let last = n;

    for (let j = k; j >= 2; j--) {
        const id = lower[last][j] - 2;

        breaks.unshift(sorted[Math.max(0, id)]);
        last = lower[last][j] - 1;
    }
    return breaks;
}

/**
 * Evenly picked values of a sorted list (keeps min and max).
 * @param {Number[]} sorted Ascending values.
 * @param {Number} max At most this many.
 * @returns {Number[]} The sample.
 */
function evenSample (sorted, max) {
    if (sorted.length <= max) {
        return sorted;
    }
    return Array.from({length: max}, (_, i) => sorted[Math.round(i * (sorted.length - 1) / (max - 1))]);
}

/**
 * The value at a quantile of a sorted list (linear between neighbours).
 * @param {Number[]} sorted Ascending values.
 * @param {Number} p Quantile 0–1.
 * @returns {Number} The value.
 */
function quantileSorted (sorted, p) {
    const idx = (sorted.length - 1) * p,
        lo = Math.floor(idx),
        hi = Math.ceil(idx);

    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Class bounds of values: k-1 ascending, distinct upper bounds — fewer if the data
 * has fewer distinct values. Null if there is nothing to classify.
 * @param {Number[]} values The values (non-numbers are ignored).
 * @param {String} method "jenks", "quantile", "equalInterval" or "stddev".
 * @param {Number} nClasses Wanted number of classes.
 * @returns {Number[]|null} The bounds.
 */
export function computeBreaks (values, method, nClasses) {
    const sorted = values.filter(v => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);

    if (sorted.length < 2 || nClasses < 2 || sorted[0] === sorted[sorted.length - 1]) {
        return null;
    }
    const min = sorted[0],
        max = sorted[sorted.length - 1],
        distinct = new Set(sorted).size,
        k = Math.min(nClasses, distinct);
    let breaks;

    if (method === "equalInterval") {
        breaks = Array.from({length: k - 1}, (_, i) => min + (max - min) / k * (i + 1));
    }
    else if (method === "quantile") {
        breaks = Array.from({length: k - 1}, (_, i) => quantileSorted(sorted, (i + 1) / k));
    }
    else if (method === "stddev") {
        const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length,
            sd = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / sorted.length),
            half = (k - 1) / 2;

        if (!sd) {
            return null;
        }
        breaks = Array.from({length: k - 1}, (_, i) => mean + sd * (i - half + 0.5)).filter(b => b > min && b < max);
    }
    else {
        breaks = jenksBreaks(evenSample(sorted, JENKS_SAMPLE), k);
    }
    // distinct, inside the range: no empty or doubled class
    const clean = [...new Set(breaks)].filter(b => b >= min && b < max).sort((a, b) => a - b);

    return clean.length ? clean : null;
}

/**
 * The class of a value: 0 … breaks.length, or -1 for a non-number.
 * @param {*} value The value.
 * @param {Number[]} breaks Upper class bounds.
 * @returns {Number} The class index.
 */
export function classOf (value, breaks) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return -1;
    }
    for (let i = 0; i < breaks.length; i++) {
        if (value <= breaks[i]) {
            return i;
        }
    }
    return breaks.length;
}

/**
 * A class bound for people: whole numbers without decimals, else up to two.
 * @param {Number} v The bound.
 * @returns {String} The text.
 */
export function fmtBreak (v) {
    if (!Number.isFinite(v)) {
        return String(v);
    }
    if (Math.abs(v) >= 1000 || Number.isInteger(v)) {
        return v.toLocaleString("de-DE", {maximumFractionDigits: 0, useGrouping: Math.abs(v) >= 10000});
    }
    return v.toLocaleString("de-DE", {minimumFractionDigits: 1, maximumFractionDigits: 2});
}

/**
 * Colours for category values: up to 24 values each get a palette colour by sorted
 * value; beyond that the 23 most frequent ones do and the rest is "Sonstige".
 * Own colours (`colorMap`) win.
 * @param {Map<String, Number>} freq Value → count.
 * @param {Object} [colorMap] Own colours by value.
 * @returns {{colors: Object, otherColor: String|null}} Colour per value and the colour
 *     of the rest (null if every value has one).
 */
export function categoryColors (freq, colorMap = {}) {
    const distinct = [...freq.keys()].sort(numOrLexical),
        n = STANDARD_PALETTE.length,
        colors = {};
    let otherColor = null;

    if (distinct.length <= n) {
        distinct.forEach((v, i) => {
            colors[v] = STANDARD_PALETTE[i];
        });
    }
    else {
        [...freq.entries()]
            .sort((a, b) => b[1] - a[1] || numOrLexical(a[0], b[0]))
            .slice(0, n - 1)
            .forEach(([v], i) => {
                colors[v] = STANDARD_PALETTE[i];
            });
        otherColor = OTHER_COLOR;
    }
    Object.entries(colorMap ?? {}).forEach(([v, c]) => {
        if (freq.has(v)) {
            colors[v] = c;
        }
    });
    return {colors, otherColor};
}
