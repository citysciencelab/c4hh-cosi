/**
 * User type definition
 * @property {Boolean} active Status of baslayerSwitcher, as configured in config.json
 * @property {Boolean} activatedExpandable Defines if baselayerSwichter is expandend
 * @property {String[]} visibleBaselayerIds Defines a subset of base layers that is available in the layer switcher.
 * @property {Object} baselayers the baselayers form config
 * @property {String[]} configPaths Path array of possible config locations. First one found will be used
 * @property {Boolean} singleBaseLayer Defines if the previous layer is set to hidden
 * @property {Object} topBaselayer the baselayer that is on the top (highest zIndex)
 * @property {String} type The type of the baselayerSwitcher component
 */
const state = {
    active: false,
    activatedExpandable: false,
    visibleBaselayerIds: [],
    baselayers: [],
    configPaths: ["portalConfig.map.baselayerSwitcher"],
    singleBaseLayer: false,
    topBaselayer: null,
    type: "baselayerSwitcher"
};

export default state;
