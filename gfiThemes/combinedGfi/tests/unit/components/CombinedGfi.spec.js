import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import CombinedGfi from "../../../components/CombinedGfi.vue";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import sinon from "sinon";

describe("addons/gfiThemes/combinedGfi/components/CombinedGfi.vue", () => {
    let wrapper, store, mapActionsSpy, mapMutationsSpy, initSpy, originalMapCollection;

    beforeEach(() => {
        originalMapCollection = global.mapCollection;

        mapActionsSpy = sinon.spy();
        mapMutationsSpy = sinon.spy();
        initSpy = sinon.spy();

        global.mapCollection = {
            getMap: () => ({
                getLayers: () => ({
                    getArray: () => []
                }),
                getView: () => ({
                    getResolution: () => 1,
                    getProjection: () => ({
                        getCode: () => "EPSG:25832"
                    }),
                    fit: sinon.spy()
                }),
                removeLayer: sinon.spy(),
                addLayer: sinon.spy()
            })
        };

        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        projection: () => "EPSG:25832"
                    },
                    actions: {
                        highlightFeature: mapActionsSpy,
                        removeHighlightFeature: mapActionsSpy
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        Language: {
                            namespaced: true,
                            getters: {
                                currentLocale: () => "de"
                            }
                        },
                        GetFeatureInfo: {
                            namespaced: true,
                            getters: {
                                clickCoordinates: () => [565874, 5934140],
                                highlightVectorRules: () => ({})
                            }
                        },
                        CombinedGfi: {
                            namespaced: true,
                            getters: {
                                alternativeGeometry: () => false,
                                alternativePolygonFeature: () => null,
                                bufferDistances: () => [100, 500, 1000],
                                fileName: () => "test",
                                columns: () => [],
                                rows: () => [],
                                gfiResults: () => [],
                                isLoading: () => false,
                                initialized: () => true,
                                layersToRequest: () => [
                                    {id: "123", name: "Custom Layer Name"},
                                    {id: "456"}
                                ],
                                layerResults: () => [
                                    {layerId: "123", layerName: "Original Layer Name", rows: []},
                                    {layerId: "456", layerName: "Another Layer", rows: []},
                                    {layerName: "Layer Without ID", rows: []}
                                ],
                                itemsPerPage: () => 10,
                                previousGeometry: () => null,
                                additionalRequests: () => [],
                                additionalRequestResults: () => [],
                                currentFormat: () => "PDF",
                                shownFormatList: () => ["PDF", "PDF", "DOC", "JSON"],
                                bufferedFeature: () => null,
                                showBuffer: () => true,
                                tableData: () => ({}),
                                printServerUrl: () => "https://print-server.example.com",
                                printConfigPath: () => "/resources/printConfig.json",
                                printUtilsPath: () => "/resources/printUtils.js",
                                bufferHint: sinon.stub()
                            },
                            actions: {
                                initCombinedGfi: initSpy,
                                fetchGfiData: mapActionsSpy,
                                fetchGfiDataFromClickCoordinates: mapActionsSpy,
                                handleAlternativeGeometry: mapActionsSpy,
                                resetBufferLayer: mapActionsSpy,
                                fetchAdditionalRequests: mapActionsSpy,
                                exportTo: mapActionsSpy,
                                queryBufferedFeatures: mapActionsSpy,
                                cleanup: mapActionsSpy
                            },
                            mutations: {
                                setCurrentFormat: mapMutationsSpy,
                                setBufferedFeature: mapMutationsSpy,
                                setLayerResults: mapMutationsSpy,
                                setPreviousGeometry: mapMutationsSpy,
                                setFileName: mapMutationsSpy
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: mapActionsSpy
                    }
                }
            }
        });

        const olFeature = new Feature({geometry: new Point([565874, 5934140])}),
            featureMock = {getOlFeature: () => olFeature, getTheme: () => olFeature.getTheme()};

        /**
         * Simple translation function for tests
         * @param {String} key - Translation key
         * @returns {String} The key itself for testing
         */
        function t (key) {
            return key;
        }

        olFeature.getTheme = () => ({
            params: {
                layersToRequest: [],
                additionalRequests: [],
                showBuffer: true,
                bufferDistances: [100, 500, 1000]
            }
        });

        wrapper = shallowMount(CombinedGfi, {
            global: {
                plugins: [store],
                mocks: {
                    $t: t
                }
            },
            props: {
                feature: featureMock
            }
        });
    });

    afterEach(() => {
        global.mapCollection = originalMapCollection;
        wrapper.unmount();
    });

    it("renders the CombinedGfi component", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("initializes on creation", async () => {
        const localWrapper = shallowMount(CombinedGfi, {
            global: {
                plugins: [store],
                mocks: {
                    $t: (key) => key
                }
            },
            props: {
                feature: {
                    getOlFeature: () => new Feature({
                        geometry: new Point([565874, 5934140])
                    }),
                    getTheme: () => ({
                        params: {
                            layersToRequest: [],
                            additionalRequests: [],
                            showBuffer: true,
                            bufferDistances: [100, 500, 1000]
                        }
                    })
                }
            }
        });

        await localWrapper.vm.$nextTick();
        await localWrapper.vm.$nextTick();

        expect(initSpy.called).to.be.true;
        localWrapper.unmount();
    });

    it("calculates total pages correctly", () => {
        const rows = new Array(25);

        expect(wrapper.vm.totalPages(rows)).to.equal(3);
    });

    it("paginates features correctly", () => {
        const rows = new Array(25).fill().map((_, i) => ({id: i})),
            page1 = wrapper.vm.paginatedFeatures(rows, 1),
            page2 = wrapper.vm.paginatedFeatures(rows, 2);

        expect(page1.length).to.equal(10);
        expect(page1[0].id).to.equal(0);

        expect(page2.length).to.equal(10);
        expect(page2[0].id).to.equal(10);
    });

    it("calls exportTo action when exportData is called", async () => {
        const dispatchSpy = sinon.spy(wrapper.vm.$store, "dispatch");

        await wrapper.vm.exportData();

        expect(dispatchSpy.calledWith("Modules/CombinedGfi/exportTo", "PDF")).to.be.true;
    });

    it("gets the correct layer display name from config", () => {
        const layerResult = {layerId: "123", layerName: "Original Layer Name"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        expect(displayName).to.equal("Custom Layer Name");
    });

    it("falls back to original layer name when no config name is available", () => {
        const layerResult = {layerId: "456", layerName: "Another Layer"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        expect(displayName).to.equal("Another Layer");
    });

    it("handles layer results without layerId", () => {
        const layerResult = {layerName: "Layer Without ID"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        expect(displayName).to.equal("Layer Without ID");
    });

    it("changes page correctly and updates Vuex store", () => {
        const commitSpy = sinon.spy(wrapper.vm.$store, "commit");

        wrapper.vm.$store.state.Modules.CombinedGfi.layerResults = [
            {
                layerId: "123",
                layerName: "Test Layer",
                rows: new Array(25).fill().map((_, i) => ({id: i})),
                page: 1,
                tempPage: 1
            }
        ];

        wrapper.vm.changePage(0, 2);

        expect(commitSpy.calledWith("Modules/CombinedGfi/setLayerResults")).to.be.true;
        expect(commitSpy.getCall(0)).to.not.be.null;
        expect(commitSpy.getCall(0).args[1][0].page).to.equal(2);
        expect(commitSpy.getCall(0).args[1][0].tempPage).to.equal(2);
    });

    it("handles missing layer result", () => {
        const displayName = wrapper.vm.getLayerDisplayName(null);

        expect(displayName).to.equal("additional:modules.combinedGfi.unknownLayer");
    });

    it("cleans up on unmount", () => {
        const cleanupSpy = sinon.spy(wrapper.vm, "cleanup");

        wrapper.unmount();

        expect(cleanupSpy.called).to.be.true;
    });

    it("renders accordion components with correct props", () => {
        const additionalRequestsAccordion = wrapper.findComponent({name: "AdditionalRequestsAccordion"}),
            printAccordion = wrapper.findComponent({name: "PrintAccordion"}),
            exportAccordion = wrapper.findComponent({name: "ExportAccordion"});

        expect(additionalRequestsAccordion.exists()).to.be.true;
        expect(printAccordion.exists()).to.be.true;
        expect(exportAccordion.exists()).to.be.true;

        expect(additionalRequestsAccordion.props("additionalRequestResults")).to.deep.equal([]);
        expect(typeof additionalRequestsAccordion.props("translateFunction")).to.equal("function");

        expect(printAccordion.props("printConfigPath")).to.equal("/resources/printConfig.json");
        expect(printAccordion.props("hasSelectedFeature")).to.be.true;
        expect(typeof printAccordion.props("translateFunction")).to.equal("function");

        expect(exportAccordion.props("fileName")).to.equal("test");
        expect(exportAccordion.props("currentFormat")).to.equal("PDF");
        expect(typeof exportAccordion.props("translateFunction")).to.equal("function");
    });

    it("handles buffer selection correctly", async () => {
        const localWrapper = shallowMount(CombinedGfi, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: (key) => key
                    }
                },
                props: {
                    feature: {
                        getOlFeature: () => new Feature({
                            geometry: new Point([565874, 5934140])
                        }),
                        getTheme: () => ({
                            params: {
                                layersToRequest: [],
                                additionalRequests: [],
                                showBuffer: true,
                                bufferDistances: [100, 500, 1000]
                            }
                        })
                    }
                }
            }),
            bufferSelect = localWrapper.find("#bufferSelect");

        expect(bufferSelect.exists()).to.be.true;

        localWrapper.unmount();
    });

    it("hides buffer selection when only one buffer is available", async () => {
        const localWrapper = shallowMount({
                ...CombinedGfi,
                computed: {
                    ...CombinedGfi.computed,
                    hasSingleBufferDistance: () => true
                }
            }, {
                global: {
                    plugins: [store],
                    mocks: {
                        $t: (key) => key
                    }
                },
                props: {
                    feature: {
                        getOlFeature: () => new Feature({
                            geometry: new Point([565874, 5934140])
                        }),
                        getTheme: () => ({
                            params: {
                                layersToRequest: [],
                                additionalRequests: [],
                                showBuffer: true,
                                bufferDistances: [100, 500, 1000]
                            }
                        })
                    }
                }
            }),
            bufferSelect = localWrapper.find("#bufferSelect");

        expect(bufferSelect.exists()).to.be.false;

        localWrapper.unmount();
    });

    it("handles print functionality correctly", async () => {
        const fetchStub = sinon.stub(global, "fetch"),
            mockUtilsResponse = {
                ok: true,
                text: () => Promise.resolve(`
                    module.exports = {
                        preparePrintRequest: function() {
                            return {spec: {layout: "A4 Portrait"}};
                        }
                    };
                `)
            },
            consoleErrorStub = sinon.stub(console, "error");

        fetchStub.withArgs("/resources/printUtils.js").resolves(mockUtilsResponse);
        fetchStub.withArgs("./resources/printUtils.js").resolves(mockUtilsResponse);

        fetchStub.withArgs("https://print-server.example.com").resolves({
            ok: true,
            blob: () => Promise.resolve(new Blob()),
            headers: {
                get: () => "filename=\"test.pdf\""
            }
        });

        try {
            await wrapper.vm.handlePrintRequest();

            expect(fetchStub.called).to.be.true;
        }
        finally {
            consoleErrorStub.restore();
            fetchStub.restore();
        }
    });
});
