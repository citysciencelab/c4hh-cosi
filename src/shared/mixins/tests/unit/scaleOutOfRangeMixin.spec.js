import {expect} from "chai";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import scaleOutOfRangeMixin from "@shared/mixins/scaleOutOfRangeMixin.js";

describe.skip("scaleOutOfRangeMixin", () => {
    const containerName = "MrObject";
    let mixin, context, i18nArgs;

    beforeEach(() => {
        mixin = scaleOutOfRangeMixin(containerName);

        context = {
            [containerName]: {id: "1337-42", details: "arbitrary"},
            $t: sinon.stub().callsFake((key, args) => {
                i18nArgs = {key, args};
                return i18nArgs;
            }),
            scale: 5000,
            mode: "2D"
        };

        sinon.stub(rawLayerList, "getLayerWhere");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("computed#rawLayers", () => {
        it("returns found raw layers", () => {
            rawLayerList.getLayerWhere
                .withArgs({id: "1337"}).returns({id: "1337", stuff: "lots"})
                .withArgs({id: "42"}).returns({id: "42", stuff: "loads"});
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([{id: "1337", stuff: "lots"}, {id: "42", stuff: "loads"}]);
        });

        it("skips unknown layers", () => {
            rawLayerList.getLayerWhere
                .withArgs({id: "1337"}).returns(null)
                .withArgs({id: "42"}).returns({id: "42", stuff: "lots"});
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([{id: "42", stuff: "lots"}]);
        });

        it("returns an empty array if the container id is undefined", () => {
            context[containerName].id = undefined;
            expect(mixin.computed.rawLayers.call(context)).to.deep.equal([]);
        });
    });

    describe("computed#rawLayersScaleBoundaries", () => {
        it("returns overarching minScale and maxScale across layers", () => {
            context.rawLayers = [
                {minScale: "1000", maxScale: "8000"},
                {minScale: "5000", maxScale: "6000"},
                {minScale: "2000", maxScale: "10000"}
            ];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([1000, 10000]);
        });

        it("skips unparsable and/or missing values", () => {
            context.rawLayers = [
                {},
                {minScale: "NaN", maxScale: "5000"},
                {minScale: "500"},
                {},
                {maxScale: "and large fries with extra mayonnaise"},
                {minScale: "1000", maxScale: "10000"},
                {}
            ];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([500, 10000]);
        });

        it("returns [undefined, undefined] if no scales are available", () => {
            context.rawLayers = [{}, {}, {}];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([undefined, undefined]);
        });

        it("returns [undefined, undefined] if no layers are available", () => {
            context.rawLayers = [];
            expect(mixin.computed.rawLayersScaleBoundaries.call(context)).to.deep.equal([undefined, undefined]);
        });
    });

    describe("computed#tooltipText", () => {
        it("returns full tooltip when both minScale and maxScale are defined", () => {
            context.rawLayersScaleBoundaries = [1000, 10000];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "maxScale": "1: 10.000",
                        "minScale": "1: 1.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayer"
                }
            );
        });

        it("returns another tooltip if only maxScale is defined", () => {
            context.rawLayersScaleBoundaries = [undefined, 10000];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "maxScale": "1: 10.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayerMaxScale"
                }
            );
        });

        it("returns another tooltip if only minScale is defined", () => {
            context.rawLayersScaleBoundaries = [10000, undefined];
            mixin.computed.tooltipText.call(context);
            expect(i18nArgs).to.deep.equals(
                {
                    "args": {
                        "minScale": "1: 10.000"
                    },
                    "key": "common:modules.layerTree.invisibleLayerMinScale"
                }
            );
        });

        it("returns empty string if neither is defined", () => {
            context.rawLayersScaleBoundaries = [undefined, undefined];
            expect(mixin.computed.tooltipText.call(context)).to.equal("");
            expect(context.$t.called).to.be.false;
        });
    });

    describe("computed#scaleIsOutOfRange", () => {
        // it("returns false in 3D mode", () => {
        //     context.rawLayersScaleBoundaries = [0, 10];
        //     context.scale = 5000;
        //     context.mode = "3D";
        // context.rawLayers = [
        //     {minScale: "1000", maxScale: "8000"},
        //     {minScale: "5000", maxScale: "6000"},
        //     {minScale: "2000", maxScale: "10000"}
        // ];
        //     context.layerConfigById = sinon.stub();
        //     expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.false;
        // });

        it("returns true when the scale is too small", () => {
            context.rawLayersScaleBoundaries = [7500, 10000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "7500", maxScale: "10000"}
            ];
            context.layerConfigById = sinon.stub();
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        });

        it("returns true when the scale is too large", () => {
            context.rawLayersScaleBoundaries = [1000, 2500];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "1000", maxScale: "2500"}
            ];
            context.layerConfigById = sinon.stub();
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.true;
        });

        it("returns false when within range", () => {
            context.rawLayersScaleBoundaries = [1000, 10000];
            context.scale = 5000;
            context.rawLayers = [
                {minScale: "1000", maxScale: "10000"}
            ];
            context.layerConfigById = sinon.stub();
            expect(mixin.computed.scaleIsOutOfRange.call(context)).to.be.false;
        });
    });

    // it("test method scaleIsOutOfRange, isLayerTree = false", () => {
    //     isLayerTree = false;
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.false;
    // });
    // it("test method scaleIsOutOfRange, isLayerTree = true, conf.maxScale not set", () => {
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.false;
    // });
    // it("test method scaleIsOutOfRange, isLayerTree = true, conf.maxScale is set, is in scale", () => {
    //     layer.maxScale = "100000";
    //     layer.minScale = "0";
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.false;
    // });
    // it("test method scaleIsOutOfRange, isLayerTree = true, conf.maxScale is set, is not in scale", () => {
    //     layer.maxScale = "10000";
    //     layer.minScale = "0";
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.true;
    // });
    // it("test method scaleIsOutOfRange, isLayerTree = true, conf.maxScale is set, is mapMode = 3D, is layer visible, is not in scale", () => {
    //     store = createStore({
    //         modules: {
    //             Modules: {
    //                 namespaced: true,
    //                 modules: {
    //                     namespaced: true,
    //                     LayerComponent
    //                 }
    //             },
    //             Maps: {
    //                 namespaced: true,
    //                 getters: {
    //                     mode: () => "3D",
    //                     scale: () => 20000,
    //                     scales: () => [500, 1000, 10000, 20000, 100000]
    //                 }
    //             }
    //         },
    //         mutations: {
    //             replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy
    //         }
    //     });
    //     layer.maxScale = "10000";
    //     layer.minScale = "0";
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.true;
    // });
    // it("test method scaleIsOutOfRange, isLayerTree = true, conf.maxScale is set, is mapMode = 3D, is layer visible, is in scale", () => {
    //     layer.maxScale = "100000";
    //     layer.minScale = "0";
    //     wrapper = shallowMount(LayerComponent, {
    //         global: {
    //             plugins: [store]
    //         },
    //         propsData
    //     });

    //     const scaleIsOutOfRange = wrapper.vm.scaleIsOutOfRange();

    //     expect(scaleIsOutOfRange).to.be.false;
    // });
});
