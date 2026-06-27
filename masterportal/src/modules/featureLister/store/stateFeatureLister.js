import tabStatus from "../constantsTabStatus.js";

/**
 * featureLister tool state definition.
 * @typedef {Object} FeatureListerState
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} type type of the FeatureLister component
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Number} maxFeatures default value for maxFeatures that can be overwritten in config
 * @property {Object} layer layer object of the selected layer
 * @property {String} layerListView current status of layer list view tab (enabled/active/disabled)
 * @property {Array} gfiFeaturesOfLayer array of the gfiFeatures of the selected layer
 * @property {String} featureCount number of total features of the selected layer
 * @property {String} shownFeatures currently count of features displayed in featureListView table
 * @property {String} featureListView current status of feature list view tab (enabled/active/disabled)
 * @property {Boolean} nestedFeatures some features have features themself, if true they get recognized
 * @property {String} featureDetailView current status of feature detail view tab (enabled/active/disabled)
 * @property {Array} headers list of headings in list
 * @property {Object} selectedRow the selected row of the table of gfiFeatures
 * @property {Object} highlightVectorRulesPolygon default style for highlighting polygons
 * @property {Object} highlightVectorRulesPointLine default style for highlighting lines and points
 * @property {Array} supportedDevices Array of supported device types
 * @property {Array} supportedMapModes Array of supported map modes
 * @property {Object} selectedArea Currently selected area object
 * @property {Boolean} loading Loading state indicator
 * @property {Boolean} showGraphicalSelect if true the graphical select component gets displayed
 * @property {Number} bufferDistance value will be used as default for the line buffer geometry from the graphical select component
 */
const state = {
    hasMouseMapInteractions: true,
    type: "featureLister",
    description: "common:modules.featureLister.description",
    name: "common:modules.featureLister.name",
    icon: "bi-list",
    maxFeatures: 20,
    layer: null,
    layerListView: tabStatus.ACTIVE,
    gfiFeaturesOfLayer: [],
    featureCount: "",
    shownFeatures: "",
    featureListView: tabStatus.DISABLED,
    nestedFeatures: false,
    featureDetailView: tabStatus.DISABLED,
    headers: [],
    selectedRow: null,
    highlightVectorRulesPolygon: {
        "fill": {
            "color": [255, 0, 255, 0.9]
        },
        "stroke": {
            "width": 4,
            "color": [0, 0, 204, 0.9]
        },
        "zoomLevel": 7
    },
    highlightVectorRulesPointLine: {
        "stroke": {
            "width": 8,
            "color": [255, 0, 255, 0.9]
        },
        "image": {
            "scale": 2
        },
        "zoomLevel": 7
    },
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    selectedArea: null,
    loading: false,
    showGraphicalSelect: false,
    bufferDistance: 100
};

export default state;
