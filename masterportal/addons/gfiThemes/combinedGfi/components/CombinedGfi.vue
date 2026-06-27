<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";

import {isUrl} from "../../../../src/shared/js/utils/urlHelper.js";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";
import PaginationControl from "../../../../src/shared/modules/pagination/components/PaginationControl.vue";
import DefaultTheme from "../../../../src/modules/getFeatureInfo/themes/default/components/DefaultTheme.vue";
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
        DefaultTheme,
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
            "bufferHint",
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
        hasSingleBufferDistance () {
            return this.bufferDistances.length === 1;
        },
        hasSelectedFeature () {
            return this.feature !== null;
        },
        filteredLayerResults () {
            return this.layerResults
                .map((layerResult, originalIndex) => ({...layerResult, originalIndex}))
                .filter(layerResult => layerResult.error || layerResult.rows.length > 0);
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
                    newCoordinates = newGeometry ? JSON.stringify(newGeometry.getCoordinates()) : null,
                    geometryProviderLayer = this.layersToRequest.find(layer => {
                        return layer.geometryProvider;
                    });

                if (this.previousGeometry === newCoordinates) {
                    return;
                }

                this.setPreviousGeometry(newCoordinates);

                if (geometryProviderLayer) {
                    this.$nextTick(async () => {
                        await this.handleAlternativeGeometry({feature: newFeature, clickCoordinates: this.clickCoordinates});
                        if (this.hasSingleBufferDistance) {
                            this.enlargePolygon(this.bufferDistances[0]);
                        }
                    });
                }
                else if (newGeometry) {
                    this.fetchGfiData({geometry: newGeometry, clickCoordinates: this.clickCoordinates});
                }
                else if (this.clickCoordinates) {
                    this.fetchGfiDataFromClickCoordinates({clickCoordinates: this.clickCoordinates});
                }
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
            "setBufferedFeature",
            "setPreviousGeometry",
            "setLayerResults",
            "setFileName"
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
            const maxPage = this.totalPages(this.layerResults[layerIndex].rows),
                updatedLayerResults = [...this.layerResults];

            let page = newPage;

            if (page < 1) {
                page = 1;
            }
            else if (page > maxPage) {
                page = maxPage;
            }

            updatedLayerResults[layerIndex] = {
                ...updatedLayerResults[layerIndex],
                page: newPage,
                tempPage: newPage
            };
            this.setLayerResults(updatedLayerResults);
        },
        /**
         * Validates the given layer index and changes the page accordingly.
         *
         * @param {number} layerIndex - The index of the layer to validate and change to.
         */
        validateAndChangePage (layerIndex) {
            const maxPage = this.totalPages(this.layerResults[layerIndex].rows),
                tempPage = this.layerResults[layerIndex].tempPage,
                updatedLayerResults = [...this.layerResults];

            let validatedPage = tempPage;

            if (tempPage < 1) {
                validatedPage = 1;
            }
            else if (tempPage > maxPage) {
                validatedPage = maxPage;
            }

            updatedLayerResults[layerIndex] = {
                ...updatedLayerResults[layerIndex],
                page: validatedPage,
                tempPage: validatedPage
            };

            // Update the Vuex store with the new array
            this.setLayerResults(updatedLayerResults);
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
                onError: (error) => {
                    console.error("Print request error:", error);
                    this.addSingleAlert({
                        category: "error",
                        content: this.$t("additional:modules.combinedGfi.printError")
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
                return this.$t("additional:modules.combinedGfi.unknownLayer");
            }

            if (layerResult.layerId) {
                const configLayer = this.layersToRequest.find(
                    layer => String(layer.id) === String(layerResult.layerId)
                );

                if (configLayer && configLayer.name) {
                    return configLayer.name;
                }
            }

            return layerResult.layerName || this.translate("additional:modules.combinedGfi.unknownLayer");
        },
        /**
         * Exports the current layer results using the selected export format.
         * Logs an error if no export format is selected.
         *
         * @returns {void}
         */
        exportData () {
            const exportFormat = this.currentFormat;

            if (!exportFormat) {
                console.error(this.translate("additional:modules.combinedGfi.noExportFormatSelected"));
                return;
            }

            this.exportTo(exportFormat);
        },
        /**
         * Retrieves the layer configuration for a given layer ID.
         *
         * @param {string|number} layerId - The ID of the layer to find the configuration for.
         * @returns {Object|undefined} The layer configuration object or undefined if not found.
         */
        getLayerConfig (layerId) {
            return this.layersToRequest.find(layer => layer.id === layerId);
        },
        /**
         * Wrapper for queryBufferedFeatures that manages buffer loading state.
         * Sets loading state to true before querying and ensures it's reset to false afterwards.
         *
         * @async
         * @returns {Promise<void>} A promise that resolves when the buffered features query is complete.
         */
        async handleQueryBufferedFeatures () {
            this.isBufferLoading = true;
            try {
                await this.queryBufferedFeatures();
            }
            finally {
                this.isBufferLoading = false;
            }
        },
        /**
         * Creates a feature-like object compatible with DefaultTheme from raw data.
         * This adapts the data structure to match what DefaultTheme expects.
         *
         * @param {Object} data - The raw feature data.
         * @param {Object} layerConfig - The layer configuration.
         * @returns {Object} A feature-like object with getMappedProperties method.
         */
        createFeatureForDefaultTheme (data, layerConfig) {
            const filteredData = {};

            // Filter out empty values if configured to do so
            Object.entries(data).forEach(([key, value]) => {
                if (!layerConfig?.hideEmptyAttributeValues || (value !== null && value !== undefined && value !== "")) {
                    filteredData[key] = value;
                }
            });

            return {
                getMappedProperties: () => filteredData,
                getTheme: () => ({
                    params: {
                        beautifyKeys: true,
                        showObjectKeys: false,
                        showFavoriteIcons: false
                    }
                }),
                getMimeType: () => null,
                getId: () => `combined-gfi-${Math.random().toString(36).substr(2, 9)}`,
                getLayerId: () => layerConfig?.id || "unknown",
                getTitle: () => layerConfig?.name || "Feature",
                getAttributesToShow: () => Object.keys(filteredData)
            };
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
                v-for="(layerResult, index) in filteredLayerResults"
                :key="`layer-${layerResult.layerId || layerResult.originalIndex || index}`"
                class="layer-result-container"
            >
                <AccordionItem
                    :id="`layer-${layerResult.originalIndex}`"
                    :title="layerResult.error
                        ? `${getLayerDisplayName(layerResult)} — ${layerResult.error}`
                        : `${getLayerDisplayName(layerResult)} (${layerResult.rows.length} ${layerResult.rows.length === 1 ? translate('additional:modules.combinedGfi.feature') : translate('additional:modules.combinedGfi.features')})`"
                    :is-open="false"
                    :coloured-header="true"
                    font-size="font-size-big"
                >
                    <div v-if="layerResult.error">
                        <div class="error-message">
                            {{ layerResult.error }}
                        </div>
                    </div>
                    <div v-else-if="layerResult.rows.length > 0">
                        <div
                            v-if="totalPages(layerResult.rows) > 1"
                            class="pagination-wrapper"
                        >
                            <PaginationControl
                                :current-page="layerResult.page"
                                :total-pages="totalPages(layerResult.rows)"
                                @page-change="newPage => changePage(layerResult.originalIndex, newPage)"
                            />
                        </div>
                        <!-- Direct display when only one feature exists -->
                        <div v-if="layerResult.rows.length === 1">
                            <DefaultTheme
                                :feature="createFeatureForDefaultTheme(layerResult.rows[0], getLayerConfig(layerResult.layerId))"
                            />
                        </div>
                        <!-- Accordion for multiple features -->
                        <div
                            v-for="(row, rowIndex) in paginatedFeatures(layerResult.rows, layerResult.page)"
                            v-else
                            :key="`feature-${layerResult.originalIndex}-${layerResult.page}-${rowIndex}`"
                            class="feature-container"
                        >
                            <AccordionItem
                                :id="`feature-${layerResult.originalIndex}-${rowIndex}`"
                                :title="`${translate('additional:modules.combinedGfi.feature')} ${rowIndex + 1 + (layerResult.page - 1) * itemsPerPage}`"
                                :is-open="false"
                                :coloured-header="true"
                                font-size="font-size-base"
                            >
                                <DefaultTheme
                                    :feature="createFeatureForDefaultTheme(row, getLayerConfig(layerResult.layerId))"
                                />
                            </AccordionItem>
                        </div>
                    </div>
                </AccordionItem>
            </div>
            <template v-if="showBuffer">
                <div
                    v-if="!hasSingleBufferDistance"
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
                        :class="hasSingleBufferDistance ? 'w-100' : ''"
                        :disabled="!bufferedFeature || isLoading || isBufferLoading"
                        :interaction="handleQueryBufferedFeatures"
                        additional-css="btn-primary"
                    />
                    <ElevatedButton
                        v-if="!hasSingleBufferDistance"
                        :text="translate('additional:modules.combinedGfi.removeBuffer')"
                        :disabled="!bufferedFeature"
                        :interaction="() => { resetBufferLayer(); bufferDistance = null; }"
                        additional-css="btn-secondary"
                    />
                </div>
                <div v-if="bufferHint">
                    {{ $t(bufferHint) }}
                </div>
            </template>

            <AdditionalRequestsAccordion
                :additional-request-results="additionalRequestResults"
                :translate-function="translate"
            />

            <!-- Print section -->
            <PrintAccordion
                :print-config-path="printConfigPath"
                :has-selected-feature="hasSelectedFeature"
                :is-loading="isLoading"
                :is-print-loading="isPrintLoading"
                :send-print-request="handlePrintRequest"
                :translate-function="translate"
            />

            <!-- Standard export section -->
            <ExportAccordion
                :file-name="fileName"
                :current-format="currentFormat"
                :shown-format-list="shownFormatList"
                :set-current-format="setCurrentFormat"
                :export-data="exportData"
                :translate-function="translate"
                @update:file-name="setFileName"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import 'variables';

.button-group {
    display: flex;
    justify-content: flex-start;
    gap: 0.625rem;
    margin-top: 0.625rem;
    flex-wrap: wrap;
    max-width: 100%;
    overflow: hidden;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 6.25rem;
    padding: 1.25rem;
}

.spinner {
    margin: 0.625rem auto;
    display: block;
}

.loading-text {
    margin-top: 0.9375rem;
    font-size: 0.95em;
    color: $dark_grey;
    text-align: center;
}

#gfi-table-container {
    margin: 0.625rem;
    background: $white;
    max-width: 100%;
    overflow-x: hidden;
    word-wrap: break-word;
}

.layer-result-container {
    margin-bottom: 0.3125rem;
    max-width: 100%;
    overflow: hidden;
}

.feature-container {
    margin-bottom: 0.25rem;
    max-width: 100%;
    overflow: hidden;
}

.analysis-result-item {
    margin-bottom: 0.9375rem;
    word-break: break-word;
}

.result-container {
    position: relative;
    display: block;
    padding-top: 0.375rem;
}

.result-text {
    display: flex;
    align-items: flex-start;
    line-height: 1.5;
    flex-wrap: wrap;
    margin-top: 0.5rem;
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
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    background-color: $light_blue;
    color: $white;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: help;
}

.info-inline {
    display: block;
    margin-top: 0.25rem;
    background: $light_grey;
    color: $dark_grey;
    border: 0.0625rem solid $light_grey;
    border-radius: 0.25rem;
    padding: 0.375rem 0.625rem;
    max-width: 100%;
    word-break: break-word;
    font-size: 0.95em;
}

.tooltip-header {
    font-weight: bold;
    margin-bottom: 0.375rem;
    border-bottom: 0.0625rem solid $light_grey;
    padding-bottom: 0.25rem;
    color: $light_blue;
}

.export-dropdown {
    margin-top: 1.25rem;
}

.pagination-wrapper {
    margin: 0.625rem 0;
}

.print-description {
    margin-bottom: 0.9375rem;
    color: $dark_grey;
    font-size: 0.9em;
}

.error-message {
    color: $light_red;
    background: lighten($light_red, 45%);
    border: 0.0625rem solid $light_red;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
}

:deep(.table) {
    max-width: none;
}
</style>
