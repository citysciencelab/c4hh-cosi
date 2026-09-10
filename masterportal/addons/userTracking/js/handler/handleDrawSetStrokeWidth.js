import {trackDrawToolEventDebounced} from "../util";

/**
 * Tracks changing a shape's stroke width, debounced (500 ms) to avoid tracking every intermediate value.
 * Triggered by: Changing the stroke-width input in the Draw tool.
 * @param {Object} params The parameter object.
 * @param {Boolean} params.isOuter Whether the outer shape's stroke width (true) or the inner/main shape's stroke width (false) was changed.
 * @param {Number} params.value The new stroke width.
 * @param {String} [params.version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetStrokeWidth ({isOuter, value, version}) {
    const funcName = "handleDrawSetStrokeWidth";

    trackDrawToolEventDebounced(
        `Changed${isOuter ? " outer " : " "}stroke width`,
        {funcName, value, version}
    );
}
