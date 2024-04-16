import store from "../../../src/app-store";
import isObject from "../../../src/utils/isObject";
import LoaderOverlay from "../../../src/utils/loaderOverlay";
import {nextTick} from "vue";

/**
 * Registers the Observer.
 * @param {Object} vueStore The store from the component.
 * @returns {void}
 */
export function register (vueStore) {
    vueStore.dispatch("Tools/SessionTool/register", {key: "Modeler3D", getter: getStateOfModeler3D, setter: setModeler3DState});
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
        drawnEntities = store.getters["Tools/Modeler3D/drawnEntities"];
        hiddenEntities = store.getters["Tools/Modeler3D/hiddenObjectsWithLayerId"];
        importedEntities = store.getters["Tools/Modeler3D/importedEntities"];
        drawnStyle = {
            "selectedDrawType": store.getters["Tools/Modeler3D/selectedDrawType"],
            "currentLayout": store.getters["Tools/Modeler3D/currentLayout"]
        };
        clampToGround = store.getters["Tools/Modeler3D/clampToGround"];
        dimensions = store.getters["Tools/Modeler3D/dimensions"];
        hideObjects = store.getters["Tools/Modeler3D/hideObjects"];
        povActive = store.getters["Tools/Modeler3D/povActive"];

    }
    catch (error) {
        console.warn("jsonParse failed: could not parse\"" + drawnEntities + "or" + hiddenEntities + "\" to JSON: " + error);
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
    LoaderOverlay.show();

    await store.dispatch("Tools/Modeler3D/resetAll");
    store.commit("Tools/Modeler3D/setIsApplyingState", true);
    store.commit("Tools/Modeler3D/setActive", true);
    if (payload.drawnEntities) {
        store.dispatch("Tools/Modeler3D/handleGeoJsonFile", JSON.stringify(payload.drawnEntities));
    }
    store.dispatch("Tools/Modeler3D/hideEntities", payload.hiddenEntities);
    store.commit("Tools/Modeler3D/setClampToGround", payload.clampToGround);
    store.commit("Tools/Modeler3D/setDimensions", payload.dimensions);
    store.commit("Tools/Modeler3D/setSelectedDrawType", payload?.drawnStyle.selectedDrawType);
    store.commit("Tools/Modeler3D/setCurrentLayout", payload?.drawnStyle.currentLayout);
    store.commit("Tools/Modeler3D/setHideObjects", payload.hideObjects);
    store.commit("Tools/Modeler3D/setPovActive", payload.povActive);
    if (Array.isArray(payload.importedEntities)) {
        store.commit("Tools/Modeler3D/setCurrentView", "import");
        await store.dispatch("Tools/Modeler3D/createEntities", payload.importedEntities);
    }
    store.commit("Tools/Modeler3D/setCurrentModelId", null);
    store.commit("Tools/Modeler3D/setIsApplyingState", false);
    await nextTick();
    LoaderOverlay.hide();
}
