<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import {getArea, getLength} from "ol/sphere.js";
import {unByKey} from "ol/Observable.js";
import {Collection} from "ol";
import {Modify} from "ol/interaction.js";
import {pointerMove} from "ol/events/condition.js";
import VectorLayer from "ol/layer/Vector.js";
import selectInteraction from "@masterportal/masterportalapi/src/maps/interactions/selectInteraction.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import MeasureInMapTooltip from "./MeasureInMapTooltip.vue";
import MeasureList from "./MeasureList.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import source from "../js/measureSource.js";
import getStyle from "../js/measureStyle.js";
import {formatMeasurementNumber} from "../js/measureCalculation.js";
import {normalizeFeatureId, deepCloneCoords, findRemovedPoint} from "../js/measureUtils.js";

/**
 * Measurement tool to measure lines and areas in the map.
 * @module modules/MeasureInMap
 * @vue-data {String} deleteIcon - The icon for the delete button.
 * @vue-data {Object[]} currentSelectInteractions - Active OL select interactions.
 * @vue-data {module:ol/interaction/Modify} currentModifyInteraction - Active OL modify interaction.
 * @vue-data {module:ol/Feature} currentSketch - The feature currently being drawn.
 * @vue-data {Object[]} drawingPointHistory - Redo stack for points removed during active drawing.
 * @vue-data {Object} featureHistories - Per-feature undo/redo history stacks.
 * @vue-data {String|Number|null} currentlyModifyingFeatureId - ID of the feature currently in modify mode.
 * @vue-data {String|null} selectedEditInteraction - Name of the active edit mode button.
 * @vue-data {Number} geometryUpdateTrigger - Incremented to force reactivity on geometry changes.
 */
