/**
 * State of CompareFeatures.
 * @module  modules/compareFeatures/store/stateCompareFeatures
 *
 * @property {String} [name="common:modules.compareFeatures.title"] Displayed as title (config-param).
 * @property {Boolean} [hasMouseMapInteractions=false] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} [description=""common:modules.compareFeatures.description"] The description that should be shown in the button in the menu.
 * @property {String} [icon="bi-star"] Icon next to title (config-param).
 * @property {String[]} [supportedDevices=["Desktop", "Mobile", "Table"]] Devices on which the module is displayed.
 * @property {String[]} [supportedMapModes=["2D", "3D"]] Map mode in which this module can be used.
 * @property {Integer} [numberOfAttributesToShow=12] Maximal number of attributes to show.
 * @property {Integer} [numberOfFeaturesToShow=3] Maximal number of features to show.
 * @property {String} [type="compareFeatures"] The type of the module.
 * @property {String} [id="compareFeatures"] Id of the CompareFeatures component.
 * @property {Object} [layerFeatures={}] Object with the features of a layer.
 * @property {String} [selectedLayerId=""] Id of currently selected layer.
 * @property {String} [currentFeatureName=""] The name of the current Feature.
 * @property {Boolean} [listFull=false] Tf true no more features can be added to comparison list.
 * @property {Boolean} [hasFeatures=false] Tf true comparison list gets rendered otherwise an infobox shows up.
 * @property {Array} [layerWithFeaturesToShow=[]] Array of the features to a selected layer.
 * @property {Boolean} [hasMultipleLayers=false] Tf true multiple layers can be selected within the comparison list.
 * @property {Object} [preparedList={}] Object with the selected layers and their selected features.
 * @property {Object} [preparedListDisplayTable={}] Object with the selected layers and their selected features to be displayed in the table.
 */
const state = {
    // defaults for config.json parameters
    name: "common:modules.compareFeatures.title",
    hasMouseMapInteractions: false,
    description: "common:modules.compareFeatures.description",
    icon: "bi-star",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "compareFeatures",
    numberOfAttributesToShow: 50,
    numberOfFeaturesToShow: 3,
    // compareFeatures state
    id: "compareFeatures",
    layerFeatures: {},
    selectedLayerId: "",
    currentFeatureName: "",
    listFull: false,
    hasFeatures: false,
    layerWithFeaturesToShow: [],
    hasMultipleLayers: false,
    preparedList: {},
    preparedListDisplayTable: {}
};

export default state;
