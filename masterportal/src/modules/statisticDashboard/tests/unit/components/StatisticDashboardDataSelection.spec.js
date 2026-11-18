import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {describe, it, expect} from "vitest";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import StatisticDashboardDataSelection from "../../../components/StatisticDashboardDataSelection.vue";

describe("StatisticDashboardDataSelection.vue", () => {
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
        store.commit("Modules/StatisticDashboard/setSelectedCategories", ["Population"]);
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", ["populationTotal"]);
        store.commit("Modules/StatisticDashboard/setSelectedRegions", [{value: "Hamburg", title: "Hamburg"}]);
        store.commit("Modules/StatisticDashboard/setSelectedDates", [{value: "2024"}]);
        store.commit("Modules/StatisticDashboard/setSelectedReferenceData", {
            type: "date",
            value: {label: "2023"}
        });
    });

    /**
     * Mounts the expanded data selection with the test store.
     * @returns {Wrapper} The mounted component.
     */
    function createWrapper () {
        return shallowMount(StatisticDashboardDataSelection, {
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }
        });
    }


    it("renders the edit button and is collapsed by default", () => {
        const wrapper = createWrapper();

        expect(wrapper.vm.isExpanded).toBe(false);
        expect(wrapper.find("button.btn-text").exists()).toBe(true);
        expect(wrapper.find("#close-filter-button").isVisible()).toBe(false);
    });

    it("sets isExpanded to true when the edit button is clicked", async () => {
        const wrapper = createWrapper();

        await wrapper.find("button.btn-text").trigger("click");

        expect(wrapper.vm.isExpanded).toBe(true);
        expect(wrapper.find("button.btn-text").exists()).toBe(false);
    });

    it("renders reset and close buttons when expanded", async () => {
        const wrapper = createWrapper();

        await wrapper.setData({isExpanded: true});

        expect(wrapper.find("#reset-filter-button").exists()).toBe(true);
        expect(wrapper.find("#close-filter-button").exists()).toBe(true);
    });

    it("sets isExpanded to false when the close button is clicked", async () => {
        const wrapper = createWrapper();

        await wrapper.setData({isExpanded: true});

        const iconButtons = wrapper.findAllComponents(IconButton);
        const closeButton = iconButtons.find(button => button.props("id") === "close-filter-button"
            || button.attributes("id") === "close-filter-button");

        await closeButton.vm.$emit("click");

        expect(wrapper.vm.isExpanded).toBe(false);
        expect(wrapper.find("button.btn-text").exists()).toBe(true);
    });

    it("shows the filter badges when all required filters are selected", () => {
        const wrapper = createWrapper();

        expect(wrapper.findAll(".filter-count-badge")).to.have.lengthOf(4);
        expect(wrapper.find("small").exists()).to.be.false;
    });

    it("shows the info text when the selection is incomplete", () => {
        store.commit("Modules/StatisticDashboard/setSelectedDates", []);

        const wrapper = createWrapper();

        expect(wrapper.find("small").exists()).to.be.true;
    });
});
