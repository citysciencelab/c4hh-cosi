import isObject from "../../../../src/shared/js/utils/isObject.js";
import {nextTick} from "vue";
import store from "../../../../src/app-store/index.js";

/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
export function register (vueStore) {
    vueStore.dispatch("Modules/SessionTool/register", {key: "Modeler3D", getter: getStateOfModeler3D, setter: setModeler3DState});
}

/**
 * Gets the current state of Modeler3D
 * @returns {Object} an object which holds the Modeler3D state
 */
async function getStateOfModeler3D () {
    let drawnEntities,
        hiddenEntities,
        importedEntities,
        drawnStyle,
        clampToGround,
        dimensions,
        hideObjects,
        povActive;

    try {
        drawnEntities = store.getters["Modules/Modeler3D/drawnEntities"];
        hiddenEntities = store.getters["Modules/Modeler3D/hiddenObjectsWithLayerId"];
        importedEntities = store.getters["Modules/Modeler3D/importedEntities"];
        drawnStyle = {
            "selectedDrawType": store.getters["Modules/Modeler3D/selectedDrawType"],
            "currentLayout": store.getters["Modules/Modeler3D/currentLayout"]
        };
        clampToGround = store.getters["Modules/Modeler3D/clampToGround"];
        dimensions = store.getters["Modules/Modeler3D/dimensions"];
        hideObjects = store.getters["Modules/Modeler3D/hideObjects"];
        povActive = store.getters["Modules/Modeler3D/povActive"];

    }
    catch (error) {
        console.warn("jsonParse failed: could not parse\"" + drawnEntities + "or" + hiddenEntities + "\" to JSON: " + error);
        return {};
    }

    return {
        drawnEntities,
        hiddenEntities,
        importedEntities,
        drawnStyle,
        clampToGround,
        dimensions,
        hideObjects,
        povActive
    };
}

/**
 * Sets the state of Modeler3D
 * @param {Object} payload the payload
 * @returns {void}
 */
async function setModeler3DState (payload) {
    if (!isObject(payload?.drawnEntities) && !Array.isArray(payload?.hiddenEntities)) {
        return;
    }

    await store.dispatch("Modules/Modeler3D/resetAll");
    store.commit("Modules/Modeler3D/setIsApplyingState", true);
    if (payload.drawnEntities) {
        store.dispatch("Modules/Modeler3D/handleGeoJsonFile", JSON.stringify(payload.drawnEntities));
    }
    store.commit("Modules/Modeler3D/setClampToGround", payload.clampToGround);
    store.commit("Modules/Modeler3D/setDimensions", payload.dimensions);
    store.commit("Modules/Modeler3D/setSelectedDrawType", payload?.drawnStyle.selectedDrawType);
    store.commit("Modules/Modeler3D/setCurrentLayout", payload?.drawnStyle.currentLayout);
    store.commit("Modules/Modeler3D/setHideObjects", payload.hideObjects);
    store.dispatch("Modules/Modeler3D/bulkHideObjects", payload.hiddenEntities);
    store.commit("Modules/Modeler3D/setPovActive", payload.povActive);
    if (Array.isArray(payload.importedEntities)) {
        store.commit("Modules/Modeler3D/setCurrentView", "modeler-import");
        await store.dispatch("Modules/Modeler3D/createEntities", payload.importedEntities);
    }
    store.commit("Modules/Modeler3D/setCurrentModelId", null);
    store.commit("Modules/Modeler3D/setIsApplyingState", false);
    await nextTick();
}
