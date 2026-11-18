import Vuex from "vuex";
import {
    mount
} from "@vue/test-utils";
// import {config, mount, createLocalVue} from "@vue/test-utils";
import AccessibilityAnalysisComponent from "../../../components/AccessibilityAnalysis.vue";
import BaseCard from "@shared/modules/cards/components/BaseCard.vue";
import {createVuetify} from "vuetify";
import AccessibilityAnalysis from "../../../store/index";
import {
    expect
} from "chai";
import sinon from "sinon";
// import data from "./isochronesPoint.json";
import {
    registerProjections
} from "./util.js";
// import Vuetify from "vuetify";
// import Vue from "vue";
// import GeoJSON from "ol/format/GeoJSON";

// Vue.use(Vuetify);

// const localVue = createLocalVue();

// localVue.use(Vuex);

// config.mocks.$t = key => key;

beforeAll(() => {
    registerProjections();
});

describe.skip("AccessibilityAnalysis.vue", () => {
    let store, clearStub, sandbox, sourceStub, addSingleAlertStub, cleanupStub, createIsochronesStub, features;

    const mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            AccessibilityAnalysis: {
                                "name": "translate#additional:modules.tools.vueAddon.title",
                                "icon": "bi-geo"
                            }
                        }
                    }
                }
            }
        },

        featuresMock = [{
            style_: null,
            getProperties: sinon.stub().returns({
                id: "label"
            }),
            getGeometry: sinon.stub().returns({
                getType: () => "Point",
                getCoordinates: () => [0, 0]
            })
        }],

        layersMock = [{
            getSource: () => ({
                getFeatures: sinon.stub().returns(features)
            }),
            get: (id) => {
                if (id === "name") {
                    return "LayerName";
                }
                if (id === "id") {
                    return "LayerId";
                }
                return null;
            }
        }];

    beforeAll(() => {
        global.ShadowRoot = () => "";
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addEventListener: () => sinon.stub()
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        // vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        clearStub = sinon.stub();
        sourceStub = {
            clear: clearStub,
            addFeatures: sinon.stub(),
            getFeatures: sinon.stub().returns([
                []
            ])
        };
        addSingleAlertStub = sinon.stub();
        cleanupStub = sinon.stub();
        createIsochronesStub = sinon.stub();
        features = [...featuresMock];
        AccessibilityAnalysis.actions.getIsochrones = () => createIsochronesStub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        AccessibilityAnalysis,
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                isFeatureDisabled: () => sinon.stub().returns(false),
                                isFeatureActive: () => sinon.stub().returns(true),
                                activeVectorLayerList: sinon.stub().returns(layersMock)
                            }
                        },
                        ScenarioBuilder: {
                            namespaced: true,
                            getters: {
                                scenarioUpdated: () => sinon.stub()
                            }
                        },
                        Routing: {
                            namespaced: true,
                            modules: {
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        routingDirections: () => sinon.stub(),
                                        directionsRouteSource: () => sinon.stub()
                                    }
                                }
                            }
                        },
                        AreaSelector: {
                            namespaced: true,
                            getters: {
                                geometry: sinon.stub()
                            }
                        },
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                boundingGeometry: sinon.stub()
                            }
                        },
                        SelectionManager: {
                            namespaced: true,
                            actions: {
                                addNewSelection: () => sinon.stub()
                            },
                            getters: {
                                activeSelection: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        projectionCode: () => "EPSG:25832",
                        clickCoordinate: () => sinon.stub()
                    },
                    actions: {
                        removeInteraction: () => sinon.stub(),
                        addNewLayerIfNotExists: () => {
                            return Promise.resolve({
                                setVisible: () => sinon.stub(),
                                setZIndex: () => sinon.stub(),
                                setStyle: () => sinon.stub(),
                                setSource: () => sinon.stub(),
                                addEventListener: sinon.stub(),
                                getSource: () => sourceStub
                            });
                        }
                    },
                    mutations: {
                        removeLayerFromMap: () => sinon.stub()
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertStub,
                        cleanup: cleanupStub
                    }
                },
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                },
                GraphicalSelect: {
                    namespaced: true,
                    actions: {
                        featureToGeoJson: () => sinon.stub()
                    }
                },
                MapMarker: {
                    namespaced: true,
                    actions: {
                        placingPointMarker: () => sinon.stub(),
                        removePointMarker: () => sinon.stub()
                    }
                }
            },
            getters: {
                uiStyle: () => true,
                mobile: () => sinon.stub()
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/AccessibilityAnalysis/setActive", true);
    });

    afterEach(function () {
        // component.destroy();
        sandbox.restore();
    });

    it("renders Component", async () => {
        const wrapper = await mount();

        expect(wrapper.find("#accessibilityanalysis").exists()).to.be.true;
        expect(wrapper.find("#accessibilityanalysis").html()).to.not.be.empty;
    });

    it("trigger button without user input", async () => {
        const wrapper = await mount();

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();
        sinon.assert.callCount(addSingleAlertStub, 1);
        expect(addSingleAlertStub.firstCall.args[1]).to.eql(
            {
                content: "<strong>additional:modules.tools.cosi.accessibilityAnalysis.inputReminder</strong>",
                category: "Info",
                displayClass: "info"
            });
    });

    it("trigger button with user input and point selected", async () => {
        const wrapper = await mount([]);

        wrapper.vm.setCoordinate([10.155828082155567, 53.60323024735499]);
        wrapper.vm.setTransportType("driving-car");
        wrapper.vm.setScaleUnit("time");
        wrapper.vm.setDistance("10");
        sourceStub.addFeatures.reset();
        await wrapper.vm.createAnalysisSet();

        expect(wrapper.vm.isochroneFeatures).to.not.be.empty;
        clearStub.reset();
        expect(wrapper.vm.hide).to.be.false;
        wrapper.find("#clear").trigger("click");
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.hide).to.be.true;
    });

    it("trigger button with user input and region selected", async () => {
        const wrapper = await mount(layersMock);

        wrapper.vm.setMode("region");
        wrapper.vm.setTransportType("driving-car");
        wrapper.vm.setScaleUnit("time");
        wrapper.vm.setDistance("10");
        wrapper.vm.setSelectedFacilityNames(["LayerName"]);
        await wrapper.vm.createAnalysisSet();

        expect(wrapper.vm.isochroneFeatures).to.not.be.empty;
        clearStub.reset();

        // check no update on equal coordinates
        expect(wrapper.vm.askUpdate).to.be.false;
        wrapper.vm.tryUpdateIsochrones();
        expect(wrapper.vm.askUpdate).to.be.false;

        features.push({
            style_: null,
            getProperties: sinon.stub().returns({
                id: "label"
            }),
            getGeometry: sinon.stub().returns({
                getType: () => "Point",
                getCoordinates: () => [1, 1]
            })
        });
        wrapper.vm.tryUpdateIsochrones();
        expect(wrapper.vm.askUpdate).to.be.true;
    });
});


