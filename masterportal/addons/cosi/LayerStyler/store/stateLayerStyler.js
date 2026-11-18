/**
 * State of the LayerStyler tool.
 * @typedef {Object} LayerStylerState
 * @property {Boolean} active Whether the tool is open.
 * @property {String} id Tool id.
 * @property {String} name Name in the menu (config-param).
 * @property {String} icon Bootstrap icon (config-param).
 * @property {String} description Description in the menu (config-param).
 * @property {Object} styles Active styles by layer id: {spec, layerName}
 * @property {String|null} lastLayerId The layer picked last (preselected when the tool opens again).
 */
const state = {
    active: false,
    id: "layerStyler",
    name: "additional:modules.cosi.layerStyler.title",
    icon: "bi-palette",
    description: "additional:modules.cosi.layerStyler.description",
    hasMouseMapInteractions: false,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    type: "layerStyler",
    styles: {},
    lastLayerId: null
};

export default state;
