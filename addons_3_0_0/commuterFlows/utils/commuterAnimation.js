import {Circle, Style} from "ol/style.js";
import {Point} from "ol/geom.js";
import Feature from "ol/Feature.js";
import {getVectorContext} from "ol/render.js";

/**
 * CommuterAnimation is the Animation Class for the Tool "CommuterFlows" - CommuterAnimation is a helper class for CommuterOL
 * @class
 * @memberof Addons.CommuterFlows
 */
export class CommuterAnimation {
    /**
     * constructor
     * @param {ol/Feature[]} featureList a list of ol features
     * @param {Number[]} speeds an array[a, b, ..., n] to describe the speed with, where even indexes are forwards and odd is backwards, use 0 to pass forwards or backwards (e.g. [1000, 300])
     * @param {ol/Layer} layerBubbles the layer of the bubbles to blend in/out on stop/start
     * @param {ol/Layer} layerAnimation the layer to place the animation in
     * @param {Object} ol an object with functions to connect to openlayers with
     * @param {Function} createBubbleStyle a function(feature, idx) to create the bubble style of the given feature at position idx in featureList
     */
    constructor (featureList, speeds, layerBubbles, layerAnimation, ol, createBubbleStyle) {
        this.featureList = featureList;
        this.speeds = speeds;
        this.layers = {
            bubbles: layerBubbles,
            animation: layerAnimation
        };
        this.layerAnimation = layerAnimation;
        this.ol = ol;

        // create styles and sets points for each given feature
        this.styles = [];
        this.startTime = null;

        // clear up animation layer
        this.ol.hideLayer(this.layers.animation);
        this.ol.clearLayer(this.layers.animation);
        if (typeof CommuterAnimation.moveFeatureRef === "function") {
            this.ol.unPostRender(this.layers.animation, CommuterAnimation.moveFeatureRef);
        }

        // set invisible animation Points as reference for the vectorContext
        if (Array.isArray(featureList) && featureList.length) {
            featureList.forEach((feature, idx) => {
                const coord = feature.get("coordinate"),
                    animationPoint = new Feature(new Point(coord));

                animationPoint.setStyle(new Style({
                    image: new Circle({
                        radius: 0
                    })
                }));
                this.ol.addFeature(this.layers.animation, animationPoint);
                // for a higher performance the styles are cached on initialization
                this.styles.push(createBubbleStyle(feature, idx));
            });
        }

        // for a higher performance the total speed is calculated on initialization
        this.speedsTotal = 0;
        if (Array.isArray(speeds)) {
            speeds.forEach(speed => {
                this.speedsTotal += speed;
            });
        }
    }

    /**
     * starts the animation of this instance
     * @returns {void}
     */
    start () {
        this.ol.hideLayer(this.layers.bubbles);
        this.ol.showLayer(this.layers.animation);

        // to allow only one animation to run, the former animation is always stoped when pressing start on any instance
        // therefore a class variable is used as event reference
        if (typeof CommuterAnimation.moveFeatureRef === "function") {
            this.ol.unPostRender(this.layers.animation, CommuterAnimation.moveFeatureRef);
        }
        // (!) use an anonymous function bound to a reference to operate "on" and "un" properly: [f].indexOf(f) is applied internaly
        CommuterAnimation.moveFeatureRef = event => this.moveFeature(event);
        this.ol.onPostRender(this.layers.animation, CommuterAnimation.moveFeatureRef);

        this.startTime = new Date().getTime();
        this.ol.render();
    }
    /**
     * stops the animation of this instance
     * @returns {void}
     */
    stop () {
        this.startTime = null;

        if (typeof CommuterAnimation.moveFeatureRef === "function") {
            this.ol.unPostRender(this.layers.animation, CommuterAnimation.moveFeatureRef);
            CommuterAnimation.moveFeatureRef = null;
        }

        this.ol.hideLayer(this.layers.animation);
        this.ol.showLayer(this.layers.bubbles);
    }
    /**
     * checkes whether or not the animation is running
     * @returns {Boolean} true if the animation is currently running
     */
    isRunning () {
        return this.startTime !== null;
    }

    /**
     * the handler to move a feature with
     * @param {Object} event the OpenLayers event to use for this render cycle
     * @returns {void}
     */
    moveFeature (event) {
        const vectorContext = getVectorContext(event),
            frameState = event.frameState;

        // elapsed time in ms
        if (this.startTime) {
            const elapsedTime = frameState.time - this.startTime;

            this.featureList.forEach((feature, idx) => {
                const distance = this.getDistance(elapsedTime, this.speedsTotal, this.speeds),
                    coord = feature.getGeometry().getCoordinateAt(distance),
                    wanderer = new Feature(new Point(coord));

                vectorContext.drawFeature(wanderer, this.styles[idx]);
            });
            this.ol.render();
        }
    }

    /**
     * calculates the distance [0..1] of the given ms based on the configured ms speeds
     * @param {Number} elapsedTime the time in ms
     * @param {Number} speedsTotal the (valid) precalculated sum of speeds (e.g. 3600 = 1000 + 500 + 2000 + 100)
     * @param {Number[]} speeds the different speeds in ms to calculate with (e.g. [1000, 500, 2000, 100])
     * @returns {Number} the current distance [0..1] for the given elapsed time, using speeds to calculate for different animation speeds
     */
    getDistance (elapsedTime, speedsTotal, speeds) {
        if (
            !elapsedTime || typeof elapsedTime !== "number"
            || !speedsTotal || typeof speedsTotal !== "number"
            || !Array.isArray(speeds) || !speeds.length
        ) {
            return 0;
        }
        const totalDistance = elapsedTime % speedsTotal;
        let i = 0,
            distance = 0;

        while (i >= 0) {
            distance += speeds[i];
            if (distance > totalDistance) {
                distance = speeds[i] - (distance - totalDistance);
                break;
            }
            i++;
        }

        if (i % 2 === 0) {
            // forwards
            // speeds[i] can't be zero
            return 1 / speeds[i] * distance;
        }

        // backwards
        // speeds[i] can't be zero
        return 1 - 1 / speeds[i] * distance;
    }
}
