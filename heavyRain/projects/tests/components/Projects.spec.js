import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Projects from "../../components/Projects.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/projects/components/Projects.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(Projects, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
