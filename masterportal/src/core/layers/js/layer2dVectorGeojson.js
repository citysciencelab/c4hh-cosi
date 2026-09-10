import Cluster from "ol/source/Cluster.js";
import {geojson} from "@masterportal/masterportalapi/src/index.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import Layer2dVector from "./layer2dVector.js";

/**
 * Creates a 2d vector geojson layer.
 * @name Layer2dVectorGeojson
 * @constructs
 * @extends Layer2dVector
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
export default function Layer2dVectorGeojson (attributes) {
    const defaultAttributes = {
    };

    this.attributes = Object.assign(defaultAttributes, attributes);
    Layer2dVector.call(this, this.attributes);
}

Layer2dVectorGeojson.prototype = Object.create(Layer2dVector.prototype);

/**
 * Creates a layer of type Geojson by using geojson-layer of the masterportalapi.
 * Sets all needed attributes at the layer and the layer source.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.createLayer = function (attributes) {
    const rawLayerAttributes = this.getRawLayerAttributes(attributes),
        layerParams = this.getLayerParams(attributes),
        options = this.getOptions(attributes);

    this.setLayer(geojson.createLayer(rawLayerAttributes, {layerParams, options}));
};

/**
 * Gets raw layer attributes from attributes.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The raw layer attributes.
 */
Layer2dVectorGeojson.prototype.getRawLayerAttributes = function (attributes) {
    return {
        clusterDistance: attributes.clusterDistance,
        features: attributes.geojson,
        id: attributes.id,
        url: attributes.url
    };
};

/**
 * Gets additional options.
 * @param {Object} attributes The attributes of the layer configuration.
 * @returns {Object} The options.
 */
Layer2dVectorGeojson.prototype.getOptions = function (attributes) {
    const options = {
        afterLoading: (features) => this.afterLoading(attributes, features),
        clusterGeometryFunction: this.clusterGeometryFunction,
        featuresFilter: (features) => this.featuresFilter(attributes, features),
        map: mapCollection.getMap("2D"),
        onLoadingError: this.onLoadingError,
        layerStyle: this.getStyleFunction(attributes)
    };

    return options;
};

/**
 * Prepare feature ids after loading of geojson.
 * @param {Object} attributes The attributes of the layer configuration.
 * @param {module:ol/Feature~Feature[]} features The ol features.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.afterLoading = function (attributes, features) {
    if (Array.isArray(features)) {
        features.forEach((feature, idx) => {
            if (typeof feature?.getId === "function" && typeof feature.getId() === "undefined") {
                feature.setId("geojson-" + attributes.id + "-feature-id-" + idx);
            }
        });
        this.applyFeaturesFilter(attributes, features);
        this.prepareFeaturesFor3D(this.layer?.getSource().getFeatures());
    }
};

/**
 * Drops the features rejected by featuresFilter from the layer source.
 * A GeoJSON layer is loaded by OpenLayers' plain url loader, which - unlike the WFS
 * and OAF loaders in masterportalapi - never calls the options.featuresFilter passed
 * in getOptions, so a configured bboxGeometry had no effect at all. Only touches the
 * source when there is a bboxGeometry, i.e. never for a plain GeoJSON layer.
 * @param {Object} attributes The attributes of the layer configuration.
 * @param {module:ol/Feature~Feature[]} features The loaded ol features.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.applyFeaturesFilter = function (attributes, features) {
    if (!attributes.bboxGeometry) {
        return;
    }
    const layerSource = this.layer?.getSource(),
        // with clusterDistance set, the layer source is a Cluster wrapping the real one
        source = typeof layerSource?.getSource === "function" ? layerSource.getSource() : layerSource,
        keptFeatures = new Set(this.featuresFilter(attributes, features));

    if (typeof source?.removeFeature !== "function") {
        return;
    }
    features
        .filter(feature => !keptFeatures.has(feature))
        .forEach(feature => source.removeFeature(feature));
};

/**
 * Creates the legend.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.createLegend = async function () {
    const styleObject = styleList.returnStyleObject(this.get("styleId"));
    let legend = this.inspectLegendUrl();

    if (!Array.isArray(legend)) {
        if (styleObject && legend === true) {
            const legendInfos = await createStyle.returnLegendByStyleId(styleObject.styleId);

            legend = sortByStyleLabelOrder(legendInfos.legendInformation, styleObject);

        }
        else if (typeof legend === "string") {
            legend = [legend];
        }
    }

    return legend;
};

/**
 * Load the features manually.
 * @param {Object} attributes The new attributes.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.loadFeaturesManually = function (attributes) {
    geojson.loadFeaturesManually(this.getRawLayerAttributes(attributes), this.layer.getSource());
};

/**
 * Sorts legend entries by the order of the style labels.
 * Falls back to conditions.properties when legendValue is not present.
 * @param {*} legendInformation The legend information as returned from the returnLegendByStyleId function.
 * @param {*} styleObject The style object containing the configured styling rules.
 */
function sortByStyleLabelOrder (legendInformation, styleObject) {
    const orderedLegendKeys = styleObject.rules
        .map(rule => getLegendKeyFromRule(rule))
        .filter(key => key !== null);

    const result = [...legendInformation];
    const knownPositions = result.reduce((acc, entry, idx) => {
        if (orderedLegendKeys.includes(entry.label)) {
            acc.push(idx);
        }
        return acc;
    }, []);

    const sortedKnownEntries = knownPositions
        .map(idx => result[idx])
        .sort((a, b) => orderedLegendKeys.indexOf(a.label) - orderedLegendKeys.indexOf(b.label));

    knownPositions.forEach((idx, i) => {
        result[idx] = sortedKnownEntries[i];
    });

    return result;
}

/**
 * Returns sortable legend key from style rule.
 * Uses legendValue first, then first condition value as fallback.
 * @param {Object} rule The style rule.
 * @returns {String|null} The sortable key or null.
 */
function getLegendKeyFromRule (rule) {
    if (rule?.style?.legendValue) {
        return rule.style.legendValue;
    }
    const condProps = rule?.conditions?.properties;

    if (!condProps) {
        return null;
    }

    if (Array.isArray(condProps)) {
        return condProps
            .map(prop => String(prop?.value))
            .join(", ");
    }
    return Object.values(condProps).map(value => String(value)).join(", ");
}

/**
 * Creates and starts an interval to refresh the layer.
 * @param {Number} autoRefresh The interval in milliseconds.
 * @returns {void}
 */
Layer2dVectorGeojson.prototype.startAutoRefresh = function (autoRefresh) {
    this.setIntervalAutoRefresh(setInterval(() => {
        const layerSource = this.getLayerSource() instanceof Cluster ? this.getLayerSource()?.getSource() : this.getLayerSource();

        if (!layerSource) {
            return;
        }
        this.prepareLayerSourceForRefresh(layerSource);

        layerSource.once("featuresloadend", () => {
            this.afterLoading(this.attributes, this.layer?.getSource?.()?.getFeatures?.());
            this.autoRefreshObserver.forEach(callback => callback());
        });
        layerSource.refresh();
    }, autoRefresh));
};
