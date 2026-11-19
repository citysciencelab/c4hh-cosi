import {expect} from "chai";
import VectorSource from "ol/source/Vector.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import {createViewLoader, isTwinLayer, stateGraphic, stateStyle, twinStyleFunction, viewLayerName} from "../../utils/twinLayers.js";

describe("addons/cosi/PlanningTwin/utils/twinLayers", () => {
    it("loads a view like the OAF loader: bbox, crs, next links", async () => {
        const urls = [],
            pages = {
                first: {features: [{type: "Feature", id: "a", geometry: {type: "Point", coordinates: [565000, 5930000]}, properties: {pf_status: "neu"}}], links: [{rel: "next", href: "https://pz/next"}]},
                "https://pz/next": {features: [{type: "Feature", id: "b", geometry: {type: "Point", coordinates: [565100, 5930100]}, properties: {pf_status: "bestand"}}], links: []}
            },
            source = new VectorSource({format: new GeoJSON()});
        let loaded = null;

        /**
         * Answers the pages and notes the urls.
         * @param {String} url The url.
         * @returns {Promise<Object>} A response.
         */
        async function fetchFn (url) {
            urls.push(url);
            return {ok: true, json: async () => pages[url] ?? pages.first};
        }

        await new Promise((resolve, reject) => {
            const result = createViewLoader(source, {collection: "kitas", limit: 500}, "https://pz/oaf/p/demo-sicht/2029", fetchFn)(
                [560000, 5920000, 570000, 5940000], 1, null, features => {
                    loaded = features;
                    resolve();
                }, () => reject(new Error("failure"))
            );

            // OpenLayers would take a returned promise for the features
            expect(result).to.equal(undefined);
        });
        const first = new URL(urls[0]);

        expect(first.pathname).to.equal("/oaf/p/demo-sicht/2029/collections/kitas/items");
        expect(first.searchParams.get("bbox")).to.equal("560000,5920000,570000,5940000");
        expect(first.searchParams.get("bbox-crs")).to.equal("http://www.opengis.net/def/crs/EPSG/0/25832");
        expect(first.searchParams.get("limit")).to.equal("500");
        expect(urls[1]).to.equal("https://pz/next");
        expect(loaded.length).to.equal(2);
        expect(source.getFeatures().length).to.equal(2);
    });

    it("drops the answer of an older view", async () => {
        /**
         * Answers one feature.
         * @returns {Promise<Object>} A response.
         */
        async function fetchFn () {
            return {ok: true, json: async () => ({features: [{type: "Feature", id: "x", geometry: {type: "Point", coordinates: [1, 1]}, properties: {}}]})};
        }
        const source = new VectorSource({format: new GeoJSON()}),
            old = createViewLoader(source, {collection: "kitas"}, "https://pz/oaf/p/a/2029", fetchFn);

        createViewLoader(source, {collection: "kitas"}, "https://pz/oaf/p/b/2029", fetchFn);
        old([0, 0, 1, 1], 1, null, () => undefined, () => undefined);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(source.getFeatures().length).to.equal(0);
    });

    it("draws by planning status", () => {
        const fn = twinStyleFunction("kitas"),
            neu = fn(new Feature({geometry: new Point([0, 0]), pf_status: "neu"})),
            bestand = fn(new Feature({geometry: new Point([0, 0]), pf_status: "bestand"}));

        expect(neu.getImage().getRadius()).to.be.greaterThan(bestand.getImage().getRadius());
        expect(neu.getText().getText()).to.equal("K");
        expect(stateStyle("gebaeude", "entfaellt", "area").getStroke().getLineDash()).to.deep.equal([6, 4]);
        expect(stateGraphic("wohnbau", "neu", "area")).to.match(/^data:image\/svg\+xml/);
    });

    it("asks with the layer's bbox when the strategy loads everything", async () => {
        const urls = [],
            source = new VectorSource({format: new GeoJSON()});

        /**
         * Notes the url, answers nothing.
         * @param {String} url The url.
         * @returns {Promise<Object>} A response.
         */
        async function fetchFn (url) {
            urls.push(url);
            return {ok: true, json: async () => ({features: []})};
        }
        await new Promise(resolve => createViewLoader(source, {collection: "wohnbau", bbox: [1, 2, 3, 4]}, "https://pz/oaf/p/a/2029", fetchFn)(
            [-Infinity, -Infinity, Infinity, Infinity], 1, null, resolve, resolve
        ));
        expect(new URL(urls[0]).searchParams.get("bbox")).to.equal("1,2,3,4");
    });

    it("knows its layers and names them", () => {
        expect(isTwinLayer({id: "planungszwilling_kitas"})).to.equal(true);
        expect(isTwinLayer({id: "1711"})).to.equal(false);
        expect(viewLayerName("Kitas", "Demo-Sicht", "31.12.2029")).to.equal("Kitas – Demo-Sicht, 31.12.2029");
    });
});
