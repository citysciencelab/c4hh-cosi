import {Collection} from "ol";
import {Modify} from "ol/interaction.js";
import {pointerMove} from "ol/events/condition.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import source from "./measureSource.js";
import {deepCloneCoords} from "./measureUtils.js";

/**
 * Default handler for geometry change events during modification.
 * @param {Function} onModifyChange - Callback to invoke on change
 * @param {module:ol/Feature} feature - The feature being modified
 * @returns {Function} Event handler function
 */
function makeGeometryChangeListener (onModifyChange, feature) {
    return function geometryChanged () {
        onModifyChange(feature);
    };
}

/**
 * Creates a pair of OL select interactions for the given layer (click-to-select and hover-highlight).
 * @param {module:ol/layer/Vector} layer - The measurement vector layer
 * @returns {module:ol/interaction/Select[]} [clickInteraction, hoverInteraction]
 */
export function createSelectInteractions (layer) {
    return [
        selectInteraction.createSelectInteraction(layer),
        selectInteraction.createSelectInteraction(layer, pointerMove)
    ];
}

/**
 * Creates and configures an OL Modify interaction for a measurement feature.
 * Fires callbacks on modifystart (for capturing pre-modification state) and modifyend
 * (for recording the coordinate change in the undo history).
 * @param {String|Number|null} featureId - Feature to restrict editing to; null = all source features
 * @param {Function} getFeatureById - Looks up an OL Feature by its ol_uid
 * @param {Object} callbacks
 * @param {Function} callbacks.onModifyStart - Called with (feature) before the modification
 * @param {Function} [callbacks.onModifyChange] - Called with (feature) during the modification for live updates (optional)
 * @param {Function} callbacks.onModifyEnd - Called with (feature, beforeCoords, afterCoords, geometryType) after the modification
 * @returns {module:ol/interaction/Modify|null} The configured Modify interaction, or null if featureId was given but not found
 */
export function createMeasureModifyInteraction (featureId, getFeatureById, {onModifyStart, onModifyChange, onModifyEnd}) {
    let interaction;
    const geometryChangeListeners = new Map();

    if (featureId) {
        const feature = getFeatureById(featureId);

        if (!feature) {
            return null;
        }
        interaction = new Modify({features: new Collection([feature])});
    }
    else {
        interaction = modifyInteraction.createModifyInteraction(source);
    }

    interaction.on("modifystart", event => {
        event.features.forEach(feature => {
            onModifyStart(feature);
            if (onModifyChange) {
                const geometry = feature.getGeometry();
                const changeListener = makeGeometryChangeListener(onModifyChange, feature);

                geometry.on("change", changeListener);
                geometryChangeListeners.set(feature.ol_uid, {geometry, changeListener});
            }
        });
    });

    interaction.on("modifyend", event => {
        event.features.forEach(feature => {
            const listenerInfo = geometryChangeListeners.get(feature.ol_uid);

            if (listenerInfo) {
                listenerInfo.geometry.un("change", listenerInfo.changeListener);
                geometryChangeListeners.delete(feature.ol_uid);
            }

            const geometry = feature.getGeometry(),
                geometryType = geometry.getType(),
                beforeCoords = feature.get("_beforeModifyCoords");
            let afterCoords;

            if (geometryType === "LineString") {
                afterCoords = geometry.getCoordinates();
            }
            else if (geometryType === "Polygon") {
                afterCoords = geometry.getCoordinates()[0];
            }

            try {
                onModifyEnd(feature, beforeCoords, deepCloneCoords(afterCoords), geometryType);
            }
            catch {
                // deepClone failed; modification will not be undoable
            }

            feature.unset("_beforeModifyCoords");
        });

        if (event.mapBrowserEvent) {
            event.mapBrowserEvent.stopPropagation();
        }
    });

    return interaction;
}
