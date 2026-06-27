<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import GraphicalSelect from "../../../src/shared/modules/graphicalSelect/components/GraphicalSelect.vue";

export default {
    name: "SdpDownload",
    components: {
        FlatButton,
        GraphicalSelect
    },
    data () {
        return {
            options_value: {
                "Box": this.translate("common:shared.modules.graphicalSelect.selectBySquare"),
                "Circle": this.translate("common:shared.modules.graphicalSelect.selectByCircle"),
                "Polygon": this.translate("common:shared.modules.graphicalSelect.selectByPolygon")
            }
        };
    },
    computed: {
        ...mapGetters("Modules/SdpDownload", [
            "downloadDataPackage",
            "formats",
            "howToChooseTiles",
            "icon",
            "neuwerkDataPackage",
            "scharhoernDataPackage",
            "selectedFormat",
            "selectFormat",
            "specialDownloads",
            "tileOverview310",
            "tileOverview320",
            "transactionProcessing"
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
                        {{ translate(`additional:modules.sdpDownload.${format.fileId}Label`) }}
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
                    :text="translate(downloadDataPackage)"
                    :icon="icon"
                    :interaction="() => requestCompressedData ()"
                />
            </div>
            <div class="form-group col-12">
                <hr class="mt-1">
                <span>{{ $t(specialDownloads) }}</span>
            </div>
            <div class="d-flex justify-content-center mt-3">
                <FlatButton
                    id="button-neuwerk"
                    :text="$t(neuwerkDataPackage)"
                    :icon="icon"
                    :interaction="() => requestCompressIslandData('Neuwerk')"
                />
            </div>
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="button-scharhoern"
                    :text="$t(scharhoernDataPackage)"
                    :icon="icon"
                    :interaction="() => requestCompressIslandData('Scharhoern')"
                />
            </div>
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="button-310"
                    :text="$t(tileOverview310)"
                    :icon="icon"
                    :interaction="() => requestCompressRasterOverviewData('LS310')"
                />
            </div>
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="button-320"
                    :text="$t(tileOverview320)"
                    :icon="icon"
                    :interaction="() => requestCompressRasterOverviewData('LS320')"
                />
            </div>
        </form>
    </div>
</template>

<style lang="scss" scoped>

/*sdp download*/
    #button-selectedDownload{
        margin-top: 15px;
    }

</style>

// Only works unscoped
<style lang="scss">

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
