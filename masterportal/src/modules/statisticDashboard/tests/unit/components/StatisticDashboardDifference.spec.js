import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardDifference from "@modules/statisticDashboard/components/StatisticDashboardDifference.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";
import sinon from "sinon";


describe("src/modules/statiscticDashboard/components/StatisticDashboardDifference.vue", () => {
    const propsData = {
        referenceData: {
            "date": [
                {label: "2000", value: "2000"},
                {label: "2001", value: "2001"},
                {label: "2002", value: "2002"}
            ],
            "region": [
                {label: "Wandsbek", value: "Wandsbek"},
                {label: "Hamburg", value: "Hamburg"},
                {label: "Deutschland", value: "Deutschland"}
            ]
        }
    };

    let store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: indexStatisticDashboard
                    }
                }
            }
        });
    });


    describe("Component DOM", () => {
        it("does not render a separate title", () => {
            const wrapper = shallowMount(StatisticDashboardDifference, {
                propsData: propsData,
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find("h4").exists()).to.be.false;
        });

        it("The date selection dropdown should exist", () => {
            const wrapper = shallowMount(StatisticDashboardDifference, {
                propsData: propsData,
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.findComponent(DropdownAutocomplete).exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("updateSelectedReferenceData", () => {
            it("should set the selectedReferenceData to the emit object for date", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    expected = {
                        type: "date",
                        value: {
                            label: "1999",
                            value: "1999-01-01"
                        }
                    },
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedDate = {label: "1999", value: "1999-01-01"};
                wrapper.vm.updateSelectedReferenceData("date");

                expect(setSelectedReferenceDataStub.calledWith(expected)).to.be.true;
                expect(wrapper.vm.selectedRegion).to.be.an("string").that.is.empty;
            });
            it("should set the selectedReferenceData to undefined for date if no vale for selectedDate is set", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedDate = undefined;
                wrapper.vm.updateSelectedReferenceData("date");

                expect(setSelectedReferenceDataStub.calledWith(undefined)).to.be.true;
                expect(wrapper.vm.selectedRegion).to.be.an("string").that.is.empty;
            });
            it("should set the selectedReferenceData to the emit object for region", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    expected = {
                        type: "region",
                        value: "Hamburg"
                    },
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = "Hamburg";
                wrapper.vm.updateSelectedReferenceData("region");

                expect(setSelectedReferenceDataStub.calledWith(expected)).to.be.true;
                expect(wrapper.vm.selectedDate).to.be.an("string").that.is.empty;
            });
            it("should set the selectedReferenceData to undefined for region", () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = undefined;
                wrapper.vm.updateSelectedReferenceData("region");

                expect(setSelectedReferenceDataStub.calledWith(undefined)).to.be.true;
                expect(wrapper.vm.selectedDate).to.be.an("string").that.is.empty;
            });
            it("should set the selectedReferenceData", async () => {
                const wrapper = shallowMount(StatisticDashboardDifference, {
                        propsData: propsData,
                        global: {
                            plugins: [store]
                        }
                    }),
                    setSelectedReferenceDataStub = sinon.stub(wrapper.vm, "setSelectedReferenceData");

                wrapper.vm.selectedRegion = "Hamburg";
                wrapper.vm.updateSelectedReferenceData("region");
                expect(setSelectedReferenceDataStub.called).to.be.true;
            });
        });
    });
});
