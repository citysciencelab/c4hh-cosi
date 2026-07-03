import {markRaw} from "vue";
import Feature from "ol/Feature.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import {Fill, Stroke, Style} from "ol/style.js";

export function createAccuracyFeature () {
    return markRaw(new Feature());
}

export function initAccuracyLayer ({accuracyFeature, accuracyLayer, map}) {
    if (accuracyLayer !== null) {
        return {accuracyLayer, accuracySource: null};
    }

    const accuracySource = markRaw(new VectorSource()),
        nextAccuracyLayer = markRaw(new VectorLayer({
            id: "orientation_accuracy_layer",
            source: accuracySource,
            style: new Style({
                fill: new Fill({
                    color: "rgba(100, 100, 255, 0.2)"
                }),
                stroke: new Stroke({
                    color: "#0000ff",
                    width: 2
                })
            }),
            zIndex: 9999
        }));

    accuracySource.addFeature(accuracyFeature);
    map.addLayer(nextAccuracyLayer);

    return {accuracyLayer: nextAccuracyLayer, accuracySource};
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
