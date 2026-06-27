<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersCommuterFlows.js";
import mutations from "../store/mutationsCommuterFlows.js";
import {CommuterApi} from "../utils/commuterApi.js";
import {CommuterOL} from "../utils/commuterOL.js";
import {convertColor} from "../../../src/shared/js/utils/convertColor.js";
import thousandsSeparator from "../../../src/shared/js/utils/thousandsSeparator.js";
import SwitchInput from "../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "CommuterFlows",
    components: {
        SwitchInput,
        FlatButton
    },
    data () {
        return {
            wfsApi: null,
            olApi: null,

            listDistricts: [],
            listCities: [],
            lastDataset: null,
            lastMarker: null,

            currentDistrict: "",
            currentCity: "",
            currentDirection: "out",

            captionsChecked: true,
            numbersChecked: true,
            beamsChecked: true,
            animationChecked: false,

            tooltipOutActive: false,
            tooltipInActive: false
        };
    },
    computed: {
        ...mapGetters("Modules/CommuterFlows", Object.keys(getters)),

        /**
         * checkes if the animation is running using olApi
         * @returns {Boolean} true if the animation is currently running
         */
        isAnimationRunning () {
            return this.olApi.isAnimationRunning();
        }
    },
    watch: {
        /**
         * watches changes of lastDataset
         * @param {Object} newLastDataset the new lastDataset to react to
         * @returns {void}
         */
        lastDataset (newLastDataset) {
            if (Array.isArray(newLastDataset?.featureList) && Array.isArray(newLastDataset?.coordinate)) {
                this.refreshCaptions();
                this.refreshBeams();
                this.refreshAnimation();
            }
            else {
                this.olApi.clearLayers();
            }
        },
        /**
         * watches the current district and calls selectDistrict if a district is given
         * resets currentCity
         * @param {String} district the new district
         * @returns {void}
         */
        currentDistrict (district) {
            this.currentCity = "";
            if (district) {
                this.selectDistrict(district, this.isOutCommuter(), this.listChunk);
            }
        },
        /**
         * watches the current city and calls selectCity if a city is given
         * calls selectDistrict if no city is given
         * @param {String} city the new city
         * @returns {void}
         */
        currentCity (city) {
            if (city) {
                this.selectCity(city, this.isOutCommuter(), this.listChunk);
            }
            else {
                this.selectDistrict(this.currentDistrict, this.isOutCommuter(), this.listChunk);
            }
        },
        /**
         * watches if the captions are checked
         * @returns {void}
         */
        captionsChecked () {
            this.refreshCaptions();
        },
        /**
         * watches if the numbers are checked
         * @returns {void}
         */
        numbersChecked () {
            this.refreshCaptions();
        },
        /**
         * watches if the beams are checked
         * @returns {void}
         */
        beamsChecked () {
            this.refreshBeams();
        },
        /**
         * watches if the animation is checked
         * @returns {void}
         */
        animationChecked () {
            this.refreshAnimation();
        },
        /**
         * watches if the current direction is changed
         * @returns {void}
         */
        currentDirection () {
            if (this.lastDataset?.source === "getFeaturesDistrict") {
                this.wfsApi.getFeaturesDistrict(this.currentDistrict, this.isOutCommuter(), 0, this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                }, this.onApiError);
            }
            else if (this.lastDataset?.source === "getFeaturesCity") {
                this.wfsApi.getFeaturesCity(this.currentCity, this.isOutCommuter(), 0, this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                }, this.onApiError);
            }
            else {
                this.olApi.clearLayers();
            }
        }
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    mounted () {
        this.sideMenuWidth = document.getElementById("mp-menu-secondaryMenu").style.width;
        document.getElementById("mp-menu-secondaryMenu").style.width = "440px";
        if (this.wfsApi === null) {
            // the wfsApi can't be loaded on created or mounted, beacause the serviceURL might not be there yet
            this.wfsApi = new CommuterApi({
                serviceUrl: this.serviceURL,
                blacklistedDistricts: this.blacklistedDistricts
            });
            this.wfsApi.getListDistricts(result => {
                this.listDistricts = result;
            }, this.onApiError);
        }
        if (this.olApi === null) {
            // the CommuterOL creates layers on construction
            // only construct when necessary - e.g. on first activation of the tool
            this.olApi = new CommuterOL({
                font: this.olFont,
                fontShadow: this.olFontShadow,
                beam: this.olBeam,
                bubblePixelMax: this.olBubblePixelMax,
                bubblePixelMin: this.olBubblePixelMin,
                bubbleBorder: this.olBubbleBorder,
                bubbleColors: this.olBubbleColors,
                bubbleColorShift: this.olBubbleColorShift,
                zoomOptions: this.olZoomOptions,
                animationPaces: this.olAnimationPaces
            });

            // resets the tool for a clean start
            this.resetAll();
        }
        this.setFocusToFirstControl();
    },
    unmounted () {
        this.resetAll();
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;
    },
    methods: {
        ...mapMutations("Modules/CommuterFlows", Object.keys(mutations)),
        thousandsSeparator,
        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs["select-district"]) {
                    this.$refs["select-district"].focus();
                }
            });
        },
        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }
            return this.$t(key, options);
        },
        /**
         * logs the given error as api error
         * @param {Object} error the error from the api
         * @returns {void}
         */
        onApiError (error) {
            console.warn("addons/CommuterFlow - Api error", error);
        },
        /**
         * returns the css style to use for the feature at a certain list position
         * @param {Number} idx the list position
         * @returns {Object} the css style to be interpreted by Vues :style argument
         */
        getStyleByIdx (idx) {
            return {
                "background-color": convertColor(this.olApi.getColor(idx), "rgbaString")
            };
        },
        /**
         * helper function to zoom into the current extent
         * @returns {void}
         * @pre the zoom is anywhere
         * @post the map is zoomed into the extent of this.lastDataset.featureList
         */
        zoomIntoExtent () {
            if (typeof this.olZoomOptions === "object" && this.olZoomOptions !== null && Array.isArray(this.lastDataset?.featureList) && Array.isArray(this.lastDataset?.coordinate)) {
                this.olApi.zoomToExtent(this.lastDataset.featureList);
            }
        },
        /**
         * auto scrolls the div of the featureList
         * @param {String} whereto whether to scroll up ("top") or down ("bottom")
         * @returns {void}
         */
        autoscrollFeatureList (whereto) {
            const elem = this.$el.querySelector(".featureList");

            if (whereto === "top") {
                elem.scrollTop = 0;
            }
            else if (whereto === "bottom") {
                elem.scrollTop = elem.scrollHeight;
            }
        },
        /**
         * sets/unsets the marker
         * @param {Number[]} coords the coordinates to place the marker at
         * @returns {void}
         */
        toggleMarker (coords) {
            if (!this.setMarkerOnClickInList) {
                return;
            }
            if (!Array.isArray(coords) || this.lastMarker === coords) {
                this.lastMarker = null;
                this.$store.dispatch("Maps/removePointMarker");
            }
            else {
                this.lastMarker = coords;
                this.$store.dispatch("Maps/placingPointMarker", coords);
            }
        },
        /**
         * sets the dataset for the selected district
         * @param {String} district the selected district
         * @param {Boolean} isOutCommuter out-commuter (true) or in-commuter (false)
         * @param {Number} listChunk the number of features to load initialy
         * @returns {void}
         */
        selectDistrict (district, isOutCommuter, listChunk) {
            this.wfsApi.getListCities(district, result => {
                this.listCities = result;
            }, this.onApiError);
            this.wfsApi.getFeaturesDistrict(district, isOutCommuter, 0, listChunk, dataset => {
                this.lastDataset = dataset;
                this.zoomIntoExtent();
            }, this.onApiError);
        },
        /**
         * sets the dataset for the selected city
         * @param {String} city the selected city
         * @param {Boolean} isOutCommuter out-commuter (true) or in-commuter (false)
         * @param {Number} listChunk the number of features to load initialy
         * @returns {void}
         */
        selectCity (city, isOutCommuter, listChunk) {
            this.wfsApi.getFeaturesCity(city, isOutCommuter, 0, listChunk, dataset => {
                this.lastDataset = dataset;
                this.zoomIntoExtent();
            }, this.onApiError);
        },
        /**
         * refreshes the captions e.g. after change of checkboxes captions and numbers or change of lastDataset
         * @returns {void}
         */
        refreshCaptions () {
            if (Array.isArray(this.lastDataset?.featureList) && Array.isArray(this.lastDataset?.coordinate)) {
                this.olApi.addCaptions(
                    this.lastDataset.caption,
                    this.lastDataset.coordinate,
                    this.lastDataset.featureList,
                    this.captionsChecked,
                    this.numbersChecked
                );
            }
            else {
                this.olApi.removeCaptions();
            }
        },
        /**
         * refreshes the beams e.g. after change of checkbox beams or change of lastDataset
         * @returns {void}
         */
        refreshBeams () {
            if (this.beamsChecked && Array.isArray(this.lastDataset?.featureList) && Array.isArray(this.lastDataset?.coordinate)) {
                this.olApi.addBeams(this.lastDataset.featureList);
            }
            else {
                this.olApi.removeBeams();
            }
        },
        /**
         * refreshes the animation e.g. after change of checkbox animation or change of lastDataset
         * @returns {void}
         */
        refreshAnimation () {
            if (this.animationChecked && Array.isArray(this.lastDataset?.featureList) && Array.isArray(this.lastDataset?.coordinate)) {
                this.olApi.initAnimation(this.lastDataset.featureList, this.lastDataset.totalMax, this.olBubbleAlgorithm);
            }
            else {
                this.olApi.removeAnimation();
            }
        },
        /**
         * loads more features in the feature list
         * @returns {void}
         */
        loadMore () {
            if (this.lastDataset?.source === "getFeaturesDistrict") {
                this.wfsApi.getFeaturesDistrict(this.currentDistrict, this.isOutCommuter(), 0, this.lastDataset.len + this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                    this.$nextTick(() => {
                        this.autoscrollFeatureList("bottom");
                    });
                }, this.onApiError);
            }
            else if (this.lastDataset?.source === "getFeaturesCity") {
                this.wfsApi.getFeaturesCity(this.currentCity, this.isOutCommuter(), 0, this.lastDataset.len + this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                    this.$nextTick(() => {
                        this.autoscrollFeatureList("bottom");
                    });
                }, this.onApiError);
            }
            else {
                this.olApi.clearLayers();
            }
        },
        /**
         * loads less features in the feature list
         * @returns {void}
         */
        loadLess () {
            if (this.lastDataset?.source === "getFeaturesDistrict") {
                this.wfsApi.getFeaturesDistrict(this.currentDistrict, this.isOutCommuter(), 0, this.lastDataset.len - this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                }, this.onApiError);
            }
            else if (this.lastDataset?.source === "getFeaturesCity") {
                this.wfsApi.getFeaturesCity(this.currentCity, this.isOutCommuter(), 0, this.lastDataset.len - this.listChunk, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                }, this.onApiError);
            }
            else {
                this.olApi.clearLayers();
            }
        },
        /**
         * loads all available features in the feature list
         * @returns {void}
         */
        loadAll () {
            if (this.lastDataset?.source === "getFeaturesDistrict") {
                this.wfsApi.getFeaturesDistrict(this.currentDistrict, this.isOutCommuter(), 0, this.lastDataset.totalLength, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                    this.$nextTick(() => {
                        this.autoscrollFeatureList("top");
                    });
                }, this.onApiError);
            }
            else if (this.lastDataset?.source === "getFeaturesCity") {
                this.wfsApi.getFeaturesCity(this.currentCity, this.isOutCommuter(), 0, this.lastDataset.totalLength, dataset => {
                    this.lastDataset = dataset;
                    this.zoomIntoExtent();
                    this.$nextTick(() => {
                        this.autoscrollFeatureList("top");
                    });
                }, this.onApiError);
            }
            else {
                this.olApi.clearLayers();
            }
        },
        /**
         * resets the tool
         * @returns {void}
         */
        resetAll () {
            // note: remember to check behavior of watch:active -> use of resetAll, when changing this function
            this.listCities = [];
            this.currentCity = "";

            // note: the watcher on currentCity already resets the currentDistrict
            // to avoid a mixup within vue (leading to a bug) the following resets may be put into $nextTick
            this.$nextTick(() => {
                this.currentDistrict = "";

                this.lastDataset = null;
                if (typeof this.onstart === "object") {
                    this.captionsChecked = this.onstart.captionsChecked;
                    this.numbersChecked = this.onstart.numbersChecked;
                    this.beamsChecked = this.onstart.beamsChecked;
                    this.animationChecked = this.onstart.animationChecked;
                    this.currentDirection = this.onstart.direction;
                }
                this.toggleMarker(null);

                this.olApi.clearLayers();
            });
        },
        /**
         * starts the animation
         * @returns {void}
         */
        playAnimation () {
            this.olApi.startAnimation();
        },
        /**
         * stops the animation
         * @returns {void}
         */
        stopAnimation () {
            this.olApi.stopAnimation();
        },
        /**
         * returns true if the current commuters are commuting out (from home to work)
         * @returns {Boolean} true if the currentDirection eq "out"
         */
        isOutCommuter () {
            return this.currentDirection === "out";
        }
    }
};
</script>

