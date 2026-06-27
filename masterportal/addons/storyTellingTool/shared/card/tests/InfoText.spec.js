import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import InfoText from "../components/InfoText.vue";

config.global.mocks.$t = key => key;

describe("addons/shared/components/InfoCard.vue", () => {
    describe("Component DOM", () => {
        it("should exist and render the text", () => {
            const wrapper = shallowMount(InfoText, {
                props: {
                    text: "Text"
                }
            });

            expect(wrapper.exists()).to.be.true;
            expect(wrapper.find(".alert-info").text()).to.equal("Text");
        });
    });
});
