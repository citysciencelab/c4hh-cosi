import {expect} from "chai";
import {
    readAllPlanningScenariosFromIndexedDb,
    upsertPlanningScenarioInIndexedDb
} from "../../../js/planningScenariosIndexedDb.js";

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

describe("addons/simulationTool/js/planningScenariosIndexedDb.js", () => {
    let originalWindow;

    beforeEach(() => {
        originalWindow = globalThis.window;
        globalThis.window = {
            ...originalWindow || {},
            indexedDB: createIndexedDbMock().indexedDB
        };
    });

    afterEach(() => {
        globalThis.window = originalWindow;
    });

    describe("readAllPlanningScenariosFromIndexedDb", () => {
        it("positive: returns persisted planning scenarios", async () => {
            const indexedDbMock = createIndexedDbMock([
                {id: "scenario-1", name: "Scenario 1"},
                {id: "scenario-2", name: "Scenario 2"}
            ]);

            globalThis.window = {
                ...originalWindow || {},
                indexedDB: indexedDbMock.indexedDB
            };

            const scenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(scenarios).to.deep.equal([
                {id: "scenario-1", name: "Scenario 1"},
                {id: "scenario-2", name: "Scenario 2"}
            ]);
        });

        it("negative: returns empty array when indexedDB is unavailable", async () => {
            globalThis.window = {
                ...originalWindow || {},
                indexedDB: undefined
            };

            const scenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(scenarios).to.deep.equal([]);
        });
    });

    describe("upsertPlanningScenarioInIndexedDb", () => {
        it("positive: inserts and updates a planning scenario", async () => {
            const indexedDbMock = createIndexedDbMock();

            globalThis.window = {
                ...originalWindow || {},
                indexedDB: indexedDbMock.indexedDB
            };

            await upsertPlanningScenarioInIndexedDb({id: "scenario-1", name: "Scenario 1"});
            await upsertPlanningScenarioInIndexedDb({id: "scenario-1", name: "Updated Scenario"});

            const scenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(scenarios).to.deep.equal([{id: "scenario-1", name: "Updated Scenario"}]);
        });

        it("negative: ignores invalid scenario payload", async () => {
            const indexedDbMock = createIndexedDbMock();

            globalThis.window = {
                ...originalWindow || {},
                indexedDB: indexedDbMock.indexedDB
            };

            await upsertPlanningScenarioInIndexedDb({name: "missing-id"});

            const scenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(scenarios).to.deep.equal([]);
        });

        it("negative: ignores scenario that cannot be JSON-normalized", async () => {
            const indexedDbMock = createIndexedDbMock();

            globalThis.window = {
                ...originalWindow || {},
                indexedDB: indexedDbMock.indexedDB
            };

            await upsertPlanningScenarioInIndexedDb({id: "x", data: BigInt(42)});

            const scenarios = await readAllPlanningScenariosFromIndexedDb();

            expect(scenarios).to.deep.equal([]);
        });
    });
});
