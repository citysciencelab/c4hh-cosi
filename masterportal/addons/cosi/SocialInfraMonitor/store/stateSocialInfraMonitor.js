/**
 * State of the "Förderung & Öffnungszeiten" prototype. Everything here can be
 * overridden from the tool's entry in config.json.
 * @typedef {Object} SocialInfraMonitorState
 * @property {Object<String, String>} layerIds - Layer tree ids of the demo layers. The tool reads their
 *     GeoJSON itself and hides them while it is open, so nothing is drawn twice.
 * @property {String} districtsUrl - Stadtteil outlines with the demo statistics.
 * @property {String} menuSide - Menu the tool lives in; used to hand over to the Erreichbarkeitsanalyse.
 * @property {String} accessibilityAnalysisType - Menu type of the Erreichbarkeitsanalyse.
 * @property {String} aiLabelUrl - EU "AI generated" label, shown in the panel and on the map while the
 *     tool is open, because Träger, funding, opening hours and visits are synthetic.
 */
const state = {
    id: "socialInfraMonitor",
    type: "socialInfraMonitor",
    name: "Förderung & Öffnungszeiten",
    icon: "bi-cash-coin",
    description: "",
    hasMouseMapInteractions: false,
    layerIds: {
        jugend: "cosi_demo_sozialinfra_jugend",
        familie: "cosi_demo_sozialinfra_familie",
        kitas: "cosi_demo_sozialinfra_kitas",
        schulen: "cosi_demo_sozialinfra_schulen",
        traegernetz: "cosi_demo_sozialinfra_traegernetz"
    },
    districtsUrl: "./assets/demo-sozialinfra-stadtteilgrenzen.geojson",
    menuSide: "secondaryMenu",
    accessibilityAnalysisType: "accessibilityAnalysis",
    aiLabelUrl: "./assets/ai-labels/label-ai-generated-black.svg"
};

export default state;
