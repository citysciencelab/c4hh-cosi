import layerCollection from "@core/layers/js/layerCollection.js";
import {Style} from "ol/style.js";

/**
 * Hides or shows a feature of the WFS-T layer.
 * It is used to hide the edited feature, while its geometry is edited on the draw layer.
 * A shown feature gets the style of the layer again.
 * @param {String} wfstLayerId - Id of the WFS-T layer.
 * @param {String} featureId - Id of the feature.
 * @param {Boolean} visible - True to show the feature, false to hide it.
 * @returns {void}
 */
function setWfstFeatureVisibility (wfstLayerId, featureId, visible) {
    if (typeof featureId === "undefined" || featureId === null) {
        return;
    }

    const feature = layerCollection.getLayerById(wfstLayerId)?.getLayerSource()?.getFeatureById(featureId);

    feature?.setStyle(visible ? undefined : new Style());
}

export {setWfstFeatureVisibility};
