import {createStore} from "vuex";
import {shallowMount, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {Point} from "ol/geom";

import SearchBarComponent from "../../../../components/searchBar/components/LzsResearchClientSearchBar.vue";


describe("addons/lzsResearchClient/searchBar/components/lzsResearchClientSearchBar.vue", () => {
    const searchInterfaceInstances = [
        {
            "searchInterfaceId": "gazetteer"
        }
    ];
    let searchResults,
        store,
        wrapper,
        menuActionsSpy,
        searchBarActionsSpy,
        searchBarMutationsSpy,
        searchInputValue,
        setSearchResultsActiveSpy,
        setShowAllResultsSpy,
        setCurrentActionEventSpy,
        addressSearchCoordinates,
        mapsActionsSpy,
        consoleWarnStub;

    /**
     * Helper to build the component options with shared store.
     * @param {Object} [props={}] Component props.
     * @returns {Object} Mount options.
     */
    function buildOptions (props = {}) {
        return {
            props,
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }
        };
    }


    beforeEach(() => {
        consoleWarnStub = sinon.stub(console, "warn");

        global.mapCollection = {
            getMapView: () => ({
                getProjection: () => ({getCode: () => "EPSG:4326"})
            })
        };

        searchInputValue = "abc-straße";
        addressSearchCoordinates = null;
        searchResults = [
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
        ];
        menuActionsSpy = {
            navigateBack: sinon.stub()
        };

        searchBarActionsSpy = {
            instantiateSearchInterfaces: sinon.stub(),
            overwriteDefaultValues: sinon.stub(),
            search: sinon.stub(),
            activateActions: sinon.stub()
        };

        setSearchResultsActiveSpy = sinon.spy();
        setShowAllResultsSpy = sinon.spy();
        setCurrentActionEventSpy = sinon.spy();
        searchBarMutationsSpy = {
            addSuggestionItem: sinon.stub(),
            setSearchInput: sinon.stub(),
            setShowAllResults: setShowAllResultsSpy,
            setCurrentActionEvent: setCurrentActionEventSpy,
            setCurrentSide: sinon.stub(),
            setSearchResultsActive: setSearchResultsActiveSpy,
            setSearchSuggestions: sinon.stub(),
            setPlaceholder: sinon.stub(),
            setSearchInterfaces: sinon.stub(),
            setAddressSearchCoordinates: sinon.stub()
        };

        mapsActionsSpy = {
            removePointMarker: sinon.stub(),
            removePolygonMarker: sinon.stub()
        };

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            actions: searchBarActionsSpy,
                            getters: {
                                configPaths: () => [],
                                currentSide: () => "secondaryMenu",
                                minCharacters: () => 3,
                                placeholder: () => "ABC",
                                searchInput: () => searchInputValue,
                                searchInterfaceInstances: () => searchInterfaceInstances,
                                searchResults: () => searchResults,
                                searchResultsActive: () => false,
                                showAllResults: () => false,
                                suggestionListLength: () => 0,
                                iconsByActions: () => ({
                                    setMarker: "bi-geo-alt",
                                    zoomToResult: "bi-zoom-in"
                                }),
                                addressSearchCoordinates: () => addressSearchCoordinates,
                                alkisBaseUrl: () => "https://example.com/alkis"
                            },
                            mutations: searchBarMutationsSpy
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        titleBySide: () => () => true,
                        currentComponent: () => () => "root",
                        previousNavigationEntryText: () => () => ""
                    },
                    actions: menuActionsSpy
                },
                Maps: {
                    namespaced: true,
                    actions: mapsActionsSpy
                }
            },
            getters: {
                isMobile: () => false,
                portalConfig: sinon.stub()
            },
            actions: {
                initializeModule: sinon.stub()
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        delete global.mapCollection;

        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }
    });

    describe("render SearchBar in LzsResearchClient", () => {
        it("should render the SearchBar with button and input and mounted values", async () => {
            wrapper = mount(SearchBarComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#lzs-research-client-search-bar").exists()).to.be.true;
            expect(wrapper.find("#lzs-research-client-search-button").exists()).to.be.true;
            expect(wrapper.find("input").exists()).to.be.true;
            expect(wrapper.vm.currentSide).to.eql("secondaryMenu");
            expect(wrapper.vm.currentComponentSide).to.be.undefined;
            expect(wrapper.vm.searchInputValue).to.deep.eql("abc-straße");
        });
    });

    describe("should trigger startSearch", () => {
        it("should start search to abc-straße, if button is clicked", async () => {
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const startSearchSpy = sinon.spy(wrapper.vm, "startSearch");

            await wrapper.find("#lzs-research-client-search-button").trigger("click");

            expect(startSearchSpy.calledOnce).to.be.true;
        });
    });

    describe("return addressPointGeometry", () => {
        it("addressPointGeometry returns null when coordinates are missing", () => {
            wrapper = shallowMount(SearchBarComponent, buildOptions());
            expect(wrapper.vm.addressPointGeometry).to.be.null;
        });

        it("addressPointGeometry returns a Point when coordinates are valid", () => {
            addressSearchCoordinates = [10, 20];
            wrapper = shallowMount(SearchBarComponent, buildOptions());
            const point = wrapper.vm.addressPointGeometry;

            expect(point).to.be.instanceOf(Point);
            expect(point.getCoordinates()).to.deep.equal([10, 20]);
        });
    });

    describe("getParcel", () => {
        it("returns early and warns when no geometry is provided", async () => {
            wrapper = shallowMount(SearchBarComponent, buildOptions());

            await wrapper.vm.getParcel(null);

            expect(consoleWarnStub.calledWith(
                "No valid address point geometry available to fetch parcel data."
            )).to.be.true;
            expect(wrapper.emitted("set-search-geometry")).to.be.undefined;
        });

        it("emits the point as fallback when no parcel is returned", async () => {
            addressSearchCoordinates = [10, 20];
            wrapper = shallowMount(SearchBarComponent, buildOptions());
            wrapper.vm.fetchFeatures = sinon.stub().resolves([]);

            const point = wrapper.vm.addressPointGeometry;

            await wrapper.vm.getParcel(point);

            const emitted = wrapper.emitted("set-search-geometry");

            expect(emitted).to.be.an("array").with.length(1);
            expect(emitted[0][0]).to.equal(point);
        });

        it("emits a transformed polygon when a parcel is returned", async () => {
            addressSearchCoordinates = [10, 20];
            wrapper = shallowMount(SearchBarComponent, buildOptions());
            // Polygon must contain the address point [10, 20] so
            // `parcelGeometry.getPolygons().find(...)` returns a match.
            wrapper.vm.fetchFeatures = sinon.stub().resolves([{
                geometry: {
                    coordinates: [[[[5, 15], [15, 15], [15, 25], [5, 25], [5, 15]]]]
                }
            }]);

            await wrapper.vm.getParcel(wrapper.vm.addressPointGeometry);

            const emitted = wrapper.emitted("set-search-geometry");

            expect(emitted).to.be.an("array").with.length(1);
            expect(emitted[0][0]).to.not.be.undefined;
        });

        it("emits the intersecting polygon when multiple polygons are returned", async () => {
            addressSearchCoordinates = [10, 20];
            wrapper = shallowMount(SearchBarComponent, buildOptions());
            wrapper.vm.fetchFeatures = sinon.stub().resolves([{
                geometry: {
                    coordinates: [
                        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                        [[[5, 15], [15, 15], [15, 25], [5, 25], [5, 15]]]
                    ]
                }
            }]);

            await wrapper.vm.getParcel(wrapper.vm.addressPointGeometry);

            const emitted = wrapper.emitted("set-search-geometry");

            expect(emitted).to.be.an("array").with.length(1);

            expect(emitted[0][0]).to.not.be.undefined;
            expect(emitted[0][0].getCoordinates()).to.deep.equal(
                [[[5, 15], [15, 15], [15, 25], [5, 25], [5, 15]]]
            );
        });
    });

    describe("test input element", () => {
        it("should start search to abc-straße, if button is clicked", async () => {
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const testInput = wrapper.find({ref: "searchInput"});

            expect(testInput.exists()).to.be.true;
        });
    });

    describe("tryToMarkAddressResult", () => {
        it("zooms to and sets a marker at a given searchResult", () => {
            searchResults = [
                {
                    "category": "Adresse",
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
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
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
                    "searchInterfaceId": "elasticSearch_1",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ];
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: key => key
                    }
                }
            });

            const activateActionsSpy = sinon.spy(wrapper.vm, "activateActions");

            wrapper.vm.tryToMarkAddressResult("neuenfelder Straße 19");
            expect(activateActionsSpy.called).to.be.true;
        });

    });
});
