import {handleDrawInteraction} from "./handleDrawInteraction.js";

/**
 * Tracks a completed drawing action in the old Draw tool.
 * Triggered by: Completing a drawing action in the old Draw tool.
 * Ignores drawDoubleCircle actions until both radii have been set.
 * Also ignores secondary interactions (double circle).
 * @param {String} payload The action payload.
 * @param {Object} store The vuex store.
 * @returns {void}
 */
export function handleDrawInteractionOld (payload, store) {
    if (typeof payload === "string" && payload.toLowerCase() === "two") {
        return;
    }

    const drawState = store.state.Modules.Draw_old;

    if (
        drawState.drawType.id === "drawDoubleCircle" && (
            drawState.drawDoubleCircleSettings.circleRadius < 1
            || drawState.drawDoubleCircleSettings.circleOuterRadius < 1
        )
    ) {
        return;
    }

    handleDrawInteraction();
}
