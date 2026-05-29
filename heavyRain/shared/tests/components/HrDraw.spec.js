import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import GeoJSON from "ol/format/GeoJSON.js";
import HrDraw from "../../components/HrDraw.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrDraw.vue", () => {
    let store,
        source,
        layer,
        geojsonFeature,
        getLayerByIdStub,
        addLayerStub,
        addInteractionStub,
        createLayerStub,
        createModifyInteractionStub,
        removeInteractionStub,
        writeFeatureObjectStub;

    beforeEach(() => {
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub()
                    }
                }
            }
        });
        source = {
            clear: sinon.stub(),
            addFeature: sinon.stub(),
            getFeatures: sinon.stub()
        };
        layer = {
            getLayerSource: sinon.stub().returns(source)
        };
        geojsonFeature = {
            type: "Feature",
            geometry: {
                type: "Polygon"
            },
            properties: null
        };

        getLayerByIdStub = sinon.stub(layerCollection, "getLayerById").returns(layer);
        addLayerStub = sinon.stub(layerCollection, "addLayer");
        addInteractionStub = sinon.stub(HrDraw.methods, "addInteraction");
        createLayerStub = sinon.stub(layerFactory, "createLayer").returns(layer);
        writeFeatureObjectStub = sinon.stub(GeoJSON.prototype, "writeFeatureObject").returns(geojsonFeature);
        removeInteractionStub = sinon.stub(HrDraw.methods, "removeInteraction");
        createModifyInteractionStub = sinon.stub(modifyInteraction, "createModifyInteraction");
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render DrawTypes in the template", () => {
            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            expect(wrapper.findComponent({name: "DrawTypes"}).exists()).to.be.true;
        });

        it("should render a delete IconButton in the template", () => {
            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            expect(wrapper.findAllComponents({name: "IconButton"})).to.be.lengthOf(1);
            expect(wrapper.findAllComponents({name: "IconButton"}).at(0).vm.label).to.equal("common:modules.draw_old.attributeSelect.remove");
        });

        it("should render an edit IconButton in the template", async () => {
            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            await wrapper.setData({source: {
                clear: sinon.stub(),
                getFeatures: () => ["1"]
            }});

            expect(wrapper.findAllComponents({name: "IconButton"})).to.be.lengthOf(2);
            expect(wrapper.findAllComponents({name: "IconButton"}).at(1).vm.label).to.equal("additional:modules.updateRequirements.geometryEdit");
        });
    });

    describe("Hook", () => {
        it("should create a new layer and assign its source in created", () => {
            getLayerByIdStub.returns(undefined);

            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            expect(getLayerByIdStub.calledOnceWith("heavy-rain-draw")).to.be.true;
            expect(createLayerStub.calledOnce).to.be.true;
            expect(createLayerStub.firstCall.args[0]).to.deep.equal({
                typ: "VECTORBASE",
                id: "heavy-rain-draw",
                name: "heavy-rain-draw",
                alwaysOnTop: true
            });
            expect(addLayerStub.calledOnceWith(layer)).to.be.true;
            expect(wrapper.vm.source).to.deep.equal(source);
        });
    });

    describe("methods", () => {
        describe("clearDrawnFeature", () => {
            it("should clear the source and emit null", () => {
                const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.clearDrawnFeature();

                expect(source.clear.calledOnce).to.be.true;
                expect(wrapper.emitted("update:drawn-geojson-feature")).to.deep.equal([[null]]);
            });
        });

        describe("editSource", () => {
            it("should trigger some interaction function if the current interaction is null", () => {
                const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.editSource();

                expect(wrapper.vm.selectedDrawType).to.equal("");
                expect(wrapper.vm.selectedDrawTypeMain).to.equal("");
                expect(wrapper.vm.selectedInteraction).to.equal("");
                expect(addInteractionStub.calledOnce).to.be.true;
                expect(createModifyInteractionStub.calledOnce).to.be.true;
                expect(removeInteractionStub.calledOnce).to.be.true;
            });

            it("should trigger removeInteraction function and set current intraction into null if the current interaction is not null", async () => {
                const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                await wrapper.setData({currentModifyInteraction: {}});

                wrapper.vm.editSource();

                expect(wrapper.vm.currentModifyInteraction).to.equal(null);
                expect(removeInteractionStub.calledOnce).to.be.true;
            });
        });

        describe("onDrawEnd", () => {
            it("should emit a GeoJSON object", () => {
                const feature = {id: "feature-1"},
                    wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.onDrawEnd({"feature": feature});

                expect(writeFeatureObjectStub.calledOnceWith(feature)).to.be.true;
                expect(wrapper.emitted("update:drawn-geojson-feature")).to.deep.equal([[geojsonFeature]]);
            });
        });

        describe("getLayerSource", () => {
            it("should create a new layer if none exists", () => {
                const context = {};

                getLayerByIdStub.returns(undefined);

                const result = HrDraw.methods.getLayerSource.call(context);

                expect(addLayerStub.calledOnceWith(layer)).to.be.true;
                expect(result).to.equal(source);
            });

            it("should reuse an existing layer if one already exists", () => {
                const context = {};

                const result = HrDraw.methods.getLayerSource.call(context);

                expect(createLayerStub.notCalled).to.be.true;
                expect(addLayerStub.notCalled).to.be.true;
                expect(result).to.equal(source);
            });
        });

        describe("resetAll", () => {
            it("should reset all the data and source", () => {
                const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.resetAll();

                expect(source.clear.calledOnce).to.be.true;
                expect(wrapper.vm.currentModifyInteraction).to.equal(null);
                expect(removeInteractionStub.calledOnce).to.be.true;
            });
        });
    });
});
