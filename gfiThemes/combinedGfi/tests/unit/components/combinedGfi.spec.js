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
        // Store original global object
        originalMapCollection = global.mapCollection;

        mapActionsSpy = sinon.spy();
        mapMutationsSpy = sinon.spy();
        initSpy = sinon.spy();

        // Mock mapCollection for the component
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
                                    {layerId: "123", name: "Custom Layer Name"},
                                    {layerId: "456"}
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
                                currentFormat: () => "CSV",
                                shownFormatList: () => ["CSV", "PDF", "DOC", "JSON"],
                                bufferedFeature: () => null,
                                showBuffer: () => true,
                                tableData: () => ({}),
                                printServerUrl: () => "https://print-server.example.com",
                                printConfigPath: () => "/resources/printConfig.json",
                                printUtilsPath: () => "/resources/printUtils.js"
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
                                setBufferedFeature: mapMutationsSpy
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
            featureMock = {getOlFeature: () => olFeature, getTheme: () => olFeature.getTheme()},
            translateMixin = {methods: {translate: (key, options) => t(key, options)}};

        /**
         *
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

        // Mount with the translation mixin
        wrapper = shallowMount(CombinedGfi, {
            global: {
                plugins: [store],
                mocks: {
                    $t: t
                },
                mixins: [translateMixin]
            },
            props: {
                feature: featureMock
            }
        });
    });

    afterEach(() => {
        // Restore original global object
        global.mapCollection = originalMapCollection;
        sinon.restore();
        wrapper.unmount();
    });

    it("renders the CombinedGfi component", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("initializes on creation", async () => {
        // Create a fresh component instance to ensure proper setup
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

        // Wait for the next tick to allow all promises to resolve
        await localWrapper.vm.$nextTick();

        // Add another tick for good measure
        await localWrapper.vm.$nextTick();

        // Now check if initCombinedGfi was called
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
        // Create a spy on the $store.dispatch method
        const dispatchSpy = sinon.spy(wrapper.vm.$store, "dispatch");

        // Call the exportData method
        await wrapper.vm.exportData();

        // Check if the exportTo action was dispatched with the correct format
        expect(dispatchSpy.calledWith("Modules/CombinedGfi/exportTo", "CSV")).to.be.true;
    });

    it("gets the correct layer display name from config", () => {
        const layerResult = {layerId: "123", layerName: "Original Layer Name"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        // Should use the name from layersToRequest config
        expect(displayName).to.equal("Custom Layer Name");
    });

    it("falls back to original layer name when no config name is available", () => {
        const layerResult = {layerId: "456", layerName: "Another Layer"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        // Should fall back to the layerName in layerResult
        expect(displayName).to.equal("Another Layer");
    });

    it("handles layer results without layerId", () => {
        const layerResult = {layerName: "Layer Without ID"},
            displayName = wrapper.vm.getLayerDisplayName(layerResult);

        // Should fall back to the layerName in layerResult
        expect(displayName).to.equal("Layer Without ID");
    });

    it("handles missing layer result", () => {
        const displayName = wrapper.vm.getLayerDisplayName(null);

        // Should return default value
        expect(displayName).to.equal("Unknown Layer");
    });

    it("tries to fetch print utils from fallback paths when primary path fails", async () => {
        const fetchStub = sinon.stub(global, "fetch"),
            tryFetchSpy = sinon.spy(wrapper.vm, "tryFetchPrintUtils");

        // Fail for the initial path
        fetchStub.withArgs("/resources/printUtils.js").rejects(new Error("Network error"));

        // Succeed for a fallback path (e.g., "./resources/printUtils.js")
        fetchStub.withArgs("./resources/printUtils.js").resolves({
            ok: true,
            text: () => Promise.resolve(`
                module.exports = {
                    preparePrintRequest: function() {
                        return {spec: {layout: "A4 Portrait"}};
                    }
                };
            `)
        });

        // Mock other required methods to avoid actual network requests
        wrapper.vm.sendPrintRequestToServer = sinon.stub().resolves({
            ok: true,
            blob: () => Promise.resolve(new Blob()),
            headers: {
                get: () => "filename=\"test.pdf\""
            }
        });
        wrapper.vm.processPrintResponse = sinon.stub().resolves();

        // Call sendPrintRequest which should internally call tryFetchPrintUtils
        await wrapper.vm.sendPrintRequest();

        // Verify that tryFetchPrintUtils was called
        expect(tryFetchSpy.called).to.be.true;
    });

    it("cleans up on unmount", () => {
        // Create a spy on the cleanup method
        const cleanupSpy = sinon.spy(wrapper.vm, "cleanup");

        // Trigger the unmounted hook
        wrapper.unmount();

        // Check if cleanup was called
        expect(cleanupSpy.called).to.be.true;
    });
});
