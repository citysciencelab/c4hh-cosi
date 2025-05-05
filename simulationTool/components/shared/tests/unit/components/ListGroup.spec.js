import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature";
import ListGroup from "../../../components/ListGroup.vue";
import Style from "ol/style/Style.js";

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
                geometry: ""
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
                width: "100"
            }),
            new Feature({
                id: "two",
                height: "200",
                geometry: "",
                width: "200"
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

        it("should emit 'setFeatureStyle' with the right values", async function () {
            const wrapper = factory.getMount({itemList: features}),
                buttonWrapper = wrapper.find(".bi-eye");

            await buttonWrapper.trigger("click");

            expect(wrapper.emitted()).to.have.property("setFeatureStyle");
            expect(wrapper.emitted().setFeatureStyle[0]).to.deep.equal([new Style(), undefined]);
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
                const wrapper = factory.getShallowMount({itemList: features}),
                    icon = wrapper.vm.getIcon(features[0]);

                expect(icon).to.be.equal("bi-eye");
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

        describe("propertiesWithoutGeometry", () => {
            it("should return feature properties without the geometry", function () {
                const wrapper = factory.getShallowMount({itemList: features}),
                    properties = wrapper.vm.propertiesWithoutGeometry(features[0]);

                expect(properties).to.deep.equal({id: "one", height: "100"});
            });
        });

        describe("setComma", () => {
            it("should return the same given parameter, if the given parameter is not a number", function () {
                const wrapper = factory.getShallowMount({itemList: features});

                expect(wrapper.vm.setComma("123")).to.equal("123");
                expect(wrapper.vm.setComma(undefined)).to.equal(undefined);
                expect(wrapper.vm.setComma(null)).to.equal(null);
            });
            it("should return the given Number as string with comma instead point", function () {
                const wrapper = factory.getShallowMount({itemList: features}),
                    ret = wrapper.vm.setComma(12.12);

                expect(ret).to.equal("12,12");
            });
        });
    });
});
