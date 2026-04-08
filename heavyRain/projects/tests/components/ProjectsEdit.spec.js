import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ProjectsEdit from "../../components/ProjectsEdit.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/projects/components/ProjectsEdit.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(ProjectsEdit, {});

            expect(wrapper.exists()).to.be.true;
        });
    });
});
