import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FloodRiskManagementSwitcher from "../../components/FloodRiskManagementSwitcher.vue";

config.global.mocks.$t = key => key;

describe("addons/floodRiskManagement/components/FloodRiskManagementSwitcher.vue", () => {
    describe("Component DOM", () => {
        const buttons = [{
                name: "Button1"
            },
            {
                name: "Button2"
            }],
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
    });

});
