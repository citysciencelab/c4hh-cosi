/**
 * User type definition
 * @typedef {Object} ScenarioBuilderState
 * @property {ol/layer} guideLayer - guide layer used for additional info to display on the map.
 */
const state = {
    hasMouseMapInteractions: true,
    icon: "bi-boxes",
    id: "ScenarioBuilder",
    name: "ScenarioBuilder",
    nameProperties: ["name", "facility", "bezeichnung", "einrichtungsname", "titel"],
    useIcons: true,
    width: 0.45,
    scenarioCards: [],
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
    guideLayer: null
};

export default state;
