import TabInfoComponent from "../../../components/Tabs/TabInfo.vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";

/**
 * Run these test via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ info tab component"
 */

config.global.mocks.$t = key => key;

describe("addons/vpiDashboard/test/ loader component", () => {
    let wrapper = null;

    beforeEach(() => {
        wrapper = shallowMount(TabInfoComponent);
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the info tab component", ()=> {
        expect(wrapper.find("#vpiDashboardTabInfo").exists()).to.be.true;
    });

});
