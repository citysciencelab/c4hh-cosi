import Layer2d from "@core/layers/js/layer2d";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";
import {GeoJSON} from "ol/format";
import {all, bbox} from "ol/loadingstrategy.js";

/**
 * @import {FeatureLoader} from "ol/featureloader"
 */

/**
 * Masterportal layer for an OpenLayers WebGL vector layer.
 * @extends Layer2d
 */
export default class Layer2dWebGLVector extends Layer2d {

    /**
     * Prevents the default error listener from being added.
     * @override
     * @returns {void}
     */
    addErrorListener () {
        // overridden to prevent faulty inherited error listener from Layer2d
    }

    /**
     * Creates the OpenLayers WebGL vector layer.
     * @override
     * @returns {void}
     */
    createLayer () {
        const opacity = (100 - this.attributes.transparency) / 100;
        const url = `${this.attributes.url}`;
        const bboxCrs = this.attributes.bboxCrs ?? "http://www.opengis.net/def/crs/EPSG/0/25832";
        const crs = this.attributes.crs ?? "http://www.opengis.net/def/crs/EPSG/0/25832";
        const strategy = this.attributes.loadingStrategy === "bbox" ? bbox : all;

        const source = new VectorSource({
            loader: this.attributes.typ === "OAF" ? loader : undefined,
            strategy
        });

        this.layer = new WebGLVectorLayer({
            source,
            opacity,
            variables: this.attributes.variables,
            style: this.attributes.style,
            properties: {
                gfiAttributes: this.attributes.gfiAttributes,
                id: this.attributes.id,
                name: this.attributes.name,
                typ: this.attributes.typ
            }
        });

        let abortController = null;
        let currentExtent = null;
        const view = mapCollection.getMap("2D").getView();

        view.on(["change:resolution", "change:center"], removeCurrentExtent);
        this.layer.on("change:visible", () => {
            if (this.layer.isVisible()) {
                view.on(["change:resolution", "change:center"], removeCurrentExtent);
            }
            else {
                view.un(["change:resolution", "change:center"], removeCurrentExtent);
            }
        });

        /**
         * Removes the currently loaded extent from the source.
         * @returns {void}
         */
        function removeCurrentExtent () {
            if (currentExtent) {
                source.removeLoadedExtent(currentExtent);
                source.changed();
            }
        }

        /**
         *@type {FeatureLoader}
         */
        async function loader (extent) {
            abortController?.abort();
            abortController = new AbortController();
            currentExtent = extent;

            const {signal} = abortController;
            const bboxParam = extent.every(isFinite) ? "bbox=" + extent.join(",") : "";
            let nextLink = `${url}?${bboxParam}&bbox-crs=${bboxCrs}&crs=${crs}&limit=10000`;

            try {
                while (nextLink && !signal.aborted) {
                    const response = await fetch(nextLink, {signal});

                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    const json = await response.json();

                    source.addFeatures(new GeoJSON().readFeatures(json));
                    nextLink = json.links?.find(link => link.rel === "next")?.href;
                }
                return [];
            }
            catch (error) {
                if (error.name !== "AbortError") {
                    throw error;
                }
                return [];
            }
        }
    }

    /**
     * @override
     * Creates the legend for the layer.
     * @returns {string[]} An array containing the legend URL.
     */
    createLegend () {
        if (!this.attributes.legendURL) {
            return [];
        }
        return [this.attributes.legendURL];
    }
}
