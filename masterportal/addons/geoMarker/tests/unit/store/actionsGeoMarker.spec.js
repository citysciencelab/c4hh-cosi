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

    beforeAll(() => {
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

        it("should handle Point interaction", async () => {
            const interaction = "Point";

            await actionsGeoMarker.setMapInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.calledWith("setSelectedInteraction", "insert")).to.be.true;
            expect(dispatch.calledWith("handleDrawInteraction")).to.be.true;
        });

        it("should handle update interaction", async () => {
            const interaction = "update";

            await actionsGeoMarker.setMapInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(dispatch.calledWith("handleUpdateInteraction")).to.be.true;
        });
    });

    describe("rollbackUpdateGeoMarkerFeature", () => {
        let mapStub, featureStub, layerStub, sourceStub;

        beforeEach(() => {
            commit = sinon.spy();
            featureStub = {
                getId: sinon.stub().returns("feature1"),
                setGeometry: sinon.spy(),
                getGeometry: sinon.stub().returns({clone: sinon.stub().returns("feature1")}),
                clone: sinon.stub().returnsThis()
            };
            const rollbackFeature = {
                    getId: sinon.stub().returns("feature1"),
                    getGeometry: sinon.stub().returns({clone: sinon.stub().returns("clonedGeometry")})
                },
                featureList = [featureStub],
                updateLayerIds = ["layer1"];

            sourceStub = {
                getFeatureById: sinon.stub().returns(featureStub),
                refresh: sinon.spy()
            };
            layerStub = {
                get: sinon.stub().withArgs("id").returns("layer1"),
                getSource: sinon.stub().returns(sourceStub)
            };
            mapStub = {
                getLayers: () => ({getArray: () => [layerStub]})
            };
            // Stub mapCollection.getMap to return our fake map
            sinon.stub(mapCollection, "getMap").returns(mapStub);

            getters = {
                rollbackGeoMarkerFeature: rollbackFeature,
                geoMarkerUpdateLayerIds: updateLayerIds,
                geoMarkerFeatureList: featureList,
                geoMarkerFeatureSelected: featureStub
            };
        });


        it("should rollback geometry and refresh layers when rollbackGeoMarkerFeature and geoMarkerUpdateLayerIds are set", () => {
            actionsGeoMarker.rollbackGeoMarkerUpdateFeature({commit, getters});
            expect(featureStub.setGeometry.calledWith("clonedGeometry")).to.be.true;
            expect(sourceStub.getFeatureById.calledWith("feature1")).to.be.true;
            expect(commit.calledWith("setRollbackGeoMarkerFeature", null)).to.be.true;
        });

        it("should do nothing if rollbackGeoMarkerFeature or geoMarkerUpdateLayerIds are not set", () => {
            getters.rollbackGeoMarkerFeature = null;
            actionsGeoMarker.rollbackGeoMarkerUpdateFeature({commit, getters});
            expect(commit.calledWith("setRollbackGeoMarkerFeature", null)).to.be.true;
        });

        it("feature geometry should equal the rollbackFeature geometry after rollback", () => {
            // This variable will hold the geometry passed to setGeometry
            let storedGeometry = null;

            // Override setGeometry to capture the geometry argument
            featureStub.setGeometry = (geom) => {
                storedGeometry = geom;
            };

            actionsGeoMarker.rollbackGeoMarkerUpdateFeature({commit, getters});

            // Assert that the geometry set on the feature equals the geometry from the rollback feature
            expect(storedGeometry).to.equal(getters.rollbackGeoMarkerFeature.getGeometry().clone());
        });
    });

});

