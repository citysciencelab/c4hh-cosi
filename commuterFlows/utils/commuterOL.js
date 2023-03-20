import {Circle, Fill, Style, Stroke, Text} from "ol/style.js";
import {extend as olExpandExtent} from "ol/extent.js";
import VectorLayer from "ol/layer/Vector";
import {Point} from "ol/geom.js";
import Feature from "ol/Feature.js";
import uniqueId from "../../../src/utils/uniqueId.js";
import thousandsSeparator from "../../../src/utils/thousandsSeparator";
import {CommuterAnimation} from "./commuterAnimation.js";

/**
 * CommuterOL is the OpenLayers api for the Tool "CommuterFlows"
 * <pre>
 * CommuterOL provides easy access to OpenLayers
 *
 * To import CommuterOL: import {CommuterOL} from "./commuterOL";
 * create a new object:        const obj = new CommuterOL(...);
 * </pre>
 * @class
 * @memberof Addons.CommuterFlows
 */
export class CommuterOL {
    /**
     * constructor of CommuterOL
     * @param {Object} options the config for this object
     * @param {String} options.font the font to use for captions as ol/Text.font
     * @param {Object} options.fontShadow the shadow for the captions as ol/Stroke options
     * @param {Object} options.beam the style for the lines (beams) as ol/Stroke options
     * @param {Number} options.bubblePixelMax the maximum radius for bubbles in px
     * @param {Number} options.bubblePixelMin the minimum radius for bubbles in px
     * @param {Object} options.bubbleBorder the style of the border of bubbles as ol/Stroke options
     * @param {Number[]} options.bubbleColors the colors to use for the bubbles as list of rgby colors
     * @param {Number[]} options.bubbleColorShift the highlight/lowlight shifting added to bubbleColors before repeating the colors
     * @param {Object} options.zoomOptions the options for the zoom function given to the ol event for zooming
     * @param {Number[]} options.animationPaces the pace for the animation: even idx for forwards speed in ms, odd idx for backwards speed in ms, leave a zero to jump forwards/backwards
     * @param {Object} [olMock=null] the mock for the OpenLayers functions for testing
     * @constructor
     * @returns {CommuterOL} the instance of CommuterOL
     */
    constructor (options, olMock = null) {
        this.options = Object.assign({
            font: "10pt sans-serif",
            fontShadow: {
                color: [255, 255, 255, 0.9],
                width: 5
            },
            beam: {
                // color: [192, 9, 9, 1],
                width: 3
            },
            bubblePixelMax: 50,
            bubblePixelMin: 20,
            bubbleBorder: {
                color: [60, 60, 60, 1],
                width: 0.5
            },
            // Color Universal Design see http://people.apache.org/~crossley/cud/cud.html
            bubbleColors: [
                [230, 159, 0, 0.75],
                [86, 180, 233, 0.75],
                [0, 158, 115, 0.75],
                [240, 228, 66, 0.75],
                [0, 114, 178, 0.75],
                [213, 94, 0, 0.75],
                [204, 121, 167, 0.75]
            ],
            // highlight / lowlight colors depending on depth
            bubbleColorShift: [0, -60, 60],
            zoomOptions: {
                padding: [20, 20, 20, 400]
            },
            // an array[a, b] to describe the speed with - a is forward, b is backward - if set to 0, forward/backward is not animated
            animationPaces: [6000, 300]
        }, options);

        this.ol = Object.assign(this.getOpenlayersConnectors(), olMock);
        this.layers = {
            beams: null,
            bubbles: null,
            animation: null,
            captions: null
        };
        this.ol.createLayerIfNotExists("CommuterOL_layerBeams", layer => {
            this.layers.beams = layer;
        });
        this.ol.createLayerIfNotExists("CommuterOL_layerBubbles", layer => {
            this.layers.bubbles = layer;
        });
        this.ol.createLayerIfNotExists("CommuterOL_layerAnimation", layer => {
            this.layers.animation = layer;
        });
        this.ol.createLayerIfNotExists("CommuterOL_layerCaptions", layer => {
            this.layers.captions = layer;
        });

        this.animation = null;
    }

