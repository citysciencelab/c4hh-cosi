import {expect} from "chai";
import actions from "../../../store/actions.js";
import {readAllPlanningScenariosFromIndexedDb} from "../../../js/planningScenariosIndexedDb.js";
import OgcApiProcess from "../../../js/ogcApiProcess.js";
import stateSimulationTool from "../../../store/state.js";
import sinon from "sinon";

const {
    deleteSimulationFromPlanningScenario,
    isFormatValid,
    parseScenarioFromImport,
    pollAndAssignSimulationJobsResults
} = actions;

/**
 * Creates a IndexedDB mock for planning scenario tests.
 * @param {Object[]} [initialRecords=[]] Initial records to seed the mock store.
 * @returns {{data: Map<string, Object>, indexedDB: {open: Function}}} The in-memory data map and mocked indexedDB API.
 */
function createIndexedDbMock (initialRecords = []) {
    const data = new Map(initialRecords.map(record => [record.id, record]));
    let storeExists = false;

    const db = {
        objectStoreNames: {
            contains: name => name === "planningScenarios" && storeExists
        },
        createObjectStore (name) {
            if (name === "planningScenarios") {
                storeExists = true;
            }
        },
        transaction () {
            const transaction = {
                objectStore () {
                    return {
                        getAll () {
                            const getAllRequest = {};

                            setTimeout(() => {
                                getAllRequest.result = Array.from(data.values());
                                getAllRequest.onsuccess?.();
                            }, 0);

                            return getAllRequest;
                        },
                        put (value) {
                            data.set(value.id, value);
                            setTimeout(() => transaction.oncomplete?.(), 0);
                        }
                    };
                }
            };

            return transaction;
        }
    };

    const indexedDB = {
        open () {
            const openRequest = {};

            setTimeout(() => {
                openRequest.result = db;
                openRequest.onupgradeneeded?.();
                openRequest.onsuccess?.();
            }, 0);

            return openRequest;
        }
    };

    return {
        data,
        indexedDB
    };
}

beforeAll(() => {
    i18next.init({
        lng: "cimode",
        debug: false
    });
});

describe("addons/SimulationTool/store/actions", () => {
    let originalWindow;

    beforeEach(() => {
        sinon.restore();
        originalWindow = globalThis.window;
        globalThis.window = {
            ...originalWindow || {},
            indexedDB: createIndexedDbMock().indexedDB
        };
    });

    afterEach(() => {
        globalThis.window = originalWindow;
    });

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

    describe("pollAndAssignSimulationJobsResults", () => {
        it("positive: polls jobs and assigns normalized results", async () => {
            const dispatch = sinon.spy(),
                rootGetters = {"Modules/Login/accessToken": "token"},
                jobs = [{jobStatus: {status: "accepted"}}],
                jobIds = ["job-1"],
                processConfigs = [{id: "process-1", url: "https://api.example.org", pollingInterval: 1}],
                simulationConfig = {
                    outputs: {
                        outputA: {
                            value: {
                                format: {
                                    mediaType: "application/json"
                                }
                            }
                        }
                    }
                },
                pollingStub = sinon.stub(OgcApiProcess.prototype, "pollJobStatusAndGetResults").callsFake(
                    async function (accessToken, jobId, pollingInterval, onProgressUpdate) {
                        onProgressUpdate({status: "running", processID: "process-1"});
                        return {outputA: {value: {features: []}}};
                    }
                );

            await pollAndAssignSimulationJobsResults(
                {dispatch, rootGetters},
                {jobs, jobIds, processConfigs, simulationConfig}
            );

            expect(pollingStub.calledOnce).to.be.true;
            expect(jobs[0].jobStatus.status).to.equal("running");
            expect(jobs[0].jobResults).to.deep.equal({outputA: {value: {features: []}}});
            expect(dispatch.callCount).to.be.greaterThan(1);
            expect(dispatch.alwaysCalledWith("jobStatusChanged")).to.be.true;
        });

        it("negative: returns early when no access token is available", async () => {
            const dispatch = sinon.spy(),
                rootGetters = {"Modules/Login/accessToken": ""},
                pollingStub = sinon.stub(OgcApiProcess.prototype, "pollJobStatusAndGetResults");

            await pollAndAssignSimulationJobsResults(
                {dispatch, rootGetters},
                {jobs: [{}], jobIds: ["job-1"], processConfigs: [{}], simulationConfig: {}}
            );

            expect(pollingStub.called).to.be.false;
            expect(dispatch.called).to.be.false;
        });
    });

    describe("deleteSimulationFromPlanningScenario", () => {
        it("positive: removes simulation from state and persists scenario", async () => {
            const indexedDbMock = createIndexedDbMock(),
                commit = sinon.spy(),
                getters = {
                    planningScenarios: [{
                        id: "scenario-1",
                        simulations: {
                            "simulation-1": {name: "Simulation 1"},
                            "simulation-2": {name: "Simulation 2"}
                        }
                    }],
                    shouldSaveSimulations: true
                };

            globalThis.window = {
                ...originalWindow || {},
                indexedDB: indexedDbMock.indexedDB
            };

            await deleteSimulationFromPlanningScenario(
                {commit, getters},
                {scenarioId: "scenario-1", simulationId: "simulation-1"}
            );

            expect(commit.calledOnce).to.be.true;
            const updatedScenarios = commit.firstCall.args[1];

            expect(updatedScenarios[0].simulations["simulation-1"]).to.be.undefined;
            expect(updatedScenarios[0].simulations["simulation-2"]).to.deep.equal({name: "Simulation 2"});

            const persistedScenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(persistedScenarios).to.have.length(1);
            expect(persistedScenarios[0].id).to.equal("scenario-1");
            expect(persistedScenarios[0].simulations["simulation-1"]).to.be.undefined;
        });

        it("negative: does not commit when ids are invalid", async () => {
            const commit = sinon.spy(),
                getters = {
                    planningScenarios: [],
                    shouldSaveSimulations: true
                };

            await deleteSimulationFromPlanningScenario(
                {commit, getters},
                {scenarioId: null, simulationId: "simulation-1"}
            );

            expect(commit.called).to.be.false;
        });
    });
});
