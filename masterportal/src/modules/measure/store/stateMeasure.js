import source from "../js/measureSource.js";

/**
 * Measure tool state definition.
 * @typedef {Object} MeasureState
 * @property {string} description The description that should be shown in the button in the menu.
 * @property {string} name displayed as title (config-param)
 * @property {boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {string} icon icon next to title (config-param)
 * @property {number} earthRadius earth radius to assume for length/area calculations (config-param)
 * @property {string} measurementAccuracy indicates how accurately the measurement result is displayed for m and m².
 *                                        Options are "decimeter" for one decimal place. "meter" for no decimal place.
 *                                        And "dynamic" for one decimal place for results smaller 10m / 10m² and
 *                                        no decimal place for results greater or equal 10m / 10m²
 * @property {Object.<string, module:ol/Feature>} lines line features by ol_uid
 * @property {Object.<string, module:ol/Feature>} polygons polygon features by ol_uid
 * @property {string[]} geometryValues Available geometry values for measurement selection
 * @property {string[]} lineStringUnits Available units for line measurement
 * @property {string[]} polygonUnits Available units for polygon measurement
 * @property {string} selectedGeometry Selected geometry value for measurement
 * @property {string} selectedLineStringUnit Selected unit by stringified index ("0"/"1").
 * @property {string} selectedPolygonUnit Selected unit by stringified index ("0"/"1").
 * @property {boolean} enableUndoRedo Enables the undo/redo feature and measurement list. When false, the tool behaves as before (config-param).
 * @property {Object} customNames Custom display names for measurements, keyed by feature ol_uid
 * @property {(module:ol/Interaction|MeasureDraw3d)} interaction current interaction on map or 3d model, if any
 * @property {module:ol/vector/Source} source draw layer source
 * @property {module:ol/vector/Layer} layer draw layer
 * @property {string} featureId ol_uid of the current feature
 * @property {number[]} tooltipCoord coordinates to show the tooltip at
 * @property {Object} featureHistories per-feature undo/redo history stacks, keyed by normalizedId
 * @property {module:ol/Feature|null} currentSketch OL feature currently being drawn
 * @property {Array} drawingPointHistory redo stack for points removed from the active sketch
 * @property {string|number|null} currentlyModifyingFeatureId ol_uid of the feature currently in modify mode
 * @property {string|null} selectedEditInteraction name of the active edit-mode button ("modify"|"delete"|""|null)
 * @property {module:ol/interaction/Select[]} currentSelectInteractions active OL select interactions
 * @property {module:ol/interaction/Modify|null} currentModifyInteraction active OL modify interaction
 * @property {number} geometryUpdateTrigger incremented to force recomputation of geometry-dependent getters
**/

const state = {
    description: "common:modules.measure.description",
    name: "common:modules.measure.name",
    hasMouseMapInteractions: true,
    icon: "bi-arrows-angle-expand",
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "measure",
    earthRadius: 6378137,
    measurementAccuracy: "meter",
    lines: {},
    polygons: {},
    geometryValues: ["LineString", "Polygon"],
    lineStringUnits: ["m", "km"],
    polygonUnits: ["m²", "km²"],
    selectedGeometry: "LineString",
    selectedLineStringUnit: "0",
    selectedPolygonUnit: "0",
    unlisteners: [],
    isDrawing: false,
    enableUndoRedo: false,
    customNames: {},
    color: [255, 127, 0, 1.0],
    interaction: null,
    source,
    layer: null,
    featureId: null,
    tooltipCoord: [],
    featureHistories: {},
    currentSketch: null,
    drawingPointHistory: [],
    currentlyModifyingFeatureId: null,
    selectedEditInteraction: null,
    currentSelectInteractions: [],
    currentModifyInteraction: null,
    geometryUpdateTrigger: 0
};

export default state;
