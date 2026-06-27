import axios from "axios";
import GeoJSON from "ol/format/GeoJSON";

/**
 * Maps an ORS transport profile to a Valhalla costing model.
 * Wheelchair has no dedicated Valhalla costing, so it falls back to pedestrian.
 * "public-transport" uses Valhalla's multimodal costing (walk + GTFS transit),
 * which additionally requires a date_time on the request (see toValhallaDateTime).
 * @param {String} pathType ORS profile name.
 * @returns {String} Valhalla costing model.
 */
function toValhallaCosting (pathType) {
    switch (String(pathType).trim()) {
        case "driving-car": return "auto";
        case "cycling-regular": return "bicycle";
        case "foot-walking":
        case "wheelchair": return "pedestrian";
        case "public-transport": return "multimodal";
        default: return "auto";
    }
}

/**
 * Builds the Valhalla costing_options for a profile, if any apply.
 * Valhalla has no dedicated wheelchair costing model, but its pedestrian costing
 * exposes a `type: "wheelchair"` that avoids steps and honours wheelchair=* access
 * tags — the closest first-class accessibility tuning Valhalla offers. All other
 * profiles use Valhalla's defaults (return null → no costing_options sent).
 * @param {String} pathType ORS transport profile name.
 * @returns {Object|null} a Valhalla costing_options object, or null if none apply.
 */
function toValhallaCostingOptions (pathType) {
    if (String(pathType).trim() === "wheelchair") {
        return {pedestrian: {type: "wheelchair"}};
    }
    return null;
}

/**
 * Builds a Valhalla date_time for multimodal (transit) requests. Transit routing
 * is time-dependent, so Valhalla needs a departure time within the GTFS feed's
 * service window. We send the caller's local wall-clock time (Hamburg) as a
 * "depart at" (type 1) value so the result is independent of the container's
 * timezone.
 * @param {Date} date the departure moment (defaults to now in the caller).
 * @returns {Object} a Valhalla date_time object {type, value}.
 */
function toValhallaDateTime (date) {
    /**
     * Zero-pads a number to two digits.
     * @param {Number} number the value to pad.
     * @returns {String} the two-digit string.
     */
    function pad (number) {
        return String(number).padStart(2, "0");
    }

    const value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

    // type 1 = "depart at" the given local time.
    return {"type": 1, "value": value};
}

/**
 * Converts an ORS-style range value to a Valhalla contour entry.
 * COSI/ORS ranges are in seconds (time) or meters (distance);
 * Valhalla expects minutes (time) or kilometers (distance).
 * @param {Number} range range value (seconds or meters).
 * @param {String} rangeType "time" or "distance".
 * @returns {Object} a Valhalla contour entry.
 */
function toContour (range, rangeType) {
    return rangeType === "distance"
        ? {distance: range / 1000}
        : {time: range / 60};
}

/**
 * Converts a Valhalla contour value back to the ORS-style range unit
 * (seconds for time, meters for distance) so downstream code is unchanged.
 * @param {Number} contour Valhalla contour value (minutes or km).
 * @param {String} rangeType "time" or "distance".
 * @returns {Number} the value in seconds or meters.
 */
function fromContour (contour, rangeType) {
    return rangeType === "distance"
        ? Math.round(contour * 1000)
        : Math.round(contour * 60);
}

/**
 * Normalizes a Valhalla isochrone FeatureCollection into ORS-compatible ol
 * features ({group_index, value, center}), sorted by ascending value, so the
 * downstream code in createIsochrones.js stays untouched.
 * @param {Object} collection Valhalla GeoJSON FeatureCollection.
 * @param {Number} groupIndex index of the origin coordinate (ORS "group_index").
 * @param {Array} coordinate origin coordinate as [lon, lat].
 * @param {String} rangeType "time" or "distance".
 * @param {module:ol/format/GeoJSON} format ol GeoJSON format instance.
 * @returns {module:ol/Feature[]} normalized features for this origin.
 */
