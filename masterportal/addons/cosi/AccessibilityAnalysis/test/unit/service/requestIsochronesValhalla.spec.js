import {expect} from "chai";
import axios from "axios";
import requestIsochronesValhalla, {toValhallaCosting, toValhallaCostingOptions, toContour, fromContour, toValhallaDateTime} from "../../../utils/requestIsochronesValhalla";

/**
 * Builds a fake Valhalla isochrone FeatureCollection.
 * @param {Number[]} contours contour values (minutes or km) as Valhalla echoes them.
 * @param {String} metric "time" or "distance".
 * @returns {Object} a GeoJSON FeatureCollection like Valhalla returns.
 */
function valhallaResponse (contours, metric) {
    return {
        type: "FeatureCollection",
        features: contours.map((contour, i) => ({
            type: "Feature",
            // Valhalla decorates features with styling props we must ignore
            properties: {contour, metric, color: "ff0000", opacity: 0.33, fill: "ff0000"},
            geometry: {
                type: "Polygon",
                coordinates: [[[i, i], [i + 1, i], [i + 1, i + 1], [i, i + 1], [i, i]]]
            }
        }))
    };
}

describe("requestIsochronesValhalla", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("unit conversions", () => {
        it("maps ORS profiles to Valhalla costing models (wheelchair -> pedestrian, public-transport -> multimodal)", () => {
            expect(toValhallaCosting("driving-car")).to.equal("auto");
            expect(toValhallaCosting("cycling-regular")).to.equal("bicycle");
            expect(toValhallaCosting("foot-walking")).to.equal("pedestrian");
            expect(toValhallaCosting("wheelchair")).to.equal("pedestrian");
            expect(toValhallaCosting("public-transport")).to.equal("multimodal");
            expect(toValhallaCosting("unknown")).to.equal("auto");
        });
        it("builds wheelchair costing_options (pedestrian type) only for the wheelchair profile", () => {
            expect(toValhallaCostingOptions("wheelchair")).to.eql({pedestrian: {type: "wheelchair"}});
            expect(toValhallaCostingOptions("foot-walking")).to.equal(null);
            expect(toValhallaCostingOptions("driving-car")).to.equal(null);
        });
        it("formats a Valhalla date_time as a local 'depart at' (type 1) wall-clock value", () => {
            // local components (no timezone suffix) so transit departs at Hamburg local time
            expect(toValhallaDateTime(new Date(2026, 5, 25, 8, 5))).to.eql({type: 1, value: "2026-06-25T08:05"});
        });
        it("converts ORS range units (s / m) to Valhalla contours (min / km)", () => {
            expect(toContour(600, "time")).to.eql({time: 10});
            expect(toContour(1000, "distance")).to.eql({distance: 1});
        });
        it("converts Valhalla contours (min / km) back to ORS range units (s / m)", () => {
            expect(fromContour(10, "time")).to.equal(600);
            expect(fromContour(1, "distance")).to.equal(1000);
        });
    });

    it("sends one POST per coordinate to <baseUrl>/isochrone with mapped costing and converted contours", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([3.3, 6.7, 10], "time")});

        await requestIsochronesValhalla(
            "cycling-regular",
            [[10.0, 53.5], [10.1, 53.6]],
            "time",
            [198, 402, 600],
            null,
            "http://localhost:8002/"
        );

        expect(post.mock.calls.length).to.equal(2);

        const [url, body] = post.mock.calls[0],
            payload = JSON.parse(body);

        expect(url).to.equal("http://localhost:8002/isochrone");
        expect(payload.costing).to.equal("bicycle");
        expect(payload.polygons).to.equal(true);
        expect(payload.locations).to.eql([{lon: 10.0, lat: 53.5}]);
        expect(payload.contours).to.eql([{time: 3.3}, {time: 6.7}, {time: 10}]);
        // detail defaults: keep islands (denoise 1), no generalization, no costing_options
        expect(payload.denoise).to.equal(1);
        expect(payload).to.not.have.property("generalize");
        expect(payload).to.not.have.property("costing_options");
    });

    it("sends wheelchair as pedestrian costing with a wheelchair costing_options block", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([10], "time")});

        await requestIsochronesValhalla("wheelchair", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002");
        const payload = JSON.parse(post.mock.calls[0][1]);

        expect(payload.costing).to.equal("pedestrian");
        expect(payload.costing_options).to.eql({pedestrian: {type: "wheelchair"}});
    });

    it("applies the detail levers (generalize + denoise) from isochroneOptions to the request body", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([10], "time")});

        await requestIsochronesValhalla(
            "foot-walking", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002",
            {generalize: 30, denoise: 0.3}
        );
        const payload = JSON.parse(post.mock.calls[0][1]);

        expect(payload.generalize).to.equal(30);
        expect(payload.denoise).to.equal(0.3);
    });

    it("treats generalize 0 as max fidelity (sent) and omits generalize when not a number", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([10], "time")});

        await requestIsochronesValhalla("foot-walking", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002", {generalize: 0});
        expect(JSON.parse(post.mock.calls[0][1]).generalize).to.equal(0);

        post.mockClear();
        await requestIsochronesValhalla("foot-walking", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002", {generalize: null});
        expect(JSON.parse(post.mock.calls[0][1])).to.not.have.property("generalize");
    });

    it("normalizes to ORS-shaped features (value in seconds, group_index, center) sorted ascending by value", async () => {
        // Valhalla may return contours largest-first; the output must be ascending by value
        vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([10, 6.7, 3.3], "time")});

        const features = await requestIsochronesValhalla(
            "driving-car",
            [[10.0, 53.5]],
            "time",
            [198, 402, 600],
            null,
            "http://localhost:8002"
        );

        expect(features).to.have.length(3);
        expect(features.map(feature => feature.get("value"))).to.eql([198, 402, 600]);
        features.forEach(feature => {
            expect(feature.get("group_index")).to.equal(0);
            expect(feature.get("center")).to.eql([10.0, 53.5]);
            expect(feature.getGeometry().getType()).to.equal("Polygon");
        });
    });

    it("groups features per coordinate via group_index and converts distance contours to meters", async () => {
        vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([1, 2], "distance")});

        const features = await requestIsochronesValhalla(
            "foot-walking",
            [[10.0, 53.5], [10.1, 53.6]],
            "distance",
            [1000, 2000],
            null,
            "http://localhost:8002"
        );

        expect(features.map(feature => feature.get("value"))).to.eql([1000, 2000, 1000, 2000]);
        expect(features.map(feature => feature.get("group_index"))).to.eql([0, 0, 1, 1]);
    });

    it("adds a date_time to multimodal (public-transport) requests, but not to other costings", async () => {
        const post = vi.spyOn(axios, "post").mockResolvedValue({data: valhallaResponse([10], "time")});

        await requestIsochronesValhalla("public-transport", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002");
        const transitPayload = JSON.parse(post.mock.calls[0][1]);

        expect(transitPayload.costing).to.equal("multimodal");
        expect(transitPayload.date_time.type).to.equal(1);
        expect(transitPayload.date_time.value).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u);

        post.mockClear();
        await requestIsochronesValhalla("foot-walking", [[10.0, 53.5]], "time", [600], null, "http://localhost:8002");
        expect(JSON.parse(post.mock.calls[0][1])).to.not.have.property("date_time");
    });

    it("swallows per-coordinate request errors and returns an empty list", async () => {
        vi.spyOn(axios, "post").mockRejectedValue(new Error("network"));

        const features = await requestIsochronesValhalla("driving-car", [[10, 53.5]], "time", [600], null, "http://localhost:8002");

        expect(features).to.eql([]);
    });
});
