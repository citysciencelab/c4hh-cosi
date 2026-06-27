import * as Extent from "ol/extent";
import GeometryCollection from "ol/geom/GeometryCollection";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom";
import {
    lineString as turfLineString,
    featureCollection as turfFeatureCollection
} from "@turf/helpers";
import {buffer as turfBuffer} from "@turf/buffer";
import GeoJSON from "ol/format/GeoJSON";
import {transformFeatures} from "../../utils/features/transform";
import {styleIsochroneFeatures} from "../utils/styleIsochroneFeatures.js";
import {simplify} from "../../utils/geometry/simplify";
import {getFlatCoordinates} from "../../utils/geometry/getFlatCoordinates";
import {transformCoordinate} from "../utils/transformCoordinates";
import {getDistances, getSteps} from "../utils/getDistances";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";


export default {
    /**
     * create isochrones features
     * @returns {void}
     */
    createIsochrones: async function () {
        this.setSteps([0, 0, 0]);
        this.setIsochroneFeatures([]);
        try {
            if (this.activeMode.type === "point" || this.activeMode.type === "facility") {
                await this.createIsochronesPoint();
            }
            else if (this.activeMode.type === "route") {
                await this.createBufferFromDirections();
            }
        }
        catch (err) {
            if (err.request_canceled) {
                return;
            }

            // try {
            const code = (err.error || err).response.data.error.code;

            if (code === 3002 || code === 3099) {
                this.showErrorInvalidInput();
            }
            else {
                this.showError();
            }
            // }
            // catch (e) {
            //     console.error(e);
            //     this.showError();
            // }
        }
    },

    /**
     * TODO: see TODOs in createIsochronesRegion
     * create isochrones features for selected several coordiantes
     * @returns {void}
     */
    createIsochronesPoint: async function () {
        const
            {distance, maxDistance, steps} = getDistances(parseFloat(this.scaleUnitValue), this.useTravelTimeIndex, parseFloat(this.travelTime));

        if (
            this.coordinate.length > 0 &&
            this.transportType !== "" &&
            this.scaleUnit !== "" &&
            distance !== 0
        ) {

            const features = await this.getIsochrones({
                transportType: this.transportType,
                coordinates: this.coordinate,
                scaleUnit: this.scaleUnit,
                distance,
                maxDistance,
                mergePolygons: this.mergePolygons,
                baseUrl: this.baseUrl,
                serviceType: this.isochroneBackend,
                isochroneOptions: this.valhallaIsochroneOptions
            });

            this.setSteps(steps);
            this.setIsochroneFeatures(features);
            this.cleanup();
        }
        else {
            this.inputReminder();
        }
    },
    renderIsochrones (newFeatures) {
        this.getLayerById("accessibility-analysis").getLayer().getSource().clear();
        styleIsochroneFeatures(newFeatures, this.isochroneColors);
        this.getLayerById("accessibility-analysis").getLayer().getSource().addFeatures(newFeatures);
        // Removing the delay of zoomtiextent so that the full content of canvas for screenshot will be got.
        this.zoomToExtent({
            extent: this.getLayerById("accessibility-analysis").getLayer().getSource().getExtent(),
            options: {
                duration: 0,
                padding: this.zoomToExtentPadding
            }
        });
        this.setIsochroneAsBbox();
    },

    /**
     * Renders the direction features on the map.
     * @param {ol/Feature[]} newFeatures - The direction features to be rendered.
     * @returns {void}
     */
    renderDirections (newFeatures) {
        this.getLayerById("accessibility-directions").getLayer().getSource().clear();
        this.getLayerById("accessibility-directions").getLayer().getSource().addFeatures(newFeatures);
    },

    createBufferFromDirections: function () {
        let bufferFeatures;
        const
            featureType = "Erreichbarkeit entlang einer Route",
            distance = parseFloat(this.scaleUnitValue) / 1000,
            steps = [distance, distance * 2 / 3, distance / 3],
            coords = this.routingDirections?.lineString
                .map(pt => transformCoordinate(pt, this.projectionCode, "EPSG:4326")),
            lineString = turfLineString(coords),
            buffer = turfFeatureCollection(steps.map(dist => {
                return turfBuffer(lineString, dist);
            }));

        bufferFeatures = new GeoJSON().readFeatures(buffer);
        bufferFeatures = transformFeatures(bufferFeatures, "EPSG:4326", this.projectionCode);
        bufferFeatures.forEach((feature, i) => {
            feature.set("featureType", featureType);
            feature.set("value", steps[i]);
            feature.set("mode", this.transportType);
            feature.set("unit", this.scaleUnit);
        });

        this.setSteps(getSteps(parseFloat(this.scaleUnitValue)));
        this.setIsochroneFeatures(bufferFeatures);
    },

    /**
     * reminds user to set inputs
     * @returns {void}
     */
    inputReminder: function () {
        this.addSingleAlert({
            category: "Info",
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.inputReminder") + "</strong>",
            displayClass: "info"
        });
    },

    showError: function () {
        this.addSingleAlert({
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.showError") + "</strong>",
            category: "Fehler",
            displayClass: "error"
        });
    },
    showErrorInvalidInput: function () {
        this.addSingleAlert({
            content: "<strong>" + this.$t("additional:modules.tools.cosi.accessibilityAnalysis.showErrorInvalidInput") + "</strong>",
            category: "Fehler",
            displayClass: "error"
        });
    },

    /**
     * sets facility layers' bbox as the isochrones
     * @fires Core.ConfigLoader#RadioRequestParserGetItemsByAttributes
     * @returns {void}
     */
    setIsochroneAsBbox: function () {
        const polygonGeometry = this.isochroneFeatures[this.isochroneFeatures.length === 4 ? 1 : 0].getGeometry(),
            geometryCollection = new GeometryCollection([polygonGeometry]);

        this.allLayerConfigs.forEach(layerConfig => {
            layerConfig.bboxGeometry = geometryCollection;
        });
        setBBoxToGeom(this, geometryCollection, layerCollection.getLayers());
    },

    /**
    * resets facility layers' bbox
    * @returns {void}
    */
    resetIsochroneBBox () {
        setBBoxToGeom(this, this.boundingGeometry, layerCollection.getLayers());
    },

    getCoordinates: function (features, useOuterBoundaries) {
        if (Array.isArray(features) && features.length > 0) {
            return features
                .reduce((res, feature) => {
                    const geometry = feature.getGeometry();

                    if (geometry.getType() === "Point") {
                        return [...res, geometry.getCoordinates().splice(0, 2)];
                    }
                    if (useOuterBoundaries) {
                        return [...res, ...getFlatCoordinates(simplify(geometry, 10)) || [Extent.getCenter(geometry.getExtent())]];
                    }
                    return [...res, Extent.getCenter(geometry.getExtent())];

                }, []).map(coord => transformCoordinate(coord, this.projectionCode, "EPSG:4326"));
        }
        return null;
    }
};
