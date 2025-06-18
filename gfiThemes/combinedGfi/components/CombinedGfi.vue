<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";

import {isUrl} from "../../../../src/shared/js/utils/urlHelper";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";
import PaginationControl from "../../../../src/shared/modules/pagination/components/PaginationControl.vue";
import AttributeTable from "./AttributeTable.vue";
import AdditionalRequestsAccordion from "./AdditionalRequestsAccordion.vue";
import PrintAccordion from "./PrintAccordion.vue";
import ExportAccordion from "./ExportAccordion.vue";
import {sendPrintRequest} from "../utils/printService.js";

export default {
    name: "CombinedGfi",
    components: {
        SpinnerItem,
        ElevatedButton,
        PaginationControl,
        AttributeTable,
        AdditionalRequestsAccordion,
        PrintAccordion,
        ExportAccordion,
        AccordionItem
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            bufferDistance: null,
            isPrintLoading: false,
            isBufferLoading: false
        };
    },
    computed: {
        ...mapGetters("Modules/GetFeatureInfo", ["clickCoordinates"]),
        ...mapGetters("Modules/CombinedGfi", [
            "alternativeGeometry",
            "alternativePolygonFeature",
            "bufferDistances",
            "fileName",
            "rows",
            "isLoading",
            "initialized",
            "layersToRequest",
            "layerResults",
            "itemsPerPage",
            "previousGeometry",
            "additionalRequests",
            "additionalRequestResults",
            "currentFormat",
            "shownFormatList",
            "bufferedFeature",
            "showBuffer",
            "printServerUrl",
            "printConfigPath",
            "printUtilsPath"
        ]),
        hasSelectedFeature () {
            return this.feature !== null;
        }
    },
    watch: {
        feature: {
            handler (newFeature) {
                if (!this.initialized) {
                    return;
                }

                this.resetBufferLayer();
                this.bufferDistance = null;

                const newGeometry = newFeature.getOlFeature()?.getGeometry(),
                    newCoordinates = newGeometry ? JSON.stringify(newGeometry.getCoordinates()) : null;

                if (this.previousGeometry === newCoordinates) {
                    return;
                }

                this.$store.commit("Modules/CombinedGfi/setPreviousGeometry", newCoordinates);

                if (newGeometry) {
                    this.fetchGfiData({geometry: newGeometry, clickCoordinates: this.clickCoordinates});
                }
                else if (this.clickCoordinates) {
                    this.fetchGfiDataFromClickCoordinates({clickCoordinates: this.clickCoordinates});
                }

                this.$nextTick(() => {
                    const geometryProviderLayer = this.layersToRequest.find(layer => {
                        return layer.geometryProvider;
                    });

                    if (geometryProviderLayer) {
                        this.handleAlternativeGeometry({feature: newFeature, clickCoordinates: this.clickCoordinates});
                    }
                });
            },
            deep: true
        }
    },
    created () {
        this.initCombinedGfi({
            feature: this.feature,
            clickCoordinates: this.clickCoordinates
        });
    },
    unmounted () {
        this.cleanup();
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Maps", ["highlightFeature"]),
        ...mapActions("Modules/CombinedGfi", [
            "initCombinedGfi",
            "fetchGfiData",
            "fetchGfiDataFromClickCoordinates",
            "handleAlternativeGeometry",
            "resetBufferLayer",
            "exportTo",
            "queryBufferedFeatures",
            "cleanup",
            "enlargePolygon"
        ]),
        ...mapMutations("Modules/CombinedGfi", [
            "setCurrentFormat",
            "setBufferedFeature"
        ]),
        /**
         * Tests if the given string is a URL.
         * @param {String} str The string to test.
         * @returns {Boolean} True if the string is a URL.
         */
        isUrl,
        /**
         * Paginates the given rows of features.
         *
         * @param {Array} rows - The array of feature rows to paginate.
         * @param {number} page - The page number to retrieve.
         * @returns {Array} - The paginated features for the specified page.
         */
        paginatedFeatures (rows, page) {
            const start = (page - 1) * this.itemsPerPage,
                end = start + this.itemsPerPage;

            return rows.slice(start, end);
        },
        /**
         * Calculates the total number of pages based on the number of rows.
         *
         * @param {number} rows - The total number of rows.
         * @returns {number} The total number of pages.
         */
        totalPages (rows) {
            return Math.ceil(rows.length / this.itemsPerPage);
        },
        /**
         * Changes the current page of the specified layer.
         *
         * @param {number} layerIndex - The index of the layer to change the page for.
         * @param {number} newPage - The new page number to set for the specified layer.
         */
        changePage (layerIndex, newPage) {
            const maxPage = this.totalPages(this.layerResults[layerIndex].rows);

            let page = newPage;

            if (page < 1) {
                page = 1;
            }
            else if (page > maxPage) {
                page = maxPage;
            }

            this.layerResults[layerIndex].page = newPage;
            this.layerResults[layerIndex].tempPage = newPage;
        },
        /**
         * Validates the given layer index and changes the page accordingly.
         *
         * @param {number} layerIndex - The index of the layer to validate and change to.
         */
        validateAndChangePage (layerIndex) {
            const maxPage = this.totalPages(this.layerResults[layerIndex].rows),
                tempPage = this.layerResults[layerIndex].tempPage;

            if (tempPage < 1) {
                this.layerResults[layerIndex].tempPage = 1;
            }
            else if (tempPage > maxPage) {
                this.layerResults[layerIndex].tempPage = maxPage;
            }

            this.layerResults[layerIndex].page = this.layerResults[layerIndex].tempPage;
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
         * Sends a direct POST request to the MapFish print service and opens or downloads the resulting PDF.
         * Uses the extracted print service module.
         *
         * @async
         * @throws {Error} If there's an error generating or sending the print request
         * @fires addSingleAlert When an error occurs during the print request or response
         */
        async handlePrintRequest () {
            await sendPrintRequest({
                feature: this.feature,
                printConfigPath: this.printConfigPath,
                printUtilsPath: this.printUtilsPath,
                layerResults: this.layerResults,
                alternativePolygonFeature: this.alternativePolygonFeature,
                printServerUrl: this.printServerUrl,
                additionalRequestResults: this.additionalRequestResults,
                onLoadingChange: (loading) => {
                    this.isPrintLoading = loading;
                },
                onError: () => {
                    this.addSingleAlert({
                        category: "error",
                        content: this.$t("common:modules.combinedGfi.printError")
                    });
                }
            });
        },
        /**
         * Gets the display name for a layer, preferring the name from layersToRequest if available.
         * Falls back to the layer's own name if no name is specified in layersToRequest.
         *
         * @param {Object} layerResult - The layer result object containing the layer information.
         * @returns {String} The name to display for the layer.
         */
        getLayerDisplayName (layerResult) {
            if (!layerResult) {
                return "Unknown Layer";
            }

            if (layerResult.layerId) {
                const configLayer = this.layersToRequest.find(
                    layer => String(layer.layerId) === String(layerResult.layerId)
                );

                if (configLayer && configLayer.name) {
                    return configLayer.name;
                }
            }

            return layerResult.layerName || "Unknown Layer";
        },
        exportData () {
            const exportFormat = this.currentFormat;

            if (!exportFormat) {
                console.error("Kein Export-Format ausgewählt");
                return;
            }

            this.exportTo(exportFormat);
        },
        getLayerConfig (layerId) {
            return this.layersToRequest.find(layer => layer.layerId === layerId);
        },
        /**
         * Wrapper for queryBufferedFeatures that manages buffer loading state
         */
        async handleQueryBufferedFeatures () {
            this.isBufferLoading = true;
            try {
                await this.queryBufferedFeatures();
            }
            finally {
                this.isBufferLoading = false;
            }
        }
    }
};
</script>


