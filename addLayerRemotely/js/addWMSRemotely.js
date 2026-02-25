import {WMSCapabilities} from "ol/format.js";
import {intersects} from "ol/extent.js";
import crsModule from "@masterportal/masterportalapi/src/crs.js";
import axios from "axios";
import store from "../../../src/app-store/index.js";
import {treeSubjectsKey} from "../../../src/shared/js/utils/constants.js";

/**
 * Adds a WMS through the remote interface
 *
 * @param {String} url Url of the WMS
 * @param {Array} layersToLoad Array of Objects containing the name, title, style, layerOn information of the layers to be added from the WMS capabilities
 * @param {String} folderName Name of the folder in the layer tree
 * @param {Boolean} zoomTo Parameter to indicate whether the layer is turned on
 * @param {Boolean} verbose Flag if there shall be an alert on successful adding the layer
 * @returns {void}
 */
export default function importLayers (url, layersToLoad, folderName, zoomTo, verbose = false) {

    if (url.includes("http:")) {
        console.error("https required");
        return;
    }

    axios({
        timeout: 40000,
        url: `${url}${url.includes("?") ? "&" : "?"}request=GetCapabilities&service=WMS`
    })
        .then(response => response.data)
        .then((data) => {
            try {
                const parser = new WMSCapabilities(),
                    capability = parser.read(data),
                    version = capability?.version,
                    checkVersion = isVersionEnabled(version),
                    currentExtent = store.getters.mapViewSettings?.extent,
                    projection = store.getters["Maps/projection"].code_,
                    folder = {
                        type: "folder",
                        name: folderName,
                        elements: [],
                        id: "external_layers"
                    },
                    subFolder = {
                        type: "folder",
                        parentId: "external_layers",
                        name: "",
                        elements: []
                    };

                let checkExtent = getIfInExtent(capability, currentExtent, projection),
                    uniqueId = "external_",
                    finalCapability = capability,
                    parentKey = treeSubjectsKey,
                    folderToAdd = "";

                if (!checkVersion) {
                    const reversedData = getReversedData(data);

                    finalCapability = parser.read(reversedData);
                    checkExtent = getIfInExtent(finalCapability, currentExtent, projection);
                }

                if (!checkExtent) {
                    console.error("Layer is outside the map extent");
                    return;
                }

                uniqueId = uniqueId + getParsedTitle(finalCapability.Service.Title);
                subFolder.name = uniqueId;
                subFolder.id = uniqueId;

                if (store.getters.folderById("external_layers")) {
                    parentKey = "external_layers";
                }
                else {
                    folder.elements.push(subFolder);
                }

                if (layersToLoad) {
                    layersToLoad.forEach(layer => {
                        const layerObj = {
                            id: getParsedTitle(layer.title),
                            name: layer.title,
                            parentId: uniqueId,
                            level: 1,
                            layers: layer.name,
                            url: url,
                            version: version,
                            transparent: layer.layerTransparent ? layer.layerTransparent : true,
                            isSelected: !layer.layerOn ? layer.layerOn : true,
                            visibility: !layer.layerOn ? layer.layerOn : true,
                            showInLayerTree: !layer.layerOn ? layer.layerOn : true,
                            time: layer.layerTime ? layer.layerTime : false,
                            infoFormat: layer.infoFormat ? layer.infoFormat : "text/xml",
                            styles: layer.style ? layer.style : "",
                            cache: false,
                            datasets: [],
                            featureCount: 3,
                            format: "image/png",
                            gfiAttributes: "showAll",
                            gutter: "0",
                            isBaseLayer: false,
                            layerAttribution: "nicht vorhanden",
                            legendURL: "",
                            maxScale: "2500000",
                            minScale: "0",
                            singleTile: false,
                            supported: ["2D", "3D"],
                            tilesize: "512",
                            typ: "WMS",
                            type: "layer",
                            urlIsVisible: true
                        };

                        subFolder.elements.push(layerObj);
                    });
                }
                else {
                    finalCapability.Capability.Layer.Layer.forEach(layer => {
                        parseLayerStructure(folder, layer, 1);
                    });
                }

                folderToAdd = parentKey === "external_layers" ? subFolder : folder;

                store.dispatch("addLayerToLayerConfig", {layerConfig: folderToAdd, parentKey: parentKey}, {root: true}).then((addedLayer) => {
                    if (verbose) {
                        const category = addedLayer ? "success" : "warning",
                            content = addedLayer
                                ? i18next.t("additional:modules.addLayerRemotely.wms.completeMessage")
                                : i18next.t("additional:modules.addLayerRemotely.wms.alreadyAdded"),
                            title = addedLayer
                                ? i18next.t("additional:modules.addLayerRemotely.wms.alertTitleSuccess")
                                : i18next.t("additional:modules.addLayerRemotely.wms.errorTitle");

                        store.dispatch("Alerting/addSingleAlert", {
                            content: content,
                            category: category,
                            title: title
                        });
                    }
                });

                if (zoomTo) {
                    store.dispatch("Maps/zoomToExtent", {extent: checkExtent}, {root: true});
                }
            }
            catch (e) {
                console.error(e);
            }
        }, resp => {
            console.error(resp);
        });
}

