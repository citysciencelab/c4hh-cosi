<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";

import {Polygon} from "ol/geom";
import Feature from "ol/Feature.js";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import {GeoJSON} from "ol/format";
import {Fill, Stroke, Style} from "ol/style";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp";
import {isUrl} from "../../../../src/shared/js/utils/urlHelper";
import ElevatedButton from "../../../../src/shared/modules/buttons/components/ElevatedButton.vue";
import PaginationControl from "../../../../src/shared/modules/pagination/components/PaginationControl.vue";
import AttributeTable from "./AttributeTable.vue";
import AdditionalRequestsAccordion from "./AdditionalRequestsAccordion.vue";
import PrintAccordion from "./PrintAccordion.vue";
import ExportAccordion from "./ExportAccordion.vue";

export default {
    name: "CombinedGfi",
    components: {
        SpinnerItem,
        ElevatedButton,
        PaginationControl,
        AttributeTable,
        AdditionalRequestsAccordion,
        PrintAccordion,
        ExportAccordion
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
            printUtils: null
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

                // Only proceed if the geometry has actually changed
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
            "cleanup"
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
         * Diese Methoden wurden in die Shared Pagination Komponente verschoben
         */
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
         * Enlarges a polygon by a specified buffer distance.
         *
         * @param {number} bufferDistance - The distance by which to enlarge the polygon.
         */
        enlargePolygon (bufferDistance) {
            this.resetBufferLayer();
            if (bufferDistance === null) {
                return;
            }

            const olFeature = this.alternativeGeometry ? this.alternativePolygonFeature : this.feature.getOlFeature(),
                geometry = olFeature.getGeometry();

            if (!olFeature) {
                console.error("No feature available for buffering");
                return;
            }

            if (!geometry) {
                console.error("No geometry available on feature for buffering");
                return;
            }

            try {
                const geojsonFormat = new GeoJSON(),
                    geojson = geojsonFormat.writeGeometry(geometry),
                    reader = new GeoJSONReader(),
                    jstsGeom = reader.read(geojson),
                    buffered = BufferOp.bufferOp(jstsGeom, bufferDistance),
                    donutGeom = OverlayOp.difference(buffered, jstsGeom),
                    writer = new GeoJSONWriter(),
                    bufferedGeojson = writer.write(donutGeom);

                let coordinates;

                if (bufferedGeojson.type === "MultiPolygon") {
                    const outerRing = bufferedGeojson.coordinates[0][0],
                        innerRings = [];

                    bufferedGeojson.coordinates.forEach((poly, index) => {
                        if (index === 0) {
                            innerRings.push(...poly.slice(1));
                        }
                        else {
                            innerRings.push(...poly);
                        }
                    });

                    coordinates = [outerRing, ...innerRings];
                }
                else if (bufferedGeojson.type === "Polygon") {
                    coordinates = bufferedGeojson.coordinates;
                }
                else {
                    throw new Error(`Unexpected geometry type: ${bufferedGeojson.type}`);
                }

                // eslint-disable-next-line one-var
                const polygonFeature = new Feature({
                        geometry: new Polygon(coordinates)
                    }),
                    vectorSource = new VectorSource({
                        features: [polygonFeature]
                    }),
                    vectorLayer = new VectorLayer({
                        alwaysOnTop: true,
                        id: "bufferedLayer",
                        source: vectorSource,
                        zIndex: 999,
                        style: new Style({
                            fill: new Fill({
                                color: "rgba(255, 0, 0, 0.3)"
                            }),
                            stroke: new Stroke({
                                color: "red",
                                width: 2
                            })
                        })
                    }),
                    map = mapCollection.getMap("2D"),
                    existingLayer = map.getLayers().getArray().find(layer => layer.get("id") === "bufferedLayer"),
                    extent = polygonFeature.getGeometry().getExtent();

                if (!map) {
                    console.error("Map not found!");
                    return;
                }
                this.setBufferedFeature(polygonFeature);
                if (existingLayer) {
                    map.removeLayer(existingLayer);
                }
                map.addLayer(vectorLayer);

                if (extent.some(coord => isNaN(coord))) {
                    console.error("Invalid extent:", extent);
                    return;
                }

                map.getView().fit(extent, {
                    duration: 1000,
                    maxZoom: 16,
                    padding: [50, 50, 50, 50]
                });
            }
            catch (error) {
                console.error("Error creating buffered polygon:", error);
            }
        },
        /**
         * Loads and executes the print utils module
         *
         * @param {string} utilsPath - The path to the print utils module
         * @param {Response|null} existingResponse - An existing response if already fetched
         * @returns {Object} The prepared module and the preparePrintRequest function
         * @throws {Error} If the module could not be loaded or the function not found
         */
        async loadPrintUtilsModule (utilsPath, existingResponse) {
            const response = existingResponse,
                printUtilsPath = utilsPath,
                contentType = response.headers.get("content-type"),
                text = await response.text();

            if (!response || !response.ok) {
                console.error("Failed to load printUtils.js");
                this.printUtils = null;
                return;
            }

            if (contentType?.includes("text/html") ||
                text.trim().startsWith("<!DOCTYPE") ||
                text.trim().startsWith("<html")) {
                throw new Error(`Received HTML instead of JavaScript from ${printUtilsPath}`);
            }

            if (!text.trim()) {
                throw new Error(`Empty content received from ${printUtilsPath}`);
            }

            try {
                let preparePrintRequest;

                // First try dynamic import
                try {
                    const printModule = await import(/* webpackIgnore: true */ printUtilsPath);

                    preparePrintRequest = printModule.preparePrintRequest || null;
                }
                catch (importError) {
                    console.error("Dynamic import failed, trying CommonJS style:", importError);

                    // Fallback to CommonJS style loading
                    const module = {exports: {}},
                        exports = module.exports;

                    // eslint-disable-next-line no-new-func
                    new Function("module", "exports", text)(module, exports);

                    if (typeof module.exports.preparePrintRequest === "function") {
                        preparePrintRequest = module.exports.preparePrintRequest;
                    }
                    else if (typeof exports.preparePrintRequest === "function") {
                        preparePrintRequest = exports.preparePrintRequest;
                    }
                    else if (typeof module.exports === "function") {
                        preparePrintRequest = module.exports;
                    }
                }

                if (!preparePrintRequest || typeof preparePrintRequest !== "function") {
                    throw new Error(`preparePrintRequest function not found in ${printUtilsPath}`);
                }

                this.printUtils = {
                    preparePrintRequest,
                    printUtilsPath
                };
            }
            catch (error) {
                console.error("Error loading printUtils module:", error);
                this.printUtils = null;
                throw new Error(`Failed to load printUtils module: ${error.message}`);
            }
        },

        /**
         * Sends the print request to the server
         * @param {Function} preparePrintRequest - The function to prepare the print request
         * @param {Object} olFeature - The OpenLayers feature
         * @param {string} printConfigPath - The path to the print configuration
         * @returns {Promise} The print response
         */
        async sendPrintRequestToServer (preparePrintRequest, olFeature, printConfigPath) {
            const printRequest = await preparePrintRequest(
                    olFeature,
                    this.layerResults,
                    this.alternativePolygonFeature,
                    printConfigPath,
                    this.additionalRequestResults
                ),
                response = await fetch(this.printServerUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(printRequest)
                });

            if (!response.ok) {
                const errorText = await response.text();

                console.error("Print server error response:", {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`Print server responded with status: ${response.status} - ${errorText}`);
            }

            return response;
        },

        /**
         * Processes the print response and downloads the PDF
         *
         * @param {Response} printResponse - The response from the print server
         */
        async processPrintResponse (printResponse) {
            try {
                const pdfBlob = await printResponse.blob(),
                    url = URL.createObjectURL(pdfBlob),
                    link = document.createElement("a"),
                    contentDisposition = printResponse.headers.get("Content-Disposition"),
                    filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/),
                    filename = filenameMatch ? filenameMatch[1] : "flaechenbericht.pdf";

                link.href = url;
                link.target = "_blank";
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            catch (error) {
                console.error("Error processing print response:", error);
                throw new Error("Failed to process print response");
            }
        },

        /**
         * Sends a direct POST request to the MapFish print service and opens or downloads the resulting PDF.
         * to the print server instead of saving it as a JSON file.
         *
         * @async
         * @throws {Error} If there's an error generating or sending the print request
         * @fires addSingleAlert When an error occurs during the print request or response
         */
        async sendPrintRequest () {
            this.isPrintLoading = true;
            try {
                const olFeature = this.feature.getOlFeature(),
                    printConfigPath = this.printConfigPath,
                    printUtilsPath = this.printUtilsPath;

                let response;

                try {
                    const {path, response: utilsResponse} = await this.tryFetchPrintUtils([printUtilsPath, "./resources/printUtils.js"]);

                    response = utilsResponse;
                    await this.loadPrintUtilsModule(path, response);
                }
                catch (err) {
                    console.error(`Failed to load from ${printUtilsPath}`);
                    this.printUtils = null;
                    return;
                }

                if (!this.printUtils) {
                    throw new Error("Failed to load print utils");
                }

                // eslint-disable-next-line one-var
                const printResponse = await this.sendPrintRequestToServer(
                    this.printUtils.preparePrintRequest,
                    olFeature,
                    printConfigPath
                );

                await this.processPrintResponse(printResponse);
            }
            catch (error) {
                console.error("Error sending print request:", error);
                this.addSingleAlert({
                    category: "error",
                    content: this.$t("common:modules.combinedGfi.printError")
                });
            }
            finally {
                this.isPrintLoading = false;
            }
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

            // Find the matching layer configuration using layerId
            if (layerResult.layerId) {
                const configLayer = this.layersToRequest.find(
                    layer => String(layer.layerId) === String(layerResult.layerId)
                );

                if (configLayer && configLayer.name) {
                    return configLayer.name;
                }
            }

            // Fall back to the original layer name
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
        async tryFetchPrintUtils (paths) {
            for (const path of paths) {
                try {
                    const resp = await fetch(path);

                    if (resp.ok) {
                        return {path, response: resp};
                    }
                }
                catch (err) {
                    console.error(`Failed to load from ${path}`);
                }
            }
            return {path: null, response: null};
        },
        getLayerConfig (layerId) {
            return this.layersToRequest.find(layer => layer.layerId === layerId);
        }
    }
};
</script>


<template>
    <div id="gfi-table-container">
        <div v-if="isLoading">
            <SpinnerItem custom-class="spinner" />
        </div>
        <div v-else>
            <div
                v-for="(layerResult, index) in layerResults"
                :key="index"
                class="layer-result-container"
            >
                <details>
                    <summary class="layer-name">
                        {{ getLayerDisplayName(layerResult) }}
                        <span class="feature-count">
                            ({{ layerResult.rows.length }} {{ layerResult.rows.length === 1 ?
                                translate('additional:modules.combinedGfi.feature') :
                                translate('additional:modules.combinedGfi.features') }})
                        </span>
                    </summary>
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
                            <details>
                                <summary class="feature-summary">
                                    {{ translate('additional:modules.combinedGfi.feature') }} {{ rowIndex + 1 + (layerResult.page - 1) * itemsPerPage }}
                                </summary>
                                <AttributeTable
                                    :data="row"
                                    :layer-config="getLayerConfig(layerResult.layerId)"
                                />
                            </details>
                        </div>
                    </div>
                </details>
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
                    :text="translate('additional:modules.combinedGfi.queryArea')"
                    :disabled="!bufferedFeature"
                    :interaction="queryBufferedFeatures"
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
                :send-print-request="sendPrintRequest"
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
}

.spinner {
    margin: 20px auto;
    display: block;
}

#gfi-table-container {
    margin: 10px;
    background: $white;
}

.layer-result-container {
    margin-bottom: 5px;
}

.layer-name {
    font-weight: bold;
    color: $dark_blue;
    cursor: pointer;
}

details summary {
    font-size: 1.1em;
    padding: 8px;
    border: 1px solid $light_grey;
    background-color: $white;
    color: $dark_blue;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    margin: 0;
}
details summary:hover {
    background-color: $light_grey;
}
details[open] summary {
    border-bottom: 1px solid $light_grey;
}

.feature-container {
    margin-bottom: 4px;
}

.feature-count {
    float: right;
    font-size: 0.9em;
    color: $dark_grey;
    margin-left: 10px;
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

.pagination-wrapper {    margin: 10px 0;}

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
