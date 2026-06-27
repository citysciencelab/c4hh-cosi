import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import {concatStringByDatakey} from "./translator.concatStringByDatakey.js";
import {mergeObjectsByDatakey} from "./translator.mergeObjectsByDatakey.js";
import createVectorLayer from "./createVectorLayer.js";
import Feature from "ol/Feature.js";
import {Point} from "ol/geom.js";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import BuildSpec from "../../../../src/modules/print/js/buildSpec.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";

/**
 * Mapfish is a class for communicating with mapfish.
 * @class
 */
export default class MapfishDialog {
    /**
     * @constructor
     * @param {Object} knowledgeBase - The knowledge base.
     * @param {Object} transformer - The configuration of the transformer.
     * @param {String} defaultValue - Used when nothing is present or nothing was found.
     * @param {String} mapProjection - The EPSG-Code of the current map projection.
     * @param {String} layoutName - The name of the layout.
     * @param {String} outputFilename - The output filename of the pdf (without extension).
     * @param {Boolean} sendLegends - If dialog should contain legends.
     */
    constructor (knowledgeBase, transformer, defaultValue, mapProjection, layoutName, outputFilename, sendLegends) {
        this.knowledgeBase = knowledgeBase;
        this.transformer = transformer;
        this.defaultValue = defaultValue;
        this.mapProjection = mapProjection;
        this.layoutName = layoutName;
        this.outputFilename = outputFilename;
        this.sendLegends = sendLegends;
        this.parcel = null;
    }

    /**
     * Creates a mapfishDialog.
     * @param {Object} parcel - The parcel data.
     * @param {Number[]} parcel.center - The parcel center.
     * @param {ol/extent} parcel.extent - The extent of the parcel.
     * @param {ol/Feature} parcel.feature - The ol feature of the parcel.
     * @param {ol/geom/Polygon} parcel.geometry - The geometry of the parcel.
     * @returns {Promise<{layout, outputFilename: String, attributes: {}}>} - Returns a promise which resolves an object.
     */
    async create (parcel) {
        const mapfishDialog = {},
            legendLayerIds = new Set(),
            defaultDelimitor = ", ",
            transformerEntries = Object.entries(this.transformer);

        this.parcel = parcel;

        for (const [prefix, obj] of transformerEntries) {
            for (const [postfix, transformerConfig] of Object.entries(obj)) {
                if (transformerConfig.type === "mapWalker") {
                    mapfishDialog[prefix + "." + postfix] = await this.getWalkerMap(transformerConfig);
                }
                else if (transformerConfig.type === "mapProportion") {
                    mapfishDialog[prefix + "." + postfix] = await this.getProportionMap(transformerConfig);

                    if (transformerConfig.legend === true) {
                        transformerConfig.layerIds?.forEach?.(id => legendLayerIds.add(id));
                    }
                }
                else if (transformerConfig.type === "mapFixed") {
                    mapfishDialog[prefix + "." + postfix] = await this.getFixedMap(transformerConfig);
                }
                else if (transformerConfig.type === "concat") {
                    const resultConcat = concatStringByDatakey(this.knowledgeBase, transformerConfig.datakey, transformerConfig.default, this.defaultValue, transformerConfig.delimitor ? transformerConfig.delimitor : defaultDelimitor, transformerConfig.options);

                    if (!(resultConcat instanceof Error)) {
                        mapfishDialog[prefix + "." + postfix] = resultConcat;
                    }
                }
                else if (transformerConfig.type === "iterator") {
                    if (this.knowledgeBase[transformerConfig.datakey] instanceof Error || typeof transformerConfig?.idx !== "number") {
                        continue;
                    }
                    if (typeof this.knowledgeBase[transformerConfig.datakey] !== "undefined" && this.knowledgeBase[transformerConfig.datakey].length > transformerConfig.idx) {
                        const diffLength = this.knowledgeBase[transformerConfig.datakey].length - transformerConfig.idx + 1;

                        this.knowledgeBase[transformerConfig.datakey].splice(transformerConfig.idx);
                        this.knowledgeBase[transformerConfig.datakey][transformerConfig.idx - 1] = typeof transformerConfig.warning !== "undefined" ? diffLength + transformerConfig.warning : "";
                    }
                    for (let idx = 0; idx < transformerConfig.idx; idx++) {
                        const defaultValue = typeof transformerConfig?.default === "string" ? transformerConfig.default : this.defaultValue;

                        mapfishDialog[prefix + "." + postfix + "." + idx] = Array.isArray(this.knowledgeBase[transformerConfig.datakey]) && typeof this.knowledgeBase[transformerConfig.datakey][idx] !== "undefined" ?
                            this.knowledgeBase[transformerConfig.datakey][idx]
                            : defaultValue;
                    }
                }
                else if (transformerConfig.type === "datasource") {
                    mapfishDialog[prefix + "." + postfix] = mergeObjectsByDatakey(transformerConfig.datakey, this.knowledgeBase, this.defaultValue, transformerConfig.options);
                }
                else {
                    mapfishDialog[prefix + "." + postfix] = transformerConfig.content;
                }
            }
        }

        if (this.sendLegends) {
            mapfishDialog.legend = this.createLegendObject(legendLayerIds);
        }

        return {
            layout: this.layoutName,
            attributes: mapfishDialog,
            outputFilename: this.outputFilename
        };
    }

