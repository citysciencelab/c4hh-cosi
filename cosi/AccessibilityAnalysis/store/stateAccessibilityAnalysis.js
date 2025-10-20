/**
 * User type definition
 * @typedef {object} VueAddonState
 * @property {boolean} active if true, VueAddon will rendered
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {String[]} isochroneColors - colors for the isochrone features.
 * @property {String} selectedFacility - The name of the selected feature in facility mode.
 */
const state = {
    active: false,
    id: "accessibilityAnalysis",
    type: "accessibilityAnalysis",
    hasMouseMapInteractions: true,
    // defaults for config.json parameters
    name: "Erreichbarkeitsanalyse",
    icon: "bi-geo",
    isVisibleInMenu: true,
    deactivateGFI: true,
    isochroneFeatures: [],
    isochroneColors: undefined,
    mode: "point",
    coordinate: [],
    selectedFacilityNames: [],
    selectedFacilities: [],
    setByFeature: false,
    setBySearch: false,
    transportType: "driving-car",
    scaleUnit: "time",
    distance: 5,
    time: 9,
    steps: [0, 0, 0],
    dataSets: [],
    activeSet: 0,
    metaData: null,
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/003accessibilityanalysis.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/003erreichbarkeitsanalyse.md"
    },
    progress: 0,
    batchSize: 50,
    serviceId: "bkg_ors",
    fallbackServiceId: "csl_ors",
    reportTemplateMode: null,
    toolBridgeIn: {settings: {}, type: "", outputCallback: null}, // accepts settings from toolBridge - must have a *watcher*
    toolBridgeOut: {}, // pass current settings to toolBridge - must have a *getter
    wpsServiceId: "1001",
    wpsProcess: "einwohner_ermitteln.fmw"
};

export default state;
