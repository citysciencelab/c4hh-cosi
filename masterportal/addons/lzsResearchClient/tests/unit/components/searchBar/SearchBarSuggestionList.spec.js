import {createStore} from "vuex";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SearchBarSuggestionListComponent from "../../../../components/searchBar/components/SearchBarSuggestionList.vue";

describe("addons/lzsResearchClient/components/searchBar/components/SearchBarSuggestionList.vue", () => {
    let store,
        wrapper,
        showAllResultsSearchInterfaceInstances,
        setNavigationCurrentComponentBySideSpy,
        setCurrentAvailableCategoriesSpy,
        setShowAllResultsSearchInterfaceInstancesSpy,
        setCurrentComponentBySideSpy,
        setNavigationHistoryBySideSpy;

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
            }
        ],
        minCharacters = 3,
        searchInput = "Neuenfelder",
        showAllResults = false,
        limitedSortedSearchResults = {
            results: {
                0: searchResults[0],
                1: searchResults[0],
                availableCategories: ["Straße"],
                XcategoryProvider: [
                    "gazetteer"
                ],
                categoryProvider: {
                    "Straße": "gazetteer"
                },
                exampleCount: 1,
                exampleIcon: "bi-signpost-2"
            },
            currentShowAllList: searchResults
        };

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        showAllResultsSearchInterfaceInstances = [];
        setNavigationCurrentComponentBySideSpy = sinon.spy();
        setCurrentAvailableCategoriesSpy = sinon.spy();
        setShowAllResultsSearchInterfaceInstancesSpy = sinon.spy();
        setCurrentComponentBySideSpy = sinon.spy();
        setNavigationHistoryBySideSpy = sinon.spy();
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        scale: () => 500,
                        mode: () =>"2D"
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            actions: {
                                addSelectedSearchResultToTopicTree: sinon.stub()
                            },
                            getters: {
                                minCharacters: () => minCharacters,
                                searchInput: () => searchInput,
                                searchResults: () => searchResults,
                                searchResultsActive: () => {
                                    return true;
                                },
                                showAllResults: () => showAllResults,
                                showAllResultsSearchInterfaceInstances: () => showAllResultsSearchInterfaceInstances
                            },
                            mutations: {
                                setShowAllResultsSearchInterfaceInstances: setShowAllResultsSearchInterfaceInstancesSpy,
                                setCurrentAvailableCategories: setCurrentAvailableCategoriesSpy,
                                setShowAllResults: sinon.stub()
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentComponent: () => () => "root",
                        menuBySide: () => () => true
                    },
                    mutations: {
                        setNavigationCurrentComponentBySide: setNavigationCurrentComponentBySideSpy,
                        setCurrentComponentBySide: setCurrentComponentBySideSpy,
                        setNavigationHistoryBySide: setNavigationHistoryBySideSpy
                    }
                }
            },
            getters: {
                layerConfigById: () => sinon.stub()
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("test the rendering of the SearchBarSuggestionList", () => {
        it("renders the SearchBarSuggestionList", async () => {
            wrapper = mount(SearchBarSuggestionListComponent, {
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
            expect(wrapper.find(".lzs-research-client-suggestions-container").exists()).to.be.true;
        });
    });

    describe("test prepareShowAllResults method", () => {
        it("should call setCurrentAvailableCategories with the given category", async () => {
            wrapper = mount(SearchBarSuggestionListComponent, {
                props: {limitedSortedSearchResults},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });
            wrapper.vm.prepareShowAllResults("Straße");
            await wrapper.vm.$nextTick();
            expect(setCurrentAvailableCategoriesSpy.calledOnce).to.be.true;
            expect(setCurrentAvailableCategoriesSpy.args[0][1]).to.equal("Straße");
        });

        it("should set currentShowAllList to results matching the given category", async () => {
            wrapper = mount(SearchBarSuggestionListComponent, {
                props: {limitedSortedSearchResults},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });
            wrapper.vm.prepareShowAllResults("Straße");
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.currentShowAllList).to.have.lengthOf(1);
            expect(wrapper.vm.currentShowAllList[0].category).to.equal("Straße");
        });

        it("should set currentShowAllList to an empty array when no results match the given category", async () => {
            wrapper = mount(SearchBarSuggestionListComponent, {
                props: {limitedSortedSearchResults},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });
            wrapper.vm.prepareShowAllResults("NonExistingCategory");
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.currentShowAllList).to.have.lengthOf(0);
        });
    });

    describe("test getFirstByCategory method", () => {
        beforeEach(async () => {
            wrapper = mount(SearchBarSuggestionListComponent, {
                props: {limitedSortedSearchResults},
                global: {
                    mocks: {
                        $t: key => key
                    },
                    plugins: [store]
                }
            });
        });

        it("should return the first result matching the given category", () => {
            const result = wrapper.vm.getFirstByCategory("Straße");

            expect(result).to.deep.equal(searchResults[0]);
        });

        it("should return undefined when no result matches the given category", () => {
            const result = wrapper.vm.getFirstByCategory("NonExistingCategory");

            expect(result).to.be.undefined;
        });

        it("should return undefined for a category present in currentShowAllList but absent from results", () => {
            const result = wrapper.vm.getFirstByCategory("Adresse");

            expect(result).to.be.undefined;
        });

        it("should render an icon and no image when the matched result has no imagePath", () => {
            expect(wrapper.find("h5 i").exists()).to.be.true;
            expect(wrapper.find("img.search-bar-suggestion-image").exists()).to.be.false;
        });

        it("should render an image and no icon when the matched result has a valid imagePath", async () => {
            const limitedSortedSearchResultsWithImage = {
                ...limitedSortedSearchResults,
                results: {
                    ...limitedSortedSearchResults.results,
                    0: {...searchResults[0], imagePath: "path/to/image.png"}
                }
            };

            await wrapper.setProps({limitedSortedSearchResults: limitedSortedSearchResultsWithImage});
            expect(wrapper.find("img.search-bar-suggestion-image").exists()).to.be.true;
            expect(wrapper.find("h5 i").exists()).to.be.false;
        });
    });
});