    /**
     * Creates the legend object for the mapfish dialog.
     * @param {Set} setOflegendLayerIds - The ids of the layers to be included in the legend.
     * @returns {Object} - The "legend" object for mapfish print request payload.
     */
    createLegendObject (setOflegendLayerIds) {
        const legendObject = {
            layers: []
        };

        setOflegendLayerIds?.forEach?.(layerId => {
            const layer = rawLayerList.getLayerWhere({id: layerId});

            if (layer?.legendURL?.endsWith?.(".pdf") || layer?.typ !== "WMS") {
                return;
            }

            legendObject.layers.push(
                {
                    layerName: layer.name,
                    values: [
                        {
                            color: "",
                            geometryType: "",
                            legendType: "wmsGetLegendGraphic",
                            imageUrl: layer.url
                                + "?language=ger&"
                                + "version="
                                + layer.version
                                + "&service=WMS&"
                                + "&request=GetLegendGraphic&sld_version=1.1.0&layer="
                                + layer.layers
                                + "&format=image/png"
                        }
                    ]
                }
            );
        });

        return legendObject;
    }

    /**
     * Gets the map configuration with center and scale as walker map type for mapfish in jasper.
     * @param {Object} transformerConfig - The configuration of the transformer.
     * @returns {Promise<{dpi: Number, projection: String, scale: Number, center: Number[], layers: String[]}>} - The map configuration in object
     */
    async getWalkerMap (transformerConfig) {
        const center = this.parcel.center,
            projection = this.mapProjection,
            style = transformerConfig.style,
            scale = transformerConfig.scale,
            layerIds = transformerConfig.layerIds,
            dpi = transformerConfig.dpi || 200,
            mapConfig = {},
            defaultScale = 20000;

        mapConfig.dpi = dpi;
        mapConfig.projection = projection;
        mapConfig.scale = typeof scale === "number" ? scale : defaultScale;
        mapConfig.center = Array.isArray(center) ? center : [];
        mapConfig.layers = await this.getLayersArray(this.parcel.feature, layerIds, style, dpi);

        return mapConfig;
    }

    /**
     * Gets the map configuration with a proportional bounding box as proportion map type for mapfish in jasper.
     * @param {Object} transformerConfig - The configuration of the transformer.
     * @returns {Promise<{dpi: Number, projection: String, bbox: Number[], layers: String[]}>} - The map configuration in object
     */
    async getProportionMap (transformerConfig) {
        const extent = this.parcel.extent,
            projection = this.mapProjection,
            style = transformerConfig.style,
            proportion = transformerConfig.proportion,
            layerIds = transformerConfig.layerIds,
            dpi = transformerConfig.dpi || 200,
            mapConfig = {},
            defaultBbox = [545114.80, 5914269.80, 591483.01, 5957132.28];

        mapConfig.dpi = dpi;
        mapConfig.projection = projection;
        mapConfig.bbox = Array.isArray(extent) && extent.length === 4 ? this.getBoundingBox(extent, proportion) : defaultBbox;
        mapConfig.layers = await this.getLayersArray(this.parcel.feature, layerIds, style, dpi);

        return mapConfig;
    }

    /**
     * Gets the map configuration with bounding box as fixed map type for mapfish in jasper.
     * @param {Object} transformerConfig - The configuration of the transformer.
     * @returns {Promise<{dpi: Number, projection: String, bbox: Number[], layers: String[]}>} - The map configuration in object
     */
    async getFixedMap (transformerConfig) {
        const coordinate = this.parcel.center,
            projection = this.mapProjection,
            style = transformerConfig.style,
            bbox = transformerConfig.bbox,
            layerIds = transformerConfig.layerIds,
            dpi = transformerConfig.dpi || 200,
            mapConfig = {},
            defaultBbox = [545114.80, 5914269.80, 591483.01, 5957132.28],
            feature = new Feature({
                geometry: new Point(coordinate)
            });

        mapConfig.dpi = dpi;
        mapConfig.projection = projection;
        mapConfig.bbox = Array.isArray(bbox) && bbox.length === 4 ? bbox : defaultBbox;
        mapConfig.layers = await this.getLayersArray(feature, layerIds, style, dpi, "point");

        return mapConfig;
    }

