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
 * @property {Boolean} deactivateGFI - Flag if tool should deactivate gfi.
 * @property {Boolean} showStatusProgress -If set to false, status progress ("Statusverlauf") is never renderend.
 * @property {Boolean} multiSelectParcels - If true, user can have more than one parcel selected at a time.
 * @property {Boolean} showParcelSearch - If true, WfsSearch is rendered.
 * @property {Boolean} reportPath - File name for configuration of the report.
 */
const state = {
    id: "valuationPrint",
    type: "valuationPrint",
    hasMouseMapInteractions: true,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    parcelLayerId: "",
    // defaults for config.json parameters
    name: "additional:modules.valuationPrint.title",
    icon: "bi-bar-chart-line-fill",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: false,
    showStatusProgress: true,
    multiSelectParcels: false,
    showParcelSearch: false,
    isModalRequired: true,
    reportPath: "config.valuation.json"
};

export default state;
