/**
 * Facility categories: colour, pictogram and whether they are funded.
 *
 * The four colours were checked with the dataviz palette validator for the
 * all-pairs case (any two categories can sit next to each other on a map):
 * worst colour-blind separation ΔE 13.0, worst normal-vision ΔE 24.6. Yellow
 * stays below 3:1 contrast, so every symbol also carries its pictogram and the
 * legend is always visible — colour never identifies a category on its own.
 *
 * Pictograms: Bootstrap Icons 1.13 (MIT), the icon set the portal already uses.
 */

const GLYPHS = {
    // bi-balloon-fill
    Kita: "<path fill-rule=\"evenodd\" d=\"M8.48 10.901C11.211 10.227 13 7.837 13 5A5 5 0 0 0 3 5c0 2.837 1.789 5.227 4.52 5.901l-.244.487a.25.25 0 1 0 .448.224l.04-.08c.009.17.024.315.051.45.068.344.208.622.448 1.102l.013.028c.212.422.182.85.05 1.246-.135.402-.366.751-.534 1.003a.25.25 0 0 0 .416.278l.004-.007c.166-.248.431-.646.588-1.115.16-.479.212-1.051-.076-1.629-.258-.515-.365-.732-.419-1.004a2 2 0 0 1-.037-.289l.008.017a.25.25 0 1 0 .448-.224zM4.352 3.356a4 4 0 0 1 3.15-2.325C7.774.997 8 1.224 8 1.5s-.226.496-.498.542c-.95.162-1.749.78-2.173 1.617a.6.6 0 0 1-.52.341c-.346 0-.599-.329-.457-.644\"/>",
    // bi-mortarboard-fill
    Schule: "<path d=\"M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917z\"/><path d=\"M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466z\"/>",
    // bi-person-arms-up
    Jugend: "<path d=\"M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3\"/><path d=\"m5.93 6.704-.846 8.451a.768.768 0 0 0 1.523.203l.81-4.865a.59.59 0 0 1 1.165 0l.81 4.865a.768.768 0 0 0 1.523-.203l-.845-8.451A1.5 1.5 0 0 1 10.5 5.5L13 2.284a.796.796 0 0 0-1.239-.998L9.634 3.84a.7.7 0 0 1-.33.235c-.23.074-.665.176-1.304.176-.64 0-1.074-.102-1.305-.176a.7.7 0 0 1-.329-.235L4.239 1.286a.796.796 0 0 0-1.24.998l2.5 3.216c.317.316.475.758.43 1.204Z\"/>",
    // bi-house-heart-fill
    Familie: "<path d=\"M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207 1.354 8.853a.5.5 0 1 1-.708-.707z\"/><path d=\"m14 9.293-6-6-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.691 0-5.018\"/>"
};

/**
 * Category definitions in fixed order. Order = legend order; colours follow the
 * category, never its position in a filtered list.
 * `ink` is the pictogram colour inside the filled circle: near-black on yellow,
 * white otherwise.
 * @type {Array<{key: String, color: String, ink: String, funded: Boolean, icon: String}>}
 */
export const CATEGORIES = [
    {key: "Kita", color: "#eda100", ink: "#0b0b0b", funded: false, icon: "bi-balloon-fill"},
    {key: "Schule", color: "#2a78d6", ink: "#ffffff", funded: false, icon: "bi-mortarboard-fill"},
    {key: "Jugend", color: "#008300", ink: "#ffffff", funded: true, icon: "bi-person-arms-up"},
    {key: "Familie", color: "#d55181", ink: "#ffffff", funded: true, icon: "bi-house-heart-fill"}
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map(category => [category.key, category]));

export const FUNDED_KEYS = CATEGORIES.filter(category => category.funded).map(category => category.key);

/** Closed facilities: a neutral grey, outside every category hue. */
export const CLOSED_COLOR = "#a8a69f";

/** Selection, network lines and outlines: the COSI accent. */
export const ACCENT_COLOR = "#3C5F94";

/** Two-series comparison "paid to address" vs "spent at site" (validated pair, both ≥ 3:1). */
export const PAID_COLOR = "#6250d6";
export const SPENT_COLOR = "#eb6834";

/**
 * SVG data URL of a category pictogram in the given colour, for ol/style/Icon.
 * @param {String} key - Category key.
 * @param {String} [color] - Glyph colour, defaults to the category's ink.
 * @returns {String} The data URL.
 */
export function glyphUrl (key, color) {
    const fill = color || CATEGORY_BY_KEY[key]?.ink || "#ffffff",
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" fill="${fill}">${GLYPHS[key] || ""}</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Mixes two hex colours.
 * @param {String} from - Start colour "#rrggbb".
 * @param {String} to - End colour "#rrggbb".
 * @param {Number} t - 0 = from, 1 = to.
 * @returns {Number[]} RGB components.
 */
export function mixRgb (from, to, t) {
    const a = hexToRgb(from),
        b = hexToRgb(to),
        k = Math.min(1, Math.max(0, t));

    return a.map((value, i) => Math.round(value + (b[i] - value) * k));
}

/**
 * Parses "#rrggbb".
 * @param {String} hex - The colour.
 * @returns {Number[]} RGB components.
 */
export function hexToRgb (hex) {
    const value = hex.replace("#", "");

    return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16));
}

/**
 * CSS rgba() string.
 * @param {Number[]} rgb - RGB components.
 * @param {Number} alpha - Opacity 0..1.
 * @returns {String} The colour.
 */
export function rgba (rgb, alpha) {
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}
