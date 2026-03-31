/**
 * User type definition
 * @typedef {Object} state
 * @property {Boolean} hasMouseMapInteractions Tool interacts with the map
 * @property {String} type type of the PopulationRequest component
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} name Displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {String} wpsId The id of the used web processing service.
 * @property {String} serviceId The id of the used processing service. Overwrites `wpsId`.
 * @property {String} fmwProcess FME process triggered via the WPS.
 * @property {String} processName Name of the process triggered via the service. Overwrites `fmwProcess`.
 * @property {Object} processData Data returned from the process.
 * @property {String} secret Secret for authentication with the WPS.
 * @property {String} baseUrl Base url of the WPS.
 * @property {String[]} formatValueOfKeys List of keys whose values should be formatted before being displayed.
 */
const state = {
    hasMouseMapInteractions: true,
    type: "planParken",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    // defaults for config.json parameters
    description: "additional:modules.planParken.description",
    name: "additional:modules.planParken.name",
    icon: "bi-car-front",
    wpsId: "1001",
    serviceId: null,
    fmwProcess: "Masterplan_Parken_Portalauswertung.fmw",
    processName: null,
    processData: undefined,
    secret: "",
    baseUrl: "https://geodienste.hamburg.de/HH_WPS?tm_ttl=50",
    formatValueOfKeys: []
};

export default state;
