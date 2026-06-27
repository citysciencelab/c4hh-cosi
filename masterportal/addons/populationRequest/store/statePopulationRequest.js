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
 * @property {String} serviceId The id of the used processing service. Overwrites `wpsId`.
 * @property {String} fmwProcess FME process triggered via the WPS.
 * @property {String} processName Name of the process triggered via the service. Overwrites `fmwProcess`.
 * @property {Object} processData Data returned from the process.
 * @property {String} mrhId The id of the MRH process. Kept for backward compatibility.
 * @property {String} fhhId The id of the FHH process. Kept for backward compatibility.
 * @property {String} rasterLayerId The id of the raster layer.
 * @property {String} alkisAdressLayerId The id of the alkis adress layer.
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
    serviceId: null,
    fmwProcess: "einwohner_ermitteln.fmw",
    processName: null,
    processData: undefined,
    mrhId: "46969C7D-FAA8-420A-81A0-8352ECCFF526",
    fhhId: "B3FD9BD5-F614-433F-A762-E14003C300BF",
    rasterLayerId: "13023",
    alkisAdressLayerId: "9726"
};

export default state;
