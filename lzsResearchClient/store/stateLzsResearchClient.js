/**
 * Masterportal state
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {Boolean} standAlonePortal - flag if tool is used in a standalone portal, then titles are removed via CSS (config-param)
 * @property {String} apiBasePath - Base url for api requests to gis portal

 * Addon state
 * @property {Boolean} showLoadingSpinner - Show loading spinner or not
 * @property {Object} dataClassList - List of data classes (see fetchDataClassList) used in tab search
 */

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "lzsResearchClient",
    id: "lzsResearchClient",
    name: "additional:modules.lzsResearchClient.name",
    description: "additional:modules.lzsResearchClient.description",
    icon: "bi-question-square",
    isVisibleInMenu: true,
    deactivateGFI: true,
    standAlonePortal: false,

    // Addon state
    showLoadingSpinner: false,
    dataClassList: {},
    apiBasePath: ""
};

export default state;
