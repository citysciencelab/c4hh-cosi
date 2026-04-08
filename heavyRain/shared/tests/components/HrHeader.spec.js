import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrHeader from "../../components/HrHeader.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrHeader.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrHeader, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
