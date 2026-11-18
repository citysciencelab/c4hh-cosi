import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import {NULL_COLOR, STANDARD_PALETTE, expandRamp} from "../../utils/classify.js";
import {categoryKey, classLabel, layerGeomKind, newStyleSpec, resolveStyle} from "../../utils/styleSpec.js";

/**
 * Point features with the given properties.
 * @param {Object[]} props Property bags.
 * @returns {module:ol/Feature[]} The features.
 */
function points (props) {
    return props.map((p, i) => new Feature({geometry: new Point([i, i]), ...p}));
}

describe("addons/cosi/LayerStyler/utils/styleSpec", () => {
    it("tells the geometry kind of a layer", () => {
        const area = new Feature({geometry: new Polygon([[[0, 0], [1, 0], [1, 1], [0, 0]]])});

        expect(layerGeomKind(points([{}]))).to.equal("point");
        expect(layerGeomKind([area])).to.equal("area");
        expect(layerGeomKind([area, ...points([{}])])).to.equal("mixed");
        expect(newStyleSpec("point").stroke.mode).to.equal("color");
        expect(newStyleSpec("area").stroke.mode).to.equal("same");
    });

    it("resolves classes: colours, counts, ranges and features without a value", () => {
        const features = points([{n: "1"}, {n: 2}, {n: 3}, {n: "10,5"}, {n: 11}, {n: null}]),
            spec = {...newStyleSpec("point"), mode: "classes"};

        spec.classification = {attr: "n", method: "jenks", nClasses: 2, ramp: "blues", reversed: false};
        const r = resolveStyle(spec, features),
            colors = expandRamp("blues", 2);

        expect(r.legend.map(l => [l.label, l.count])).to.deep.equal([["1 – 3", 3], ["3 – 11", 2], ["ohne Wert", 1]]);
        expect(features.map(f => r.colorOf(f))).to.deep.equal([colors[0], colors[0], colors[0], colors[1], colors[1], NULL_COLOR]);
    });

    it("labels whole-number classes without overlap, decimal ones with shared bounds", () => {
        expect([0, 1, 2].map(i => classLabel(i, [5, 7], 5, 29, true))).to.deep.equal(["5", "6 – 7", "8 – 29"]);
        expect([0, 1].map(i => classLabel(i, [10.5], 2, 20, true))).to.deep.equal(["2 – 10", "11 – 20"]);
        expect([0, 1].map(i => classLabel(i, [0.5], 0.1, 1.2, false))).to.deep.equal(["0,1 – 0,5", "0,5 – 1,2"]);
    });

    it("resolves categories with own colours and the first of several values", () => {
        const features = points([{t: "Kita"}, {t: "Schule|Kita"}, {t: "Kita"}, {t: ""}]),
            spec = {...newStyleSpec("point"), mode: "categories", categories: {attr: "t", colorMap: {Schule: "#123456"}}},
            r = resolveStyle(spec, features);

        expect(categoryKey("Schule|Kita")).to.equal("Schule");
        expect(r.legend.map(l => [l.label, l.count, l.color])).to.deep.equal([
            ["Kita", 2, STANDARD_PALETTE[0]], ["Schule", 1, "#123456"], ["ohne Wert", 1, NULL_COLOR]
        ]);
        expect(r.multi).to.equal(true);
    });

    it("scales point radii by the square root of the value", () => {
        const features = points([{v: 0}, {v: 25}, {v: 100}, {v: "x"}]),
            spec = {...newStyleSpec("point"), point: {radius: 6, sizeAttr: "v", min: 4, max: 20}},
            r = resolveStyle(spec, features);

        expect(features.map(f => r.radiusOf(f))).to.deep.equal([4, 12, 20, 4]);
        expect(r.sizeDomain).to.deep.equal([0, 100]);
    });

    it("falls back to one colour without an attribute", () => {
        const r = resolveStyle({...newStyleSpec("area"), mode: "classes"}, points([{}, {}]));

        expect(r.legend).to.deep.equal([{color: STANDARD_PALETTE[0], label: "alle Objekte", count: 2}]);
    });
});
