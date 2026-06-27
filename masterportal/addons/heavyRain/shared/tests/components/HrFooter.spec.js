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

        it("should render a cancel button", () => {
            const wrapper = shallowMount(HrFooter, {});
            const buttons = wrapper.findAllComponents({name: "FlatButton"});

            expect(buttons[0].exists()).to.be.true;
        });

        it("should render a save button", () => {
            const wrapper = shallowMount(HrFooter, {});
            const buttons = wrapper.findAllComponents({name: "FlatButton"});

            expect(buttons[1].exists()).to.be.true;
        });

        it("should emit click:cancel on cancel interaction", () => {
            const wrapper = shallowMount(HrFooter, {});
            const buttons = wrapper.findAllComponents({name: "FlatButton"});

            buttons[0].props("interaction")();

            expect(wrapper.emitted("click:cancel")).to.have.lengthOf(1);
        });

        it("should emit click:save on save interaction", () => {
            const wrapper = shallowMount(HrFooter, {});
            const buttons = wrapper.findAllComponents({name: "FlatButton"});

            buttons[1].props("interaction")();

            expect(wrapper.emitted("click:save")).to.have.lengthOf(1);
        });
    });
});
