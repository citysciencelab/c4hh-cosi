<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import GraphicalSelect from "../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import SwitchInput from "../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import thousandsSeparator from "../../../src/shared/js/utils/thousandsSeparator";
import WPS from "../../../src/shared/js/api/wps";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";

export default {
    name: "PopulationRequest",
    components: {
        GraphicalSelect,
        SwitchInput
    },
    data () {
        return {
            metaDataLink: undefined,
            mrhId: "46969C7D-FAA8-420A-81A0-8352ECCFF526",
            fhhId: "B3FD9BD5-F614-433F-A762-E14003C300BF",
            rasterLayerId: "13023",
            alkisAdressLayerId: "9726",
            sourceFHH: "nein",
            sourceMRH: "nein",
            inhabitantsFHH: "-1",
            inhabitantsFHHNum: -1,
            inhabitantsMRH: "-1",
            inhabitantsMRHNum: -1,
            searchArea: 0
        };
    },
    computed: {
        ...mapGetters("Modules/PopulationRequest", [
            "name",
            "id",
            "icon",
            "hasMouseMapInteractions",
            "rasterActive",
            "alkisAdressesActive",
            "populationReqServiceId",
            "wpsId",
            "fmwProcess",
            "geometry"
        ]),
        ...mapGetters("Modules/GraphicalSelect", [
            "selectedAreaGeoJson"
        ]),
        ...mapGetters("Maps", ["scale"]),
        ...mapGetters(["uiStyle", "restServiceById", "visibleLayerConfigs", "layerConfigById", "determineZIndex"]),
        /**
         * Indicates whether the ui style is default.
         * @returns {Boolean} Is the uiStyle default.
         */
        isDefaultStyle () {
            return this.uiStyle !== "SIMPLE" && this.uiStyle !== "TABLE";
        },
        /**
         * returns if the Hint and Linktext should be shown
         * @returns {Boolean} shall Text be shown
         */
        showFHHHintAndLinktext: function () {
            return this.inhabitantsFHHNum > -1 && (this.sourceFHH === "ja" || this.sourceFHH === "tlw");
        },
        /**
         * returns if the Hint and Linktext should be shown
         * @returns {Boolean} shall Text be shown
         */
        showMRHHintAndLinktext: function () {
            return this.inhabitantsMRHNum > -1 && (this.sourceMRH === "ja" || this.sourceMRH === "tlw");
        },
        /**
         * returns if the SourceAreaOutsideHint should be shown
         * @returns {Boolean} shall Hint be shown
         */
        showMRHSourceAreaOutsideHint: function () {
            return this.sourceMRH === "tlw" && this.sourceFHH === "nein";
        }
    },
    watch: {
        selectedAreaGeoJson (newValue) {
            this.makeRequest(newValue);
        },
        visibleLayerConfigs: {
            handler (newLayerConfigs, oldLayerConfigs) {
                if (newLayerConfigs?.find(conf => conf.id === this.rasterLayerId)) {
                    this.setRasterActive(true);
                }
                else if (oldLayerConfigs?.find(conf => conf.id === this.rasterLayerId)) {
                    this.setRasterActive(false);
                }
                if (newLayerConfigs?.find(conf => conf.id === this.alkisAdressLayerId)) {
                    this.setAlkisAdressesActive(true);
                }
                else if (oldLayerConfigs?.find(conf => conf.id === this.alkisAdressLayerId)) {
                    this.setAlkisAdressesActive(false);
                }
            },
            deep: true
        }
    },
    mounted () {
        const service = this.restServiceById(this.populationReqServiceId);

        if (service === undefined) {
            console.error("PopulationRequest - Rest Service with the ID " + this.populationReqServiceId + " is not configured in rest-services.json!");
        }
        else {
            this.metaDataLink = service.url;
        }
        if (!rawLayerList.getLayerWhere({id: this.alkisAdressLayerId})) {
            console.warn("PopulationRequest - Layer ALKIS Adresses with id ", this.alkisAdressLayerId, " is not avilable. Check your services.json!");
        }
        if (!rawLayerList.getLayerWhere({id: this.rasterLayerId})) {
            console.warn("PopulationRequest - Layer raster with id ", this.alkisAdressLayerId, " is not avilable. Check your services.json!");
        }
    },
    unmounted () {
        // forced delete of tooltip overlay
        if (document.getElementById("tooltip-overlay")) {
            document.getElementById("tooltip-overlay").remove();
        }
    },
    beforeUnmount () {
        if (this.$refs.graphicalSelection) {
            this.$refs.graphicalSelection.setStatus(false);
            this.$refs.graphicalSelection.resetView();
        }

        if (this.alkisAdressesActive) {
            const rawLayer = rawLayerList.getLayerWhere({id: this.alkisAdressLayerId});

            if (rawLayer) {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: this.alkisAdressLayerId,
                        layer: {
                            visibility: false
                        }
                    }]
                });
            }
        }
        if (this.rasterActive) {
            const rawLayer = rawLayerList.getLayerWhere({id: this.rasterLayerId});

            if (rawLayer) {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id: this.rasterLayerId,
                        layer: {
                            visibility: false
                        }
                    }]
                });
            }
        }
    },
    methods: {
        ...mapMutations("Modules/PopulationRequest", [
            "setAlkisAdressesActive",
            "setRasterActive"
        ]),
        ...mapActions(["addLayerToLayerConfig", "replaceByIdInLayerConfig", "addOrReplaceLayer"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Resets internal data and triggers the wps request "einwohner_ermitteln.fmw" for the selected area.
         * @param  {Object} geoJson GeoJSON to get selected area from
         * @returns {void}
         */
        makeRequest: function (geoJson) {
            this.inhabitantsFHHNum = -1;
            this.inhabitantsMRHNum = -1;
            this.sourceFHH = "nein";
            this.sourceMRH = "nein";
            this.searcharea = 0;

            const service = this.restServiceById(this.wpsId);

            if (service === undefined) {
                console.warn("Rest Service with the ID " + this.wpsId + " is not configured in rest-services.json!");
            }
            else {
                WPS.wpsRequest(this.wpsId, service.url, this.fmwProcess, {
                    "such_flaeche": JSON.stringify(geoJson)
                }, this.handleResponse.bind(this));
            }
        },
        /**
         * Resets the GraphicalSelect.
         * @returns {void}
         */
        resetView: function () {
            this.$refs.graphicalSelection.resetView();
        },
        /**
         * Called when the wps modules returns a request
         * @param  {String} response the response xml of the wps
         * @param  {Number} status the HTTPStatusCode
         * @returns {void}
         */
        handleResponse: function (response, status) {
            let parsedData = null;

            parsedData = response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.einwohner;
            if (status === 200) {
                if (parsedData.ErrorOccured === "yes") {
                    this.handleWPSError(parsedData);
                }
                else {
                    this.handleSuccess(parsedData);
                }
            }
            else {
                this.resetView();
            }
        },
        /**
         * Displays Errortext if the WPS returns an Error
         * @param  {String} response received by wps
         * @returns {void}
         */
        handleWPSError: function (response) {
            this.addSingleAlert({
                content: this.translate("additional:modules.populationRequest.errors.requestException") + JSON.stringify(response.ergebnis),
                category: "error",
                title: this.translate("additional:modules.populationRequest.errors.errorTitle")
            });
        },
        /**
         * Used when statuscode is 200 and wps did not return an error
         * @param  {String} response received by wps
         * @returns {void}
         */
        handleSuccess: function (response) {
            let responseResult = null;

            try {
                responseResult = JSON.parse(response?.ergebnis);
                if (responseResult?.einwohner_fhh) {
                    this.inhabitantsFHHNum = responseResult.einwohner_fhh;
                    this.inhabitantsFHH = thousandsSeparator(responseResult.einwohner_fhh);
                }
                else {
                    this.inhabitantsFHHNum = -1;
                }
                if (responseResult?.einwohner_mrh) {
                    this.inhabitantsMRHNum = responseResult.einwohner_mrh;
                    this.inhabitantsMRH = thousandsSeparator(responseResult.einwohner_mrh);
                }
                else {
                    this.inhabitantsMRHNum = -1;
                }
                if (responseResult?.quelle_fhh) {
                    this.sourceFHH = responseResult.quelle_fhh;
                }
                else {
                    this.sourceFHH = "nein";
                }
                if (responseResult?.quelle_mrh) {
                    this.sourceMRH = responseResult.quelle_mrh;
                }
                else {
                    this.sourceMRH = "nein";
                }
                if (responseResult?.suchflaeche) {
                    this.searchArea = this.chooseUnitAndThousandsSeparator(responseResult.suchflaeche);
                }
                else {
                    this.searchArea = 0;
                }
            }
            catch (e) {
                this.addSingleAlert({
                    content: this.translate("additional:modules.populationRequest.errors.requestException") + JSON.stringify(response),
                    category: "error",
                    title: this.translate("additional:modules.populationRequest.errors.errorTitle")
                });
                this.resetView();
                (console.error || console.warn).call(console, e.stack || e);
            }
        },
        /**
         * Chooses unit based on value, calls thousandsSeparator and converts to unit and appends unit
         * @param  {Number} value to inspect
         * @param  {Number} maxDecimals decimals are cut after maxlength chars
         * @returns {String} unit
         */
        chooseUnitAndThousandsSeparator: function (value, maxDecimals) {
            let newValue = null,
                result = null;

            if (value < 250000) {
                result = thousandsSeparator(value.toFixed(maxDecimals)) + " m²";
            }
            else if (value < 10000000) {
                newValue = value / 10000.0;
                result = thousandsSeparator(newValue.toFixed(maxDecimals)) + " ha";
            }
            else {
                newValue = value / 1000000.0;
                result = thousandsSeparator(newValue.toFixed(maxDecimals)) + " km²";
            }
            return result;
        },
        /**
         * Sets the state regarding the RasterLayer
         * @param {Boolean} value flag if Raster is to be set
         * @returns {void}
         */
        triggerRaster (value) {
            this.setRasterActive(value);
            this.addOrReplaceLayer({layerId: this.rasterLayerId, visibility: value});
        },
        /**
         * Sets the state regarding the alkisAdresses Layer
         * @param {Boolean} value flag if alkisAdresses is to be set
         * @returns {void}
         */
        triggerAlkisAdresses (value) {
            this.setAlkisAdressesActive(value);
            this.addOrReplaceLayer({layerId: this.alkisAdressLayerId, visibility: value});
        },

        /**
         * Returns true, if layer is in scale.
         * @param {String} id of the layer to check
         * @returns {Boolean}  true, if layer is in scale
         */
        isInScale (id) {
            if (id === this.alkisAdressLayerId) {
                if (this.scale > 10000) {
                    return true;
                }
            }
            else if (id === this.rasterLayerId) {
                if (this.scale > 100000) {
                    return true;
                }
            }
            return false;
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
        }
    }
};
</script>

<template lang="html">
    <div
        id="tool-PopulationRequest"
        class="population-request"
    >
        <form class="form-horizontal">
            <div class="mb-3">
                {{ translate("additional:modules.populationRequest.select.info") }}
            </div>
            <div class="graphicalSelectionContainer row">
                <div class="dropdown">
                    <GraphicalSelect
                        ref="graphicalSelection"
                        :label="'additional:modules.populationRequest.select.action'"
                    />
                </div>
            </div>
            <div>
                <div
                    v-if="inhabitantsFHHNum > -1 || inhabitantsMRHNum > -1"
                    class="result"
                >
                    <div class="heading additional-text">
                        {{ translate("additional:modules.populationRequest.result.confidentialityHint") }}:
                    </div>
                    <table class="table">
                        <tr
                            v-if="sourceFHH !== 'nein'"
                        >
                            <td>{{ translate("additional:modules.populationRequest.result.populationFHH") }}:</td>
                            <td
                                class="inhabitantsFHH"
                            >
                                {{ inhabitantsFHH }}
                            </td>
                        </tr>
                        <tr
                            v-if="sourceMRH !== 'nein'"
                        >
                            <td>{{ translate("additional:modules.populationRequest.result.populationMRH") }}:</td>
                            <td
                                class="inhabitantsMRH"
                            >
                                {{ inhabitantsMRH }}
                            </td>
                        </tr>
                        <tr
                            v-if="searchArea"
                        >
                            <td>{{ translate("additional:modules.populationRequest.result.areaSize") }}:</td>
                            <td
                                class="searchArea"
                            >
                                {{ searchArea }}
                            </td>
                        </tr>
                    </table>
                    <div
                        v-if="showFHHHintAndLinktext"
                        class="inhabitantsFHHAddText"
                    >
                        <div class="hinweis additional-text">
                            <span>{{ translate("additional:modules.populationRequest.result.hint") }}:</span>&nbsp;{{ translate("additional:modules.populationRequest.result.confidentialityHintSmallValues") }}
                        </div>
                        <div>
                            <a
                                target="_blank"
                                :href="`${metaDataLink}${fhhId}`"
                            >
                                {{ translate("additional:modules.populationRequest.result.dataSourceFHHLinktext") }}
                            </a>
                        </div>
                    </div>
                    <div
                        v-if="showMRHHintAndLinktext"
                        class="inhabitantsMRHAddText"
                    >
                        <div
                            class="hinweis additional-text"
                        >
                            <div>
                                <span>{{ translate("additional:modules.populationRequest.result.hint") }}:</span>
                                <span
                                    v-if="showMRHSourceAreaOutsideHint"
                                >
                                    {{ translate("additional:modules.populationRequest.result.sourceAreaOutside") }}
                                </span>
                            </div>
                            <span>{{ translate("additional:modules.populationRequest.result.dataSourceMRHKey") }}:</span>&nbsp;{{ translate("additional:modules.populationRequest.result.dataSourceMRHValue") }}
                        </div>
                        <div>
                            <a
                                target="_blank"
                                :href="`${metaDataLink}${mrhId}`"
                            >
                                {{ translate("additional:modules.populationRequest.result.dataSourceMRHLinktext") }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </form>
        <div
            v-if="isDefaultStyle"
        >
            <hr>
            <div class="checkbox">
                <div class="checkbox-container">
                    <div class="form-inline">
                        <div class="form-check form-switch mb-3 d-flex align-items-center">
                            <SwitchInput
                                :id="'rasterCheckBox'"
                                :aria="translate('additional:modules.populationRequest.select.showRasterLayer')"
                                :interaction="($event) => triggerRaster($event.target.checked)"
                                :label="translate('additional:modules.populationRequest.select.showRasterLayer')"
                                :checked="rasterActive"
                                :disabled="isInScale(rasterLayerId)"
                            />
                        </div>
                    </div>
                </div>
                <div class="checkbox-container">
                    <div class="form-inline">
                        <div class="form-check form-switch mb-3 d-flex align-items-center">
                            <SwitchInput
                                :id="'alkisAdressesCheckBox'"
                                :aria="translate('additional:modules.populationRequest.select.showAlkisAdresses')"
                                :interaction="($event) => triggerAlkisAdresses($event.target.checked)"
                                :label="translate('additional:modules.populationRequest.select.showAlkisAdresses')"
                                :checked="alkisAdressesActive"
                                :disabled="isInScale(alkisAdressLayerId)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/mixins.scss";

.population-request {
    .form-horizontal {
        & > * {
            padding-right: 15px;
            padding-left: 15px;
        }

        .graphicalSelectionContainer {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }

        .result {
            margin-top: 10px;

            .table {
                margin-bottom: 20px;

                td {
                    padding: 8px;
                    border-top: 1px solid #ddd;
                }

                & > :not(:first-child) {
                    // NOTE: Overwrites default style of .table
                    border-top: 0 solid currentColor;
                }
            }
        }
    }

    .checkbox-container {
        .form-inline {
            font-size: 15px;

            @media (max-width: 767px) {
                font-size: 12px;
            }

            .title-checkbox {
                width: 100%;

                label {
                    white-space: normal;
                    padding-left:5px;
                }
            }
        }
    }
}
</style>

<style lang="scss">
@import "~variables";

#tooltip-overlay {
    position: relative;
    background: $accent_active;
    color: $white;
    max-width: 200px;
    padding: 4px 8px;
}

#circle-overlay {
    position: relative;
    top: -20px;
    background: $accent_active;
    color: $white;
    max-width: 70px;
    padding: 4px 8px;
}
</style>
