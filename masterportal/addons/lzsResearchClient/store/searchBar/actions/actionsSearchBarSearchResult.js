import coreSearchBarSearchResultActions from "@modules/searchBar/store/actions/actionsSearchBarSearchResult.js";

/**
 * Contains actions that communicate with other components after an interaction, such as onClick or onHover, with a search result.
 * @module modules/searchBar/store/actions/actionsSearchBarSearchResult
 */

export default {
    ...coreSearchBarSearchResultActions,

    /**
     * Sets a marker on the map at the given coordinates.
     * If the feature's geometry is a GeometryCollection, the first point geometry's coordinates are used.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.commit the commit
     * @param {Object} payload The payload.
     * @param {String[]} payload.coordinates The coordinates to place the marker at.
     * @param {import("ol/Feature").default} [payload.feature] The feature to extract geometry type from.
     * @param {String} [payload.geometryType] The geometry type, used as fallback when no feature is provided.
     * @returns {void}
     */
    setMarker: ({dispatch, commit}, {coordinates, feature, geometryType}) => {
        const numberCoordinates = coordinates?.map(coordinate => parseFloat(coordinate, 10)),
            geomType = feature ? feature?.getGeometry()?.getType() : geometryType,
            coordinateForMarker = geomType === "GeometryCollection"
                ? dispatch("getFirstPointCoordinatesOfGeometryCollection", feature, numberCoordinates)
                : numberCoordinates;

        commit("setAddressSearchCoordinates", coordinateForMarker);

        dispatch("Maps/placingPointMarker", coordinateForMarker, {root: true});
    },
    /**
     * Zoom to the coordinates of the search result.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.getters the getters
     * @param {Object} payload The payload.
     * @param {Array} payload.coordinates The coordinates to zoom to.
     * @returns {void}
     */
    zoomToResult: ({dispatch, getters}, {coordinates}) => {
        const numberCoordinates = coordinates?.map(coordinate => parseFloat(coordinate, 10));

        if (numberCoordinates.length === 4) {
            const map = mapCollection.getMap("2D"),
                view = map.getView(),
                zoom = view.getZoomForResolution(view.getResolutionForExtent(numberCoordinates, map.getSize()));

            dispatch("Maps/zoomToExtent", {extent: numberCoordinates, options: {maxZoom: zoom}}, {root: true});
        }
        else {
            dispatch("Maps/zoomToCoordinates", {center: numberCoordinates, zoom: getters.zoomLevel}, {root: true});
        }

    },
    /**
     * Returns coordinates to use for marker placement when the selected feature is a GeometryCollection.
     * It tries to find the first geometry of type {@link Point} and returns its coordinates.
     * If no point geometry exists, it falls back to the provided coordinates.
     *
     * @param {import("ol/Feature").default} feature - OpenLayers feature containing a geometry collection.
     * @param {number[]} coordinates - Fallback coordinates used when no point geometry is found.
     * @returns {number[]} Coordinates of the first point geometry, or the fallback coordinates.
    */
    getFirstPointCoordinatesOfGeometryCollection: (feature, coordinates) => {
        const geomCollection = feature.getGeometry(),
            firstPoint = geomCollection.getGeometries().find(geom => geom.getType() === "Point");

        return firstPoint ? firstPoint.getCoordinates() : coordinates;
    }
};
