import {markRaw} from "vue";
import Feature from "ol/Feature.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import {Fill, Stroke, Style} from "ol/style.js";
import {getPrimaryColor} from "@shared/js/utils/colors.js";

export function createAccuracyFeature () {
    return markRaw(new Feature());
}

export function initAccuracyLayer ({accuracyFeature, accuracyLayer, map}) {
    if (accuracyLayer !== null) {
        return {accuracyLayer};
    }

    const accuracyFillColor = getPrimaryColor(0.15);
    const accuracyStrokeColor = getPrimaryColor(0.9);
    const accuracySource = markRaw(new VectorSource());
    const nextAccuracyLayer = markRaw(new VectorLayer({
            id: "orientation_accuracy_layer",
            source: accuracySource,
            style: new Style({
                fill: new Fill({
                    color: accuracyFillColor
                }),
                stroke: new Stroke({
                    color: accuracyStrokeColor,
                    width: 2
                })
            }),
            zIndex: 9999
        }));

    accuracySource.addFeature(accuracyFeature);
    map.addLayer(nextAccuracyLayer);

    return {accuracyLayer: nextAccuracyLayer};
}

export function updateAccuracyGeometry ({showAccuracy, geolocation, projectionCode, accuracyFeature}) {
    if (!showAccuracy || geolocation === null) {
        return;
    }

    const accuracyGeometry = geolocation.getAccuracyGeometry();

    if (!accuracyGeometry) {
        return;
    }

    accuracyFeature.setGeometry(accuracyGeometry.clone().transform("EPSG:4326", projectionCode));
}

export function clearAccuracyGeometry ({geolocation, accuracyFeature, listener}) {
    if (geolocation) {
        geolocation.un("change:accuracyGeometry", listener);
    }
    accuracyFeature.setGeometry(null);
}

export function removeAccuracyLayer ({accuracyLayer, map}) {
    if (accuracyLayer === null) {
        return;
    }

    map.removeLayer(accuracyLayer);
}
