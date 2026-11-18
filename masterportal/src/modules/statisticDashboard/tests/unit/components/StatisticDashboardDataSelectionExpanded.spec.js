import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import StatisticDashboardDataSelectionExpanded from "@modules/statisticDashboard/components/StatisticDashboardDataSelectionExpanded.vue";
import StatisticDashboardDifference from "@modules/statisticDashboard/components/StatisticDashboardDifference.vue";
import StatisticDashboardSpecificsSelection from "@modules/statisticDashboard/components/StatisticDashboardSpecificsSelection.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

describe("src/modules/statisticDashboard/components/StatisticDashboardDataSelectionExpanded.vue", () => {
    const statisticAttributes = {
            populationTotal: {name: "Total population", category: "Population", specifics: {gender: ["populationFemale"]}},
            populationFemale: {name: "Female population", category: "Population"},
            employmentTotal: {name: "Total employment", category: "Employment"}
        },
        levels = [
            {
                levelName: "Counties",
                mappingFilter: {statisticsAttributes: statisticAttributes}
            },
            {
                levelName: "Municipalities",
                mappingFilter: {statisticsAttributes: statisticAttributes}
            }
        ];

    let store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StatisticDashboard: {
                            ...indexStatisticDashboard,
                            state: structuredClone(indexStatisticDashboard.state)
                        }
                    }
                }
            }
        });
        store.commit("Modules/StatisticDashboard/setData", levels);
        store.commit("Modules/StatisticDashboard/setSelectedLevelName", "Counties");
        store.commit("Modules/StatisticDashboard/setSelectedCategories", ["Population"]);
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", ["populationTotal", "populationFemale"]);
    });

    /**
     * Mounts the expanded data selection with the test store.
     * @returns {Wrapper} The mounted component.
     */
    function createWrapper () {
        return shallowMount(StatisticDashboardDataSelectionExpanded, {
            global: {
                plugins: [store]
            }
        });
    }

    it("filters the statistic options by selected categories", () => {
        const wrapper = createWrapper();

        expect(wrapper.findAllComponents(DropdownAutocomplete)[1].props("items")).to.deep.equal([
            {value: "populationTotal", title: "Total population"},
            {value: "populationFemale", title: "Female population"}
        ]);
    });

    it("returns no statistic options when no level is selected", () => {
        store.commit("Modules/StatisticDashboard/setSelectedLevelName", "Missing level");
        const wrapper = createWrapper();

        expect(wrapper.findAllComponents(DropdownAutocomplete)[1].props("items")).to.deep.equal([]);
    });

    it("does not render the specifics selection if showAggregatedView is disabled", () => {
        const wrapper = createWrapper();

        expect(wrapper.findComponent(StatisticDashboardSpecificsSelection).exists()).to.be.false;
    });

    describe("showAggregatedView enabled", () => {
        beforeEach(() => {
            store.commit("Modules/StatisticDashboard/setShowAggregatedView", true);
            store.commit("Modules/StatisticDashboard/setSelectedSpecificsTags", {populationTotal: ["gender"]});
        });

        it("offers only aggregated statistics and renders the specifics selection", () => {
            const wrapper = createWrapper(),
                statisticDropdown = wrapper.findAllComponents(DropdownAutocomplete)[1];

            expect(statisticDropdown.props("items")).to.deep.equal([
                {value: "populationTotal", title: "Total population"}
            ]);
            expect(statisticDropdown.props("modelValue")).to.deep.equal(["populationTotal"]);
            expect(wrapper.findComponent(StatisticDashboardSpecificsSelection).exists()).to.be.true;
        });

        it("keeps covered specific statistics when the aggregated statistics change", async () => {
            const wrapper = createWrapper(),
                statisticDropdown = wrapper.findAllComponents(DropdownAutocomplete)[1];

            await statisticDropdown.vm.$emit("update:model-value", ["populationTotal"]);

            expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal(["populationTotal", "populationFemale"]);
        });

        it("removes specific statistics when their aggregated statistic is deselected", async () => {
            const wrapper = createWrapper(),
                statisticDropdown = wrapper.findAllComponents(DropdownAutocomplete)[1];

            await statisticDropdown.vm.$emit("update:model-value", []);

            expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal([]);
            expect(store.state.Modules.StatisticDashboard.selectedSpecificsTags).to.deep.equal({});
        });
    });

    it("configures the category and statistic dropdowns as sortable with the selected entries first", () => {
        const wrapper = createWrapper(),
            [categoryDropdown, statisticDropdown] = wrapper.findAllComponents(DropdownAutocomplete);

        [categoryDropdown, statisticDropdown].forEach(dropdown => {
            expect(dropdown.props("sortable")).to.be.true;
            expect(dropdown.props("selectedFirst")).to.be.true;
        });
        expect(categoryDropdown.props("items")).to.deep.equal(wrapper.vm.categories);
        expect(statisticDropdown.props("items")).to.deep.equal(wrapper.vm.selectableStatistics);
    });

    it("does not sort the items of the date dropdown", () => {
        const wrapper = createWrapper(),
            dateDropdown = wrapper.findAllComponents(DropdownAutocomplete)[2];

        expect(dateDropdown.props("sortable")).to.be.false;
    });

    it("passes the selected dates sorted alphabetically to the dropdown chips", () => {
        const dates = [
            {value: "2022", title: "2022"},
            {value: ["2019", "2020"], title: "Letzte 2 Jahre"},
            {value: "2018", title: "2018"}
        ];

        store.commit("Modules/StatisticDashboard/setSelectedDates", dates);
        const wrapper = createWrapper(),
            dateDropdown = wrapper.findAllComponents(DropdownAutocomplete)[2];

        expect(dateDropdown.props("modelValue")).to.deep.equal([dates[2], dates[0], dates[1]]);
        expect(store.state.Modules.StatisticDashboard.selectedDates).to.deep.equal(dates);
    });

    it("passes no selected dates to the dropdown chips if selected dates are not an array", () => {
        [undefined, null, "", {}].forEach(value => {
            expect(StatisticDashboardDataSelectionExpanded.computed.selectedDatesSorted.call({selectedDates: value})).to.deep.equal([]);
        });
    });

    it("updates the selected categories and removes statistics outside them", async () => {
        const wrapper = createWrapper(),
            categoryDropdown = wrapper.findAllComponents(DropdownAutocomplete)[0];

        await categoryDropdown.vm.$emit("update:model-value", ["Employment"]);

        expect(store.state.Modules.StatisticDashboard.selectedCategories).to.deep.equal(["Employment"]);
        expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal([]);
    });

    it("updates selected statistics from the statistic dropdown", async () => {
        const wrapper = createWrapper(),
            statisticDropdown = wrapper.findAllComponents(DropdownAutocomplete)[1];

        await statisticDropdown.vm.$emit("update:model-value", ["populationFemale"]);

        expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal(["populationFemale"]);
    });

    it("renders level buttons and changes the selected level", async () => {
        const wrapper = createWrapper(),
            buttonGroup = wrapper.findComponent(ButtonGroup);

        expect(buttonGroup.props("buttons")).to.deep.equal([
            {name: "Counties"},
            {name: "Municipalities"}
        ]);

        await buttonGroup.vm.$emit("set-selected-button", "Municipalities");

        expect(store.state.Modules.StatisticDashboard.selectedLevelName).to.equal("Municipalities");
    });

    it("shows difference controls after enabling the difference switch", async () => {
        const wrapper = createWrapper(),
            differenceSwitch = wrapper.findComponent(SwitchInput);

        expect(wrapper.findComponent(StatisticDashboardDifference).exists()).to.be.false;

        await differenceSwitch.vm.$emit("update:model-value", true);

        expect(wrapper.findComponent(StatisticDashboardDifference).exists()).to.be.true;
    });

    it("emits the showData event when the action button is activated", () => {
        const wrapper = createWrapper(),
            showDataButton = wrapper.findComponent(FlatButton);

        showDataButton.props("interaction")();

        expect(wrapper.emitted("click:showData")).to.have.lengthOf(1);
    });
});
