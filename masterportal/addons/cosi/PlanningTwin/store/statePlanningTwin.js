/**
 * State of the PlanningTwin tool (Planungszwilling, beta).
 * @typedef {Object} PlanningTwinState
 * @property {Boolean} active Whether the tool is open.
 * @property {String} id Tool id.
 * @property {String} name Name in the menu (config-param).
 * @property {String} icon Bootstrap icon (config-param).
 * @property {String} description Description in the menu (config-param).
 * @property {String|null} planfall Slug of the planning case shown on the map.
 * @property {String} stichtag Date of the view: "heute" or a year.
 * @property {Boolean} entfallen Whether removed objects are shown.
 */
const state = {
    active: false,
    id: "planningTwin",
    name: "additional:modules.cosi.planningTwin.title",
    icon: "bi-calendar-range",
    description: "additional:modules.cosi.planningTwin.description",
    hasMouseMapInteractions: false,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    type: "planningTwin",
    planfall: null,
    stichtag: "heute",
    entfallen: false
};

export default state;
