/**
 * User type definition
 * @typedef {Object} ValuationPrintState
 * @property {Boolean} active - If true, ValuationPrint will rendered.
 * @property {String} id - Id of the ValuationPrint component.
 * @property {String} parcelLayerId - The id of the layer which data are the basis of this tool.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Boolean} renderToWindow - If true, tool is rendered in a window, else in sidebar.
 * @property {Boolean} resizableWindow - If true, window is resizable.
 * @property {Boolean} isVisibleInMenu - If true, tool is selectable in menu.
 * @property {Number} parcelLayerZoomLevel - Minimum zoom level at which parcel layer is visible. Tunable for performance reasons.
 * @property {Boolean} showStatusLog -If set to false, status log ("Statusverlauf") is never renderend.
 * @property {Boolean} multiSelectParcels - If true, user can have more than one parcel selected at a time.
 * @property {Boolean} showParcelSearch - If true, WfsSearch is rendered.
 * @property {Boolean} oafCRSURI - The URI for the oaf services. Needs to be set with a valid crs URI.
 * @property {String} reportPath - File name for configuration of the report.
 * @property {Object} selectedFeatures - The Selected Features.
 * @property {Object} messageList - List of messages for status progress.
 * @property {Object} urlList - List of urls for downloding pdf and images.
 * @property {Boolean} showDownloadAll - True, if the url list was generated.
 * @property {Boolean} sendLegends - If true, legends for wms layers are sent together with report request.
 * @property {Object[]} printedFeature - The printed features.
 * @property {String} templateName - The name of the template.
 */
const state = {
    id: "valuationPrint",
    type: "valuationPrint",
    hasMouseMapInteractions: true,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    parcelLayerId: "",
    oafCRSURI: undefined,
    // defaults for config.json parameters
    name: "additional:modules.valuationPrint.title",
    icon: "bi-bar-chart-line-fill",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    parcelLayerZoomLevel: 7,
    showStatusLog: true,
    multiSelectParcels: false,
    showParcelSearch: false,
    isModalRequired: true,
    reportPath: "config.valuation.json",
    selectedFeatures: [],
    messageList: [],
    urlList: [],
    showDownloadAll: false,
    sendLegends: false,
    printedFeature: [],
    templateName: "A4 Hochformat"
};

export default state;
