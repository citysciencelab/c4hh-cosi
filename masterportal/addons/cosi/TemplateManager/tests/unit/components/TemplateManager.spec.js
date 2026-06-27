// import {config, mount, createLocalVue} from "@vue/test-utils";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
// import TemplateManager from "../../../components/TemplateManager.vue";
import TemplateManagerStore from "../../../store/indexTemplateManager";
// import Vuetify from "vuetify";
import sinon from "sinon";
// import Vue from "vue";
import mapping from "./mock.mapping.json";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// Vue.use(Vuetify);
// localVue.use(Vuex);

describe.skip("addons/cosi/TemplateManager/components/TemplateManager.vue", () => {
    let vuetify, store, stubSetMapping, layerListStub;

    const TemplateManager = undefined,
        factory = {
            getMount: () => {
                return mount(TemplateManager, {
                    store,
                    // localVue,
                    vuetify,
                    stubs: ["VChipGroup"],
                    computed: {
                        name: () => "Hallo",
                        renderToWindow: () => true,
                        resizableWindow: () => false,
                        deactivateGFI: () => true,
                        active: () => true,
                        icon: () => "bi-image"
                    }
                });
            }
        };

    beforeEach(() => {
        // vuetify = new Vuetify();
        stubSetMapping = sinon.stub();
        layerListStub = sinon.stub();
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        TemplateManager: TemplateManagerStore,
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                districtLevels: () => [],
                                active: () => false,
                                selectedDistrictNames: () => []
                            },
                            mutations: {
                                setMapping: stubSetMapping
                            }
                        }
                    }
                },
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de"
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: () => sinon.stub()
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        getVisibleLayerList: layerListStub.returns([{
                            getProperties: () => ({id: "1111"})
                        }])
                    }
                }
            },
            getters: {
                uiStyle: () => true,
                mobile: () => sinon.stub()
            }
        });
        TemplateManager.methods.loadTemplates = () => sinon.stub();
    });

    describe("DOM", () => {
        it("should find button with icon 'bi-file-text'", async () => {
            const wrapper = factory.getMount();

            expect(wrapper.find("button .bi-file-text").exists()).to.be.true;
        });

        it("should not find template 'TemplateManagerExport'", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                showExportWindow: false
            });
            expect(wrapper.findComponent({name: "TemplateManagerExport"}).exists()).to.be.false;
        });

        it("should find template 'TemplateManagerExport'", async () => {
            const wrapper = factory.getMount(),
                templates = [{
                    meta: {
                        title: "one",
                        isActive: false,
                        created: "01.01."
                    }
                },
                {
                    meta: {
                        title: "two",
                        isActive: true,
                        created: "01.01."
                    }
                }],
                saveTemplate = [
                    {
                        name: "two",
                        statsCategories: ["cat1"]
                    }
                ];

            await wrapper.setData({
                showExportWindow: true,
                isTemplateActive: true,
                templates,
                saveTemplate,
                selectedTemplateName: "two"
            });
            wrapper.vm.$nextTick();
            expect(wrapper.findComponent({name: "TemplateManagerExport"}).exists()).to.be.true;
        });
        it("should find TemplateManagerCard Component", async () => {
            const wrapper = factory.getMount(),
                templates = [{
                    meta: {
                        title: "one",
                        isActive: false,
                        created: "01.01."
                    }
                },
                {
                    meta: {
                        title: "two",
                        isActive: true,
                        created: "01.01."
                    }
                }],
                saveTemplate = [
                    {
                        name: "two",
                        statsCategories: ["cat1"]
                    }
                ];

            await wrapper.setData({
                showExportWindow: true,
                templates,
                saveTemplate,
                selectedTemplateName: "two"
            });
            expect(wrapper.findComponent({name: "TemplateManagerCard"}).exists()).to.be.true;
        });
        it("should not render export view if selected template is not activated but showExportView is true", async () => {
            const wrapper = factory.getMount(),
                templates = [{
                    meta: {
                        title: "one",
                        isActive: false,
                        created: "01.01."
                    }
                },
                {
                    meta: {
                        title: "two",
                        isActive: true,
                        created: "01.01."
                    }
                }];

            await wrapper.setData({
                showExportWindow: true,
                templates,
                selectedTemplateName: "two"
            });

            wrapper.vm.selectCard("one");
            expect(wrapper.vm.showExportWindow).to.be.false;
        });
    });

    describe("Computed Properties", () => {
        const templates = [{
            meta: {
                title: "one",
                isActive: false,
                created: "01.01."
            }
        },
        {
            meta: {
                title: "two",
                isActive: false,
                created: "01.01."
            }
        }];

        it("should update 'hasTemplates' if 'templates' was changed", async () => {
            const wrapper = factory.getMount();

            expect(wrapper.vm.hasTemplates).to.be.false;
            await wrapper.setData({
                templates,
                selectedTemplateName: "two"
            });
            expect(wrapper.vm.hasTemplates).to.be.true;
        });

        it("should update 'selectedTemplate' if 'selectedTemplateName' was changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                templates,
                selectedTemplateName: "two"
            });
            expect(wrapper.vm.selectedTemplate).to.deep.equal(wrapper.vm.templates[1]);
        });

        it("should update 'selectedTemplateIndex' if 'selectedTemplateName' was changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                templates,
                selectedTemplateName: "two"
            });

            expect(wrapper.vm.selectedTemplateIndex).to.be.equal(1);
        });

        it("should update 'activeTemplate' if 'activeTemplateName' was changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                templates
            });

            wrapper.vm.activeTemplateName = "two";

            wrapper.vm.$nextTick();

            expect(wrapper.vm.activeTemplate).to.deep.equal(wrapper.vm.templates[1]);
        });

        it("should update 'activeTemplateIndex' if 'activeTemplateName' was changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                templates
            });

            wrapper.vm.activeTemplateName = "two";

            wrapper.vm.$nextTick();

            expect(wrapper.vm.activeTemplateIndex).to.be.equal(1);
        });

        it("should update 'templateTitles' if 'templates' was changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({
                templates
            });

            expect(wrapper.vm.templateTitles).to.deep.equal(["one", "two"]);
        });
    });

    describe("Methdos", () => {
        describe("createMappingByTemplates", () => {
            const templates = [
                {
                    meta: {
                        isActive: true,
                        created: "01.01.",
                        title: "Vielfalt für alle",
                        time: 1700555383001
                    },
                    state: {
                        Tools: {
                            Dashboard: {
                                statsFeatureFilter: ["Bevölkerung insgesamt", "Bevölkerung ab 65 Jahren", "Diese Statistik gibt es nicht"]
                            }
                        }
                    }
                },
                {
                    meta: {
                        isActive: true,
                        created: "01.01.",
                        title: "Alle für alle",
                        time: 1700555362955
                    },
                    state: {
                        Tools: {
                            Dashboard: {
                                statsFeatureFilter: ["Bevölkerung insgesamt"]
                            }
                        }
                    }
                },
                {
                    meta: {
                        isActive: false,
                        created: "01.01.",
                        title: "Alle für Vielfalt",
                        time: 1700555344885
                    },
                    state: {
                        Tools: {
                            Dashboard: {
                                statsFeatureFilter: ["Bevölkerung insgesamt", "Einwohner je ha", "Diese Statistik gibt es nicht"]
                            }
                        }
                    }
                }
            ];

            it("should call 'setMapping' if this function is called", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    templates
                });
                wrapper.vm.createMappingByTemplates(wrapper.vm.templates, mapping);
                expect(stubSetMapping.calledOnce).to.be.true;
                sinon.restore();
                wrapper.destroy();
            });

            it("should call 'setMapping' with the expected values", async () => {
                const wrapper = factory.getMount(),
                    expectedValues = [
                        {
                            category: "bev_insgesamt",
                            value: "Bevölkerung insgesamt",
                            group: "Vielfalt für alle",
                            valueType: "absolute",
                            stat_gebiet: "31232",
                            stadtteil: "31240",
                            bezirk: "31271"
                        },
                        {
                            category: "bev_ab65",
                            value: "Bevölkerung ab 65 Jahren",
                            group: "Vielfalt für alle",
                            valueType: "absolute",
                            stat_gebiet: "31232",
                            stadtteil: "31240",
                            summable: true,
                            bezirk: "31271"
                        },
                        {
                            category: "bev_insgesamt",
                            value: "Bevölkerung insgesamt",
                            group: "Alle für alle",
                            valueType: "absolute",
                            stat_gebiet: "31232",
                            stadtteil: "31240",
                            bezirk: "31271"
                        }
                    ];

                await wrapper.setData({
                    templates
                });
                wrapper.vm.createMappingByTemplates(wrapper.vm.templates, mapping);
                expect(stubSetMapping.calledWith({}, expectedValues)).to.be.true;
                sinon.restore();
                wrapper.destroy();
            });

            it("should change the group of all stats in the mapping to the title of the template", async () => {
                let newMapping = [],
                    mappingGroup = "";

                const templatesWithNoStats = [
                        {
                            meta: {
                                isActive: true,
                                created: "01.01.",
                                title: "Keine Stats to filter"
                            },
                            state: {
                                Tools: {}
                            }
                        }
                    ],
                    wrapper = factory.getMount();

                await wrapper.setData({
                    templates: templatesWithNoStats
                });
                wrapper.vm.createMappingByTemplates(wrapper.vm.templates, mapping);
                newMapping = stubSetMapping.getCall(0).args[1];
                mappingGroup = newMapping.every(mappingObject => mappingObject.group === "Keine Stats to filter");
                expect(mappingGroup).to.be.true;
                sinon.restore();
                wrapper.destroy();
            });

            it("should call 'setMapping' with the correct values including orientation values", async () => {
                const templatesWithOrientationValues = [
                        {
                            meta: {
                                isActive: true,
                                created: "01.01.",
                                title: "Vielfalt für alle"
                            },
                            state: {
                                Tools: {
                                    Dashboard: {
                                        statsFeatureFilter: ["Bevölkerung insgesamt", "Bevölkerung ab 65 Jahren", "Diese Statistik gibt es nicht"],
                                        orientationValues: [
                                            {
                                                "value": "123",
                                                "statisticName": "Bevölkerung insgesamt"
                                            },
                                            {
                                                "value": "456",
                                                "statisticName": "Bevölkerung ab 65 Jahren"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    wrapper = factory.getMount(),
                    expectedValues = [
                        {
                            category: "bev_insgesamt",
                            value: "Bevölkerung insgesamt",
                            group: "Vielfalt für alle",
                            stat_gebiet: "31232",
                            stadtteil: "31240",
                            bezirk: "31271",
                            valueType: "absolute",
                            orientationValue: "123"
                        },
                        {
                            category: "bev_ab65",
                            value: "Bevölkerung ab 65 Jahren",
                            group: "Vielfalt für alle",
                            stat_gebiet: "31232",
                            stadtteil: "31240",
                            bezirk: "31271",
                            summable: true,
                            valueType: "absolute",
                            orientationValue: "456"
                        }
                    ];

                await wrapper.setData({
                    templates: templatesWithOrientationValues
                });
                wrapper.vm.createMappingByTemplates(wrapper.vm.templates, mapping);
                expect(stubSetMapping.calledWith({}, expectedValues)).to.be.true;
                sinon.restore();
                wrapper.destroy();
            });

        });

        describe("getOrientationValueByStatistic", () => {
            const orientationValues = [
                {
                    "value": "123",
                    "statisticName": "Bevölkerung insgesamt"
                },
                {
                    "value": "789",
                    "statisticName": "Bevölkerung männlich"
                }
            ];

            it("should return the correct orientation value", () => {
                const wrapper = factory.getMount(),
                    orientationValue = wrapper.vm.getOrientationValueByStatistic(orientationValues, "Bevölkerung männlich");

                expect(orientationValue).to.be.equal("789");
                wrapper.destroy();
            });

            it("should return '-' if no orientation value was found", () => {
                const wrapper = factory.getMount(),
                    orientationValue = wrapper.vm.getOrientationValueByStatistic(orientationValues, "Bevölkerung weiblich");

                expect(orientationValue).to.be.equal("-");
                wrapper.destroy();
            });
        });
        describe("checkSelectedDistricts", () => {
            it("should return false.", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.checkSelectedDistricts(0, 0)).to.be.false;
                expect(wrapper.vm.checkSelectedDistricts(null, null)).to.be.false;
                expect(wrapper.vm.checkSelectedDistricts([], [])).to.be.false;
                expect(wrapper.vm.checkSelectedDistricts("", "")).to.be.false;
                expect(wrapper.vm.checkSelectedDistricts(false, false)).to.be.false;
                expect(wrapper.vm.checkSelectedDistricts({}, {})).to.be.false;
                wrapper.destroy();
            });

            it("should return true if there are selected districts.", () => {
                const wrapper = factory.getMount(),
                    selectedDistrict = ["district"];

                expect(wrapper.vm.checkSelectedDistricts(0, selectedDistrict)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(null, selectedDistrict)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts([], selectedDistrict)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts("", selectedDistrict)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(false, selectedDistrict)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts({}, selectedDistrict)).to.be.true;
                wrapper.destroy();
            });

            it("should return true if there are default districts.", () => {
                const wrapper = factory.getMount(),
                    template = {
                        districts: ["district"]
                    };

                expect(wrapper.vm.checkSelectedDistricts(template, 0)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(template, null)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(template, [])).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(template, "")).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(template, false)).to.be.true;
                expect(wrapper.vm.checkSelectedDistricts(template, {})).to.be.true;
            });
        });
        describe("getAllSelectedDataFromTemplate", () => {
            const templateData = [
                    {
                        activeLayer: {
                            "first": {"name": "active1", "id": "123"},
                            "second": {"name": "active2", "id": "456"}
                        },
                        name: "First",
                        category: {
                            "0": "Bevölkerung insgesamt",
                            "1": "Bevölkerung ab 65 Jahren"
                        }
                    },
                    {
                        activeLayer: {
                            "third": {"name": "active3", "id": "123"},
                            "fourth": {"name": "active4", "id": "456"}
                        },
                        name: "Second",
                        category: {
                            "0": "Bevölkerung insgesamt",
                            "1": "Bevölkerung ab 65 Jahren"
                        }
                    }
                ],
                templates = [{
                    meta: {
                        title: "First",
                        isActive: false,
                        created: "01.01."
                    }
                },
                {
                    meta: {
                        title: "Second",
                        isActive: true,
                        created: "01.01."
                    }
                }];

            it("should return all data from one type", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    saveTemplate: templateData,
                    templates,
                    selectedTemplateName: "First"
                });

                wrapper.vm.$nextTick();

                expect(wrapper.vm.getAllSelectedDataFromTemplate("activeLayer")).to.be.deep.equal({
                    "first": {"name": "active1", "id": "123"},
                    "second": {"name": "active2", "id": "456"}
                });
                wrapper.destroy();
            });
            it("should return selected data from one type", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    templates,
                    selectedTemplateName: "First"
                });

                wrapper.vm.setTemplateContents(templateData);

                wrapper.vm.$nextTick();

                expect(wrapper.vm.getAllSelectedDataFromTemplate("activeLayer")).to.be.deep.equal({
                    "first": {"name": "active1", "id": "123"},
                    "second": {"name": "active2", "id": "456"}
                });
                wrapper.destroy();
            });
            it("should return empty object if 'type' is not a string", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    saveTemplate: templateData,
                    templates,
                    selectedTemplateName: "First"
                });

                wrapper.vm.$nextTick();

                expect(wrapper.vm.getAllSelectedDataFromTemplate([])).to.be.deep.equal({});
                expect(wrapper.vm.getAllSelectedDataFromTemplate({})).to.be.deep.equal({});
                expect(wrapper.vm.getAllSelectedDataFromTemplate(null)).to.be.deep.equal({});
                expect(wrapper.vm.getAllSelectedDataFromTemplate(undefined)).to.be.deep.equal({});
                expect(wrapper.vm.getAllSelectedDataFromTemplate(0)).to.be.deep.equal({});
                expect(wrapper.vm.getAllSelectedDataFromTemplate(true)).to.be.deep.equal({});
                wrapper.destroy();
            });
        });
        describe("setSelectedData", () => {
            const templateData = [
                    {
                        activeLayer: {
                            "first": {"name": "active1", "id": "123"},
                            "second": {"name": "active2", "id": "456"}
                        },
                        name: "First",
                        category: {
                            "0": "Bevölkerung insgesamt",
                            "1": "Bevölkerung ab 65 Jahren"
                        }
                    }
                ],
                selected = {"first": {"name": "active1", "id": "123"}};

            it("should set selected data", async () => {
                const wrapper = factory.getMount();

                await wrapper.setData({
                    saveTemplate: templateData,
                    selectedTemplateName: "First"
                });
                wrapper.vm.$nextTick();

                wrapper.vm.setSelectedData(selected, "activeLayer");

                expect(wrapper.vm.templateContents).to.be.deep.equal([
                    {
                        activeLayer: {
                            "first": {"name": "active1", "id": "123"}
                        },
                        name: "First",
                        category: {
                            "0": "Bevölkerung insgesamt",
                            "1": "Bevölkerung ab 65 Jahren"
                        }
                    }
                ]);
                wrapper.destroy();
            });
        });
        describe("activeCard", () => {
            it("should set 'activeTemplateName' and 'currentActiveTemplate' to an empty string", () => {
                const wrapper = factory.getMount();

                sinon.stub(wrapper.vm, "openExportWindow");
                sinon.stub(wrapper.vm, "loadFromTemplate");
                wrapper.vm.setCurrentActiveTemplate("");
                wrapper.vm.activeCard("Moin", false);

                expect(wrapper.vm.currentActiveTemplate).to.be.equal("");
                expect(wrapper.vm.activeTemplateName).to.be.equal("");
                wrapper.destroy();
            });

            it("should not set 'activeTemplateName' and 'currentActiveTemplate' to an empty string", () => {
                const wrapper = factory.getMount();

                sinon.stub(wrapper.vm, "openExportWindow");
                sinon.stub(wrapper.vm, "loadFromTemplate");
                wrapper.vm.setCurrentActiveTemplate("temp");
                wrapper.vm.activeCard("Moin", true);

                expect(wrapper.vm.currentActiveTemplate).to.be.equal("temp");
                expect(wrapper.vm.activeTemplateName).to.be.equal("Moin");
                wrapper.destroy();
            });

            it("should call 'openExportWindow'", () => {
                const wrapper = factory.getMount(),
                    stubOpenExportWindow = sinon.stub(wrapper.vm, "openExportWindow");

                sinon.stub(wrapper.vm, "loadFromTemplate");
                wrapper.vm.activeCard("Moin", false);
                expect(stubOpenExportWindow.calledOnce).to.be.true;
                wrapper.destroy();
            });

            it("should not call 'openExportWindow'", () => {
                const wrapper = factory.getMount(),
                    stubOpenExportWindow = sinon.stub(wrapper.vm, "openExportWindow");

                sinon.stub(wrapper.vm, "loadFromTemplate");
                wrapper.vm.activeCard("Moin", true);
                expect(stubOpenExportWindow.calledOnce).to.be.false;
                wrapper.destroy();
            });
        });
        describe("getActiveLayerIds", () => {
            it("should return empty string", () => {
                const wrapper = factory.getMount();

                expect(wrapper.vm.getActiveLayerIds("")).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds(true)).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds(0)).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds(undefined)).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds(null)).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds({})).to.be.deep.equal([]);
                expect(wrapper.vm.getActiveLayerIds([])).to.be.deep.equal([]);
                wrapper.destroy();
            });

            it("should return layer Id list", () => {
                const wrapper = factory.getMount(),
                    templates = [
                        {
                            meta: {
                                isActive: true
                            },
                            state: {
                                Maps: {
                                    layerIds: [1, 2]
                                }
                            }
                        },
                        {
                            meta: {
                                isActive: true
                            },
                            state: {
                                Maps: {
                                    layerIds: [3, 4]
                                }
                            }
                        },
                        {
                            meta: {
                                isActive: false
                            },
                            state: {
                                Maps: {
                                    layerIds: [3, 4]
                                }
                            }
                        }
                    ];

                expect(wrapper.vm.getActiveLayerIds(templates)).to.be.deep.equal([1, 2, 3, 4]);
                wrapper.destroy();
            });
        });
    });
});
