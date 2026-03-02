// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
// import DistrictFinderFilterCard from "../../../components/DistrictFinderFilterCard.vue";
import {expect} from "chai";
import sinon from "sinon";
// import Vue from "vue";
// import Vuetify from "vuetify";
import Vuex from "vuex";

// config.mocks.$t = key => key;

// Vue.use(Vuetify);
// const localVue = createLocalVue();

// localVue.use(Vuex);

describe.skip("addons/cosi/DistrictFinder/components/DistrictFinderFilterCard.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Language: {
                    namespaced: true,
                    mutations: {},
                    getters: {
                        currentLocale: () => "de"
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictSelector: {
                            namespaced: true,
                            mutations: {},
                            getters: {
                                districtLevels: () => [{layerId: "1", stats: {keyOfAttrName: [], layerIds: []}}]
                            }
                        },
                        DistrictFinder: {
                            namespaced: true,
                            getters: {
                                chartColors: () => ({conditionFalse: "rgb(255, 255, 255, 1)", conditionTrue: "rgb(255, 0, 0, 1)"}),
                                groupBlacklist: () => [],
                                keyOfAttrNameStats: () => "stats",
                                mapping: () => [],
                                referenceLineColor: () => "rgba(255, 0, 0, 0.5)",
                                selectedDistricts: () => [],
                                selectedLevelId: () => "1",
                                topLevelSelection: () => ["Altona", "Bergedorf"]
                            }
                        }
                    }
                }
            }
        }),
        // vuetify = new Vuetify(),
        DistrictFinderFilterCard = undefined,
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderFilterCard, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    propsData: {
                        condition: {
                            id: 1
                        },
                        cardNumber: 0
                    },
                    store
                    // vuetify,
                    // localVue
                });
            }
        };

    describe("Component DOM", () => {
        it("exists", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should not find component DistrictFinderFilterSpinner", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findComponent({name: "DistrictFinderFilterSpinner"}).exists()).to.be.false;
        });

        it("should find component DistrictFinderFilterSpinner", async () => {
            const wrapper = factory.getShallowMount();

            wrapper.setData({isLoading: true});
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent({name: "DistrictFinderFilterSpinner"}).exists()).to.be.true;
        });
    });

    describe("Computed properties", () => {

        describe("minimum", () => {

            it("should return a hyphen as default", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.minimum).to.equal("-");
            });

            it("should return the expected result", () => {
                const wrapper = factory.getShallowMount({
                    selectedCategory: "cat",
                    features: [
                        {properties: {cat: 2}},
                        {properties: {cat: 1}},
                        {properties: {cat: 3}}
                    ]
                });

                expect(wrapper.vm.minimum).to.equal("1");
            });
        });

        describe("meanValue", () => {

            it("should return a hyphen as default", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.meanValue).to.equal("-");
            });

            it("should return the expected result", () => {
                const wrapper = factory.getShallowMount({
                    selectedCategory: "cat",
                    features: [
                        {properties: {cat: 1}},
                        {properties: {cat: 1}},
                        {properties: {cat: 4}}
                    ]
                });

                expect(wrapper.vm.meanValue).to.equal("2");
            });
        });

        describe("maximum", () => {

            it("should return a hyphen as default", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.maximum).to.equal("-");
            });

            it("should return the expected result", () => {
                const wrapper = factory.getShallowMount({
                    selectedCategory: "cat",
                    features: [
                        {properties: {cat: 2}},
                        {properties: {cat: 3}},
                        {properties: {cat: 1}}
                    ]
                });

                expect(wrapper.vm.maximum).to.equal("3");
            });
        });
    });

    describe("Lifecycle Hooks", () => {
        it("should call 'setConditionAttributes' if component is mounted", () => {
            const spySetConditionAttributes = sinon.spy(DistrictFinderFilterCard.methods, "setConditionAttributes");

            factory.getShallowMount();

            expect(spySetConditionAttributes.calledOnce).to.be.true;
            sinon.restore();
        });
    });

    describe("Methods", () => {
        describe("checkInRange", () => {
            it("should return true if the type is not relative", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.checkInRange()).to.be.true;
                expect(wrapper.vm.checkInRange("absolute")).to.be.true;
            });

            it("should return true if the value is in range", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.checkInRange("relative", 0)).to.be.true;
                expect(wrapper.vm.checkInRange("relative", 100)).to.be.true;
                expect(wrapper.vm.checkInRange("relative", 50)).to.be.true;
            });

            it("should return false if the value is not in range", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.checkInRange("relative", -10)).to.be.false;
                expect(wrapper.vm.checkInRange("relative", 150)).to.be.false;
            });
        });

        describe("comparisonFunction", () => {

            it("should return false in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.comparisonFunction()).to.be.false;
                expect(wrapper.vm.comparisonFunction("><", 0, 0)).to.be.false;
                expect(wrapper.vm.comparisonFunction("=", 100, "")).to.be.false;
                expect(wrapper.vm.comparisonFunction("=", 100, undefined)).to.be.false;
                expect(wrapper.vm.comparisonFunction("=", 100, 100, "")).to.be.false;
            });

            it("should return expected results", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.comparisonFunction("=", 99, 99)).to.be.true;
                expect(wrapper.vm.comparisonFunction("=", 99, 100)).to.be.false;
                expect(wrapper.vm.comparisonFunction("=", 99, 100, 1)).to.be.true;
                expect(wrapper.vm.comparisonFunction("<", 99, 100)).to.be.true;
                expect(wrapper.vm.comparisonFunction("<", 100, 99)).to.be.false;
                expect(wrapper.vm.comparisonFunction(">", 99, 100)).to.be.false;
                expect(wrapper.vm.comparisonFunction(">", 100, 99)).to.be.true;
            });
        });

        describe("deleteCard", () => {
            it("should emit 'delete' with the correct parameter", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.deleteCard();
                await wrapper.vm.$nextTick();
                expect(wrapper.emitted()).to.have.property("delete");
                expect(wrapper.emitted().delete[0]).to.deep.equal([1]);
            });
        });

        describe("getYearsForTemporalExtent", () => {
            it("should return an empty array in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getYearsForTemporalExtent()).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[]])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[new Date()]])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[new Date(), new Date(), new Date()]])).to.be.an("array").that.is.empty;
            });
            it("should return expected results", () => {
                const wrapper = factory.getShallowMount(),
                    extent = [
                        [new Date("2000"), new Date("2000")],
                        [new Date("2010"), new Date("2011")],
                        [new Date("2020"), new Date("2022")]
                    ],
                    expectedResult = [2000, 2010, 2011, 2020, 2021, 2022];

                expect(wrapper.vm.getYearsForTemporalExtent(extent)).to.deep.equal(expectedResult);
            });
            it("should return expected results", () => {
                const wrapper = factory.getShallowMount(),
                    extent = [
                        [new Date("2000"), new Date("2000")],
                        [new Date("2010"), new Date("2011")],
                        [new Date("2020"), new Date("2022")]
                    ],
                    expectedResult = [2000, 2010, 2011, 2020, 2021, 2022];

                expect(wrapper.vm.getYearsForTemporalExtent(extent)).to.deep.equal(expectedResult);
            });
        });

        describe("setConditionAttributes", () => {
            it("should set the condition attributes correctly", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setConditionAttributes({year: "2025", referenceValue: "100"});
                expect(wrapper.vm.selectedYear).to.equal("2025");
                expect(wrapper.vm.referenceValue).to.equal("100");
                expect(wrapper.vm.selectedCategory).to.be.null;
                expect(wrapper.vm.selectedFilter).to.equal("=");
                expect(wrapper.vm.tolerance).to.be.undefined;
            });
            it("should set a latest year if 'latestYear' is true", async () => {
                const spyUpdateSelectedCategory = sinon.spy(DistrictFinderFilterCard.methods, "updateSelectedCategory"),
                    wrapper = factory.getShallowMount();

                await wrapper.setProps({
                    changeToLatestYear: true
                });

                wrapper.vm.setConditionAttributes({year: "2025", statisticCategory: "Kategorie"});

                wrapper.vm.$nextTick();
                wrapper.vm.$nextTick();

                expect(spyUpdateSelectedCategory.calledOnce).to.be.true;
                sinon.restore();
            });
        });

        describe("sortedData", () => {
            it("return sorted data for chart", async () => {
                const wrapper = factory.getShallowMount(),
                    expectedSorting = [{"category": 200, "stadtteil": "Gebiet3"}, {"category": 1000, "stadtteil": "Gebiet2"}, {"category": 2000, "stadtteil": "Gebiet1"}];

                await wrapper.setData({
                    features: [{properties: {"category": 2000, "stadtteil": "Gebiet1"}}, {properties: {"category": 1000, "stadtteil": "Gebiet2"}}, {properties: {"category": 200, "stadtteil": "Gebiet3"}}],
                    selectedCategory: "category"
                });
                wrapper.vm.$nextTick();

                expect(wrapper.vm.sortedData()).to.deep.equal(expectedSorting);
            });
        });
        describe("getChartColors", () => {
            it("returns an array with colors for conditions that match", async () => {

                sinon.stub(DistrictFinderFilterCard.methods, "sortedData").returns([{"category": 200, "stadtteil": "Altona"}, {"category": 1000, "stadtteil": "Bahrenfeld"}, {"category": 2000, "stadtteil": "Curslack"}]);
                const wrapper = factory.getShallowMount(),
                    expectedColors = ["rgb(255, 0, 0, 1)", "rgb(255, 0, 0, 1)", "rgb(255, 255, 255, 1)"];

                await wrapper.setData({
                    resultNames: ["Altona", "Bahrenfeld"],
                    referenceValue: 10000
                });

                wrapper.vm.$nextTick();

                expect(wrapper.vm.getChartColors("stadtteil")).to.deep.equal(expectedColors);
                sinon.restore();
            });
        });
        describe("updateYear", () => {
            it("calls fetchFeatures twice", async () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().resolves([])
                    .onSecondCall().callsFake(() => expect(fetchFeaturesStub.calledTwice).to.be.true);

                wrapper.vm.updateYear();
            });
            it("calls fetchFeatures with expected filter parameter on first call", async () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub.onFirstCall().callsFake(() => expect(fetchFeaturesStub.firstCall.calledWith(sinon.match.any, sinon.match.any, sinon.match.any,
                    "bezirk IN ('Altona','Bergedorf')")).to.be.true);

                wrapper.vm.updateYear();
            });
            it("calls fetchFeatures without filter parameter on second call (case 1: first call resolved)", async () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().resolves([])
                    .onSecondCall().callsFake(() => expect(fetchFeaturesStub.secondCall.calledWith(
                        sinon.match.any, sinon.match.any, sinon.match.any, undefined
                    )).to.be.true);

                wrapper.vm.updateYear();
            });
            it("calls fetchFeatures without filter parameter on second call (case 2: first call rejected)", async () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().rejects()
                    .onSecondCall().callsFake(() => expect(fetchFeaturesStub.secondCall.calledWith(
                        sinon.match.any, sinon.match.any, sinon.match.any, undefined
                    )).to.be.true);

                wrapper.vm.updateYear();
            });
            it("does not throw errors if first call is rejected", () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().rejects()
                    .onSecondCall().callsFake(() => expect(fetchFeaturesStub).to.not.throw());
            });
            it("does throw an error if second call is rejected", () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().resolves([])
                    .onSecondCall().callsFake(() => {
                        expect(fetchFeaturesStub).to.throw();
                        return Promise.reject();
                    }
                    );
            });
            it("eventually sets features from second request", () => {
                const wrapper = factory.getShallowMount(),
                    fetchFeaturesStub = sinon.stub(wrapper.vm, "fetchFeatures");

                fetchFeaturesStub
                    .onFirstCall().resolves(["Marmstorf"])
                    .onSecondCall().callsFake(() => {
                        expect(wrapper.vm.features).to.deep.equal(["Marmstorf", "Hausbruch"]);
                        return Promise.resolve(["Marmstorf", "Hausbruch"]);
                    }
                    );
            });
        });

    });
});
