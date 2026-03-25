<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import GraphicalSelect from "../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";
import thousandsSeparator from "../../../src/shared/js/utils/thousandsSeparator.js";
import WPS from "../../../src/shared/js/api/wps.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import isObject from "@shared/js/utils/isObject";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "PlanParken",
    components: {
        GraphicalSelect,
        SpinnerItem
    },
    data () {
        return {
            isLoading: false,
            activeTooltip: null,
            tooltipText: "",
            tooltipStyle: {},
            tooltipArrowStyle: {},
            tooltipTargetEl: null,
            tooltipPlacement: "top"
        };
    },
    computed: {
        ...mapGetters("Modules/PlanParken", [
            "name",
            "id",
            "icon",
            "hasMouseMapInteractions",
            "rasterActive",
            "alkisAdressesActive",
            "populationReqServiceId",
            "wpsId",
            "serviceId",
            "fmwProcess",
            "processName",
            "processData",
            "rasterLayerId",
            "alkisAdressLayerId",
            "secret",
            "baseUrl"
        ]),
        ...mapGetters("Modules/GraphicalSelect", [
            "selectedAreaGeoJson"
        ]),
        ...mapGetters("Maps", ["scale"]),
        ...mapGetters(["restServiceById", "visibleLayerConfigs"]),
        /**
         * The service object from rest-services.json
         * @returns {Object} service
         */
        service () {
            return this.restServiceById(this.serviceId ?? this.wpsId);
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
            console.error("PlanParken - Rest Service with the ID " + this.populationReqServiceId + " is not configured in rest-services.json!");
        }
        if (!rawLayerList.getLayerWhere({id: this.alkisAdressLayerId})) {
            console.warn("PlanParken - Layer ALKIS Adresses with id ", this.alkisAdressLayerId, " is not avilable. Check your services.json!");
        }
        if (!rawLayerList.getLayerWhere({id: this.rasterLayerId})) {
            console.warn("PlanParken - Layer raster with id ", this.alkisAdressLayerId, " is not avilable. Check your services.json!");
        }
        document.addEventListener("click", this.handleOutSideClick);
        document.addEventListener("scroll", this.closeTooltip, true);
    },
    unmounted () {
        // forced delete of tooltip overlay
        if (document.getElementById("tooltip-overlay-plan-parken")) {
            document.getElementById("tooltip-overlay-plan-parken").remove();
        }

    },
    beforeUnmount () {
        document.removeEventListener("scroll", this.closeTooltip);
        document.removeEventListener("click", this.handleOutSideClick);
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
        ...mapMutations("Modules/PlanParken", [
            "setAlkisAdressesActive",
            "setRasterActive",
            "setProcessData"
        ]),
        ...mapActions(["addLayerToLayerConfig", "replaceByIdInLayerConfig", "addOrReplaceLayer"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/PlanParken", ["fetchOAP"]),

        handleOutSideClick (evt) {
            if (this.activeTooltip) {
                this.closeTooltip();
            }
            const clickedInsideButton = evt.target.closest(".info-btn");
            const clickedInsideTooltip = evt.target.closest(".tooltip-box");

            if (!clickedInsideButton && !clickedInsideTooltip) {
                this.closeTooltip();
            }
        },
        toggleTooltip (event, id, text) {
            if (this.activeTooltip === id) {
                this.closeTooltip();
                return;
            }

            this.activeTooltip = id;
            this.tooltipText = text;
            this.tooltipTargetEl = event.currentTarget;

            this.$nextTick(() => {
                this.positionTooltip();
            });
        },
        closeTooltip () {
            this.tooltipArrowStyle = {};
            this.activeTooltip = null;
            this.tooltipText = "";
            this.tooltipStyle = {};
            this.tooltipTargetEl = null;
            this.tooltipPlacement = "top";

        },
        positionTooltip () {
            if (!this.tooltipTargetEl) {
                return;
            }

            const tooltipEl = document.getElementById("tooltip-overlay-plan-parken"),
                rect = this.tooltipTargetEl.getBoundingClientRect(),
                tooltipWidth = tooltipEl?.offsetWidth || 200,
                spacing = 8,
                arrowSize = 7,
                sidePadding = 8;

            const buttonCenterX = rect.left + rect.width / 2;

            let left = buttonCenterX - tooltipWidth / 2;
            const minLeft = sidePadding;
            const maxLeft = window.innerWidth - tooltipWidth - sidePadding;

            if (left < minLeft) {
                left = minLeft;
            }
            else if (left > maxLeft) {
                left = maxLeft;
            }

            let arrowLeft = buttonCenterX - left;
            const minArrowLeft = 12;
            const maxArrowLeft = tooltipWidth - 12;

            if (arrowLeft < minArrowLeft) {
                arrowLeft = minArrowLeft;
            }
            else if (arrowLeft > maxArrowLeft) {
                arrowLeft = maxArrowLeft;
            }

            const tooltipHeight = tooltipEl?.offsetHeight || 90;
            const canOpenTop = rect.top - tooltipHeight - spacing - arrowSize > 8;

            if (canOpenTop) {
                this.tooltipPlacement = "top";
                this.tooltipStyle = {
                    position: "fixed",
                    left: `${left}px`,
                    top: `${rect.top - spacing - arrowSize}px`,
                    transform: "translateY(-100%)",
                    zIndex: 99999
                };

                this.tooltipArrowStyle = {
                    left: `${arrowLeft}px`
                };
            }
            else {
                this.tooltipPlacement = "bottom";
                this.tooltipStyle = {
                    position: "fixed",
                    left: `${left}px`,
                    top: `${rect.bottom + spacing + arrowSize}px`,
                    zIndex: 99999
                };

                this.tooltipArrowStyle = {
                    left: `${arrowLeft}px`
                };
            }
        },

        /**
         * Resets internal data and triggers the wps request "einwohner_ermitteln.fmw" for the selected area.
         * @param  {Object} geoJson GeoJSON to get selected area from
         * @returns {void}
         */
        makeRequest: function (geoJson) {
            this.setProcessData(undefined);

            const service = this.service;

            if (typeof service === "undefined") {
                console.warn("Rest Service with the ID " + (this.serviceId ?? this.wpsId) + " is not configured in rest-services.json!");
            }
            else {
                this.isLoading = true;
                WPS.wpsRequest(this.wpsId, this.baseUrl, this.fmwProcess, {
                    "such_flaeche": JSON.stringify(geoJson),
                    "uuid": this.secret
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
         * @param  {Document} response the xml of the wps response
         * @param  {Number} status the HTTPStatusCode
         * @returns {void}
         */
        handleResponse: function (response, status) {
            this.isLoading = false;
            let parsedData = null;

            parsedData = response?.ExecuteResponse?.ProcessOutputs?.Output?.Data?.ComplexData?.masterplanparken;
            if (status === 200) {
                if (!isObject(parsedData) || parsedData.ErrorOccured === "yes") {
                    this.handleServiceError(parsedData);
                }
                else {
                    this.handleSuccess(parsedData.ergebnis);
                }
            }
            else {
                this.resetView();
            }
        },
        /**
         * Displays Errortext if the service returns an Error
         * @param  {String} response received by service
         * @returns {void}
         */
        handleServiceError: function (response) {
            let content = this.translate("additional:modules.planParken.errors.requestException");

            if (response?.ergebnis) {
                content += JSON.stringify(response.ergebnis);
            }

            this.addSingleAlert({
                content,
                category: "error",
                title: this.translate("additional:modules.planParken.errors.errorTitle")
            });
        },
        /**
         * Used when statuscode is 200 and wps did not return an error
         * @param  {String} response received by wps
         * @returns {void}
         */
        handleSuccess: function (response) {
            try {
                const parsedData = JSON.parse(response);

                for (const category in parsedData) {
                    for (const key in parsedData[category]) {
                        parsedData[category][key].value = key.trim() === "Suchfläche" ? this.chooseUnitAndThousandsSeparator(parsedData[category][key].value, 2) :
                            thousandsSeparator(parsedData[category][key].value);
                    }
                }
                this.setProcessData(parsedData);
            }
            catch (e) {
                this.addSingleAlert({
                    content: this.translate("additional:modules.planParken.errors.requestException") + JSON.stringify(response),
                    category: "error",
                    title: this.translate("additional:modules.planParken.errors.errorTitle")
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
            const isKm = value >= 1000000;
            const num = isKm ? value / 1000000 : value;
            const unit = isKm ? " km²" : " m²";

            return thousandsSeparator(parseFloat(num.toFixed(maxDecimals))) + unit;
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
        id="tool-PlanParken"
        class="plan-parken"
    >
        <form class="form-horizontal">
            <div class="mb-3">
                {{ translate("additional:modules.planParken.select.info") }}
            </div>
            <div class="graphicalSelectionContainer row">
                <div
                    :class="['dropdown', {'disabled': isLoading}]"
                >
                    <GraphicalSelect
                        ref="graphicalSelection"
                        :label="'additional:modules.planParken.select.action'"
                    />
                </div>
            </div>
            <div>
                <div
                    v-if="processData"
                    class="result"
                >
                    <div class="heading additional-text">
                        {{ translate("additional:modules.planParken.result.confidentialityHint") }}:
                    </div>
                    <div class="stats-card">
                        <section
                            v-for="(rows, section, sIdx) in processData"
                            :key="section"
                            class="stats-section"
                            :class="{ 'mt': sIdx > 0 }"
                        >
                            <div class="section-header">
                                <span class="section-title">{{ section }}</span>
                            </div>
                            <div class="rows">
                                <div
                                    v-for="(valueObj, key) in rows"
                                    :key="key"
                                    class="row"
                                >
                                    <div class="label">
                                        {{ key }}
                                        <div class="info-icon">
                                            <button
                                                v-if="valueObj.info && valueObj.info.length > 0"
                                                :class="{ 'opened': activeTooltip === `${section}-${key}` }"
                                                class="info-btn bi bi-info-circle"
                                                :aria-label="key + ': ' + valueObj.info"
                                                aria-haspopup="true"
                                                :aria-expanded="activeTooltip === `${section}-${key}`"
                                                @click.prevent.stop="toggleTooltip($event, `${section}-${key}`, valueObj.info)"
                                            />
                                        </div>
                                    </div>
                                    <div class="value">
                                        {{ valueObj.value }}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div
                    v-else-if="isLoading"
                    class="d-flex justify-content-center align-items-center"
                >
                    <SpinnerItem />
                </div>
            </div>
        </form>
        <Teleport to="body">
            <div
                v-if="activeTooltip && tooltipText"
                id="tooltip-overlay-plan-parken"
                :class="`tooltip-overlay-plan-parken--${tooltipPlacement}`"
                :style="tooltipStyle"
                role="tooltip"
            >
                {{ tooltipText }}
                <div
                    class="tooltip-arrow"
                    :style="tooltipArrowStyle"
                />
            </div>
        </Teleport>
    </div>
</template>

<style lang="scss" scoped>
@import 'variables';
.plan-parken {
    position: relative;
    overflow-y: visible;
    .disabled {
        pointer-events: none;
        opacity: 0.6;
    }
    .stats-card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border-radius: 6px;
        overflow: visible;
        border: 1px solid #e6eaf0;
        }

        .stats-section.mt {
        margin-top: 10px;
        }

        .section-header {
        position: relative;
        background: #eef3f7;
        padding: 10px 12px 10px 16px;
        border-bottom: 1px solid #dfe6ee;
        }

        .section-header::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 8px;
        bottom: 8px;
        width: 4px;
        border-radius: 2px;
        background: #0b5aa2;
        }

        .section-title {
        font-weight: 700;
        font-size: 14px;
        color: #0f2c44;
        }

        .rows {
        background: #fff;
        }

        .row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid #edf1f6;
        align-items: center;
        }

        .row:last-child {
        border-bottom: 0;
        }

        .label {
            font-size: 13px;
            color: #1d2b36;
            line-height: 1.2;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .value {
        font-size: 13px;
        font-weight: 700;
        color: #0b0f14;
        text-align: right;
        min-width: 64px;
        }
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
    .info-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 0;
    }
    .info-icon {
        position: relative;
        font-size: $font-size-lg;
        color: $dark_grey;
        border: none;
        margin-right: 0;
        flex-shrink: 0;
        margin-bottom: -5px;
    }
    .info-btn.opened {
        color: lighten($dark_grey, 20%);
    }
    .info-btn:hover {
        cursor: pointer;
        color: lighten($dark_grey, 15%);
    }
    .tooltip-box {
    background: #0f2c44;
    color: #fff;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    padding: 8px 12px;
    border-radius: 4px;
    white-space: normal;
    width: 220px;
    text-align: left;
    box-sizing: border-box;
    pointer-events: auto;
}

.tooltip-box--fixed {
    position: fixed;
    z-index: 99999;
}
}


</style>

<style lang="scss">

#tooltip-overlay-plan-parken {
    position: fixed;
    background: $accent_active;
    color: $white;
    width: 200px;
    padding: 8px 12px;
    border-radius: 4px;
    box-sizing: border-box;
    z-index: 99999;
    pointer-events: auto;
}

#tooltip-overlay-plan-parken .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    transform: translateX(-50%);
}

#tooltip-overlay-plan-parken.tooltip-overlay-plan-parken--top .tooltip-arrow {
    top: 100%;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid $accent_active;
}

#tooltip-overlay-plan-parken.tooltip-overlay-plan-parken--bottom .tooltip-arrow {
    bottom: 100%;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid $accent_active;
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
