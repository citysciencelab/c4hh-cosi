import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrHeader from "../../components/HrHeader.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrHeader.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(HrHeader, {
                props: {text: "Header text"}
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("renders provided text", () => {
            const wrapper = shallowMount(HrHeader, {
                props: {text: "Header text"}
            });

            expect(wrapper.text()).to.contain("Header text");
        });

        it("renders FlatButton", () => {
            const wrapper = shallowMount(HrHeader, {
                props: {text: "Header text"}
            });

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("emits click:button when FlatButton interaction is triggered", async () => {
            const wrapper = shallowMount(HrHeader, {
                props: {text: "Header text"}
            });

            await wrapper.findComponent({name: "FlatButton"}).props("interaction")();

            expect(wrapper.emitted("click:button")).to.exist;
        });
    });
});
