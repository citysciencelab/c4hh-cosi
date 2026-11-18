import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StatisticDashboardLoadError from "@modules/statisticDashboard/components/StatisticDashboardLoadError.vue";

describe("src/modules/statisticDashboard/components/StatisticDashboardLoadError.vue", () => {
    it("should render the error message as alert", () => {
        const wrapper = shallowMount(StatisticDashboardLoadError),
            alert = wrapper.find(".alert-danger");

        expect(alert.exists()).to.be.true;
        expect(alert.attributes("role")).to.equal("alert");
        expect(alert.text()).to.equal("common:modules.statisticDashboard.loadingError");
        wrapper.unmount();
    });

    it("should not render the spinner or the dashboard", () => {
        const wrapper = shallowMount(StatisticDashboardLoadError);

        expect(wrapper.findComponent({name: "SpinnerItem"}).exists()).to.be.false;
        expect(wrapper.findComponent({name: "StatisticDashboard"}).exists()).to.be.false;
        wrapper.unmount();
    });
});
