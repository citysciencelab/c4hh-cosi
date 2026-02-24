import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import {Polygon} from "ol/geom.js";
import Feature from "ol/Feature.js";
import WFS from "ol/format/WFS";
import {intersects} from "ol/format/filter";
import {
    extractColumnsFromResults,
    extractRowsFromResults,
    extractFeaturesFromWmsGml,
    extractFeaturesFromEsriWms,
    extractFeaturesFromWfsGml,
    getCoordinateFromGeometry,
    shrinkPolygonGeoJson,
    getBufferValue,
    getCrsUrl,
    extractFeaturesFromOafJson,
    normalizeAttributes,
    getAllRequestLayers
} from "../utils/gfiUtils.js";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import {GeoJSON} from "ol/format.js";
import {exportToDOC, exportToPDF, exportToJSON} from "../utils/exportUtils.js";
import OGCAPIProcesses from "@masterportal/masterportalapi/src/api/ogcApiProcesses.js";
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp";
import {Fill, Stroke, Style} from "ol/style.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {addExtentCoordinates, processPointResults} from "../utils/geometryUtils.js";
import mapCollection from "@core/maps/js/mapCollection.js";
import {loadModule} from "../utils/loadModule.js";

const actions = {
    /**
     * Initializes the combined GFI (Get Feature Info) process.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.feature - The feature object.
     * @param {Object} payload.clickCoordinates - The coordinates where the user clicked.
     * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
     */
    async initCombinedGfi ({dispatch, commit, state}, {feature, clickCoordinates}) {
        const themeParams = feature?.getTheme()?.params || {},
            geometry = feature.getOlFeature().getGeometry(),
            alternativeGeometryAvailable = themeParams.layersToRequest.find(layer => layer.geometryProvider),
            exportConfig = themeParams.export || {},
            fileName = exportConfig.fileName || i18next.t("additional:modules.combinedGfi.defaultFileName"),
            shownFormatList = exportConfig.shownFormatList || ["PDF", "DOC", "JSON"];

        commit("setLayersToRequest", themeParams.layersToRequest || []);
        commit("setAdditionalRequests", themeParams.additionalRequests || []);
        commit("setPrintServerUrl", themeParams.printServerUrl || "");
        commit("setPrintConfigPath", themeParams.printConfigPath || "");
        commit("setPrintUtilsPath", themeParams.printUtilsPath || "");
        commit("setShowBuffer", themeParams.showBuffer || false);
        if (themeParams.bufferDistances) {
            commit("setBufferDistances", themeParams.bufferDistances);
        }
        if (themeParams.bufferAttributes) {
            commit("setBufferAttributes", themeParams.bufferAttributes);
        }
        if (themeParams.bufferHint) {
            commit("setBufferHint", themeParams.bufferHint);
        }
        commit("setFeature", feature);

        commit("setFileName", fileName);
        commit("setShownFormatList", shownFormatList);

        if (geometry) {
            await dispatch("fetchGfiData", {geometry});
        }
        if (alternativeGeometryAvailable) {
            commit("setAlternativeGeometry", true);
            await dispatch("handleAlternativeGeometry", {feature, clickCoordinates});
        }
        else if (!alternativeGeometryAvailable && !geometry && clickCoordinates) {
            await dispatch("fetchGfiDataFromClickCoordinates", {clickCoordinates});
        }
        await dispatch("fetchAdditionalRequests", "init");
        if (state.bufferDistances.length === 1) {
            await dispatch("enlargePolygon", state.bufferDistances[0]);
        }
        commit("setInitialized", true);
    },

    /**
     * Fetches GFI (Get Feature Info) data based on the provided geometry or click coordinates.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - Vuex commit function to mutate state.
     * @param {Object} context.state - Vuex state object.
     * @param {Function} context.dispatch - Vuex dispatch function to call other actions.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.geometry - The geometry object used to derive coordinates.
     * @param {boolean} [payload.displayResults=true] - Flag to determine whether to display the results.
     * @param {Array<number>} [payload.clickCoordinates=null] - The coordinates from a click event.
     * @returns {Promise<void>} - A promise that resolves when the GFI data fetching is complete.
     */
    async fetchGfiData ({commit, state, dispatch}, {geometry, displayResults = true, clickCoordinates = null}) {
        commit("setIsLoading", true);
        const coordinate = geometry
                ? getCoordinateFromGeometry(geometry)
                : clickCoordinates,
            filteredLayers = state.layersToRequest
                .map(layerConfig => rawLayerList.getLayerWhere({id: layerConfig.id}))
                .filter(layer => layer);

        if (!coordinate) {
            console.error("No valid coordinates provided for GFI query.");
            commit("setIsLoading", false);
            return;
        }
        if (filteredLayers.length === 0) {
            commit("setIsLoading", false);
            return;
        }
        try {
            const results = await Promise.all(
                filteredLayers.map(layer => dispatch("fetchDataForLayer", {layer, geometry})
                )
            );

            if (displayResults) {
                commit("setGfiResults", results);
                dispatch("processGfiResults", results);
            }
        }
        catch (error) {
            console.error("Error during GFI request:", error);
        }
        finally {
            commit("setIsLoading", false);
        }
    },

    /**
     * Fetches GFI (Get Feature Info) data based on the provided click coordinates.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Object} context.state - Vuex state object.
     * @param {Object} payload - The payload object.
     * @param {Array<number>} payload.clickCoordinates - The coordinates where the click occurred.
     *
     * @returns {Promise<void>} - A promise that resolves when the GFI data fetching is complete.
     *
     * @throws {Error} Will throw an error if the GFI request fails.
     */
    async fetchGfiDataFromClickCoordinates ({dispatch, commit, state}, {clickCoordinates}) {
        commit("setIsLoading", true);

        const filteredLayers = state.layersToRequest
            .map(layerConfig => {
                const layer = rawLayerList.getLayerWhere({id: layerConfig.id});

                return layer;
            })
            .filter(layer => layer);

        if (!clickCoordinates) {
            console.error("No valid click coordinates provided for GFI query.");
            commit("setIsLoading", false);
            return;
        }
        if (filteredLayers.length === 0) {
            commit("setIsLoading", false);
            return;
        }
        try {
            const requests = filteredLayers.map(layer => dispatch("fetchDataForLayer", {
                    layer,
                    geometry: null,
                    coordinate: clickCoordinates
                })),
                results = await Promise.all(requests);

            commit("setGfiResults", results);
            dispatch("processGfiResults", results);
        }
        catch (error) {
            console.error("Error during GFI request:", error);
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.combinedGfi.errors.gfiRequestError")
            }, {root: true});
        }
        finally {
            commit("setIsLoading", false);
        }
    },

    /**
     * Handles the alternative geometry by fetching data from a specified geometry provider layer,
     * creating a polygon feature from the fetched coordinates, and highlighting the feature on the map.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Object} context.state - Vuex state object.
     * @param {Object} payload - The payload object.
     * @param {Array<number>} payload.clickCoordinates - The coordinates where the user clicked.
     * @returns {Promise<void>} - A promise that resolves when the alternative geometry has been handled.
     */
    async handleAlternativeGeometry ({commit, dispatch, state}, {clickCoordinates}) {
        const geometryProviderLayerFromConfig = state.layersToRequest.find(layer => layer.geometryProvider),
            geometryProviderLayerId = geometryProviderLayerFromConfig.id,
            geometryProviderAttribute = geometryProviderLayerFromConfig.geometryProvider.geometryAttribute,
            geometryProvider = rawLayerList.getLayerWhere({id: geometryProviderLayerId}),
            resolution = mapCollection.getMapView("2D").getResolution(),
            result = await dispatch("fetchDataForLayer", {
                layer: geometryProvider,
                geometry: null,
                coordinate: clickCoordinates,
                resolution
            }),
            coordinatesRare = result[0][geometryProviderAttribute],
            multiCoordinates = Array.isArray(coordinatesRare),
            coordinatesArray = multiCoordinates
                ? coordinatesRare.map((string) => string.split(" ").map(Number))
                : coordinatesRare.split(" ").map(Number),
            coordinates = [];

        if (!geometryProviderLayerFromConfig) {
            return;
        }

        if (multiCoordinates) {
            coordinatesArray.forEach((coordinatesSubArray) => {
                const subCoordinates = [];

                for (let i = 0; i < coordinatesSubArray.length; i += 2) {
                    subCoordinates.push([coordinatesSubArray[i], coordinatesSubArray[i + 1]]);
                }
                coordinates.push(subCoordinates);
            });
        }
        else {
            for (let i = 0; i < coordinatesArray.length; i += 2) {
                coordinates.push([coordinatesArray[i], coordinatesArray[i + 1]]);
            }
        }
        if (coordinates.length) {
            const polygonFeature = new Feature({geometry: new Polygon(multiCoordinates ? coordinates : [coordinates])}),
                highlightObject = {
                    feature: polygonFeature,
                    layer: {id: geometryProvider.id},
                    styleId: geometryProvider.styleId,
                    type: "highlightPolygon",
                    highlightStyle: {}
                };

            commit("setAlternativePolygonFeature", polygonFeature);
            await dispatch("fetchGfiData", {geometry: polygonFeature.getGeometry()});

            dispatch("Maps/highlightFeature", highlightObject, {root: true});
            commit("setPreviousGeometry", JSON.stringify(coordinates));
        }
    },

    /**
     * Fetches additional requests and commits the aggregated results.
     *
     * @param {Object} context - The Vuex action context.
     * @param {string} [trigger="init"] - The trigger that initiated this request.
     * @returns {Promise<void>}
     */
    async fetchAdditionalRequests (context, trigger = "init") {
        const {commit, dispatch, state, rootGetters} = context,
            additionalResults = await Promise.all(state.additionalRequests
                .filter(request => !request.triggerRequestOn || request.triggerRequestOn === trigger)
                .map(async request => {
                    if (request.type === "ogcApiProcesses") {
                        try {
                            const inputs = {
                                    ...request.staticInputs ?? {},
                                    ...(request.dynamicInputs?.getters ?? []).reduce((accumulator, current) => {
                                        accumulator[current.key] = rootGetters[current.path];
                                        return accumulator;
                                    }, {}),
                                    ...await (request.dynamicInputs?.parsers ?? []).reduce(async (accumulator, current) => {
                                        const resolvedAccumulator = await accumulator;

                                        resolvedAccumulator[current.key] = (await loadModule(current.path))(context);
                                        return resolvedAccumulator;
                                    }, Promise.resolve({}))
                                },
                                executeResponse = await OGCAPIProcesses.executeProcess(request.url, request.processId, inputs),
                                jobID = executeResponse.jobID,
                                jobResults = await OGCAPIProcesses.pollJobResults(request.url, jobID, {
                                    timeout: request.timeout,
                                    stallFor: request.stallFor
                                });

                            return {
                                url: request.url,
                                text: JSON.stringify(
                                    request.resultText
                                        ? request.resultText.reduce((stepper, key) => stepper[key], jobResults)
                                        : jobResults.outputs, null, 2
                                ),
                                infoText: request.infoText || ""
                            };
                        }
                        catch (error) {
                            console.error("Error executing OGC API Process:", error);

                            dispatch("Alerting/addSingleAlert", {
                                category: "error",
                                content: i18next.t("additional:modules.combinedGfi.errors.ogcApiProcessError")
                            }, {root: true});

                            return {
                                url: request.url,
                                text: i18next.t("additional:modules.combinedGfi.errors.ogcApiProcessError"),
                                infoText: request.infoText || ""
                            };
                        }
                    }
                    throw new Error(i18next.t("additional:modules.combinedGfi.errors.unsupportedRequestType") + `: "${request.type}"`);
                }));

        commit("setAdditionalRequestResults", additionalResults);
    },

    /**
     * Resets the buffer layer on the map by removing the layer with the id "bufferedLayer".
     * Commits the mutation to set the buffered feature to null and clears additional request results.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - The Vuex commit function.
     */
    resetBufferLayer ({commit}) {
        const map = mapCollection.getMap("2D"),
            bufferLayer = map.getLayers()
                .getArray()
                .find(layer => layer.get("id") === "bufferedLayer");

        if (bufferLayer) {
            map.removeLayer(bufferLayer);
            commit("setBufferedFeature", null);
            commit("setAdditionalRequestResults", []);
        }
    },

    /**
     * Fetches data for a layer using the appropriate service type (WMS, WFS, or OAF).
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.state - The Vuex state object.
     * @param {Object} context.rootGetters - The Vuex root getters.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object to fetch data for.
     * @param {Array<number>} [payload.coordinate] - The coordinate to use for fetching data.
     * @param {Object} [payload.geometry] - The geometry to use for fetching data.
     * @param {number} [payload.resolution] - The resolution to use for fetching data.
     * @returns {Promise<Object|null>} The fetched data or null if an error occurred.
     */
    async fetchDataForLayer ({dispatch, state, rootGetters}, {layer, coordinate, geometry, resolution}) {
        const layerConfig = state.layersToRequest.find(
                config => config.id === layer.id
            ),
            geometryProvider = layerConfig?.geometryProvider,
            layerWithConfig = {
                ...layer,
                wfsQueryBufferSize: layerConfig?.wfsQueryBufferSize || 0.0001
            },
            attributes = layerConfig?.gfiAttributes || "showAll",
            attributesForRequest = attributes,
            ignoredKeys = rootGetters?.ignoredKeys || state?.ignoredKeys || [];

        if (!layerConfig) {
            return null;
        }

        if (layer.typ === "WFS") {
            if (geometry) {
                return dispatch("fetchWfsData", {layer: layerWithConfig, geometry, attributes: attributesForRequest, ignoredKeys});
            }
            else if (geometryProvider) {
                let geometryProviderAttributes = [];

                if (attributes === "showAll") {
                    geometryProviderAttributes = "showAll";
                }
                else if (attributes === "ignore") {
                    geometryProviderAttributes = [geometryProvider.geometryAttribute];
                }
                else if (typeof attributes === "object" && !Array.isArray(attributes)) {
                    geometryProviderAttributes = [
                        ...Object.keys(attributes),
                        geometryProvider.geometryAttribute
                    ];
                }

                return dispatch("fetchWfsDataWithPoint", {
                    layer: layerWithConfig,
                    coordinates: coordinate,
                    attributes: Object.fromEntries(geometryProviderAttributes.map(key => [key, key])),
                    ignoredKeys
                });
            }
            else if (coordinate) {
                return dispatch("fetchWfsDataWithPoint", {
                    layer: layerWithConfig,
                    coordinates: coordinate,
                    attributes: attributesForRequest,
                    ignoredKeys
                });
            }
            console.error("WFS request requires either geometry or click coordinates.");
            return null;
        }
        else if (layer.typ === "WMS") {
            const queryCoordinate = coordinate || rootGetters["Modules/GetFeatureInfo/clickCoordinates"],
                mapResolution = resolution || mapCollection.getMapView("2D").getResolution();

            if (queryCoordinate) {
                return dispatch("fetchGfiForWmsLayer", {
                    layer,
                    coordinate: queryCoordinate,
                    resolution: mapResolution,
                    attributes: attributesForRequest,
                    ignoredKeys
                });
            }
            console.error("WMS request requires either coordinate or click coordinates.");
            return null;
        }
        else if (layer.typ === "OAF") {
            return dispatch("fetchOafData", {layer, geometry, attributes: attributesForRequest, ignoredKeys});
        }

        console.error(`Unknown layer type for layer ${layer.id}.`);
        return null;
    },

    /**
     * Fetches GetFeatureInfo (GFI) data for a given WMS layer.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Object} layer - The WMS layer object.
     * @param {string} layer.url - The URL of the WMS service.
     * @param {string} layer.layers - The layers to query.
     * @param {Array<number>} coordinate - The coordinate to query [x, y].
     * @param {number} resolution - The map resolution.
     * @param {string|Array|Object} attributes - Additional attributes for the query.
     * @param {Array<string>} [ignoredKeys=[]] - Keys to ignore during feature extraction.
     * @returns {Promise<null|Object>} The result of the feature extraction or null if an error occurs.
     */
    async fetchGfiForWmsLayer (_, {layer, coordinate, resolution, attributes, ignoredKeys = []}) {
        const serviceUrl = layer?.url,
            mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            version = layer.version || "1.1.1",
            infoFormat = "text/xml; subtype=gml/3.2.1",
            bboxSize = 256 * resolution,
            normalizedAttributes = normalizeAttributes(attributes),
            config = {
                "1.1.1": {
                    srsParam: "srs",
                    xyParams: {x: 128, y: 128},
                    getBbox: (coord, size) => [
                        coord[0] - size / 2,
                        coord[1] - size / 2,
                        coord[0] + size / 2,
                        coord[1] + size / 2
                    ]
                },
                "1.3.0": {
                    srsParam: "crs",
                    xyParams: {i: 128, j: 128},
                    getBbox: (coord, size) => {
                        const bbox = [
                            coord[0] - size / 2,
                            coord[1] - size / 2,
                            coord[0] + size / 2,
                            coord[1] + size / 2
                        ];

                        if (mapProjection === "EPSG:4326") {
                            return [bbox[1], bbox[0], bbox[3], bbox[2]];
                        }
                        return bbox;
                    }
                }
            },

            versionConfig = config[version],
            bbox = versionConfig.getBbox(coordinate, bboxSize).join(","),
            {x, y, i, j} = versionConfig.xyParams,
            url = new URL(serviceUrl);

        url.searchParams.set("service", "WMS");
        url.searchParams.set("version", version);
        url.searchParams.set("request", "GetFeatureInfo");
        url.searchParams.set("layers", layer.layers);
        url.searchParams.set("query_layers", layer.layers);
        url.searchParams.set("width", "256");
        url.searchParams.set("height", "256");
        url.searchParams.set("bbox", bbox);
        url.searchParams.set(versionConfig.srsParam, mapProjection);
        url.searchParams.set("info_format", infoFormat);

        if (x !== undefined) {
            url.searchParams.set("x", x);
            url.searchParams.set("y", y);
        }
        else {
            url.searchParams.set("i", i);
            url.searchParams.set("j", j);
        }

        if (!url) {
            console.error("No valid URL for WMS GetFeatureInfo:", layer);
            return null;
        }
        try {
            const response = await fetch(url),
                text = await response.text(),
                parsedResponse = new DOMParser().parseFromString(text, "application/xml"),
                isEsriResponse = parsedResponse.documentElement.namespaceURI === "http://www.esri.com/wms" ||
                parsedResponse.querySelector("FeatureInfoResponse")?.namespaceURI === "http://www.esri.com/wms";

            if (!response.ok) {
                if (response.status === 404) {
                    return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
                }
                console.error(`Failed to fetch WMS features: ${response.status} ${response.statusText}`);
                return {error: `Dienstfehler (${response.status})`};
            }

            return isEsriResponse
                ? extractFeaturesFromEsriWms(parsedResponse, normalizedAttributes, ignoredKeys)
                : extractFeaturesFromWmsGml(parsedResponse, normalizedAttributes, ignoredKeys);
        }
        catch (error) {
            console.error("Error during WMS query:", error);
            return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
        }
    },

    /**
     * Fetches WFS data using point coordinates and dispatches the extracted features.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing WFS service details.
     * @param {string} payload.layer.url - The URL of the WFS service.
     * @param {string} [payload.layer.version="1.1.0"] - The version of the WFS service.
     * @param {string} [payload.layer.featureType="default_layer"] - The feature type name.
     * @param {Array<number>} payload.coordinates - The coordinates [longitude, latitude] to use for the WFS request.
     * @param {string|Array|Object} payload.attributes - Additional attributes to pass to the feature extraction.
     * @param {Array<string>} [ignoredKeys=[]] - Keys to ignore during feature extraction.
     * @returns {Promise<null|*>} - Returns the result of extracting features or null in case of an error.
     */
    async fetchWfsDataWithPoint (_, {layer, coordinates, attributes, ignoredKeys = []}) {
        const mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            bufferSize = layer.wfsQueryBufferSize || 0.0001,
            bbox = [
                coordinates[0] - bufferSize,
                coordinates[1] - bufferSize,
                coordinates[0] + bufferSize,
                coordinates[1] + bufferSize
            ].join(","),
            serviceUrl = layer?.url,
            version = layer?.version || "1.1.0",
            typeName = layer?.featureType || "default_layer",
            typeNameParam = version === "2.0.0" ? "typeNames" : "typeName",
            url = new URL(serviceUrl),
            normalizedAttributes = normalizeAttributes(attributes);

        url.searchParams.set("service", "WFS");
        url.searchParams.set("version", version);
        url.searchParams.set("request", "GetFeature");
        url.searchParams.set(typeNameParam, typeName);
        url.searchParams.set("bbox", `${bbox},${mapProjection}`);
        url.searchParams.set("outputFormat", "text/xml; subtype=gml/3.2.1");

        try {
            const response = await fetch(url.toString()),
                text = await response.text(),
                parsedResponse = new DOMParser().parseFromString(text, "application/xml"),
                features = extractFeaturesFromWfsGml(parsedResponse, normalizedAttributes, ignoredKeys);

            return features;
        }
        catch (error) {
            console.error("Error during WFS request with point coordinates:", error);
            return null;
        }
    },

    /**
     * Fetches WFS (Web Feature Service) data for a given layer and geometry.
     *
     * This function supports two modes of operation:
     * 1. Standard mode: Uses a simple bbox-based query when geometryAttribute and featureType are not specified in config
     * 2. Advanced mode: Uses a more precise spatial filter when geometryAttribute and featureType are specified in config
     *
     * The advanced mode with spatial filter provides more accurate results but requires proper configuration.
     * To use the advanced mode, specify these values in the layer config:
     * - geometryAttribute: The name of the geometry attribute in the WFS service
     * - featureType: The feature type name including namespace (e.g. "ave:Flurstueck")
     *
     * @param {Object} context - The Vuex action context.
     * @param {Object} context.state - The Vuex state object.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing WFS service details.
     * @param {Object} payload.geometry - The geometry object to query.
     * @param {string|Array|Object} payload.attributes - Additional attributes for the WFS request.
     * @param {Array<string>} [ignoredKeys=[]] - Keys to ignore during feature extraction.
     * @returns {Promise<null|Object>} - Returns null if an error occurs or the result of extracting features from WFS GML.
     */
    async fetchWfsData ({state}, {layer, geometry, attributes, ignoredKeys = []}) {
        const mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            serviceUrl = layer?.url,
            version = layer?.version || "1.1.0",
            layerConfig = state.layersToRequest.find(config => config.id === layer.id),
            typeName = layerConfig?.featureType || layer?.featureType || "default_layer",
            typeNameParam = version === "2.0.0" ? "typeNames" : "typeName",
            reader = new GeoJSONReader(),
            geojsonGeometry = geometry.getType ? new GeoJSON().writeGeometryObject(geometry) : geometry,
            jstsGeom = reader.read(geojsonGeometry),
            area = jstsGeom.getArea(),
            initialBufferValue = getBufferValue(area),
            bufferCandidates = [initialBufferValue, -4, -2, -1, 0],
            normalizedAttributes = normalizeAttributes(attributes);

        let shrunkenGeometry = null;

        for (const candidate of bufferCandidates) {
            const candidateGeometry = shrinkPolygonGeoJson(geojsonGeometry, candidate);

            if (
                candidateGeometry &&
                candidateGeometry.type === "Polygon" &&
                Array.isArray(candidateGeometry.coordinates) &&
                candidateGeometry.coordinates[0] &&
                candidateGeometry.coordinates[0].length >= 4
            ) {
                shrunkenGeometry = candidateGeometry;
                break;
            }
        }
        if (!serviceUrl) {
            console.error("No valid URL for WFS:", layer);
            return null;
        }

        if (!layerConfig?.geometryAttribute || !layerConfig?.featureType) {
            const extent = geometry.getExtent(),
                bbox = extent.join(","),
                url = new URL(serviceUrl);

            url.searchParams.set("service", "WFS");
            url.searchParams.set("version", version);
            url.searchParams.set("request", "GetFeature");
            url.searchParams.set(typeNameParam, typeName);
            url.searchParams.set("bbox", `${bbox},${mapProjection}`);
            url.searchParams.set("outputFormat", "text/xml; subtype=gml/3.2.1");

            try {
                const response = await fetch(url.toString()),
                    text = await response.text(),
                    parsedResponse = new DOMParser().parseFromString(text, "application/xml"),
                    features = extractFeaturesFromWfsGml(parsedResponse, normalizedAttributes, ignoredKeys, geometry);

                if (!response.ok) {
                    if (response.status === 404) {
                        return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
                    }
                    console.error(`Failed to fetch features: ${response.status} ${response.statusText}`);
                    return {error: `Dienstfehler (${response.status})`};
                }

                return features;
            }
            catch (error) {
                console.error("Error during WFS query:", error);
                return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
            }
        }
        if (!shrunkenGeometry) {
            shrunkenGeometry = geojsonGeometry;
        }

        if (shrunkenGeometry) {
            const wfsRequestBuilder = new WFS({version});

            const requestBody = wfsRequestBuilder.writeGetFeature({
                srsName: mapProjection,
                featureNS: layer.featureNS,
                featurePrefix: typeName.split(":")[0],
                featureTypes: [typeName.split(":")[1]],
                outputFormat: "text/xml; subtype=gml/3.2.1",
                filter: intersects(
                    layerConfig.geometryAttribute,
                    new GeoJSON().readGeometry(shrunkenGeometry),
                    mapProjection
                )
            });

            try {
                const response = await fetch(
                        new URL(serviceUrl).toString(),
                        {
                            method: "POST",
                            headers: {"Content-Type": "text/xml"},
                            body: new XMLSerializer().serializeToString(requestBody)
                        }

                    ),
                    text = await response.text(),
                    parsedResponse = new DOMParser().parseFromString(text, "application/xml");

                if (!response.ok) {
                    if (response.status === 404) {
                        return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
                    }
                    console.error(`Failed to fetch features: ${response.status} ${response.statusText}`);
                    return {error: `Dienstfehler (${response.status})`};
                }

                return extractFeaturesFromWfsGml(parsedResponse, normalizedAttributes, ignoredKeys);
            }
            catch (error) {
                console.error("Error fetching features:", error);
                return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
            }
        }

        return null;
    },

    /**
     * Processes GFI (Get Feature Info) results and commits the processed layer results to the store.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.rootGetters - Vuex root getters.
     * @param {Array|Object} results - The GFI results to process. Can be an array or a single object.
     * @returns {Promise<void>} - A promise that resolves when the processing is complete.
     */
    async processGfiResults ({commit, state, rootGetters}, results) {
        const ignoredKeys = rootGetters.ignoredKeys,
            normalizedResults = Array.isArray(results)
                ? results.map(result => JSON.parse(JSON.stringify(result)))
                : JSON.parse(JSON.stringify(results)),

            layerResults = await Promise.all(
                state.layersToRequest.map(async (layerConfig, index) => {
                    const result = normalizedResults[index],
                        rawLayer = rawLayerList.getLayerWhere({id: layerConfig.id}),
                        layerName = rawLayer?.name || `Layer ${index + 1}`,
                        features = Array.isArray(result) ? result : [result],
                        headers = extractColumnsFromResults(features, layerConfig.gfiAttributes, ignoredKeys),
                        rows = extractRowsFromResults(features, layerConfig.gfiAttributes, ignoredKeys);

                    if (result.error) {
                        return {
                            layerId: layerConfig.id,
                            layerName,
                            headers: [],
                            rows: [],
                            error: result.error
                        };
                    }

                    if (!result || typeof result !== "object") {
                        return null;
                    }
                    return {
                        layerId: layerConfig.id,
                        layerName,
                        headers,
                        rows,
                        page: 1,
                        tempPage: 1
                    };
                })
            ),

            validResults = layerResults.filter(layerResult => layerResult !== null);

        if (!normalizedResults || normalizedResults.length === 0) {
            commit("setLayerResults", []);
            return;
        }

        if (validResults.length === 0) {
            commit("setLayerResults", []);
        }
        else {
            commit("setLayerResults", validResults);
        }
    },

    /**
     * Processes a single layer for buffered feature queries.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} layerConfig - The layer configuration object.
     * @param {Object} geometry - The buffered geometry.
     * @param {Object} bufferedResults - The results object to populate.
     * @returns {Promise<void>} A promise that resolves when the layer is processed.
     */
    async processLayerForBufferedQuery ({getters, dispatch}, {layerConfig, geometry, bufferedResults}) {
        const layer = rawLayerList.getLayerWhere({id: layerConfig.id}),
            resolution = mapCollection.getMapView("2D").getResolution(),
            attributes = getters.bufferAttributes?.[layerConfig.id] || layerConfig.gfiAttributes || [];

        if (!layer) {
            console.error(`Layer with ID ${layerConfig.id} not found`);
            return;
        }

        if (layer.typ === "WFS") {
            const results = await dispatch("fetchWfsData", {
                layer,
                geometry,
                attributes
            });

            if (results && results.length > 0) {
                bufferedResults[layer.name] = results;
            }
        }
        else if (layer.typ === "OAF") {
            const results = await dispatch("fetchOafData", {
                layer,
                geometry,
                attributes
            });

            if (results && results.length > 0) {
                bufferedResults[layer.name] = results;
            }
        }
        else if (layer.typ === "WMS") {
            const geometryType = geometry.getType(),
                coordinates = [],
                allResults = [];

            if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
                dispatch("handlePolygonCoordinates", {coordinates, geometry});
            }
            else {
                coordinates.push(getCoordinateFromGeometry(geometry));
            }

            for (const coordinate of coordinates) {
                const pointResults = await dispatch("fetchGfiForWmsLayer", {
                    layer,
                    coordinate,
                    resolution,
                    attributes
                });

                processPointResults(pointResults, allResults);
            }

            if (allResults.length > 0) {
                bufferedResults[layer.name] = allResults;
            }
        }
    },

    /**
     * Queries features from all configured layers using the buffered geometry.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.commit - The Vuex commit function.
     */
    async queryBufferedFeatures ({dispatch, state, commit}) {
        if (!state.bufferedFeature) {
            return;
        }

        commit("setIsLoading", true);

        try {
            const bufferedResults = {},
                geometry = state.bufferedFeature.getGeometry(),
                layersToRequest = getAllRequestLayers(state.layersToRequest, state.bufferAttributes);

            for (const layerConfig of layersToRequest) {
                try {
                    await dispatch("processLayerForBufferedQuery", {
                        layerConfig,
                        geometry,
                        bufferedResults
                    });
                }
                catch (error) {
                    console.error(`Error querying features for layer ${layerConfig.id}:`, error);
                }
            }

            commit("setBufferedLayerResults", bufferedResults);
            await dispatch("fetchAdditionalRequests", "queryBuffer");
        }
        finally {
            commit("setIsLoading", false);
        }
    },

    /**
     * Resets all state and cleans up when the component is unmounted.
     * This includes removing layers, clearing results, and resetting flags.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.state - The Vuex state object.
     */
    async cleanup ({commit, dispatch, state}) {
        await dispatch("resetBufferLayer");
        commit("setBufferedFeature", null);
        commit("setBufferedLayerResults", {});
        commit("setGfiResults", []);
        commit("setLayerResults", []);

        const map = mapCollection.getMap("2D");

        if (map) {
            const shrunkenLayer = map.getLayers().getArray().find(layer => layer.get("id") === "shrunkenPolygonLayer");

            if (shrunkenLayer) {
                map.removeLayer(shrunkenLayer);
            }
        }

        if (state.alternativeGeometry) {
            dispatch("Maps/removeHighlightFeature", "highlightPolygon", {root: true});
            commit("setAlternativeGeometry", false);
            commit("setAlternativePolygonFeature", null);
        }

        commit("setInitialized", false);
        commit("setPreviousGeometry", null);
    },

    /**
     * Exports data to the specified format using the exportUtils functions.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.state - The Vuex state object.
     * @param {Function} context.commit - The Vuex commit function.
     * @param {String} format - The format to export to (PDF, DOC, JSON).
     * @returns {Promise<void>} A promise that resolves when the export is complete.
     */
    exportTo ({state, commit}, format) {
        if (!state.layerResults || state.layerResults.length === 0) {
            return;
        }

        /**
         * Sets the loading state
         * @param {boolean} isLoading - The loading state to set
         */
        function setIsLoading (isLoading) {
            commit("setIsLoading", isLoading);
        }

        const exportFormat = format || state.currentFormat || "PDF";

        switch (exportFormat.toUpperCase()) {
            case "PDF":
                exportToPDF({
                    layerResults: state.layerResults,
                    fileName: state.fileName,
                    setIsLoading,
                    translations: {
                        defaultFileName: i18next.t("additional:modules.combinedGfi.defaultFileName"),
                        exportAsPdf: i18next.t("additional:modules.combinedGfi.exportAsPdf")
                    }
                });
                break;
            case "DOC":
                exportToDOC({
                    layerResults: state.layerResults,
                    fileName: state.fileName,
                    setIsLoading,
                    translations: {
                        defaultFileName: i18next.t("additional:modules.combinedGfi.defaultFileName"),
                        exportAsDoc: i18next.t("additional:modules.combinedGfi.exportAsDoc"),
                        noData: i18next.t("additional:modules.combinedGfi.noData")
                    }
                });
                break;
            case "JSON":
                exportToJSON({
                    layerResults: state.layerResults,
                    fileName: state.fileName,
                    setIsLoading,
                    translations: {
                        defaultFileName: i18next.t("additional:modules.combinedGfi.defaultFileName")
                    }
                });
                break;
            default:
                break;
        }
    },

    /**
     * Fetches data from an OAF (Open API Feature) service for a given layer and geometry.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing OAF service details.
     * @param {Object} payload.geometry - The geometry object to query.
     * @param {string|Array|Object} payload.attributes - Attributes to request and extract from the response.
     * @param {Array<string>} [ignoredKeys=[]] - Keys to ignore during feature extraction.
     * @returns {Promise<Array|null>} - Returns an array of feature objects or null if an error occurs.
     */
    async fetchOafData (_, {layer, geometry, attributes, ignoredKeys = []}) {
        if (!layer?.url) {
            console.error("No valid URL for OAF service:", layer);
            return null;
        }

        const baseUrl = layer.url,
            collectionId = layer.collection,
            mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            normalizedAttributes = normalizeAttributes(attributes);

        try {
            const itemsUrl = new URL(`${baseUrl.replace(/\/$/, "")}/collections/${collectionId}/items`);

            itemsUrl.searchParams.set("f", "json");

            if (geometry) {
                const geometryType = geometry.getType();

                if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
                    if (geometryType === "MultiPolygon") {
                        const extent = geometry.getExtent(),
                            bbox = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;

                        itemsUrl.searchParams.set("bbox", bbox);
                        itemsUrl.searchParams.set("bbox-crs", getCrsUrl(mapProjection));
                    }
                    else {
                        const extent = geometry.getExtent(),
                            bbox = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;

                        itemsUrl.searchParams.set("bbox", bbox);
                        itemsUrl.searchParams.set("bbox-crs", getCrsUrl(mapProjection));
                    }
                }
                else {
                    const center = getCoordinateFromGeometry(geometry),
                        bufferSize = layer.oafQueryBufferSize || 0.0001;

                    itemsUrl.searchParams.set("bbox", `${center[0] - bufferSize},${center[1] - bufferSize},${center[0] + bufferSize},${center[1] + bufferSize}`);
                }
            }

            if (layer.accessToken) {
                itemsUrl.searchParams.set("access_token", layer.accessToken);
            }

            if (itemsUrl.searchParams.size > 0) {
                const response = await fetch(itemsUrl, {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        }
                    }),
                    data = await response.json(),
                    extractionGeometry = ["Polygon", "MultiPolygon"].includes(geometry?.getType()) ? geometry : null;

                if (!response.ok) {
                    if (response.status === 404) {
                        return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
                    }
                    console.error(`Failed to fetch OAF features: ${response.status} ${response.statusText}`);
                    return {error: `Dienstfehler (${response.status})`};
                }

                return extractFeaturesFromOafJson(data, normalizedAttributes, ignoredKeys, extractionGeometry);
            }
            return null;
        }
        catch (error) {
            console.error("Error during OAF query:", error);
            return {error: i18next.t("additional:modules.combinedGfi.errors.serviceUnavailable")};
        }
    },
    /**
     * Handles polygon coordinates and adds them to the coordinates array
     * @param {Object} context - The Vuex action context
     * @param {Object} payload - The payload object
     * @param {Array} payload.coordinates - The array to add coordinates to
     * @param {Object} payload.geometry - The geometry object
     */
    handlePolygonCoordinates (_, {coordinates, geometry}) {
        const coords = Array.isArray(coordinates) ? coordinates : [],
            center = getCoordinateFromGeometry(geometry),
            extent = geometry.getExtent();

        coords.push(center);

        if (extent[2] - extent[0] > 0.001 || extent[3] - extent[1] > 0.001) {
            addExtentCoordinates(coords, extent);
        }
    },
    /**
     * Enlarges a polygon by a specified buffer distance. If the buffer distance is 0, no buffer
     * will be shown, and the original feature geometry will be used as the "buffered" one.
     *
     * @param {Object} context - The Vuex action context.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Function} context.dispatch - Vuex dispatch function.
     * @param {Object} context.state - Vuex state object.
     * @param {Object} context.rootGetters - Vuex root getters.
     * @param {number} bufferDistance - The distance by which to enlarge the polygon.
     * @returns {Promise<void>} - A promise that resolves when the polygon has been enlarged.
     */
    async enlargePolygon ({commit, dispatch, state}, bufferDistance) {
        await dispatch("resetBufferLayer");

        if (bufferDistance === null) {
            return;
        }

        const olFeature = state.alternativeGeometry ? state.alternativePolygonFeature : state.feature?.getOlFeature(),
            geometry = olFeature?.getGeometry();

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
                buffered = bufferDistance === 0 ? jstsGeom : BufferOp.bufferOp(jstsGeom, bufferDistance),
                donutGeom = OverlayOp.difference(buffered, jstsGeom),
                writer = new GeoJSONWriter(),
                bufferedGeojson = writer.write(bufferDistance === 0 ? jstsGeom : donutGeom);

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

            if (coordinates) {
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
                        zIndex: 1000,
                        style: bufferDistance === 0 ? null : new Style({
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

                commit("setBufferedFeature", polygonFeature);

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

        }
        catch (error) {
            console.error("Error creating buffered polygon:", error);
        }
    }
};

export default actions;
