import {expect} from "chai";
import actions from "../../../store/actions.js";
import stateSimulationTool from "../../../store/state.js";
import sinon from "sinon";

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

        it("should call wrong format warning if the payload is not an object.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            isFormatValid({commit, dispatch}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat")
            })).to.be.true;
        });

        it("should call wrong format warning if the payload has no id.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload = {
                name: "name",
                inputs: {},
                scenarioFeature: {}
            };

            isFormatValid({commit, dispatch}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "id"})
            })).to.be.true;
        });

        it("should call wrong format warning if the payload has no name.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload = {
                id: "id",
                inputs: {},
                scenarioFeature: {}
            };

            isFormatValid({commit, dispatch}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "name"})
            })).to.be.true;
        });

        it("should call wrong format warning if the payload has no inputs.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload = {
                id: "id",
                name: "name",
                scenarioFeature: {}
            };

            isFormatValid({commit, dispatch}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "inputs"})
            })).to.be.true;
        });

        it("should call wrong format warning if the payload has no scenarioFeature.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload = {
                id: "id",
                name: "name",
                inputs: {
                    buildings: {},
                    roads: {}
                }
            };

            isFormatValid({commit, dispatch}, payload);

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "scenarioFeature"})
            })).to.be.true;
        });
    });

    describe("parseScenarioFromImport", () => {
        let payload = "";

        it("should not call anything when the payload is not in string format.", async () => {
            const commit = sinon.spy(),
                dispatch = sinon.spy();

            payload = null;

            await parseScenarioFromImport({commit, dispatch, getters: stateSimulationTool}, payload);
        });
    });
});
