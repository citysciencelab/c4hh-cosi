import {trackDrawToolEventDebounced} from "../util";

/**
 * Tracks changing a fill or stroke color, debounced (500 ms) to avoid tracking every intermediate value.
 * Triggered by: Changing a color picker in the Draw tool.
 * @param {Object} params The parameter object.
 * @param {Boolean} params.isOuter Whether the outer shape's color (true) or the inner/main shape's color (false) was changed.
 * @param {String} params.type The kind of color changed ("fill" or "stroke").
 * @param {Number} params.value The new color, packed as a single RGB integer.
 * @param {String} [params.version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetColor ({isOuter, type, value, version}) {
    const funcName = "handleDrawSetColor";

    trackDrawToolEventDebounced(
        `Changed${isOuter ? " outer " : " "}${type}-color`,
        {funcName, value, version}
    );
}
