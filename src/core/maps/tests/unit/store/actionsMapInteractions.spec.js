import {expect} from "chai";
import Map from "ol/Map.js";
import sinon from "sinon";
import {config} from "@vue/test-utils";
import actions from "@core/maps/store/actionsMapsInteractions.js";

config.global.mocks.$t = key => key;

const {
    registerListener,
    unregisterListener
} = actions;

describe("src/core/maps/store/actionsMapsInteractions.js", () => {
    let rootGetters;

    beforeEach(() => {
        rootGetters = {
            map3dParameter: () => {
                return {};
            },
            layerConfigById: () => ({})
        };
        sinon.stub(console, "warn").callsFake(sinon.spy());
    });

    describe("registerlistener and unregisterlistener", () => {
        let olMap,
            payload;

        beforeAll(() => {
            olMap = new Map();
            payload = {
                type: "pointermove",
                listener: "updatePointer",
                listenerType: "dispatch"
            };
            mapCollection.clear();
            mapCollection.addMap(olMap, "2D");
        });

        it("register pointermove listener to ol map", () => {
            const dispatch = sinon.spy(),
                commit = sinon.spy();

            registerListener({commit, dispatch}, payload);
            expect(Object.keys(olMap.listeners_)).include("pointermove");
        });

        it("unregister pointermove listener from ol map", () => {
            unregisterListener({}, payload);
            expect(Object.keys(olMap.listeners_)).not.include("pointermove");
        });
    });

    describe("setCamera", () => {
        it("should set the camera params to configJs, if 3D map is not created yet", () => {
            const cameraParams = {
                altitude: 127,
                heading: -1.2502079000000208,
                tilt: 45
            };

            actions.setCamera({rootGetters}, cameraParams);

            expect(rootGetters.map3dParameter.camera).to.deep.equals(cameraParams);
        });
    });
    describe("activateViewpoint", () => {
        it("should execute 2D-specific actions when mode is 2D", () => {
            const dispatch = sinon.spy(),
                getters = {
                    mode: "2D"
                },
                center = [564028.7954571751, 5934555.967867207],
                zoom = 7.456437968949651;

            actions.activateViewpoint({dispatch, getters}, {center, zoom});

            expect(dispatch.calledOnceWithExactly("Maps/zoomToCoordinates", {center, zoom}, {root: true})).to.be.true;
        });
        it("should fly the camera to the specified viewpoint in 3D mode", () => {
            const dispatch = sinon.spy(),
                getters = {
                    mode: "3D"
                },
                center = [564028.7954571751, 5934555.967867207],
                altitude = 272.3469798217454,
                heading = -0.30858728378862876,
                tilt = 0.9321791580603296;

            actions.activateViewpoint({dispatch, getters}, {center, altitude, heading, tilt});
            expect(dispatch.calledOnceWithExactly("flyTo3DCoordinates", {center, altitude, heading, tilt})).to.be.true;
        });

        it("should add layers if not present", () => {
            const dispatch = sinon.spy(),
                layerIds = ["layer1", "layer2"],
                getters = {
                    mode: "2D"
                };

            actions.activateViewpoint({dispatch, getters}, {layerIds});

            layerIds.forEach(layerId => {
                expect(dispatch.calledWith("addLayerIfNotPresent", {layerId})).to.be.true;
            });
        });
    });

    describe("addLayerIfNotPresent", () => {
        it("should add the layer if it's not already present", () => {
            const dispatch = sinon.spy(),
                getters = {
                    getLayerById: sinon.stub().returns(null)
                },
                layerId = "layer1";

            rootGetters = {
                layerConfigById: sinon.stub().returns({})
            };

            actions.addLayerIfNotPresent({dispatch, getters, rootGetters}, {layerId});

            expect(dispatch.calledWith("addOrReplaceLayer", {layerId}, {root: true})).to.be.true;
        });

        it("should change the visibility of the layer if it's not visible", () => {
            const dispatch = sinon.spy(),
                getters = {
                    getLayerById: sinon.stub().returns({})
                };

            rootGetters = {
                layerConfigById: sinon.stub().returns({visibility: false})
            };

            actions.addLayerIfNotPresent({dispatch, getters, rootGetters}, {layerId: "layer1"});

            expect(dispatch.calledWith("replaceByIdInLayerConfig", {
                layerId: "layer1",
                layer: {
                    showInLayerTree: true,
                    visibility: true
                }
            }, {root: true})).to.be.true;
        });

        it("should do nothing if the layer exists and is already visible", () => {
            const dispatch = sinon.spy(),
                getters = {
                    getLayerById: sinon.stub().returns({})
                },
                layerId = "layer1";

            rootGetters = {
                layerConfigById: sinon.stub().returns({visibility: true})
            };

            actions.addLayerIfNotPresent({dispatch, getters, rootGetters}, {layerId});
            expect(dispatch.called).to.be.false;
        });

        it("should trigger a warning if the layer configuration is missing", () => {
            const dispatch = sinon.spy(),
                getters = {
                    getLayerById: () => null
                },
                layerId = "layer1";

            rootGetters = {
                layerConfigById: () => undefined
            };

            sinon.stub(i18next, "t").returns("Layer ID layer1 not found or invalid");

            actions.addLayerIfNotPresent({dispatch, getters, rootGetters}, {layerId});

            expect(dispatch.calledWith("Alerting/addSingleAlert", {
                category: "warning",
                content: "Layer ID layer1 not found or invalid"
            })).to.be.true;

            i18next.t.restore();
        });
    });
});
