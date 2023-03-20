import {fetchRoutingNominatimGeosearchReverse} from "../../../src/modules/tools/routing/utils/geosearch/routing-nominatim-geosearch";
import {fetchRoutingBkgGeosearchReverse} from "../../../src/modules/tools/routing/utils/geosearch/routing-bkg-geosearch";
import * as Proj from "ol/proj.js";

/**
 * @param {Array<Number>} coords - the point coordinates
 * @param {String} portalCrs - the portal's CRS
 * @param {"NOMINATIM" | "BKG"} [type="NOMINATIM"] - which geocoder to use
 * @return {String} the address from gazetter
 */
export async function reverseGeocode (coords, portalCrs, type = "NOMINATIM") {
    const _coords = Proj.transform(coords, portalCrs, "EPSG:4326");

    try {
        return type === "BKG" ? await fetchRoutingBkgGeosearchReverse(_coords) : await fetchRoutingNominatimGeosearchReverse(_coords);
    }
    catch (e) {
        console.warn("Could not fetch address, please check config of routing/reverseGeocode", e);
        return null;
    }
}

/**
 * returns the address name for a geometry
 * @param {module:ol/Geometry} geom - the geometry
 * @param {String} portalCrs - the portal's CRS
 * @param {"NOMINATIM" | "BKG"} [type] - which geocoder to use
 * @return {String} the address
 */
export async function getAddress (geom, portalCrs, type) {
    const
        coordinates = geom.getType() === "Polygon" || geom.getType() === "MultiPolygon" ?
            geom.getExtent().getCenter() :
            geom.getCoordinates(),
        geocode = await reverseGeocode(coordinates, portalCrs, type);

    return geocode?.displayName;
}
