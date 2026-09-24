import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreatorAddWriteCardStroke from "../../../components/StoryCreatorAddWriteCardStroke.vue";

describe("addons/storyTellingTool/storyCreator/components/StoryCreatorAddWriteCardStroke.vue", () => {
    let wrapper, currentLayout;

    beforeEach(() => {
        currentLayout = {
            type: "arrow",
            color: "rgb(0, 0, 0)",
            width: 3
        };

        wrapper = shallowMount(StoryCreatorAddWriteCardStroke, {
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

        it("should render the stroke settings buttons", () => {
            expect(wrapper.find("#stroke-layout-type").exists()).to.be.true;
            expect(wrapper.find("#stroke-layout-color").exists()).to.be.true;
            expect(wrapper.find("#stroke-layout-width").exists()).to.be.true;
        });

        it("should render the stroke color picker", () => {
            expect(wrapper.find("#color-picker-stroke").exists()).to.be.true;
        });

        it("should show the type dropdown when type is active", async () => {
            await wrapper.setData({
                activeLayoutKey: "type"
            });

            expect(wrapper.find(".dropdown-menu").exists()).to.be.true;
            expect(wrapper.findAll(".dropdown-item")).to.have.lengthOf(2);
        });

        it("should show the width slider when width is active", async () => {
            await wrapper.setData({
                activeLayoutKey: "width"
            });

            expect(wrapper.find("#stroke-width").exists()).to.be.true;
        });

        it("should not show the width slider when another setting is active", async () => {
            await wrapper.setData({
                activeLayoutKey: "color"
            });

            expect(wrapper.find("#stroke-width").exists()).to.be.false;
        });
    });
    describe("Methods", () => {
        describe("updateCurrentLayout", () => {
            it("should update color values as RGB", () => {
                wrapper.vm.updateCurrentLayout("color", "#ff0000");

                expect(wrapper.vm.setCurrentLayout.calledOnce).to.be.true;
                expect(wrapper.vm.setCurrentLayout.firstCall.args[0]).to.deep.equal({
                    ...currentLayout,
                    color: [255, 0, 0]
                });
            });

            it("should update numeric values as numbers", () => {
                wrapper.vm.updateCurrentLayout("width", "8");

                expect(wrapper.vm.setCurrentLayout.calledOnce).to.be.true;
                expect(wrapper.vm.setCurrentLayout.firstCall.args[0]).to.deep.equal({
                    ...currentLayout,
                    width: 8
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
