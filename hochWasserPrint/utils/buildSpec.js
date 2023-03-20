import {Circle as CircleStyle, Icon} from "ol/style.js";
import {Point} from "ol/geom.js";
import {fromCircle} from "ol/geom/Polygon.js";
import Feature from "ol/Feature.js";
import {GeoJSON} from "ol/format.js";
import {Group, Image, Tile, Vector} from "ol/layer.js";
import store from "../../../src/app-store/index";
import isObject from "../../../src/utils/isObject";
import differenceJS from "../../../src/utils/differenceJS";
import sortBy from "../../../src/utils/sortBy";
import Geometry from "ol/geom/Geometry";
import {convertColor} from "../../../src/utils/convertColor";
import {MVTEncoder} from "@geoblocks/print";
import VectorTileLayer from "ol/layer/VectorTile";
import {getLastPrintedExtent} from "../store/actions/actionsPrintInitialization";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList";
import {getRulesForFeature} from "@masterportal/masterportalapi/src/vectorStyle/lib/getRuleForIndex";

const BuildSpecModel = {
    defaults: {
        uniqueIdList: [],
        visibleLayerIds: null,
        layout: null,
        attributes: {
            map: null,
            printId: "",
            showLegend: false,
            legend: "",
            gfi: null,
            scale: null
        }
    },

    setAttributes: function (attr) {
        this.defaults.attributes = attr.attributes;
        this.defaults.layout = attr.layout;
        this.defaults.outputFilename = attr.outputFilename;
        this.defaults.outputFormat = attr.outputFormat;
    },

    /**
     * Checks if csw request belongs to this model.
     * @param {String[]} uniqueIdList List of all metaRequest-ids belonging to this model.
     * @param {String} uniqId Response unique-id from Cswparser.
     * @returns {Boolean} - Flag if csw response is from own metaRequest.
     */
    isOwnMetaRequest: function (uniqueIdList, uniqId) {
        return Array.isArray(uniqueIdList) && uniqueIdList.indexOf(uniqId) !== -1;
    },

    /**
     * Removes the uniqueId from the uniqueIdList, because the request returned something.
     * @param {String[]} uniqueIdList List of all metaRequest-ids belonging to this model.
     * @param {String} uniqId Response unique-id from Cswparser.
     * @returns {void}
     */
    removeUniqueIdFromList: function (uniqueIdList, uniqId) {
        this.setUniqueIdList(differenceJS(uniqueIdList, [uniqId]));
    },

    /**
     * Parses the address object to a string.
     * @param {Object} addressObj Address Object
     * @param {String} addressObj.street Street name.
     * @param {String} addressObj.housenr House number.
     * @param {String} addressObj.postalCode Postal Code.
     * @param {String} addressObj.city City.
     * @returns {String} - The parsed String.
     */
    parseAddressToString: function (addressObj) {
        let street,
            streetFilled = false,
            housenr,
            postalCode,
            postalCodeFilled = false,
            city,
            addressString = "";

        if (isObject(addressObj)) {
            street = addressObj.street;
            streetFilled = this.isFilled(street);
            housenr = addressObj.housenr;
            postalCode = addressObj.postalCode;
            postalCodeFilled = this.isFilled(postalCode);
            city = addressObj.city;
        }
        if (streetFilled) {
            addressString += street;
        }
        if (this.isFilled(housenr)) {
            if (streetFilled) {
                addressString += " ";
            }
            addressString += housenr;
        }
        if (addressString !== "") {
            addressString += "\n ";
        }
        if (postalCodeFilled) {
            addressString += postalCode;
        }
        if (this.isFilled(city)) {
            if (postalCodeFilled) {
                addressString += " ";
            }
            addressString += city;
        }
        if (addressString.trim() === "") {
            addressString += "n.N.";
        }
        return addressString;
    },

    /**
     * Returns true, if the given string is not empty or undefined
     * @param {string} string to check
     * @returns {boolean} true, if string has content
     */
    isFilled: function (string) {
        return typeof string !== "undefined" && string.trim() !== "";
    },

    /**
     * Defines the layers attribute of the map spec
     * @param {ol.layer.Layer[]} layerList All visible layers on the map
     * @returns {void}
     */
    buildLayers: async function (layerList) {
        const layers = [],
            attributes = this.defaults.attributes,
            currentResolution = Radio.request("MapView", "getOptions")?.resolution,
            visibleLayerIds = [];

        if (Array.isArray(layerList)) {
            for (const layer of layerList) {
                const printLayers = [];

                if (layer instanceof Group) {
                    for (const childLayer of layer.getLayers().getArray()) {
                        printLayers.push(await this.buildLayerType(childLayer, currentResolution));
                        visibleLayerIds.push(childLayer.get("id"));
                    }
                }
                else {
                    printLayers.push(await this.buildLayerType(layer, currentResolution));
                }
                printLayers.forEach(printLayer => {
                    if (typeof printLayer !== "undefined") {
                        if (layer?.get("id") !== undefined) {
                            visibleLayerIds.push(layer?.get("id"));
                        }
                        layers.push(printLayer);
                    }

                });
            }
        }
        this.setVisibleLayerIds(visibleLayerIds);
        attributes.map.layers = layers.reverse();
    },

    /**
     * Sorts the features of the draw layer by z-index and returns the vector object for mapfish-print-3
     * @param {ol.layer}  layer   ol.Layer with features.
     * @param {ol.extent} extent  Extent uses to filter the feature by extent.
     * @returns {Object|undefined} - VectorObject for mapfish print.
     */
    getDrawLayerInfo: function (layer, extent) {
        const featuresInExtent = layer.getSource().getFeaturesInExtent(extent),
            features = sortBy(featuresInExtent, function (feature) {
                if (feature.getStyle() && typeof feature.getStyle === "function" && typeof feature.getStyle().getZIndex === "function") {
                    return feature.getStyle().getZIndex();
                }
                return 0;
            }),
            visibleFeatures = features.filter(feature => feature.get("isVisible"));

        if (visibleFeatures.length > 0) {
            return this.buildVector(layer, visibleFeatures);
        }

        return undefined;
    },

    /**
     * Returns information about the layer depending on the layer type.
     * @param  {ol.layer} layer ol.Layer with features
     * @param {Number} currentResolution Current map resolution
     * @returns {Object} - LayerObject for MapFish print.
     */
    buildLayerType: async function (layer, currentResolution) {
        const extent = Radio.request("MapView", "getCurrentExtent"),
            layerMinRes = typeof layer?.get === "function" ? layer.get("minResolution") : false,
            layerMaxRes = typeof layer?.get === "function" ? layer.get("maxResolution") : false,
            isInScaleRange = this.isInScaleRange(layerMinRes, layerMaxRes, currentResolution);
        let features = [],
            returnLayer;

        if (isInScaleRange) {
            const source = layer.getSource();

            if (layer instanceof VectorTileLayer) {
                const maskExtent = getLastPrintedExtent();

                returnLayer = await this.buildVectorTile(layer, currentResolution, maskExtent);
            }
            else if (layer instanceof Image) {
                returnLayer = this.buildImageWms(layer);
            }
            else if (layer instanceof Tile) {
                if (source?.getParams) {
                    returnLayer = this.buildTileWms(layer);
                }
                else if (source?.getLayer) {
                    returnLayer = this.buildWmts(layer, source);
                }
            }
            else if (typeof layer?.get === "function" && layer.get("name") === "importDrawLayer") {
                returnLayer = this.getDrawLayerInfo(layer, extent);
            }
            else if (layer instanceof Vector) {
                features = source.getFeaturesInExtent(extent);

                if (features.length > 0) {
                    returnLayer = this.buildVector(layer, features);
                }
            }
        }

        return returnLayer;
    },

    /**
     * Checks if layer is in the visible resolution range.
     * @param {Number} layerMinRes Maximum resolution of layer.
     * @param {Number} layerMaxRes Minimum resolution of layer.
     * @param {Number} currentResolution Current map resolution.
     * @returns {Boolean} - Flag if layer is in visible resolution.
     */
    isInScaleRange: function (layerMinRes, layerMaxRes, currentResolution) {
        let isInScale = false;

        if (layerMinRes <= currentResolution && layerMaxRes >= currentResolution) {
            isInScale = true;
        }

        return isInScale;
    },

    /**
     * Builds the information needed for MapFish to print the given WMTS Layer.
     * @param {ol.layer.Tile} layer The WMTS Layer.
     * @param {ol.source.WMTS} source The source of the WMTS Layer.
     * @returns {Object} Information about the WMTS Layer.
     */
    buildWmts: (layer, source) => {
        const matrices = [],
            tileGrid = source.getTileGrid(),
            matrixIds = tileGrid.getMatrixIds(),
            {origin_, origins_, tileSize_, tileSizes_} = tileGrid;
        let baseURL = source.getUrls()[0];

        for (let i = 0; i < matrixIds.length; i++) {
            // The parameters "matrixSizes" and "scales" are not standard for a WMTS source and are added in the process of parsing the information of the layer
            matrices.push({
                identifier: matrixIds[i],
                matrixSize: source.matrixSizes[i],
                topLeftCorner: origin_ ? origin_ : origins_[i],
                scaleDenominator: source.scales[i],
                tileSize: tileSize_ ? [tileSize_, tileSize_] : [tileSizes_[i], tileSizes_[i]]
            });
        }

        if (baseURL.includes("{Style}")) {
            // As described in the MapFish Documentation (https://mapfish.github.io/mapfish-print-doc/javadoc/org/mapfish/print/map/tiled/wmts/WMTSLayerParam.html#baseURL) the parameter "style" seemingly needs to be written small.
            baseURL = baseURL.replace(/{Style}/g, "{style}");
        }

        return {
            baseURL,
            opacity: layer.getOpacity(),
            type: "WMTS",
            layer: source.getLayer(),
            style: source.getStyle(),
            imageFormat: source.getFormat(),
            matrixSet: source.getMatrixSet(),
            matrices,
            requestEncoding: source.getRequestEncoding()
        };
    },

    /**
     * Returns vector tile layer information
     * @param {ol.layer.VectorTile} layer vector tile layer with vector tile source
     * @param {number} resolution print resolution
     * @param {ol.Extent} extent printed extent
     * @returns {Object} - static image layer spec
     */
    buildVectorTile: async function (layer, resolution, extent) {
        MVTEncoder.useImmediateAPI = false;
        const mapInfo = store.state.Tools.HochWasserPrint.layoutMapInfo,
            targetDPI = store.state.Tools.HochWasserPrint.dpiForPdf,
            factor = targetDPI / 72,
            targetWidth = mapInfo[0] * factor,
            targetHeight = mapInfo[1] * factor,
            encoder = new MVTEncoder(),
            r = await encoder.encodeMVTLayer({
                layer,
                tileResolution: resolution,
                printResolution: resolution,
                printExtent: extent,
                canvasSize: [targetWidth, targetHeight]
            }),
            {extent: tileExtent, baseURL: tileBaseURL} = r[0];

        if (r.length !== 1) {
            throw new Error("handle several results");
        }

        if (r[0].baseURL.length <= 6) {
            return null;
        }

        return {
            extent: tileExtent,
            baseURL: tileBaseURL,
            type: "image",
            name: layer.get("name"),
            opacity: 1,
            imageFormat: "image/png"
        };
    },
    /**
     * Returns tile wms layer information
     * @param {ol.layer.Tile} layer tile layer with tile wms source
     * @returns {Object} - wms layer spec
     */
    buildTileWms: function (layer) {
        const source = layer.getSource(),
            mapObject = {
                baseURL: source.getUrls()[0],
                opacity: layer.getOpacity(),
                type: "WMS",
                layers: source.getParams().LAYERS.split(","),
                styles: source.getParams().STYLES ? source.getParams().STYLES.split(",") : undefined,
                imageFormat: source.getParams().FORMAT,
                customParams: {
                    "TRANSPARENT": source.getParams().TRANSPARENT,
                    "DPI": store.state.Tools.HochWasserPrint.dpiForPdf
                }
            };

        if (Object.prototype.hasOwnProperty.call(source.getParams(), "SLD_BODY") && source.getParams().SLD_BODY !== undefined) {
            mapObject.customParams.SLD_BODY = source.getParams().SLD_BODY;
            mapObject.styles = ["style"];
        }
        return mapObject;
    },

    /**
     * Returns image wms layer information
     * @param {ol.layer.Image} layer - image layer with image wms source
     * @returns {Object} - wms layer spec
     */
    buildImageWms: function (layer) {
        const source = layer.getSource(),
            mapObject = {
                baseURL: source.getUrl(),
                opacity: layer.getOpacity(),
                type: "WMS",
                layers: source.getParams().LAYERS.split(","),
                styles: source.getParams().STYLES ? source.getParams().STYLES.split(",") : undefined,
                imageFormat: source.getParams().FORMAT,
                customParams: {
                    "TRANSPARENT": source.getParams().TRANSPARENT,
                    "DPI": store.state.Tools.HochWasserPrint.dpiForPdf
                }
            };

        return mapObject;
    },

    /**
     * Returns vector layer information
     * @param {ol.layer.Vector} layer vector layer with vector source
     * @param {ol.feature[]} features vectorfeatures
     * @returns {object} - geojson layer spec
     */
    buildVector: function (layer, features) {
        const geojsonList = [];

        return {
            type: "geojson",
            style: this.buildStyle(layer, features, geojsonList),
            geojson: geojsonList
        };
    },

    /**
     * Generates the style for mapfish print.
     * @param {ol.layer} layer ol-Layer with features.
     * @param {ol.feature[]} features Array of features.
     * @param {Object[]} geojsonList Array of geojsons.
     * @returns {Object} - style for mapfish print.
     */
    buildStyle: function (layer, features, geojsonList) {
        const mapfishStyleObject = {
            "version": "2"
        };

        features.reverse().forEach(feature => {
            const styles = this.getFeatureStyle(feature, layer),
                styleAttributes = this.getStyleAttributes(layer, feature);

            let clonedFeature,
                stylingRules,
                stylingRulesSplit,
                styleObject,
                geometryType,
                styleGeometryFunction;

            styles.forEach((style, index) => {
                if (style !== null) {
                    const styleModel = this.getStyleModel(layer);
                    let limiter = ",";

                    clonedFeature = feature.clone();
                    styleAttributes.forEach(attribute => {
                        clonedFeature.set(attribute, (clonedFeature.get("features") ? clonedFeature.get("features")[0] : clonedFeature).get(attribute) + "_" + String(index));
                    });
                    geometryType = feature.getGeometry().getType();

                    // if style has geometryFunction, take geometry from style Function
                    styleGeometryFunction = style.getGeometryFunction();
                    if (styleGeometryFunction !== null && styleGeometryFunction !== undefined) {
                        clonedFeature.setGeometry(styleGeometryFunction(clonedFeature));
                        geometryType = styleGeometryFunction(clonedFeature).getType();
                    }
                    stylingRules = this.getStylingRules(layer, clonedFeature, styleAttributes, style);
                    if (typeof styleModel !== "undefined" && styleModel.get("labelField") && styleModel.get("labelField").length > 0) {
                        stylingRules = stylingRules.replaceAll(limiter, " AND ");
                        limiter = " AND ";
                    }
                    stylingRulesSplit = stylingRules
                        .replaceAll("[", "")
                        .replaceAll("]", "")
                        .replaceAll("*", "")
                        .split(limiter)
                        .map(rule => rule.split("="));

                    if (Array.isArray(stylingRulesSplit) && stylingRulesSplit.length) {
                        this.unsetStringPropertiesOfFeature(clonedFeature,
                            stylingRulesSplit.reduce((accumulator, current) => Array.isArray(current) && current.length
                                ? [...accumulator, current[0]]
                                : accumulator,
                            [])
                        );
                    }
                    this.addFeatureToGeoJsonList(clonedFeature, geojsonList, style);

                    if (Object.prototype.hasOwnProperty.call(mapfishStyleObject, stylingRules)) {
                        return;
                    }

                    styleObject = {
                        symbolizers: []
                    };
                    if (geometryType === "Point" || geometryType === "MultiPoint") {
                        if (style.getImage() !== null || style.getText() !== null) {
                            styleObject.symbolizers.push(this.buildPointStyle(style, layer));
                        }
                    }
                    else if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
                        styleObject.symbolizers.push(this.buildPolygonStyle(style, layer));
                    }
                    else if (geometryType === "Circle") {
                        styleObject.symbolizers.push(this.buildPolygonStyle(style, layer));
                    }
                    else if (geometryType === "LineString" || geometryType === "MultiLineString") {
                        styleObject.symbolizers.push(this.buildLineStringStyle(style, layer));
                    }

                    if (style.getText() !== null && style.getText() !== undefined) {
                        styleObject.symbolizers.push(this.buildTextStyle(style.getText()));
                    }

                    mapfishStyleObject[stylingRules] = styleObject;
                }
            });
        });
        return mapfishStyleObject;
    },

    getStyleModel (layer) {
        const layerModel = Radio.request("ModelList", "getModelByAttributes", {id: layer?.get("id")});

        if (typeof layerModel?.get === "function") {
            return styleList.returnStyleObject(layerModel.get("styleId"));
        }
        return undefined;
    },

    /**
     * Unsets all properties of type string of the given feature.
     * @param {ol.Feature} feature to unset properties of type string at
     * @param {string} notToUnset key not to unset
     * @returns {void}
     */
    unsetStringPropertiesOfFeature: function (feature, notToUnset) {
        Object.keys(feature.getProperties()).forEach(key => {
            const prop = feature.getProperties()[key];

            if (!notToUnset.includes(key) && typeof prop === "string") {
                feature.unset(key, {silent: true});
            }
        });
    },

    /**
     * Generates the point Style
     * @param {ol.style} style Style of layer.
     * @param {ol.layer} layer Ol-layer.
     * @returns {Object} - Point Style for mapfish print.
     */
    buildPointStyle: function (style, layer) {
        if (style.getImage() instanceof CircleStyle) {
            return this.buildPointStyleCircle(style.getImage());
        }
        else if (style.getImage() instanceof Icon && style.getImage().getScale() > 0) {
            return this.buildPointStyleIcon(style.getImage(), layer);
        }
        return this.buildTextStyle(style.getText());
    },

    /**
     * Generates the point Style for circle style
     * @param {ol.style} style Style of layer.
     * @returns {Object} - Circle Style for mapfish print.
     */
    buildPointStyleCircle: function (style) {
        const fillStyle = style.getFill(),
            strokeStyle = style.getStroke(),
            obj = {
                type: "point",
                pointRadius: style.getRadius()
            };

        if (fillStyle !== null) {
            this.buildFillStyle(fillStyle, obj);
            this.buildStrokeStyle(fillStyle, obj);
        }
        if (strokeStyle !== null) {
            this.buildStrokeStyle(strokeStyle, obj);
        }
        return obj;
    },

    /**
     * Generates the point Style for icons
     * @param {ol.style} style Style of layer.
     * @param {ol.layer} layer Ol-layer.
     * @returns {Object} - Icon Style for mapfish print.
     */
    buildPointStyleIcon: function (style, layer) {
        return {
            type: "point",
            graphicWidth: style.getSize()[0] ? style.getSize()[0] * style.getScale() : 60,
            graphicHeight: style.getSize()[1] ? style.getSize()[1] * style.getScale() : 60,
            externalGraphic: this.buildGraphicPath(style.getSrc()),
            graphicOpacity: layer.getOpacity()
        };
    },

    /**
     * Derives the url of the image from the server the app is running on
     * if the app is running on localhost the images from test.geoportal-hamburg.de are used
     * @param {object} src the image source
     * @return {String} path or url to image directory
     */
    buildGraphicPath: function (src) {
        const origin = window.location.origin;
        let url = Config.wfsImgPath + this.getImageName(src);

        if (src.indexOf("http") === 0 && src.indexOf("localhost") === -1) {
            url = src;
        }
        else if (src.charAt(0) === "/") {
            url = origin + src;
        }
        else if (src.indexOf("../") === 0) {
            url = new URL(src, window.location.href).href;
        }
        else if (origin.indexOf("localhost") === -1) {
            // backwards-compatibility:
            url = origin + "/lgv-config/img/" + this.getImageName(src);
        }
        else if (src.indexOf("data:image/svg+xml;charset=utf-8") === 0) {
            url = src;
        }

        return url;
    },

    /**
     * Generates the text Style
     * @param {ol.style} style Style of layer.
     * @see https://openlayers.org/en/latest/apidoc/module-ol_style_Text.html
     * @returns {Object} - Text Style for mapfish print.
     */
    buildTextStyle: function (style) {
        const font = style.getFont() ? style.getFont() : "bold 16px Helvetica",
            size = this.getFontSize(font),
            isFontSizeInFont = size !== null,
            textScale = style.getScale() ? style.getScale() : 1,
            fontSize = isFontSizeInFont ? size : 10 * textScale,
            fontFamily = isFontSizeInFont ? this.getFontFamily(font, fontSize) : font,
            fontColor = style.getFill().getColor(),
            stroke = style.getStroke() ? style.getStroke() : undefined;

        return {
            type: "text",
            // tell MapFish that each feature has a property "_label" which contains the label-string
            // it is necessary to "add/fill" the "_label"-property when we call convertFeatureToGeoJson()
            // before we add it to the geoJSONList
            label: "[_label]",
            fontColor: convertColor(fontColor, "hex"),
            fontOpacity: fontColor[0] !== "#" ? fontColor[3] : 1,
            labelOutlineColor: stroke ? convertColor(stroke.getColor(), "hex") : undefined,
            labelOutlineWidth: stroke ? stroke.getWidth() : undefined,
            labelXOffset: style.getOffsetX(),
            labelYOffset: -style.getOffsetY(),
            fontSize: fontSize,
            fontFamily: fontFamily,
            labelAlign: this.getLabelAlign(style)
        };
    },

    /**
     * Inspects the given fontDef for family.
     * @param {String} fontDef the defined font
     * @param {String} fontSize the size incuding in the font
     * @returns {String} the font-family or an empty String if not contained
     */
    getFontFamily: function (fontDef, fontSize) {
        const index = fontDef ? fontDef.indexOf(" ", fontDef.indexOf(fontSize)) : -1;

        if (index > -1) {
            return fontDef.substring(index + 1);
        }
        return "";
    },
    /**
     * Inspects the given fontDef for numbers (=size).
     * @param {String} fontDef the defined font
     * @returns {String} the font-size or null if not contained
     */
    getFontSize: function (fontDef) {
        const size = fontDef ? fontDef.match(/\d/g) : null;

        if (Array.isArray(size) && size.length > 0) {
            return size.join("");
        }
        return null;
    },

    /**
     * Gets the indicator of how to align the text with respect to the geometry.
     * this property must have 2 characters, the x-align and the y-align.
     * @param {ol.style} style Style of layer.
     * @returns {String} - placement indicator
     */
    getLabelAlign: function (style) {
        const textAlign = style.getTextAlign();

        if (textAlign === "left") {
            return "lb";
        }
        else if (textAlign === "right") {
            return "rb";
        }
        else if (textAlign === "center") {
            return "cm";
        }

        return "cb";
    },

    /**
     * Generates the polygon Style
     * @param {ol.style} style Style of layer.
     * @param {ol.layer} layer Ol-layer.
     * @returns {Object} - Polygon Style for mapfish print.
     */
    buildPolygonStyle: function (style, layer) {
        const fillStyle = style.getFill(),
            strokeStyle = style.getStroke(),
            obj = {
                type: "polygon",
                fillOpacity: layer.getOpacity(),
                strokeOpacity: layer.getOpacity()
            };

        if (fillStyle !== null) {
            this.buildFillStyle(fillStyle, obj);
        }
        if (strokeStyle !== null) {
            this.buildStrokeStyle(strokeStyle, obj);
        }
        return obj;
    },

    /**
     * Generates the LineString Style
     * @param {ol.style} style Style of layer.
     * @param {ol.layer} layer Ol-layer.
     * @returns {Object} - LineString Style for mapfish print.
     */
    buildLineStringStyle: function (style, layer) {
        const strokeStyle = style.getStroke(),
            obj = {
                type: "line",
                strokeOpacity: layer.getOpacity()
            };

        if (strokeStyle !== null) {
            this.buildStrokeStyle(strokeStyle, obj);
        }
        return obj;
    },

    /**
     * Generates the Fill Style
     * @param {ol.style} style Style of layer.
     * @param {Object} obj current style object .
     * @returns {Object} - Fill Style for mapfish print.
     */
    buildFillStyle: function (style, obj) {
        let fillColor = style.getColor();

        if (typeof fillColor === "string") {
            fillColor = this.colorStringToRgbArray(fillColor);
        }

        obj.fillColor = convertColor(fillColor, "hex");
        obj.fillOpacity = fillColor[3];

        return obj;
    },

    /**
     * Checks if colorString starts with "rgb" then calls a parsing function.
     * @param {String} colorString rgb or rgba string
     * @returns {Number[] | String} - parsed rgb-string as number array
     */
    colorStringToRgbArray: function (colorString) {
        const parsedString = colorString;
        let parsedArray;

        if (parsedString.match(/^(rgb)/)) {
            parsedArray = this.rgbStringToRgbArray(parsedString);
        }
        return parsedArray;
    },

    /**
     * Parses a given rgb- or rgba-string to an numbers array
     * @param {String} colorString rgb or rgba string
     * @returns {Number[]} - parsed rgb-string as number array
     */
    rgbStringToRgbArray: function (colorString) {
        const indexOpenBracket = colorString.indexOf("(") + 1,
            indexCloseBracket = colorString.indexOf(")"),
            length = indexCloseBracket - indexOpenBracket,
            valuesString = colorString.substr(indexOpenBracket, length),
            rgbaStringArray = valuesString.split(","),
            rgbaArray = [];

        rgbaStringArray.forEach(function (colorValue) {
            colorValue.trim();
            rgbaArray.push(parseFloat(colorValue));
        });

        return rgbaArray;
    },

    /**
     * Generates the Stroke Style
     * @param {ol.style} style Style of layer.
     * @param {Object} obj Style object for mapfish print.
     * @returns {Object} - LineString Style for mapfish print.
     */
    buildStrokeStyle: function (style, obj) {
        const strokeColor = style.getColor();

        obj.strokeColor = convertColor(strokeColor, "hex");
        if (Array.isArray(strokeColor) && typeof strokeColor[3] !== "undefined") {
            obj.strokeOpacity = strokeColor[3];
        }
        if (typeof style.getWidth === "function" && typeof style.getWidth() !== "undefined") {
            obj.strokeWidth = style.getWidth();
        }
        return obj;
    },

    /**
     * Returns the image name of the src url
     * @param {String} imageSrc Url of image source
     * @returns {String} - Image name
     */
    getImageName: function (imageSrc) {
        const start = imageSrc.lastIndexOf("/");

        return imageSrc.indexOf("/") !== -1 ? imageSrc.substr(start + 1) : "/" + imageSrc;
    },

    /**
     * Adds the feature to the geojson list
     * @param {ol.Feature} feature - the feature can be clustered
     * @param {GeoJSON[]} geojsonList -
     * @param {ol.style.Style[]} style - the feature-style
     * @returns {void}
     */
    addFeatureToGeoJsonList: function (feature, geojsonList, style) {
        let convertedFeature;

        if (feature.get("features") && feature.get("features").length === 1) {
            feature.get("features").forEach((clusteredFeature) => {
                convertedFeature = this.convertFeatureToGeoJson(clusteredFeature, style);

                if (convertedFeature) {
                    geojsonList.push(convertedFeature);
                }
            });
        }
        else {
            convertedFeature = this.convertFeatureToGeoJson(feature, style);

            if (convertedFeature) {
                geojsonList.push(convertedFeature);
            }
        }
    },

    /**
     * Converts an openlayers feature to a GeoJSON feature object
     * @param {ol.Feature} feature - the feature to convert
     * @param {ol.style.Style[]} style - the feature-style
     * @returns {object} GeoJSON object
     */
    convertFeatureToGeoJson: function (feature, style) {
        const clonedFeature = feature.clone(),
            geojsonFormat = new GeoJSON(),
            labelText = style.getText()?.getText() || "";
        let convertedFeature;

        // remove all object and array properties except geometry. Otherwise mapfish runs into an error
        Object.keys(clonedFeature.getProperties()).forEach(property => {
            if (isObject(clonedFeature.get(property)) && !(clonedFeature.get(property) instanceof Geometry) || Array.isArray(clonedFeature.get(property))) {
                clonedFeature.unset(property);
            }
        });

        // take over id from feature because the feature id is not set in the clone.
        clonedFeature.setId(feature.getId() || feature.ol_uid);
        // set "_label"-Propterty.
        // This is necessary because the *label* of the *text-Style* (buildTextStyle()) now referrs to it.
        clonedFeature.set("_label", labelText);
        // circle is not suppported by geojson
        if (clonedFeature.getGeometry().getType() === "Circle") {
            clonedFeature.setGeometry(fromCircle(clonedFeature.getGeometry()));
        }

        // Removing "Datastreams" attribute because it might overload the server as happened for some sensors.
        clonedFeature.unset("Datastreams", {silent: true});

        convertedFeature = geojsonFormat.writeFeatureObject(clonedFeature);
        if (clonedFeature.getGeometry().getCoordinates().length === 0) {
            convertedFeature = undefined;
        }
        // if its a cluster remove property features
        if (convertedFeature?.properties && Object.prototype.hasOwnProperty.call(convertedFeature.properties, "features")) {
            delete convertedFeature.properties.features;
        }
        return convertedFeature;
    },

    /**
     * Gets feature style
     * @param {ol.Feature} feature -
     * @param {ol.layer.Vector} layer -
     * @returns {ol.style.Style[]} returns or an array of styles
     */
    getFeatureStyle: function (feature, layer) {
        let styles;

        if (typeof feature.getStyleFunction() !== "undefined") {
            try {
                styles = feature.getStyleFunction().call(feature);
            }
            catch (e) {
                styles = feature.getStyleFunction().call(this, feature);
            }
        }
        else {
            styles = layer.getStyleFunction().call(layer, feature);
        }

        return !Array.isArray(styles) ? [styles] : styles;
    },

    /**
     * Returns the rules for styling of a feature
     * @param {ol.Feature} layer -
     * @param {ol.Feature} feature -
     * @param {String[]} styleAttributes The attribute by whose value the feature is styled.
     * @param {ol.style.Style} style style
     * @param {Number} styleIndex The style index.
     * @returns {string} an ECQL Expression
     */
    getStylingRules: function (layer, feature, styleAttributes, style, styleIndex) {
        const styleAttr = feature.get("styleId") ? "styleId" : styleAttributes,
            styleModel = this.getStyleModel(layer);

        if (styleAttr.length === 1 && styleAttr[0] === "") {
            if (feature.get("features") && feature.get("features").length === 1) {
                const singleFeature = new Feature({
                    properties: feature.get("features")[0].getProperties(),
                    geometry: feature.get("features")[0].getGeometry()
                });

                feature.get("features")[0] = singleFeature;
                if (style.getImage().getSrc().indexOf("data:image/svg+xml;charset=utf-8") === 0) {
                    singleFeature.setId("first_svg_" + singleFeature.ol_uid);
                }
                else {
                    singleFeature.setId("second_png_" + singleFeature.ol_uid);
                }
                singleFeature.set(singleFeature.getId(), String(feature.get("features").length));
                return "[" + singleFeature.getId() + "='" + String(feature.get("features").length) + "']";

            }
            if (typeof feature.get("features") !== "undefined") {
                if (typeof style !== "undefined" && typeof style.getText().getText() !== "undefined") {
                    feature.set("sensorClusterStyle", feature.get("features")[0].ol_uid + "_" + String(style.getText().getText()));
                    return "[sensorClusterStyle='" + feature.get("features")[0].ol_uid + "_" + String(style.getText().getText()) + "']";
                }
            }
            if (this.getFeatureStyle(feature, layer).length > 1) {
                if (style.getImage().getSrc().indexOf("data:image/svg+xml;charset=utf-8") === 0) {
                    feature.setId("first_svg_" + feature.ol_uid);
                }
                else {
                    feature.setId("second_png_" + feature.ol_uid);
                }
                Object.keys(feature.getProperties()).forEach(property => {
                    if (property === "") {
                        feature.unset(property);
                    }
                });
                feature.set(feature.getId(), String(styleIndex));
                return "[" + feature.getId() + "='" + String(styleIndex) + "']";
            }
            return "*";
        }
        // cluster feature with geometry style
        if (typeof feature.get("features") !== "undefined") {
            if ((typeof style !== "undefined" && typeof style.getText().getText() !== "undefined") || feature.get("features").length > 1) {
                const value = feature.get("features")[0].get(styleAttr[0])
                    + "_"
                    + typeof style !== "undefined" && typeof style.getText().getText() !== "undefined" ? style.getText().getText() : "cluster";

                feature.set(styleAttr[0], value);
                return `[${styleAttr[0]}='${value}']`;

            }

            // Current feature is not clustered but a single feature in a clustered layer
            return styleAttr.reduce((acc, curr) => {
                const value = feature.get("features")[0].get(curr);

                feature.set(curr, value);
                return acc + `${curr}='${value}',`;
            }, "[").slice(0, -1) + "]";
        }
        // feature with geometry style and label style
        if (typeof styleModel !== "undefined" && styleModel.get("labelField") && styleModel.get("labelField").length > 0) {
            const labelField = styleModel.get("labelField");

            return styleAttr.reduce((acc, curr) => acc + `${curr}='${feature.get(curr)}' AND ${labelField}='${feature.get(labelField)}',`, "[").slice(0, -1)
                + "]";
        }
        // feature with geometry style
        if (styleAttr instanceof Array) {
            return styleAttr.reduce((acc, curr) => acc + `${curr}='${feature.get(curr)}',`, "[").slice(0, -1)
            + "]";
        }

        return "[" + styleAttr + "='" + feature.get(styleAttr) + "']";
    },

    /**
     * Gets style attributes
     * @param {ol.Layer} layer - layer
     * @param {ol.feature} feature - the feature of current layer
     * @returns {String[]} the attributes by whose value the feature is styled
     */
    getStyleAttributes: function (layer, feature) {
        const layerId = layer.get("id"),
            styleObject = this.getStyleModel(layer);
        let styleFields = ["styleId"],
            layerModel = Radio.request("ModelList", "getModelByAttributes", {id: layer.get("id")});

        if (typeof styleObject !== "undefined") {
            layerModel = this.getChildModelIfGroupLayer(layerModel, layerId);

            if (layerModel.get("styleId")) {
                const featureRules = getRulesForFeature(styleObject, feature);

                styleFields = featureRules?.[0]?.conditions ? Object.keys(featureRules[0].conditions.properties) : [""];
            }
            else {
                styleFields = [styleObject.get("styleField")];
            }
        }

        return styleFields;
    },

    /**
     * Checks if model is a Group Model.
     * If so, then the child model corresponding to layerId is returned.
     * Otherwise the model is returned
     * @param  {Backbone.Model} model Layer model from ModelList
     * @param  {String} layerId Id of layer model to return
     * @return {Backbone.Model} found layer model
     */
    getChildModelIfGroupLayer: function (model, layerId) {
        let layerModel = model;

        if (layerModel.get("typ") === "GROUP") {
            layerModel = layerModel.get("layerSource").filter(childLayer => {
                return childLayer.get("id") === layerId;
            })[0];
        }
        return layerModel;
    },

    legendContainsPdf: function (legend) {
        return legend.some(legendPart => {
            let isPdf = false;

            if (typeof legendPart === "object" && !Array.isArray(legendPart.graphic)) {
                isPdf = legendPart.graphic.endsWith(".pdf");
            }
            else if (typeof legendPart === "object" && Array.isArray(legendPart.graphic)) {
                return isPdf;
            }
            else {
                isPdf = legendPart.endsWith(".pdf");
            }
            return isPdf;
        });
    },

    /**
     * Prepares Attributes for legend in mapfish-print template
     * @param {Object} legend Legend of layer.
     * @returns {Object[]} - prepared legend attributes.
     */
    prepareLegendAttributes: function (legend) {
        const valuesArray = [];

        legend.forEach(legendPart => {
            const legendObj = {
                    legendType: "",
                    geometryType: "",
                    imageUrl: "",
                    color: "",
                    label: legendPart.name
                },
                graphic = typeof legendPart === "object" ? legendPart.graphic : legendPart;

            if (Array.isArray(graphic)) {
                graphic.forEach(graphicPart => {
                    if (graphicPart.indexOf("svg") !== -1) {
                        legendObj.svg = decodeURIComponent(graphicPart).split("data:image/svg+xml;charset=utf-8,")[1];
                    }
                    else {
                        legendObj.imageUrl = graphicPart;
                    }
                });
                legendObj.legendType = "svgAndPng";
            }
            else if (graphic.indexOf("data:image/svg+xml;charset=utf-8,<svg") !== -1) {
                legendObj.svg = decodeURIComponent(graphic).split("data:image/svg+xml;charset=utf-8,")[1];
                legendObj.legendType = "svg";
            }
            else if (graphic.toUpperCase().includes("GETLEGENDGRAPHIC")) {
                legendObj.legendType = "wmsGetLegendGraphic";
                legendObj.imageUrl = graphic;
            }
            else if (graphic.indexOf("<svg") !== -1) {
                legendObj.color = this.getFillColorFromSVG(graphic);
                legendObj.legendType = "geometry";
                legendObj.geometryType = "polygon";
            }
            else {
                legendObj.legendType = "wfsImage";
                legendObj.imageUrl = graphic;
            }
            if (typeof legendObj.color !== "undefined") {
                valuesArray.push(legendObj);
            }
        });
        return [].concat(...valuesArray);
    },

    /**
     * Returns Fill color from SVG as hex.
     * @param {String} svgString String of SVG.
     * @returns {String} - Fill color from SVG.
     */
    getFillColorFromSVG: function (svgString) {
        if (svgString.split(/fill:(.+)/)[1]) {
            return svgString.split(/fill:(.+)/)[1].split(/;(.+)/)[0];
        }
        return undefined;
    },

    /**
     * Gets array with [GfiContent, layername, coordinates] of actual gfi
     * empty array if gfi is not active.
     * coordinates not needed, yet.
     * @param {boolean} isGfiSelected flag if gfi has to be printed
     * @param  {Array} gfiArray array
     * @return {void}
     */
    buildGfi: function (isGfiSelected, gfiArray) {
        const gfiObject = {};
        let gfiAttributes,
            layerName;

        if (isGfiSelected) {
            if (gfiArray.length > 0) {
                gfiObject.layers = [];
                gfiAttributes = gfiArray[0];
                layerName = gfiArray[1];

                gfiObject.layers.push({
                    layerName: layerName,
                    values: this.prepareGfiAttributes(gfiAttributes)
                });

            }
            this.addGfiFeature(this.defaults.attributes.map.layers, gfiArray[2]);
        }
        this.setShowGfi(isGfiSelected);
        this.setGfi(gfiObject);
    },

    /**
     * Adds gfi features
     * @param {Object[]} layers - layers attribute of the map spec
     * @param {number[]} coordinates - the coordinates of the gfi
     * @returns {void}
     */
    addGfiFeature: function (layers, coordinates) {
        const geojsonFormat = new GeoJSON(),
            gfiFeature = new Feature({
                geometry: new Point(coordinates),
                name: "GFI Point"
            });

        layers.splice(0, 0, {
            type: "geojson",
            geojson: [geojsonFormat.writeFeatureObject(gfiFeature)],
            style: {
                version: "2",
                "[name='GFI Point']": {
                    symbolizers: [{
                        fillOpacity: 0,
                        pointRadius: 18,
                        strokeColor: "#e10019",
                        strokeWidth: 3,
                        type: "point"
                    },
                    {
                        fillColor: "#e10019",
                        pointRadius: 4,
                        strokeOpacity: 0,
                        type: "point"
                    }]
                }
            }
        });
    },

    /**
     * Parses gfiAttributes object with key value pairs into array[objects] with attributes key and value
     * @param  {Object} gfiAttributes gfi Mapping attributes
     * @return {Object[]} parsed array[objects] with key- and value attributes
     */
    prepareGfiAttributes: function (gfiAttributes) {
        const valuesArray = [];
        let key;

        for (key in gfiAttributes) {
            valuesArray.push({
                key: key,
                value: gfiAttributes[key]
            });
        }

        return valuesArray;
    },

    /**
     * Creates the scale string.
     * @param {String} scale Scale of map.
     * @returns {void}
     */
    buildScale: function (scale) {
        const scaleText = "1:" + scale;

        this.setScale(scaleText);
    },

    /**
     * Setter for Metadata
     * @param {String} value Value
     * @returns {void}
     */
    setMetadata: function (value) {
        this.defaults.attributes.metadata = value;
    },

    /**
     * Setter for Legend
     * @param {String} value Value
     * @returns {void}
     */
    setLegend: function (value) {
        this.defaults.attributes.legend = value;
    },

    /**
     * Setter for showGfi
     * @param {Boolean} value Value
     * @returns {void}
     */
    setShowGfi: function (value) {
        this.defaults.attributes.showGfi = value;
    },

    /**
     * Setter for gfi
     * @param {String} value Value
     * @returns {void}
     */
    setGfi: function (value) {
        this.defaults.attributes.gfi = value;
    },

    /**
     * Setter for scale
     * @param {String} value Value
     * @returns {void}
     */
    setScale: function (value) {
        this.defaults.attributes.scale = value;
    },

    /**
     * Setter for uniqueIdList
     * @param {String} value Value
     * @returns {void}
     */
    setUniqueIdList: function (value) {
        this.defaults.uniqueIdList = value;
    },

    /**
     * Setter for visibleLayerIds
     * @param {String} value visibleLayerIds
     * @returns {void}
     */
    setVisibleLayerIds: function (value) {
        this.defaults.visibleLayerIds = value;
    }
};

export default BuildSpecModel;
