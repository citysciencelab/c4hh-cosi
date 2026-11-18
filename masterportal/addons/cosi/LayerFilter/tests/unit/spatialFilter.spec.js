import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import Polygon from "ol/geom/Polygon.js";
import LineString from "ol/geom/LineString.js";
import {buildSpatialTest, representativeCoordinate, spatialSentence} from "../../utils/spatialFilter.js";

/**
 * A square area as feature.
 * @param {Number} x0 Left.
 * @param {Number} y0 Bottom.
 * @param {Number} size Edge length.
 * @param {Object} [props] Properties.
 * @returns {module:ol/Feature} The feature.
 */
function square (x0, y0, size, props = {}) {
    return new Feature({...props, geometry: new Polygon([[[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size], [x0, y0]]])});
}

const refs = {
    stadtteile: [square(0, 0, 10, {name: "Hamm"}), square(10, 0, 10, {name: "Horn"})],
    park: [square(2, 2, 2)]
};

/**
 * Reference features by layer id.
 * @param {String} id Layer id.
 * @returns {module:ol/Feature[]|null} Features.
 */
function getRef (id) {
    return refs[id] ?? null;
}

/**
 * A point feature.
 * @param {Number} x X.
 * @param {Number} y Y.
 * @returns {module:ol/Feature} The feature.
 */
function at (x, y) {
    return new Feature({geometry: new Point([x, y])});
}

describe("addons/cosi/LayerFilter/utils/spatialFilter", () => {
    it("places lines by their middle and areas by an interior point", () => {
        expect(representativeCoordinate(new LineString([[0, 0], [10, 0]]))).to.deep.equal([5, 0]);
        const c = representativeCoordinate(square(0, 0, 4).getGeometry());

        expect(c[0]).to.be.within(0, 4);
        expect(c[1]).to.be.within(0, 4);
    });

    it("keeps what is inside the union of the reference areas", () => {
        const {test, counts} = buildSpatialTest({combine: "and", refs: [{refLayerId: "stadtteile", mode: "within"}]}, getRef);

        expect([test(at(5, 5)), test(at(15, 5)), test(at(25, 5))]).to.deep.equal([true, true, false]);
        expect(counts).to.deep.equal({stadtteile: 2});
    });

    it("restricts the reference areas with their own filter", () => {
        const {test, counts} = buildSpatialTest({combine: "and", refs: [{
            refLayerId: "stadtteile", mode: "within",
            refFilter: {items: [{kind: "condition", joiner: null, attr: "name", type: "in", values: ["Horn"]}]}
        }]}, getRef);

        expect([test(at(5, 5)), test(at(15, 5))]).to.deep.equal([false, true]);
        expect(counts.stadtteile).to.equal(1);
    });

    it("combines 'inside' and 'outside' clauses with AND and OR", () => {
        const spatial = {combine: "and", refs: [{refLayerId: "stadtteile", mode: "within"}, {refLayerId: "park", mode: "outside"}]};

        expect([test2(spatial, 3, 3), test2(spatial, 6, 6)]).to.deep.equal([false, true]);
        spatial.combine = "or";
        expect([test2(spatial, 3, 3), test2(spatial, 30, 30)]).to.deep.equal([true, true]);

        /**
         * Runs the spatial test for one point.
         * @param {Object} sp Spatial spec.
         * @param {Number} x X.
         * @param {Number} y Y.
         * @returns {Boolean} Keep?
         */
        function test2 (sp, x, y) {
            return buildSpatialTest(sp, getRef).test(at(x, y));
        }
    });

    it("ignores clauses without a reference layer and says it in words", () => {
        expect(buildSpatialTest({combine: "and", refs: [{refLayerId: null, mode: "within"}]}, getRef)).to.equal(null);
        expect(spatialSentence({combine: "or", refs: [{refLayerId: "stadtteile", mode: "within"}, {refLayerId: "park", mode: "outside"}]}, id => id))
            .to.equal("nur innerhalb stadtteile ODER nur außerhalb park");
    });
});