<template lang="html">
    <div
        id="CommuterFlows"
        class="commuter-flows-container"
    >
        <form
            id="printToolNew"
            class="form-horizontal"
            @submit.prevent="print"
        >
            <div class="form-floating mb-3">
                <select
                    id="CommuterFlows-select-district"
                    ref="select-district"
                    v-model="currentDistrict"
                    class="form-select"
                >
                    <option
                        selected
                        disabled
                        value=""
                    >
                        {{ translate("additional:modules.CommuterFlows.select") }}
                    </option>
                    <option
                        v-for="(district, i) in listDistricts"
                        :key="i"
                        :value="district"
                        :SELECTED="district === currentDistrict ? true : null"
                    >
                        {{ district }}
                    </option>
                </select>
                <label for="CommuterFlows-select-district">
                    {{ translate("additional:modules.CommuterFlows.labelDistrict") }}
                </label>
            </div>
        </form>
        <div v-if="lastDataset !== null">
            <div class="form-floating mb-3">
                <select
                    id="CommuterFlows-select-city"
                    v-model="currentCity"
                    class="form-select"
                >
                    <option
                        selected
                        value=""
                    >
                        {{ translate("additional:modules.CommuterFlows.select") }}
                    </option>
                    <option
                        v-for="(city, i) in listCities"
                        :key="i"
                        :value="city"
                        :SELECTED="city === currentCity ? true : null"
                    >
                        {{ city }}
                    </option>
                </select>
                <label for="CommuterFlows-select-city">
                    {{ translate("additional:modules.CommuterFlows.labelCity") }}
                </label>
            </div>
            <div class="form-check form-switch mb-3 d-flex align-items-center">
                <SwitchInput
                    :id="'idCaptionsChecked'"
                    :aria="$t('additional:modules.CommuterFlows.checkName')"
                    :interaction="($event) => captionsChecked = $event.target.checked"
                    :label="$t('additional:modules.CommuterFlows.checkName')"
                    :checked="captionsChecked"
                />
            </div>
            <div class="form-check form-switch mb-3 d-flex align-items-center">
                <SwitchInput
                    :id="'idNumbersChecked'"
                    :aria="$t('additional:modules.CommuterFlows.checkNumber')"
                    :interaction="($event) => numbersChecked = $event.target.checked"
                    :label="$t('additional:modules.CommuterFlows.checkNumber')"
                    :checked="numbersChecked"
                />
            </div>
            <div class="form-check form-switch mb-3 d-flex align-items-center">
                <SwitchInput
                    :id="'idBeamsChecked'"
                    :aria="$t('additional:modules.CommuterFlows.checkBeams')"
                    :interaction="($event) => beamsChecked = $event.target.checked"
                    :label="$t('additional:modules.CommuterFlows.checkBeams')"
                    :checked="beamsChecked"
                />
            </div>
            <div class="form-check form-switch mb-3 d-flex justify-content-between align-items-center">
                <SwitchInput
                    :id="'idAnimationChecked'"
                    :aria="$t('additional:modules.CommuterFlows.checkAnimation')"
                    :interaction="($event) => animationChecked = $event.target.checked"
                    :label="$t('additional:modules.CommuterFlows.checkAnimation')"
                    :checked="animationChecked"
                />
                <FlatButton
                    :aria-label="!isAnimationRunning ? $t('additional:modules.CommuterFlows.buttonStart') : $t('additional:modules.CommuterFlows.buttonStop')"
                    :text="!isAnimationRunning ? $t('additional:modules.CommuterFlows.buttonStart') : $t('additional:modules.CommuterFlows.buttonStop')"
                    :interaction="() => !isAnimationRunning ? playAnimation() : stopAnimation()"
                    :icon="!isAnimationRunning ? 'bi-play-fill' : 'bi-stop-fill'"
                    :disabled="!animationChecked"
                />
            </div>
            <div class="d-grid d-md-flex section">
                <div class="col-6 col-sm-6 tooltipWrapper">
                    <div
                        class="form-check form-check-inline"
                        role="presentation"
                        @mouseover="tooltipOutActive = true"
                        @focusin="tooltipOutActive = true"
                        @mouseout="tooltipOutActive = false"
                        @focusout="tooltipOutActive = false"
                    >
                        <input
                            id="idOutChecked"
                            v-model="currentDirection"
                            class="form-check-input"
                            type="radio"
                            name="outInCommuter"
                            value="out"
                        >
                        <label
                            class="col-form-label"
                            for="idOutChecked"
                        >
                            {{ translate("additional:modules.CommuterFlows.selectOut") }}
                        </label>
                    </div>
                    <div
                        v-show="tooltipOutActive"
                        class="tooltip"
                    >
                        {{ translate("additional:modules.CommuterFlows.tooltipOut") }}
                    </div>
                </div>
                <div class="col-6 col-sm-6 tooltipWrapper">
                    <div
                        class="form-check form-check-inline"
                        role="presentation"
                        @mouseover="tooltipInActive = true"
                        @focusin="tooltipInActive = true"
                        @mouseout="tooltipInActive = false"
                        @focusout="tooltipInActive = false"
                    >
                        <input
                            id="idInChecked"
                            v-model="currentDirection"
                            class="form-check-input"
                            type="radio"
                            name="outInCommuter"
                            value="in"
                        >
                        <label
                            class="col-form-label"
                            for="idInChecked"
                        >
                            {{ translate("additional:modules.CommuterFlows.selectIn") }}
                        </label>
                    </div>
                    <div
                        v-show="tooltipInActive"
                        class="tooltip tooltipRight"
                    >
                        {{ translate("additional:modules.CommuterFlows.tooltipIn") }}
                    </div>
                </div>
            </div>
            <hr>
            <div class="d-grid section">
                <div
                    v-if="Array.isArray(lastDataset.featureList) && lastDataset.featureList.length"
                    class="col-sm-12 featureList"
                >
                    <table>
                        <tbody>
                            <tr
                                v-for="(feature, idx) in lastDataset.featureList"
                                :key="`feature-${idx}`"
                                @click="toggleMarker(feature.get('coordinate'))"
                            >
                                <td
                                    class="featureColor"
                                >
                                    <div :style="getStyleByIdx(idx)" />
                                </td>
                                <td class="featureCaption">
                                    {{ feature.get("caption") }}
                                </td>
                                <td class="featureValue">
                                    {{ thousandsSeparator(feature.get("value")) }}
                                </td>
                                <td class="featurePeople">
                                    {{ translate("additional:modules.CommuterFlows.labelPeople") }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div
                    v-else
                    class="col-sm-12 noDataset"
                >
                    {{ translate("additional:modules.CommuterFlows.noDataset") }}
                </div>
            </div>
            <div class="mb-3 d-flex justify-content-between align-items-center">
                <FlatButton
                    :aria-label="$t('additional:modules.CommuterFlows.buttonLess', {listChunk})"
                    :text="$t('additional:modules.CommuterFlows.buttonLess', {listChunk})"
                    :interaction="() => loadLess()"
                    :icon="'bi-arrow-up'"
                    :disabled="lastDataset.len <= listChunk"
                />
                <FlatButton
                    :aria-label="$t('additional:modules.CommuterFlows.buttonMore', {listChunk})"
                    :text="$t('additional:modules.CommuterFlows.buttonMore', {listChunk})"
                    :interaction="() => loadMore()"
                    :icon="'bi-arrow-down'"
                    :disabled="lastDataset.len >= lastDataset.totalLength"
                />
                <FlatButton
                    :aria-label="$t('additional:modules.CommuterFlows.buttonAll', {listChunk})"
                    :text="$t('additional:modules.CommuterFlows.buttonAll', {listChunk})"
                    :interaction="() => loadAll()"
                    :disabled="lastDataset.len >= lastDataset.totalLength"
                />
            </div>
            <div
                v-if="metaVerPath"
                class="d-grid section"
            >
                <div class="col-sm-12">
                    <a
                        :href="metaVerPath"
                        target="_blank"
                        class="float-end"
                    >
                        {{ translate("additional:modules.CommuterFlows.linkMoreInfo") }}
                    </a>
                </div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <FlatButton
                    :aria-label="$t('additional:modules.CommuterFlows.buttonReset')"
                    :text="$t('additional:modules.CommuterFlows.buttonReset')"
                    :interaction="() => resetAll()"
                    :icon="'bi-trash'"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .section {
        .col-sm-6, .col-sm-12 {
            padding-left: 2px;
            padding-right: 2px;
        }
        .col-12 {
            padding-top: 2px;
            padding-bottom: 2px;
        }
        margin-bottom: 10px;
    }
    .col-form-label {
        padding-left: 4px;
        padding-top: 0px;
    }
    .noDataset {
        margin-top: 10px;
        text-align: center;
    }
    .featureList {
        height: 200px;
        overflow-y: auto;
        table {
            width: 100%;
            padding: 0;
            margin: 0;
            tbody tr:nth-child(odd) {
                background-color: darken($white, 10%);
            }
            tbody tr:nth-child(odd) {
                background-color: darken($white, 20%);
            }
            tr {
                width: 100%;
                height: 35px;
                padding: 0;
                margin: 0;

                td {
                    padding: 0 1px 0 8px;
                    margin: 0;
                    vertical-align: middle;
                }
                td.featureColor {
                    width: 15%;
                    text-align: center;
                    div {
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                    }
                }
                td.featureCaption {
                    width: 35%;
                }
                td.featureValue {
                    width: 25%;
                    text-align: right;
                }
                td.featurePeople {
                    width: 25%;
                }
            }
        }
    }
    .tooltipWrapper {
        position: relative;
        width: 50%;
        float: left;
        .tooltip {
            position: absolute;
            top: 25px;
            width: 200px;
            z-index: 1;
            opacity: 1;
            border-radius: 4px;
            border: solid 1px $black;
            background-color: $white;
            padding: 5px;
        }
        .tooltipRight {
            right: 0px;
        }
    }
</style>