/**
 * Tests for the two BaseCard components of the visualization options
 * ("merge polygons" / "don't merge polygons").
 */
describe("AccessibilityAnalysis.vue - BaseCard (visualization options)", () => {
    let sandbox, store, exitResultViewStub;

    const twoCards = [
            {id: "card-1", icon: "bi bi-geo-alt", label: "Punkt 1", text: "10.0, 53.0"},
            {id: "card-2", icon: "bi bi-geo-alt", label: "Punkt 2", text: "10.1, 53.1"}
        ],

        layerMock = {
            getLayer: () => ({
                setVisible: () => sinon.stub(),
                setZIndex: () => sinon.stub(),
                getSource: () => ({clear: sinon.stub(), getFeatures: () => []})
            })
        };

    /**
     * Creates a minimal store with all modules the component accesses via mapGetters/mapActions.
     * @returns {Vuex.Store} the test store
     */
    function createStore () {
        return new Vuex.Store({
            getters: {
                allLayerConfigs: () => [],
                restServiceById: () => () => ({url: "https://example.com"}),
                visibleSubjectDataLayerConfigs: () => []
            },
            modules: {
                Menu: {
                    namespaced: true,
                    getters: {zoomToExtentPadding: () => 0}
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => null,
                        getVisibleLayerList: () => [],
                        projectionCode: () => "EPSG:25832"
                    },
                    actions: {
                        addInteraction: () => sinon.stub(),
                        removeInteraction: () => sinon.stub(),
                        zoomToExtent: () => sinon.stub(),
                        placingPointMarker: () => sinon.stub(),
                        removePointMarker: () => sinon.stub(),
                        removePointMarkerFeature: () => sinon.stub()
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: () => sinon.stub(),
                        cleanup: () => sinon.stub()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        AccessibilityAnalysis: {...AccessibilityAnalysis, namespaced: true},
                        Language: {
                            namespaced: true,
                            getters: {currentLocale: () => "de-DE"}
                        },
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                boundingGeometry: () => null,
                                selectedDistrictNames: () => [],
                                selectionCardsStatisticalData: () => [],
                                selectionCardsSubjectData: () => []
                            },
                            mutations: {setBoundingGeometry: () => sinon.stub()}
                        },
                        Routing: {
                            namespaced: true,
                            modules: {
                                Directions: {
                                    namespaced: true,
                                    getters: {
                                        directionsRouteSource: () => null,
                                        directionsRouteLayer: () => null,
                                        routingDirections: () => null,
                                        settings: () => ({speedProfile: "CAR"})
                                    },
                                    actions: {reset: () => sinon.stub()},
                                    mutations: {setRoutingDirections: () => sinon.stub()}
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Mounts the component with the real BaseCard and stubbed child components.
     * @param {Object[]} [selectionCards=twoCards] the selection cards to set
     * @returns {Promise<import("@vue/test-utils").VueWrapper>} the mounted wrapper
     */
    async function mountComponent (selectionCards = twoCards) {
        const passThrough = {template: "<div><slot /></div>"},
            wrapper = mount(AccessibilityAnalysisComponent, {
                global: {
                    plugins: [store, createVuetify()],
                    mocks: {$t: key => key},
                    stubs: {
                        ToolInfo: true,
                        TabBar: true,
                        InputText: true,
                        DropdownAutocomplete: true,
                        AlertMessage: true,
                        SimpleCard: true,
                        SwitchInput: true,
                        ButtonGroup: true,
                        FlatButton: true,
                        IconButton: true,
                        LabeledSlider: true,
                        ResultManagement: true,
                        VSnackbar: true,
                        AccordionItem: passThrough,
                        VExpandTransition: passThrough
                    }
                }
            });

        await wrapper.setData({selectionCards});
        await wrapper.vm.$nextTick();
        return wrapper;
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        store = createStore();

        // Neutralize the component's lifecycle and map dependencies
        exitResultViewStub = sandbox.stub(AccessibilityAnalysisComponent.methods, "exitResultView");
        sandbox.stub(AccessibilityAnalysisComponent.methods, "getLayerById").returns(layerMock);
        sandbox.stub(AccessibilityAnalysisComponent.methods, "setSelectInteraction");
        sandbox.stub(AccessibilityAnalysisComponent.methods, "getVisibleVectorLayers").returns([]);
        sandbox.stub(AccessibilityAnalysisComponent.methods, "generateCardTitle").returns("Analyse A");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Visibility", () => {
        it("renders two BaseCards when at least two selection cards exist", async () => {
            const wrapper = await mountComponent();

            expect(wrapper.findAllComponents(BaseCard)).to.have.lengthOf(2);
        });

        it("renders no BaseCard when fewer than two selection cards exist", async () => {
            const wrapper = await mountComponent([twoCards[0]]);

            expect(wrapper.findAllComponents(BaseCard)).to.have.lengthOf(0);
        });

        it("renders no BaseCard without selection cards", async () => {
            const wrapper = await mountComponent([]);

            expect(wrapper.findAllComponents(BaseCard)).to.have.lengthOf(0);
        });

        it("hides the BaseCards when the outer boundaries are used", async () => {
            const wrapper = await mountComponent();

            store.commit("Modules/AccessibilityAnalysis/setUseOuterBoundaries", true);
            await wrapper.vm.$nextTick();

            expect(wrapper.findAllComponents(BaseCard)).to.have.lengthOf(0);
        });
    });

    describe("Rendering", () => {
        it("sets hoverable and role=button on both cards", async () => {
            const wrapper = await mountComponent(),
                cards = wrapper.findAllComponents(BaseCard);

            cards.forEach(card => {
                expect(card.attributes("role")).to.equal("button");
                expect(card.props("hoverable")).to.be.true;
            });
        });

        it("shows icon, title and description for 'merge' in the first card", async () => {
            const wrapper = await mountComponent(),
                card = wrapper.findAllComponents(BaseCard)[0];

            expect(card.find("i.bi-union").exists()).to.be.true;
            expect(card.text()).to.contain("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.mergePolygons");
            expect(card.text()).to.contain("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.mergePolygonsInfo");
        });

        it("shows icon, title and description for 'don't merge' in the second card", async () => {
            const wrapper = await mountComponent(),
                card = wrapper.findAllComponents(BaseCard)[1];

            expect(card.find("i.bi-subtract").exists()).to.be.true;
            expect(card.text()).to.contain("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.dontMergePolygons");
            expect(card.text()).to.contain("additional:modules.tools.cosi.accessibilityAnalysis.visualizationOptions.dontMergePolygonsInfo");
        });
    });

    describe("Selection", () => {
        it("has mergePolygons=true initially and marks only the first card as active", async () => {
            const wrapper = await mountComponent(),
                cards = wrapper.findAllComponents(BaseCard);

            expect(wrapper.vm.mergePolygons).to.be.true;
            expect(cards[0].classes()).to.include("card-active");
            expect(cards[1].classes()).to.not.include("card-active");
        });

        it("switches to mergePolygons=false on click on the second card and calls exitResultView", async () => {
            const wrapper = await mountComponent();

            await wrapper.findAllComponents(BaseCard)[1].trigger("click");

            expect(wrapper.vm.mergePolygons).to.be.false;
            sinon.assert.callCount(exitResultViewStub, 1);

            const cards = wrapper.findAllComponents(BaseCard);

            expect(cards[0].classes()).to.not.include("card-active");
            expect(cards[1].classes()).to.include("card-active");
        });

        it("switches back to mergePolygons=true on click on the first card again", async () => {
            const wrapper = await mountComponent();

            await wrapper.findAllComponents(BaseCard)[1].trigger("click");
            await wrapper.findAllComponents(BaseCard)[0].trigger("click");

            expect(wrapper.vm.mergePolygons).to.be.true;
            sinon.assert.callCount(exitResultViewStub, 2);
        });

        it("keeps the selection on click on the already active card (mandatory) but still calls exitResultView", async () => {
            const wrapper = await mountComponent();

            await wrapper.findAllComponents(BaseCard)[0].trigger("click");

            expect(wrapper.vm.mergePolygons).to.be.true;
            expect(wrapper.findAllComponents(BaseCard)[0].classes()).to.include("card-active");
            sinon.assert.callCount(exitResultViewStub, 1);
        });
    });
});
