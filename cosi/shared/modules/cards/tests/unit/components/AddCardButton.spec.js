import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import AddCardButton from "../../../components/AddCardButton.vue";

config.global.mocks.$t = key => key;

describe("addons/cosi/shared/modules/cards/components/AddCardButton.vue", () => {
    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(AddCardButton);

            expect(wrapper.exists()).to.be.true;
        });

        it("should render the default text", () => {
            const wrapper = shallowMount(AddCardButton);

            expect(wrapper.text()).to.equal("Inhalte hinzufügen");
        });

        it("should render the given text", () => {
            const wrapper = shallowMount(AddCardButton, {
                props: {
                    text: "Add content"
                }
            });

            expect(wrapper.text()).to.equal("Add content");
        });

        it("should render the default icon", () => {
            const wrapper = shallowMount(AddCardButton),
                icon = wrapper.find("i");

            expect(icon.exists()).to.be.true;
            expect(icon.classes()).to.include("bi-plus-circle");
        });

        it("should render the given icon", () => {
            const wrapper = shallowMount(AddCardButton, {
                    props: {
                        icon: "bi-plus"
                    }
                }),
                icon = wrapper.find("i");

            expect(icon.exists()).to.be.true;
            expect(icon.classes()).to.include("bi-plus");
        });

    });

    describe("User Interaction", () => {
        it("should emit 'click' event when user clicked the button", async () => {
            const wrapper = shallowMount(AddCardButton),
                button = wrapper.find("button");

            await button.trigger("click");
            expect(wrapper.emitted("click").length).to.equal(1);
        });
    });
});
