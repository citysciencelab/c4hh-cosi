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
 * @property {Boolean} rasterActive is the rasterLayer active
 * @property {Boolean} alkisAdressesActive is the alkisAdressesLayer active
 * @property {Number} populationReqServiceId id of the population Request
 * @property {String} wpsId The id of the used web processing service.
 * @property {String} fmwProcess FME process triggered via the WPS.
 */
const state = {
    hasMouseMapInteractions: true,
    type: "populationRequest",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    // defaults for config.json parameters
    description: "additional:modules.populationRequest.description",
    name: "additional:modules.populationRequest.name",
    icon: "bi-person-bounding-box",
    rasterActive: undefined,
    alkisAdressesActive: undefined,
    populationReqServiceId: "2",
    wpsId: "1001",
    fmwProcess: "einwohner_ermitteln.fmw"
};

export default state;
