import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import {treeSubjectsKey} from "@shared/js/utils/constants.js";

const drawLayerId = "importDrawLayer",
    drawLayerConfig = {
        id: drawLayerId,
        name: drawLayerId,
        typ: "VECTORBASE",
        type: "layer",
        visibility: true,
        showInLayerTree: true,
        isDynamic: true
    };

/**
 * The actions for the draw module.
 * @module modules/draw/store/actionsDraw
 */
export default {
    /**
     * Initializes the draw layer by reusing an existing one or creating a new VECTORBASE layer.
     * @param {Object} context Vuex action context.
     * @returns {Object|null} The existing or newly created layer wrapper, or null if creation failed.
     */
    initializeDrawLayer ({dispatch}) {
        let existingLayer = layerCollection.getLayerById(drawLayerId);

        if (!existingLayer) {
            existingLayer = layerFactory.createLayer({
                ...drawLayerConfig,
                alwaysOnTop: true
            }, "2D");

            if (existingLayer) {
                layerCollection.addLayer(existingLayer);

                dispatch("addLayerToLayerConfig", {
                    layerConfig: drawLayerConfig,
                    parentKey: treeSubjectsKey
                }, {root: true});
            }
        }

        return existingLayer || null;
    },

    /**
     * Does not change the state. Lets tools like userTracking observe style changes of drawn features,
     * which are applied directly to the features and therefore trigger no mutation.
     * @param {Object} context Vuex action context.
     * @param {Object} payload The style change.
     * @param {String} payload.key The changed style property, e.g. "strokeWidth".
     * @param {*} payload.value The new value of the style property.
     * @returns {void}
     */
    featureStyleChanged () {
        // intentionally empty: only dispatched so that store subscribers are notified
    },

    /**
     * Does not change the state. Lets tools like userTracking observe actions of the edit toolbar and its dialogs
     * (e.g. undo, redo, deleteAll, download), which only affect the features and therefore trigger no mutation.
     * @param {Object} context Vuex action context.
     * @param {Object} payload The edit action.
     * @param {String} payload.action The performed action, e.g. "undo", "deleteFeature", "setDownloadFormat" or "downloadFile".
     * @param {String} [payload.format] The download format for "setDownloadFormat" and "downloadFile".
     * @returns {void}
     */
    editActionPerformed () {
        // intentionally empty: only dispatched so that store subscribers are notified
    }
};
