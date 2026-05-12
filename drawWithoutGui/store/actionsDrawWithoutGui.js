import mapCollection from "@core/maps/js/mapCollection";
import crs from "@masterportal/masterportalapi/src/crs.js";
import Draw from "ol/interaction/Draw.js";
import Modify from "ol/interaction/Modify.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Style from "ol/style/Style.js";
import CircleStyle from "ol/style/Circle.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import {GeoJSON} from "ol/format.js";

export default {
    /**
     * Initializes the drawing functionality without GUI on the map.
     *
     * Adds a vector layer and sets up drawing and modifying interactions for the specified geometry type.
     * Optionally initializes the layer with a provided GeoJSON feature and zooms to its extent.
     *
     * @param {Object} context - Vuex action context object.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Object} params - Parameters for initialization.
     * @param {string} params.drawType - The type of geometry to draw ("Point", "LineString", "Polygon", etc.).
     * @param {Array<number>} [params.color] - RGB color array for the feature style (e.g., [255, 0, 0]).
     * @param {number} [params.opacity=0.5] - Opacity for the fill color (0 to 1).
     * @param {Object|string} [params.initialJSON] - Optional GeoJSON to initialize the layer with features.
     * @param {boolean} [params.transformWGS=false] - Whether to transform coordinates from WGS84 to the map's projection.
     * @param {boolean} [params.zoomToExtent=false] - Whether to zoom to the extent of the initial feature.
     * @returns {void}
     */
    initDrawWithoutGUI ({dispatch}, {drawType, color = [255, 0, 0], opacity = 0.5, initialJSON = null, transformWGS = false, zoomToExtent = false}) {
        const rgbaColorFill = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`,
            rgbColorStroke = `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
            map = mapCollection.getMap("2D"),
            source = new VectorSource(),
            drawLayer = new VectorLayer({
                source: source,
                style: (feature) => {
                    if (feature.getGeometry().getType() === "Point") {
                        return [
                            new Style({
                                image: new CircleStyle({
                                    radius: 10,
                                    fill: new Fill({color: rgbaColorFill}),
                                    stroke: new Stroke({color: rgbColorStroke, width: 2})
                                })
                            })
                        ];
                    }
                    else if (feature.getGeometry().getType() === "LineString") {
                        return [
                            new Style({
                                stroke: new Stroke({color: rgbColorStroke, width: 2})
                            })
                        ];
                    }
                    else if (feature.getGeometry().getType() === "Polygon") {
                        return [
                            new Style({
                                fill: new Fill({color: rgbaColorFill}),
                                stroke: new Stroke({color: rgbColorStroke, width: 2})
                            })
                        ];
                    }
                    return null;
                }
            });

        if (map.getLayers().getArray().find(layer => layer.get("id") === "drawWithoutGuiLayer")) {
            dispatch("clearLayer");
        }

        drawLayer.set("name", "drawWithoutGuiLayer");
        drawLayer.set("id", "drawWithoutGuiLayer");
        drawLayer.setZIndex(1000);
        map.addLayer(drawLayer);

        if (initialJSON && typeof initialJSON === "string" || initialJSON instanceof Object) {
            const format = new GeoJSON(),
                features = format.readFeatures(initialJSON, {
                    featureProjection: crs.getMapProjection(map),
                    dataProjection: transformWGS ? "EPSG:4326" : crs.getMapProjection(map)
                });

            if (features && features.length > 0) {
                if (zoomToExtent) {
                    map.getView().fit(features[0].getGeometry().getExtent(), {duration: 1000, padding: [40, 20, 40, 20]});
                }

                source.addFeatures(features);
            }
        }

        const draw = new Draw({
                source: source,
                type: drawType
            }),
            modify = new Modify({source: source, hitTolerance: 20});

        // Add modify interaction once and keep it active
        map.addInteraction(modify);

        if (!initialJSON) {
            map.addInteraction(draw);
        }

        // we use the addfeature event instead of drawend to ensure that the feature is already added to the source
        // when we finalize and send the GeoJSON via the remote interface.
        source.on("addfeature", event => {
            dispatch("finalizeAndSendGeoJSON", {event, interaction: draw});
        });

        modify.on("modifyend", event => {
            dispatch("finalizeAndSendGeoJSON", {event});
        });
    },
    /**
     * Removes the "drawWithoutGuiLayer" vector layer from the map if it exists.
     * This action clears all drawn features by removing the associated layer from the map.
     *
     * @returns {void}
     */
    clearLayer () {
        const map = mapCollection.getMap("2D"),
            drawLayer = map.getLayers().getArray().find(layer => layer.get("id") === "drawWithoutGuiLayer");

        if (drawLayer) {
            map.removeLayer(drawLayer);
        }
    },
    /**
     * Cancels the drawing interaction without GUI by removing the Draw or Modify interaction from the map.
     *
     * Removes the active drawing or modifying interaction from the map, effectively stopping any ongoing drawing process.
     *
     * @returns {void}
     */
    cancelDrawWithoutGUI () {
        const map = mapCollection.getMap("2D"),
            drawInteraction = map.getInteractions().getArray().find(interaction => interaction instanceof Draw || interaction instanceof Modify);

        if (drawInteraction) {
            map.removeInteraction(drawInteraction);
        }
    },
    /**
     * Creates and returns a GeoJSON of all drawn features without GUI.

     * @param {Object} context actions context object
     * @param {Object} payload payload object.
     * @param {String} payload.prmObject An Object which includes the parameters.
     * @param {Boolean} payload.prmObject.transformWGS The coordinates of the features are transformed from WGS84 to UTM32 if set to true.
     * @param {module:ol/Feature} payload.currentFeature Last drawn feature (drawend event).
     * @returns {Promise<Object>} A promise that resolves to the modified GeoJSON object with all drawn features, optionally transformed to WGS84 if specified in the parameters.
     */
    downloadFeaturesWithoutGUI ({rootState}, payload) {
        return new Promise((resolve) => {
            let features,
                featuresConverted = {"type": "FeatureCollection", "features": []},
                singleGeom,
                targetProjection = null;
            const featureArray = [],
                format = new GeoJSON(),
                mapProjection = crs.getMapProjection(mapCollection.getMap(rootState.Maps.mode)),
                map = mapCollection.getMap("2D"),
                drawLayer = map.getLayers().getArray().find(layer => layer.get("id") === "drawWithoutGuiLayer");

            if (payload?.prmObject?.transformWGS) {
                targetProjection = "EPSG:4326";
            }
            if (payload?.prmObject?.targetProjection !== undefined) {
                targetProjection = payload.prmObject.targetProjection;
            }

            if (drawLayer !== undefined && drawLayer !== null) {
                features = drawLayer.getSource().getFeatures();

                features.forEach(feature => {
                    if (targetProjection !== null) {
                        singleGeom = feature.clone();
                        singleGeom.getGeometry().transform(mapProjection, targetProjection);
                    }
                    else {
                        singleGeom = feature;
                    }

                    featureArray.push(singleGeom);
                });

                featuresConverted = format.writeFeaturesObject(featureArray);
            }

            resolve(featuresConverted);
        });
    },
    /**
     * Returns the center point of a Line or Polygon or a point itself.
     * If a targetprojection is given, the values are transformed.
     *
     * @param {Object} prm Parameter object.
     * @param {module:ol/Feature} prm.feature Line, Polygon or Point.
     * @param {String} prm.targetProjection Target projection if the projection differs from the map's projection.
     * @returns {module:ol/coordinate~Coordinate} Coordinates of the center point of the geometry.
     */
    createCenterPoint ({rootState}, {feature, targetProjection}) {
        let centerPoint,
            centerPointCoords = [];

        const featureType = feature.getGeometry().getType(),
            map = mapCollection.getMap(rootState.Maps.mode);

        if (featureType === "LineString") {
            if (targetProjection !== undefined) {
                centerPointCoords = crs.transform(crs.getMapProjection(map), targetProjection, feature.getGeometry().getCoordinateAt(0.5));
            }
            else {
                centerPointCoords = feature.getGeometry().getCoordinateAt(0.5);
            }
        }
        else if (featureType === "Point") {
            if (targetProjection !== undefined) {
                centerPointCoords = crs.transform(crs.getMapProjection(map), targetProjection, feature.getGeometry().getCoordinates());
            }
            else {
                centerPointCoords = feature.getGeometry().getCoordinates();
            }
        }
        else if (featureType === "Polygon") {
            if (targetProjection !== undefined) {
                centerPoint = crs.transform(crs.getMapProjection(map), targetProjection, feature.getGeometry().getInteriorPoint().getCoordinates());
            }
            else {
                centerPoint = feature.getGeometry().getInteriorPoint().getCoordinates();
            }
            centerPointCoords = centerPoint.slice(0, -1);
        }

        return centerPointCoords;
    },
    /**
     * Adds a center point to the properties of the first feature in the given GeoJSON object.
     *
     * @param {Object} _ Unused Vuex context parameter.
     * @param {Object} params Parameters object.
     * @param {Array|Object} params.centerPoint The center point to add, typically an object with type "Point" and coordinates.
     * @param {Object|string} params.geoJSON The GeoJSON object to which the center point will be added.
     * @returns {Object} The modified GeoJSON object with the center point added to the first feature's properties.
     */
    addCenterPoint ({dispatch}, {feature, targetProjection, geoJSON}) {
        return dispatch("createCenterPoint", {feature: feature, targetProjection: targetProjection}).then(centerPoint => {
            const geoJSONAddCenter = geoJSON;

            if (geoJSONAddCenter.features.length === 0) {
                return geoJSON;
            }

            if (geoJSONAddCenter.features[0].properties === null) {
                geoJSONAddCenter.features[0].properties = {};
            }

            geoJSONAddCenter.features[0].properties.centerPoint = {type: "Point", coordinates: centerPoint};

            return geoJSONAddCenter;
        });
    },
    /**
     * Finalizes the drawing process and sends the resulting GeoJSON with a center point to the remote interface if configured.
     * @param {Object} context - Vuex action context object.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Object} context.rootState - Vuex root state object.
     * @param {Object} payload - Payload object.
     * @param {Object} payload.event - The event object from the draw or modify interaction containing the drawn or modified feature.
     * @param {module:ol/interaction/Draw} [payload.interaction=null] - The draw interaction to be removed after drawing.
     * @returns {void}
     */
    finalizeAndSendGeoJSON ({dispatch, rootState}, {event, interaction = null}) {
        if (typeof rootState.configJs?.inputMap !== "undefined" && rootState.configJs?.inputMap !== null) {
            const feature = event.feature ? event.feature : event.features.getArray()[0],
                {targetProjection} = rootState.configJs.inputMap,
                map = mapCollection.getMap("2D");

            if (interaction) {
                // Remove draw interaction after drawing
                map.removeInteraction(interaction);
            }

            dispatch("downloadFeaturesWithoutGUI", {prmObject: {targetProjection}, currentFeature: feature})
                .then(geoJSON => dispatch("addCenterPoint", {feature, targetProjection, geoJSON}))
                .then(geoJSONwithCenter => {
                    if (
                        this.$app.config.globalProperties.$remoteInterface &&
                        geoJSONwithCenter?.features[0]?.properties?.centerPoint
                    ) {
                        this.$app.config.globalProperties.$remoteInterface.sendMessage({
                            "drawEnd": JSON.stringify(geoJSONwithCenter)
                        });
                    }
                });
        }
    }

};
