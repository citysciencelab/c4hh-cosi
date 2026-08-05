/**
 * MP-15: OAF Styles Rendering — Layer-Rendering nach dem StyleSpec des Backends.
 *
 * Port of c4hh-app's style rendering logic:
 * - app/components/AppMap.client.vue:315-415 (makeStaticStyle, DIM_STYLE, makeStyleFn)
 * - app/utils/classify.ts:38-41 (hexWithAlpha), 104-110 (classOf)
 * - shared/types/index.ts:97-137 (StyleSpec shapes)
 *
 * Source files (2026-07-22, c4hh-app dev):
 *   /home/paul/Dokumente/c4hh-app/app/components/AppMap.client.vue
 *   /home/paul/Dokumente/c4hh-app/shared/classify.ts
 *   /home/paul/Dokumente/c4hh-app/shared/types/index.ts
 */

import {Style, Fill, Stroke, Circle as CircleStyle, Icon} from "ol/style.js";

/**
 * Hex colour to rgba string with alpha.
 * Source: c4hh-app/shared/classify.ts:38-41
 * @param {string} hex - hex colour like "#3b82f6"
 * @param {number} alpha - opacity 0-1
 * @returns {string} rgba string
 */
function hexWithAlpha (hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Returns the classification index for a value against breaks.
 * Source: c4hh-app/shared/classify.ts:104-110
 * @param {unknown} value - the feature property value
 * @param {number[]} breaks - sorted array of break values
 * @returns {number} index in [0, breaks.length] or -1 if value is not a finite number
 */
function classOf (value, breaks) {
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

// DATA-7/DATA-23: strokeWidth 0 = no outline at all (an OL width-0 stroke
// still draws a hairline).
const DIM_STYLE = new Style({
    fill: new Fill({color: "rgba(180,180,180,0.10)"}),
    stroke: new Stroke({color: "rgba(120,120,120,0.45)", width: 0.6}),
    image: new CircleStyle({radius: 3, fill: new Fill({color: "rgba(180,180,180,0.4)"})})
});

/**
 * Builds a static OL style from a StyleSpec (no classification/categories).
 * Source: c4hh-app/app/components/AppMap.client.vue:315-333
 * Defaults EXACT match SPA defaults:
 *   fill rgba(59,130,246,0.20), stroke #3b82f6/1.5, pointRadius 5
 * @param {object} [s] - StyleSpec (fillColor, strokeColor, strokeWidth, pointRadius, icon)
 * @returns {Style} OL Style
 */
function makeStaticStyle (s) {
    const fillColor = s?.fillColor ?? "rgba(59,130,246,0.20)";
    const strokeColor = s?.strokeColor ?? "#3b82f6";
    const strokeWidth = s?.strokeWidth ?? 1.5;
    const pointRadius = s?.pointRadius ?? 5;

    // icon.url supported; icon.builtin NOT supported (Icebox: port curated
    // set from app/utils/mapIcons.ts). Fallback to circle if no url.
    if (s?.icon) {
        const src = s.icon.url;

        if (src) {
            return new Style({
                image: new Icon({
                    src,
                    scale: s.icon.scale ?? 1,
                    anchor: s.icon.anchor ?? [0.5, 0.5]
                })
            });
        }
    }

    // strokeWidth 0 = no stroke at all
    const strokeStyle = strokeWidth > 0 ? new Stroke({color: strokeColor, width: strokeWidth}) : undefined;

    return new Style({
        fill: new Fill({color: fillColor}),
        stroke: strokeStyle,
        image: new CircleStyle({
            radius: pointRadius,
            fill: new Fill({color: fillColor}),
            stroke: strokeStyle
        })
    });
}

/**
 * Builds an OL style function from a resolved StyleSpec.
 * Port of c4hh-app/app/components/AppMap.client.vue:349-415 (makeStyleFn)
 * minus filterPred and spatial branches (addon has no filters).
 *
 * Attribute-styled polygons drop the per-feature outline (stroke) — it
 * clutters dense choropleths. The point stroke stays on the image style.
 *
 * Defaults for attribute branches EXACT match SPA:
 *   opacity 0.7, pointRadius 4, strokeWidth 1
 *
 * @param {object} spec - resolved StyleSpec with classification or categories
 * @returns {Function} OL style function (feature => Style | Style[] | undefined)
 */
function buildStyleFor (spec) {
    // Controls-only specs render static until resolved; unresolved
    // classification/categories => static fallback (same as AppMap).
    const cls = spec.classification?.breaks?.length && spec.classification?.colors?.length
        ? spec.classification : undefined;
    const cats = spec.categories?.colors ? spec.categories : undefined;

    const baseStrokeColor = spec.strokeColor ?? "#3b82f6";
    const baseStrokeWidth = spec.strokeWidth ?? 1;
    const opacity = spec.opacity ?? 0.7;
    const pointRadius = spec.pointRadius ?? 4;
    const staticStyle = makeStaticStyle(spec);

    // No classification or categories -> static style
    if (!cls && !cats) {
        return () => staticStyle;
    }

    return (feature) => {
        const properties = feature.getProperties ? feature.getProperties() : feature;

        if (cls) {
            const v = properties[cls.attr];
            const idx = classOf(v, cls.breaks);

            if (idx < 0) {
                return DIM_STYLE;
            }
            const color = cls.colors[idx] ?? cls.colors[cls.colors.length - 1] ?? "#3b82f6";
            const fill = new Fill({color: hexWithAlpha(color, opacity)});
            // DATA-7: attribute-styled polygons drop the per-feature outline
            const stroke = new Stroke({color: baseStrokeColor, width: baseStrokeWidth});

            return new Style({
                fill,
                image: new CircleStyle({radius: pointRadius, fill, stroke})
            });
        }

        if (cats) {
            const raw = properties[cats.attr];

            if (raw === null || raw === undefined || raw === "") {
                return DIM_STYLE;
            }
            const norm = cats.valueMap?.[String(raw)] ?? String(raw);
            const color = cats.colors[norm] ?? cats.defaultColor;

            if (!color) {
                return DIM_STYLE;
            }
            const fill = new Fill({color: hexWithAlpha(color, opacity)});
            // DATA-7: attribute-styled polygons drop the per-feature outline
            const stroke = new Stroke({color: baseStrokeColor, width: baseStrokeWidth});

            return new Style({
                fill,
                image: new CircleStyle({radius: pointRadius, fill, stroke})
            });
        }

        return staticStyle;
    };
}

export {buildStyleFor, DIM_STYLE, hexWithAlpha, classOf, makeStaticStyle};
