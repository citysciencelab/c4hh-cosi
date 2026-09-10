import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actions.js";

describe("addons/storyTellingTool/storyManager/store/actions.js", () => {
    let getters,
        rootGetters,
        dispatch,
        commit,
        clickPixel,
        consoleWarnSpy;

    beforeEach(() => {
        clickPixel = [300, 400];
        mapCollection.clear();
        const map2D = {
            id: "ol",
            mode: "2D",
            getLayers: () => ({
                getArray: () => []
            }),
            getPixelFromCoordinate: sinon.stub().returns(clickPixel)
        };

        mapCollection.addMap(map2D, "2D");
        consoleWarnSpy = sinon.stub(console, "warn");

        dispatch = sinon.spy();
        commit = sinon.spy();
        getters = {
            type: "getFeatureInfo"
        };
    });

    afterEach(() => {
        consoleWarnSpy.restore();
    });

    describe("collectGfiFeatures", () => {
        beforeEach(() => {
            rootGetters = {
                "Maps/clickCoordinate": [100, 200],
                "Maps/resolution": 1,
                "Maps/projection": "EPSG:25832",
                "Maps/clickPixel": [10, 20],
                "Maps/mode": "2D",
                layerConfigById: () => ({zIndex: 0}),
                visibleSubjectDataLayerConfigs: [],
                visibleBaselayerConfigs: []
            };
        });

        it("should return early and not throw if coordinates are null", async () => {
            rootGetters = {
                ...rootGetters,
                "Maps/clickCoordinate": null
            };

            const result = await actions.collectGfiFeatures({getters, commit, dispatch, rootGetters});

            expect(result).to.be.null;
            expect(commit.called).to.be.false;
            expect(consoleWarnSpy.called).to.be.true;
            expect(consoleWarnSpy.calledWith("No click coordinate set for GetFeatureInfo.")).to.be.true;
        });
    });
});
