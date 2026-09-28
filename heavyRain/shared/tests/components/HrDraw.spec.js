import Circle from "ol/geom/Circle.js";
import {createStore} from "vuex";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import HrDraw from "../../components/HrDraw.vue";
import {isReactive} from "vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import Polygon from "ol/geom/Polygon.js";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";


describe("addons/heavyRain/shared/components/HrDraw.vue", () => {
    let store,
        source,
        layer,
        getLayerByIdStub,
        addLayerStub,
        addInteractionStub,
        createLayerStub,
        createModifyInteractionStub,
        removeInteractionStub;

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
        getLayerByIdStub = sinon.stub(layerCollection, "getLayerById").withArgs("heavy-rain-draw").returns(layer);
        addLayerStub = sinon.stub(layerCollection, "addLayer");
        addInteractionStub = sinon.stub(HrDraw.methods, "addInteraction");
        createLayerStub = sinon.stub(layerFactory, "createLayer").returns(layer);
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
                alwaysOnTop: true,
                dontInitStyle: true
            });
            expect(addLayerStub.calledOnceWith(layer)).to.be.true;
            expect(wrapper.vm.source).to.deep.equal(source);
        });

        it("should clear the drawn features in unmounted, as the layer is kept in the layer collection", () => {
            const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

            wrapper.unmount();

            expect(source.clear.calledOnce).to.be.true;
            expect(removeInteractionStub.calledOnce).to.be.true;
        });

        it("should add a copy of the geometry of an edited feature to the draw layer in created", () => {
            const geometry = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);

            shallowMount(HrDraw, {global: {plugins: [store]}, props: {geometry, strokeColor: [213, 94, 0]}});

            const feature = source.addFeature.firstCall.args[0];

            expect(source.addFeature.calledOnce).to.be.true;
            expect(feature.getId()).to.equal("drawn-feature");
            expect(feature.getGeometry()).to.not.equal(geometry);
            expect(feature.getGeometry().getCoordinates()).to.deep.equal(geometry.getCoordinates());
            expect(feature.getStyle().getStroke().getColor()).to.deep.equal([213, 94, 0]);
        });

        it("should not add a feature to the draw layer if no geometry is given", () => {
            shallowMount(HrDraw, {global: {plugins: [store]}});

            expect(source.addFeature.notCalled).to.be.true;
        });
    });

    describe("methods", () => {
        describe("clearDrawnFeature", () => {
            it("should clear the source and emit null", () => {
                const wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.clearDrawnFeature();

                expect(source.clear.calledOnce).to.be.true;
                expect(wrapper.emitted("update:drawn-geometry")).to.deep.equal([[null]]);
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
            it("should add the feature to the source and emit a copy of its geometry", () => {
                const feature = new Feature(new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]])),
                    wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.onDrawEnd({feature});

                const emittedGeometry = wrapper.emitted("update:drawn-geometry")[0][0];

                expect(source.addFeature.calledOnceWith(feature)).to.be.true;
                expect(emittedGeometry.getType()).to.equal("Polygon");
                expect(emittedGeometry.getCoordinates()).to.deep.equal([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
                expect(emittedGeometry).to.not.equal(feature.getGeometry());
                expect(isReactive(emittedGeometry)).to.be.false;
            });

            it("should convert a drawn circle to a polygon", () => {
                const feature = new Feature(new Circle([0, 0], 10)),
                    wrapper = shallowMount(HrDraw, {global: {plugins: [store]}});

                wrapper.vm.onDrawEnd({feature});

                expect(feature.getGeometry().getType()).to.equal("Polygon");
                expect(wrapper.emitted("update:drawn-geometry")[0][0].getType()).to.equal("Polygon");
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
