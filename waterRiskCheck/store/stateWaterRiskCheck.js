/**
 * User type definition
 * @typedef {Object} WaterRiskState
 * @property {String} id - Id of the WaterRiskCheck component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Object} pdfPages - Defines which pdfs are displayed depending on questions and data.
 * @property {Object} answersLogic - Defines which pdfs are displayed for which answer.
 * @property {Object} alwaysShow - Pdfs that are always show regardless of questions and data.
 * @property {String} reportPath - File name for configuration of the report.
 * @property {String} feedbackUrl - The url of feedback.
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
    alkisBaseUrl: "https://api.hamburg.de/datasets/v1/alkis_vereinfacht",
    reportPath: "config.valuation.json",
    feedbackUrl: "https://forms.office.com/e/NxRfFHzj9S"
};

export default state;
