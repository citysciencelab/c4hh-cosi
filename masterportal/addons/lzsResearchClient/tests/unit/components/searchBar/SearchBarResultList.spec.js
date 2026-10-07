import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SearchBarResultListComponent from "../../../../components/searchBar/components/SearchBarResultList.vue";

describe("addons/lzsResearchClient/searchBar/components/SearchBarResultList.vue", () => {
    let currentAvailableCategories,
        store,
        wrapper;

    const searchResults = [
            {
                "category": "Straße",
                "id": "BeidemNeuenKrahnStraße",
                "index": 0,
                "name": "Bei dem Neuen Krahn",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }

            },
            {
                "category": "Adresse",
                "id": "BeidemNeuenKrahn2Adresse",
                "index": 1,
                "name": "Bei dem Neuen Krahn 2",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            },
            {
                "category": "topicTree",
                "id": "ABC",
                "index": 1,
                "name": "The topic",
                "searchInterfaceId": "topicTree",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            }
        ],
        minCharacters = 3,
        searchInput = "Neuenfelder",
        limitedSortedSearchResults = {
            results: {
                0: searchResults[0],
                1: searchResults[0],
                availableCategories: ["example"],
                categoryProvider: {
                    example: "exampleSearch"
                },
                exampleCount: 1,
                exampleIcon: "bi-signpost-2"
            },
            currentShowAllList: searchResults
        },
        currentComponent = {type: "test"};


    beforeEach(() => {
        currentAvailableCategories = "Adresse";

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            getters: {
                                currentAvailableCategories: () => currentAvailableCategories,
                                minCharacters: () => minCharacters,
                                searchInput: () => searchInput,
                                searchResults: () => searchResults,
                                currentSide: () => {
                                    return "mainMenu";
                                },
                                searchResultsActive: () => {
                                    return true;
                                }
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentComponent: () => () => currentComponent
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("render result lists", () => {
        it("should render the result list general", async () => {
            wrapper = shallowMount(SearchBarResultListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find("#lzs-research-client-search-bar-result-list").exists()).to.be.true;
        });
    });

    describe("resultItems", () => {
        it("should return result items", async () => {
            wrapper = shallowMount(SearchBarResultListComponent, {
                props: {
                    limitedSortedSearchResults
                },
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.vm.resultItems).to.deep.equals([
                {
                    "category": "Adresse",
                    "id": "BeidemNeuenKrahn2Adresse",
                    "index": 1,
                    "name": "Bei dem Neuen Krahn 2",
                    "searchInterfaceId": "gazetteer",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ]);
        });
    });
});
