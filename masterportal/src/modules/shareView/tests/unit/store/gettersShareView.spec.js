import {expect} from "chai";
import sinon from "sinon";
import getters from "@modules/shareView/store/gettersShareView.js";
import shareViewState from "@modules/shareView/store/stateShareView.js";
import {legacyLayerUrlParams} from "@core/layers/js/layerUrlParams.js";
import {legacyMapUrlParams} from "@core/maps/js/mapUrlParams.js";
import {legacyMenuUrlParams} from "@modules/menu/js/menuUrlParams.js";
import {legacyGlobalUrlParams} from "@core/urlParams/js/globalUrlParams.js";
import {legacySearchBarUrlParams} from "@modules/searchBar/js/searchBarUrlParams.js";

describe("src/modules/shareView/store/gettersShareView.js", () => {
    let rootGetters,
        circular;

    const testLocation = "https://test.de/app.html?existingKey=existingValue&layerids=abc123";

    beforeEach(() => {

        rootGetters = {
            layerUrlParams: [
                {id: "layer1", visibility: true},
                {id: "highlight_point_layer", visibility: true, isDynamic: true},
                {id: "layer2", visibility: false}
            ],
            "Maps/urlParams": "MARKER=565874,5934140&ZOOMTOFEATUREID=18,26",
            "Menu/urlParams": {
                main: {
                    currentComponent: shareViewState.type,
                    attributes: {some: "value"}
                },
                secondary: {
                    currentComponent: "root",
                    attributes: {other: "value"}
                }
            }
        };

        const jsdom = new URL(testLocation);

        global.location = {
            origin: jsdom.origin,
            pathname: jsdom.pathname,
            search: jsdom.search
        };
    });


    it("should return a URL with MENU and LAYERS parameters, and remove filtered components", () => {
        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU")),
            ignoredKeys = ["layerids"];

        expect(parsed.searchParams.has("MENU")).to.be.true;
        expect(parsed.searchParams.has("LAYERS")).to.be.true;


        expect(menu.main.currentComponent).to.equal("root");
        expect(menu.main.attributes).to.be.undefined;

        expect(menu.secondary.currentComponent).to.equal("root");
        expect(menu.secondary.attributes).to.be.deep.equals({other: "value"});

        expect(parsed.searchParams.get("LAYERS")).to.equal(JSON.stringify(rootGetters.layerUrlParams));
        expect(parsed.searchParams.get("existingKey")).to.equal("existingValue");


        ignoredKeys.forEach(key => {
            expect(parsed.searchParams.has(key)).to.be.false;
        });
    });

    it("should keep custom component names if not in the ignore list", () => {
        rootGetters["Menu/urlParams"].main.currentComponent = "otherComponent";

        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU"));

        expect(menu.main.currentComponent).to.equal("otherComponent");
        expect(menu.main.attributes).to.deep.equal({some: "value"});
    });

    it("should filter out legacy URL parameters", () => {
        const expectedLegacyKeys = [
            ...Object.keys(legacyLayerUrlParams),
            ...Object.keys(legacyMapUrlParams),
            ...Object.keys(legacyMenuUrlParams),
            ...Object.keys(legacyGlobalUrlParams),
            ...Object.keys(legacySearchBarUrlParams)
        ].map(key => key.toLowerCase());

        const legacyParamPairs = expectedLegacyKeys.map((key, i) => `${key}=value${i}`).join("&");

        global.location.search = `?${legacyParamPairs}&existingKey=testValue`;

        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url);

        expectedLegacyKeys.forEach(key => {
            expect(parsed.searchParams.has(key)).to.be.false;
        });

        expect(parsed.searchParams.get("existingKey")).to.equal("testValue");
    });

    it("should filter out legacy URL parameters regardless of casing", () => {
        global.location.search = "?LAYERIDS=abc&Visibility=true&TRANSPARENCY=50&existingKey=testValue";

        const url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url);

        expect(parsed.searchParams.has("LAYERIDS")).to.be.false;
        expect(parsed.searchParams.has("Visibility")).to.be.false;
        expect(parsed.searchParams.has("TRANSPARENCY")).to.be.false;

        expect(parsed.searchParams.get("existingKey")).to.equal("testValue");
    });

    it("should remove invalid attributes from MENU and log an error", () => {
        circular = {};
        circular.self = circular;

        rootGetters["Menu/urlParams"].main.currentComponent = "customComponent";
        rootGetters["Menu/urlParams"].main.attributes = {circular};

        const errorSpy = sinon.stub(console, "error").callsFake(sinon.spy()),
            url = getters.url({}, {}, {}, rootGetters),
            parsed = new URL(url),
            menu = JSON.parse(parsed.searchParams.get("MENU"));


        expect(menu.main.attributes).to.be.undefined;
        expect(errorSpy.calledOnce).to.be.true;
        expect(errorSpy.firstCall.args[0]).to.include("Parsing the attributes of the module");
    });

    it("should encode the url", () => {
        const url = getters.url({}, {}, {}, rootGetters),
            decodedUrl = decodeURI(url);

        expect(url).not.to.equal(decodedUrl);
    });
});
