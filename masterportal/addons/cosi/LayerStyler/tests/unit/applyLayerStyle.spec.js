import {expect} from "chai";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import Cluster from "ol/source/Cluster.js";
import Style from "ol/style/Style.js";
import {applyLayerStyle, clearLayerStyle, isStyled, resetStyleRegistry, setLegendRefresher} from "../../utils/applyLayerStyle.js";
import {applyLayerFilter, clearLayerFilter, DIM_STYLE, resetRegistry} from "../../../LayerFilter/utils/applyLayerFilter.js";
import {STANDARD_PALETTE} from "../../utils/classify.js";
import {newStyleSpec} from "../../utils/styleSpec.js";

const ORIGINAL = new Style();

/**
 * Point features: two Kitas, one school.
 * @returns {module:ol/Feature[]} The features.
 */
function makeFeatures () {
    return ["Kita", "Kita", "Schule"].map((typ, i) => new Feature({geometry: new Point([i * 1000, 0]), typ}));
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

/**
 * A categories spec on "typ".
 * @returns {Object} The spec.
 */
function catSpec () {
    return {...newStyleSpec("point"), mode: "categories", categories: {attr: "typ", colorMap: {}}};
}

/**
 * The fill colour of a point style.
 * @param {module:ol/style/Style} style The style.
 * @returns {String} The colour.
 */
function fillOf (style) {
    return style.getImage().getFill().getColor();
}

describe("addons/cosi/LayerStyler/utils/applyLayerStyle", () => {
    afterEach(() => {
        resetStyleRegistry();
        resetRegistry();
        setLegendRefresher(null);
    });

    it("colours a canvas layer, installs a legend and restores everything", async () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "a", typ: "WFS"}, new VectorSource({features})),
            refreshed = [];

        features.forEach(f => f.setStyle(ORIGINAL));
        setLegendRefresher(l => refreshed.push(l));
        const r = applyLayerStyle(layer, catSpec()),
            style = layer.getLayer().getStyle();

        expect(r.legend.map(l => l.label)).to.deep.equal(["Kita", "Schule"]);
        expect(features.every(f => !f.getStyle())).to.equal(true);
        expect(fillOf(style(features[0]))).to.equal("rgba(42,120,214,0.9)");
        expect(style(features[0])).to.equal(style(features[1]));
        expect((await layer.createLegend()).map(l => l.name)).to.deep.equal(["Kita", "Schule"]);
        expect(isStyled("a")).to.equal(true);

        clearLayerStyle(layer);
        expect(layer.getLayer().getStyle()(features[0])).to.equal(ORIGINAL);
        expect(layer.createLegend).to.equal(undefined);
        expect(refreshed).to.have.length(2);
    });

    it("keeps a filter working on top of the style, and the style under a removed filter", () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "b", typ: "WFS"}, new VectorSource({features})),
            filter = {items: [{kind: "condition", joiner: null, attr: "typ", type: "in", values: ["Kita"]}]};

        applyLayerFilter(layer, filter, "dim");
        applyLayerStyle(layer, catSpec());
        let style = layer.getLayer().getStyle();

        expect(fillOf(style(features[0]))).to.equal("rgba(42,120,214,0.9)");
        expect(style(features[2])).to.equal(DIM_STYLE);

        clearLayerFilter(layer);
        style = layer.getLayer().getStyle();
        expect(fillOf(style(features[2]))).to.equal("rgba(235,104,52,0.9)");

        clearLayerStyle(layer);
        expect(layer.getLayer().getStyle()(features[2])).to.equal(ORIGINAL);
    });

    it("draws a cluster bubble in the most frequent member colour", () => {
        const features = makeFeatures(),
            cluster = new Cluster({source: new VectorSource({features}), distance: 20}),
            layer = fakeLayer({id: "c", typ: "WFS"}, cluster),
            style = (applyLayerStyle(layer, catSpec()), layer.getLayer().getStyle()),
            bubble = style(new Feature({geometry: new Point([0, 0]), features: [features[0], features[1], features[2]]})),
            single = style(new Feature({geometry: new Point([0, 0]), features: [features[2]]}));

        expect(bubble.getText().getText()).to.equal("3");
        expect(fillOf(bubble)).to.equal("rgba(42,120,214,0.9)");
        expect(fillOf(single)).to.equal("rgba(235,104,52,0.9)");
    });

    it("writes the look onto WebGL features and puts the original back", () => {
        const features = makeFeatures(),
            layer = fakeLayer({id: "w", typ: "WFS", renderer: "webgl"}, new VectorSource({features}));

        features.forEach(f => f.setProperties({fillColor: "#006688", strokeColor: "#006688", strokeWidth: 1, opacity: 1, circleSize: 20}));
        applyLayerStyle(layer, {...catSpec(), point: {radius: 5, sizeAttr: null, min: 4, max: 20}});
        expect(features[2].get("fillColor")).to.equal("rgba(235,104,52,0.9)");
        expect(features[2].get("circleSize")).to.equal(10);
        expect(features[2].get("strokeColor")).to.equal("#ffffff");

        clearLayerStyle(layer);
        expect(features.map(f => f.get("fillColor"))).to.deep.equal(["#006688", "#006688", "#006688"]);
        expect(STANDARD_PALETTE[1]).to.equal("#eb6834");
    });
});
