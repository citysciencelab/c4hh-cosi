// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
// import DistrictFinderFilter from "../../../components/DistrictFinderFilter.vue";
import {expect} from "chai";
import {getMappingJsonJS} from "../../../../utils/getMappingJson";
import sinon from "sinon";
import Vuex from "vuex";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// localVue.use(Vuex);

beforeAll(() => {
    sinon.stub(getMappingJsonJS, "getMappingJson").resolves([]);
});

afterAll(() => {
    sinon.restore();
});

describe.skip("addons/cosi/DistrictFinder/components/DistrictFinderFilter.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                selectedDistrictLevel: () => []
                            },
                            mutations: {
                                setDistrictsByName: () => sinon.stub()
                            }
                        },
                        DistrictFinder: {
                            namespaced: true,
                            state: {
                                cardList: [],
                                conditionDate: "",
                                conditionTitle: "",
                                mapping: []
                            },
                            getters: {
                                selectedDistricts: () => ["Altona", "Bergedorf", "Harburg"],
                                topLevelSelection: () => ["Altona", "Bergedorf", "Harburg"],
                                subLevelSelection: () => ["Altona1", "Bergedorf1", "Harburg1"],
                                selectedLevelId: () => "Super Mario",
                                cardList: (state) => state.cardList,
                                conditionDate: (state) => state.conditionDate,
                                conditionTitle: (state) => state.conditionTitle,
                                filteredLayer: (state) => state.filteredLayer,
                                selectedDistrictLevel: (state) => state.selectedDistrictLevel
                            },
                            mutations: {
                                setCardList (state, value) {
                                    state.cardList = value;
                                },
                                setConditionDate (state, value) {
                                    state.conditionDate = value;
                                },
                                setConditionTitle (state, value) {
                                    state.conditionTitle = value;
                                },
                                setFilteredLayer (state, value) {
                                    state.filteredLayer = value;
                                },
                                setMapping (state, value) {
                                    state.mapping = value;
                                }
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        // addNewLayerIfNotExists: () => {}
                    }
                }
            }
        }),
        DistrictFinderFilter = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderFilter, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    store
                    // localVue
                });
            }
        };

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find a filter title", () => {
            const wrapper = factory.getShallowMount(),
                filterTitleWrapper = wrapper.find(".filter-title");

            expect(filterTitleWrapper.exists()).to.be.true;
        });

        it("should find a filter date", () => {
            const wrapper = factory.getShallowMount(),
                filterDateWrapper = wrapper.find(".filter-title");

            expect(filterDateWrapper.exists()).to.be.true;
        });

        it("should find icon button component with id 'reset-button'", () => {
            const wrapper = factory.getShallowMount(),
                iconButtonWrapper = wrapper.find("iconbutton-stub#reset-button");

            expect(iconButtonWrapper.exists()).to.be.true;
        });

        it("should find icon button component with id 'export-button'", () => {
            const wrapper = factory.getShallowMount(),
                iconButtonWrapper = wrapper.find("iconbutton-stub#export-button");

            expect(iconButtonWrapper.exists()).to.be.true;
        });

        it("should find filter export component", () => {
            const wrapper = factory.getShallowMount(),
                exportWrapper = wrapper.find("districtfinderfilterexport-stub");

            expect(exportWrapper.exists()).to.be.true;
        });

        it("should find filter import component", () => {
            const wrapper = factory.getShallowMount(),
                importWrapper = wrapper.find("districtfinderfilterimport-stub");

            expect(importWrapper.exists()).to.be.true;
        });

        it("should find the button to add a condition'", () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrap => {
                    return wrap.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            expect(foundButton.exists()).to.be.true;
        });
        it("should render results if areas were found", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                resultList: ["Gebiet1", "Gebiet2", "Gebiet3"]
            });

            expect(wrapper.find(".found-areas").exists()).to.be.true;
        });
        it("should not render results if no areas were found", async () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".found-areas").exists()).to.be.false;
        });
    });

    describe("Computed Properties", () => {
        it("should get 'allOperators'", () => {
            const wrapper = factory.getShallowMount();

            wrapper.vm.setCardList(
                [{
                    id: "0",
                    operator: "or",
                    number: 0,
                    districts: ["Mordor"]
                },
                {
                    id: "1",
                    operator: "and",
                    number: 1,
                    districts: ["Wunderland"]
                }
                ]);

            expect(wrapper.vm.allOperators).to.deep.equal(["or", "and"]);
        });

        it("should get 'allDistricts'", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.vm.allDistricts).to.deep.equal([["Mordor"], ["Wunderland"]]);
        });
    });

    describe("Methods", () => {
        describe("addCard", () => {
            it("should have three cards", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setCardList(
                    [{
                        id: "0",
                        operator: "or",
                        number: 0,
                        districts: ["Mordor"]
                    }]);

                wrapper.vm.addCard();

                expect(wrapper.vm.cardList.length).to.be.equal(2);
            });
        });

        describe("deleteCard", () => {
            it("should delete one card", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setCardList(
                    [{
                        id: "0",
                        operator: "or",
                        number: 0,
                        districts: ["Mordor"]
                    },
                    {
                        id: "1",
                        operator: "and",
                        number: 1,
                        districts: ["Wunderland"]
                    }
                    ]);

                wrapper.vm.deleteCard("0");

                expect(wrapper.vm.cardList).to.deep.equal([
                    {
                        id: "1",
                        operator: "and",
                        number: 1,
                        districts: ["Wunderland"]
                    }]);
            });
        });

        describe("resetCardList", () => {
            it("should reset the card(condition) list", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.resetCardList();
                expect(wrapper.vm.cardList).to.be.an("array").that.is.empty;
            });
        });

        describe("resolveByMapping", () => {
            it("should return the given districts if mapping parameter is invalid", () => {
                const wrapper = factory.getShallowMount(),
                    districts = ["Niedersachsen/Hamburg", "Auenland"];

                expect(wrapper.vm.resolveByMapping(districts, null)).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, 0)).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, undefined)).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, false)).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, [])).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, 123)).to.equal(districts);
                expect(wrapper.vm.resolveByMapping(districts, "abc")).to.equal(districts);
            });

            it("should return an empty array if districts parameter is invalid", () => {
                const wrapper = factory.getShallowMount(),
                    districts = null,
                    mapping = {
                        "Niedersachsen/Hamburg": ["Niedersachsen", "Hamburg"]
                    },
                    split = wrapper.vm.resolveByMapping(districts, mapping);

                expect(split).to.deep.equal([]);
            });

            it("should resolve the given districts by the passed mapping object", () => {
                const wrapper = factory.getShallowMount(),
                    districts = ["Niedersachsen/Hamburg", "Auenland"],
                    mapping = {
                        "Niedersachsen/Hamburg": ["Niedersachsen", "Hamburg"]
                    },
                    split = wrapper.vm.resolveByMapping(districts, mapping);

                expect(split).to.deep.equal(["Niedersachsen", "Hamburg", "Auenland"]);
            });
        });

        describe("reverseDistrictNamesMap", () => {
            it("should resever the given mapping object", () => {
                const wrapper = factory.getShallowMount(),
                    mappingObject = {
                        Niedersachsen: "Niedersachsen/Hamburg",
                        Hamburg: "Niedersachsen/Hamburg",
                        Mordor: "Auenland"
                    },
                    reversedObject = wrapper.vm.reverseDistrictNamesMap(mappingObject);

                expect(reversedObject).to.deep.equal({
                    "Niedersachsen/Hamburg": ["Niedersachsen", "Hamburg"],
                    Auenland: ["Mordor"]
                });
            });
        });

        describe("getExportedData", () => {
            it("should return the right exported data without areas", () => {
                const wrapper = factory.getShallowMount(),
                    expectedData = {
                        meta: {
                            name: "Ross",
                            date: "01.01.1999"
                        },
                        districtSelector: {
                            selectedLevelId: "Super Mario"
                        },
                        data: []
                    },
                    data = wrapper.vm.getExportedData("Ross", "01.01.1999", false, []);

                expect(data).to.deep.equal(expectedData);
            });

            it("should return the right exported data with areas ", () => {
                const wrapper = factory.getShallowMount(),
                    expectedData = {
                        meta: {
                            name: "Ross",
                            date: "01.01.1999"
                        },
                        districtSelector: {
                            selectedLevelId: "Super Mario",
                            selectedTopLevels: ["Altona", "Bergedorf", "Harburg"],
                            selectedSubLevels: ["Altona1", "Bergedorf1", "Harburg1"]
                        },
                        data: []
                    };

                expect(wrapper.vm.getExportedData("Ross", "01.01.1999", true, [])).to.deep.equal(expectedData);
            });
        });

        describe("setCardAttributes", () => {
            it("should update results correctly", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setCardList([{
                    id: "0",
                    operator: "or",
                    number: 1
                }]);

                wrapper.vm.setCardAttributes("0", ["Altona", "Harburg"]);

                expect(wrapper.vm.cardList[0].districts).to.deep.equal(["Altona", "Harburg"]);
                expect(wrapper.vm.resultList).to.deep.equal(["Altona", "Harburg"]);
            });
        });

        describe("setConditionCards", () => {
            it("should set the card(condition) list", async () => {
                const wrapper = factory.getShallowMount(),
                    list = [{
                        id: "0",
                        operator: "or",
                        number: 0,
                        districts: ["Mordor"]
                    },
                    {
                        id: "1",
                        operator: "and",
                        number: 1,
                        districts: ["Wunderland"]
                    }];

                wrapper.vm.setConditionCards(list);

                await wrapper.vm.$nextTick();
                expect(wrapper.vm.cardList).to.deep.equal(list);
            });

            it("should call 'resetCardList' and 'updateResultList'", async () => {
                const wrapper = factory.getShallowMount(),
                    spyResetCardList = sinon.spy(wrapper.vm, "resetCardList"),
                    spyUpdateResultList = sinon.spy(wrapper.vm, "updateResultList"),
                    cardList = [{
                        id: "0",
                        operator: "or",
                        number: 0,
                        districts: ["Mordor"]
                    },
                    {
                        id: "1",
                        operator: "and",
                        number: 1,
                        districts: ["Wunderland"]
                    }];

                wrapper.vm.setConditionCards(cardList);
                await wrapper.vm.$nextTick();
                expect(spyResetCardList.calledOnce).to.be.true;
                expect(spyUpdateResultList.calledOnce).to.be.true;
                sinon.restore();
            });
        });

        describe("setCardOperator", () => {
            it("should update component data correctly on operator change event", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setCardList([{
                    id: "0",
                    operator: "or",
                    number: 1
                }, {
                    id: "1",
                    operator: "or",
                    number: 2
                }]);

                wrapper.vm.setCardOperator("0", "and");
                wrapper.vm.setCardOperator("1", "and");
                wrapper.vm.setCardOperator("0", "or");

                expect(wrapper.vm.cardList[0].operator).to.equal("or");
                expect(wrapper.vm.cardList[1].operator).to.equal("and");
            });
        });

        describe("importConditionDate", () => {
            it("should not set the date of the condition/card", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.importConditionDate(0);
                expect(wrapper.vm.conditionDate).to.equal("");
                wrapper.vm.importConditionDate(null);
                expect(wrapper.vm.conditionDate).to.equal("");
                wrapper.vm.importConditionDate(false);
                expect(wrapper.vm.conditionDate).to.equal("");
                wrapper.vm.importConditionDate(undefined);
                expect(wrapper.vm.conditionDate).to.equal("");
                wrapper.vm.importConditionDate({});
                expect(wrapper.vm.conditionDate).to.equal("");
                wrapper.vm.importConditionDate([]);
                expect(wrapper.vm.conditionDate).to.equal("");
            });

            it("should set the date of the condition/card", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.importConditionDate("1999-01-01");

                await wrapper.vm.$nextTick();

                expect(wrapper.vm.conditionDate).to.equal("01.01.1999");
            });
        });

        describe("importConditionTitle", () => {
            it("should set the title of the condition/card", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.importConditionTitle("Ho ho ho");
                expect(wrapper.vm.conditionTitle).to.equal("Ho ho ho");
            });
        });

        describe("getResultList", () => {
            it("should return empty array in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getResultList()).to.deep.equal([]);
                expect(wrapper.vm.getResultList(null, ["or"])).to.deep.equal([]);
                expect(wrapper.vm.getResultList([["Hamm"], ["Schlump"]], null)).to.deep.equal([]);
                expect(wrapper.vm.getResultList([], ["or"])).to.deep.equal([]);
            });

            it("should return expected result", () => {
                const wrapper = factory.getShallowMount(),
                    resultNamesArray = [
                        ["Altona", "Bergedorf"],
                        ["Eimsbüttel", "Harburg"],
                        ["Harburg", "Wandsbek"]
                    ],
                    operators = ["", "or", "and"];

                expect(wrapper.vm.getResultList(resultNamesArray, operators)).to.deep.equal(
                    ["Altona", "Bergedorf", "Harburg"]
                );
            });
        });
        describe("getCommaSeparatedAreaNames", () => {
            it("should return comma separated results", async () => {
                const wrapper = factory.getShallowMount(),
                    result = "Gebiet1, Gebiet2, Gebiet3";

                await wrapper.setData({
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3"]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            });
            it("should return a limited number of areas if showMoreAreas is false", async () => {
                const wrapper = factory.getShallowMount(),
                    result = "Gebiet1, Gebiet2, Gebiet3";

                await wrapper.setData({
                    numberOfLimitedAreas: 3,
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3", "Gebiet4", "Gebiet5", "Gebiet6"]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            });
            it("should return all areas if showMoreAreas is true", async () => {
                const wrapper = factory.getShallowMount(),
                    result = "Gebiet1, Gebiet2, Gebiet3, Gebiet4, Gebiet5, Gebiet6";

                await wrapper.setData({
                    numberOfLimitedAreas: 3,
                    showMoreAreas: true,
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3", "Gebiet4", "Gebiet5", "Gebiet6"]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            });
        });

        describe("toggleCardActive", () => {
            it("should set the active id", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    activeCardId: ""
                });
                wrapper.vm.toggleCardActive(0);
                await wrapper.vm.$nextTick();

                expect(wrapper.vm.activeCardId).to.be.equal(0);
            });
        });
    });

    describe("User Interactions", () => {
        it("should call 'addCard' if the user click the button to add a card", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrap => {
                    return wrap.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            await foundButton.trigger("click");
            expect(wrapper.vm.cardList.length).to.be.equal(3);
        });
    });
});
