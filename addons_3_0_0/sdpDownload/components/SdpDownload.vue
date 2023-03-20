<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FlatButton from "../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";
import GraphicalSelect from "../../../../src_3_0_0/shared/modules/graphicalSelect/components/GraphicalSelect.vue";

export default {
    name: "SdpDownload",
    components: {
        FlatButton,
        GraphicalSelect
    },
    data () {
        return {
            options_value: {
                "Box": this.translate("common:snippets.graphicalSelect.selectBySquare"),
                "Circle": this.translate("common:snippets.graphicalSelect.selectByCircle"),
                "Polygon": this.translate("common:snippets.graphicalSelect.selectByPolygon")
            }
        };
    },
    computed: {
        ...mapGetters("Modules/SdpDownload", [
            "formats",
            "icon",
            "transactionProcessing",
            "selectedFormat",
            "selectFormat",
            "howToChooseTiles",
            "downloadDataPackage",
            "specialDownloads",
            "neuwerkDataPackage",
            "scharhoernDataPackage",
            "tileOverview310",
            "tileOverview320"
        ])
    },
    /**
     * Put initialize functions here after mounting
     * @returns {void}
     */
    mounted () {
        this.setActive(true);
        this.loadWfsRaster();
        this.toggleRasterLayer();
        this.$refs.graphicalSelection.createDrawInteraction();
        this.setFocusToFirstControl();
    },
    beforeUnmount () {
        this.setActive(false);
        this.toggleRasterLayer();
        this.clearGraphicalSelect();
    },
    methods: {
        ...mapMutations("Modules/SdpDownload", [
            "setActive",
            "setSelectedFormat",
            "setType"
        ]),
        ...mapActions("Modules/SdpDownload", [
            "requestCompressedData",
            "requestCompressRasterOverviewData",
            "requestCompressIslandData",
            "loadWfsRaster",
            "toggleRasterLayer"
        ]),
        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs.formatSelection) {
                    this.$refs.formatSelection.focus();
                }
            });
        },
        /**
         * Translates the given key, checks if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formatting and plurals
         * @returns {String} the translation or the key itself
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }
            if (key === "common:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the common translation");
            }
            return this.$t(key, options);
        },
        /**
         * Removes drawn objects and interactions from graphicalSelection
         * @returns {void}
         */
        clearGraphicalSelect () {
            this.$refs.graphicalSelection.setStatus(false);
            this.$refs.graphicalSelection.resetView();
        }
    }
};
</script>

<template lang="html">
    <div>
        <form
            id="sdp-download"
            class="form-horizontal"
        >
            <div class="form-floating mb-3">
                <select
                    id="formatSelection"
                    ref="formatSelection"
                    name="formatSelection"
                    aria-label="$t(selectFormat)"
                    class="form-select"
                    @change="setSelectedFormat($event.target.value)"
                >
                    <option
                        v-for="(format,index) in formats"
                        :key="index"
                        :value="format.id"
                        data-bs-toggle="tooltip"
                        :title="format.label"
                    >
                        {{ translate(`additional:modules.tools.sdpdownload.${format.fileId}Label`) }}
                    </option>
                </select>
                <label for="printLayout">
                    {{ $t(selectFormat) }}
                </label>
            </div>
            <div class="form-group col-12">
                <div
                    class="form-group form-group-sm"
                >
                    <GraphicalSelect
                        ref="graphicalSelection"
                        :label="howToChooseTiles"
                    />
                </div>
            </div>
            <div class="d-flex justify-content-center mt-3">
                <FlatButton
                    id="flatButton-selectedDownload"
                    aria-label="translate(downloadDataPackage)"
                    type="button"
                    :text="translate(downloadDataPackage)"
                    :icon="icon"
                    :spinner-trigger="transactionProcessing"
                    :interaction="() => requestCompressedData ()"
                />
            </div>
            <div class="form-group col-12">
                <hr class="mt-1">
                <span>{{ translate(specialDownloads) }}</span>
            </div>
            <div class="form-group col-12">
                <button
                    id="button-neuwerk"
                    type="button"
                    class="w-100 btn btn-sm btn-outline-default btn-block center-block"
                    @click="requestCompressIslandData('Neuwerk')"
                >
                    {{ translate(neuwerkDataPackage) }}
                </button>
            </div>
            <div class="form-group col-12">
                <button
                    id="button-scharhoern"
                    type="button"
                    class="w-100 btn btn-sm btn-outline-default btn-block center-block"
                    @click="requestCompressIslandData('Scharhoern')"
                >
                    {{ $t(scharhoernDataPackage) }}
                </button>
            </div>
            <div class="form-group col-12">
                <button
                    id="button-310"
                    type="button"
                    class="w-100 btn btn-sm btn-outline-default btn-block center-block"
                    @click="requestCompressRasterOverviewData('LS310')"
                >
                    {{ translate(tileOverview310) }}
                </button>
            </div>
            <div class="form-group col-12">
                <button
                    id="button-320"
                    type="button"
                    class="w-100 btn btn-sm btn-outline-default btn-block center-block"
                    @click="requestCompressRasterOverviewData('LS320')"
                >
                    {{ translate(tileOverview320) }}
                </button>
            </div>
        </form>
    </div>
</template>

<style lang="scss" scoped>
  @import "~variables";
  @import "~mixins";

/*sdp download*/
    #button-selectedDownload{
        margin-top: 15px;
    }
    .btn[id*='button-'] {
        color:$dark_grey;
        &:focus {
            @include primary_action_focus;
        }
        &:hover {
            @include primary_action_hover;
        }
    }
    .formatselect{
        width: 100%;
        height: 30px;
        margin-right: 15px;
        padding: 5px 5px;
        font-size: 12px;
        cursor: pointer;
    }
    .limiter{
        border-bottom: 1px solid rgb(229,229,229);
        padding-bottom: 20px;
    }
</style>

// Only works unscoped
<style lang="scss">
 @import "~variables";

    #sdp-circle-overlay {
        position: absolute;
        background: rgba(51, 153, 204, 0.8);
        color: $white;
        padding: 4px 8px;
    }
    #sdp-tooltip-overlay {
        position: absolute;
        background: rgba(51, 153, 204, 0.8);
        color: $white;
        padding: 4px 8px;
    }
</style>
