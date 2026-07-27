import {beforeEach, describe, expect, it, vi} from "vitest";

const {deserializeMock} = vi.hoisted(() => ({
    deserializeMock: vi.fn()
}));

vi.mock("flatgeobuf", () => ({
    geojson: {
        deserialize: deserializeMock
    }
}));

import deserializeFlatGeobufToGeoJsonFeatureCollection from "../../../js/deserializeFlatGeobufToGeoJsonFeatureCollection.js";

describe("addons/simulationTool/js/deserializeFlatGeobufToGeoJsonFeatureCollection.js", () => {
    beforeEach(() => {
        deserializeMock.mockReset();
    });

    it("positive: decodes base64 payload and returns a feature collection", async () => {
        const payload = {
                encoding: "base64",
                value: btoa(String.fromCharCode(1, 2, 3))
            },
            expectedFeature = {
                type: "Feature",
                properties: {id: 1},
                geometry: {
                    type: "Point",
                    coordinates: [10, 20]
                }
            };
        let receivedBytes;

        deserializeMock.mockImplementation(async function * (typedArray) {
            receivedBytes = typedArray;
            yield expectedFeature;
        });

        const result = await deserializeFlatGeobufToGeoJsonFeatureCollection(payload);

        expect(receivedBytes).toBeInstanceOf(Uint8Array);
        expect(Array.from(receivedBytes)).toEqual([1, 2, 3]);
        expect(result).toEqual({
            type: "FeatureCollection",
            features: [expectedFeature]
        });
    });

    it("negative: returns null when payload is not base64 encoded", async () => {
        const payload = {
            encoding: "utf-8",
            value: "not-base64"
        };

        const result = await deserializeFlatGeobufToGeoJsonFeatureCollection(payload);

        expect(result).toBeNull();
        expect(deserializeMock).not.toHaveBeenCalled();
    });
});
