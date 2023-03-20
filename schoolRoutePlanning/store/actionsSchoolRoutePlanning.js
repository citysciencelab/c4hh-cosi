import actionsSchoolRoutePlanningAddresses from "./actions/actionsSchoolRoutePlanningAddresses";
import actionsSchoolRoutePlanningPrint from "./actions/actionsSchoolRoutePlanningPrint";
import actionsSchoolRoutePlanningSchoolWay from "./actions/actionsSchoolRoutePlanningSchoolWay";

export default {
    ...actionsSchoolRoutePlanningAddresses,
    ...actionsSchoolRoutePlanningPrint,
    ...actionsSchoolRoutePlanningSchoolWay,

    /**
     * Sets the geometry for the route features and zoom to the feature extent.
     * @param {Object} context The vuex context.
     * @param {Object} targetElement The payload element.
     * @param {String} targetElement.featureId Id of the feature (startPoint | endPoint).
     * @param {ol/Source} targetElement.source Vector source of the route layer.
     * @param {String} targetElement.geometry Geometry of the feature.
     * @returns {void}
     */
    setGeometryByFeatureId ({commit}, targetElement) {
        const featureId = targetElement.id,
            source = targetElement.source,
            geometry = targetElement.geometry;

        commit("setFilteredHouseNumbers", []);
        if (source.getFeatureById(featureId)) {
            source.getFeatureById(featureId).setGeometry(geometry);
        }

        if (geometry.getType() === "Point") {
            Radio.trigger("MapView", "setCenter", geometry.getCoordinates(), 5);
        }
        else {
            const options = {
                duration: 0,
                callback: () => Radio.trigger("MapView", "setZoomLevelDown")
            };

            Radio.trigger("Map", "zoomToExtent", {extent: source.getExtent(), options: options});
        }
    },

    /**
     * Sets the initialize school number.
     * @param {Object} context The vuex context.
     * @param {String} schoolNumber The number of the school.
     * @returns {void}
     */
    selectInitializeSchoolNumber ({commit}, schoolNumber) {
        commit("setInitialSelectedSchoolNumber", schoolNumber);
    }
};
