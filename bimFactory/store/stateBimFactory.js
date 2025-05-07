/**
 * User type definition
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the BimFactory component
 * @property {String} id - id of BimFactory component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {Boolean} standAlonePortal - flag if tool is used in a standalone portal, then titles are removed via CSS (config-param)
 * @property {String} workflowsJSONPath - path to the JSON file where all workflows are defined (config-param)
 * @property {Object} workflowsJSON - JSON object containing all workflows
 * @property {Array} workflowsDetails - array of workflow details
 * @property {Object} workflowFormData - object containing the form data for the workflow
 * @property {Number} previousWorkflowBackgroundLayer - Id of background layer which needs to be turned off on workflow switch
 * @property {Array} previousWorkflowForegroundLayers - Array of foreground layers which need to be turned off on workflow switch
 */

const state = {
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    type: "bimFactory",
    id: "bimFactory",
    name: "additional:modules.bimfactory.name",
    description: "additional:modules.bimfactory.description",
    icon: "bi-house-gear-fill",
    isVisibleInMenu: true,
    deactivateGFI: true,
    standAlonePortal: false,
    workflowsJSONPath: "",
    workflowsJSON: {},
    workflowsDetails: [],
    workflowFormData: {},
    previousWorkflowBackgroundLayer: null,
    previousWorkflowForegroundLayers: []
};

export default state;


