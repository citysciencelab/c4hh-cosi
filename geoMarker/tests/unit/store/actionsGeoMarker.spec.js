import {expect} from "chai";
import sinon from "sinon";
import actionsGeoMarker from "../../../store/actionsGeoMarker";
import layerCollection from "@core/layers/js/layerCollection";

describe("src/modules/wfst/store/actionsGeoMarker.js", () => {
    let commit,
        map,
        dispatch,
        getters,
        rootGetters;

    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => []
                };
            },
            removeLayer: sinon.stub()
        };
        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });
    afterEach(sinon.restore);

    describe("setMapInteraction", () => {
        beforeEach(() => {
            const layer = {
                id: "0",
                url: "testurl",
                isSecured: false,
                useProxy: false
            };

            dispatch = sinon.stub();
            commit = sinon.stub();
            getters = {
                layerInformation: {}
            };
            sinon.stub(layerCollection, "getLayerById").returns(layer);
            rootGetters = {};
        });
        afterEach(() => {
            sinon.restore();
        });

        it("should handle Point interaction", async () => {
            const interaction = "Point";

            await actionsGeoMarker.setMapInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.calledWith("setSelectedInteraction", "insert")).to.be.true;
            expect(dispatch.calledWith("handleDrawInteraction")).to.be.true;
        });
    });
});

