import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import StoryCreator from "../../../components/StoryCreator.vue";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/storyCreator.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(StoryCreator);

            expect(wrapper.exists()).to.be.true;
        });
    });
});
