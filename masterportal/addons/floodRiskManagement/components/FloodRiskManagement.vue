<script>
import AccordionItem from "../../../src/shared/modules/accordion/components/AccordionItem.vue";
import axios from "axios";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import FloodRiskManagementCard from "../components/FloodRiskManagementCard.vue";
import FloodRiskManagementSwitcher from "../components/FloodRiskManagementSwitcher.vue";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SpinnerItem from "../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import thousandsSeparator from "../../../src/shared/js/utils/thousandsSeparator.js";
import layerProvider from "../js/getVisibleLayer.js";

export default {
    name: "FloodRiskManagement",
    components: {
        AccordionItem,
        FlatButton,
        FloodRiskManagementCard,
        FloodRiskManagementSwitcher,
        SpinnerItem,
        SwitchInput
    },
    data () {
        return {
            sideMenuWidth: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/FloodRiskManagement", [
            "autoAdjustScale",
            "cycleId",
            "cycles",
            "eventListener",
            "events",
            "isPrinting",
            "isScaleSelectedManually",
            "layoutList",
            "layoutMapInfo",
            "mappedLayerGroup",
            "maskStarted",
            "printDisabled",
            "printHwsId",
            "printLayerList",
            "printServiceId",
            "printUrl",
            "selectedCycleName",
            "selectedEvent",
            "selectedFrequency",
            "selectedType",
            "scaleList",
            "types",
            "visibleLayerList"
        ]),
        ...mapGetters("Maps", ["scale"]),

        currentScale: {
            get () {
                return this.$store.state.Modules.FloodRiskManagement.currentScale;
            },
            set (value) {
                this.setCurrentScale(value);
            }
        },

        /**
         * Gets the flood event.
         * @returns {String[]} The flood event.
         */
        floodEvent () {
            return this.selectedEvent ? Object.entries(this.events[this.selectedEvent]) : "";
        },

        /**
         * Gets the reversed cycles' keys.
         * @returns {String[]} The keys as names of the cycles.
         */
        reversedCyclesKeys () {
            return Object.keys(this.cycles).reverse();
        },

        /**
         * Gets the selected layers id list.
         * @returns {String[]} The selected layers id list.
         */
        selectedLayersId () {
            return this.cycles[this.selectedCycleName]?.layers.find(layer => layer.printId === this.printHwsId).layerId;
        },

        /**
         * Gets the verification of the cycle.
         * @returns {String[]} The verification of the cycle.
         */
        verification () {
            const verification = [];

            this.reversedCyclesKeys.forEach(key => {
                verification.push(this.cycles[key].verification);
            });

            return verification;
        }
    },
    watch: {
        /**
         * Watcher for setting the selected cycle id.
         * @param {String} val - The selected cycle name.
         * @returns {void}
         */
        selectedCycleName (val) {
            this.setCycleId(String(Object.keys(this.cycles).indexOf(val) + 1));
        },

        /**
         * Watcher for get the selected layer group.
         * @param {String} val - The selected event.
         * @returns {void}
         */
        selectedEvent (val) {
            this.setPrintHwsId(this.getPrintHwsId(val, this.selectedFrequency, this.selectedType));
        },

        /**
         * Watcher for get the selected layer group.
         * @param {String} val - The selected frequency.
         * @returns {void}
         */
        selectedFrequency (val) {
            this.setPrintHwsId(this.getPrintHwsId(this.selectedEvent, val, this.selectedType));
        },

        /**
         * Watcher for get the selected layer group.
         * @param {String} val - The selected type.
         * @returns {void}
         */
        selectedType (val) {
            this.setPrintHwsId(this.getPrintHwsId(this.selectedEvent, this.selectedFrequency, val));
        },

        /**
         * Watcher for activating the layers.
         * @param {String[]} newVal - The selected layers list.
         * @returns {void}
         */
        selectedLayersId: {
            handler (newVal) {
                this.deactivateLayer(layerProvider.getVisibleLayerList());
                this.activateLayer(newVal);

                this.$nextTick(() => {
                    const printLayers = [];

                    newVal.forEach(id => {
                        printLayers.push(layerCollection.getLayerById(id)?.layer);
                    });

                    this.setPrintLayerList(printLayers);
                    if (this.maskStarted) {
                        this.togglePostrenderListener();
                        this.updateCanvasLayer();
                    }
                });
            },
            deep: true
        }
    },
    mounted () {
        if (document.getElementById("mp-menu-secondaryMenu")) {
            this.sideMenuWidth = document.getElementById("mp-menu-secondaryMenu").style.width;
            document.getElementById("mp-menu-secondaryMenu").style.width = "33vw";
        }

        if (this.selectedCycleName === "") {
            this.setSelectedCycleName(this.reversedCyclesKeys[0]);
        }

        if (typeof this.printHwsId === "string" && this.printHwsId !== "") {
            this.setSelectedEvent(this.mappedLayerGroup[this.printHwsId].event);
            this.setSelectedFrequency(this.mappedLayerGroup[this.printHwsId].frequency);
            this.setSelectedType(this.mappedLayerGroup[this.printHwsId].type);
        }

        this.$nextTick(() => {
            this.setIsScaleSelectedManually(false);
            this.retrieveCapabilites();
            this.togglePostrenderListener();
        });
    },
    unmounted () {
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;
    },
    methods: {
        ...mapActions(["addOrReplaceLayer"]),
        ...mapActions("Modules/FloodRiskManagement", [
            "getOptimalResolution",
            "retrieveCapabilites",
            "startPrint",
            "togglePostrenderListener",
            "updateCanvasLayer"
        ]),
        ...mapActions("Modules/LayerTree", ["removeLayer"]),
        ...mapMutations("Modules/FloodRiskManagement", [
            "setAutoAdjustScale",
            "setCurrentScale",
            "setCycleId",
            "setIsScaleSelectedManually",
            "setMaskStarted",
            "setPrintDisabled",
            "setPrintHwsId",
            "setPrintLayerList",
            "setPrintStarted",
            "setPrintUrl",
            "setSelectedCycleName",
            "setSelectedEvent",
            "setSelectedFrequency",
            "setSelectedType"
        ]),

        /**
         * Activates the layer according to the layer id.
         * @param {String[]} layerIds - The layer ids.
         * @returns {void}
         */
        activateLayer (layerIds) {
            if (Array.isArray(layerIds) && layerIds.length) {
                layerIds.forEach(id => {
                    this.addOrReplaceLayer({layerId: id, visibility: true});
                });
            }
        },

        /**
         * Deactivates the layer according to the layer id.
         * @param {ol/Layer[]} layers - The visible layers.
         * @returns {void}
         */
        deactivateLayer (layers) {
            if (Array.isArray(layers) && layers.length) {
                layers.forEach(layer => {
                    this.removeLayer({id: layer.get("id")});
                });
            }
        },

        /**
         * Downloads the pdf file by the url
         * @param {String} url - The print url.
         * @returns {void}
         */
        download (url) {
            if (typeof url !== "string" || url === "") {
                return;
            }
            window.open(url, "_blank");
            this.setPrintUrl("");
        },

        /**
         * Generates and sets the print hws id.
         * @param {String} event - The selected event.
         * @param {String} frequency - The selected frequency.
         * @param {String} type - The selected type.
         * @returns {String} the print hws id.
         */
        getPrintHwsId (event, frequency, type) {
            if (typeof event !== "string" || typeof type !== "string" || typeof frequency !== "string") {
                return "";
            }

            let printHwsId = "";

            Object.keys(this.mappedLayerGroup).forEach(key => {
                if (this.mappedLayerGroup[key].event === event && this.mappedLayerGroup[key].frequency === frequency && this.mappedLayerGroup[key].type === type) {
                    printHwsId = key;
                }
            });

            return printHwsId;
        },

        /**
         * Starts the print
         * @returns {void}
         */
        print () {
            this.setPrintStarted(true);
            this.startPrint({
                getResponse: async (url, payload) => {
                    return axios.post(url, payload);
                }
            });
        },

        /**
         * Returns the "beautified" scale to be shown in the dropdown box
         * @param {Number} scale the scale to beautify
         * @returns {String} the beautified scale
         */
        returnScale (scale) {
            if (typeof scale !== "number") {
                return "";
            }
            else if (scale < 10000) {
                return String(scale);
            }
            return thousandsSeparator(scale, " ");
        },

        /**
         * The events when the scale is changed.
         * @param {event} event the click event
         * @returns {void}
         */
        async scaleChanged (event) {
            const scale = parseInt(event.target.value, 10),
                resolution = {
                    "scale": scale,
                    "mapSize": mapCollection.getMap("2D").getSize(),
                    "printMapSize": this.layoutMapInfo
                };

            this.setIsScaleSelectedManually(true);
            this.getOptimalResolution(resolution);
            this.updateCanvasLayer();
            await mapCollection.getMap("2D").render();
        },

        /**
         * Toggles the print button and print mask.
         * @returns {void}
         */
        togglePrintButton () {
            this.setMaskStarted(!this.maskStarted);
            this.setPrintDisabled(!this.printDisabled);
            this.togglePostrenderListener();
        }
    }
};
</script>

