/**
 * User type definition
 * @typedef {Object} state
 * @property {Boolean} hasMouseMapInteractions Tool interacts with the map
 * @property {String} id id of the PopulationRequest component
 * @property {String} type type of the PopulationRequest component
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} description description of tool (config-param)
 * @property {String} showDescription should the description be shown (config-param)
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
    id: "populationRequest",
    type: "populationRequest",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    description: "Einwohnerabfrage",
    showDescription: true,
    // defaults for config.json parameters
    name: "additional:modules.tools.populationRequest.title",
    icon: "bi-person-bounding-box",
    rasterActive: undefined,
    alkisAdressesActive: undefined,
    populationReqServiceId: "2",
    wpsId: "1001",
    fmwProcess: "einwohner_ermitteln.fmw"
};

export default state;
