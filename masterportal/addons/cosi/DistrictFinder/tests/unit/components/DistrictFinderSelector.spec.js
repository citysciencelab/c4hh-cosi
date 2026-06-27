// import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import {mount, shallowMount} from "@vue/test-utils";
// import DistrictFinderSelector from "../../../components/DistrictFinderSelector.vue";
import {expect} from "chai";
import sinon from "sinon";
// import Vue from "vue";
// import Vuetify from "vuetify";
import Vuex from "vuex";

// config.mocks.$t = key => key;

// Vue.use(Vuetify);
// const localVue = createLocalVue();

// localVue.use(Vuex);

describe.skip("addons/cosi/DistrictFinder/components/DistrictFinderSelector.vue", () => {
    let store;

    const districtOne = {layerId: "Super Mario", label: "Stat.Gebiete", districts: []},
        districtTwo = {layerId: "Luigi", label: "Stadtteile", districts: [{getName: () => "Phobos", referencDistrictName: "Mars"}, {getName: () => "Deimos", referencDistrictName: "Mars"}], subLevel: {districts: [{getName: () => "Mond", referencDistrictName: "Deimos"}]}},
        districtThree = {layerId: "Wario", label: "Bezirke", districts: [{getName: () => "Venus"}, {getName: () => "Mars"}, {getName: () => "Uranus"}]},
        // vuetify = new Vuetify(),
        DistrictFinderSelector = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderSelector, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    // localVue,
                    store
                    // vuetify
                });
            },
            getMount: (values = {}) => {
                return mount(DistrictFinderSelector, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    // localVue,
                    store
                    // vuetify
                });
            }
        };

    beforeAll(() => {
        window.requestAnimationFrame = sinon.stub();
    });

    beforeEach(() => {
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                districtLevels: () => [districtOne, districtTwo, districtThree]
                            }
                        },
                        DistrictFinder: {
                            namespaced: true,
                            state: {
                                selectedLevelId: "Luigi",
                                subLevelSelection: [],
                                topLevelSelection: []
                            },
                            mutations: {
                                setSelectedDistricts: () => sinon.stub(),
                                setSelectedLevelId (state, value) {
                                    state.selectedLevelId = value;
                                },
                                setTopLevelSelection (state, value) {
                                    state.topLevelSelection = value;
                                },
                                setSubLevelSelection (state, value) {
                                    state.subLevelSelection = value;
                                }
                            },
                            getters: {
                                selectedLevelId: (state) => state.selectedLevelId,
                                topLevelSelection: (state) => state.topLevelSelection,
                                subLevelSelection: (state) => state.subLevelSelection,
                                selectedDistricts: () => []
                            }
                        }
                    }
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("should exists", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find five chip components", () => {
            const wrapper = factory.getShallowMount(),
                chipsWrapper = wrapper.findAllComponents("v-chip-stub");

            expect(chipsWrapper.length).to.be.equal(5);
            expect(chipsWrapper.at(0).text()).to.be.equal("Stadtteile");
            expect(chipsWrapper.at(1).text()).to.be.equal("Stat.Gebiete");
            expect(chipsWrapper.at(2).text()).to.be.equal("Mars");
            expect(chipsWrapper.at(3).text()).to.be.equal("Uranus");
            expect(chipsWrapper.at(4).text()).to.be.equal("Venus");
        });

        it("should find a chip group component", () => {
            const wrapper = factory.getShallowMount(),
                chipgroupWrapper = wrapper.findComponent("v-chip-group-stub");

            expect(chipgroupWrapper.exists()).to.be.true;
        });

        it("should not find a autocomplete component", () => {
            const wrapper = factory.getShallowMount(),
                autocomplteWrapper = wrapper.findComponent("v-autocomplete-stub");

            expect(autocomplteWrapper.exists()).to.be.false;
        });

        it("should find a autocomplete component", async () => {
            const wrapper = factory.getShallowMount();

            wrapper.vm.setSelectedLevelId("Super Mario");
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent("v-autocomplete-stub").exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should set 'screeningLevels' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.screeningLevels).to.deep.equal([districtTwo, districtOne]);
        });

        it("should set 'selectedScreeningLevel' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.selectedScreeningLevel).to.deep.equal(districtTwo);
        });

        it("should set 'selectedScreeningLevelLabel' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.selectedScreeningLevelLabel).to.equal("Stadtteile");
        });

        it("should set 'showSubLevel' to false", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.showSubLevel).to.be.false;
        });

        it("should set 'showSubLevel' to true", async () => {
            const wrapper = factory.getShallowMount();

            wrapper.vm.setSelectedLevelId("Super Mario");
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.showSubLevel).to.be.true;
        });

        it("should set 'subLevel' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.subLevel).to.be.equal(districtTwo);
        });

        it("should set 'topLevel' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.topLevel).to.be.equal(districtThree);
        });

        it("should set 'topLevelDistricts' correctly", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.topLevelDistricts).to.deep.equal(["Mars", "Uranus", "Venus"]);
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should set 'topLevelSelection' correctly if component mounted", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.topLevelSelection).to.deep.equal(["Mars", "Uranus", "Venus"]);
        });
    });

    describe("Watchers", () => {
        it("should call 'collectSelectedDistricts' after 'selectedScreeningLevel' was changed", async () => {
            const spyCollectSelectedDistricts = sinon.spy(DistrictFinderSelector.methods, "collectSelectedDistricts"),
                wrapper = factory.getShallowMount();

            wrapper.vm.setSelectedLevelId("Super Mario");
            await wrapper.vm.$nextTick();
            expect(spyCollectSelectedDistricts.called).to.be.true;
            spyCollectSelectedDistricts.restore();
        });

        it("should call 'collectSelectedDistricts' after 'subLevelSelection' was changed", async () => {
            const spyCollectSelectedDistricts = sinon.spy(DistrictFinderSelector.methods, "collectSelectedDistricts"),
                wrapper = factory.getShallowMount();

            wrapper.vm.setSubLevelSelection(["big in japan"]);
            await wrapper.vm.$nextTick();
            expect(spyCollectSelectedDistricts.called).to.be.true;
            spyCollectSelectedDistricts.restore();
        });

        it("should call 'collectSelectedDistricts' after 'topLevelSelection' was changed", async () => {
            const spyCollectSelectedDistricts = sinon.spy(DistrictFinderSelector.methods, "collectSelectedDistricts"),
                wrapper = factory.getShallowMount();

            wrapper.vm.setTopLevelSelection(["wake me up before you"]);
            await wrapper.vm.$nextTick();

            expect(spyCollectSelectedDistricts.called).to.be.true;
            spyCollectSelectedDistricts.restore();
        });

        it("should call 'addSubLevelDistricts' after 'topLevelSelection' increases", async () => {
            const spyAddSubLevelDistricts = sinon.spy(DistrictFinderSelector.methods, "addSubLevelDistricts"),
                wrapper = factory.getShallowMount();

            wrapper.vm.setTopLevelSelection(["wake me up before you"]);
            await wrapper.vm.$nextTick();
            wrapper.vm.setTopLevelSelection(["wake me up before you", "big in japan"]);
            await wrapper.vm.$nextTick();
            expect(spyAddSubLevelDistricts.calledOnce).to.be.true;
            spyAddSubLevelDistricts.restore();
        });

        it("should call 'removeSubLevelDistricts' after 'topLevelSelection' decreases", async () => {
            const spyRemoveSubLevelDistricts = sinon.spy(DistrictFinderSelector.methods, "removeSubLevelDistricts"),
                wrapper = factory.getShallowMount();

            wrapper.vm.setTopLevelSelection(["wake me up before you", "big in japan"]);
            await wrapper.vm.$nextTick();
            wrapper.vm.setTopLevelSelection(["wake me up before you"]);
            await wrapper.vm.$nextTick();

            expect(spyRemoveSubLevelDistricts.calledOnce).to.be.true;
            spyRemoveSubLevelDistricts.restore();
        });
    });

    describe("User Interactions", () => {
        it("should call 'setSelectedLevelId' if user click on a top level chip", async () => {
            const spySetSelectedLevelId = sinon.spy(DistrictFinderSelector.methods, "setSelectedLevelId"),
                wrapper = factory.getMount(),
                chipsWrapper = wrapper.findAll(".v-chip--clickable");

            await chipsWrapper.at(1).trigger("click");
            expect(wrapper.vm.selectedLevelId).to.be.equal("Super Mario");
            expect(spySetSelectedLevelId.calledOnce).to.be.true;
            spySetSelectedLevelId.restore();
        });

        it("should call 'removeFromSubLevelSelection' if user deselect an item in the autocomplete dropdown", async () => {
            const spyRemoveFromSubLevelSelection = sinon.spy(DistrictFinderSelector.methods, "removeFromSubLevelSelection"),
                wrapper = factory.getMount(),
                chipsWrapperClick = wrapper.findAll(".v-chip--clickable"),
                chipsWrapperRemove = wrapper.findAll(".v-chip--removable button");

            await chipsWrapperClick.at(1).trigger("click");
            await chipsWrapperRemove.at(0).trigger("click");
            expect(spyRemoveFromSubLevelSelection.calledOnce).to.be.true;
            spyRemoveFromSubLevelSelection.restore();
        });

    });

    describe("Methods", () => {
        describe("addSubLevelDistricts", () => {
            it("should add the correct values to 'subLevelDistricts' and 'subLevelSelection'", () => {
                const wrapper = factory.getShallowMount(),
                    districts = [{getName: () => "Sansa", referencDistrictName: "Eddard"}, {getName: () => "Bran", referencDistrictName: "Eddard"}, {getName: () => "Daenerys", referencDistrictName: "Aerys"}];

                wrapper.vm.addSubLevelDistricts(districts, "Eddard");
                expect(wrapper.vm.subLevelDistricts).to.deep.equal(["Bran", "Sansa"]);
                expect(wrapper.vm.subLevelSelection).to.deep.equal(["Bran", "Sansa"]);
            });
        });

        describe("collectSelectedDistricts", () => {
            it("should use the sublevel districts to set 'selectedDistricts'", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.collectSelectedDistricts();
                expect(wrapper.vm.collectSelectedDistricts()).to.deep.equal(["Phobos", "Deimos"]);
            });

            it("should use the sub sublevel districts to set 'selectedDistricts'", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setSelectedLevelId("Super Mario");
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.collectSelectedDistricts()).to.deep.equal(["Mond"]);
            });
        });

        describe("getDistrictsByReference", () => {
            it("should get the names of the districts by the passed reference district", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.getDistrictsByReference(districtTwo.districts, "Mars");
                expect(wrapper.vm.collectSelectedDistricts()).to.deep.equal(["Phobos", "Deimos"]);
            });
        });

        describe("removeSubLevelDistricts", () => {
            it("should remove the correct values to 'subLevelDistricts' and 'subLevelSelection'", () => {
                const wrapper = factory.getShallowMount(),
                    districts = [{getName: () => "Sansa", referencDistrictName: "Eddard"}, {getName: () => "Bran", referencDistrictName: "Eddard"}, {getName: () => "Daenerys", referencDistrictName: "Aerys"}];

                wrapper.vm.addSubLevelDistricts(districts, "Eddard");
                wrapper.vm.addSubLevelDistricts(districts, "Aerys");
                wrapper.vm.removeSubLevelDistricts(districts, "Eddard");
                expect(wrapper.vm.subLevelDistricts).to.deep.equal(["Daenerys"]);
                expect(wrapper.vm.subLevelSelection).to.deep.equal(["Daenerys"]);
            });
        });
    });
});