<template lang="html">
    <div
        id="tool-FloodRiskManagement"
        class="flood-risk-management position-relative"
    >
        <h5>
            {{ $t('additional:modules.floodRiskManagement.subtitle') }}
        </h5>
        <AccordionItem
            id="info-accordion"
            :title="$t('additional:modules.floodRiskManagement.information')"
            icon="bi bi-exclamation-circle"
        >
            <span> {{ $t('additional:modules.floodRiskManagement.informationText') }} </span>
        </AccordionItem>
        <div class="cycle-section">
            <h5>
                {{ $t('additional:modules.floodRiskManagement.headline.cycle') }}
            </h5>
            <FloodRiskManagementSwitcher
                class="cycle-switch"
                :buttons="reversedCyclesKeys"
                :sub-text="verification"
                :group="`cycle-group`"
                :selected-value="selectedCycleName === '' ? reversedCyclesKeys[0] : selectedCycleName"
                @setSelectedElement="setSelectedCycleName"
            />
            <div class="maptype-section mt-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.mapType') }}
                </h5>
                <span class="small-text">
                    {{ $t('additional:modules.floodRiskManagement.mapInformation') }}
                </span>
                <div class="container">
                    <div class="row pt-2">
                        <FloodRiskManagementCard
                            v-for="(card, idx) in types"
                            :id="`map-type${idx}`"
                            :key="idx"
                            class="col col-xs-12 mt-2 mx-2"
                            :icon="card.icon"
                            :title="card.type"
                            :text="card.text"
                            :selected-card="selectedType"
                            @setSelected="setSelectedType"
                        />
                    </div>
                </div>
            </div>
            <div class="flood-event-section mt-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.floodEvent') }}
                </h5>
                <FloodRiskManagementSwitcher
                    class="event-switch"
                    :buttons="Object.keys(events)"
                    :group="`events-group`"
                    :selected-value="selectedEvent"
                    @setSelectedElement="setSelectedEvent"
                />
            </div>
            <div class="frequency-event-section py-4">
                <h5>
                    {{ $t('additional:modules.floodRiskManagement.headline.frequencyFloodEvents') }}
                </h5>
                <div>
                    <div class="container">
                        <div class="row pt-2">
                            <FloodRiskManagementCard
                                v-for="(card, idx) in floodEvent"
                                :id="`card-Frequency${idx}`"
                                :key="idx"
                                class="col col-xs-12 mt-2 mx-2 pt-4"
                                :title="card[0]"
                                :text="card[1]"
                                :selected-card="selectedFrequency"
                                @setSelected="setSelectedFrequency"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                class="form-floating scale mt-4"
            >
                <select
                    id="printScale"
                    v-model="currentScale"
                    class="form-select"
                    @change="scaleChanged($event)"
                >
                    <option
                        v-for="(scale, i) in scaleList"
                        :key="i"
                        :value="scale"
                        :selected="scale === currentScale"
                    >
                        1 : {{ returnScale(scale) }}
                    </option>
                </select>
                <label for="printScale">
                    {{ $t('additional:modules.floodRiskManagement.label.scaleLabel') }}
                </label>
            </div>
            <div class="row info mb-3 mt-2">
                <span class="col-1 info-icon d-flex align-items-center">
                    <i class="bi-info-circle" />
                </span>
                <div class="col info-text ps-3">
                    {{ $t("additional:modules.floodRiskManagement.hintInfoScale") }}
                </div>
            </div>
            <div
                class="form-check form-switch mt-3 mb-3 d-flex align-items-center"
            >
                <SwitchInput
                    :id="'autoAdjustScale'"
                    :aria="$t('additional:modules.floodRiskManagement.label.autoAdjustScale')"
                    :checked="autoAdjustScale && !isScaleSelectedManually"
                    :interaction="($event) => setAutoAdjustScale($event.target.checked)"
                    :label="$t('additional:modules.floodRiskManagement.label.autoAdjustScale')"
                />
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-12 d-flex justify-content-center">
                    <FlatButton
                        id="settingsBtn"
                        class="pe-2"
                        :aria-label="$t('additional:modules.floodRiskManagement.button.applyLabel')"
                        :icon="'bi bi-check-all'"
                        :interaction="() => togglePrintButton()"
                        :text="$t('additional:modules.floodRiskManagement.button.applyLabel')"
                    />
                </div>
                <div class="print col-md-12 d-flex justify-content-center">
                    <FlatButton
                        v-if="printUrl===''"
                        id="printBtn"
                        :aria-label="$t('additional:modules.floodRiskManagement.button.printLabel')"
                        :disabled="printDisabled"
                        :icon="'bi bi-printer'"
                        :interaction="() => print()"
                        :text="$t('additional:modules.floodRiskManagement.button.printLabel')"
                    />
                    <FlatButton
                        v-else
                        id="printBtn"
                        :aria-label="$t('additional:modules.floodRiskManagement.button.downloadLabel')"
                        :disabled="printDisabled"
                        :icon="'bi bi-printer'"
                        :interaction="() => download(printUrl)"
                        :text="$t('additional:modules.floodRiskManagement.button.downloadLabel')"
                    />
                    <span
                        v-if="isPrinting"
                        class="is-printing"
                    >
                        <SpinnerItem />
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
    .info {
        max-width: fit-content;
        .info-icon {
            font-size: 1.5rem;
        }
        .info-text {
            font-size: $font-size-sm;
        }
    }
    .small-text {
        font-size: $font_size_sm;
    }

    .print {
        position: relative;
        .is-printing {
            background: rgba(255, 255, 255, 0.3);
            position: absolute;
            left: 0;
            right: 0;
            width: 100%;
            height: 100%;
            text-align: center;
            align-content: center;
        }
    }
</style>

