/**
 * User type definition
 * @typedef {Object} WaterRiskState
 * @property {String} id - Id of the WaterRiskCheck component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 */
const state = {
    id: "waterRiskCheck",
    type: "waterRiskCheck",
    hasMouseMapInteractions: true,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    name: "additional:modules.waterRiskCheck.title",
    icon: "bi-water",
    description: "additional:modules.waterRiskCheck.description",
    configuredQuestions: [],
    address: "",
    addressCoordinates: undefined,
    pdfPages: [],
    answersLogic: [],
    alwaysShow: [],
    alkisBaseUrl: "https://api.hamburg.de/datasets/v1/alkis_vereinfacht"
};

export default state;