    /**
     * returns an object containing all functions to call openlayers with
     * @returns {Object} an object with functions
     */
    getOpenlayersConnectors () {
        return {
            createLayerIfNotExists: (labelname, onsuccess) => {
                const promise = Radio.request("Map", "createLayerIfNotExists", labelname);

                if (promise instanceof VectorLayer) {
                    onsuccess(promise);
                }
                else if (promise instanceof Promise) {
                    promise.then(layer => {
                        onsuccess(layer);
                    });
                }
            },
            getFeatures: layer => {
                if (layer instanceof VectorLayer) {
                    return layer.getSource().getFeatures();
                }
                return null;
            },
            addFeature: (layer, feature) => {
                if (layer instanceof VectorLayer && feature instanceof Feature) {
                    layer.getSource().addFeature(feature);
                }
            },
            clearLayer: layer => {
                if (layer instanceof VectorLayer) {
                    layer.getSource().clear();
                }
            },
            zoomToExtent: extent => {
                Radio.trigger("Map", "zoomToExtent", {extent, options: this.options.zoomOptions});
            },
            showLayer: layer => {
                if (layer instanceof VectorLayer) {
                    layer.setVisible(true);
                }
            },
            hideLayer: layer => {
                if (layer instanceof VectorLayer) {
                    layer.setVisible(false);
                }
            },
            render: () => {
                Radio.trigger("Map", "render");
            },
            onPostRender: (layer, event) => {
                if (layer instanceof VectorLayer && typeof event === "function") {
                    layer.on("postrender", event);
                }
            },
            unPostRender: (layer, event) => {
                if (layer instanceof VectorLayer && typeof event === "function") {
                    layer.un("postrender", event);
                }
            },
            expandExtent: (extent1, extent2) => {
                return olExpandExtent(extent1, extent2);
            }
        };
    }


    // public

    /**
     * removes all layers, stops any animation
     * @returns {void}
     */
    clearLayers () {
        this.removeCaptions();
        this.removeBeams();
        this.removeAnimation();
    }

    /**
     * adds captions
     * @param {String} centerCaption the text to visualize as center
     * @param {Number[]} centerCoordinate the coordinate to visualize as center
     * @param {ol/Feature[]} featureList a list of features with values caption, value and coordinate
     * @param {Boolean} [showCaption=true] set to false if no caption should be visualized
     * @param {Boolean} [showNumbers=true] set to false if numbers shouldn't be visualized
     * @returns {void}
     */
    addCaptions (centerCaption, centerCoordinate, featureList, showCaption = true, showNumbers = true) {
        this.removeCaptions();
        if (!showCaption && !showNumbers) {
            return;
        }
        const crnl = "\n";

        // add center caption
        if (showCaption) {
            this.ol.addFeature(this.layers.captions, this.getFeatureCaption(centerCaption, centerCoordinate));
        }

        // add leaf captions and numbers
        featureList.forEach(feature => {
            let caption = "";

            if (showCaption) {
                caption += feature.get("caption") + crnl;
            }
            if (showNumbers) {
                caption += thousandsSeparator(feature.get("value")) + crnl;
            }
            if (showCaption && showNumbers) {
                // add one more break if captions are on two lines
                caption += crnl;
            }

            this.ol.addFeature(this.layers.captions, this.getFeatureCaption(caption + crnl, feature.get("coordinate")));
        });
    }
    /**
     * removes captions
     * @returns {void}
     * @post the captions layer is clear
     */
    removeCaptions () {
        this.ol.clearLayer(this.layers.captions);
    }

