import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import GeoJSON from "ol/format/GeoJSON.js";
import HrDraw from "../../components/HrDraw.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrDraw.vue", () => {
    let source,
        layer,
        geojsonFeature,
        getLayerByIdStub,
        addLayerStub,
        createLayerStub,
        writeFeatureObjectStub;

    beforeEach(() => {
        source = {
            clear: sinon.stub()
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
        createLayerStub = sinon.stub(layerFactory, "createLayer").returns(layer);
        writeFeatureObjectStub = sinon.stub(GeoJSON.prototype, "writeFeatureObject").returns(geojsonFeature);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrDraw);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render DrawTypes in the template", () => {
            const wrapper = shallowMount(HrDraw);

            expect(wrapper.findComponent({name: "DrawTypes"}).exists()).to.be.true;
        });
    });

    describe("Hook", () => {
        it("should create a new layer and assign its source in created", () => {
            getLayerByIdStub.returns(undefined);

            const wrapper = shallowMount(HrDraw);

            expect(getLayerByIdStub.calledOnceWith("heavy-rain-draw")).to.be.true;
            expect(createLayerStub.calledOnce).to.be.true;
            expect(createLayerStub.firstCall.args[0]).to.deep.equal({
                typ: "VECTORBASE",
                id: "heavy-rain-draw",
                name: "heavy-rain-draw",
                alwaysOnTop: true
            });
            expect(addLayerStub.calledOnceWith(layer)).to.be.true;
            expect(wrapper.vm.source).to.equal(source);
        });
    });

    describe("methods", () => {
        describe("clearDrawnFeature", () => {
            it("should clear the source and emit null", () => {
                const wrapper = shallowMount(HrDraw);

                wrapper.vm.clearDrawnFeature();

                expect(source.clear.calledOnce).to.be.true;
                expect(wrapper.emitted("update:drawn-geojson-feature")).to.deep.equal([[null]]);
            });
        });

        describe("onDrawEnd", () => {
            it("should emit a GeoJSON object", () => {
                const feature = {id: "feature-1"},
                    wrapper = shallowMount(HrDraw);

                wrapper.vm.onDrawEnd({feature});

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
    });
});
