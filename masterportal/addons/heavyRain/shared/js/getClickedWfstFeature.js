import layerCollection from "@core/layers/js/layerCollection.js";
import {markRaw} from "vue";

/**
 * Gets the values of the feature of the WFS-T layer at the clicked pixel in the structure the modules use.
 * The geometry is cloned and marked as raw, so that Vue does not wrap the OpenLayers geometry in a reactive proxy.
 * @param {Object} evt - The OpenLayers map click event.
 * @param {String} wfstLayerId - Id of the WFS-T layer.
 * @param {Object} wfstAttributes - Names of the attributes of the feature type by their key in the form values.
 * @returns {Object|undefined} The id, geometry and form values of the clicked feature or undefined, if no feature was clicked.
 * The id is needed to update the feature in the service.
 */
function getClickedWfstFeature (evt, wfstLayerId, wfstAttributes) {
    const olLayer = layerCollection.getLayerById(wfstLayerId)?.getLayer(),
        feature = olLayer ? evt?.map?.forEachFeatureAtPixel(evt.pixel, feat => feat, {
            layerFilter: layer => layer === olLayer,
            hitTolerance: 1
        }) : undefined;

    if (!feature) {
        return undefined;
    }

    return {
        id: feature.getId(),
        geometry: markRaw(feature.getGeometry().clone()),
        formValues: Object.fromEntries(Object.entries(wfstAttributes).map(([key, attribute]) => [key, feature.get(attribute) ?? ""]))
    };
}

export {getClickedWfstFeature};
