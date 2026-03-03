import {mapGetters} from "vuex";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import layerCollection from "@core/layers/js/layerCollection.js";

/**
 * Mixin to provide scaleIsOutOfRange behaviour.
 * @param {String} containerName the name of the itm, that holds the layerId
 */
export default (containerName) => ({
    computed: {
        ...mapGetters("Maps", ["scale", "scales", "mode"]),
        ...mapGetters(["layerConfigById"]),

        /**
         * @returns {object[]} raw layers of this item; empty if none
         */
        rawLayers () {
            const ids = (this[containerName].id ?? "").split("-");

            return ids
                .map((id) => rawLayerList.getLayerWhere({id}) ?? null)
                .filter((rawLayer) => Boolean(rawLayer));
        },

        /**
         * @returns {[number, number]} [minScale, maxScale] across all layers
         */
        rawLayersScaleBoundaries () {
            return this.rawLayers.reduce(
                ([accumulatorMinScale, accumulatorMaxScale], current) => {
                    const conf = this.layerConfigById(current.id),
                        minScale = conf ? conf.minScale : current.minScale,
                        maxScale = conf ? conf.maxScale : current.maxScale,
                        currentMinScale = parseInt(minScale, 10),
                        currentMaxScale = parseInt(maxScale, 10);

                    return [
                        isNaN(currentMinScale)
                            ? accumulatorMinScale
                            : Math.min(currentMinScale, accumulatorMinScale ?? Number.POSITIVE_INFINITY),
                        isNaN(currentMaxScale)
                            ? accumulatorMaxScale
                            : Math.max(currentMaxScale, accumulatorMaxScale ?? Number.NEGATIVE_INFINITY)
                    ];
                },
                [undefined, undefined]
            );
        },

        /**
         * Tooltip text explaining why a layer is disabled due to scale restrictions.
         * If both minScale and maxScale exist, it returns a formatted scale range explanation.
         * If only one is present, a generic "invisible layer" text is returned.
         * If no scale limits exist, an empty string is returned.
         *
         * @returns {String} The tooltip text for layers out of visible scale range.
         */
        tooltipText () {
            const [minScaleLayer, maxScaleLayer] = this.rawLayersScaleBoundaries;
            const minScaleRaw = minScaleLayer !== undefined
                    ? parseInt(minScaleLayer, 10)
                    : null,

                maxScale = maxScaleLayer !== undefined
                    ? parseInt(maxScaleLayer, 10)
                    : null,


                minScale = minScaleRaw === 0
                    ? this.scales[this.scales.length - 1]
                    : minScaleRaw;

            if (minScale && maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayer", {
                    minScale: "1: " + thousandsSeparator(minScale),
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            if (minScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMinScale", {
                    minScale: "1: " + thousandsSeparator(minScale)
                });
            }

            if (maxScale) {
                return this.$t("common:modules.layerTree.invisibleLayerMaxScale", {
                    maxScale: "1: " + thousandsSeparator(maxScale)
                });
            }

            return "";
        },

        /**
         * Returns true, if this layer is not visible in the maps current scale.
         * In mode 3D the layer is set visible/invisible depending on scale restrictions.
         * @returns {Boolean}  true, if this layer is not visible in the maps current scale
         */
        scaleIsOutOfRange () {
            const [minScale, maxScale] = this.rawLayersScaleBoundaries,
                isOutOfRange = this.scale < parseInt(minScale, 10) || this.scale > parseInt(maxScale, 10),
                layerId = this.rawLayers.length > 0 ? this.rawLayers[0].id : null,
                conf = this.layerConfigById(layerId);

            if (conf) {
                const layerEntry = layerCollection.getLayerById(layerId);

                if (this.mode === "3D" && conf.visibility === true && layerEntry && layerEntry.attributes && layerEntry.attributes.is3DLayer) {
                    if (isOutOfRange) {
                        layerEntry.layer.setVisible(false, mapCollection.getMap("3D"), layerEntry.attributes);
                    }
                    else {
                        layerEntry.layer.setVisible(true, mapCollection.getMap("3D"), layerEntry.attributes);
                    }
                }
                else if (this.mode === "3D" && conf.visibility === true && layerEntry && layerEntry.attributes) {
                    if (isOutOfRange) {
                        layerEntry.layer.setVisible(false);
                    }
                    else {
                        layerEntry.layer.setVisible(true);
                    }
                }
            }
            return isOutOfRange;
        }
    }
});
