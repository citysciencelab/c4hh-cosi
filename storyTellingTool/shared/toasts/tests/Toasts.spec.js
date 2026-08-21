import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Toasts from "../components/ToastsElement.vue";


describe("addons/shared/components/ToastsElement.vue", () => {
    describe("Component DOM", () => {
        it("should exist and render the info text", () => {
            const wrapper = shallowMount(Toasts, {
                props: {
                    text: "Text"
                }
            });

            expect(wrapper.exists()).to.be.true;
            expect(wrapper.find(".info").text()).to.equal("Text");
        });

        it("should exist and render the success text", () => {
            const wrapper = shallowMount(Toasts, {
                props: {
                    type: "success",
                    text: "success"
                }
            });

            expect(wrapper.exists()).to.be.true;
            expect(wrapper.find(".success").text()).to.equal("success");
        });
    });
});
