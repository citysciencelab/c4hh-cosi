import SpecModel from "./../../../../src/modules/tools/print/utils/buildSpec";

/**
 * Setes the school route layer to end of the visible vector layer list.
 * @param {String} layerName The name of the school route layer.
 * @param {ol/VectorLayer[]} [visibleLayerList=[]] The visible vector layers.
 * @returns {ol/VectorLayer[]} The sorted vector layer list.
 */
function sortVisibleLayerList (layerName, visibleLayerList = []) {
    const sortedVisibleLayerList = [];
    let schoolRouteLayer = null;

    visibleLayerList.forEach(layer => {
        if (layer.get("name") === layerName) {
            schoolRouteLayer = layer;
        }
        else {
            sortedVisibleLayerList.push(layer);
        }
    });

    sortedVisibleLayerList.push(schoolRouteLayer);

    return sortedVisibleLayerList;
}


export default {
    /**
     * Prints the route via the print module.
     * @param {Object} context The vuex context.
     * @param {Function} getResponse a function to receive the response with
     * @returns {void}
     */
    async printRoute ({state, rootGetters, dispatch}, getResponse) {
        const routeElements = state.routeElements,
            visibleLayerList = sortVisibleLayerList(state.layerName, rootGetters["Maps/getVisibleLayerList"]),
            attributes = {
                "layout": state.printLayout,
                "outputFormat": state.printOutputFormat,
                "outputFilename": "Schulweg",
                "attributes": {
                    "title": state.printTitle,
                    "length": `${routeElements.kuerzesteStrecke}m`,
                    "address": state.selectedAddress,
                    "school": `${state.selectedSchool?.get("schulname")}, ${routeElements.SchuleingangTyp} (${routeElements.SchuleingangAdresse})`,
                    "map": {
                        "dpi": state.printDpi,
                        "projection": Radio.request("MapView", "getProjection")?.getCode(),
                        "center": Radio.request("MapView", "getCenter"),
                        "scale": Radio.request("MapView", "getOptions")?.scale
                    },
                    "datasource": [{
                        "table": {
                            "columns": ["index", "description"],
                            "data": state.routeDescription
                        }
                    }]
                }
            },
            spec = SpecModel;
        let printJob = null;

        dispatch("Tools/Print/activatePrintStarted", true, {root: true});
        spec.setAttributes(attributes);

        await spec.buildLayers(visibleLayerList);
        printJob = {
            payload: encodeURIComponent(JSON.stringify(spec.defaults)),
            printAppId: "schulwegrouting",
            currentFormat: state.printOutputFormat,
            getResponse: getResponse
        };

        dispatch("Tools/Print/createPrintJob", printJob, {root: true});
    }
};
