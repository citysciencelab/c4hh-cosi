import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import UpdateRequirements from "../../components/UpdateRequirements.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/updateRequirements/components/updateRequirements.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(UpdateRequirements);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render HrHeader in main view", () => {
            const wrapper = shallowMount(UpdateRequirements);

            expect(wrapper.findComponent({name: "HrHeader"}).exists()).to.be.true;
            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.false;
        });

        it("should render HrFooter in create-new view", async () => {
            const wrapper = shallowMount(UpdateRequirements);

            await wrapper.setData({currentView: "create-new"});

            expect(wrapper.findComponent({name: "HrHeader"}).exists()).to.be.false;
            expect(wrapper.findComponent({name: "HrFooter"}).exists()).to.be.true;
        });
    });
});