function normalizeCollection (collection, groupIndex, coordinate, rangeType, format) {
    if (!collection || !Array.isArray(collection.features)) {
        return [];
    }

    const normalized = {
        type: "FeatureCollection",
        features: collection.features
            .filter(feature => feature.geometry && String(feature.geometry.type).includes("Polygon"))
            .map(feature => ({
                type: "Feature",
                geometry: feature.geometry,
                properties: {
                    "group_index": groupIndex,
                    "value": fromContour(feature.properties.contour, rangeType),
                    "center": coordinate
                }
            }))
            .sort((featureA, featureB) => featureA.properties.value - featureB.properties.value)
    };

    return format.readFeatures(normalized);
}

/**
 * Requests isochrones from a self-hosted Valhalla service and returns them in
 * the same shape COSI expects from OpenRouteService: a flat array of ol polygon
 * features carrying {group_index, value, center}, ordered by ascending value
 * and grouped per origin coordinate.
 *
 * Unlike ORS (up to 5 locations per call), Valhalla's /isochrone endpoint takes
 * a single location per request, so one request is sent per coordinate.
 *
 * @param {String} pathType ORS transport profile (mapped to a Valhalla costing).
 * @param {Array} coordinates origin coordinates as [lon, lat] in EPSG:4326.
 * @param {String} rangeType "time" or "distance".
 * @param {Array} rangeArray range values (seconds for time, meters for distance).
 * @param {Object} [abort] axios CancelToken source.
 * @param {String} baseUrl Valhalla base URL (without a trailing "/isochrone").
 * @param {Object} [isochroneOptions] detail tuning (BACKLOG §3); ignored fields fall back to Valhalla defaults.
 * @param {Number} [isochroneOptions.generalize] Douglas–Peucker tolerance in metres; omitted if not a number. 0 = max fidelity.
 * @param {Number} [isochroneOptions.denoise] 0..1; 1 (default) drops disconnected islands, lower keeps small reachable pockets.
 * @returns {Promise<module:ol/Feature[]>} normalized isochrone features.
 */
async function requestIsochronesValhalla (pathType, coordinates, rangeType, rangeArray, abort, baseUrl, isochroneOptions = {}) {
    const format = new GeoJSON(),
        costing = toValhallaCosting(pathType),
        costingOptions = toValhallaCostingOptions(pathType),
        contours = rangeArray.map(range => toContour(range, rangeType)),
        url = baseUrl.replace(/\/+$/u, "") + "/isochrone",
        // detail levers: keep islands by default (denoise 1), no extra simplification unless asked.
        denoise = typeof isochroneOptions.denoise === "number" ? isochroneOptions.denoise : 1,
        generalize = isochroneOptions.generalize,
        // one request per coordinate — Valhalla isochrones are single-origin
        requests = coordinates.map((coordinate, groupIndex) => {
            const body = {
                "locations": [{"lon": coordinate[0], "lat": coordinate[1]}],
                "costing": costing,
                "contours": contours,
                // return polygons (not linestrings) so the downstream turf union works
                "polygons": true,
                "denoise": denoise
            };

            // wheelchair → pedestrian costing with type "wheelchair" (no first-class costing).
            if (costingOptions) {
                body.costing_options = costingOptions;
            }

            // Douglas–Peucker generalization (metres) for smoother/finer outlines; 0 is valid (max fidelity).
            if (typeof generalize === "number") {
                body.generalize = generalize;
            }

            // multimodal/transit isochrones are time-dependent and require a date_time.
            if (costing === "multimodal") {
                body.date_time = toValhallaDateTime(new Date());
            }

            // Content-Type "text/plain" keeps this a CORS "simple request" so the
            // browser skips the preflight OPTIONS — Valhalla returns 405 for OPTIONS
            // (it parses the JSON body regardless of Content-Type). Same-origin
            // deploys (nginx /valhalla proxy, §8) are unaffected.
            return axios.post(url, JSON.stringify(body), {
                headers: {"Content-Type": "text/plain"},
                cancelToken: abort && abort.token
            }).then(response => normalizeCollection(response.data, groupIndex, coordinate, rangeType, format))
                .catch(error => {
                    console.error("Error: ", error);
                    return [];
                });
        });

    return Promise.all(requests).then(grouped => grouped.flat());
}

export default requestIsochronesValhalla;
export {toValhallaCosting, toValhallaCostingOptions, toContour, fromContour, toValhallaDateTime};
