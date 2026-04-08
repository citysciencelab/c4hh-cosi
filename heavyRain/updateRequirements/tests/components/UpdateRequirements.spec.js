import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import UpdateRequirements from "../../components/UpdateRequirements.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/updateRequirements/components/updateRequirements.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(UpdateRequirements, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