    /**
     * adds beams
     * @param {ol/Feature[]} featureList a list of features with values caption, value and coordinate
     * @returns {void}
     */
    addBeams (featureList) {
        this.removeBeams();
        if (!Array.isArray(featureList) || !featureList.length) {
            return;
        }

        featureList.forEach((feature, idx) => {
            this.ol.addFeature(this.layers.beams, this.getFeatureBeam(feature, idx));
        });
    }
    /**
     * removes beams
     * @returns {void}
     * @post the captions layer is clear
     */
    removeBeams () {
        this.ol.clearLayer(this.layers.beams);
    }

    /**
     * initializes the animation and adds bubbles to the bubbles layer
     * @param {ol/Feature[]} featureList a list of features to calculate their extent from
     * @param {Number} maxValue the highest value of all features of the featureList to calculate the bubble radius
     * @param {String} [algorithm="area"] the algorithm to use for the calculation ("area" or "radius")
     * @returns {void}
     */
    initAnimation (featureList, maxValue, algorithm = "area") {
        this.removeAnimation();

        if (!Array.isArray(featureList) || !featureList.length) {
            return;
        }
        const calcRadius = this.getRadiusAlgorithm(algorithm);

        featureList.forEach((feature, idx) => {
            const radius = calcRadius(feature.get("value"), maxValue, this.options.bubblePixelMax, this.options.bubblePixelMin),
                color = this.getColor(idx),
                bubble = this.getFeatureBubble(feature, radius, color);

            this.ol.addFeature(this.layers.bubbles, bubble);
        });
        this.animation = new CommuterAnimation(
            featureList,
            this.options.animationPaces,
            this.layers.bubbles,
            this.layers.animation,
            this.ol,
            (feature, idx) => {
                // creates a bubble style for the animated feature
                const radius = calcRadius(feature.get("value"), maxValue, this.options.bubblePixelMax, this.options.bubblePixelMin),
                    color = this.getColor(idx);

                return this.getBubbleStyle(radius, color, this.options.bubbleBorder);
            }
        );
    }
    /**
     * starts the animation
     * @returns {void}
     * @post the animation is running
     */
    startAnimation () {
        if (this.animation instanceof CommuterAnimation) {
            this.animation.start();
        }
    }
    /**
     * stops the animation
     * @returns {void}
     * @post the animation has been stoped
     */
    stopAnimation () {
        if (this.animation instanceof CommuterAnimation) {
            this.animation.stop();
        }
    }
    /**
     * checkes whether or not the animation is running
     * @returns {Boolean} true if the animation is currently running
     */
    isAnimationRunning () {
        return this.animation instanceof CommuterAnimation && this.animation.isRunning();
    }
    /**
     * removes the animation and stops it if it is running
     * @returns {void}
     * @post the animation has been stoped and the layer is clear
     */
    removeAnimation () {
        this.stopAnimation();
        this.animation = null;
        this.ol.clearLayer(this.layers.bubbles);
        this.ol.clearLayer(this.layers.animation);
    }

    /**
     * calls the ol.zoomToExtent function with the maximum extent of the given featureList
     * @param {ol/Feature[]} featureList a list of features to calculate their extent from
     * @returns {void}
     */
    zoomToExtent (featureList) {
        const extent = this.getExtentOfFeatures(featureList);

        this.ol.zoomToExtent(extent);
    }

    /**
     * returns the color for the given index (e.g. of a featureList)
     * @param {Number} idx the index to choose the color for
     * @returns {Number[]} the resulting rgba color
     */
    getColor (idx) {
        return this.getBubbleColor(idx, this.options.bubbleColors, this.options.bubbleColorShift);
    }


    // private

