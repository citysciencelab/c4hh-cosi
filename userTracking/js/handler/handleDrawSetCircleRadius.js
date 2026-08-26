import {trackDrawToolEventDebounced} from "../util";

/**
 * Tracks changing a circle's radius, debounced (500 ms) to avoid tracking every intermediate value.
 * Triggered by: Changing the inner or outer circle radius input in the Draw tool.
 * @param {Object} params The parameter object.
 * @param {Boolean} params.isOuter Whether the outer circle's radius (true) or the inner circle's radius (false) was changed.
 * @param {Number} params.value The new radius value.
 * @param {String} [params.version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetCircleRadius ({isOuter, value, version}) {
    const funcName = "handleDrawSetCircleRadius";

    trackDrawToolEventDebounced(
        `Changed${isOuter ? " outer " : " "}circle-radius`,
        {funcName, value, version}
    );
}
