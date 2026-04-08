import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrDraw from "../../components/HrDraw.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrDraw.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrDraw, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
