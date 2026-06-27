import store from "../../../../src/app-store/index.js";

/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
export function register (vueStore) {
    vueStore.dispatch("Modules/SessionTool/register", {key: "Maps", getter: getCurrentExtentOfMap, setter: setExtentForMap});
}

/**
 * Gets the current extent of the map.
 * @returns {Object} an object which holds the extent
 */
function getCurrentExtentOfMap () {
    return {
        center: store.getters["Maps/center"],
        zoomLevel: store.getters["Maps/zoom"],
        mode: store.getters["Maps/mode"]
    };
}

/**
 * Sets the current extent of the map.
 * @param {Object} payload the payload
 * @returns {void}
 */
function setExtentForMap (payload) {
    return new Promise((resolve) => {
        const changeMapModePromise = new Promise(resolveMapMode => {
            if (payload?.mode === "3D") {
                if (store.getters["Maps/mode"] === "3D") {
                    resolveMapMode();
                    return;
                }
                store.dispatch("Maps/changeMapMode", "3D").then(resolveMapMode);
            }
            else {
                if (store.getters["Maps/mode"] === "2D") {
                    resolveMapMode();
                    return;
                }
                store.dispatch("Maps/changeMapMode", "2D").then(resolveMapMode);
            }
        });

        changeMapModePromise.then(() => {
            if (payload?.center && payload?.zoomLevel) {
                store.dispatch("Maps/setZoom", payload.zoomLevel);
                store.dispatch("Maps/setCenter", payload.center);
            }
            resolve();
        });
    });
}