    /**
     * Returns the layers.
     * @param {ol/Feature} feature - The feature.
     * @param {String} [] layerIds - The Array of layer id's.
     * @param {Object} style - The style object
     * @param {Number} dpi - The dpi.
     * @param {String} type - The type.
     * @returns {Promise<ol|layer[]>} - Returns a promise as ol-layer.
     */
    async getLayersArray (feature, layerIds, style, dpi, type = "") {
        if (!Array.isArray(layerIds)) {
            return [];
        }
        let originLayers = [],
            layers = [];

        if (!layerIds.includes("feature")) {
            originLayers.push({
                layer: await createVectorLayer.getFeatureLayer(style, feature, type),
                opacity: 1,
                dpi
            });
            originLayers = originLayers.concat(this.getPrintedLayers(layerIds, dpi));
        }
        else {
            const splitIndex = layerIds.indexOf("feature"),
                frontLayerIds = layerIds.slice(0, splitIndex),
                backLayerIds = layerIds.slice(splitIndex + 1 - layerIds.length);

            originLayers = this.getPrintedLayers(frontLayerIds, dpi);
            originLayers.push({
                layer: await createVectorLayer.getFeatureLayer(style, feature, type),
                opacity: 1,
                dpi
            });
            originLayers = originLayers.concat(this.getPrintedLayers(backLayerIds, dpi));
        }

        layers = await this.buildLayers(originLayers);

        return layers;
    }

    /**
     * Getting the Bounding Box of the map according to the extent of feature and proportion
     * The size of feature extent / the size of map is the proportion
     * @param {Number[]} coordinates The geo coordination
     * @param {Object} configProp the proportion of the map
     * @returns {Number[]} the bounding box of the map
     */
    getBoundingBox (coordinates, configProp) {
        const longiDiff = coordinates[2] - coordinates[0],
            latiDiff = coordinates[3] - coordinates[1],
            minDiff = Math.min(longiDiff, latiDiff),
            latiLongiDiff = (latiDiff - longiDiff) > 0 ? (latiDiff - longiDiff) / 2 : 0,
            longiLatiDiff = (longiDiff - latiDiff) > 0 ? (longiDiff - latiDiff) / 2 : 0;

        let proportion = 0.33,
            ratio = 1,
            longiLeft = 0,
            longiRight = 0,
            latiBottom = 0,
            latiTop = 0;

        if (typeof configProp === "number" && configProp > 0 && configProp < 1) {
            proportion = configProp;
        }

        ratio = (1 - proportion) / (2 * proportion);

        longiLeft = coordinates[0] - minDiff * ratio - latiLongiDiff;
        longiRight = coordinates[2] + minDiff * ratio + latiLongiDiff;
        latiBottom = coordinates[1] - minDiff * ratio - longiLatiDiff;
        latiTop = coordinates[3] + minDiff * ratio + longiLatiDiff;

        return [longiLeft, latiBottom, longiRight, latiTop];
    }

    /**
     * Parses the layers into mapfisch format
     * @param {Object[]} layerList an array of objects with layer, opacity and dpi
     * @param {Boolean} skipDefectLayerList If an element from the layerList is incorrect, the iteration is terminated and an empty array is returned.
     * @returns {ol/layer[]} the parsed layers in an Array for mapfish
     */
    async buildLayers (layerList, skipDefectLayerList = true) {
        const layers = [],
            currentResolution = mapCollection.getMapView("2D").getResolution();

        if (!Array.isArray(layerList)) {
            return layers;
        }

        for (const item of layerList) {
            if (!isObject(item)) {
                if (skipDefectLayerList === true) {
                    return [];
                }
                continue;
            }
            const createdLayer = await BuildSpec.buildLayerType(item.layer, currentResolution, item.dpi, true);

            if (typeof createdLayer !== "undefined") {
                createdLayer.opacity = item.opacity;
                layers.push(createdLayer);
            }
        }

        return layers;
    }

    /**
     * Gets the printed layers from layer Ids
     * @param {String[]} layerIds the layer id
     * @param {Number} dpi the dpi of the layers object.
     * @returns {[ol/layer, opacity]} printedLayers the printed layer and its opacity in an Array list
     */
    getPrintedLayers (layerIds, dpi) {
        const printedLayers = [];

        if (Array.isArray(layerIds) && layerIds.length) {
            layerIds.forEach(async layerId => {
                let layerObj = null,
                    layer = {},
                    id;

                if (isObject(layerId)) {
                    layerObj = Object.assign({
                        opacity: 1,
                        dpi
                    }, layerId);
                    id = layerId.layerId;
                }
                else if (typeof layerId === "string") {
                    layerObj = {
                        layerId,
                        opacity: 1,
                        dpi
                    };
                    id = layerId;
                }
                else {
                    return;
                }

                layer = layerCollection.getLayerById(id) ? layerCollection.getLayerById(id).layer : layerFactory.createLayer(rawLayerList.getLayerWhere({id: id}))?.layer;

                if (typeof layer !== "undefined") {
                    printedLayers.push({
                        layer,
                        opacity: layerObj.opacity,
                        dpi: layerObj.dpi
                    });
                }
            });
        }

        return printedLayers;
    }
}
