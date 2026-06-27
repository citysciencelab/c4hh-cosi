/**
 * Oktagon Vuex state definition
 * @typedef {Object} OktagonState
 * @property {String} type The tool type identifier, e.g. "oktagon".
 * @property {String} name The internal tool name.
 * @property {String} description i18n key for tool description.
 * @property {Boolean} hasMouseMapInteractions If true, tool interacts with map via mouse.
 * @property {String} icon CSS class for the tool icon.
 * @property {String} backURL URL to return back to Oktagon.
 * @property {Number} zoomLevel Default zoom level used when centering map.
 * @property {String} returnURL URL parameter defining the return URL.
 * @property {String} address Address from the URL parameter.
 * @property {String} submitURL Generated URL for sending parameters to Oktagon.
 * @property {String[]} layerIds List of layer IDs used to request WMS/feature info.
 * @property {Object.<string, string>} submitObject Key/value pairs of collected parameters for the submitURL.
 */
const state = {
    type: "oktagonComponent",
    name: "Oktagon",
    description: "additional:modules.oktagon.description",
    hasMouseMapInteractions: true,
    icon: "bi-bullseye",
    backURL: "",
    zoomLevel: 9,
    returnURL: "",
    address: "",
    submitURL: "",
    layerIds: ["186", "19110"],
    submitObject: {}
};

export default state;
