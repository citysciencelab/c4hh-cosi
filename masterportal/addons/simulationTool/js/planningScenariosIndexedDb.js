
const DATABASE_NAME = "simulationTool";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "planningScenarios";

/**
 * Converts a scenario into a plain indexedDB-safe object.
 * This strips Vue proxies and non-JSON data.
 * @param {Object} scenario The scenario to normalize.
 * @returns {Object|null} The normalized scenario or null.
 */
function normalizeScenarioForIndexedDb (scenario) {
    try {
        return JSON.parse(JSON.stringify(scenario));
    }
    catch (error) {
        console.warn("Could not normalize planning scenario for indexedDB.", error);
        return null;
    }
}

/**
 * Opens the indexedDB database for simulation scenarios.
 * @returns {Promise<IDBDatabase>} The opened database.
 */
function openPlanningScenariosDatabase () {
    if (typeof window === "undefined" || !window.indexedDB) {
        return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
        const openRequest = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        openRequest.onupgradeneeded = () => {
            const db = openRequest.result;

            if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                db.createObjectStore(OBJECT_STORE_NAME, {keyPath: "id"});
            }
        };

        openRequest.onsuccess = () => {
            resolve(openRequest.result);
        };

        openRequest.onerror = () => {
            reject(openRequest.error);
        };
    });
}

/**
 * Reads all planning scenarios from indexedDB.
 * @returns {Promise<Object[]>} The stored planning scenarios.
 */
export async function readAllPlanningScenariosFromIndexedDb () {
    const db = await openPlanningScenariosDatabase();

    if (!db) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readonly"),
            objectStore = transaction.objectStore(OBJECT_STORE_NAME),
            getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = () => {
            resolve(Array.isArray(getAllRequest.result) ? getAllRequest.result : []);
        };

        getAllRequest.onerror = () => {
            reject(getAllRequest.error);
        };
    });
}

/**
 * Upserts a planning scenario in indexedDB by scenario id.
 * @param {Object} scenario The planning scenario to persist.
 * @returns {Promise<void>}
 */
export async function upsertPlanningScenarioInIndexedDb (scenario) {
    if (!scenario || typeof scenario !== "object" || typeof scenario.id !== "string") {
        return;
    }

    const normalizedScenario = normalizeScenarioForIndexedDb(scenario);

    if (!normalizedScenario || typeof normalizedScenario.id !== "string") {
        return;
    }

    const db = await openPlanningScenariosDatabase();

    if (!db) {
        return;
    }

    await new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite"),
            objectStore = transaction.objectStore(OBJECT_STORE_NAME);

        objectStore.put(normalizedScenario);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };

        transaction.onabort = () => {
            reject(transaction.error);
        };
    });
}
