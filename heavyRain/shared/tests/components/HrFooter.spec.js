import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrFooter from "../../components/HrFooter.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrFooter.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrFooter, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
