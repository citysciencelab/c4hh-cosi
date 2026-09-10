import {trackDrawToolEvent} from "../util";

/**
 * Tracks changing the active interaction (e.g. draw, edit, delete) in the Draw tool.
 * Triggered by: Toggling an interaction button in the Draw tool.
 * @param {String} interaction The interaction that was activated.
 * @param {String} [version] The draw tool version (e.g. "2026"); undefined for the legacy tool.
 * @returns {void}
 */
export function handleDrawSetInteraction (interaction, version) {
    const funcName = "handleDrawSetInteraction";

    trackDrawToolEvent(`Changed interaction to: ${interaction}`, {funcName, version});
}
