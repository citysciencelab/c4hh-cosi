import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsStreetSmart.js";
import state from "../../../store/stateStreetSmart.js";

describe("addons/streetSmart/store/actionsStreetSmart", () => {
    const toggle3DCursorSpy = sinon.spy(),
        toggleAddressesVisibleSpy = sinon.spy();
    let commit, dispatch, rootGetters, getters, rootState, warn;

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getCenter: () => [1, 2],
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");

        global.StreetSmartApi = {
            open: () => sinon.stub(),
            init: () => sinon.stub(),
            destroy: sinon.spy(),
            getViewers: () => [{
                getRecording: () => ({xyz: "TEST_DATA"}),
                toggle3DCursor: toggle3DCursorSpy,
                toggleAddressesVisible: toggleAddressesVisibleSpy
            }],
            ViewerType: {
                PANORAMA: "PANORAMA"
            }
        };
        commit = sinon.spy();
        dispatch = sinon.spy();
        getters = sinon.spy();
        rootGetters = {
            restServiceById: () => {
                return {
                    params: {
                        username: "username",
                        password: "password",
                        apiKey: "apiKey",
                        locale: "locale"
                    }
                };
            }
        };
    });


    describe("setPosition", () => {
        it("setPosition shall call commit and dispatch once, if StreetSmartApi.open result has one entry; 3D cursor and address visibility are toggled", async () => {
            const payload = [100, 200],
                result = [true];
            let promise,
                checked = false;

            sinon.stub(StreetSmartApi, "open").returns(
                promise = new Promise(resolve => resolve(result))
            );

            await actions.setPosition({state, commit, dispatch, rootGetters}, payload);

            await promise.then(() => {
                expect(dispatch.notCalled).to.be.true;
                expect(commit.calledOnce).to.be.true;
                expect(commit.args[0][0]).to.equal("setLastCoordinates");
                expect(commit.args[0][1]).to.deep.equal(payload);
                expect(toggle3DCursorSpy.calledOnce).to.be.true;
                expect(toggleAddressesVisibleSpy.calledOnce).to.be.true;
                checked = true;
            });
            expect(checked).to.be.true;
        });

        it("setPosition shall call dispatch 3 times, if StreetSmartApi.open result has no entry", async () => {
            const payload = [100, 200],
                result = [];
            let promise,
                checked = false;

            sinon.stub(StreetSmartApi, "open").returns(
                promise = new Promise(resolve => resolve(result))
            );

            state.lastCoordinates = [300, 400];
            await actions.setPosition({state, commit, dispatch, rootGetters}, payload);
            await promise.then(() => {
                expect(dispatch.calledTwice).to.be.true;
                expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");
                expect(dispatch.args[1][0]).to.equal("Maps/placingPointMarker");
                expect(dispatch.args[1][1]).to.deep.equal({coordinates: [300, 400]});
                expect(commit.notCalled).to.be.true;
                checked = true;
            });
            expect(checked).to.be.true;
        });
    });

    describe("initApi", () => {
        it("successful initApi shall call dispatch once and not call commit", async () => {
            let promise = null,
                checked = false;

            sinon.stub(StreetSmartApi, "init").returns(
                promise = new Promise(resolve => resolve())
            );
            actions.initApi({state, dispatch, getters, rootGetters});

            await promise.then(() => {
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.args[0][0]).to.equal("onInitSuccess");
                expect(commit.notCalled).to.be.true;
                checked = true;
            });
            expect(checked).to.be.true;
        });

        it("StreetSmartApi not available and call initApi shall call dispatch with alert", async () => {
            StreetSmartApi = undefined;
            actions.initApi({state, dispatch, getters, rootGetters});

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");
            expect(commit.notCalled).to.be.true;
            expect(warn.calledOnce).to.be.true;
        });

        it("initApi without service shall call dispatch once", async () => {
            let promise = null,
                checked = false;

            sinon.stub(StreetSmartApi, "init").returns(
                promise = new Promise(resolve => resolve())
            );

            state.serviceId = "serviceId";
            rootGetters.restServiceById = () => undefined;
            actions.initApi({state, dispatch, getters, rootGetters});

            await promise.then(() => {
                expect(dispatch.calledOnce).to.be.true;
                expect(dispatch.args[0][0]).to.equal("Alerting/addSingleAlert");
                expect(commit.notCalled).to.be.true;
                checked = true;
            });
            expect(checked).to.be.true;
            expect(warn.calledOnce).to.be.true;
        });
    });

    describe("destroyApi", () => {
        it("destroyApi shall dispatch twice and destroy api", () => {
            actions.destroyApi({state, dispatch, commit});

            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Maps/removePointMarker");
            expect(dispatch.args[0][1]).to.deep.equal(null);
            expect(dispatch.args[1][0]).to.equal("removeListener");
            expect(global.StreetSmartApi.destroy.calledOnce).to.be.true;
            expect(dispatch.args[2][0]).to.equal("Maps/changeMarkerStyle");
            expect(dispatch.args[2][1]).to.deep.equal({markerId: "marker_point_layer"});
            expect(dispatch.args[2][2]).to.deep.equal({root: true});
        });
    });

    describe("marker rotation", () => {
        it("moveAndRotateMarker shall dispatch twice and rotate icon", async () => {
            const evt = {
                detail: {
                    recording: {
                        xyz: [1, 2, 3],
                        relativeYaw: 2
                    }
                }
            };

            getters.lastYaw = 1;
            await actions.moveAndRotateMarker({dispatch, getters}, evt);

            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.args[0][1]).to.deep.equal({
                coordinates: [1, 2, 3],
                rotation: 3
            });
            expect(dispatch.args[1][0]).to.equal("Maps/setCenter");
            expect(dispatch.args[1][1]).to.deep.equal([1, 2]);
        });

        it("rotateMarker shall commit and dispatch twice and rotate icon", () => {
            const evt = {
                detail: {
                    yaw: 2
                }
            };

            actions.rotateMarker({commit, dispatch}, evt);

            expect(dispatch.calledOnce).to.be.true;
            expect(commit.calledTwice).to.be.true;

            // calls with recording data
            expect(dispatch.args[0][0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.args[0][1]).to.deep.equal({
                coordinates: "TEST_DATA",
                rotation: 2
            });
            expect(commit.args[0][0]).to.equal("setLastCoordinates");
            expect(commit.args[0][1]).to.equal("TEST_DATA");

            // calls with event data
            expect(commit.args[1][0]).to.equal("setLastYaw");
            expect(commit.args[1][1]).to.equal(evt.detail.yaw);
        });
    });

    describe("onInitSuccess", () => {
        it("onInitSuccess shall dispatch twice", () => {
            actions.onInitSuccess({state, dispatch, commit, rootGetters, rootState});

            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.args[0][0]).to.equal("Maps/changeMarkerStyle");
            expect(dispatch.args[0][1]).to.deep.equal({
                markerId: "marker_point_layer",
                styleId: "defaultMapMarkerPoint"
            });
            expect(dispatch.args[1][0]).to.equal("addListener");
            expect(dispatch.args[2][0]).to.equal("setPosition");
            expect(dispatch.args[2][1]).to.deep.equal([1, 2]);
        });
    });

});
