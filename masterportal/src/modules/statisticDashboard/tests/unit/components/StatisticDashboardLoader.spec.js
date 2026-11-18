import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StatisticDashboardLoader from "@modules/statisticDashboard/components/StatisticDashboardLoader.vue";

describe("src/modules/statisticDashboard/components/StatisticDashboardLoader.vue", () => {
    it("should implement the keep-alive hooks, so the menu caches the dashboard", () => {
        expect(StatisticDashboardLoader.activated).to.be.a("function");
        expect(StatisticDashboardLoader.deactivated).to.be.a("function");
    });

    it("should register the statistic dashboard as async component", () => {
        expect(StatisticDashboardLoader.components.StatisticDashboard.__asyncLoader).to.be.a("function");
    });

    it("should render the statistic dashboard", () => {
        const wrapper = shallowMount(StatisticDashboardLoader);

        expect(wrapper.findComponent({name: "StatisticDashboard"}).exists()).to.be.true;
        wrapper.unmount();
    });
});
