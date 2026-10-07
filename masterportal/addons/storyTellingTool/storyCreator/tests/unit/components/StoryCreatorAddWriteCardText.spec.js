import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreatorAddWriteCardText from "../../../components/StoryCreatorAddWriteCardText.vue";

describe("addons/storyTellingTool/storyCreator/components/StoryCreatorAddWriteCardText.vue", () => {
    let wrapper, currentLayout;

    beforeEach(() => {
        currentLayout = {
            textColor: "rgb(255, 255, 255)",
            fontSize: 24,
            fontStyle: "regular",
            backgroundColor: "rgb(0, 0, 0)",
            backgroundOpacity: 50
        };

        wrapper = shallowMount(StoryCreatorAddWriteCardText, {
            props: {
                currentLayout,
                setCurrentLayout: sinon.spy()
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should render the text settings buttons", () => {
            expect(wrapper.find("#text-layout-textColor").exists()).to.be.true;
            expect(wrapper.find("#text-layout-fontSize").exists()).to.be.true;
            expect(wrapper.find("#text-layout-fontStyle").exists()).to.be.true;
        });

        it("should render the background settings buttons", () => {
            expect(wrapper.find("#text-layout-backgroundColor").exists()).to.be.true;
            expect(wrapper.find("#text-layout-backgroundOpacity").exists()).to.be.true;
        });

        it("should render the color pickers", () => {
            expect(wrapper.find("#color-picker-textColor").exists()).to.be.true;
            expect(wrapper.find("#color-picker-backgroundColor").exists()).to.be.true;
        });

        it("should show the font size slider when font size is active", async () => {
            await wrapper.setData({activeLayoutKey: "fontSize"});

            expect(wrapper.find("#text-font-size").exists()).to.be.true;
        });

        it("should show the background opacity slider when background opacity is active", async () => {
            await wrapper.setData({activeLayoutKey: "backgroundOpacity"});

            expect(wrapper.find("#text-background-opacity").exists()).to.be.true;
        });

        it("should show the font style dropdown when font style is active", async () => {
            await wrapper.setData({activeLayoutKey: "fontStyle"});

            const dropdownItems = wrapper.findAll(".dropdown-item");

            expect(wrapper.find(".dropdown-menu").exists()).to.be.true;
            expect(dropdownItems).to.have.lengthOf(3);
        });
    });
    describe("Methods", () => {
        describe("updateCurrentLayout", () => {
            it("should update color values as RGB", () => {
                wrapper.vm.updateCurrentLayout("textColor", "#ff0000");

                expect(wrapper.vm.setCurrentLayout.calledOnce).to.be.true;
                expect(wrapper.vm.setCurrentLayout.firstCall.args[0]).to.deep.equal({
                    ...currentLayout,
                    textColor: [255, 0, 0]
                });
            });

            it("should update numeric values as numbers", () => {
                wrapper.vm.updateCurrentLayout("fontSize", "36");

                expect(wrapper.vm.setCurrentLayout.calledOnce).to.be.true;
                expect(wrapper.vm.setCurrentLayout.firstCall.args[0]).to.deep.equal({
                    ...currentLayout,
                    fontSize: 36
                });
            });

            it("should not change the layout for an unknown key", () => {
                wrapper.vm.updateCurrentLayout("unknown", "test");

                expect(wrapper.vm.setCurrentLayout.calledOnce).to.be.true;
                expect(wrapper.vm.setCurrentLayout.firstCall.args[0]).to.deep.equal(
                    currentLayout
                );
            });
        });
    });
});
