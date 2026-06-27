/**
 * User type definition
 * @typedef {Object} FeaturesListState
 * @property {Boolean} [active=false] - Is activated (will rendered) or not (config-param).
 * @property {Boolean} [deactivateGFI=false] - Deactivates the gfi if true (config-param).
 * @property {String} [icon="bi-apple"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district selector component.
 * @property {String} [name=Einrichtungsübersicht] - The name of the tool (config-param).
 */
const state = {
    deactivateGFI: false,
    icon: "bi-house-door",
    id: "featuresList",
    isVisibleInMenu: true,
    name: "Einrichtungsübersicht",
    width: 0.5,
    // FeaturesList State
    geomAttributes: {
        area: [
            {key: "flaeche_qm", factorToSqm: 1},
            {key: "flaeche_ha", factorToSqm: 0.0001}
        ],
        lineString: [
            {key: "laenge_m", factorToM: 1},
            {key: "laenge_km", factorToM: 0.001}
        ]
    },
    mapping: [],
    featuresListItems: [],
    selectedFeatureItems: [],
    propBlacklist: [
        "geometry",
        "geom",
        "the_geom",
        "coordinates",
        "flatCoordinates",
        "x",
        "y",
        "lat",
        "lon",
        "latlon",
        "lonlat",
        "originalData"
    ],
    disabledFeatureItems: [],
    distanceScoreEnabled: true,
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/017featureslist.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/017einrichtungsuebersicht.md"
    }
};

export default state;
