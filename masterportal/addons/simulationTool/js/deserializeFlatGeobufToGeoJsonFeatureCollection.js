// @ts-check
import {geojson} from "flatgeobuf";

/** @typedef {import("geojson").FeatureCollection} GeoJsonFeatureCollection */
/** @typedef {import("../types/ogcApi.processes.d.ts").QualifiedInputValue} OGCQualifiedInputValue */

/**
 * Decodes a base64 string into bytes.
 * @param {string} base64Value The base64 encoded value.
 * @returns {Uint8Array} The decoded bytes.
 */
function decodeBase64ToUint8Array (base64Value) {
    // @ts-ignore
    if (typeof Uint8Array.fromBase64 === "function") {
        // @ts-ignore
        return Uint8Array.fromBase64(base64Value);
    }

    return Uint8Array.from(atob(base64Value), char => char.charCodeAt(0));
}

/**
 * Deserializes FlatGeobuf bytes into a GeoJSON FeatureCollection.
 * @param {OGCQualifiedInputValue} flatGeobufPayload The FlatGeobuf payload.
 * @returns {Promise<GeoJsonFeatureCollection|null>} The GeoJSON FeatureCollection or null.
 */
async function deserializeFlatGeobufToGeoJsonFeatureCollection (flatGeobufPayload) {
    const features = [];

    if (flatGeobufPayload?.encoding !== "base64" || typeof flatGeobufPayload?.value !== "string") {
        return null;
    }

    const typedArray = decodeBase64ToUint8Array(flatGeobufPayload.value);

    for await (const feature of geojson.deserialize(typedArray)) {
        features.push(feature);
    }

    return {
        type: "FeatureCollection",
        features
    };
}

export default deserializeFlatGeobufToGeoJsonFeatureCollection;