<template>
    <div id="gfi-table-container">
        <div v-if="isLoading">
            <div class="loading-container">
                <SpinnerItem custom-class="spinner" />
                <div
                    v-if="isBufferLoading"
                    class="loading-text"
                >
                    {{ translate('additional:modules.combinedGfi.queryingArea') }}
                </div>
                <div
                    v-else
                    class="loading-text"
                >
                    {{ translate('additional:modules.combinedGfi.loading') }}
                </div>
            </div>
        </div>
        <div v-else>
            <div
                v-for="(layerResult, index) in layerResults"
                :key="index"
                class="layer-result-container"
            >
                <AccordionItem
                    :id="`layer-${index}`"
                    :title="`${getLayerDisplayName(layerResult)} (${layerResult.rows.length} ${layerResult.rows.length === 1 ? translate('additional:modules.combinedGfi.feature') : translate('additional:modules.combinedGfi.features')})`"
                    :is-open="false"
                    :coloured-header="true"
                    font-size="font-size-big"
                >
                    <div v-if="layerResult.rows.length > 0">
                        <div
                            v-if="totalPages(layerResult.rows) > 1"
                            class="pagination-wrapper"
                        >
                            <PaginationControl
                                :current-page="layerResult.page"
                                :total-pages="totalPages(layerResult.rows)"
                                :go-to-page-text="translate('additional:modules.combinedGfi.goToPage')"
                                @page-change="newPage => changePage(index, newPage)"
                            />
                        </div>
                        <!-- Direct display when only one feature exists -->
                        <div v-if="layerResult.rows.length === 1">
                            <AttributeTable
                                :data="layerResult.rows[0]"
                                :layer-config="getLayerConfig(layerResult.layerId)"
                            />
                        </div>
                        <!-- Accordion for multiple features -->
                        <div
                            v-for="(row, rowIndex) in paginatedFeatures(layerResult.rows, layerResult.page)"
                            v-else
                            :key="rowIndex"
                            class="feature-container"
                        >
                            <AccordionItem
                                :id="`feature-${index}-${rowIndex}`"
                                :title="`${translate('additional:modules.combinedGfi.feature')} ${rowIndex + 1 + (layerResult.page - 1) * itemsPerPage}`"
                                :is-open="false"
                                :coloured-header="true"
                                font-size="font-size-base"
                            >
                                <AttributeTable
                                    :data="row"
                                    :layer-config="getLayerConfig(layerResult.layerId)"
                                />
                            </AccordionItem>
                        </div>
                    </div>
                </AccordionItem>
            </div>
            <div
                v-if="showBuffer"
                class="form-floating mb-3"
            >
                <select
                    id="bufferSelect"
                    v-model="bufferDistance"
                    class="form-select"
                    @change="enlargePolygon(bufferDistance)"
                >
                    <option :value="null">
                        {{ translate('additional:modules.combinedGfi.noBufferSelected') }}
                    </option>
                    <option
                        v-for="distance in bufferDistances"
                        :key="distance"
                        :value="distance"
                    >
                        {{ distance }} {{ translate('additional:modules.combinedGfi.bufferDistanceUnit') }}
                    </option>
                </select>
                <label for="bufferSelect">{{ translate('additional:modules.combinedGfi.selectBufferDistance') }}</label>
            </div>
            <div class="button-group">
                <ElevatedButton
                    :text="translate(isBufferLoading ? 'additional:modules.combinedGfi.queryingArea' : 'additional:modules.combinedGfi.queryArea')"
                    :disabled="!bufferedFeature || isLoading || isBufferLoading"
                    :interaction="handleQueryBufferedFeatures"
                    additional-css="btn-primary"
                />
                <ElevatedButton
                    :text="translate('additional:modules.combinedGfi.removeBuffer')"
                    :disabled="!bufferedFeature"
                    :interaction="() => { resetBufferLayer(); bufferDistance = null; }"
                    additional-css="btn-secondary"
                />
            </div>

            <AdditionalRequestsAccordion
                :additional-request-results="additionalRequestResults"
                :translate="translate"
            />

            <!-- Print section -->
            <PrintAccordion
                :print-config-path="printConfigPath"
                :has-selected-feature="hasSelectedFeature"
                :is-loading="isLoading"
                :is-print-loading="isPrintLoading"
                :send-print-request="handlePrintRequest"
                :translate="translate"
            />

            <!-- Standard export section -->
            <ExportAccordion
                :file-name="fileName"
                :current-format="currentFormat"
                :shown-format-list="shownFormatList"
                :set-current-format="setCurrentFormat"
                :export-data="exportData"
                :translate="translate"
                @update:file-name="value => $store.commit('Modules/CombinedGfi/setFileName', value)"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import 'variables';

