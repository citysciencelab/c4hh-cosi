
import {GeoJSON} from "ol/format.js";
import {getFeatureIds, returnGeoJSONLayerObject, transformFeature} from "../js/addGeoJsonRemotely.js";
import importLayers from "../js/addWMSRemotely.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";
import store from "../../../src/app-store/index.js";
import {treeSubjectsKey} from "../../../src/shared/js/utils/constants.js";

export default {
    /**
     * Adds a geojson through the remote interface
     * @param {String} name Name of the geojson to be shown in the layer tree
     * @param {String} id ID of the layer
     * @param {JSON} geoJSON Geojson containing all the features
     * @param {String} styleId StyleId of the layer which needs to be the same as the one in the style array inside the geojson
     * @param {String} folderName Name of the folder in the layer tree
     * @param {Object} gfiAttributes Attributes to be shown in the GFI
     * @param {Boolean} zoomTo Flag if the map should zoom to the extent of the layer
     * @param {Number} clusterDistance distance in which features will be clustured if set
     * @param {String} gfiTheme name of the gfiTheme
     * @param {String} mouseHoverField name of the field to be shown on mouse hover
     * @param {Boolean} verbose Flag if there shall be an alert on successful adding the layer
     * @returns {void}
     */
    addGeoJson ({rootState, rootGetters}, {name, id, geoJSON, styleId, folderName, gfiAttributes, zoomTo = true, clusterDistance = undefined, gfiTheme = "default", mouseHoverField = undefined, verbose = false}) {
        const map = mapCollection.getMap("2D"),
            layer = map ? map.getLayers().getArray().find(l => {
                return l.get("id") === id;
            }) : undefined,
            uniqueId = "external_" + name,
            folder = {
                type: "folder",
                name: folderName,
                id: "external_layers",
                elements: [{
                    type: "folder",
                    parentId: "external_layers",
                    name: uniqueId,
                    id: uniqueId,
                    elements: []
                }]
            };
        let geojsonLayer = {},
            parentKey = treeSubjectsKey,
            folderToAdd = folder;

        if (!layer) {
            if (geoJSON?.styles) {
                if (rootGetters?.styleListLoaded) {
                    styleList.addToStyleList(geoJSON.styles);
                }
                else {
                    store.watch(() => rootGetters?.styleListLoaded, value => {
                        if (value) {
                            styleList.addToStyleList(geoJSON.styles);
                        }
                    });
                }
            }

            geojsonLayer = returnGeoJSONLayerObject(name, id, geoJSON, styleId, uniqueId, gfiAttributes, clusterDistance, gfiTheme, mouseHoverField);

            folder.elements[0].elements.push(geojsonLayer);

            if (store.getters.folderById("external_layers")) {
                parentKey = "external_layers";
                folderToAdd = folder.elements[0];
            }

            store.dispatch("addLayerToLayerConfig", {layerConfig: folderToAdd, parentKey: parentKey}, {root: true}).then((addedLayer) => {
                if (addedLayer && zoomTo) {
                    store.dispatch("Maps/zoomToFilteredFeatures", {ids: getFeatureIds(id), layerId: id, zoomOptions: {duration: 0}});
                }

                if (verbose) {
                    const category = addedLayer ? "success" : "warning",
                        content = addedLayer
                            ? i18next.t("additional:modules.addLayerRemotely.geojson.completeMessage")
                            : i18next.t("additional:modules.addLayerRemotely.geojson.alreadyAdded"),
                        title = addedLayer
                            ? i18next.t("additional:modules.addLayerRemotely.geojson.alertTitleSuccess")
                            : i18next.t("additional:modules.addLayerRemotely.geojson.errorTitle");

                    store.dispatch("Alerting/addSingleAlert", {
                        content: content,
                        category: category,
                        title: title
                    });
                }
            });
        }
        else {
            const features = new GeoJSON().readFeatures(geoJSON),
                projCode = store.getters["Maps/projectionCode"];

            features.forEach((feature) => {
                transformFeature(feature, projCode);
            });

            const source = layer.getSource();

            // Handle cluster sources: clear and update the underlying vector source
            const vectorSource = source.getSource ? source.getSource() : source;

            vectorSource.clear();
            vectorSource.addFeatures(features);

            // If it's a cluster source, also refresh it
            if (source.getSource) {
                source.clear();
                source.refresh();
            }

            if (zoomTo) {
                store.dispatch("Maps/zoomToFilteredFeatures", {ids: getFeatureIds(id), layerId: id, zoomOptions: {duration: 0}});
            }
        }

        if (mouseHoverField && rootState.Modules?.MouseHover) {
            rootState.Modules?.MouseHover.mouseHoverLayers.push(geojsonLayer);
            rootState.Modules?.MouseHover.mouseHoverInfos.push({id: geojsonLayer.id, mouseHoverField: geojsonLayer.mouseHoverField});
        }

        window.addEventListener("touchmove", () => {
            if (map.getView().getZoom() < map.getView().getMinZoom()) {
                map.getView().setZoom(map.getView().getMinZoom());
                return false;
            }
            else if (map.getView().getZoom() > map.getView().getMaxZoom()) {
                map.getView().setZoom(map.getView().getMaxZoom());
                return false;
            }
            return true;
        });
    },

    /**
     * Adds a WMS through the remote interface
     * @param {Object} context The vuex context.
     * @param {String} url Url of the WMS
     * @param {Array} layersToLoad Array of Objects containing the name, title, style, layerOn information of the layers to be added from the WMS capabilities
     * @param {String} folderName Name of the folder in the layer tree
     * @param {Boolean} zoomTo Parameter to indicate whether the layer is turned on
     * @param {Boolean} verbose Flag if there shall be an alert on successful adding the layer
     * @returns {void}
     */
    addWMS (context, {url, layersToLoad = undefined, folderName = "Externe Daten", zoomTo = false, verbose = false}) {
        importLayers(url, layersToLoad, folderName, zoomTo, verbose);
    },

    /**
     * Sets the geometry for the route features and zoom to the feature extent.
     * @param {Object} context The vuex context.
     * @param {String} layerId The layer id.
     * @param {Boolean} isSelected Is the layer selected.
     * @returns {void}
     */
    toggleLayerVisibility (context, {layerId}) {
        const map = mapCollection.getMap("2D"),
            layer = map ? map.getLayers().getArray().find(l => {
                return l.get("id") === layerId;
            }) : undefined;

        if (layer) {
            store.dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{
                    id: layerId,
                    layer: {
                        visibility: !layer.getVisible()
                    }
                }]
            }, {root: true});
        }
    }
};
