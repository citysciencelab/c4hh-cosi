/**
 * User type definition
 * @typedef {object} VueAddonState
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {string} The url of the AIS GeoAnalyze API.
 */
const state = {
    id: "geometryAnalyse",
    // defaults for config.json parameters
    name: "Geometrie Analyse",
    icon: "bi-list-task",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    apiUrl: ""
};

export default state;