.button-group {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
    max-width: 100%;
    overflow: hidden;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    padding: 20px;
}

.spinner {
    margin: 10px auto;
    display: block;
}

.loading-text {
    margin-top: 15px;
    font-size: 0.95em;
    color: $dark_grey;
    text-align: center;
}

#gfi-table-container {
    margin: 10px;
    background: $white;
    max-width: 100%;
    overflow-x: hidden;
    word-wrap: break-word;
}

.layer-result-container {
    margin-bottom: 5px;
    max-width: 100%;
    overflow: hidden;
}

.feature-container {
    margin-bottom: 4px;
    max-width: 100%;
    overflow: hidden;
}

.analysis-result-item {
    margin-bottom: 15px;
    word-break: break-word;
}

.result-container {
    position: relative;
    display: block;
    padding-top: 6px;
}

.result-text {
    display: flex;
    align-items: flex-start;
    line-height: 1.5;
    flex-wrap: wrap;
    margin-top: 8px;
    color: $dark_grey;
}

.analysis-info-position {
    position: absolute;
    top: 0;
    left: 0;
}

.info-text-container {
    position: relative;
    display: inline-block;
}

.info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: $light_blue;
    color: $white;
    font-size: 12px;
    font-weight: bold;
    cursor: help;
}

.info-inline {
    display: block;
    margin-top: 4px;
    background: $light_grey;
    color: $dark_grey;
    border: 1px solid $light_grey;
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 100%;
    word-break: break-word;
    font-size: 0.95em;
}

.tooltip-header {
    font-weight: bold;
    margin-bottom: 6px;
    border-bottom: 1px solid $light_grey;
    padding-bottom: 4px;
    color: $light_blue;
}

.export-dropdown {
    margin-top: 20px;
}

.pagination-wrapper {
    margin: 10px 0;
}

.print-description {
    margin-bottom: 15px;
    color: $dark_grey;
    font-size: 0.9em;
}

.error-message {
    color: $light_red;
    background: lighten($light_red, 45%);
    border: 1px solid $light_red;
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 8px;
}
</style>