export default {
    name: "MeasureInMap",
    components: {
        MeasureInMapTooltip,
        MeasureList,
        FlatButton
    },
    data () {
        return {
            deleteIcon: "bi-trash",
            currentSelectInteractions: [],
            currentModifyInteraction: null,
            selectedEditInteraction: null,
            currentSketch: null,
            drawingPointHistory: [],
            featureHistories: {},
            currentlyModifyingFeatureId: null,
            geometryUpdateTrigger: 0
        };
    },
    computed: {
        ...mapGetters("Modules/Measure", [
            "featureId",
            "tooltipCoord",
            "interaction",
            "color",
            "source",
            "layer",
            "lines",
            "polygons",
            "geometryValues",
            "lineStringUnits",
            "polygonUnits",
            "selectedGeometry",
            "selectedLineStringUnit",
            "selectedPolygonUnit",
            "currentUnits",
            "enableUndoRedo",
            "measurementList"
        ]),
        ...mapGetters(["uiStyle"]),
        ...mapGetters("Maps", ["mode", "projection"]),

        /**
         * Filters the measurement list to exclude the active sketch and geometrically invalid features.
         * @returns {Array} Filtered measurement list
         */
        filteredMeasurementList () {
            return this.measurementList
                .filter(measurement => {
                    if (!this.currentSketch) {
                        return true;
                    }
                    return normalizeFeatureId(measurement.id) !== normalizeFeatureId(this.currentSketch.ol_uid);
                })
                .filter(measurement => this.isMeasurementValid(measurement.id));
        },

        /**
         * Enriches the filtered measurement list with per-feature canUndo/canRedo flags.
         * @returns {Array} Measurement list with canUndo/canRedo properties
         */
        enrichedMeasurementList () {
            this.geometryUpdateTrigger;
            return this.filteredMeasurementList.map(measurement => ({
                ...measurement,
                canUndo: this.getMeasurementCanUndo(measurement.id),
                canRedo: this.getMeasurementCanRedo(measurement.id)
            }));
        },

        /**
         * Returns info about the measurement currently being drawn, or null if not drawing.
         * @returns {Object|null} {type, displayValue} or null
         */
        activeMeasurementInfo () {
            this.geometryUpdateTrigger;
            if (!this.currentSketch) {
                return null;
            }
            const geometry = this.currentSketch.getGeometry();

            if (!geometry) {
                return null;
            }
            const type = geometry.getType();

            return {type, displayValue: this.formatLiveSketchValue(geometry, type)};
        },

        /**
         * Whether undo is possible during active drawing.
         * @returns {Boolean} True if at least one point has been placed
         */
        canUndoCurrentSketch () {
            if (!this.currentSketch) {
                return false;
            }
            const geometry = this.currentSketch.getGeometry();

            if (!geometry) {
                return false;
            }
            const geometryType = geometry.getType(),
                coords = geometryType === "LineString"
                    ? geometry.getCoordinates()
                    : geometry.getCoordinates()[0];

            return coords.length > 0;
        },

        /**
         * Whether redo is possible during active drawing.
         * @returns {Boolean} True if there are points in the drawing redo stack
         */
        canRedoCurrentSketch () {
            return this.currentSketch !== null && this.drawingPointHistory.length > 0;
        }
    },
    watch: {
        mode () {
            this.cleanupAllInteractions();
            this.createDrawInteraction();
            this.setFocusToFirstControl();
        },
        /**
         * Recreates the draw interaction when the geometry type changes.
         * Cleans up any active edit mode first.
         * @returns {void}
         */
        selectedGeometry () {
            this.cleanupAllInteractions();
            this.createDrawInteraction();
        },
        /**
         * Ensures all new measurements have an entry in the local featureHistories.
         * @param {Array} newList - Updated measurement list
         * @returns {void}
         */
        measurementList (newList) {
            const updatedHistories = {...this.featureHistories};

            newList.forEach(measurement => {
                const normalizedId = normalizeFeatureId(measurement.id);

                if (!updatedHistories[normalizedId]) {
                    updatedHistories[normalizedId] = {undo: [], redo: []};
                }
            });
            this.featureHistories = updatedHistories;
        },
        /**
         * Reacts to the draw interaction being replaced.
         * Registers drawstart/drawend listeners on the new interaction.
         * @param {module:ol/interaction/Draw} newInteraction - The new draw interaction
         * @returns {void}
         */
        interaction (newInteraction) {
            if (!newInteraction || !newInteraction.on) {
                return;
            }
            newInteraction.on("drawstart", evt => {
                this.currentSketch = evt.feature;
                this.drawingPointHistory = [];
                this.geometryUpdateTrigger++;

                const geometry = evt.feature.getGeometry();

                if (geometry) {
                    geometry.on("change", () => {
                        this.geometryUpdateTrigger++;
                    });
                }
            });

            newInteraction.on("drawend", evt => {
                const featureId = evt.feature.ol_uid,
                    geometry = evt.feature.getGeometry(),
                    geometryType = geometry.getType(),
                    history = this.getFeatureHistory(featureId);
                let coordinates;

                if (geometryType === "LineString") {
                    coordinates = geometry.getCoordinates();
                }
                else if (geometryType === "Polygon") {
                    coordinates = geometry.getCoordinates()[0].slice(0, -1);
                }

                if (coordinates && coordinates.length > 2) {
                    for (let i = 2; i < coordinates.length; i++) {
                        history.undo.push({
                            mode: "addPoint",
                            timestamp: Date.now(),
                            data: {point: coordinates[i], pointIndex: i, geometryType}
                        });
                    }
                }

                history.redo = [];
                this.currentSketch = null;
                this.drawingPointHistory = [];
            });
        }
    },
    created () {
        this.setLayer(new VectorLayer({
            source,
            id: "measureLayer",
            name: "measureLayer",
            style: getStyle(this.color),
            alwaysOnTop: true
        }));
        this.$store.dispatch("Maps/checkLayer", this.layer).then(layerExists => {
            if (!layerExists) {
                this.$store.dispatch("Maps/addLayer", this.layer);
            }
        });
    },
    mounted () {
        this.createDrawInteraction();
        this.setFocusToFirstControl();
    },
    unmounted () {
        this.removeIncompleteDrawing();
        this.removeDrawInteraction();
        this.currentSelectInteractions.forEach(inter => this.removeInteraction(inter));
        if (this.currentModifyInteraction) {
            this.removeInteraction(this.currentModifyInteraction);
        }
    },
    methods: {
        ...mapMutations("Modules/Measure", ["setSelectedGeometry", "setSelectedLineStringUnit", "setSelectedPolygonUnit", "setLayer", "setCustomName"]),
        ...mapActions("Modules/Measure", [
            "deleteFeatures",
            "createDrawInteraction",
            "removeDrawInteraction",
            "deleteSingleFeature",
            "removeTooltipForFeature",
            "updateTooltipPositionForFeature",
            "undoPointOnFeature",
            "redoPointOnFeature",
            "undoModifyCoordinates",
            "redoModifyCoordinates",
            "capturePreModifyCoords"
        ]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Sets focus to the first interactive control of the tool.
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs["measure-tool-geometry-select"] && !this.$refs["measure-tool-geometry-select"].disabled) {
                    this.$refs["measure-tool-geometry-select"].focus();
                }
                else if (this.$refs["measure-tool-unit-select"]) {
                    this.$refs["measure-tool-unit-select"].focus();
                }
            });
        },

        /**
         * Removes the last drawing if it has not been completed.
         * @returns {void}
         */
        removeIncompleteDrawing () {
            const feature = this.lines[this.featureId] || this.polygons[this.featureId];

            if (feature && feature.get("isBeingDrawn")) {
                const layerSource = this.layer.getSource();

                if (layerSource.getFeatures().length > 0) {
                    layerSource.removeFeature(layerSource.getFeatures().slice(-1)[0]);
                }
            }
        },

        /**
         * Returns true if the UI style is not SIMPLE or TABLE.
         * @returns {Boolean} Whether to show default style elements
         */
        isDefaultStyle () {
            return this.uiStyle !== "SIMPLE" && this.uiStyle !== "TABLE";
        },

        /**
         * Returns true if the map is in 3D mode.
         * @returns {Boolean} Whether the map is currently in 3D mode
         */
        is3DMode () {
            return this.mode === "3D";
        },

        /**
         * Sets the selected unit based on the currently active geometry type.
         * @param {String} value - The unit index as a string
         * @returns {void}
         */
        setSelectedUnit (value) {
            if (this.selectedGeometry === "LineString") {
                this.setSelectedLineStringUnit(value);
            }
            else {
                this.setSelectedPolygonUnit(value);
            }
        },

        /**
         * Formats the live display value of the active sketch geometry.
         * @param {module:ol/geom/Geometry} geometry - The sketch geometry
         * @param {String} type - Geometry type ("LineString" or "Polygon")
         * @returns {String} Formatted measurement value with unit
         */
        formatLiveSketchValue (geometry, type) {
            if (type === "LineString") {
                return this.formatLineLengthValue(geometry);
            }
            if (type === "Polygon") {
                return this.formatPolygonAreaValue(geometry);
            }
            return "";
        },

        /**
         * Formats a line length for live display during drawing.
         * @param {module:ol/geom/LineString} geometry - The line geometry
         * @returns {String} Formatted length with unit
         */
        formatLineLengthValue (geometry) {
            const length = getLength(geometry, {projection: this.projection.getCode()}),
                unit = this.lineStringUnits[this.selectedLineStringUnit];

            if (unit === "m") {
                return `${formatMeasurementNumber(length, length < 10 ? 1 : 0)} m`;
            }
            if (unit === "km") {
                return `${formatMeasurementNumber(length / 1000, 1)} km`;
            }
            if (unit === "nm") {
                return `${formatMeasurementNumber(length / 1852, 1)} nm`;
            }
            return "";
        },

        /**
         * Formats a polygon area for live display during drawing.
         * @param {module:ol/geom/Polygon} geometry - The polygon geometry
         * @returns {String} Formatted area with unit
         */
        formatPolygonAreaValue (geometry) {
            const area = getArea(geometry, {projection: this.projection.getCode()}),
                unit = this.polygonUnits[this.selectedPolygonUnit];

            if (unit === "m²") {
                return `${formatMeasurementNumber(area, area < 10 ? 1 : 0)} m²`;
            }
            if (unit === "ha") {
                return `${formatMeasurementNumber(area / 10000, 2)} ha`;
            }
            if (unit === "km²") {
                return `${formatMeasurementNumber(area / 1000000, 2)} km²`;
            }
            return "";
        },

        /**
         * Checks whether a measurement feature has enough coordinates to be displayed.
         * @param {String} featureId - The ol_uid of the feature
         * @returns {Boolean} True if the feature is valid
         */
        isMeasurementValid (featureId) {
            const feature = this.getFeatureById(featureId);

            if (!feature) {
                return false;
            }
            const geometry = feature.getGeometry();

            if (!geometry) {
                return false;
            }
            const type = geometry.getType();

            if (type === "LineString") {
                return geometry.getCoordinates().length >= 2;
            }
            if (type === "Polygon") {
                return (geometry.getCoordinates()[0] || []).length >= 4;
            }
            return true;
        },

        /**
         * Returns whether a completed measurement can be undone.
         * @param {String} featureId - The feature ID
         * @returns {Boolean} True if undo is possible
         */
        getMeasurementCanUndo (featureId) {
            const normalizedId = normalizeFeatureId(featureId),
                history = this.featureHistories[normalizedId];

            if (history && history.undo.length > 0) {
                return true;
            }
            const feature = this.getFeatureById(featureId);

            if (!feature) {
                return false;
            }
            const geometry = feature.getGeometry(),
                type = geometry.getType();

            if (type === "LineString") {
                return geometry.getCoordinates().length > 1;
            }
            if (type === "Polygon") {
                return (geometry.getCoordinates()[0] || []).length > 3;
            }
            return false;
        },

        /**
         * Returns whether a completed measurement can be redone.
         * @param {String} featureId - The feature ID
         * @returns {Boolean} True if redo is possible
         */
        getMeasurementCanRedo (featureId) {
            const normalizedId = normalizeFeatureId(featureId),
                history = this.featureHistories[normalizedId];

            return Boolean(history && history.redo.length > 0);
        },

        /**
         * Gets or creates the undo/redo history for a feature.
         * @param {String|Number} featureId - The feature ol_uid
         * @returns {{undo: Array, redo: Array}} The history stacks
         */
        getFeatureHistory (featureId) {
            const normalizedId = normalizeFeatureId(featureId);

            if (!this.featureHistories[normalizedId]) {
                this.featureHistories = {...this.featureHistories, [normalizedId]: {undo: [], redo: []}};
            }
            return this.featureHistories[normalizedId];
        },

        /**
         * Finds a measurement feature in the OL source by its ol_uid.
         * @param {String|Number} featureId - The feature's ol_uid
         * @returns {module:ol/Feature|undefined} The feature or undefined
         */
        getFeatureById (featureId) {
            const normalizedId = normalizeFeatureId(featureId);

            return source.getFeatures().find(f => {
                return f.get("featureId") === undefined && normalizeFeatureId(f.ol_uid) === normalizedId;
            });
        },

        /**
         * Switches between DRAW, MODIFY, DELETE and IDLE interaction modes.
         * @param {String} mode - One of: "DRAW", "MODIFY", "DELETE", "IDLE"
         * @param {String|Number|null} [targetFeatureId=null] - For MODIFY: the feature to restrict editing to
         * @returns {void}
         */
        setMode (mode, targetFeatureId = null) {
            this.cleanupAllInteractions();

            if (mode === "DRAW") {
                this.selectedEditInteraction = "";
                this.createDrawInteraction();
            }
            else if (mode === "MODIFY") {
                this.selectedEditInteraction = "modify";
                this.currentlyModifyingFeatureId = targetFeatureId;
                this.setupModifyInteraction(targetFeatureId);
            }
            else if (mode === "DELETE") {
                this.selectedEditInteraction = "delete";
                this.setupDeleteInteraction();
            }
            else if (mode === "IDLE") {
                this.selectedEditInteraction = "";
            }
        },

        /**
         * Removes all active OL interactions and resets the interaction state.
         * @returns {void}
         */
        cleanupAllInteractions () {
            if (this.interaction) {
                this.removeDrawInteraction();
            }
            if (this.currentModifyInteraction) {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
            this.currentSelectInteractions.forEach(inter => this.removeInteraction(inter));
            this.currentSelectInteractions = [];
            this.selectedEditInteraction = null;
            this.currentlyModifyingFeatureId = null;
        },

        /**
         * Creates OL select interactions for delete mode and adds them to the map.
         * Clicking a feature deletes it; hovering highlights it.
         * @returns {void}
         */
        setupDeleteInteraction () {
            this.currentSelectInteractions.forEach(inter => this.removeInteraction(inter));
            this.$nextTick(() => {
                this.currentSelectInteractions = this.createSelectInteractions(this.layer);

                const selectInter = this.currentSelectInteractions[0],
                    removeHandler = selectInter.on("select", evt => {
                        if (evt.selected.length > 0) {
                            const featureId = evt.selected[0].ol_uid;

                            this.deleteSingleFeature(featureId);
                            const deletedId = normalizeFeatureId(featureId),
                                remaining = {...this.featureHistories};

                            delete remaining[deletedId];
                            this.featureHistories = remaining;
                            this.$nextTick(() => {
                                this.setMode("DRAW");
                                unByKey(removeHandler);
                            });
                        }
                    });

                selectInteraction.removeSelectedFeature(selectInter, source);
                this.currentSelectInteractions.forEach(inter => this.addInteraction(inter));
            });
        },

        /**
         * Creates a pair of OL select interactions for the given layer.
         * @param {module:ol/layer/Vector} layer - The measurement vector layer
         * @returns {module:ol/interaction/Select[]} The created select interactions
         */
        createSelectInteractions (layer) {
            return [
                selectInteraction.createSelectInteraction(layer),
                selectInteraction.createSelectInteraction(layer, pointerMove)
            ];
        },

        /**
         * Creates an OL modify interaction, optionally restricted to one feature.
         * Records pre-modification coordinates to enable undo.
         * @param {String|Number|null} [featureId=null] - The feature to restrict modification to
         * @returns {void}
         */
        setupModifyInteraction (featureId = null) {
            this.currentlyModifyingFeatureId = featureId;

            if (this.currentModifyInteraction) {
                this.removeInteraction(this.currentModifyInteraction);
            }

            if (featureId) {
                const feature = this.getFeatureById(featureId);

                if (!feature) {
                    return;
                }
                this.currentModifyInteraction = new Modify({features: new Collection([feature])});
            }
            else {
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(source);
            }

            this.currentModifyInteraction.on("modifystart", event => {
                event.features.forEach(feature => this.capturePreModifyCoords(feature));
            });

            this.currentModifyInteraction.on("modifyend", event => {
                event.features.forEach(feature => {
                    const modFeatureId = feature.ol_uid,
                        geometry = feature.getGeometry(),
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
                        const history = this.getFeatureHistory(modFeatureId);

                        history.undo.push({
                            mode: "modifyCoordinates",
                            timestamp: Date.now(),
                            data: {previousCoordinates: beforeCoords, newCoordinates: deepCloneCoords(afterCoords), geometryType}
                        });
                        history.redo = [];
                    }
                    catch {
                        // deepClone failed; modification will not be undoable
                    }

                    feature.unset("_beforeModifyCoords");
                    this.$store.commit("Modules/Measure/addFeature", feature);
                });

                if (event.mapBrowserEvent) {
                    event.mapBrowserEvent.stopPropagation();
                }
            });

            this.addInteraction(this.currentModifyInteraction);
        },

        /**
         * Clears all measurements and resets all undo/redo history.
         * @returns {void}
         */
        regulateDeleteAll () {
            this.cleanupAllInteractions();
            this.featureHistories = {};
            this.currentSketch = null;
            this.drawingPointHistory = [];
            this.deleteFeatures();
            this.createDrawInteraction();
        },

        /**
         * Handles the undo action for a specific measurement.
         * During active drawing, undoes the last drawn point.
         * For completed features, reverts the last history entry.
         * @param {String} featureId - The feature ID to undo
         * @returns {void}
         */
        regulateUndo (featureId) {
            if (this.currentSketch && normalizeFeatureId(this.currentSketch.ol_uid) === normalizeFeatureId(featureId)) {
                this.undoLastPointInSketch();
                return;
            }

            const normalizedId = normalizeFeatureId(featureId),
                history = this.featureHistories[normalizedId],
                feature = this.getFeatureById(featureId);

            if (!feature) {
                return;
            }

            if (!history || history.undo.length === 0) {
                this.undoInitialPoint(feature, normalizedId);
                return;
            }

            const historyEntry = history.undo.pop();

            if (historyEntry.mode === "addPoint") {
                this.undoPointOnFeature({feature, historyEntry});
            }
            else if (historyEntry.mode === "modifyCoordinates") {
                this.undoModifyCoordinates({feature, historyEntry});
            }

            history.redo.push(historyEntry);
        },

        /**
         * Undoes the initial point of a feature that has no explicit history entry.
         * Synthesizes a history entry from the current geometry state.
         * @param {module:ol/Feature} feature - The feature to undo
         * @param {Number} normalizedId - The normalized feature ID
         * @returns {void}
         */
        undoInitialPoint (feature, normalizedId) {
            const geometry = feature.getGeometry(),
                geometryType = geometry.getType(),
                history = this.getFeatureHistory(normalizedId);
            let syntheticEntry;

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                if (coordinates.length <= 1) {
                    return;
                }
                syntheticEntry = {
                    mode: "addPoint",
                    timestamp: Date.now(),
                    data: {point: coordinates[coordinates.length - 1], pointIndex: coordinates.length - 1, geometryType}
                };
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                if (coordinates.length <= 3) {
                    return;
                }
                syntheticEntry = {
                    mode: "addPoint",
                    timestamp: Date.now(),
                    data: {point: coordinates[coordinates.length - 2], pointIndex: coordinates.length - 2, geometryType}
                };
            }

            if (syntheticEntry) {
                this.undoPointOnFeature({feature, historyEntry: syntheticEntry});
                history.redo.push(syntheticEntry);
            }
        },

        /**
         * Handles the redo action for a specific measurement.
         * During active drawing, redoes the last undone point.
         * For completed features, reapplies the last undone history entry.
         * @param {String} featureId - The feature ID to redo
         * @returns {void}
         */
        regulateRedo (featureId) {
            if (this.currentSketch && normalizeFeatureId(this.currentSketch.ol_uid) === normalizeFeatureId(featureId)) {
                this.redoLastPointInSketch();
                return;
            }

            const normalizedId = normalizeFeatureId(featureId),
                history = this.featureHistories[normalizedId],
                feature = this.getFeatureById(featureId);

            if (!feature || !history || history.redo.length === 0) {
                return;
            }

            const historyEntry = history.redo.pop();

            if (historyEntry.mode === "addPoint") {
                this.redoPointOnFeature({feature, historyEntry});
            }
            else if (historyEntry.mode === "modifyCoordinates") {
                this.redoModifyCoordinates({feature, historyEntry});
            }

            history.undo.push(historyEntry);
        },

        /**
         * Removes the last point from the active sketch using the OL Draw interaction.
         * Aborts the drawing if too few points remain.
         * @returns {void}
         */
        undoLastPointInSketch () {
            if (!this.currentSketch || !this.interaction) {
                return;
            }
            const geometry = this.currentSketch.getGeometry();

            if (!geometry) {
                return;
            }
            const geometryType = geometry.getType(),
                coordinatesBefore = geometryType === "LineString"
                    ? geometry.getCoordinates()
                    : geometry.getCoordinates()[0],
                minPoints = geometryType === "LineString" ? 1 : 2;

            if (coordinatesBefore.length <= minPoints) {
                this.drawingPointHistory.push({type: "point", coord: coordinatesBefore[0]});
                this.abortCurrentDrawing();
                return;
            }

            try {
                this.interaction.removeLastPoint();
                const coordinatesAfter = geometryType === "LineString"
                        ? geometry.getCoordinates()
                        : geometry.getCoordinates()[0],
                    minValidPoints = geometryType === "LineString" ? 2 : 3;

                if (coordinatesAfter.length <= minValidPoints) {
                    this.removeTooltipForFeature(this.currentSketch.ol_uid);
                    coordinatesAfter.forEach(coord => this.drawingPointHistory.push({type: "point", coord}));
                    this.abortCurrentDrawing();
                    return;
                }

                const removedPoint = findRemovedPoint(coordinatesBefore, coordinatesAfter);

                if (removedPoint) {
                    this.drawingPointHistory.push({type: "point", coord: removedPoint});
                }
            }
            catch {
                // ignore
            }
        },

        /**
         * Re-adds the last undone point to the active sketch.
         * Uses the OL Draw interaction's appendCoordinates when available.
         * @returns {void}
         */
        redoLastPointInSketch () {
            if (!this.currentSketch || !this.interaction || this.drawingPointHistory.length === 0) {
                return;
            }
            const lastEntry = this.drawingPointHistory.pop();

            if (!lastEntry || lastEntry.type !== "point") {
                return;
            }

            const geometry = this.currentSketch.getGeometry(),
                geometryType = geometry.getType();

            if (typeof this.interaction.appendCoordinates === "function") {
                try {
                    this.interaction.appendCoordinates([lastEntry.coord]);
                    return;
                }
                catch {
                    // appendCoordinates not available on this OL version; fall through to manual path
                }
            }

            if (geometryType === "LineString") {
                const coordinates = geometry.getCoordinates();

                coordinates.push(lastEntry.coord);
                geometry.setCoordinates(coordinates);
            }
            else if (geometryType === "Polygon") {
                const coordinates = geometry.getCoordinates()[0];

                coordinates.splice(coordinates.length - 1, 0, lastEntry.coord);
                geometry.setCoordinates([coordinates]);
            }

            geometry.changed();
        },

        /**
         * Aborts the current drawing and removes the incomplete sketch from the source.
         * @returns {void}
         */
        abortCurrentDrawing () {
            if (this.currentSketch) {
                this.removeTooltipForFeature(this.currentSketch.ol_uid);
                source.removeFeature(this.currentSketch);
                this.$store.commit("Modules/Measure/removeFeature", this.currentSketch.ol_uid);
            }
            if (this.interaction) {
                try {
                    this.interaction.abortDrawing();
                }
                catch {
                    // ignore
                }
            }
            this.currentSketch = null;
            this.drawingPointHistory = [];
        },

        /**
         * Toggles modify mode for a list item.
         * Exits modify mode if the feature is already being modified.
         * @param {String} featureId - The feature ID to toggle modification for
         * @returns {void}
         */
        handleModifyMeasurement (featureId) {
            const normalizedTarget = normalizeFeatureId(featureId),
                normalizedCurrent = this.currentlyModifyingFeatureId
                    ? normalizeFeatureId(this.currentlyModifyingFeatureId)
                    : null;

            if (this.selectedEditInteraction === "modify" && normalizedCurrent === normalizedTarget) {
                this.handleUnhighlightFeature(featureId);
                this.setMode("DRAW");
            }
            else {
                this.setMode("MODIFY", featureId);
            }
        },

        /**
         * Deletes a specific measurement and exits modify mode if it was active.
         * @param {String} featureId - The feature ID to delete
         * @returns {void}
         */
        handleDeleteMeasurement (featureId) {
            this.deleteSingleFeature(featureId);
            const deletedId = normalizeFeatureId(featureId),
                remaining = {...this.featureHistories};

            delete remaining[deletedId];
            this.featureHistories = remaining;
            if (this.selectedEditInteraction === "modify") {
                this.setMode("DRAW");
            }
        },

        /**
         * Saves a new custom name for a measurement.
         * @param {Object} payload - {featureId: String, name: String}
         * @returns {void}
         */
        handleRenameMeasurement (payload) {
            this.setCustomName(payload);
        },

        /**
         * Highlights a measurement feature on the map when hovered in the list.
         * @param {String} featureId - The feature ID to highlight
         * @returns {void}
         */
        handleHighlightFeature (featureId) {
            const feature = this.getFeatureById(featureId);

            if (feature && !feature.get("_isHighlighted")) {
                feature.set("_originalStyle", feature.getStyle());
                feature.set("_isHighlighted", true);
                feature.setStyle(getStyle([0, 89, 255, 1]));
            }
        },

        /**
         * Removes the highlight from a measurement feature.
         * @param {String} featureId - The feature ID to unhighlight
         * @returns {void}
         */
        handleUnhighlightFeature (featureId) {
            const feature = this.getFeatureById(featureId);

            if (feature && feature.get("_isHighlighted")) {
                const originalStyle = feature.get("_originalStyle");

                feature.setStyle(originalStyle || getStyle(this.color));
                feature.unset("_originalStyle");
                feature.unset("_isHighlighted");
            }
        }
    }
};
</script>

