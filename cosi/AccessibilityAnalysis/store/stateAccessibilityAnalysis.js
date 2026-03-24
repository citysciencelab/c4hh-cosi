/**
 * User type definition
 * @typedef {object} VueAddonState
 * @property {boolean} active if true, VueAddon will rendered
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {ol/Feature[]} directionFeatures - features for the direction layer.
 * @property {String[]} isochroneColors - colors for the isochrone features.
 * @property {Number} cardCounter - counter for cards.
 */
const state = {
    active: false,
    id: "accessibilityAnalysis",
    type: "accessibilityAnalysis",
    hasMouseMapInteractions: true,
    // defaults for config.json parameters
    name: "Erreichbarkeitsanalyse",
    icon: "bi-geo",
    isochroneFeatures: [],
    isochroneColors: undefined,
    directionFeatures: [],
    coordinate: [],
    selectedFacilityNames: [],
    useOuterBoundaries: false,
    setBySearch: false,
    rangeSettings: {
        "driving-car": {},
        "cycling-regular": {},
        "foot-walking": {},
        "wheelchair": {},
        "default": {
            time: {
                value: 10,
                max: 120,
                min: 0
            },
            distance: {
                value: 1000,
                max: 10000,
                min: 0
            }
        }
    },
    transportType: "driving-car",
    scaleUnit: "time",
    distance: 0,
    time: 0,
    travelTime: "9",
    steps: [0, 0, 0],
    dataSets: [],
    activeSet: null,
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/003accessibilityanalysis.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/003erreichbarkeitsanalyse.md"
    },
    batchSize: 50,
    serviceId: "bkg_ors",
    fallbackServiceId: "csl_ors",
    wpsServiceId: "1001",
    wpsProcess: "einwohner_ermitteln.fmw",
    cardCounter: 0
};

export default state;
