import {config, shallowMount} from "@vue/test-utils";
import crs from "@masterportal/masterportalapi/src/crs.js";
import {expect} from "chai";
import WaterRiskCheck from "../../components/WaterRiskCheck.vue";
import MapfishDialog from "../../../shared/js/mapfishUtils/mapfishDialog.js";
import createVectorLayer from "../../../shared/js/mapfishUtils/createVectorLayer.js";
import {createStore} from "vuex";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import spatialOperations from "../../js/spatialOperations.js";

config.global.mocks.$t = key => key;
/**
 * mocks secondary menu
 * @returns {void}
 */
function addSecondaryMenuElement () {
    const app = document.createElement("div");

    app.setAttribute("id", "mp-menu-secondaryMenu");
    document.body.append(app);
}


describe("addons/waterRiskCheck/components/WaterRiskCheck.vue", () => {
    const factory = {
            createVuexStore: (initialState) => {
                return createStore({
                    namespaced: true,
                    modules: {
                        Modules: {
                            namespaced: true,
                            modules: {
                                namespaced: true,
                                WaterRiskCheck: {
                                    namespaced: true,
                                    state: {
                                        address: "",
                                        configuredQuestions: [],
                                        pdfPages: [],
                                        answersLogic: [],
                                        alwaysShow: [],
                                        settings: {},
                                        addressCoordinates: undefined,
                                        ...initialState
                                    },
                                    getters: {
                                        address: (state) => state.address,
                                        addressCoordinates: (state) => state.addressCoordinates,
                                        configuredQuestions: (state) => state.configuredQuestions,
                                        answersLogic: (state) => state.answersLogic,
                                        pdfPages: (state) => state.pdfPages,
                                        alwaysShow: (state) => state.alwaysShow,
                                        searchBarConfig: (state) => state.searchBarConfig,
                                        settings: (state) => state.settings
                                    },
                                    actions: {
                                        updateAddress: () => sinon.stub()
                                    }
                                },
                                WaterRiskCheckSearchBar: {
                                    namespaced: true,
                                    getters: {
                                        searchResults: () => [{
                                            category: "Adresse",
                                            name: "Test Address 1"
                                        }]
                                    }
                                }
                            }
                        }
                    },
                    getters: {
                        restServiceById: () => {
                            return {
                                url: "https://this.could.be.your.url/examplePortal"
                            };
                        },
                        isMobile: () => false
                    }
                });
            }
        },
        namedProjections = [
            ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
            ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
        ];
    let stubSetConfig;

    beforeAll(() => {
        crs.registerProjections(namedProjections);
    });

    beforeEach(() => {
        addSecondaryMenuElement();
        stubSetConfig = sinon.stub(WaterRiskCheck.methods, "setConfig");
        sinon.stub(layerCollection, "getLayerById").returns(
            {
                getLayer: () => {
                    return new VectorLayer();
                },
                getLayerSource: sinon.stub(),
                setStyle: sinon.stub()
            }
        );
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.exists()).to.be.true;
        });
        it("should find not a start button", () => {
            const store = factory.createVuexStore({
                    address: ""
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.find("#start-form").exists()).to.be.false;
        });
        it("should find a start button", async () => {
            const store = factory.createVuexStore({
                    address: "Test Address 1"
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({buildings: {
                properties: {
                    gebnutzbez: "Gebaeude"
                }
            }
            });

            expect(wrapper.find("#start-form").exists()).to.be.true;
        });
        it("should find a disabled back and forward button", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [{title: "foo", question: "bar", info: {}}]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#page-back").exists()).to.be.true;
            expect(wrapper.findAllComponents(FlatButton).length).to.be.equal(2);
        });
        it("should have increased progress if page is not 0", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}}
                    ]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.currentQuestionIdx = 1;
            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.findAll(".progress-bar").at(0).attributes()).to.have.property("aria-valuenow", "20.00");
        });
        it("should find a reset icon button when the form is started", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [{title: "foo", question: "bar", info: {}}]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#reset-button").exists()).to.be.true;
        });
        it("should find a reset button when the form is finished", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: [{title: "foo", question: "bar", info: {}}]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.formStarted = false;
            wrapper.vm.formFinished = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#reset").exists()).to.be.true;
        });
    });

    describe("Computed", () => {
        it("should return the correct parcel number", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.vm.parcelNumber).to.be.equal("");
            await wrapper.setData({
                parcel: [{
                    properties: {
                        flstnrzae: "666"
                    }
                }]
            });
            expect(wrapper.vm.parcelNumber).to.be.equal("666");
        });
        it("should return an empty string for the parcel number", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    properties: {}
                }]
            });
            expect(wrapper.vm.parcelNumber).to.be.equal("");
        });
        it("should return the correct district name", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    properties: {
                        gemarkung: "Hell's Kitchen"
                    }
                }]
            });
            expect(wrapper.vm.districtName).to.be.equal("Hell's Kitchen");
        });
        it("should return an empty string for the district name", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                parcel: [{
                    gemarkung: {}
                }]
            });
            expect(wrapper.vm.districtName).to.be.equal("");
        });
        it("should return one for the count of buildings", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Gebaeude"
                    }
                }]
            });
            expect(wrapper.vm.countOfBuildings).to.be.equal(1);
        });
        it("should return null for the count of buildings", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Rote Flora"
                    }
                }]
            });
            expect(wrapper.vm.countOfBuildings).to.be.equal(0);
        });
        it("should return all buildings for 'buildingToUse", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Gebaeude"
                    }
                }]
            });
            expect(wrapper.vm.buildingsToUse).to.deep.equal(wrapper.vm.buildings);
        });
        it("should return one building for 'buildingToUse'", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Gebaeude"
                    }
                },
                {
                    properties: {
                        gebnutzbez: "Berg"
                    }
                }]
            });
            expect(wrapper.vm.buildingsToUse).to.deep.equal([wrapper.vm.buildings[0]]);
        });
        it("should return an empty array for 'buildingToUse'", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                buildings: [{
                    properties: {
                        gebnutzbez: "Berg"
                    }
                }]
            });
            expect(wrapper.vm.buildingsToUse).to.deep.equal([]);
        });
        it("should return false for 'groundWaterWithin4m' by default", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    },
                    data: () => {
                        return {parcel: [true]};
                    }
                });

            sinon.stub(spatialOperations, "calcArea").returns({});
            expect(wrapper.vm.groundWaterWithin4m).to.be.false;
        });
        it("should return true for 'groundWaterWithin4m' if such features exist", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    },
                    data: () => {
                        return {parcel: [true]};
                    }
                });

            sinon.stub(spatialOperations, "calcArea").returns(
                {"2,0 bis 3,0_area": "1"}
            );
            expect(wrapper.vm.groundWaterWithin4m).to.be.true;
        });
        it("should return table with hyphens for 'infiltrationTableParcel' by default", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.vm.infiltrationTableParcel).to.deep.equal(
                [
                    ["möglich", "-"],
                    ["wahrscheinlich", "-"],
                    ["eingeschränkt", "-"],
                    ["unwahrscheinlich", "-"]
                ]
            );
        });
        it("should return table with correct values for 'infiltrationTableParcel'", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    },
                    data: () => {
                        return {parcel: [true]};
                    }
                });

            sinon.stub(spatialOperations, "calcArea").returns(
                {
                    "möglich_percent": "0,4",
                    "wahrscheinlich_percent": "0,3",
                    "eingeschränkt_percent": "0,2",
                    "unwahrscheinlich_percent": "0,1"
                }
            );

            expect(wrapper.vm.infiltrationTableParcel).to.deep.equal(
                [
                    ["möglich", "0,4"],
                    ["wahrscheinlich", "0,3"],
                    ["eingeschränkt", "0,2"],
                    ["unwahrscheinlich", "0,1"]
                ]
            );
        });
        it("should return table with hyphens for 'infiltrationTableUnbuilt' by default", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.vm.infiltrationTableUnbuilt).to.deep.equal(
                [
                    ["möglich", "-"],
                    ["wahrscheinlich", "-"],
                    ["eingeschränkt", "-"],
                    ["unwahrscheinlich", "-"]
                ]
            );
        });
        it("should return table with correct values for 'infiltrationTableUnbuilt'", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    },
                    data: () => {
                        return {
                            data: {
                                infiltration: {
                                    values: {
                                        "möglich_percent": "0,4",
                                        "wahrscheinlich_percent": "0,3",
                                        "eingeschränkt_percent": "0,2",
                                        "unwahrscheinlich_percent": "0,1"
                                    }
                                }
                            }
                        };
                    }
                });

            expect(wrapper.vm.infiltrationTableUnbuilt).to.deep.equal(
                [
                    ["möglich", "0,4"],
                    ["wahrscheinlich", "0,3"],
                    ["eingeschränkt", "0,2"],
                    ["unwahrscheinlich", "0,1"]
                ]
            );
        });
        it("should return correct minimum for minimalGroundWaterDistance", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    },
                    data: () => {
                        return {
                            parcel: [true],
                            data: {
                                groundWaterMin: {
                                    propertyToUse: "wassertiefe",
                                    geoJsonParcelFeatures: [
                                        {properties: {wassertiefe: "2,0 bis 3,0"}},
                                        {properties: {wassertiefe: "1,0 bis 2,0"}},
                                        {properties: {wassertiefe: "3,0 bis 4,0"}}
                                    ]
                                }
                            }
                        };
                    }
                });

            expect(wrapper.vm.minimalGroundWaterDistance).to.equal("1,0 bis 2,0");
        });
        it("should return only boolean values for pageNamesFromData", async () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            await wrapper.setData({
                data: {
                    uesg: {
                        geoJsonParcelFeatures: []
                    },
                    sri07_wassertiefe: {
                        value: {
                            properties: {
                                value: 0
                            }
                        }
                    },
                    sri12_wassertiefe: {
                        value: {
                            properties: {
                                value: 1
                            }
                        }
                    },
                    infiltration: {
                        values: {
                            möglich_area: 0,
                            wahrscheinlich_area: 0
                        },
                        geoJsonParcelFeatures: []
                    }
                },
                parcel: [],
                middleFloodDepth: "",
                seldomFloodDepth: "",
                middleFloodDepthKW: "",
                extremFloodDepthKW: "",
                gridCode: 0
            });

            const allValuesAreBoolean = Object.values(wrapper.vm.pageNamesFromData)
                .every(value => typeof value === "boolean");

            expect(allValuesAreBoolean).to.be.true;
        });
    });

    describe("Hook", () => {
        it("should call createLayer on mount", () => {
            const stubCreateLayer = sinon.stub(WaterRiskCheck.methods, "createLayer"),
                store = factory.createVuexStore();

            shallowMount(WaterRiskCheck, {
                global: {
                    plugins: [store]
                }
            });

            expect(stubCreateLayer.calledOnce).to.be.true;
        });
        it("should call setConfig if the component is mounted", () => {
            const store = factory.createVuexStore();

            shallowMount(WaterRiskCheck, {
                global: {
                    plugins: [store]
                }
            });

            expect(stubSetConfig.called).to.be.true;
        });
    });

    describe("Watcher", () => {
        it("should call walkTroughToFetchAndAdd, if the address watcher triggers", () => {
            const stubWalkTroughToFetchAndAdd = sinon.stub(WaterRiskCheck.methods, "walkTroughToFetchAndAdd"),
                store = factory.createVuexStore();

            shallowMount(WaterRiskCheck, {
                global: {
                    plugins: [store]
                }
            });

            expect(stubWalkTroughToFetchAndAdd.calledOnce).to.be.true;
        });
        it("should call resetAll, if the address was changed when form is started", () => {
            const stubResetAll = sinon.stub(WaterRiskCheck.methods, "resetAll"),
                store = factory.createVuexStore({
                    address: "Test Address"
                });

            shallowMount(WaterRiskCheck, {
                data: () => ({
                    formStarted: true
                }),
                global: {
                    plugins: [store]
                }
            });

            expect(stubResetAll.calledOnce).to.be.true;
        });
    });

    describe("methods", () => {
        describe("setNameFromSelectedAnswer", () => {
            it("should sets the page name depending on selected answer", async () => {
                const store = factory.createVuexStore({answersLogic: () => []}),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    allAnswers = {Ja: ["First"], Nein: ["Second"], Vielleicht: ["Third"]},
                    selected = "Ja",
                    expected = {First: true, Second: false, Third: false};

                await wrapper.setData({pageNamesFromQuestions: {
                    First: false,
                    Second: false,
                    Third: false
                }});

                wrapper.vm.setNameFromSelectedAnswer(allAnswers, selected);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.pageNamesFromQuestions).to.deep.equal(expected);
            });
            it("should change the given answer if the current answer has been changed", async () => {
                const store = factory.createVuexStore({answersLogic: () => []}),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    allAnswers = {Ja: ["First"], Nein: ["Second"], Vielleicht: ["Third"]},
                    selected = "Nein",
                    expected = {First: false, Second: true, Third: false};

                await wrapper.setData({
                    pageNamesFromQuestions: {
                        First: true,
                        Second: false,
                        Third: false
                    }
                });

                wrapper.vm.setNameFromSelectedAnswer(allAnswers, selected);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.pageNamesFromQuestions).to.deep.equal(expected);
            });
        });

        describe("evaluatingAnswers", () => {
            it("should evaluating the selected answers for each question", async () => {
                const store = factory.createVuexStore({
                        answersLogic: [
                            {question: {Ja: ["First_0"], Nein: ["Second_0"], Vielleicht: ["Third_0"]}},
                            {question: {Ja: ["First_1"], Nein: ["Second_1a", "Second_1b"], Vielleicht: []}}
                        ]
                    }),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                await wrapper.setData({
                    pageNamesFromQuestions: {
                        First_0: false,
                        Second_0: false,
                        Third_0: false,
                        First_1: false,
                        Second_1a: false,
                        Second_1b: false
                    }
                });

                wrapper.vm.evaluatingAnswers(0, "Ja");
                expect(wrapper.vm.pageNamesFromQuestions).to.deep.equal({
                    First_0: true,
                    Second_0: false,
                    Third_0: false,
                    First_1: false,
                    Second_1a: false,
                    Second_1b: false});
                wrapper.vm.evaluatingAnswers(1, "Nein");
                expect(wrapper.vm.pageNamesFromQuestions).to.deep.equal({
                    First_0: true,
                    Second_0: false,
                    Third_0: false,
                    First_1: false,
                    Second_1a: true,
                    Second_1b: true
                });
                wrapper.vm.evaluatingAnswers(2, "Vielleicht");
                expect(wrapper.vm.pageNamesFromQuestions).to.deep.equal({
                    First_0: true,
                    Second_0: false,
                    Third_0: false,
                    First_1: false,
                    Second_1a: true,
                    Second_1b: true
                });
            });
        });

        describe("getDeepFloodDepth", () => {
            it("should return empty string if the parameter is wrong or in wrong type", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getDeepFloodDepth(true)).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth("")).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth(0)).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth([])).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({}, true)).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({}, 0)).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({}, [])).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({}, {})).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({}, "hwrm_mittel")).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({"hwrm_mittel": 0}, {})).to.equal("");
            });

            it("should return empty string if there are no features found", async () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getDeepFloodDepth({"hwrm_mittel": {}})).to.equal("");
                expect(wrapper.vm.getDeepFloodDepth({"hwrm_mittel": {"geoJsonParcelFeatures": []}})).to.equal("");
            });

            it("should return the deepest depth", async () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                sinon.stub(spatialOperations, "intersect").returns(
                    [
                        {
                            "properties": {
                                "wassertiefe": "0 - 0,5m"
                            }
                        },
                        {
                            "properties": {
                                "wassertiefe": "0,5 - 1m"
                            }
                        },
                        {
                            "properties": {
                                "wassertiefe": "1 - 2m"
                            }
                        }
                    ]
                );
                expect(wrapper.vm.getDeepFloodDepth(
                    {
                        "hwrm_mittel": {
                            "propertyToUse": "wassertiefe",
                            "geoJsonParcelFeatures": [null]
                        }
                    },
                    "hwrm_mittel"
                )).to.equal("1 - 2m");
            });
        });

        describe("getLegends", () => {
            it("Should return an empty object, if the given parameter is not an object", () => {
                sinon.stub(console, "error");
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getLegends(undefined)).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends(null)).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends(1234)).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends(true)).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends(false)).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends([])).to.be.an("object").and.to.be.empty;
                expect(wrapper.vm.getLegends("")).to.be.an("object").and.to.be.empty;
            });
            it("Should return an empty object, if the given parameter is an empty object", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.getLegends({})).to.be.an("object").and.to.be.empty;
            });
            it("Should return an correct object", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    legends = {
                        "strassenverkehr": {
                            "legend_tag": {
                                "type": "default",
                                "content": "https://geodienste.hamburg.de/HH_WMS_Strassenverkehr?VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=strassenverkehr_tag_abend_nacht_2022"
                            },
                            "legend_nacht": {
                                "type": "default",
                                "content": "https://geodienste.hamburg.de/HH_WMS_Strassenverkehr?VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=strassenverkehr_nacht_2022"
                            }
                        },
                        "starkregen": {
                            "legend_fliesspfeile": {
                                "type": "default",
                                "content": "https://geodienste.hamburg.de/HH_WMS_Starkregenhinweiskarte?language=ger&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=fliesswege_und_pfeile&format=image/png&STYLE=default"
                            },
                            "legend_senktiefen": {
                                "type": "default",
                                "content": "https://geodienste.hamburg.de/HH_WMS_Starkregenhinweiskarte?language=ger&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=senkentiefen&format=image/png&STYLE=default"
                            }
                        }
                    },
                    expected = {};

                expected.strassenverkehr_legend_tag = "https://geodienste.hamburg.de/HH_WMS_Strassenverkehr?VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=strassenverkehr_tag_abend_nacht_2022";
                expected.strassenverkehr_legend_nacht = "https://geodienste.hamburg.de/HH_WMS_Strassenverkehr?VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=strassenverkehr_nacht_2022";
                expected.starkregen_legend_fliesspfeile = "https://geodienste.hamburg.de/HH_WMS_Starkregenhinweiskarte?language=ger&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=fliesswege_und_pfeile&format=image/png&STYLE=default";
                expected.starkregen_legend_senktiefen = "https://geodienste.hamburg.de/HH_WMS_Starkregenhinweiskarte?language=ger&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=senkentiefen&format=image/png&STYLE=default";

                expect(wrapper.vm.getLegends(legends)).to.deep.equal(expected);
            });
        });

        describe("getMapConf", () => {
            it("Should return an empty object, if the given parameter is not an object", async () => {
                sinon.stub(console, "error");
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(await wrapper.vm.getMapConf(undefined)).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf(null)).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf(1234)).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf(true)).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf(false)).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf([])).to.be.an("object").and.to.be.empty;
                expect(await wrapper.vm.getMapConf("")).to.be.an("object").and.to.be.empty;
            });
            it("Should return an empty object, if the given parameter is an empty object", async () => {
                sinon.stub(console, "error");
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    });

                expect(await wrapper.vm.getMapConf({}, {})).to.be.an("object").and.to.be.empty;
            });
            it("Should return an correct object", async () => {
                sinon.stub(MapfishDialog.prototype, "buildLayers").returns([]);
                sinon.stub(MapfishDialog.prototype, "getFixedMap").returns({});
                sinon.stub(createVectorLayer, "getFeatureLayer").resolves([]);
                sinon.stub(console, "error");
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(WaterRiskCheck, {
                        global: {
                            plugins: [store]
                        }
                    }),
                    specification = {
                        "cards": {
                            "uebersichtskarte": {
                                "type": "mapProportion",
                                "proportion": 0.33,
                                "style": {
                                    "borderSize": 3,
                                    "color": [
                                        228,
                                        26,
                                        28,
                                        1
                                    ]
                                },
                                "layerIds": [
                                    "1103",
                                    "453"
                                ]
                            },
                            "uebersichtskarte_fixed": {
                                "type": "mapFixed",
                                "style": {
                                    "pointSize": 6,
                                    "color": [
                                        228,
                                        26,
                                        28,
                                        1
                                    ]
                                },
                                "bbox": [
                                    567825.083654769,
                                    5932342.216619911,
                                    567825.083654769,
                                    5932342.216619911
                                ],
                                "layerIds": [
                                    "1886"
                                ]
                            },
                            "uebersichtskarte_1": {
                                "type": "mapProportion",
                                "proportion": 0.33,
                                "style": {
                                    "borderSize": 3,
                                    "color": [
                                        228,
                                        26,
                                        28,
                                        1
                                    ]
                                },
                                "layerIds": [
                                    "15603",
                                    "15610",
                                    "453"
                                ]
                            },
                            "strassenverkehr_tag": {
                                "type": "mapWalker",
                                "style": {
                                    "borderSize": 1,
                                    "color": [
                                        0,
                                        0,
                                        0,
                                        1
                                    ]
                                },
                                "scale": 10000,
                                "layerIds": [
                                    "95",
                                    "453"
                                ]
                            },
                            "strassenverkehr_nacht": {
                                "type": "mapWalker",
                                "style": {
                                    "borderSize": 1,
                                    "color": [
                                        0,
                                        0,
                                        0,
                                        1
                                    ]
                                },
                                "scale": 10000,
                                "layerIds": [
                                    "96",
                                    "453"
                                ]
                            }
                        }
                    },
                    parcel = {
                        "type": "Feature",
                        "geometry":
                            {
                                "type": "Point",
                                "coordinates": [10.023374939929553, 53.5356067536243]
                            },
                        "properties": {"EPSG": "25832"}
                    },
                    bbox = [
                        567825.083654769,
                        5932342.216619911,
                        567825.083654769,
                        5932342.216619911
                    ],
                    result = await wrapper.vm.getMapConf(parcel, specification);

                expect(result.uebersichtskarte).to.be.an("object").that.is.not.empty;
                expect(result.uebersichtskarte.dpi).to.be.equal(200);
                expect(result.uebersichtskarte.projection).to.be.equal("EPSG:25832");
                expect(result.uebersichtskarte.bbox).to.deep.equal(bbox);
                expect(result.uebersichtskarte_fixed).to.be.an("object");
                expect(result.uebersichtskarte_1).to.be.an("object");
                expect(result.strassenverkehr_tag).to.be.an("object");
                expect(result.strassenverkehr_nacht).to.be.an("object");
            });
        });
    });
});
