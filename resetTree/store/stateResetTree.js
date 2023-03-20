/**
 * User type definition
 * @typedef {object} ResetTreeState
 * @property {boolean} active if true, ResetTree will rendered
 * @property {string} id id of the ResetTree component
 * @property {string} name displayed as title (config-param)
 * @property {string} glyphicon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 */
const state = {
    active: false,
    id: "ResetTree",
    // defaults for config.json parameters
    name: "Simple Reset Tree",
    icon: "bi-arrow-repeat",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true
};

export default state;
