/**
 * The style spec of the LayerStyler and its resolution against the loaded features.
 * The spec only holds the CHOICES ("colour by Schüleranzahl, 5 natural-breaks classes,
 * ramp Blau"); breaks, colours per value and the size range are derived from the
 * data each time it changes (c4hh-app ADR-027 §1: controls-only specs).
 *
 *   {
 *     mode: "single" | "classes" | "categories",
 *     color,                                     // "single"
 *     classification: {attr, method, nClasses, ramp, reversed},
 *     categories: {attr, colorMap},              // own colour per value
 *     fillOpacity,                               // 0–1, areas and point symbols
 *     stroke: {mode: "same" | "color" | "none", color, width},
 *     point: {radius, sizeAttr, min, max},       // size by a numeric attribute
 *     lineWidth
 *   }
 */
import {toNumber, valueList, isEmptyValue} from "../../LayerFilter/utils/filterSpec.js";
import {
    STANDARD_PALETTE, NULL_COLOR, NULL_LABEL, OTHER_LABEL,
    categoryColors, classOf, computeBreaks, expandRamp, fmtBreak, numOrLexical
} from "./classify.js";

/** How many features are looked at to tell the geometry kind of a layer. */
const GEOM_SAMPLE = 200;

/**
 * The geometry kind of a geometry.
 * @param {module:ol/geom/Geometry} geom The geometry.
 * @returns {String|null} "point", "line", "area" or null.
 */
export function geomKindOf (geom) {
    const type = geom?.getType?.();

    if (type === "Point" || type === "MultiPoint") {
        return "point";
    }
    if (type === "LineString" || type === "MultiLineString") {
        return "line";
    }
    if (type === "Polygon" || type === "MultiPolygon" || type === "Circle") {
        return "area";
    }
    if (type === "GeometryCollection") {
        return geomKindOf(geom.getGeometries()[0]);
    }
    return null;
}

/**
 * The geometry kind of a layer, from a sample of its features.
 * @param {module:ol/Feature[]} features The features.
 * @returns {String} "point", "line", "area" or "mixed" ("area" if empty).
 */
export function layerGeomKind (features) {
    const kinds = new Set();

    features.slice(0, GEOM_SAMPLE).forEach(f => {
        const k = geomKindOf(f.getGeometry());

        if (k) {
            kinds.add(k);
        }
    });
    if (kinds.size > 1) {
        return "mixed";
    }
    return kinds.values().next().value ?? "area";
}

/**
 * A fresh spec for a layer of a geometry kind.
 * @param {String} geomKind "point", "line", "area" or "mixed".
 * @returns {Object} The spec.
 */
export function newStyleSpec (geomKind) {
    const point = geomKind === "point";

    return {
        mode: "single",
        color: STANDARD_PALETTE[0],
        classification: {attr: null, method: "jenks", nClasses: 5, ramp: "blues", reversed: false},
        categories: {attr: null, colorMap: {}},
        fillOpacity: point ? 0.9 : 0.6,
        stroke: point ? {mode: "color", color: "#ffffff", width: 1.5} : {mode: "same", color: "#333333", width: 1},
        point: {radius: 6, sizeAttr: null, min: 4, max: 20},
        lineWidth: 2
    };
}

/**
 * The category of a raw value: the value itself, the FIRST of several
 * ("Grundschule|Stadtteilschule"), or null if empty.
 * @param {*} raw The raw value.
 * @returns {String|null} The category.
 */
export function categoryKey (raw) {
    const list = valueList(raw);

    return list.length ? String(list[0]) : null;
}

/**
 * Whether the spec's colour attribute is chosen (else the mode falls back to one colour).
 * @param {Object} spec The spec.
 * @returns {Boolean} True if "classes"/"categories" has an attribute.
 */
function hasColorAttr (spec) {
    if (spec.mode === "classes") {
        return Boolean(spec.classification?.attr);
    }
    if (spec.mode === "categories") {
        return Boolean(spec.categories?.attr);
    }
    return false;
}

/**
 * The range of a class in words. For whole numbers the classes do not touch
 * ("5", "6 – 7", "8 – 10"), else they share their bounds ("0,5 – 1,2").
 * @param {Number} i Class index.
 * @param {Number[]} breaks Upper class bounds.
 * @param {Number} min Smallest value.
 * @param {Number} max Largest value.
 * @param {Boolean} integers Whether all values are whole numbers.
 * @returns {String} The label.
 */
export function classLabel (i, breaks, min, max, integers) {
    let lo = i === 0 ? min : breaks[i - 1];
    const hi = integers && i < breaks.length ? Math.floor(breaks[i]) : breaks[i] ?? max;

    if (integers && i > 0) {
        lo = Math.floor(lo) + 1;
    }
    return lo === hi ? fmtBreak(lo) : `${fmtBreak(lo)} – ${fmtBreak(hi)}`;
}

/**
 * Resolves the colours of a "classes" spec.
 * @param {Object} cls The classification part.
 * @param {module:ol/Feature[]} features The features.
 * @returns {Object} {colorOf, legend, nullCount}
 */
