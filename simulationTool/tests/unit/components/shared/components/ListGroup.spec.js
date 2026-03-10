import {config, mount, shallowMount} from "@vue/test-utils";
import {nextTick} from "vue";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import ListGroup from "../../../../../components/shared/components/ListGroup.vue";

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
                created: true
            })
        ],
        featuresMore = [
            new Feature({
                id: "one",
                height: "100",
                geometry: "",
                width: "100",
                cool: true,
                hot: false
            }),
            new Feature({
                id: "two",
                height: "200",
                geometry: "",
                width: "200",
                cool: true,
                hot: false
            })
        ];

    features.forEach(feature => {
        feature.setId(feature.get("id"));
    });

    featuresMore.forEach(feature => {
        feature.setId(feature.get("id"));
    });

    describe("Component DOM", () => {
        it("should exist", function () {
            const wrapper = factory.getShallowMount({itemList: features, propertiesMapping: {cool: "Super cool"}, itemSchema: {properties: {cool: {type: "string"}}}});

            expect(wrapper.exists()).to.be.true;
        });

        it("should render four input elements", async function () {
            const wrapper = factory.getShallowMount({
                itemList: features,
                shownProperties: ["height", "id"],
                propertiesMapping: {height: "Höhe"},
                itemSchema: {properties: {id: {type: "string"}, height: {type: "string"}}}
            });

            await nextTick();

            expect(wrapper.findAll("input")).to.be.lengthOf(4);
        });

        it("should render input elements with shownProperties", async function () {
            const wrapper = factory.getShallowMount({
                itemList: featuresMore,
                shownProperties: ["width"],
                propertiesMapping: {width: "Höhe"},
                itemSchema: {properties: {width: {type: "string"}}}
            });

            await nextTick();

            expect(wrapper.findAll("input")).to.be.lengthOf(2);
        });

        it("should render two button elements", async function () {
            const wrapper = factory.getShallowMount({
                itemList: featuresMore,
                shownProperties: ["width"],
                itemSchema: {properties: {width: {type: "string"}}},
                propertiesMapping: {height: "Höhe", width: "Breite", id: "Id"}
            });

            await nextTick();

            expect(wrapper.findAll("button")).to.be.lengthOf(2);
        });

        it("should render four icon button components", async function () {
            const wrapper = factory.getShallowMount({
                itemList: features,
                shownProperties: ["height", "id"],
                propertiesMapping: {height: "Höhe"},
                itemSchema: {properties: {id: {type: "string"}, height: {type: "string"}}}
            });

            await nextTick();

            expect(wrapper.findAllComponents({name: "IconButton"})).to.be.lengthOf(4);
        });

        it("should render label and input for attribute 'cool'", async function () {
            const wrapper = factory.getShallowMount({
                itemList: featuresMore,
                shownProperties: ["cool", "width"],
                propertiesMapping: {cool: "Super cool", height: "Höhe", width: "Breite"},
                itemSchema: {properties: {cool: {type: "string"}}}
            });

            await nextTick();
            expect(wrapper.find("label[for='property--cool-0-one']").exists()).to.be.true;
            expect(wrapper.find("input[id='property--cool-0-one']").exists()).to.be.true;
        });
    });

    describe("Computed", () => {
        it("should set 'hasMultipleProperties' to false ", function () {
            const wrapper = factory.getShallowMount({itemList: features, propertiesMapping: {height: "Höhe"}});

            expect(wrapper.vm.hasMultipleProperties).to.be.false;
        });

        it("should set 'hasMultipleProperties' to true ", function () {
            const wrapper = factory.getShallowMount({itemList: featuresMore, propertiesMapping: {cool: "Super cool", height: "Höhe", width: "Breite"}});

            expect(wrapper.vm.hasMultipleProperties).to.be.true;
        });

        it("should get original item list ", function () {
            const wrapper = factory.getShallowMount({
                itemList: featuresMore,
                sortBy: "",
                shownProperties: ["cool", "width"],
                propertiesMapping: {cool: "Super cool", height: "Höhe", width: "Breite"},
                itemSchema: {properties: {cool: {type: "string"}}}
            });

            expect(wrapper.vm.sortedItemList).to.deep.equal(featuresMore);
        });

        it("should get sorted item list ", function () {
            const reversedFeature = [
                    new Feature({
                        id: "two",
                        height: "200",
                        geometry: "",
                        width: "200",
                        cool: true
                    }),
                    new Feature({
                        id: "one",
                        height: "100",
                        geometry: "",
                        width: "100",
                        cool: true
                    })
                ],
                wrapper = factory.getShallowMount({itemList: reversedFeature, sortBy: "height",
                    shownProperties: ["height"],
                    propertiesMapping: {cool: "Super cool", height: "Höhe", width: "Breite"},
                    itemSchema: {properties: {height: {type: "string"}, cool: {type: "string"}, width: {type: "string"}}}
                });

            expect(wrapper.vm.sortedItemList[0].get("height")).to.equal("100");
        });
    });

    describe("User Intactions", () => {
        it("should emit 'setFeatureAttribute' with the right values on blur", async function () {
            const wrapper = factory.getMount({
                itemList: features,
                propertiesMapping: {id: "Id"},
                shownProperties: ["id"],
                itemSchema: {properties: {id: {type: "string"}}}
            });

            await nextTick();

            await wrapper.find("input").setValue("1000");
            // Commit the buffered edit via blur (or alternatively trigger Enter key)
            await wrapper.find("input").trigger("blur");
            await nextTick();

            expect(wrapper.emitted()).to.have.property("setFeatureAttribute");
            expect(wrapper.emitted().setFeatureAttribute[0]).to.deep.equal(["1000", "id", "one"]);
        });

        it("should emit 'setFeatureAttribute' with the right values on Enter", async function () {
            const wrapper = factory.getMount({
                itemList: features,
                propertiesMapping: {id: "Id"},
                shownProperties: ["id"],
                itemSchema: {properties: {id: {type: "string"}}}
            });

            await nextTick();

            await wrapper.find("input").setValue("1000");
            // Commit the buffered edit via Enter key
            await wrapper.find("input").trigger("keydown.enter");
            await nextTick();

            expect(wrapper.emitted()).to.have.property("setFeatureAttribute");
            expect(wrapper.emitted().setFeatureAttribute[0]).to.deep.equal(["1000", "id", "one"]);
        });


        it.skip("should emit 'removeFeature' with the right values", async function () {
            const wrapper = factory.getMount({
                itemList: features,
                propertiesMapping: {id: "Id"},
                shownProperties: ["id"],
                itemSchema: {properties: {id: {type: "string"}}}
            });

            await nextTick();

            await wrapper.find(".bi-trash").trigger("click");

            expect(wrapper.emitted()).to.have.property("removeFeature");
            expect(wrapper.emitted().removeFeature[0]).to.deep.equal(["one"]);
        });
    });

    describe("Methods", () => {
        describe("getIcon", () => {
            it("should return the right icon if feature is visible", function () {
                const wrapper = factory.getShallowMount({
                    itemList: features,
                    propertiesMapping: {id: "Id"},
                    shownProperties: ["id"],
                    itemSchema: {properties: {id: {type: "string"}}}
                });

                features[0].setStyle(null);
                expect(wrapper.vm.getIcon(features[0])).to.be.equal("bi-eye");
            });

            it("should return the right icon if feature is not visible", function () {
                const wrapper = factory.getShallowMount({
                        itemList: features,
                        propertiesMapping: {id: "Id"},
                        shownProperties: ["id"],
                        itemSchema: {properties: {id: {type: "string"}}}
                    }),
                    icon = wrapper.vm.getIcon(false);

                expect(icon).to.be.equal("bi-eye-slash");
            });
        });

        describe("getShownProperties", () => {
            it("should return undefined if there are no shownProperties as props", function () {
                const wrapper = factory.getShallowMount({
                    itemList: features,
                    propertiesMapping: {id: "Id"},
                    shownProperties: ["id"],
                    itemSchema: {properties: {id: {type: "string"}}}
                });

                expect(wrapper.vm.getShownProperties(featuresMore, [])).to.equal(undefined);
            });

            it("should return undefined if there are no found properties", function () {
                const wrapper = factory.getShallowMount({
                    itemList: features,
                    propertiesMapping: {id: "Id"},
                    shownProperties: ["id"],
                    itemSchema: {properties: {id: {type: "string"}}}
                });

                expect(wrapper.vm.getShownProperties(featuresMore[0], ["name"])).to.equal(undefined);
            });

            it("should return found feature properties", function () {
                const wrapper = factory.getShallowMount({
                    itemList: features,
                    propertiesMapping: {id: "Id"},
                    shownProperties: ["id"],
                    itemSchema: {properties: {id: {type: "string"}}}
                });

                expect(wrapper.vm.getShownProperties(featuresMore[0], ["height"])).to.deep.equal({height: "100"});
            });
        });


        describe("setCurrentFeature", () => {
            it("should set the given feature as current feature", function () {
                const feature = new Feature({
                        id: "thousand",
                        height: "100",
                        geometry: "",
                        created: false,
                        fid: "1000Mark"
                    }),
                    wrapper = factory.getShallowMount({
                        itemList: featuresMore,
                        propertiesMapping: {id: "Id"},
                        shownProperties: ["id"],
                        itemSchema: {properties: {id: {type: "string"}}}
                    });

                feature.setId("thousand");
                wrapper.vm.setCurrentFeature(feature);
                expect(wrapper.vm.currentFeature).to.deep.equal(feature);
            });

            it("should set the current feature to undefined", function () {
                const feature = new Feature({
                        id: "thousand",
                        height: "100",
                        geometry: "",
                        created: false,
                        fid: "1000Mark"
                    }),
                    wrapper = factory.getShallowMount({
                        itemList: featuresMore,
                        propertiesMapping: {id: "Id"},
                        shownProperties: ["id"],
                        itemSchema: {properties: {id: {type: "string"}}}
                    });

                wrapper.vm.setCurrentFeature(feature);
                expect(wrapper.vm.currentFeature).to.be.undefined;
            });
        });
    });
});
