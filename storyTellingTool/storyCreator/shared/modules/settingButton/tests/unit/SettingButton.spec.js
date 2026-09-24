import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import SettingButton from "../../../components/shared/modules/settingButton/components/SettingButton.vue";

describe("addons/storyTellingTool/storyCreator/components/shared/modules/settingButton/components/SettingButton.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(SettingButton, {
            props: {
                id: "test-button",
                ariaLabel: "Test button",
                title: "Test title",
                icon: "bi bi-test"
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;

        });

        it("should render the button attributes", () => {
            const button = wrapper.find("button");

            expect(button.attributes("id")).to.equal("test-button");
            expect(button.attributes("aria-label")).to.equal("Test button");
            expect(button.attributes("title")).to.equal("Test title");
            expect(button.attributes("type")).to.equal("button");
        });

        it("should render the configured icon", () => {
            expect(wrapper.find("i").classes()).to.include("bi");
            expect(wrapper.find("i").classes()).to.include("bi-test");
        });

        it("should not render a value by default", () => {
            expect(wrapper.find("span").exists()).to.be.false;
        });

        it("should render the value when provided", async () => {
            await wrapper.setProps({
                value: "24px"
            });

            expect(wrapper.find("span").exists()).to.be.true;
            expect(wrapper.find("span").text()).to.equal("24px");
        });

        it("should apply the active class when active", async () => {
            await wrapper.setProps({
                active: true
            });

            expect(wrapper.find("button").classes()).to.include("active");
        });

        it("should not apply the active class by default", () => {
            expect(wrapper.find("button").classes()).to.not.include("active");
        });

        it("should render slot content", () => {
            const slotWrapper = shallowMount(SettingButton, {
                props: {
                    id: "test-button",
                    ariaLabel: "Test button",
                    title: "Test title",
                    icon: "bi bi-test"
                },
                slots: {
                    default: "<input id='slot-input' type='color'>"
                }
            });

            expect(slotWrapper.find("#slot-input").exists()).to.be.true;
        });

    });
});