/**
 * Creates recursively the layer structure with subfolders and layers.
 * @info recursive function
 * @param {Object} folder The layerTree folder.
 * @param {Object} object the layer object to add.
 * @param {Number} level The depth of the recursion.
 * @return {void}
 */
function parseLayerStructure (folder, object, level) {
    if (Object.prototype.hasOwnProperty.call(object, "Layer")) {
        const subFolder = {
            type: "folder",
            name: object.Title,
            elements: []
        };

        folder.elements.push(subFolder);
        object.Layer.forEach(layer => {
            this.parseLayerStructure(subFolder, layer, level + 1);
        });
    }
    else {
        const datasets = [];
        let layerObject = {};

        if (object?.MetadataURL?.[0].OnlineResource) {
            datasets.push({
                customMetadata: true,
                csw_url: object.MetadataURL[0].OnlineResource,
                attributes: {}
            });
        }
        layerObject = {
            id: this.getParsedTitle(object.Title),
            name: object.Title,
            typ: "WMS",
            layers: [object.Name],
            url: this.getBaseServiceUrl(this.wmsUrl),
            version: this.version,
            visibility: false,
            type: "layer",
            showInLayerTree: false,
            maxScale: object?.MaxScaleDenominator?.toString(),
            minScale: object?.MinScaleDenominator?.toString(),
            legendURL: object?.Style?.[0].LegendURL?.[0].OnlineResource?.toString(),
            datasets
        };

        folder.elements.push(layerObject);
    }
}

/**
 * Getter if the version is enabled and above 1.3.0
 * @param {String} version the version of current external wms layer
 * @returns {Boolean} true or false
 */
function isVersionEnabled (version) {
    if (typeof version !== "string") {
        return false;
    }

    const parsedVersion = version.split(".");

    if (parseInt(parsedVersion[0], 10) < 1) {
        return false;
    }
    else if (parsedVersion.length >= 2 && parseInt(parsedVersion[0], 10) === 1 && parseInt(parsedVersion[1], 10) < 3) {
        return false;
    }

    return true;
}

/**
 * Getter if the imported wms layer in the extent of current map
 * @param {Object} capability the response of the imported wms layer in parsed format
 * @param {Number[]} currentExtent the extent of current map view
 * @param {String} projection the projection of the map
 * @returns {Boolean} true or false
 */
function getIfInExtent (capability, currentExtent, projection) {
    const definedExtents = capability?.Capability?.Layer?.BoundingBox?.filter(bbox => {
        return bbox?.crs && bbox?.crs.includes("EPSG") && crsModule.getProjection(bbox?.crs) !== undefined && Array.isArray(bbox?.extent) && bbox?.extent.length === 4;
    });

    let layerExtent;

    if (Array.isArray(definedExtents) && definedExtents.length) {
        let minCoords = [],
            maxCoords = [];

        definedExtents.forEach(singleExtent => {
            if (singleExtent.crs === projection) {
                minCoords = [singleExtent.extent[0], singleExtent.extent[1]];
                maxCoords = [singleExtent.extent[2], singleExtent.extent[3]];
            }
        });

        if (!minCoords.length && !maxCoords.length) {
            minCoords = crsModule.transformCoord(definedExtents[0].crs, projection, [definedExtents[0].extent[0], definedExtents[0].extent[1]]);
            maxCoords = crsModule.transformCoord(definedExtents[0].crs, projection, [definedExtents[0].extent[2], definedExtents[0].extent[3]]);
        }

        layerExtent = [minCoords[0], minCoords[1], maxCoords[0], maxCoords[1]];

        // If there is no extent defined or the extent is not right defined, it will import the external wms layer(s).
        if (!Array.isArray(currentExtent) || currentExtent.length !== 4) {
            return layerExtent;
        }

        return intersects(currentExtent, layerExtent) ? layerExtent : false;
    }

    return true;
}

/**
 * Getter for reversed data of old wms version
 * @param {Object} data the response of the imported wms layer
 * @returns {xml} reversedData - The reversed data of the response of the imported wms layer
 */
function getReversedData (data) {
    let reversedData = new XMLSerializer().serializeToString(data);

    reversedData = reversedData.replace(/<SRS>/g, "<CRS>").replace(/<\/SRS>/g, "</CRS>").replace(/SRS=/g, "CRS=");
    reversedData = new DOMParser().parseFromString(reversedData, "text/xml");

    return reversedData;
}

/**
 * Getter for parsed title without space and slash and colon
 * It will be used as id later in template
 * @param {String} title - the title of current layer
 * @returns {String} parsedTitle - The parsed title
 */
function getParsedTitle (title) {
    return String(title).replace(/\s+/g, "-").replace(/\//g, "-").replace(/:/g, "-").replace(/\(/g, "-").replace(/\)/g, "-");
}

export {
    isVersionEnabled,
    getIfInExtent,
    getReversedData,
    getParsedTitle
};

