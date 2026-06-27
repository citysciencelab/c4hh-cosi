/**
 * User type definition
 * @typedef {Object} AddWMSState
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map mode in which this module can be used.
 * @property {String[]} exampleURLs List of example WMS service URLs that will be shown to the user.
 * @property {Number} [featureCount=undefined] Amount of features retrieved on GFI requests. Corresponds to the GetFeatureInfo parameter "FEATURE_COUNT". If undefined is specified, the attribute FEATURE_COUNT will not be listed in the gfi request.
 * @property {Boolean} visibility Setting for the visibility flag of the imported layers.
 * @property {Boolean} showInLayerTree Setting for the showInLayerTree flag of the imported layers.
 */
const state = {
    description: "common:modules.addWMS.description",
    type: "addWMS",
    name: "common:modules.addWMS.name",
    icon: "bi-cloud-plus",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    exampleURLs: [],
    featureCount: undefined,
    visibility: false,
    showInLayerTree: false
};

export default state;