<template lang="html">
    <div id="measure">
        <MeasureInMapTooltip />

        <div class="form-floating mb-3">
            <select
                id="measure-tool-geometry-select"
                ref="measure-tool-geometry-select"
                class="form-select"
                :disabled="is3DMode()"
                :value="selectedGeometry"
                @change="setSelectedGeometry($event.target.value)"
            >
                <option
                    v-for="geometryValue in geometryValues"
                    :key="'measure-tool-geometry-select-' + geometryValue"
                    :value="geometryValue"
                >
                    {{ is3DMode()
                        ? "3D"
                        : $t("common:modules.measure." +
                            (geometryValue === "LineString" ? "stretch" : "area"))
                    }}
                </option>
            </select>
            <label for="measure-tool-geometry-select">
                {{ $t("common:modules.measure.geometry") }}
            </label>
        </div>

        <div class="form-floating mb-3">
            <select
                id="measure-tool-unit-select"
                ref="measure-tool-unit-select"
                class="form-select"
                :disabled="is3DMode()"
                :value="selectedGeometry === 'LineString' ? selectedLineStringUnit : selectedPolygonUnit"
                @change="setSelectedUnit($event.target.value)"
            >
                <option
                    v-for="(unit, i) in currentUnits"
                    :key="'measure-tool-unit-select-' + i"
                    :value="i"
                >
                    {{ unit }}
                </option>
            </select>
            <label for="measure-tool-unit-select">
                {{ $t("common:modules.measure.measure") }}
            </label>
        </div>

        <MeasureList
            v-if="enableUndoRedo && !is3DMode()"
            :measurement-list="enrichedMeasurementList"
            :selected-feature-id="featureId"
            :currently-modifying-feature-id="currentlyModifyingFeatureId"
            :active-measurement="activeMeasurementInfo"
            :can-undo-active="canUndoCurrentSketch"
            :can-redo-active="canRedoCurrentSketch"
            @modify-measurement="handleModifyMeasurement"
            @delete-measurement="handleDeleteMeasurement"
            @undo-action="regulateUndo"
            @redo-action="regulateRedo"
            @highlight-feature="handleHighlightFeature"
            @unhighlight-feature="handleUnhighlightFeature"
            @rename-measurement="handleRenameMeasurement"
            @undo-active-sketch="undoLastPointInSketch"
            @redo-active-sketch="redoLastPointInSketch"
        />

        <div class="d-flex justify-content-center my-3">
            <FlatButton
                id="measure-delete"
                :aria-label="$t('common:modules.measure.deleteAll')"
                :interaction="regulateDeleteAll"
                :text="$t('common:modules.measure.deleteAll')"
                :icon="deleteIcon"
                :disabled="source && source.getFeatures().length === 0"
            />
        </div>

        <div v-if="isDefaultStyle()">
            <div
                id="accordionFlushExample"
                class="accordion accordion-flush"
            >
                <div class="accordion-item">
                    <h2
                        id="flush-headingOne"
                        class="accordion-header"
                    >
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#flush-collapseOne"
                            aria-expanded="false"
                            aria-controls="flush-collapseOne"
                        >
                            <i class="bi-info-circle-fill me-2" />
                            {{ $t("common:modules.coordToolkit.info") }}
                        </button>
                    </h2>
                    <div
                        id="flush-collapseOne"
                        class="accordion-collapse collapse"
                        aria-labelledby="flush-headingOne"
                        data-bs-parent="#accordionFlushExample"
                    >
                        <div class="accordion-body inaccuracy-list">
                            {{ $t("common:modules.measure.influenceFactors") }}
                            <ul>
                                <li>{{ $t("common:modules.measure.scale") }}</li>
                                <li>{{ $t("common:modules.measure.resolution") }}</li>
                                <li>{{ $t("common:modules.measure.screenResolution") }}</li>
                                <li>{{ $t("common:modules.measure.inputAccuracy") }}</li>
                                <li>{{ $t("common:modules.measure.measureDistance") }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
