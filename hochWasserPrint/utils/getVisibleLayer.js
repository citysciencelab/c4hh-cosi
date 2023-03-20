import differenceJS from "../../../src/utils/differenceJS";
import sortBy from "../../../src/utils/sortBy";
import store from "../../../src/app-store/index";
/**
 * Sets the visible layers and set into variable
 * @param {boolean} [printMapMarker=false] whether layer "markerPoint" should be filtered out
 * @returns {void}
 */
export default function getVisibleLayer (printMapMarker = false) {
    const layers = Radio.request("Map", "getLayers"),
        visibleLayerList = typeof layers?.getArray !== "function" ? [] : layers.getArray().filter(layer => {
            return layer.getVisible() === true &&
                (
                    layer.get("name") !== "markerPoint" || printMapMarker
                );
        });

    if (Array.isArray(visibleLayerList) && visibleLayerList.length) {
        sortVisibleLayerListByZindex(visibleLayerList);
    }
}

/**
 * Sorts the visible layer list by zIndex from layer
 * layers with undefined zIndex come to the beginning of array
 * @param {array} visibleLayerList with visble layer
 * @param {Object} param.commit the commit
 * @returns {array} sorted visibleLayerList
 */
function sortVisibleLayerListByZindex (visibleLayerList) {
    const visibleLayerListWithZIndex = visibleLayerList.filter(layer => {
            return typeof layer.getZIndex() !== "undefined";
        }),
        visibleLayerListWithoutZIndex = differenceJS(visibleLayerList, visibleLayerListWithZIndex);

    visibleLayerListWithoutZIndex.push(sortBy(visibleLayerListWithZIndex, (layer) => layer.getZIndex()));

    store.dispatch("Tools/HochWasserPrint/setVisibleLayerList", [].concat(...visibleLayerListWithoutZIndex));
}
