import actions from "../../../store/actions.js";
import stateSimulationTool from "../../../store/state.js";
import testAction from "../../../../../devtools/tests/VueTestUtils.js";

const {isFormatValid, parseScenarioFromImport} = actions;

beforeAll(() => {
    i18next.init({
        lng: "cimode",
        debug: false
    });
});

describe("addons/SimulationTool/store/actions", () => {
    describe("isFormatValid", () => {
        let payload = "";

        it("should call wrong format warning if the payload is not an object.", done => {
            testAction(isFormatValid, payload, stateSimulationTool, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: "error",
                    content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat")
                },
                dispatch: true
            }], {}, done);
        });

        it("should call wrong format warning if the payload has no id.", done => {
            payload = {
                name: "name",
                inputs: {},
                scenarioFeature: {}
            };
            testAction(isFormatValid, payload, stateSimulationTool, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: "error",
                    content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "id"})
                },
                dispatch: true
            }], {}, done);
        });

        it("should call wrong format warning if the payload has no name.", done => {
            payload = {
                id: "id",
                inputs: {},
                scenarioFeature: {}
            };
            testAction(isFormatValid, payload, stateSimulationTool, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: "error",
                    content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "name"})
                },
                dispatch: true
            }], {}, done);
        });

        it("should call wrong format warning if the payload has no inputs.", done => {
            payload = {
                id: "id",
                name: "name",
                scenarioFeature: {}
            };
            testAction(isFormatValid, payload, stateSimulationTool, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: "error",
                    content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "inputs"})
                },
                dispatch: true
            }], {}, done);
        });

        it("should call wrong format warning if the payload has no scenarioFeature.", done => {
            payload = {
                id: "id",
                name: "name",
                inputs: {
                    buildings: {},
                    roads: {}
                }
            };
            testAction(isFormatValid, payload, stateSimulationTool, {}, [{
                type: "Alerting/addSingleAlert",
                payload: {
                    category: "error",
                    content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "scenarioFeature"})
                },
                dispatch: true
            }], {}, done);
        });
    });

    describe("parseScenarioFromImport", () => {
        let payload = "";

        it("should not call anything when the payload is not in string format.", done => {
            payload = null;

            testAction(parseScenarioFromImport, payload, stateSimulationTool, {}, [], {}, done);
        });
    });
});
