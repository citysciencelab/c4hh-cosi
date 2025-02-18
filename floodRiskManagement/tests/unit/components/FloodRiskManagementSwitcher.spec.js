import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FloodRiskManagementSwitcher from "../../../components/FloodRiskManagementSwitcher.vue";
import SpinnerItem from "../../../../../src/shared/modules/spinner/components/SpinnerItem.vue";

config.global.mocks.$t = key => key;

describe("addons/floodRiskManagement/components/FloodRiskManagementSwitcher.vue", () => {
    describe("Component DOM", () => {
        const buttons = ["Button1", "Button2"],
            subText = ["sub1", "sub2"],
            selectedValue = "Button2";

        it("should exist", () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    group: "burrongroup",
                    selectedValue
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("should render buttongroup", () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    group: "buttongroup",
                    selectedValue
                }
            });

            expect(wrapper.find(".btn-group").exists()).to.be.true;
        });
        it("should render two buttons if two button names were given", () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    group: "buttongroup",
                    selectedValue
                }
            });

            expect(wrapper.findAll(".btn")).lengthOf(2);
        });
        it("should render sub text", () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    subText,
                    group: "buttongroup",
                    selectedValue
                }
            });

            expect(wrapper.find(".subtext").exists()).to.be.true;
        });
        it("should not render component SpinnerItem", () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    group: "burrongroup",
                    selectedValue
                }
            });

            expect(wrapper.findComponent(SpinnerItem).exists()).to.be.false;
        });
        it("should render component SpinnerItem", async () => {
            const wrapper = shallowMount(FloodRiskManagementSwitcher, {
                propsData: {
                    buttons,
                    group: "burrongroup",
                    selectedValue
                }
            });

            await wrapper.setData(
                {
                    showLoadSpinner: true
                }
            );
            await wrapper.vm.$nextTick();

            expect(wrapper.findComponent(SpinnerItem).exists()).to.be.true;
        });
    });
});