    /**
     * creates a new feature to visualize a caption with
     * @param {String} caption the text to visualize
     * @param {Number[]} coordinate the coordinate
     * @returns {ol/Feature} the new caption feature
     */
    getFeatureCaption (caption, coordinate) {
        const point = new Point(coordinate),
            feature = new Feature(point);

        feature.set("styleId", uniqueId("CommuterOL"));
        feature.setStyle(new Style({
            text: new Text({
                text: caption,
                font: this.options.font,
                placement: "point",
                stroke: new Stroke(this.options.fontShadow)
            })
        }));

        return feature;
    }
    /**
     * creates a new feature to visualize a beam
     * @param {ol/Feature} blueprint the feature to use as blueprint
     * @param {Number} idx the index of this feature (of a feature list) to calculate its color
     * @returns {ol/Feature} the new beam feature
     */
    getFeatureBeam (blueprint, idx) {
        const feature = new Feature({
                geometry: blueprint.getGeometry()
            }),
            strokeStyle = Object.assign({
                color: this.getColor(idx)
            }, this.options.beam);

        feature.set("styleId", uniqueId("CommuterOL"));
        feature.setStyle(new Style({
            stroke: new Stroke(strokeStyle)
        }));

        return feature;
    }

    /**
     * creates a new feature to visualize a bubble with given radius and color
     * @param {ol/Feature} blueprint feature to use as blueprint
     * @param {Number} radius the radius
     * @param {color} color the color
     * @returns {void}
     */
    getFeatureBubble (blueprint, radius, color) {
        const coord = blueprint.get("coordinate"),
            feature = new Feature(
                new Point(coord)
            );

        feature.set("styleId", uniqueId("CommuterOL"));
        feature.setStyle(this.getBubbleStyle(radius, color, this.options.bubbleBorder));

        return feature;
    }

    /**
     * creates a style for a bubble based on the given radius, color and bubble-border
     * @param {Number} radius the radius
     * @param {color} color the color
     * @param {Object} bubbleBorder the description of the border to use (stroke options)
     * @returns {void}
     */
    getBubbleStyle (radius, color, bubbleBorder) {
        return new Style({
            image: new Circle({
                radius,
                fill: new Fill({color}),
                stroke: new Stroke(bubbleBorder)
            })
        });
    }

    /**
     * calculates the maximum extent to fit all the given features into
     * @param {ol/Feature[]} featureList the features to calculate the extent from
     * @returns {Number[]} array of 4 numbers as maximum extent or an empty array if no extent was calculated
     */
    getExtentOfFeatures (featureList) {
        if (!Array.isArray(featureList) || !featureList.length) {
            return [];
        }
        let result = null;

        featureList.forEach(feature => {
            if (!(feature instanceof Feature)) {
                return;
            }
            const extent = feature.getGeometry().getExtent();

            if (!result) {
                result = extent;
                return;
            }
            this.ol.expandExtent(result, extent);
        });

        return result;
    }

    /**
     * returns a color from the configured color list
     * shifts colors with the configured color shifting before repeating the process
     * @param {Number} idx the index of the color to be generated (e.g. the index in a list of features)
     * @param {Number[]} colorSet a list of rgba colors to use in a cycle (you may want to use Color Universal Design see http://people.apache.org/~crossley/cud/cud.html)
     * @param {Number[]} colorShift a list of numbers by which the colorSet is shifted each cycle before restarting the proccess (e.g. [0, -60, 60] for "normal" -> "60 darker" -> "60 lighter" -> "normal" -> ...)
     * @returns {Number[]} the representation of an rgba color to use for the given index or black on errors
     */
    getBubbleColor (idx, colorSet, colorShift) {
        if (typeof idx !== "number" || idx < 0) {
            return [0, 0, 0, 1];
        }

        if (
            !Array.isArray(colorSet)
            || !Array.isArray(colorShift)
            || !colorSet.length
            || !colorShift.length
        ) {
            return [0, 0, 0, 1];
        }
        const color = colorSet[idx % colorSet.length],
            shifting = colorShift[Math.floor(idx / colorSet.length) % colorShift.length];

        if (!Array.isArray(color) || color.length !== 4) {
            return [0, 0, 0, 1];
        }
        else if (typeof shifting !== "number") {
            return color;
        }

        return [
            Math.min(255, Math.max(0, color[0] + shifting)),
            Math.min(255, Math.max(0, color[1] + shifting)),
            Math.min(255, Math.max(0, color[2] + shifting)),
            Math.min(1, Math.max(0, color[3]))
        ];
    }

