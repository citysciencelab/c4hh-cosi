import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import Cluster from "ol/source/Cluster.js";
import Style from "ol/style/Style.js";
import Polygon from "ol/geom/Polygon.js";
import {
    applyLayerFilter, clearLayerFilter, DIM_STYLE, getAllFeatures, isFiltered, resetRegistry, setLayerResolver
} from "../../utils/applyLayerFilter.js";

const spec = {items: [{kind: "condition", joiner: null, attr: "typ", type: "in", values: ["Kita"]}]},
    ORIGINAL = new Style();

/**
 * Three point features: two Kitas, one school.
 * @returns {module:ol/Feature[]} The features.
 */
function makeFeatures () {
    return ["Kita", "Kita", "Schule"].map((typ, i) => new Feature({geometry: new Point([i, i]), typ}));
}

/**
 * A minimal stand-in for a Masterportal layer.
 * @param {Object} attrs Layer attributes.
 * @param {Object} source Layer source.
 * @returns {Object} The fake layer.
 */
function fakeLayer (attrs, source) {
    const olLayer = new VectorLayer({source, style: () => ORIGINAL});

    return {
        get: key => attrs[key],
        getLayer: () => olLayer,
        getLayerSource: () => source
    };
}

describe("addons/cosi/LayerFilter/utils/applyLayerFilter", () => {
    afterEach(resetRegistry);

    it("dims non-matches on a canvas layer and restores the original style", () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "a", typ: "WFS"}, new VectorSource({features}));

        expect(applyLayerFilter(layer, spec, "dim")).to.deep.equal({matched: 2, total: 3, refCounts: {}});
        const style = layer.getLayer().getStyle();

        expect(style(features[0])).to.equal(ORIGINAL);
        expect(style(features[2])).to.equal(DIM_STYLE);
        expect(isFiltered("a")).to.equal(true);

        applyLayerFilter(layer, spec, "hide");
        expect(layer.getLayer().getStyle()(features[2])).to.equal(undefined);

        clearLayerFilter(layer);
        expect(layer.getLayer().getStyle()(features[2])).to.equal(ORIGINAL);
        expect(isFiltered("a")).to.equal(false);
    });

    it("clears the cached feature style of non-matches (masterportalapi sets one on points)", () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "p", typ: "WFS"}, new VectorSource({features}));

        features.forEach(f => f.setStyle(ORIGINAL));
        applyLayerFilter(layer, spec, "hide");
        expect(features.map(f => Boolean(f.getStyle()))).to.deep.equal([true, true, false]);
    });

    it("takes non-matches out of the clustering", () => {
        const features = makeFeatures(),
            inner = new VectorSource({features}),
            cluster = new Cluster({source: inner, distance: 20, geometryFunction: f => f.get("hideInClustering") ? null : f.getGeometry()}),
            layer = fakeLayer({id: "c", typ: "WFS"}, cluster);

        applyLayerFilter(layer, spec, "dim");
        expect(features.map(f => f.get("hideInClustering"))).to.deep.equal([false, false, true]);
        clearLayerFilter(layer);
        expect(features.map(f => f.get("hideInClustering"))).to.deep.equal([false, false, false]);
    });

    it("keeps only matches in a WebGL source and puts everything back", () => {
        const features = makeFeatures(),
            source = new VectorSource({features}),
            layer = fakeLayer({id: "w", typ: "WFS", renderer: "webgl"}, source);

        expect(applyLayerFilter(layer, spec, "dim")).to.deep.equal({matched: 2, total: 3, refCounts: {}});
        expect(source.getFeatures().length).to.equal(2);
        expect(getAllFeatures(layer).length).to.equal(3);
        clearLayerFilter(layer);
        expect(source.getFeatures().length).to.equal(3);
    });

    it("hides spatially excluded features and dims attribute non-matches", () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "s", typ: "WFS"}, new VectorSource({features})),
            area = new Feature({geometry: new Polygon([[[-1, -1], [1.5, -1], [1.5, 1.5], [-1, 1.5], [-1, -1]]])}),
            refLayer = fakeLayer({id: "area", typ: "VECTORBASE"}, new VectorSource({features: [area]}));

        setLayerResolver(id => id === "area" ? refLayer : undefined);
        // points at (0,0) Kita, (1,1) Kita, (2,2) Schule — the area covers the first two
        const res = applyLayerFilter(layer, {items: [{kind: "condition", joiner: null, attr: "typ", type: "in", values: ["Schule"]}]}, "dim",
                {combine: "and", refs: [{refLayerId: "area", mode: "within"}]}),
            style = layer.getLayer().getStyle();

        expect(res).to.deep.equal({matched: 0, total: 3, refCounts: {area: 1}});
        expect(style(features[0])).to.equal(DIM_STYLE);
        expect(style(features[2])).to.equal(undefined);
        setLayerResolver(null);
    });

    it("removes the filter when the spec restricts nothing", () => {
        const layer = fakeLayer({id: "n", typ: "WFS"}, new VectorSource({features: makeFeatures()}));

        applyLayerFilter(layer, spec);
        expect(applyLayerFilter(layer, {items: []})).to.deep.equal({matched: 3, total: 3, refCounts: {}});
        expect(isFiltered("n")).to.equal(false);
    });
});
