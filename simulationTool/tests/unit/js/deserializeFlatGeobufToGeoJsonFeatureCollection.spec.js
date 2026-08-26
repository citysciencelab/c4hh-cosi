import {beforeEach, describe, expect, it, vi} from "vitest";

/**
 * Imports the subject under test after registering a module mock.
 * @param {import("vitest").Mock} deserializeMock The deserialize mock.
 * @returns {Promise<Function>} The deserializer function.
 */
async function importSubjectWithMock (deserializeMock) {
    vi.doMock("flatgeobuf", () => ({
        geojson: {
            deserialize: deserializeMock
        }
    }));

    return (await import("../../../js/deserializeFlatGeobufToGeoJsonFeatureCollection.js")).default;
}

describe("addons/simulationTool/js/deserializeFlatGeobufToGeoJsonFeatureCollection.js", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("positive: decodes base64 payload and returns a feature collection", async () => {
        const deserializeMock = vi.fn();
        const payload = {
                encoding: "base64",
                value: Buffer.from([1, 2, 3]).toString("base64")
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

        const deserializeFlatGeobufToGeoJsonFeatureCollection = await importSubjectWithMock(deserializeMock);

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
        const deserializeMock = vi.fn(),
            deserializeFlatGeobufToGeoJsonFeatureCollection = await importSubjectWithMock(deserializeMock);
        const payload = {
            encoding: "utf-8",
            value: "not-base64"
        };

        const result = await deserializeFlatGeobufToGeoJsonFeatureCollection(payload);

        expect(result).toBeNull();
        expect(deserializeMock).not.toHaveBeenCalled();
    });
});