    /**
     * returns the function to use to calculate the radius of a bubble with
     * @param {String} algorithm the algorithm to use
     * @returns {Function} the function(value, maxValue, maxPx, minPx) to use for the calculation
     */
    getRadiusAlgorithm (algorithm) {
        switch (algorithm) {
            case "area":
                return this.calcRadiusArea;
            case "linear":
                return this.calcRadiusLinear;
            case "log":
                return this.calcRadiusLog10;
            default:
                return this.calcRadiusArea;
        }
    }

    /**
     * calculates the exact radius to represent the given sizes as circle area
     * @param {Number} value the amount for the circle area
     * @param {Number} maxValue the maximum amount for the biggest circle possible
     * @param {Number} maxRadiusPx the maximum size of the biggest circle in pixels
     * @returns {Number} the radius to use for the exact cirle area
     */
    calcRadiusArea (value, maxValue, maxRadiusPx) {
        if (typeof value !== "number" || typeof maxValue !== "number" || typeof maxRadiusPx !== "number") {
            return 0;
        }
        else if (value <= 0 || maxValue <= 0 || maxRadiusPx <= 0) {
            return 0;
        }
        else if (value >= maxValue) {
            return maxRadiusPx;
        }
        const maxR = Math.sqrt(maxValue / Math.PI),
            r = Math.sqrt(value / Math.PI);

        return maxRadiusPx / maxR * r;
    }
    /**
     * calculates the radius by ratio of the max radius
     * @param {Number} value the amount for the ratio of the max radius
     * @param {Number} maxValue the maximum amount for the biggest radius possible
     * @param {Number} maxRadiusPx the maximum size of the biggest radius in pixels
     * @param {Number} [minRadiusPx=0] the minimum size of the smalest radius in pixels (to avoid tiny bubbles)
     * @returns {Number} the radius to use
     */
    calcRadiusLinear (value, maxValue, maxRadiusPx, minRadiusPx = 0) {
        if (typeof minRadiusPx !== "number") {
            return 0;
        }
        else if (typeof value !== "number" || typeof maxValue !== "number" || typeof maxRadiusPx !== "number") {
            return minRadiusPx;
        }
        else if (maxRadiusPx <= minRadiusPx) {
            return minRadiusPx;
        }
        else if (value <= 0) {
            return minRadiusPx;
        }
        else if (maxValue <= 0) {
            return minRadiusPx;
        }
        else if (value >= maxValue) {
            return maxRadiusPx;
        }

        return (maxRadiusPx - minRadiusPx) / maxValue * value + minRadiusPx;
    }
    /**
     * calculates the radius on a logarithmic scale
     * @param {Number} value the amount for the ratio of the max radius
     * @param {Number} maxValue the maximum amount for the biggest radius possible
     * @param {Number} maxRadiusPx the maximum size of the biggest radius in pixels
     * @param {Number} [minRadiusPx=0] the minimum size of the smalest radius in pixels
     * @returns {Number} the radius to use
     */
    calcRadiusLog10 (value, maxValue, maxRadiusPx, minRadiusPx = 0) {
        if (typeof minRadiusPx !== "number") {
            return 0;
        }
        else if (typeof value !== "number" || typeof maxValue !== "number" || typeof maxRadiusPx !== "number") {
            return minRadiusPx;
        }
        else if (maxRadiusPx <= minRadiusPx) {
            return minRadiusPx;
        }
        else if (value <= 0) {
            return minRadiusPx;
        }
        else if (maxValue <= 0) {
            return minRadiusPx;
        }
        else if (value >= maxValue) {
            return maxRadiusPx;
        }

        return (maxRadiusPx - minRadiusPx) / Math.log10(maxValue) * Math.log10(value) + minRadiusPx;
    }
}
