import {trackDrawToolEventDebounced} from "../util.js";

const propertyLabels = {
    fillColor: "fill-color",
    fillTransparency: "fill transparency",
    font: "font",
    fontSize: "font size",
    iconScale: "icon scale",
    pointSize: "point size",
    strokeColor: "stroke-color",
    strokeTransparency: "stroke transparency",
    strokeWidth: "stroke width",
    text: "text"
};

/**
 * Tracks changing a style property of an already drawn feature, debounced (500 ms) to avoid tracking every intermediate value.
 * Triggered by: Changing a style property of a selected feature in the Draw tool's edit mode.
 * @param {Object} payload The action payload.
 * @param {String} payload.key The changed style property, e.g. "strokeWidth".
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawEditFeatureStyle (payload, version) {
    const label = propertyLabels[payload?.key];

    if (!label) {
        return;
    }

    trackDrawToolEventDebounced(
        `Changed ${label} of drawn feature`,
        {funcName: `handleDrawEditFeatureStyle (${payload.key})`, version}
    );
}
