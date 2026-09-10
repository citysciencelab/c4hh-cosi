import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the method used to draw a circle or square (e.g. defined vs. interactive).
 * Triggered by: Changing the circle- or square-method dropdown in the Draw tool.
 * @param {Object} params The parameter object.
 * @param {String} params.method The method that was selected.
 * @param {String} params.shape The shape the method applies to ("circle" or "square").
 * @param {String} [params.version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetShapeMethod ({method, shape, version}) {
    const funcName = "handleDrawSetShapeMethod";

    trackDrawToolEvent(`Changed ${shape}-method to: ${method}`, {funcName, version});
}
