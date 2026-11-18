import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import StatisticDashboardSpecificsSelection from "@modules/statisticDashboard/components/StatisticDashboardSpecificsSelection.vue";

describe("src/modules/statisticDashboard/components/StatisticDashboardSpecificsSelection.vue", () => {
    const statisticsAttributes = {
        popTotal: {name: "Population", category: "Pop", specifics: {gender: ["popM", "popF"], age: ["popYoung", "popMid", "popOld"]}},
        popM: {name: "Male", category: "Pop"},
        popF: {name: "Female", category: "Pop"},
        popYoung: {name: "Young", category: "Pop"},
        popMid: {name: "Middle", category: "Pop"},
        popOld: {name: "Old", category: "Pop"},
        jobsTotal: {name: "Jobs", category: "Pop", specifics: {gender: ["jobsF"]}},
        jobsF: {name: "Female jobs", category: "Pop"},
        area: {name: "Area", category: "Pop"}
    };

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
        store.commit("Modules/StatisticDashboard/setData", [{levelName: "Counties", mappingFilter: {statisticsAttributes}}]);
        store.commit("Modules/StatisticDashboard/setSelectedLevelName", "Counties");
        store.commit("Modules/StatisticDashboard/setShowAggregatedView", true);
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", ["popTotal", "jobsTotal"]);
    });

    /**
     * Mounts the specifics selection with the test store and a rendered accordion.
     * @returns {Wrapper} The mounted component.
     */
    function createWrapper () {
        return shallowMount(StatisticDashboardSpecificsSelection, {
            global: {
                plugins: [store],
                stubs: {AccordionItem: false}
            }
        });
    }

    it("renders a single accordion with the hint", () => {
        const wrapper = createWrapper();

        expect(wrapper.findAllComponents(AccordionItem)).to.have.lengthOf(1);
        expect(wrapper.find(".statistic-dashboard-specifics-hint").exists()).to.be.true;
    });

    it("renders one section per selected aggregated statistic with specifics, separated by hr", () => {
        const wrapper = createWrapper(),
            sections = wrapper.findAll(".statistic-dashboard-specifics-group");

        expect(sections).to.have.lengthOf(2);
        expect(sections[0].text()).to.contain("Population");
        expect(sections[1].text()).to.contain("Jobs");
        expect(wrapper.findAll("hr")).to.have.lengthOf(1);
        expect(wrapper.find(".statistic-dashboard-specifics-empty").exists()).to.be.false;
    });

    it("renders the empty state if no selected statistic has specifics", () => {
        store.commit("Modules/StatisticDashboard/setSelectedStatisticsKeys", ["area"]);
        const wrapper = createWrapper();

        expect(wrapper.find(".statistic-dashboard-specifics-empty").exists()).to.be.true;
        expect(wrapper.findAll(".statistic-dashboard-specifics-group")).to.have.lengthOf(0);
    });

    it("renders the tags as toggle pills and toggles a tag on click", async () => {
        const wrapper = createWrapper(),
            pills = wrapper.findAll(".statistic-dashboard-specifics-tag");

        expect(pills.map(pill => pill.text())).to.deep.equal(Array(3).fill("common:modules.statisticDashboard.dataSelectionExpanded.specificsTag"));
        expect(pills[0].attributes("aria-pressed")).to.equal("false");

        await pills[0].trigger("click");

        expect(store.state.Modules.StatisticDashboard.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
        expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal(["popTotal", "jobsTotal", "popM", "popF"]);
        expect(wrapper.findAll(".statistic-dashboard-specifics-tag")[0].attributes("aria-pressed")).to.equal("true");
        expect(wrapper.findAll(".statistic-dashboard-specifics-tag")[0].classes()).to.include("active-button");
    });

    it("does not render chips while no specific statistic is added", () => {
        const wrapper = createWrapper();

        expect(wrapper.findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(0);
    });

    it("removes a specific statistic when its chip is closed", async () => {
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "gender"});
        const wrapper = createWrapper(),
            chips = wrapper.findAll(".statistic-dashboard-specifics-chip");

        expect(chips).to.have.lengthOf(2);

        await chips[0].trigger("click:close");

        expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).to.deep.equal(["popTotal", "jobsTotal", "popF"]);
        expect(store.state.Modules.StatisticDashboard.selectedSpecificsTags).to.deep.equal({popTotal: ["gender"]});
    });

    it("renders one list per active tag in configured tag order", () => {
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "age"});
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "gender"});
        const wrapper = createWrapper(),
            lists = wrapper.findAll(".statistic-dashboard-specifics-list");

        expect(lists).to.have.lengthOf(2);
        expect(lists[0].findAll(".statistic-dashboard-specifics-chip").map(chip => chip.text())).to.deep.equal(["Male", "Female"]);
        expect(lists[1].findAll(".statistic-dashboard-specifics-chip").map(chip => chip.text())).to.deep.equal(["Young", "Middle", "Old"]);
        expect(lists[0].find(".statistic-dashboard-specifics-list-title").exists()).to.be.true;
        expect(lists[0].find(".statistic-dashboard-specifics-count").exists()).to.be.true;
    });

    it("does not render lists for inactive tags", () => {
        const wrapper = createWrapper();

        expect(wrapper.findAll(".statistic-dashboard-specifics-list")).to.have.lengthOf(0);
    });

    it("keeps the list of an active tag after all of its chips are removed", async () => {
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "jobsTotal", tag: "gender"});
        const wrapper = createWrapper();

        await wrapper.find(".statistic-dashboard-specifics-chip").trigger("click:close");

        expect(wrapper.findAll(".statistic-dashboard-specifics-list")).to.have.lengthOf(1);
        expect(wrapper.findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(0);
    });

    it("shows a shared specific statistic in every active list and removes it from all of them", async () => {
        store.commit("Modules/StatisticDashboard/setData", [{levelName: "Counties", mappingFilter: {statisticsAttributes: {
            ...statisticsAttributes,
            popTotal: {name: "Population", category: "Pop", specifics: {gender: ["popM", "popF"], age: ["popYoung", "popF"]}}
        }}}]);
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "gender"});
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "age"});
        const wrapper = createWrapper();

        expect(wrapper.findAll(".statistic-dashboard-specifics-chip").filter(chip => chip.text() === "Female")).to.have.lengthOf(2);

        await wrapper.findAll(".statistic-dashboard-specifics-chip").find(chip => chip.text() === "Female").trigger("click:close");

        expect(wrapper.findAll(".statistic-dashboard-specifics-chip").filter(chip => chip.text() === "Female")).to.have.lengthOf(0);
        expect(store.state.Modules.StatisticDashboard.selectedStatisticsKeys).not.to.include("popF");
    });

    it("limits the chips per list and toggles showing all of them per list", async () => {
        store.commit("Modules/StatisticDashboard/setSpecificsChipLimit", 2);
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "gender"});
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "age"});
        const wrapper = createWrapper();

        /**
         * Finds the rendered tag lists.
         * @returns {DOMWrapper[]} The tag lists.
         */
        function lists () {
            return wrapper.findAll(".statistic-dashboard-specifics-list");
        }

        expect(lists()[0].findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(2);
        expect(lists()[0].find(".statistic-dashboard-specifics-toggle").exists()).to.be.false;
        expect(lists()[1].findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(2);

        await lists()[1].find(".statistic-dashboard-specifics-toggle").trigger("click");
        expect(lists()[1].findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(3);

        await lists()[1].find(".statistic-dashboard-specifics-toggle").trigger("click");
        expect(lists()[1].findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(2);
    });

    it("shows all chips without toggle if the limit is below 1", () => {
        store.commit("Modules/StatisticDashboard/setSpecificsChipLimit", 0);
        store.commit("Modules/StatisticDashboard/toggleSpecificsTag", {statisticKey: "popTotal", tag: "age"});
        const wrapper = createWrapper();

        expect(wrapper.findAll(".statistic-dashboard-specifics-chip")).to.have.lengthOf(3);
        expect(wrapper.find(".statistic-dashboard-specifics-toggle").exists()).to.be.false;
    });
});
