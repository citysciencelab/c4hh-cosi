import {createIsochrones, getFilterPoly, setFilterPoly} from "./createIsochrones";
import "regenerator-runtime/runtime";
import axios from "axios";
import {registerProjections} from "../../utils/registerProjections.js";
import GeoJSON from "ol/format/GeoJSON";

/**
 * @param {*} self self
 * @param {*} event event
 * @returns {void}
 */
async function onmessage (self, event) {
    const type = event.data.type;

    try {
        if (event.data.type === "createIsochrones") {
            const features = await createIsochrones(event.data, (p) => {
                self.postMessage({type, "progress": p});
            });

<<<<<<< HEAD
<<<<<<< HEAD
            self.postMessage({type: event.data.type, result: new GeoJSON().writeFeatures(features)});
        }
        else if (event.data.type === "init") {
            setFilterPoly(event.data.coords, event.data.geomType);
            self.postMessage({type, result: "ok"});
        }
        else if (event.data.type === "getFilterPoly") {
            self.postMessage({type, result: getFilterPoly()});
        }
        else if (event.data.type === "register") {
            registerProjections(event.data.projections);
        }
    }
    catch (error) {
        if (axios.isCancel(error)) {
            self.postMessage({type, request_canceled: true});
        }
        else {
            self.postMessage({type, error});
        }
    }
=======
                let checkExtent = getIfInExtent(capability, currentExtent, projection),
                    uniqueId = "external_",
                    finalCapability = capability;

                if (!checkVersion) {
                    const reversedData = getReversedData(data);

                    finalCapability = parser.read(reversedData);
                    checkExtent = getIfInExtent(finalCapability, currentExtent, projection);
                }

                if (!checkExtent) {
                    console.error("Layer is outside the map extent");
                    return;
                }

                if (Radio.request("Parser", "getItemByAttributes", {id: "ExternalLayer"}) === undefined) {
                    Radio.trigger("Parser", "addFolder", folderName, "ExternalLayer", "tree", 0);
                    Radio.trigger("ModelList", "renderTree");
                    $("#Overlayer").parent().after($("#ExternalLayer").parent());
                }

                uniqueId = uniqueId + getParsedTitle(finalCapability.Service.Title);

                Radio.trigger("Parser", "addFolder", finalCapability.Service.Title, uniqueId, "ExternalLayer", 0);

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

                        Radio.trigger("Parser", "addItem", layerObj);

                        Radio.trigger("ModelList", "addModelsByAttributes", {id: getParsedTitle(layer.title)});
                    });
                }
                else {
                    finalCapability.Capability.Layer.Layer.forEach(layer => {
                        parseLayer(layer, uniqueId, 1, version, url);
                        Radio.trigger("ModelList", "addModelsByAttributes", {id: getParsedTitle(layer.Title)});
                    });
                }
                if (zoomTo) {
                    Radio.trigger("Map", "zoomToExtent", {extent: checkExtent});
                }

                Radio.trigger("ModelList", "closeAllExpandedFolder");

            }
            catch (e) {
                console.error(e);
            }
        }, resp => {
            Radio.trigger("Util", "hideLoader");
            console.error(resp);
        });
>>>>>>> b1050566 (resolve rebase conflicts)
}


/**
 * Appending folders and layers to the menu based on the given layer object
 * @info recursive function
 * @param {Object} object the ol layer to hang into the menu as new folder or new layer
 * @param {String} parentId the id of the parent object in the menu
 * @param {Number} level the depth of the recursion
 * @param {String} version WMS Version
 * @param {String} url WMS url
 * @fires Core.ConfigLoader#RadioTriggerParserAddFolder
 * @fires Core.ConfigLoader#RadioTriggerParserAddLayer
 * @return {void}
 */
function parseLayer (object, parentId, level, version, url) {
    if (Object.prototype.hasOwnProperty.call(object, "Layer")) {
        object.Layer.forEach(layer => {
            parseLayer(layer, getParsedTitle(object.Title), level + 1);
        });
        Radio.trigger("Parser", "addFolder", object.Title, getParsedTitle(object.Title), parentId, level, false, false, object.invertLayerOrder);
    }
    else {
        Radio.trigger("Parser", "addLayer", object.Title, getParsedTitle(object.Title), parentId, level, object.Name, url, version, {isSelected: true});
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
=======
            self.postMessage({type: event.data.type, result: new GeoJSON().writeFeatures(features)});
>>>>>>> 5a6c901e (update cosi folder)
        }
        else if (event.data.type === "init") {
            setFilterPoly(event.data.coords);
            self.postMessage({type, result: "ok"});
        }
        else if (event.data.type === "getFilterPoly") {
            self.postMessage({type, result: getFilterPoly()});
        }
        else if (event.data.type === "register") {
            registerProjections(event.data.projections);
        }
    }
    catch (error) {
        if (axios.isCancel(error)) {
            self.postMessage({type, request_canceled: true});
        }
        else {
            self.postMessage({type, error});
        }
    }
}

self.addEventListener("message", function (e) {
    onmessage(self, e);
});

/**
 * use this (for testing) if Workers are not available in the active enviroment
 **/
export class Worker {

    // eslint-disable-next-line require-jsdoc
    constructor () {
        this.listeners = [];
    }

    // eslint-disable-next-line require-jsdoc
    async postMessage (args) {
        await onmessage({
            postMessage: (data) => {
                if (data.error) {
                    this.onerror(data);
                }
                if (this.onmessage) {
                    this.onmessage({data});
                }
                for (const l of this.listeners) {
                    l({data});
                }
            }
        }, {data: args});
    }

    // eslint-disable-next-line require-jsdoc
    terminate () {
        this.status = "terminated";
    }

    // eslint-disable-next-line require-jsdoc
    addEventListener (type, l) {
        if (type === "message") {
            this.listeners.push(l);
        }
    }

    // eslint-disable-next-line require-jsdoc
    removeEventListener (type, l) {
        if (type === "message") {
            const index = this.listeners.indexOf(l);

            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        }
    }
}