function resolveClasses (cls, features) {
    const values = features.map(f => toNumber(f.get(cls.attr))),
        numbers = values.filter(Number.isFinite),
        breaks = computeBreaks(numbers, cls.method, cls.nClasses) ?? [],
        colors = expandRamp(cls.ramp, breaks.length + 1, cls.reversed),
        counts = new Array(breaks.length + 1).fill(0),
        classIndex = new WeakMap();
    let nullCount = 0,
        min = Infinity,
        max = -Infinity;

    numbers.forEach(v => {
        min = Math.min(min, v);
        max = Math.max(max, v);
    });
    const integers = numbers.every(Number.isInteger);

    features.forEach((f, i) => {
        const c = Number.isFinite(values[i]) ? classOf(values[i], breaks) : -1;

        classIndex.set(f, c);
        if (c < 0) {
            nullCount++;
        }
        else {
            counts[c]++;
        }
    });

    return {
        colorOf: f => {
            let c = classIndex.get(f);

            if (c === undefined) {
                // a feature loaded after the resolution: same breaks
                const v = toNumber(f.get(cls.attr));

                c = Number.isFinite(v) ? classOf(v, breaks) : -1;
            }
            return c < 0 ? NULL_COLOR : colors[c];
        },
        legend: numbers.length ? colors.map((color, i) => ({color, label: classLabel(i, breaks, min, max, integers), count: counts[i]})) : [],
        nullCount
    };
}

/**
 * Resolves the colours of a "categories" spec.
 * @param {Object} cat The categories part.
 * @param {module:ol/Feature[]} features The features.
 * @returns {Object} {colorOf, legend, nullCount, multi}
 */
function resolveCategories (cat, features) {
    const freq = new Map(),
        keyOf = new WeakMap();
    let nullCount = 0,
        multi = false;

    features.forEach(f => {
        const raw = f.get(cat.attr),
            key = categoryKey(raw);

        keyOf.set(f, key);
        if (key === null) {
            nullCount++;
            return;
        }
        if (!multi && typeof raw === "string" && raw.includes("|")) {
            multi = true;
        }
        freq.set(key, (freq.get(key) ?? 0) + 1);
    });
    const {colors, otherColor} = categoryColors(freq, cat.colorMap),
        legend = [...freq.keys()]
            .filter(v => colors[v])
            .sort(numOrLexical)
            .map(v => ({color: colors[v], label: v, value: v, count: freq.get(v)})),
        otherCount = [...freq.entries()].filter(([v]) => !colors[v]).reduce((a, [, n]) => a + n, 0);

    if (otherCount) {
        legend.push({color: otherColor, label: OTHER_LABEL, count: otherCount, other: true});
    }

    return {
        colorOf: f => {
            const key = keyOf.has(f) ? keyOf.get(f) : categoryKey(f.get(cat.attr));

            if (key === null) {
                return NULL_COLOR;
            }
            return colors[key] ?? otherColor ?? NULL_COLOR;
        },
        legend,
        nullCount,
        multi
    };
}

/**
 * The point radius per feature: fixed, or square-root scaled by a numeric attribute
 * between min and max (a symbol is read by its AREA — c4hh-app `pointRadiusFor`).
 * @param {Object} point The point part of the spec.
 * @param {module:ol/Feature[]} features The features.
 * @returns {{radiusOf: Function, domain: Number[]|null}} Radius function and value range.
 */
function resolveRadius (point, features) {
    if (!point.sizeAttr) {
        return {radiusOf: () => point.radius, domain: null};
    }
    let lo = Infinity,
        hi = -Infinity;

    features.forEach(f => {
        const v = toNumber(f.get(point.sizeAttr));

        if (Number.isFinite(v)) {
            lo = Math.min(lo, v);
            hi = Math.max(hi, v);
        }
    });
    if (!(hi >= lo)) {
        return {radiusOf: () => point.min, domain: null};
    }
    return {
        radiusOf: f => {
            const v = toNumber(f.get(point.sizeAttr));

            if (!Number.isFinite(v) || !(hi > lo)) {
                return point.min;
            }
            const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));

            return point.min + Math.sqrt(t) * (point.max - point.min);
        },
        domain: [lo, hi]
    };
}

/**
 * Resolves a spec against the features of a layer.
 * @param {Object} spec The spec.
 * @param {module:ol/Feature[]} features All features of the layer.
 * @param {String} [singleLabel="alle Objekte"] Legend text of "single".
 * @returns {Object} {colorOf(feature), radiusOf(feature), legend: [{color, label, count}],
 *     sizeDomain, multi}
 */
export function resolveStyle (spec, features, singleLabel = "alle Objekte") {
    let colors;

    if (spec.mode === "classes" && hasColorAttr(spec)) {
        colors = resolveClasses(spec.classification, features);
    }
    else if (spec.mode === "categories" && hasColorAttr(spec)) {
        colors = resolveCategories(spec.categories, features);
    }
    else {
        colors = {
            colorOf: () => spec.color,
            legend: [{color: spec.color, label: singleLabel, count: features.length}],
            nullCount: 0
        };
    }
    const legend = colors.legend.slice(),
        {radiusOf, domain} = resolveRadius(spec.point, features);

    if (colors.nullCount) {
        legend.push({color: NULL_COLOR, label: NULL_LABEL, count: colors.nullCount, none: true});
    }
    return {colorOf: colors.colorOf, radiusOf, legend, sizeDomain: domain, multi: Boolean(colors.multi)};
}

/**
 * The attributes a spec reads (to tell whether it still fits a layer).
 * @param {Object} spec The spec.
 * @returns {String[]} Attribute names.
 */
export function styleSpecAttrs (spec) {
    return [
        spec.mode === "classes" ? spec.classification?.attr : null,
        spec.mode === "categories" ? spec.categories?.attr : null,
        spec.point?.sizeAttr
    ].filter(a => !isEmptyValue(a));
}
