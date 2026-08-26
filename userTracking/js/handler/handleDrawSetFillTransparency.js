import {trackDrawToolEventDebounced} from "../util";

/**
 * Tracks changing a shape's fill transparency, debounced (500 ms) to avoid tracking every intermediate value.
 * Triggered by: Moving the fill-transparency/opacity slider in the Draw tool.
 * @param {Object} params The parameter object.
 * @param {Boolean} params.isOuter Whether the outer shape's fill transparency (true) or the inner/main shape's fill transparency (false) was changed.
 * @param {Number} params.value The new fill transparency percentage.
 * @param {String} [params.version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetFillTransparency ({isOuter, value, version}) {
    const funcName = "handleDrawSetFillTransparency";

    trackDrawToolEventDebounced(
        `Changed${isOuter ? " outer " : " "}fill transparency`,
        {funcName, value, version}
    );
}
