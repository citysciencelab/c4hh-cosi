import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import {Polygon} from "ol/geom";
import Feature from "ol/Feature.js";
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
    extractFeaturesFromOafJson
} from "../utils/gfiUtils";
import {GeoJSON} from "ol/format";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {exportToCSV, exportToDOC, exportToPDF, exportToJSON} from "../utils/exportUtils";
import OGCAPIProcesses from "@masterportal/masterportalapi/src/api/ogcApiProcesses";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp";
import {Fill, Stroke, Style} from "ol/style";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {addExtentCoordinates, processPointResults} from "../utils/geometryUtils";
import mapCollection from "@core/maps/js/mapCollection";

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
    async initCombinedGfi ({dispatch, commit}, {feature, clickCoordinates}) {
        const themeParams = feature?.getTheme()?.params || {},
            geometry = feature.getOlFeature().getGeometry(),
            alternativeGeometryAvailable = themeParams.layersToRequest.find(layer => layer.geometryProvider);

        commit("setLayersToRequest", themeParams.layersToRequest || []);
        commit("setAdditionalRequests", themeParams.additionalRequests || []);
        commit("setPrintServerUrl", themeParams.printServerUrl || "");
        commit("setPrintConfigPath", themeParams.printConfigPath || "");
        commit("setPrintUtilsPath", themeParams.printUtilsPath || "");
        commit("setShowBuffer", themeParams.showBuffer || false);
        if (themeParams.bufferDistances) {
            commit("setBufferDistances", themeParams.bufferDistances);
        }
        commit("setFeature", feature);

        // Set translated fileName
        commit("setFileName", i18next.t("additional:modules.combinedGfi.defaultFileName"));

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
                .map(layerConfig => rawLayerList.getLayerWhere({id: layerConfig.layerId}))
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
                const layer = rawLayerList.getLayerWhere({id: layerConfig.layerId});

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
                content: i18next.t("common:modules.combinedGfi.errors.gfiRequestError")
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
            geometryProviderLayerId = geometryProviderLayerFromConfig.layerId,
            geometryProviderAttribute = geometryProviderLayerFromConfig.geometryProvider.geometryAttribute,
            geometryProvider = rawLayerList.getLayerWhere({id: geometryProviderLayerId}),
            resolution = mapCollection.getMapView("2D").getResolution(),
            result = await dispatch("fetchDataForLayer", {
                layer: geometryProvider,
                geometry: null,
                coordinate: clickCoordinates,
                resolution
            }),
            coordinatesString = result[0][geometryProviderAttribute],
            coordinatesArray = coordinatesString.split(" ").map(Number),
            coordinates = [];

        if (!geometryProviderLayerFromConfig) {
            return;
        }

        for (let i = 0; i < coordinatesArray.length; i += 2) {
            coordinates.push([coordinatesArray[i], coordinatesArray[i + 1]]);
        }
        if (coordinates.length) {
            const polygonFeature = new Feature({geometry: new Polygon([coordinates])}),
                highlightObject = {
                    feature: polygonFeature,
                    layer: {id: geometryProvider.layerId},
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
     * @param {Function} context.commit - The Vuex commit function.
     * @param {Object} context.state - The Vuex state object.
     * @param {string} [trigger="init"] - The trigger that initiated this request.
     * @returns {Promise<void>}
     */
    async fetchAdditionalRequests ({commit, dispatch, state}, trigger = "init") {
        const additionalResults = await Promise.all(state.additionalRequests
            .filter(request => !request.triggerRequestOn || request.triggerRequestOn === trigger)
            .map(async request => {
                if (request.type === "ogcApiProcesses") {
                    try {
                        const inputs = {
                                ...request.inputs,
                                area: state.bufferedFeature ?
                                    new GeoJSON().writeGeometry(state.bufferedFeature.getGeometry()) :
                                    null
                            },
                            result = await OGCAPIProcesses.executeProcess(request.url, request.processId, inputs);

                        return {
                            url: request.url,
                            text: result.outputs.result.value,
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
                config => config.layerId === layer.id
            ),
            attributes = layerConfig?.attributes || [],
            geometryProvider = layerConfig?.geometryProvider,
            layerWithConfig = {
                ...layer,
                wfsQueryBufferSize: layerConfig?.wfsQueryBufferSize || 0.0001
            };

        if (!layerConfig) {
            return null;
        }

        if (layer.typ === "WFS") {
            if (geometry) {
                return dispatch("fetchWfsData", {layer: layerWithConfig, geometry, attributes});
            }
            else if (geometryProvider) {
                return dispatch("fetchWfsDataWithPoint", {
                    layer: layerWithConfig,
                    coordinates: coordinate,
                    attributes: [...attributes, geometryProvider.geometryAttribute]
                });
            }
            else if (coordinate) {
                return dispatch("fetchWfsDataWithPoint", {layer: layerWithConfig, coordinates: coordinate, attributes});
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
                    attributes
                });
            }
            console.error("WMS request requires either coordinate or click coordinates.");
            return null;
        }

        else if (layer.typ === "OAF") {
            return dispatch("fetchOafData", {layer, geometry, attributes});
        }
        console.error(`Unknown layer type for layer ${layer.id}.`);
        return null;
    },

    /**
     * Fetches GetFeatureInfo (GFI) data for a given WMS layer.
     *
     * @param {Object} layer - The WMS layer object.
     * @param {string} layer.url - The URL of the WMS service.
     * @param {string} layer.layers - The layers to query.
     * @param {Array<number>} coordinate - The coordinate to query [x, y].
     * @param {number} resolution - The map resolution.
     * @param {Object} attributes - Additional attributes for the query.
     * @returns {Promise<null|Object>} The result of the feature extraction or null if an error occurs.
     */
    async fetchGfiForWmsLayer (_, {layer, coordinate, resolution, attributes}) {
        const serviceUrl = layer?.url,
            mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            version = layer.version || "1.1.1",
            infoFormat = "text/xml; subtype=gml/3.2.1",
            bboxSize = 256 * resolution,
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
                isEsriResponse =
                    parsedResponse.documentElement.namespaceURI === "http://www.esri.com/wms" ||
                    parsedResponse.querySelector("FeatureInfoResponse")?.namespaceURI === "http://www.esri.com/wms";

            return isEsriResponse
                ? extractFeaturesFromEsriWms(parsedResponse, attributes)
                : extractFeaturesFromWmsGml(parsedResponse, attributes);
        }
        catch (error) {
            console.error("Error during WMS query:", error);
            return null;
        }
    },

    /**
     * Fetches WFS data using point coordinates and dispatches the extracted features.
     *
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing WFS service details.
     * @param {string} payload.layer.url - The URL of the WFS service.
     * @param {string} [payload.layer.version="1.1.0"] - The version of the WFS service.
     * @param {string} [payload.layer.featureType="default_layer"] - The feature type name.
     * @param {Array<number>} payload.coordinates - The coordinates [longitude, latitude] to use for the WFS request.
     * @param {Object} payload.attributes - Additional attributes to pass to the feature extraction.
     * @returns {Promise<null|*>} - Returns the result of extracting features or null in case of an error.
     */
    async fetchWfsDataWithPoint (_, {layer, coordinates, attributes}) {
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
            url = `${serviceUrl}?service=WFS&version=${version}&request=GetFeature&${typeNameParam}=${typeName}&bbox=${bbox},${mapProjection}&outputFormat=text/xml; subtype=gml/3.2.1`;

        try {
            const response = await fetch(url),
                text = await response.text(),
                parsedResponse = new DOMParser().parseFromString(text, "application/xml"),
                features = extractFeaturesFromWfsGml(parsedResponse, attributes);

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
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} context.state - The Vuex state object.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing WFS service details.
     * @param {Object} payload.geometry - The geometry object to query.
     * @param {Array} payload.attributes - Additional attributes for the WFS request.
     * @returns {Promise<null|Object>} - Returns null if an error occurs or the result of extracting features from WFS GML.
     */
    async fetchWfsData ({state}, {layer, geometry, attributes}) {
        const mapProjection = mapCollection.getMapView("2D").getProjection().getCode(),
            serviceUrl = layer?.url,
            version = layer?.version || "1.1.0",
            layerConfig = state.layersToRequest.find(config => config.layerId === layer.id),
            typeName = layerConfig?.featureType || layer?.featureType || "default_layer",
            typeNameParam = version === "2.0.0" ? "typeNames" : "typeName",
            reader = new GeoJSONReader(),
            geojsonGeometry = geometry.getType ? new GeoJSON().writeGeometryObject(geometry) : geometry,
            jstsGeom = reader.read(geojsonGeometry),
            area = jstsGeom.getArea(),
            initialBufferValue = getBufferValue(area),
            bufferCandidates = [initialBufferValue, -4, -2, -1, 0];

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
                url = `${serviceUrl}?service=WFS&version=${version}&request=GetFeature&${typeNameParam}=${typeName}&bbox=${bbox},${mapProjection}&outputFormat=text/xml; subtype=gml/3.2.1`;

            try {
                const response = await fetch(url),
                    text = await response.text(),
                    parsedResponse = new DOMParser().parseFromString(text, "application/xml"),
                    features = extractFeaturesFromWfsGml(parsedResponse, attributes);

                return features;
            }
            catch (error) {
                console.error("Error during WFS query:", error);
                return null;
            }
        }

        if (!shrunkenGeometry) {
            shrunkenGeometry = geojsonGeometry;
        }

        if (shrunkenGeometry) {
            const requestGeometry = shrunkenGeometry,
                coords = requestGeometry.coordinates[0],
                filter = `
                        <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">
                            <fes:Intersects>
                                <fes:ValueReference>${layerConfig.geometryAttribute}</fes:ValueReference>
                                <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2" srsName="${mapProjection}">
                                    <gml:exterior>
                                        <gml:LinearRing>
                                            <gml:posList>${coords.map(coord => coord.join(" ")).join(" ")}</gml:posList>
                                        </gml:LinearRing>
                                    </gml:exterior>
                                </gml:Polygon>
                            </fes:Intersects>
                        </fes:Filter>
                    `,
                wfsUrl = `${serviceUrl}?service=WFS&version=${version}&request=GetFeature&${typeNameParam}=${typeName}&filter=${encodeURIComponent(filter)}&outputFormat=text/xml; subtype=gml/3.2.1`;

            try {
                const response = await fetch(wfsUrl),
                    text = await response.text(),
                    parsedResponse = new DOMParser().parseFromString(text, "application/xml");

                if (!response.ok) {
                    console.error(`Failed to fetch features: ${response.status} ${response.statusText}`);
                    return null;
                }
                return extractFeaturesFromWfsGml(parsedResponse, attributes);
            }
            catch (error) {
                console.error("Error fetching features:", error);
                return null;
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
     * @param {Array|Object} results - The GFI results to process. Can be an array or a single object.
     * @returns {Promise<void>} - A promise that resolves when the processing is complete.
     */
    async processGfiResults ({commit, state}, results) {
        const normalizedResults = Array.isArray(results)
                ? results.map(result => JSON.parse(JSON.stringify(result)))
                : JSON.parse(JSON.stringify(results)),

            layerResults = await Promise.all(
                state.layersToRequest.map(async (layerConfig, index) => {
                    const result = normalizedResults[index],
                        features = Array.isArray(result) ? result : [result],
                        rawLayer = rawLayerList.getLayerWhere({id: layerConfig.layerId}),
                        layerName = rawLayer?.name || `Layer ${index + 1}`,
                        headers = extractColumnsFromResults(features, layerConfig.attributes),
                        rows = extractRowsFromResults(features, layerConfig.attributes);

                    if (!result || typeof result !== "object") {
                        return null;
                    }
                    if (!rows || rows.length === 0) {
                        return null;
                    }
                    return {
                        layerId: layerConfig.layerId,
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
    async processLayerForBufferedQuery ({dispatch}, {layerConfig, geometry, bufferedResults}) {
        const layer = rawLayerList.getLayerWhere({id: layerConfig.layerId}),
            resolution = mapCollection.getMapView("2D").getResolution();

        if (!layer) {
            console.error(`Layer with ID ${layerConfig.layerId} not found`);
            return;
        }

        if (layer.typ === "WFS") {
            const results = await dispatch("fetchWfsData", {
                layer,
                geometry,
                attributes: layerConfig.attributes || []
            });

            if (results && results.length > 0) {
                bufferedResults[layer.name] = results;
            }
        }
        else if (layer.typ === "OAF") {
            const results = await dispatch("fetchOafData", {
                layer,
                geometry,
                attributes: layerConfig.attributes || []
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
                    attributes: layerConfig.attributes || []
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
                geometry = state.bufferedFeature.getGeometry();

            for (const layerConfig of state.layersToRequest) {
                try {
                    await dispatch("processLayerForBufferedQuery", {
                        layerConfig,
                        geometry,
                        bufferedResults
                    });
                }
                catch (error) {
                    console.error(`Error querying features for layer ${layerConfig.layerId}:`, error);
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
     * @param {String} format - The format to export to (CSV, PDF, DOC, JSON).
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

        const exportFormat = format || state.currentFormat || "CSV";

        switch (exportFormat.toUpperCase()) {
            case "CSV":
                exportToCSV({
                    layerResults: state.layerResults,
                    fileName: state.fileName,
                    setIsLoading,
                    translations: {
                        defaultFileName: i18next.t("additional:modules.combinedGfi.defaultFileName")
                    }
                });
                break;
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
     * @param {Function} context.dispatch - The Vuex dispatch function.
     * @param {Object} payload - The payload object.
     * @param {Object} payload.layer - The layer object containing OAF service details.
     * @param {Object} payload.geometry - The geometry object to query.
     * @param {Array} payload.attributes - Attributes to request and extract from the response.
     * @returns {Promise<Array|null>} - Returns an array of feature objects or null if an error occurs.
     */
    async fetchOafData (_, {layer, geometry, attributes}) {
        if (!layer?.url) {
            console.error("No valid URL for OAF service:", layer);
            return null;
        }

        const baseUrl = layer.url,
            collectionId = layer.collection,
            mapProjection = mapCollection.getMapView("2D").getProjection().getCode();

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
                    data = await response.json();

                if (!response.ok) {
                    console.error(`Failed to fetch features: ${response.status} ${response.statusText}`);
                    return null;
                }
                return extractFeaturesFromOafJson(data, attributes);
            }
            return null;
        }
        catch (error) {
            console.error("Error during OAF query:", error);
            return null;
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
     * Enlarges a polygon by a specified buffer distance.
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
