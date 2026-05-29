// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
// import DistrictSelectorFilter from "../../../components/DistrictSelectorFilter.vue";
// import Vuetify from "vuetify";
import sinon from "sinon";
// import Vue from "vue";
import Layer from "ol/layer/Vector.js";
import Source from "ol/source/Vector.js";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// Vue.use(Vuetify);

describe.skip("addons/cosi/DistrictSelector/components/DistrictSelectorFilter.vue", () => {
    let vuetify;

    const layerOne = new Layer({id: "123", source: new Source()}),
        layerTwo = new Layer({id: "456", source: new Source()}),
        layerThree = new Layer({id: "789", source: new Source()}),
        districtLevels = [
            {layerId: "123", label: "Stube", stats: {}, districts: [], nameList: [], layer: layerOne, selectedValues: []},
            {layer: layerTwo, layerId: "456", label: "Kueche", selectedValues: ["Ofen", "Kuehlschrank"]},
            {layer: layerThree, layerId: "789", label: "Badezimmer", stats: {}, selectedValues: []}
        ],
        DistrictSelectorFilter = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictSelectorFilter, {
                    // localVue,
                    vuetify,
                    propsData: {
                        districtLevels: districtLevels,
                        selectedLevelId: "123"
                    },
                    data () {
                        return {
                            ...values
                        };
                    }
                });
            }
        };


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
            wrapper.destroy();
        });

        it("should find two label elements with the correct text", () => {
            const wrapper = factory.getShallowMount(),
                labelElements = wrapper.findAll("label");

            expect(labelElements.wrappers).to.be.an("array").to.have.lengthOf(2);
            expect(labelElements.at(0).text()).to.be.equal("Kueche");
            expect(labelElements.at(1).text()).to.be.equal("Stube");
            wrapper.destroy();
        });

        it("should find two vuetify auto complete components", () => {
            const wrapper = factory.getShallowMount(),
                labelElements = wrapper.findAllComponents("v-autocomplete-stub");

            expect(labelElements.wrappers).to.be.an("array").to.have.lengthOf(2);
            wrapper.destroy();
        });
    });

    describe("Computed Properties", () => {
        it("should set the value for 'levelsForFilter' correct (reverse)", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.levelsForFilter).to.be.an("array").to.have.lengthOf(2);
            expect(wrapper.vm.levelsForFilter).to.deep.equal([districtLevels[1], districtLevels[0]]);
            wrapper.destroy();
        });
        it("should update 'levelsForFilter' if 'selectedLevelId' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setProps({
                selectedLevelId: "456"
            });
            expect(wrapper.vm.levelsForFilter).to.be.an("array").to.have.lengthOf(1);
            expect(wrapper.vm.levelsForFilter).to.deep.equal([districtLevels[1]]);
            wrapper.destroy();
        });

    });

    describe("Watchers", () => {
        it("should not update the selected values of the lowest level", async () => {
            const wrapper = factory.getShallowMount(),
                lowestLevel = wrapper.vm.levelsForFilter[wrapper.vm.levelsForFilter.length - 1];

            await wrapper.setProps({
                selectedDistrictNamesByMap: ["Ofen", "Kuehlschrank"]
            });
            expect(lowestLevel.selectedValues).to.deep.equal(["Ofen", "Kuehlschrank"]);
            wrapper.destroy();
        });
        it("should update the selected values of the lowest level", async () => {
            const wrapper = factory.getShallowMount(),
                lowestLevel = wrapper.vm.levelsForFilter[wrapper.vm.levelsForFilter.length - 1];

            await wrapper.setProps({
                selectedDistrictNamesByMap: ["Ofen", "Kuehlschrank", "Spuele"]
            });
            expect(lowestLevel.selectedValues).to.deep.equal(["Ofen", "Kuehlschrank", "Spuele"]);
            wrapper.destroy();
        });
        it("should call 'forceRerender' if selected values of the lowest level changed", async () => {
            const wrapper = factory.getShallowMount(),
                spyForceRerender = sinon.spy(wrapper.vm, "forceRerender");

            await wrapper.setProps({
                selectedDistrictNamesByMap: ["Ofen", "Kuehlschrank", "Spuele", "Mikro"]
            });
            expect(spyForceRerender.calledOnce).to.be.true;
            wrapper.destroy();
        });

        it("should reset the selected values of each district level", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setProps({
                selectedLevelId: "456"
            });
            expect(wrapper.vm.districtLevels[0].selectedValues).to.be.empty;
            expect(wrapper.vm.districtLevels[1].selectedValues).to.be.empty;
            expect(wrapper.vm.districtLevels[2].selectedValues).to.be.empty;
            wrapper.destroy();
        });
    });

    describe("Methdos", () => {
        describe("addSelectedValues", () => {
            it("should add the given selected values to the given level", () => {
                const wrapper = factory.getShallowMount();

                sinon.stub(wrapper.vm, "checkSublevels");
                wrapper.vm.addSelectedValues(["Sofa", "Sessel"], districtLevels[0]);
                expect(districtLevels[0].selectedValues).to.deep.equal(["Sofa", "Sessel"]);
                wrapper.destroy();
            });
            it("should call 'checkSublevels' correctly", () => {
                const wrapper = factory.getShallowMount(),
                    stubCheckSublevels = sinon.stub(wrapper.vm, "checkSublevels");

                wrapper.vm.addSelectedValues(["Sofa", "Sessel"], districtLevels[0]);
                expect(stubCheckSublevels.withArgs(districtLevels[0]).calledOnce).to.be.true;
                wrapper.destroy();
            });
        });

        describe("removeSelectedValues", () => {
            it("should remove the given value at the passed level", () => {
                const wrapper = factory.getShallowMount(),
                    level = {layer: layerTwo, layerId: "456", label: "Kueche", selectedValues: ["Ofen", "Kuehlschrank"]};

                sinon.stub(wrapper.vm, "checkSublevels");
                sinon.stub(wrapper.vm, "forceRerender");
                wrapper.vm.removeSelectedValues("Ofen", level);
                expect(level.selectedValues).to.deep.equal(["Kuehlschrank"]);
                wrapper.destroy();
            });
            it("should call 'stubCheckSublevels' and 'stubForceRerender' if selected value is removed from level ", () => {
                const wrapper = factory.getShallowMount(),
                    level = {layer: layerTwo, layerId: "456", label: "Kueche", selectedValues: ["Ofen", "Kuehlschrank"]},
                    stubCheckSublevels = sinon.stub(wrapper.vm, "checkSublevels"),
                    stubForceRerender = sinon.stub(wrapper.vm, "forceRerender");

                wrapper.vm.removeSelectedValues("Ofen", level);
                expect(stubForceRerender.calledOnce).to.be.true;
                expect(stubCheckSublevels.withArgs(level).calledOnce).to.be.true;
                wrapper.destroy();
            });
        });

        describe("checkSublevels", () => {
            it("should emit the right things", async () => {
                const wrapper = factory.getShallowMount(),
                    level = {layerId: "456", selectedValues: ["Ofen", "Kuehlschrank"]};

                await wrapper.setProps({
                    selectedLevelId: "456",
                    districtLevels: [level]
                });

                wrapper.vm.checkSublevels(level);
                expect(wrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(wrapper.emitted().updateSelectedDistricts[0]).to.deep.equal([level.selectedValues]);
                wrapper.destroy();
            });

            it("should call 'updateSubLevelValues' with the selected values of the passed level", () => {
                const wrapper = factory.getShallowMount(),
                    level = {subLevel: "subLevel", selectedValues: ["Ofen", "Kuehlschrank"]},
                    stubUpdateSubLevelValues = sinon.stub(wrapper.vm, "updateSubLevelValues");

                wrapper.vm.checkSublevels(level);
                expect(stubUpdateSubLevelValues.withArgs(level.selectedValues, level.subLevel).calledOnce).to.be.true;
                wrapper.destroy();
            });

            it("should call 'updateSubLevelValues' with the filterable values of the passed level", () => {
                const wrapper = factory.getShallowMount(),
                    level = {subLevel: "subLevel", selectedValues: [], filterableValues: ["Ofen", "Kuehlschrank"]},
                    stubUpdateSubLevelValues = sinon.stub(wrapper.vm, "updateSubLevelValues");

                wrapper.vm.checkSublevels(level);
                expect(stubUpdateSubLevelValues.withArgs(level.filterableValues, level.subLevel).calledOnce).to.be.true;
                wrapper.destroy();
            });
        });

        describe("updateSubLevelValues", () => {
            it("should call 'updateSubLevelValues' once and emit correctly", () => {
                const level = {
                        subLevel: null,
                        districts: [
                            {
                                referencDistrictName: "Bergedorf",
                                getName: () => "Altengamme"
                            },
                            {
                                referencDistrictName: "Altona",
                                getName: () => "Ottensen"
                            },
                            {
                                referencDistrictName: "Bergedorf",
                                getName: () => "Neuengamme"
                            }],
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Altengamme", "Neuengamme"]
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.updateSubLevelValues(["Bergedorf", "Wandsbek"], level);
                expect(wrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(wrapper.emitted().updateSelectedDistricts[0]).to.deep.equal([["Altengamme"]]);
                wrapper.destroy();
            });
            it("should call 'updateSubLevelValues' recursively and emit correctly", () => {
                const level = {
                        subLevel: {
                            districts: [{
                                referencDistrictName: "Altengamme",
                                getName: () => "123456"
                            }],
                            selectedValues: ["123456"],
                            filterableValues: ["123456"],
                            subLevel: null
                        },
                        districts: [
                            {
                                referencDistrictName: "Bergedorf",
                                getName: () => "Altengamme"
                            },
                            {
                                referencDistrictName: "Altona",
                                getName: () => "Ottensen"
                            },
                            {
                                referencDistrictName: "Bergedorf",
                                getName: () => "Neuengamme"
                            }],
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Altengamme", "Neuengamme"]
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.updateSubLevelValues(["Bergedorf", "Wandsbek"], level);
                expect(wrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(wrapper.emitted().updateSelectedDistricts[0]).to.deep.equal([["123456"]]);
                wrapper.destroy();
            });
        });

        describe("toggleSelectAll", () => {
            it("should deselect all selected values and emit them", async () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.toggleSelectAll(undefined, level);
                await wrapper.vm.$nextTick();
                expect(level.selectedValues).to.be.an("array").to.have.lengthOf(0);
                expect(wrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(wrapper.emitted().updateSelectedDistricts[0]).to.deep.equal([[]]);
                wrapper.destroy();
            });

            it("should set the filterable values to selected values and emit them", async () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Ottensen", "Altengamme", "Wilhelmsburg"]
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.toggleSelectAll(undefined, level);
                await wrapper.vm.$nextTick();
                expect(level.selectedValues).to.be.an("array").to.have.lengthOf(3);
                expect(wrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(wrapper.emitted().updateSelectedDistricts[0]).to.deep.equal([["Ottensen", "Altengamme", "Wilhelmsburg"]]);
                wrapper.destroy();
            });
        });

        describe("getIconSelectAll", () => {
            it("should get the correct icon if selected values and filterable values are the same", () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    iconString = wrapper.vm.getIconSelectAll(level);

                expect(iconString).to.be.equal("mdi-close-box");
                wrapper.destroy();
            });

            it("should get the correct icon if selected values and filterable values are not the same ", () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme", "Wilhelmsburg"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    iconString = wrapper.vm.getIconSelectAll(level);

                expect(iconString).to.be.equal("mdi-minus-box");
                wrapper.destroy();
            });

            it("should should get the correct icon if no values are selected", () => {
                const level = {
                        selectedValues: [],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    iconString = wrapper.vm.getIconSelectAll(level);

                expect(iconString).to.be.equal("mdi-checkbox-blank-outline");
                wrapper.destroy();
            });
        });

        describe("areAllValuesSelected", () => {
            it("should get 'true' if the length of selected and filterable values are equal", () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    areAllValuesSelected = wrapper.vm.areAllValuesSelected(level);

                expect(areAllValuesSelected).to.be.true;
                wrapper.destroy();
            });

            it("should get 'false' if the length of selected and filterable values are not equal", () => {
                const level = {
                        selectedValues: ["Ottensen"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    areAllValuesSelected = wrapper.vm.areAllValuesSelected(level);

                expect(areAllValuesSelected).to.be.false;
                wrapper.destroy();
            });
        });

        describe("areSomeValuesSelected", () => {
            it("should get 'false' if the length of selected and filterable values are equal", () => {
                const level = {
                        selectedValues: ["Ottensen", "Altengamme"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    areSomeValuesSelected = wrapper.vm.areSomeValuesSelected(level);

                expect(areSomeValuesSelected).to.be.false;
                wrapper.destroy();
            });

            it("should get 'true' if the length of selected and filterable values are not equal", () => {
                const level = {
                        selectedValues: ["Ottensen"],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    areSomeValuesSelected = wrapper.vm.areSomeValuesSelected(level);

                expect(areSomeValuesSelected).to.be.true;
                wrapper.destroy();
            });

            it("should get 'false' if the length of selected is 0", () => {
                const level = {
                        selectedValues: [],
                        filterableValues: ["Ottensen", "Altengamme"]
                    },
                    wrapper = factory.getShallowMount(),
                    areSomeValuesSelected = wrapper.vm.areSomeValuesSelected(level);

                expect(areSomeValuesSelected).to.be.false;
                wrapper.destroy();
            });
        });
    });
});
