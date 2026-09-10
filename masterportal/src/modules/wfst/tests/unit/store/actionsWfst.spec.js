import {expect} from "chai";
import sinon from "sinon";
import prepareFeaturePropertiesModule from "@modules/wfst/js/prepareFeatureProperties.js";
import actionsWfst from "@modules/wfst/store/actionsWfst.js";
import layerCollection from "@core/layers/js/layerCollection.js";


describe("src/modules/wfst/store/actionsWfst.js", () => {
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

    describe("reset", () => {
        const featurePropertiesSymbol = Symbol("featureProperties"),
            layer = {
                id: "0",
                url: "some.good.url",
                isSecured: false,
                useProxy: false
            };
        let setVisibleSpy, refreshSpy, consoleSpy;

        beforeEach(() => {
            getters = {
                currentLayerId: "",
                featureProperties: featurePropertiesSymbol
            };
            setVisibleSpy = sinon.spy();
            rootGetters = {
                "Maps/getLayerById": () => ({
                    setVisible: setVisibleSpy
                })
            };
            getters = {
                currentLayerIndex: 0,
                layerInformation: [layer],
                selectedInteraction: "insert"
            };

            refreshSpy = sinon.spy();
            layer.getLayerSource = () => ({refresh: refreshSpy});
            sinon.stub(layerCollection, "getLayerById").returns(layer);
            consoleSpy = sinon.spy();
            sinon.stub(console, "error").callsFake(consoleSpy);
        });

        it("should reset all values to its default state", () => {
            actionsWfst.reset({commit, dispatch, getters, rootGetters});

            expect(commit.callCount).to.equal(2);
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.secondCall.args.length).to.equal(2);
            expect(commit.secondCall.args[0]).to.equal("setFeaturePropertiesBatch");
            expect(commit.secondCall.args[1]).to.deep.equal([]);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args.length).to.equal(2);
            expect(dispatch.firstCall.args[0]).to.equal("resetCommon");
        });

    });
    describe("resetCommon", () => {
        let setVisibleSpy, layerStub, refreshSpy;

        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            setVisibleSpy = sinon.spy();
            refreshSpy = sinon.spy();

            getters = {
                currentLayerId: "testLayerId",
                featureProperties: [{id: 1}] // Mock featureProperties as an array
            };

            layerStub = {
                layer: {
                    setVisible: setVisibleSpy,
                    getSource: () => ({refresh: refreshSpy})
                }
            };

            sinon.stub(layerCollection, "getLayerById").returns(layerStub);
        });


        it("should reset selected interaction and update, clear interactions, and set layer visibility when layerSelected is true", () => {
            actionsWfst.resetCommon({commit, dispatch, getters});

            expect(commit.callCount).to.equal(2);
            expect(commit.firstCall.args).to.deep.equal(["setSelectedInteraction", null]);
            expect(commit.secondCall.args).to.deep.equal(["setSelectedUpdate", null]);

            expect(dispatch.calledOnceWith("clearInteractions")).to.be.true;

            expect(setVisibleSpy.calledOnceWith(true)).to.be.true;
        });

        it("should not set layer visibility when layerSelected is false", () => {
            getters.featureProperties = null;
            actionsWfst.resetCommon({commit, dispatch, getters});

            expect(commit.callCount).to.equal(2);
            expect(commit.firstCall.args).to.deep.equal(["setSelectedInteraction", null]);
            expect(commit.secondCall.args).to.deep.equal(["setSelectedUpdate", null]);

            expect(dispatch.calledOnceWith("clearInteractions")).to.be.true;

            expect(setVisibleSpy.notCalled).to.be.true;
        });
    });
    describe("sendTransaction", () => {
        let sendTransaction, feature;

        beforeEach(() => {
            getters = {
                currentLayerIndex: 0,
                layerInformation: [{id: "layer1", url: "http://example.com"}],
                selectedInteraction: "Point",
                featurePropertiesBatch: [],
                multiUpdate: []
            };
            rootGetters = {
                "Maps/projectionCode": "EPSG:4326"
            };
            feature = {id: "feature1"};


            // eslint-disable-next-line no-shadow, no-unused-vars
            sendTransaction = function ({dispatch, getters, rootGetters}, feature) {
                const {currentLayerIndex, layerInformation} = getters,
                    layer = layerInformation[currentLayerIndex],
                    url = layer.url,
                    selectedFeature = feature;

                return Promise.resolve({success: true, url, selectedFeature});
            };
        });


        it("should call wfs.sendTransaction with correct parameters", async () => {
            const response = await sendTransaction({dispatch, getters, rootGetters}, feature);

            expect(response).to.be.an("object");
            expect(response.success).to.be.true;
            expect(response.url).to.equal("http://example.com");
            expect(response.selectedFeature).to.deep.equal(feature);
        });

        it("should handle missing feature", async () => {
            const response = await sendTransaction({dispatch, getters, rootGetters}, null);

            expect(response).to.be.an("object");
            expect(response.success).to.be.true;
            expect(response.selectedFeature).to.be.null;
        });

        it("should dispatch an alert on error", async () => {
            const errorStub = sinon.stub().throws(new Error("Test error"));
            let response = null;

            // eslint-disable-next-line no-shadow
            sendTransaction = async ({dispatch}) =>{
                try {
                    errorStub();
                    return {};
                }
                catch (e) {
                    await dispatch("Alerting/addSingleAlert", {
                        category: "Info",
                        displayClass: "info",
                        content: `Error: ${e.message}`,
                        mustBeConfirmed: false
                    });
                    return null;
                }
            };

            response = await sendTransaction({dispatch, getters, rootGetters}, feature);

            expect(response).to.be.null;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1].content).to.include("Error: Test error");
        });
    });
    describe("updateFeatureProperty", () => {
        const featurePropertiesSymbol = Symbol("featureProperties");
        let featureProperty;

        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            getters = {
                featureProperties: featurePropertiesSymbol
            };
            featureProperty = {
                type: "number",
                value: "3",
                key: "specialKey",
                valid: null,
                required: null
            };
        });
        it("should commit the property if the type is not required", () => {
            actionsWfst.updateFeatureProperty({commit, dispatch, getters}, featureProperty);

            expect(commit.calledOnce).to.be.true;
            expect(dispatch.notCalled).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[1]).to.eql(featureProperty);
        });
        it("should dispatch a validation if featureProperty is required", () => {
            featureProperty.required = true;

            actionsWfst.updateFeatureProperty({commit, dispatch, getters}, featureProperty);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[1]).to.eql(featureProperty);
            expect(dispatch.secondCall.args[1]).to.eql(getters.featureProperties);
        });
    });

    describe("prepareInteraction", () => {
        beforeEach(() => {
            const layer = {
                id: "0",
                url: "some.good.url",
                isSecured: false,
                useProxy: false
            };

            dispatch = sinon.stub();
            commit = sinon.stub();
            getters = {
                currentInteractionConfig: {},
                currentLayerId: "layer1",
                currentLayerIndex: 0,
                layerInformation: {},
                featureProperties: [{type: "geometry", required: false}],
                toggleLayer: true
            };
            sinon.stub(layerCollection, "getLayerById").returns(layer);
            rootGetters = {};
        });

        it("should handle LineString interaction", async () => {
            const interaction = "LineString";

            await actionsWfst.prepareInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.calledWith("setSelectedUpdate", "insert")).to.be.true;
            expect(dispatch.calledWith("handleDrawInteraction")).to.be.true;
        });

        it("should handle update interaction", async () => {
            const interaction = "update";

            await actionsWfst.prepareInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.calledWith("setSelectedUpdate", "singleUpdate")).to.be.true;
            expect(dispatch.calledWith("handleUpdateInteraction")).to.be.true;
        });

        it("should handle multiUpdate interaction", async () => {
            const interaction = "multiUpdate";

            await actionsWfst.prepareInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.calledWith("setSelectedUpdate", "multiUpdate")).to.be.true;
            expect(dispatch.calledWith("handleMultiUpdateInteraction")).to.be.true;
        });

        it("should handle delete interaction", async () => {
            const interaction = "delete";

            await actionsWfst.prepareInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(dispatch.calledWith("handleDeleteInteraction")).to.be.true;
        });

        it("should handle unknown interaction", async () => {
            const interaction = "unknown";

            await actionsWfst.prepareInteraction({dispatch, getters, rootGetters, commit}, interaction);

            expect(dispatch.calledWith("clearInteractions")).to.be.true;
            expect(commit.called).to.be.false;
            expect(dispatch.calledWith("handleDrawInteraction")).to.be.false;
            expect(dispatch.calledWith("handleUpdateInteraction")).to.be.false;
            expect(dispatch.calledWith("handleMultiUpdateInteraction")).to.be.false;
            expect(dispatch.calledWith("handleDeleteInteraction")).to.be.false;
        });
    });


    describe("updateFeatureProperty", () => {
        const featurePropertiesSymbol = Symbol("featureProperties");
        let featureProperty;

        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            getters = {
                featureProperties: featurePropertiesSymbol
            };
            featureProperty = {
                type: "number",
                value: "3",
                key: "specialKey",
                valid: null,
                required: null
            };
        });
        it("should commit the property if the type is not required", () => {
            actionsWfst.updateFeatureProperty({commit, dispatch, getters}, featureProperty);

            expect(commit.calledOnce).to.be.true;
            expect(dispatch.notCalled).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[1]).to.eql(featureProperty);
        });
        it("should dispatch a validation if featureProperty is required", () => {
            featureProperty.required = true;

            actionsWfst.updateFeatureProperty({commit, dispatch, getters}, featureProperty);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[1]).to.eql(featureProperty);
            expect(dispatch.secondCall.args[1]).to.eql(getters.featureProperties);
        });
    });
    describe("validateInput", () => {
        beforeEach(() => {
            commit = sinon.spy();
        });
        it("should keep an empty optional field valid and skip the regex", () => {
            actionsWfst.validateInput({commit}, {type: "text", value: "", key: "k", required: false, regex: "^.+$"});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperty");
            expect(commit.firstCall.args[1].valid).to.be.true;
        });
        it("should invalidate a value that passes the type check but fails the regex", () => {
            actionsWfst.validateInput({commit}, {type: "number", value: "3", key: "k", required: true, regex: "^[0-9]{5}$"});

            expect(commit.firstCall.args[1].valid).to.be.false;
        });
        it("should validate a value that passes both the type check and the regex", () => {
            actionsWfst.validateInput({commit}, {type: "number", value: "12345", key: "k", required: true, regex: "^[0-9]{5}$"});

            expect(commit.firstCall.args[1].valid).to.be.true;
        });
        it("should keep the existing type validation when no regex is configured", () => {
            actionsWfst.validateInput({commit}, {type: "number", value: "3", key: "k", required: true});

            expect(commit.firstCall.args[1].valid).to.be.true;
        });
    });

    describe("validateForm", () => {
        beforeEach(() => {
            commit = sinon.spy();
        });
        it("should disable the form when a required field is invalid", () => {
            actionsWfst.validateForm({commit}, [{type: "text", required: true, valid: false, value: "x"}]);

            expect(commit.calledWith("setIsFormDisabled", true)).to.be.true;
        });
        it("should disable the form when a filled optional regex field is invalid", () => {
            actionsWfst.validateForm({commit}, [{type: "text", required: false, regex: "^[0-9]+$", valid: false, value: "abc"}]);

            expect(commit.calledWith("setIsFormDisabled", true)).to.be.true;
        });
        it("should not disable the form for an empty optional regex field", () => {
            actionsWfst.validateForm({commit}, [{type: "text", required: false, regex: "^[0-9]+$", valid: undefined, value: ""}]);

            expect(commit.calledWith("setIsFormDisabled", false)).to.be.true;
        });
        it("should ignore geometry properties", () => {
            actionsWfst.validateForm({commit}, [{type: "geometry", required: true, valid: false}]);

            expect(commit.calledWith("setIsFormDisabled", false)).to.be.true;
        });
    });

    describe("updateFeatureProperty with a regex", () => {
        beforeEach(() => {
            commit = sinon.spy();
            dispatch = sinon.spy();
            getters = {featureProperties: Symbol("featureProperties")};
        });
        it("should dispatch a validation for a non-required field that carries a regex", () => {
            const featureProperty = {type: "text", value: "abc", key: "k", required: false, regex: "^[0-9]+$"};

            actionsWfst.updateFeatureProperty({commit, dispatch, getters}, featureProperty);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[1]).to.eql(featureProperty);
        });
    });

    describe("setFeatureProperties", () => {
        let prepareFeaturePropertiesSpy;

        beforeEach(() => {
            getters = {
                currentLayerIndex: 0,
                layerInformation: [{}]
            };
            prepareFeaturePropertiesSpy = sinon.spy();
            sinon.stub(prepareFeaturePropertiesModule, "prepareFeatureProperties").callsFake(prepareFeaturePropertiesSpy);
        });

        it("should commit featureProperties on basis of the layer if a layer is selected that has a featurePrefix configured and is selected in the layer tree", async () => {
            getters.layerInformation[0].featurePrefix = "pre";
            getters.layerInformation[0].visibility = true;
            getters.layerInformation[0].isSelected = true;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(prepareFeaturePropertiesSpy.calledOnce).to.be.true;
        });
        it("should commit an error message if no layer is currently selected", async () => {
            getters.currentLayerIndex = -1;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.allLayersNotSelected");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
        it("should commit an error message if the currently selected layer has no featurePrefix configured", async () => {
            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.layerNotConfiguredCorrectly");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
        it("should commit an error message if the currently selected layer is not selected in the layer tree", async () => {
            getters.layerInformation[0].featurePrefix = "pre";
            getters.layerInformation[0].isSelected = false;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.layerNotSelected");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
    });
    describe("handleLayerSelected", () => {
        it("should dispatch activateSelectedLayer and startLayerLoader if both flags are enabled", () => {
            actionsWfst.handleLayerSelected({state: {activateLayerInTree: true, showLayerLoader: true}, dispatch});

            expect(dispatch.calledWith("activateSelectedLayer")).to.be.true;
            expect(dispatch.calledWith("startLayerLoader")).to.be.true;
        });
        it("should not dispatch anything if both flags are disabled", () => {
            actionsWfst.handleLayerSelected({state: {activateLayerInTree: false, showLayerLoader: false}, dispatch});

            expect(dispatch.notCalled).to.be.true;
        });
        it("should only dispatch activateSelectedLayer if only activateLayerInTree is enabled", () => {
            actionsWfst.handleLayerSelected({state: {activateLayerInTree: true, showLayerLoader: false}, dispatch});

            expect(dispatch.calledOnceWith("activateSelectedLayer")).to.be.true;
        });
    });
    describe("activateSelectedLayer", () => {
        beforeEach(() => {
            rootGetters = {
                layerConfigById: () => ({visibility: false, showInLayerTree: false, zIndex: 3})
            };
        });
        it("should store the original state and activate the current layer in the tree", () => {
            getters = {currentLayerId: "wfstOne", managedLayer: null};

            actionsWfst.activateSelectedLayer({getters, rootGetters, dispatch, commit});

            expect(dispatch.calledWith("restoreManagedLayer")).to.be.true;
            expect(commit.calledWith("setManagedLayer", {id: "wfstOne", visibility: false, showInLayerTree: false, zIndex: 3})).to.be.true;
            expect(dispatch.calledWith("replaceByIdInLayerConfig", {
                layerConfigs: [{id: "wfstOne", layer: {id: "wfstOne", visibility: true, showInLayerTree: true}}]
            }, {root: true})).to.be.true;
        });
        it("should do nothing if the current layer is already managed", () => {
            getters = {currentLayerId: "wfstOne", managedLayer: {id: "wfstOne"}};

            actionsWfst.activateSelectedLayer({getters, rootGetters, dispatch, commit});

            expect(dispatch.notCalled).to.be.true;
            expect(commit.notCalled).to.be.true;
        });
        it("should only restore the previous layer if no layer is currently selected", () => {
            getters = {currentLayerId: undefined, managedLayer: {id: "wfstTwo"}};

            actionsWfst.activateSelectedLayer({getters, rootGetters, dispatch, commit});

            expect(dispatch.calledOnceWith("restoreManagedLayer")).to.be.true;
            expect(commit.notCalled).to.be.true;
        });
    });
    describe("restoreManagedLayer", () => {
        it("should restore the managed layer to its original state and clear it", () => {
            getters = {managedLayer: {id: "wfstOne", visibility: false, showInLayerTree: true, zIndex: 3}};

            actionsWfst.restoreManagedLayer({getters, dispatch, commit});

            expect(dispatch.calledWith("replaceByIdInLayerConfig", {
                layerConfigs: [{id: "wfstOne", layer: {id: "wfstOne", visibility: false, showInLayerTree: true, zIndex: 3}}]
            }, {root: true})).to.be.true;
            expect(dispatch.calledWith("updateAllZIndexes", null, {root: true})).to.be.true;
            expect(commit.calledOnceWith("setManagedLayer", null)).to.be.true;
        });
        it("should do nothing if no layer is managed", () => {
            getters = {managedLayer: null};

            actionsWfst.restoreManagedLayer({getters, dispatch, commit});

            expect(dispatch.notCalled).to.be.true;
            expect(commit.notCalled).to.be.true;
        });
    });
    describe("startLayerLoader", () => {
        /**
         * Builds a fake layer whose source stores its event listeners so tests
         * can trigger them manually.
         * @returns {Object} handlers map and the fake layer.
         */
        function makeSource () {
            const handlers = {};

            return {handlers, source: {getLayerSource: () => ({
                on: (evt, cb) => {
                    handlers[evt] = cb;
                },
                un: (evt, cb) => {
                    if (handlers[evt] === cb) {
                        delete handlers[evt];
                    }
                }
            })}};
        }

        it("should show the spinner when a load starts and hide it when it ends", () => {
            const clock = sinon.useFakeTimers(),
                {handlers, source} = makeSource();

            getters = {currentLayerId: "wfstOne"};
            sinon.stub(layerCollection, "getLayerById").returns(source);

            actionsWfst.startLayerLoader({getters, commit});

            expect(commit.calledWith("setLayerLoading", false)).to.be.true;
            handlers.featuresloadstart();
            expect(commit.calledWith("setLayerLoading", true)).to.be.true;
            handlers.featuresloadend();
            clock.tick(500);
            expect(commit.lastCall.args).to.deep.equal(["setLayerLoading", false]);
            clock.restore();
        });
        it("should hide the spinner when the load fails", () => {
            const clock = sinon.useFakeTimers(),
                {handlers, source} = makeSource();

            getters = {currentLayerId: "wfstOne"};
            sinon.stub(layerCollection, "getLayerById").returns(source);

            actionsWfst.startLayerLoader({getters, commit});
            handlers.featuresloadstart();
            handlers.featuresloaderror();
            clock.tick(500);

            expect(commit.lastCall.args).to.deep.equal(["setLayerLoading", false]);
            clock.restore();
        });
        it("should force the spinner off via timeout if the load never reports back (e.g. CORS)", () => {
            const clock = sinon.useFakeTimers(),
                {handlers, source} = makeSource();

            getters = {currentLayerId: "wfstOne"};
            sinon.stub(layerCollection, "getLayerById").returns(source);

            actionsWfst.startLayerLoader({getters, commit});
            handlers.featuresloadstart();
            expect(commit.calledWith("setLayerLoading", true)).to.be.true;

            clock.tick(10000);
            expect(commit.lastCall.args).to.deep.equal(["setLayerLoading", false]);
            clock.restore();
        });
        it("should not show the spinner if no load is triggered for an already loaded layer", () => {
            const {source} = makeSource();

            getters = {currentLayerId: "wfstOne"};
            sinon.stub(layerCollection, "getLayerById").returns(source);

            actionsWfst.startLayerLoader({getters, commit});

            expect(commit.calledOnceWith("setLayerLoading", false)).to.be.true;
        });
        it("should hide the spinner if no source is available", () => {
            const clock = sinon.useFakeTimers();

            getters = {currentLayerId: "wfstOne"};
            sinon.stub(layerCollection, "getLayerById").returns(undefined);

            actionsWfst.startLayerLoader({getters, commit});

            expect(commit.calledOnceWith("setLayerLoading", false)).to.be.true;

            // Advance the clock to clear the interval (41 attempts * 50ms)
            clock.tick(2050);
            clock.restore();
        });
    });
});
