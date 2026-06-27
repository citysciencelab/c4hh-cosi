import axios from "axios";
import TileWMS from "ol/source/TileWMS.js";
import TileGrid from "ol/tilegrid/TileGrid.js";
import {WFS} from "ol/format.js";

/**
 *
 * @param {*} url url
 * @param {*} layer layer
 * @param {*} resolution resolution
 * @return {*}  TileWMs
 */
function createTileWMS (url, layer, resolution) {
    return new TileWMS({
        url,
        gutter: 0,
        params: {"LAYERS": layer, "FORMAT": "image/png", "VERSION": "1.3.0"},
        tileGrid: new TileGrid({
            resolutions: [resolution],
            origin: [
                0,
                0
            ],
            tileSize: 512
        })
    });
}

/**
 *
 * @param {*} source source
 * @param {*} coord coordinate
 * @param {*} projection projection
 * @param {*} resolution resolution
 * @param {*} feature_count feature count
 * @return {*} url
 */
function getFeatureInfoUrl (source, coord, projection, resolution, feature_count) {
    return source.getFeatureInfoUrl(coord, resolution, projection, {"INFO_FORMAT": "text/xml", feature_count});
}

/**
 *
 * @param {*} wmsUrl wmsUrl
 * @param {*} layer layer
 * @param {*} coord coord
 * @param {*} projection projection
 * @param {*} resolution resolution
 * @param {*} feature_count feature count
 * @return {*} feature info
 */
export async function getFeatureInfos (wmsUrl, layer, coord, projection, resolution, feature_count) {
    const source = createTileWMS(wmsUrl, layer, resolution),
        url = getFeatureInfoUrl(source, coord, projection, resolution, feature_count),
        ret = await axios.get(url),
        wfsReader = new WFS({});

    return wfsReader.readFeatures(ret.data);
}
