import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrCard from "../../components/HrCard.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrCard, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
