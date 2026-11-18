/**
 * State of the LayerFilter tool.
 * @typedef {Object} LayerFilterState
 * @property {Boolean} active Whether the tool is open.
 * @property {String} id Tool id.
 * @property {String} name Name in the menu (config-param).
 * @property {String} icon Bootstrap icon (config-param).
 * @property {String} description Description in the menu (config-param).
 * @property {Object} filters Active filters by layer id:
 *     {spec, missMode: "dim"|"hide", matched, total, layerName}
 */
const state = {
    active: false,
    id: "layerFilter",
    name: "additional:modules.cosi.layerFilter.title",
    icon: "bi-funnel",
    description: "additional:modules.cosi.layerFilter.description",
    hasMouseMapInteractions: false,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    type: "layerFilter",
    filters: {}
};

export default state;
