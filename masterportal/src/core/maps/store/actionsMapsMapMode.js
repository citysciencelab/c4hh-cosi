import proj4 from "proj4";

/**
 * Controls the exchange of the map. E.g. the change from 2D to 3D mode.
 */
export default {
    /**
     * Changes the map mode from 2D to 3D and vice versa.
     * @param {Object} param store context.
     * @param {Object} param.getters the getters.
     * @param {Object} param.dispatch the dispatch.
     * @param {String} targetMode The target map mode.
     * @returns {void}
     */
    changeMapMode ({getters, dispatch}, targetMode) {
        const currentMode = getters.mode;

        if (currentMode !== targetMode) {
            if (targetMode === "2D") {
                dispatch("registerMapListener");
                dispatch("activateMap2d");
            }
            else if (targetMode === "3D") {
                dispatch("unregisterMapListener");
                dispatch("activateMap3d");
            }
        }

        window.trackMatomo?.("MapMode", "Mapmode switched", "Mapmode switched to " + targetMode);
    },

    /**
     * Activates the 2D map mode.
     * @param {Object} param store context.
     * @param {Object} param.commit the commit.
     * @returns {void}
     */
    activateMap2d ({commit}) {
        const map3d = mapCollection.getMap("3D");

        map3d?.setEnabled(false);
        commit("setMode", "2D");
    },

    /**
     * Activates the 3D map mode.
     * @param {Object} param store context.
     * @param {Object} param.commit the commit.
     * @param {Object} param.dispatch the dispatch.
     * @param {Object} param.rootState the rootState.
     * @returns {void}
     */
    activateMap3d ({commit, dispatch, rootState}) {
        const map3d = mapCollection.getMap("3D");

        dispatch("checkInitial3dCenterPositionChange");
        if (map3d) {
            map3d.setEnabled(true);
            commit("setMode", "3D");
        }
        else {
            rootState.portalConfig.map.startingMapMode = "3D";
        }
    },

    /**
     * If center of the map has changed since start of the app and map3dParameter.camera is configured,
     * the position of the map3d camera is set to current center.
     * @param {Object} param store context.
     * @param {Object} param.commit the commit.
     * @param {Object} param.dispatch the dispatch.
     * @param {Object} param.rootGetters the rootGetters.
     */
    checkInitial3dCenterPositionChange ({commit, dispatch, rootGetters}) {
        const latitudeOffset = rootGetters.map3dParameter.camera ? rootGetters.map3dParameter.camera.offset : false,
            initialCenter = rootGetters["Maps/initialCenter"],
            initialZoom = rootGetters["Maps/initialZoom"],
            currentCenter = rootGetters["Maps/center"],
            currentZoom = rootGetters["Maps/zoom"];

        if (latitudeOffset && ((initialCenter[0] !== currentCenter[0] || initialCenter[1] !== currentCenter[1] || initialZoom !== currentZoom)
            && rootGetters.map3dParameter.camera.positionInitiallyUsed === undefined)) {
            const [longitude, latitude] = proj4(rootGetters["Maps/projection"].getCode(), "EPSG:4326", [currentCenter[0], currentCenter[1]]),
                cameraPosition = rootGetters.map3dParameter.camera.cameraPosition;
            let offset = parseFloat(latitudeOffset);

            if (isNaN(offset)) {
                console.warn("map3dParameter.camera.offset must be a number! Using offset 0. Please correct your config.json.");
                offset = 0;
            }
            commit("useCameraPosition", [longitude, latitude + offset, cameraPosition[2]], {root: true});
            dispatch("Maps/setCamera", rootGetters.map3dParameter, {root: true});
        }
    }
};
