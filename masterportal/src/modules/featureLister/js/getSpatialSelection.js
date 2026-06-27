import WFS from "ol/format/WFS.js";
import {intersects} from "ol/format/filter.js";
import Polygon from "ol/geom/Polygon.js";

/**
 * Fetches features from a WFS service based on the drawn geometry.
 * @param {Array} geom - The geometry for spatial selection (e.g. from graphicalSelect).
 * @param {Object} selectedLayer - The selected layer containing WFS service details.
 * @param {string} epsg - The EPSG code for the coordinate reference system.
 * @param {Object} context - The Vuex context object containing dispatch and commit.
 * @returns {Promise<Array>} - A promise that resolves to an array of features.
 */
async function getSpatialSelectionForWFS (geom, selectedLayer, epsg, {dispatch, commit}) {
    const service = selectedLayer.url,
        version = selectedLayer.version,
        prefix = (selectedLayer.featurePrefix || "app").replace(/:$/, ""),
        featureType = selectedLayer.featureType,
        url = new URL(service),
        describeFeatureResponse = await (() => {
            url.searchParams.set("service", "WFS");
            url.searchParams.set("version", version);
            url.searchParams.set("request", "DescribeFeatureType");
            url.searchParams.set("typeName", featureType);
            return fetch(url.toString());
        })(),
        describeFeatureText = await describeFeatureResponse.text(),
        parser = new DOMParser(),
        describeFeatureXmlDoc = parser.parseFromString(describeFeatureText, "text/xml"),
        geometryElements = describeFeatureXmlDoc.querySelector("[type^=\"gml:\"][name]"),
        geometryElement = Array.isArray(geometryElements) ? geometryElements[0] : geometryElements,
        geometryName = geometryElement ? geometryElement.getAttribute("name") : "geom",
        filter = intersects(geometryName, geom),
        wfsFormat = new WFS(),
        node = wfsFormat.writeGetFeature({
            srsName: epsg,
            featureNS: selectedLayer.featureNS,
            featurePrefix: prefix,
            featureTypes: [featureType],
            filter: filter
        }),
        serializer = new XMLSerializer(),
        body = serializer.serializeToString(node),
        response = await fetch(selectedLayer.url, {
            method: "POST",
            headers: {"Content-Type": "text/xml"},
            body
        });
    let text = "",
        features = [];

    if (!response.ok) {
        commit("setLoading", false);
        dispatch("Alerting/addSingleAlert", {
            category: "warning",
            content: i18next.t("common:modules.featureLister.requestFailedAlert")
        }, {root: true});
        throw new Error(`Failed to fetch data from WFS service: ${response.statusText}`);
    }
    text = await response.text();

    features = wfsFormat.readFeatures(text, {
        dataProjection: epsg,
        featureProjection: epsg
    });

    return features;
}


/**
 * Fetches features based on the drawn geometry and the selected layer type.
 * @param {Array} coordinates - The coordinates of the drawn geometry.
 * @param {Object} selectedLayer - The selected layer containing service details.
 * @param {string} epsg - The EPSG code for the coordinate reference system.
 * @param {Object} context - The Vuex context object containing dispatch and commit.
 * @returns {Promise<Array|boolean>} - A promise that resolves to an array of features or null if the layer type is not supported.
 */
async function getSpatialSelection (selectedArea, selectedLayer, epsg, context) {
    const drawnGeometry = JSON.stringify(selectedArea),
        coordinatesArray = JSON.parse(drawnGeometry).coordinates[0],
        geom = new Polygon([coordinatesArray]);

    if (selectedLayer.typ === "WFS") {
        return getSpatialSelectionForWFS(geom, selectedLayer, epsg, context);
    }
    return null;
}

export default {
    getSpatialSelection
};
