import GeoJSON from "ol/format/GeoJSON";
<<<<<<< HEAD
=======
import proj4 from "proj4";
import * as Proj from "ol/proj.js";
import {register} from "ol/proj/proj4.js";
>>>>>>> 170e67aa (add new addons_3_0_0 structure-add missing addons)

/**
 * @param {*} data data
 * @return {*} features
 */
export function readFeatures (data) {
    return new GeoJSON().readFeatures(data);
}

/**
 * @param {*} features features
 * @return {*} data
 */
export function writeFeatures (features) {
    return new GeoJSON().writeFeatures(features);
}
<<<<<<< HEAD
=======

const namedProjections = [
    ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
    ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
    ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
    ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
];

/**
 * @return {void}
 */
export function registerProjections () {
    proj4.defs(namedProjections);
    register(proj4);
    namedProjections.forEach(projection => {
        Proj.addProjection(Proj.get(projection[0]));
        proj4.defs(projection[0]).masterportal = true;
    });
}
>>>>>>> 170e67aa (add new addons_3_0_0 structure-add missing addons)
