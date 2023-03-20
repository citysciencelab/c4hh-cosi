import {generateSimpleGetters} from "../../../src/app-store/utils/generators";
import state from "./stateBoris";

const getters = {
    /**
     * Returns an object of simple getters for a state object, where
     * simple means that they will just return an entry for any key.
     * For example, given a state object {key: value}, an object
     * {key: state => state[key]} will be returned.
     * This is useful to avoid writing basic operations.
     * @param {object} state state to generate getters for
     * @returns {object.<string, function>} object of getters
     */
    ...generateSimpleGetters(state),
    /**
     * Gets the landuse by brwId if parametric URL is being used
     * @returns {String} returns the landuse of the selected feature
     */
    findLanduseByBrwId () {
        if (state.selectedPolygon !== undefined) {
            const landuseList = state.selectedPolygon.get("nutzungsart"),
                brwId = state.paramUrlParams.brwId,
                foundLanduse = landuseList.find((landuse) => {
                    if (landuse.richtwertnummer === brwId) {
                        return landuse;
                    }
                    console.warn("The parameter \"brwId\":" + brwId + "in the URL might be wrong.");
                    return undefined;
                });

            if (foundLanduse !== undefined) {
                return foundLanduse.nutzungsart;
            }
        }
        return undefined;
    },
    /**
     * Gets the name of the active layer as date
     * @param  {Backbone.Model[]} filteredLayerList List of all selected WMS Layers
     * @returns {String} layername which is used as date
     */
    getDateBySelectedLayerName () {
        let date = "";
        const selectedLayer = state.filteredLayerList.find(layer => layer.get("isSelected") === true);

        if (selectedLayer) {
            date = selectedLayer.get("name");
        }
        return date;
    }
};

export default getters;
