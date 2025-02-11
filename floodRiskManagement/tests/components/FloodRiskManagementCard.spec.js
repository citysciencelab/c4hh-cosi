import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FloodRiskManagementCard from "../../components/FloodRiskManagementCard.vue";

config.global.mocks.$t = key => key;

describe("addons/floodRiskManagement/components/FloodRiskManagementCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(FloodRiskManagementCard, {
                propsData: {
                    title: "CardTitle"
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("should render card", () => {
            const wrapper = shallowMount(FloodRiskManagementCard, {
                propsData: {
                    title: "CardTitle"
                }
            });

            expect(wrapper.find(".card").exists()).to.be.true;
        });
        it("should render icon if icon was given", () => {
            const wrapper = shallowMount(FloodRiskManagementCard, {
                propsData: {
                    title: "CardTitle",
                    icon: "bi-water"
                }
            });

            expect(wrapper.find(".bi-water").exists()).to.be.true;
        });
        it("should render text if text was given", () => {
            const wrapper = shallowMount(FloodRiskManagementCard, {
                propsData: {
                    title: "CardTitle",
                    text: "Beispieltext"
                }
            });

            expect(wrapper.find(".card-text").exists()).to.be.true;
        });
    });

});
