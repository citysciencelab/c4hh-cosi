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
        "public-transport": {},
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
    // isochrone routing backend: "ors" (OpenRouteService, default) or "valhalla" (self-hosted).
    // For Valhalla, set this to "valhalla" in config.json and point serviceId at the Valhalla rest-service.
    isochroneBackend: "ors",
    // Valhalla-only isochrone detail tuning (BACKLOG §3); ignored when isochroneBackend !== "valhalla".
    // Overridable wholesale via the config.json accessibilityAnalysis block.
    //   generalize: Douglas–Peucker tolerance in metres; null → omit (Valhalla default). 0 = max fidelity.
    //   denoise: 0..1; 1 drops disconnected islands, lower (e.g. 0.3) keeps small reachable pockets.
    valhallaIsochroneOptions: {
        generalize: null,
        denoise: 1
    },
    wpsServiceId: "1001",
    wpsProcess: "einwohner_ermitteln.fmw",
    cardCounter: 0
};

export default state;
