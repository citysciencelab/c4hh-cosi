/**
 * Tries to open a indexedDB connection
 * @param {String} [dbName="cosi"] - the name of the database
 * @returns {IDBOpenDBRequest | null} the open DB connection or null
 */
export default function openDB (dbName = "cosi") {
    return new Promise(res => {
        try {
            let db;
            const request = window.indexedDB.open(dbName, 2);

            request.onerror = (evt) => {
                console.warn("Your browser does not support IndexedDB, falling back to localStorage instead. Please mind that file size is limited to 5MB.");
                console.warn(evt.error);
                res(null);
            };
            request.onsuccess = (evt) => {
                db = evt.target.result;
                db.onerror = (event) => {
                    // Generic error handler for all errors targeted at this database's
                    // requests!
                    console.error("Database error: " + event.target.errorCode);
                };
                res(db);
            };
            request.onupgradeneeded = onUpgradeNeeded;
        }
        catch (error) {
            console.warn("Your browser does not support IndexedDB, falling back to localStorage instead. Please mind that file size is limited to 5MB.");
            console.warn(error);
            res(null);
        }
    });
}

/**
 * Updates the DB
 * @param {Event} evt - the onUpgradeNeededEvent
 * @returns {void}
 */
function onUpgradeNeeded (evt) {
    // This event is only implemented in recent browsers
    // Save the IDBDatabase interface
    const
        db = evt.target.result;

    // creates the DB schema
    db.createObjectStore("sessions", {autoIncrement: true});
}

