import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import AccordionItem from "../../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "../../../../../src/shared/modules/buttons/components/FlatButton.vue";
import FloodRiskManagementComponent from "../../../components/FloodRiskManagement.vue";
import FloodRiskManagementCard from "../../../components/FloodRiskManagementCard.vue";
import FloodRiskManagementSwitcher from "../../../components/FloodRiskManagementSwitcher.vue";
import sinon from "sinon";
import SwitchInput from "../../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";

config.global.mocks.$t = key => key;

describe("addons/floodRiskManagement/components/FloodRiskManagement.vue", () => {
    const mockMapGetters = {
            scale: sinon.stub()
        },
        cycles = {
            "1. Zyklus": {
                "layers": [
                    {
                        "layerId": [
                            "1043"
                        ],
                        "printId": "gbh"
                    },
                    {
                        "layerId": [
                            "2427"
                        ],
                        "printId": "gbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gbs"
                    },
                    {
                        "layerId": [
                            "15684"
                        ],
                        "printId": "gsh"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gsm"
                    },
                    {
                        "layerId": [
                            "15609"
                        ],
                        "printId": "gss"
                    },
                    {
                        "layerId": [
                            "15590"
                        ],
                        "printId": "rbh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "rbs"
                    },
                    {
                        "layerId": [
                            "15615"
                        ],
                        "printId": "rsh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rsm"
                    },
                    {
                        "layerId": [
                            "15612"
                        ],
                        "printId": "rss"
                    }
                ],
                "verification": "22.12.2013"
            },
            "2. Zyklus": {
                "layers": [
                    {
                        "layerId": [
                            "1043"
                        ],
                        "printId": "gbh"
                    },
                    {
                        "layerId": [
                            "2427"
                        ],
                        "printId": "gbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gbs"
                    },
                    {
                        "layerId": [
                            "15684"
                        ],
                        "printId": "gsh"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gsm"
                    },
                    {
                        "layerId": [
                            "15609"
                        ],
                        "printId": "gss"
                    },
                    {
                        "layerId": [
                            "15590"
                        ],
                        "printId": "rbh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "rbs"
                    },
                    {
                        "layerId": [
                            "15615"
                        ],
                        "printId": "rsh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rsm"
                    },
                    {
                        "layerId": [
                            "15612"
                        ],
                        "printId": "rss"
                    }
                ],
                "verification": "22.12.2019"
            },
            "3. Zyklus": {
                "layers": [
                    {
                        "layerId": [
                            "1043"
                        ],
                        "printId": "gbh"
                    },
                    {
                        "layerId": [
                            "2427"
                        ],
                        "printId": "gbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gbs"
                    },
                    {
                        "layerId": [
                            "15684"
                        ],
                        "printId": "gsh"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "gsm"
                    },
                    {
                        "layerId": [
                            "15609"
                        ],
                        "printId": "gss"
                    },
                    {
                        "layerId": [
                            "15590"
                        ],
                        "printId": "rbh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rbm"
                    },
                    {
                        "layerId": [
                            "15623"
                        ],
                        "printId": "rbs"
                    },
                    {
                        "layerId": [
                            "15615"
                        ],
                        "printId": "rsh"
                    },
                    {
                        "layerId": [
                            "15594"
                        ],
                        "printId": "rsm"
                    },
                    {
                        "layerId": [
                            "15612"
                        ],
                        "printId": "rss"
                    }
                ],
                "verification": "22.12.2025"
            }
        },
        events = {
            "Binnenhochwasser": {
                "Häufig H": "10-jährliches Ereignis (H für High)",
                "Mittel M": "100-jährliches Ereignis (M für Middle)",
                "Extrem E": "200-jährliches Ereignis (L für Low)"
            },
            "Küstenhochwasser": {
                "Häufig H": "20-jährliches Ereignis (H für High)",
                "Mittel M": "100-jährliches Ereignis (M für Middle)",
                "Extrem E": "Extremereignis (L für Low)"
            }
        },
        mappedLayerGroup = {
            "gbh": {
                "event": "Binnenhochwasser",
                "frequency": "Häufig H",
                "type": "Hochwassergefahrenkarte"
            },
            "gbm": {
                "event": "Binnenhochwasser",
                "frequency": "Mittel M",
                "type": "Hochwassergefahrenkarte"
            },
            "gbs": {
                "event": "Binnenhochwasser",
                "frequency": "Extrem E",
                "type": "Hochwassergefahrenkarte"
            },
            "gsh": {
                "event": "Küstenhochwasser",
                "frequency": "Häufig H",
                "type": "Hochwassergefahrenkarte"
            },
            "gsm": {
                "event": "Küstenhochwasser",
                "frequency": "Mittel M",
                "type": "Hochwassergefahrenkarte"
            },
            "gss": {
                "event": "Küstenhochwasser",
                "frequency": "Extrem E",
                "type": "Hochwassergefahrenkarte"
            },
            "rbh": {
                "event": "Binnenhochwasser",
                "frequency": "Häufig H",
                "type": "Hochwasserrisikokarte"
            },
            "rbm": {
                "event": "Binnenhochwasser",
                "frequency": "Mittel M",
                "type": "Hochwasserrisikokarte"
            },
            "rbs": {
                "event": "Binnenhochwasser",
                "frequency": "Extrem E",
                "type": "Hochwasserrisikokarte"
            },
            "rsh": {
                "event": "Küstenhochwasser",
                "frequency": "Häufig H",
                "type": "Hochwasserrisikokarte"
            },
            "rsm": {
                "event": "Küstenhochwasser",
                "frequency": "Mittel M",
                "type": "Hochwasserrisikokarte"
            },
            "rss": {
                "event": "Küstenhochwasser",
                "frequency": "Extrem E",
                "type": "Hochwasserrisikokarte"
            }
        },
        types = [
            {
                type: "Hochwassergefahrenkarte",
                text: "Die Gefahrenkarten stellen das Ausmaß der Hochwasserereignisse in Form der Ausdehnung und der sich einstellenden Wassertiefen dar.",
                icon: "bi bi-water"
            },
            {
                type: "Hochwasserrisikokarte",
                text: "Die Risikokarten zeigen, wie die betroffenen Flächen genutzt werden, die Lage von Industrieanlagen und Schutzgütern sowie die Anzahl der potenziell betroffenen Einwohner.",
                icon: "bi bi-buildings"
            }
        ];


    let store,
        wrapper,
        map = null;

    beforeAll(() => {
        map = {
            id: "ol",
            mode: "2D",
            render: sinon.spy(),
            updateSize: sinon.spy(),
            getLayers: sinon.spy(),
            getResolutionByScale: () => sinon.stub()
        };

        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        FloodRiskManagement: {
                            namespaced: true,
                            getters: {
                                autoAdjustScale: () => true,
                                cycleId: () => "3",
                                cycles: () => cycles,
                                eventListener: () => undefined,
                                events: () => events,
                                isPrinting: () => false,
                                isScaleSelectedManually: () => false,
                                layoutList: () => [],
                                layoutMapInfo: () => [],
                                mappedLayerGroup: () => mappedLayerGroup,
                                maskStarted: () => false,
                                printDisabled: () => true,
                                printHwsId: () => "gbm",
                                printLayerList: () => [],
                                printServiceId: () => "mapfish",
                                printUrl: () => "http://",
                                selectedCycleName: () => "",
                                selectedEvent: () => "Küstenhochwasser",
                                selectedFrequency: () => "Extrem E",
                                selectedType: () => "Hochwassergefahrenkarte",
                                scaleList: () => [],
                                types: () => types,
                                visibleLayerList: () => []
                            },
                            mutations: {
                                setAutoAdjustScale: sinon.stub(),
                                setCurrentScale: sinon.stub(),
                                setCycleId (state, value) {
                                    state.cycleId = value;
                                },
                                setIsScaleSelectedManually: sinon.stub(),
                                setMaskStarted (state, value) {
                                    state.maskStarted = value;
                                },
                                setPrintDisabled (state, value) {
                                    state.printDisabled = value;
                                },
                                setPrintHwsId (state, value) {
                                    state.printHwsId = value;
                                },
                                setPrintLayerList: sinon.stub(),
                                setPrintStarted: sinon.stub(),
                                setPrintUrl (state, value) {
                                    state.printUrl = value;
                                },
                                setSelectedCycleName: sinon.stub(),
                                setSelectedEvent (state, value) {
                                    state.selectedEvent = value;
                                },
                                setSelectedFrequency (state, value) {
                                    state.selectedFrequency = value;
                                },
                                setSelectedType (state, value) {
                                    state.selectedType = value;
                                }
                            },
                            actions: {
                                getOptimalResolution: () => sinon.stub(),
                                retrieveCapabilites: () => sinon.stub(),
                                startPrint: () => sinon.stub(),
                                togglePostrenderListener: () => sinon.stub(),
                                updateCanvasLayer: () => sinon.stub()
                            }
                        },
                        LayerSelection: {
                            namespaced: true,
                            actions: {
                                changeVisibility: sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: mockMapGetters
                }
            }
        });

        wrapper = mount(FloodRiskManagementComponent, {
            global: {
                plugins: [store]
            }
        });
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("should render accordion", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent(AccordionItem).exists()).to.be.true;
        });
        it("should render cycle switcher", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementSwitcher).at(0).attributes().class).to.equal("cycle-switch");
        });
        it("should render map type cards", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementCard).at(0).attributes().id).to.equal("map-type0");
        });
        it("should render flood event switcher", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementSwitcher).at(1).attributes().class).to.equal("event-switch");
        });
        it("should render frequency cards", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementCard).at(3).attributes().id).to.equal("card-Frequency1");
        });
        it("should render dropdown", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("#printScale").exists()).to.be.true;
        });
        it("should render switch", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent(SwitchInput).exists()).to.be.true;
        });
        it("should render settings button", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FlatButton).at(0).attributes().id).to.equal("settingsBtn");
        });
        it("should render print button", () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findAllComponents(FlatButton).at(1).attributes().text).to.equal("additional:modules.floodRiskManagement.button.downloadLabel");
        });
    });

    describe("Methods", () => {
        describe("getPrintHwsId", () => {
            it("should return empty string", () => {
                wrapper = shallowMount(FloodRiskManagementComponent, {
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getPrintHwsId(null, null, null)).to.equal("");
                expect(wrapper.vm.getPrintHwsId(null, "", null)).to.equal("");
                expect(wrapper.vm.getPrintHwsId(null, "", "")).to.equal("");
            });
            it("should return the PrintHwsId", () => {
                wrapper = shallowMount(FloodRiskManagementComponent, {
                    global: {
                        plugins: [store]
                    }
                });

                expect(wrapper.vm.getPrintHwsId("Binnenhochwasser", "Mittel M", "Hochwassergefahrenkarte")).to.equal("gbm");
            });
        });

        describe("returnScale", () => {
            it("should return an empty string if anything but a number is given", () => {
                expect(wrapper.vm.returnScale(undefined)).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale(null)).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale("string")).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale(true)).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale(false)).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale([])).to.be.a("string").and.to.be.empty;
                expect(wrapper.vm.returnScale({})).to.be.a("string").and.to.be.empty;
            });
            it("should return the given scale untouched if any number below 10.000 is given", () => {
                expect(wrapper.vm.returnScale(9999)).to.equal("9999");
                expect(wrapper.vm.returnScale(1)).to.equal("1");
                expect(wrapper.vm.returnScale(0)).to.equal("0");
                expect(wrapper.vm.returnScale(-1)).to.equal("-1");
                expect(wrapper.vm.returnScale(-999999)).to.equal("-999999");
            });
            it("should return the given scale with spaces as thousands separators if any number above 9.999 is given", () => {
                expect(wrapper.vm.returnScale(10000)).to.equal("10 000");
                expect(wrapper.vm.returnScale(999999)).to.equal("999 999");
                expect(wrapper.vm.returnScale(1000000)).to.equal("1 000 000");
            });
        });

        describe("togglePrintButton", () => {
            it("should set the maskStarted and printDisabled value", async () => {
                wrapper = shallowMount(FloodRiskManagementComponent, {
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.togglePrintButton();
                await wrapper.vm.$nextTick();

                expect(store.state.Modules.FloodRiskManagement.maskStarted).to.be.true;
                expect(store.state.Modules.FloodRiskManagement.printDisabled).to.be.false;
            });
        });
    });

    describe("watcher", () => {
        it("should set the cycle id when selectedCycleName is changed.", async () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$options.watch.selectedCycleName.call(wrapper.vm, "2. Zyklus");
            await wrapper.vm.$nextTick();
            expect(store.state.Modules.FloodRiskManagement.cycleId).to.equal("2");
        });

        it("should set the SelectedFrequency when selectedEvent is changed", async () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$options.watch.selectedEvent.call(wrapper.vm, "Binnenhochwasser");
            await wrapper.vm.$nextTick();
            expect(store.state.Modules.FloodRiskManagement.selectedFrequency).to.equal("Mittel M");
        });

        it("should set the printHwsId when selectedEvent is changed", async () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$options.watch.selectedEvent.call(wrapper.vm, "Küstenhochwasser");
            await wrapper.vm.$nextTick();
            expect(store.state.Modules.FloodRiskManagement.printHwsId).to.equal("gss");
        });

        it("should set the printHwsId when selectedFrequency is changed", async () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$options.watch.selectedFrequency.call(wrapper.vm, "Häufig H");
            await wrapper.vm.$nextTick();
            expect(store.state.Modules.FloodRiskManagement.printHwsId).to.equal("gsh");
        });

        it("should set the printHwsId when selectedType is changed", async () => {
            wrapper = shallowMount(FloodRiskManagementComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.$options.watch.selectedType.call(wrapper.vm, "Hochwassergefahrenkarte");
            await wrapper.vm.$nextTick();
            expect(store.state.Modules.FloodRiskManagement.printHwsId).to.equal("gss");
        });
    });
});
