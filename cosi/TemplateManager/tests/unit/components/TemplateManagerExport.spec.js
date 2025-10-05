import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import Vuex from "vuex";
import {expect} from "chai";
import TemplateManagerExport from "../../../components/TemplateManagerExport.vue";
import Vuetify from "vuetify";
import sinon from "sinon";
import {baseFixedTemplateForHamburg, baseProportionTemplate, mapfishServerConfig} from "../../../js/mapfishUtils";
import PDFMaker from "../../../js/createPdf";
import {Point} from "ol/geom.js";
import Feature from "ol/Feature.js";
import axios from "axios";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/TemplateManager/components/TemplateManagerExport.vue", () => {
    let vuetify;

    const factory = {
        getShallowMount: () => {
            return shallowMount(TemplateManagerExport, {
                vuetify,
                localVue
            });
        }
    };

    beforeEach(() => {
        vuetify = new Vuetify();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
            wrapper.destroy();
        });
        it("should find form", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("form").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should find generate button", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("button .bi-play-circle").exists()).to.be.true;
            wrapper.destroy();
        });

        it("should not find a hint if report title is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein kurzer Titel"
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if report title is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein sehr sehr sehr sehr sehr mega großer langer Titel"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidReportTitle");
            wrapper.destroy();
        });

        it("should not find a hint if selected areas name is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Die 7 Königslanden",
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if selected areas name is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Das Königreich von Berg und Grünem Tal"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidSelectedAreasName");
            wrapper.destroy();
        });

        it("should not find a hint if author is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George R. R. Martin"
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if author is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George Raymond Richard Martin from Bayonne"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidAuthor");
            wrapper.destroy();
        });
    });

    describe("Computed", () => {
        it("should set 'isReportTitleValid' to true, if 'reportTitle' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein kurzer Titel"
            });
            expect(wrapper.vm.isReportTitleValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isReportTitleValid' to false, if 'reportTitle' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein sehr sehr sehr sehr sehr mega großer langer Titel"
            });
            expect(wrapper.vm.isReportTitleValid).to.be.false;
            wrapper.destroy();
        });

        it("should set 'isSelectedAreasNameValid' to true, if 'selectedAreasName' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Die 7 Königslanden"
            });
            expect(wrapper.vm.isSelectedAreasNameValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isSelectedAreasNameValid' to false, if 'selectedAreasName' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Das Königreich von Berg und Grünem Tal"
            });
            expect(wrapper.vm.isSelectedAreasNameValid).to.be.false;
            wrapper.destroy();
        });

        it("should set 'isAuthorValid' to true, if 'author' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George R. R. Martin"
            });
            expect(wrapper.vm.isAuthorValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isAuthorValid' to false, if 'author' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George Raymond Richard Martin from Bayonne"
            });
            expect(wrapper.vm.isAuthorValid).to.be.false;
            wrapper.destroy();
        });
    });

    describe("User Interactions", () => {
        it("should call 'manageProgressBar', if user click the button to create the report", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapper = wrapper.find("button"),
                stubManageProgressBarView = sinon.stub(wrapper.vm, "manageProgressBarView");

            await buttonWrapper.trigger("click");

            expect(stubManageProgressBarView.calledOnce).to.be.true;
            wrapper.destroy();
        });

        it("should set 'showProgressBar' to true, if user click the button to create the report", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapper = wrapper.find("button");

            await buttonWrapper.trigger("click");

            expect(wrapper.vm.showProgressBar).to.be.true;
            wrapper.destroy();
        });
    });

    describe("methods", () => {
        describe("manageProgressBarView", () => {
            it("should set 'showProgressBar' to false", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(false);
                expect(wrapper.vm.showProgressBar).to.be.false;
                wrapper.destroy();
            });

            it("should emit 'toggleTemplateImport' with true, if 'showProgressBar' is false", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(false);
                expect(wrapper.emitted()).to.have.property("toggleTemplateImport");
                expect(wrapper.emitted()["toggleTemplateImport"][0]).to.deep.equal([true]);
                wrapper.destroy();
            });

            it("should set 'showProgressBar' to true", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(true);
                expect(wrapper.vm.showProgressBar).to.be.true;
                wrapper.destroy();
            });

            it("should emit 'toggleTemplateImport' with false, if 'showProgressBar' is true", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(true);
                expect(wrapper.emitted()).to.have.property("toggleTemplateImport");
                expect(wrapper.emitted()["toggleTemplateImport"][0]).to.deep.equal([false]);
                wrapper.destroy();
            });

            it("should call 'createReport', if 'showProgressBar is true", () => {
                const wrapper = factory.getShallowMount(),
                    stubCreateReport = sinon.stub(wrapper.vm, "createReport");

                wrapper.vm.manageProgressBarView(true);
                expect(stubCreateReport.calledOnce).to.be.true;
                wrapper.destroy();
                sinon.restore();
            });
        });
        describe("addOverViewPageToReport", () => {
            const mockGetters = {
                    projection: () => {
                        return {
                            getCode: () => "12345"
                        };
                    }
                }
            let store = new Vuex.Store({
                namespaces: true,
                modules: {
                    Maps: {
                        namespaced: true,
                        getters: mockGetters
                    },
                    Tools: {
                        namespaced: true,
                        modules: {
                            DistrictSelector: {
                                namespaced: true,
                                getters: {
                                    selectedFeatures: () => ["fooo"]
                                }
                            }
                        }
                    }
                }
            });
            it("should call prepareImage with expected params", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                prepareImageStub = sinon.stub(wrapper.vm, "prepareImage").resolves({downloadURL: "", bbox: ""});
                sinon.stub(wrapper.vm, "getProgressValuePerStep");
                sinon.stub(wrapper.vm, "addDetailViewToOverviewPage");
                sinon.stub(PDFMaker.prototype, "addChapterHeadline");
                sinon.stub(PDFMaker.prototype, "addImageByUrl");

                wrapper.vm.pdf = new PDFMaker();
                await wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(prepareImageStub.getCall(0).args[0]).to.be.equal("fooo");
                expect(prepareImageStub.getCall(0).args[1]).to.deep.equal({...baseProportionTemplate});
                expect(prepareImageStub.getCall(0).args[2]).to.be.equal("12345");
                expect(prepareImageStub.getCall(0).args[3]).to.be.equal("overviewMap");
                expect(prepareImageStub.getCall(0).args[4]).to.deep.equal({...mapfishServerConfig});
                wrapper.destroy();
                sinon.restore();
            });
            it("should call prepareImage with other template", async() => {
                const store = new Vuex.Store({
                        namespaces: true,
                        modules: {
                            Maps: {
                                namespaced: true,
                                getters: mockGetters
                            },
                            Tools: {
                                namespaced: true,
                                modules: {
                                    DistrictSelector: {
                                        namespaced: true,
                                        getters: {
                                            selectedFeatures: () => []
                                        }
                                    }
                                }
                            }
                        }
                    }),
                    wrapper = shallowMount(TemplateManagerExport, {
                        vuetify,
                        localVue,
                        store
                    }),
                    prepareImageStub = sinon.stub(wrapper.vm, "prepareImage").resolves({downloadURL: "", bbox: ""});

                sinon.stub(wrapper.vm, "addDetailViewToOverviewPage");
                sinon.stub(wrapper.vm, "getProgressValuePerStep")
                sinon.stub(PDFMaker.prototype, "addChapterHeadline");
                sinon.stub(PDFMaker.prototype, "addImageByUrl");

                wrapper.vm.pdf = new PDFMaker();
                await wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(prepareImageStub.getCall(0).args[0]).to.be.undefined;
                expect(prepareImageStub.getCall(0).args[1]).to.deep.equal({...baseFixedTemplateForHamburg});
                expect(prepareImageStub.getCall(0).args[2]).to.be.equal("12345");
                expect(prepareImageStub.getCall(0).args[3]).to.be.equal("overviewMap");
                expect(prepareImageStub.getCall(0).args[4]).to.deep.equal({...mapfishServerConfig});
                wrapper.destroy();
                sinon.restore();
            });
            it("should call addChapter and addImageByUrl if prepareImage resolves an object", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                addChapterStub = sinon.stub(PDFMaker.prototype, "addChapterHeadline"),
                addImageByUrlStub = sinon.stub(PDFMaker.prototype, "addImageByUrl");

                sinon.stub(wrapper.vm, "getProgressValuePerStep")
                sinon.stub(wrapper.vm, "addDetailViewToOverviewPage");
                sinon.stub(wrapper.vm, "prepareImage").resolves({downloadURL: "test.url.de", bbox: ""});
                wrapper.vm.pdf = new PDFMaker();

                await wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(addChapterStub.getCall(0).args[0]).to.be.equal("Übersichtskarte");
                expect(addImageByUrlStub.getCall(0).args[0]).to.be.equal("test.url.de");
                wrapper.destroy();
                sinon.restore();
            });
        });
        describe("addInfrastructureMapPageToReport", () => {
            const mockGetters = {
                    projection: () => {
                        return {
                            getCode: () => "12345"
                        };
                    }
                }
            let store = new Vuex.Store({
                namespaces: true,
                modules: {
                    Maps: {
                        namespaced: true,
                        getters: mockGetters
                    },
                    Tools: {
                        namespaced: true,
                        modules: {
                            DistrictSelector: {
                                namespaced: true,
                                getters: {
                                    selectedFeatures: () => ["fooo"]
                                }
                            }
                        }
                    }
                }
            });

            it("should call prepareImage with expected params", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                prepareImageStub = sinon.stub(wrapper.vm, "prepareImage").resolves({downloadURL: "", bbox: ""}),
                template = JSON.parse(JSON.stringify(baseProportionTemplate));

                sinon.stub(wrapper.vm, "getProgressValuePerStep");
                sinon.stub(PDFMaker.prototype, "addChapter");
                sinon.stub(PDFMaker.prototype, "addImageByUrl");

                wrapper.vm.templateLayerIds = ["1", "2"];
                template.baseLayer.map.layerIds.unshift("1");
                template.baseLayer.map.layerIds.unshift("2");
                template.baseLayer.map.proportion = 0.99;
                wrapper.vm.pdf = new PDFMaker();
                await wrapper.vm.addInfrastructureMapPageToReport();
                await wrapper.vm.$nextTick();
                expect(prepareImageStub.getCall(0).args[0]).to.be.equal("fooo");
                expect(prepareImageStub.getCall(0).args[1]).to.deep.equal(template);
                expect(prepareImageStub.getCall(0).args[2]).to.be.equal("12345");
                expect(prepareImageStub.getCall(0).args[3]).to.be.equal("infrastructureMap");
                expect(prepareImageStub.getCall(0).args[4]).to.deep.equal({...mapfishServerConfig});
                wrapper.destroy();
                sinon.restore();
            });
            it("should call addChapter and addImageByUrl if prepareImage resolves an object", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                addChapterStub = sinon.stub(PDFMaker.prototype, "addChapter"),
                addImageByUrlStub = sinon.stub(PDFMaker.prototype, "addImageByUrl");

                sinon.stub(wrapper.vm, "getProgressValuePerStep")
                sinon.stub(wrapper.vm, "addDetailViewToOverviewPage");
                sinon.stub(wrapper.vm, "prepareImage").resolves({downloadURL: "test.url.de", bbox: ""});
                wrapper.vm.pdf = new PDFMaker();

                await wrapper.vm.addInfrastructureMapPageToReport();
                await wrapper.vm.$nextTick();
                expect(addChapterStub.getCall(0).args[0]).to.be.equal("Darstellung der Infrastrukturdaten");
                expect(addImageByUrlStub.getCall(0).args[0]).to.be.equal("test.url.de");
                wrapper.destroy();
                sinon.restore();
            });
        });
        describe("prepareImage", () => {
            it("should call prepareImages and get a string as result", async () => {
                sinon.stub(axios, "get").returns(Promise.resolve({status: 200, data: {status: "finished"}}));
                sinon.stub(axios, "post").returns(Promise.resolve({status: 200, data: {}}))
                const mockGetters = {
                    projection: () => {
                        return {
                            getCode: () => "12345"
                        };
                        }
                    },
                    store = new Vuex.Store({
                        namespaces: true,
                        modules: {
                            Maps: {
                                namespaced: true,
                                getters: mockGetters
                            },
                            Tools: {
                                namespaced: true,
                                modules: {
                                    DistrictSelector: {
                                        namespaced: true,
                                        getters: {
                                            selectedFeatures: () => ["fooo"]
                                        }
                                    }
                                }
                            }
                        },
                        getters: {
                            getRestServiceById: () => sinon.stub().returns("foourl")
                        }
                    }),
                    wrapper = shallowMount(TemplateManagerExport, {
                        vuetify,
                        localVue,
                        store
                    }),
                    result = await wrapper.vm.prepareImage(new Feature(new Point([1, 1])), baseProportionTemplate, "1234", "imageName", mapfishServerConfig, () => {});

                expect(result).to.be.an("object");
                wrapper.destroy();
                sinon.restore();
            });
        });
        describe("getChartData", async () => {
            const items = [{
                "48008": {
                    "kategorie": "Bevölkerung insgesamt",
                    "group": "Bevölkerung",
                    "stat_gebiet": "48008",
                    "stadtteil": "Winterhude",
                    "jahr_2022": "1416",
                    "jahr_2023": "1910"
                },
                "48010": {
                    "kategorie": "Bevölkerung insgesamt",
                    "group": "Bevölkerung",
                    "stat_gebiet": "48010",
                    "stadtteil": "Winterhude",
                    "jahr_2022": "4002",
                    "jahr_2023": "4737"
                },
                "category": "Bevölkerung insgesamt",
                "valueType": "absolute",
                "group": "Bevölkerung",
                "years": [2022, 2023],
                "id": "Bevölkerung insgesamt0"
            }],
                templateStatsCategories = ["Bevölkerung insgesamt", "Bevölkerung unter 18 Jahren"],
                selectedDistrictNames = ["48010", "48008"],
                areaColumnName = "Ausgewähltes Gebiet",
                categoryInChart = [{"Bevölkerung": "Bevölkerung insgesamt"}];

            it("should return empty array", async () => {
                const wrapper = factory.getShallowMount(),
                    mappingJson = [
                        {
                            "category": "bev_insgesamt",
                            "value": "Bevölkerung insgesamt",
                            "group": "Bevölkerung",
                            "stat_gebiet": "31232",
                            "stadtteil": "31240",
                            "bezirk": "31271",
                            "valueType": "absolute"
                        },
                        {
                            "category": "bev_weiblich",
                            "value": "Bevölkerung weiblich",
                            "group": "Bevölkerung",
                            "stat_gebiet": "31232",
                            "stadtteil": "31240",
                            "bezirk": "31271",
                            "valueType": "absolute"
                        }
                    ];

                expect(wrapper.vm.getChartData(items, [], selectedDistrictNames, areaColumnName, categoryInChart, mappingJson)).to.be.deep.equal([]);
                expect(wrapper.vm.getChartData(items, templateStatsCategories, [], areaColumnName, categoryInChart, mappingJson)).to.be.deep.equal([]);
                expect(wrapper.vm.getChartData(items, templateStatsCategories, selectedDistrictNames, areaColumnName, [], mappingJson)).to.be.deep.equal([]);
                expect(wrapper.vm.getChartData(items, templateStatsCategories, selectedDistrictNames, areaColumnName, categoryInChart, [], mappingJson)).to.be.deep.equal([]);
                wrapper.destroy();
            });

            it("should return chart data", async () => {
                const wrapper = factory.getShallowMount(),
                    data = [
                        {
                            "labels": [
                                2023,
                                2022
                            ],
                            "datasets": [
                                {
                                    "label": "Ausgewähltes Gebiet",
                                    "data": [
                                        6647,
                                        5418
                                    ],
                                    "borderColor": "rgba(25, 118, 210, 1)",
                                    "borderWidth": 4
                                }
                            ]
                        }
                    ],
                    mappingJson = [
                        {
                            "category": "bev_insgesamt",
                            "value": "Bevölkerung insgesamt",
                            "group": "Bevölkerung",
                            "stat_gebiet": "31232",
                            "stadtteil": "31240",
                            "bezirk": "31271",
                            "valueType": "absolute"
                        },
                        {
                            "category": "bev_weiblich",
                            "value": "Bevölkerung weiblich",
                            "group": "Bevölkerung",
                            "stat_gebiet": "31232",
                            "stadtteil": "31240",
                            "bezirk": "31271",
                            "valueType": "absolute"
                        }
                    ];

                expect(wrapper.vm.getChartData(items, templateStatsCategories, selectedDistrictNames, areaColumnName, categoryInChart, mappingJson)).to.be.deep.equal(data);
                wrapper.destroy();
            });
        });
        describe("groupBy", () => {
            it("should return the grouped object", () => {
                const wrapper = factory.getShallowMount(),
                     objArr = [
                        { Phase: "Phase 1", Step: "Step 1", Task: "Task 1", Value: "5" },
                        { Phase: "Phase 1", Step: "Step 1", Task: "Task 2", Value: "10" },
                        { Phase: "Phase 1", Step: "Step 2", Task: "Task 1", Value: "15" },
                        { Phase: "Phase 1", Step: "Step 2", Task: "Task 2", Value: "20" },
                        { Phase: "Phase 2", Step: "Step 1", Task: "Task 1", Value: "25" },
                        { Phase: "Phase 2", Step: "Step 1", Task: "Task 2", Value: "30" },
                        { Phase: "Phase 2", Step: "Step 2", Task: "Task 1", Value: "35" },
                        { Phase: "Phase 2", Step: "Step 2", Task: "Task 2", Value: "40" }
                    ],
                    key = "Step",
                    result = {
                        "Step 1": [
                            {
                                "Phase": "Phase 1",
                                "Step": "Step 1",
                                "Task": "Task 1",
                                "Value": "5"
                            },
                            {
                                "Phase": "Phase 1",
                                "Step": "Step 1",
                                "Task": "Task 2",
                                "Value": "10"
                            },
                            {
                                "Phase": "Phase 2",
                                "Step": "Step 1",
                                "Task": "Task 1",
                                "Value": "25"
                            },
                            {
                                "Phase": "Phase 2",
                                "Step": "Step 1",
                                "Task": "Task 2",
                                "Value": "30"
                            }
                        ],
                        "Step 2": [
                            {
                                "Phase": "Phase 1",
                                "Step": "Step 2",
                                "Task": "Task 1",
                                "Value": "15"
                            },
                            {
                                "Phase": "Phase 1",
                                "Step": "Step 2",
                                "Task": "Task 2",
                                "Value": "20"
                            },
                            {
                                "Phase": "Phase 2",
                                "Step": "Step 2",
                                "Task": "Task 1",
                                "Value": "35"
                            },
                            {
                                "Phase": "Phase 2",
                                "Step": "Step 2",
                                "Task": "Task 2",
                                "Value": "40"
                            }
                        ]
                    };

                expect(wrapper.vm.groupBy(objArr, key)).to.be.deep.equal(result);
                wrapper.destroy();
            });
        });
        describe("createReport", () => {
            it("should call the functions of the progress steps", async () => {
                const wrapper = factory.getShallowMount(),
                    stubOne = sinon.stub(),
                    stubTwo = sinon.stub(),
                    stubThree = sinon.stub();

                wrapper.vm.progressSteps = [
                    {func: stubOne},
                    {func: stubTwo},
                    {func: stubThree},
                ];
                sinon.stub(PDFMaker.prototype, "resetDocContent");
                sinon.stub(PDFMaker.prototype, "download");
                sinon.stub(wrapper.vm, "registerProgressSteps");

                await wrapper.vm.createReport();

                expect(stubOne.called).to.be.true;
                expect(stubTwo.called).to.be.true;
                expect(stubThree.called).to.be.true;
                wrapper.destroy();
                sinon.restore();
            });
            it("should increment the progress value based on the steps", async () => {
                const wrapper = factory.getShallowMount(),
                    stubOne = () => expect(wrapper.vm.progressValue).to.be.equal(0),
                    stubTwo = () => expect(wrapper.vm.progressValue).to.be.equal(25),
                    stubThree = () => expect(wrapper.vm.progressValue).to.be.equal(50);
                    stubFour = () => expect(wrapper.vm.progressValue).to.be.equal(75);

                wrapper.vm.progressSteps = [
                    {func: stubOne},
                    {func: stubTwo},
                    {func: stubThree},
                    {func: stubFour}
                ];
                sinon.stub(wrapper.vm, "registerProgressSteps");
                sinon.stub(PDFMaker.prototype, "download").callsFake(() => expect(wrapper.vm.progressValue).to.be.equal(100));

                await wrapper.vm.createReport();
                wrapper.destroy();
                sinon.restore();
            });
            it("should increment the progress value based on the steps but should not correct the calculation if its calculated by the function itself", async () => {
                const wrapper = factory.getShallowMount(),
                    stubOne = () => expect(wrapper.vm.progressValue).to.be.equal(0),
                    stubTwo = () => wrapper.vm.progressValue += 1,
                    stubThree = () => expect(wrapper.vm.progressValue).to.be.equal(26);
                    stubFour = () => expect(wrapper.vm.progressValue).to.be.equal(51);

                wrapper.vm.progressSteps = [
                    {func: stubOne},
                    {func: stubTwo, handleProgressByThemSelves: true},
                    {func: stubThree},
                    {func: stubFour}
                ];
                sinon.stub(wrapper.vm, "registerProgressSteps");
                sinon.stub(PDFMaker.prototype, "download").callsFake(() => expect(wrapper.vm.progressValue).to.be.equal(100));

                await wrapper.vm.createReport();
                wrapper.destroy();
                sinon.restore();
            });
        })
        describe("controlsReportComponent", () => {
            it("should return false, if string is not included", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    selectedReportComponents: ["Seite 1", "Seite 2", "Seite 3"]
                });

                expect(wrapper.vm.controlsReportComponent("Seite 4")).to.be.false;
                wrapper.destroy();
            });
            it("should return true, if string is included", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    selectedReportComponents: ["Seite 1", "Seite 2", "Seite 3"]
                });

                expect(wrapper.vm.controlsReportComponent("Seite 1")).to.be.true;
                wrapper.destroy();
            });
        });
    });
});
