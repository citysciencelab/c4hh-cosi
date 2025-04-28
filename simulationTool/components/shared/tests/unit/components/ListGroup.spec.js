import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature";
import ListGroup from "../../../components/ListGroup.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/shared/components/ListGroup.vue", () => {

    const factory = {
            getShallowMount: (props = {}) => {
                return shallowMount(ListGroup, {
                    propsData: {
                        ...props
                    }
                });
            },
            getMount: (props = {}) => {
                return mount(ListGroup, {
                    propsData: {
                        ...props
                    }
                });
            }
        },
        features = [
            new Feature({
                id: "one",
                height: "100",
                geometry: "",
                created: false
            }),
            new Feature({
                id: "two",
                height: "200",
                geometry: ""
            })
        ],
        featuresMore = [
            new Feature({
                id: "one",
                height: "100",
                geometry: "",
                width: "100",
                cool: true
            }),
            new Feature({
                id: "two",
                height: "200",
                geometry: "",
                width: "200",
                cool: true
            })
        ];

    describe("Component DOM", () => {
        it("should exist", function () {
            const wrapper = factory.getShallowMount({itemList: features});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render four input elements", function () {
            const wrapper = factory.getShallowMount({itemList: features}),
                inputWrapperArray = wrapper.findAll("input");

            expect(inputWrapperArray).to.be.lengthOf(4);
        });

        it("should not render input elements", function () {
            const wrapper = factory.getShallowMount({itemList: featuresMore}),
                inputWrapperArray = wrapper.findAll("input");

            expect(inputWrapperArray).to.be.lengthOf(0);
        });

        it("should render input elements with shownProperties", function () {
            const wrapper = factory.getShallowMount({itemList: featuresMore, shownProperties: ["width"]}),
                inputWrapperArray = wrapper.findAll("input");

            expect(inputWrapperArray).to.be.lengthOf(2);
        });

        it("should render two button elements", function () {
            const wrapper = factory.getShallowMount({itemList: featuresMore}),
                inputWrapperArray = wrapper.findAll("button");

            expect(inputWrapperArray).to.be.lengthOf(2);
        });

        it("should render four icon button components", function () {
            const wrapper = factory.getShallowMount({itemList: features}),
                iconButtonWrapperArray = wrapper.findAllComponents({name: "IconButton"});

            expect(iconButtonWrapperArray).to.be.lengthOf(4);
        });
    });

    describe("Computed", () => {
        it("should set 'hasMultipleProperties' to false ", function () {
            const wrapper = factory.getShallowMount({itemList: features});

            expect(wrapper.vm.hasMultipleProperties).to.be.false;
        });

        it("should set 'hasMultipleProperties' to true ", function () {
            const wrapper = factory.getShallowMount({itemList: featuresMore});

            expect(wrapper.vm.hasMultipleProperties).to.be.true;
        });
    });

    describe("User Intactions", () => {
        it("should emit 'setFeatureAttribute' with the right values", async function () {
            const wrapper = factory.getMount({itemList: features}),
                inputWrapper = wrapper.find("input");

            await inputWrapper.setValue("1000");

            expect(wrapper.emitted()).to.have.property("setFeatureAttribute");
            expect(wrapper.emitted().setFeatureAttribute[0]).to.deep.equal(["1000", "id", undefined]);
        });


        it("should emit 'removeFeature' with the right values", async function () {
            const wrapper = factory.getMount({itemList: features}),
                buttonWrapper = wrapper.find(".bi-trash");

            await buttonWrapper.trigger("click");

            expect(wrapper.emitted()).to.have.property("removeFeature");
            expect(wrapper.emitted().removeFeature[0]).to.deep.equal([undefined]);
        });
    });

    describe("Methods", () => {
        describe("getIcon", () => {
            it("should return the right icon if feature is visible", function () {
                const wrapper = factory.getShallowMount({itemList: features});

                features[0].setStyle(null);
                expect(wrapper.vm.getIcon(features[0])).to.be.equal("bi-eye");
            });

            it("should return the right icon wif feature is not visible", function () {
                const wrapper = factory.getShallowMount({itemList: features}),
                    icon = wrapper.vm.getIcon(false);

                expect(icon).to.be.equal("bi-eye-slash");
            });
        });

        describe("getShownProperties", () => {
            it("should return undefined if there are no shownProperties as props", function () {
                const wrapper = factory.getShallowMount({itemList: featuresMore});

                expect(wrapper.vm.getShownProperties(featuresMore, [])).to.equal(undefined);
            });

            it("should return undefined if there are no found properties", function () {
                const wrapper = factory.getShallowMount({itemList: featuresMore});

                expect(wrapper.vm.getShownProperties(featuresMore[0], ["name"])).to.equal(undefined);
            });

            it("should return found feature properties", function () {
                const wrapper = factory.getShallowMount({itemList: featuresMore});

                expect(wrapper.vm.getShownProperties(featuresMore[0], ["height"])).to.deep.equal({height: "100"});
            });
        });

        describe("extractedProperties", () => {
            it("should return feature properties without the geometry", function () {
                const feature = new Feature({
                        id: "one",
                        height: "100",
                        geometry: "",
                        created: false
                    }),
                    wrapper = factory.getShallowMount({itemList: [feature]}),
                    properties = wrapper.vm.extractedProperties(feature);

                expect(properties).to.deep.equal({id: "one", height: "100"});
            });
        });
    });
});
