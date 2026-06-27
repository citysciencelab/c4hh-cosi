import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import AddElementDropdown from "../../../components/AddElementDropdown.vue";

config.global.mocks.$t = key => key;

describe("addons/storyTellingTool/storyCreator/shared/modules/AddElementDropdown/components/AddElementDropdown.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(AddElementDropdown);
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe("Rendering (Default Behavior)", () => {
        it("should render the main dropdown button", () => {
            const button = wrapper.find(".add-button");

            expect(button.exists()).to.be.true;
        });

        it("should render all 4 default items when no 'allowedActions' are provided", () => {
            const items = wrapper.findAll(".dropdown-item");

            expect(items.length).to.equal(4);
        });

        it("should render 2 category headers and exactly 1 divider", () => {
            const headers = wrapper.findAll(".dropdown-header"),
                dividers = wrapper.findAll(".dropdown-divider");

            expect(headers.length).to.equal(2);
            expect(dividers.length).to.equal(1);
        });
    });

    describe("Filtering with 'allowedActions'", () => {
        it("should only render the items permitted in 'allowedActions'", async () => {
            await wrapper.setProps({allowedActions: ["text", "image"]});
            const items = wrapper.findAll(".dropdown-item");

            expect(items.length).to.equal(2);
            expect(items.at(0).find("i.bi-type").exists()).to.be.true;
            expect(items.at(1).find("i.bi-image").exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("getTranslation", () => {
            it("should construct the correct translation path for categories", () => {
                const result = wrapper.vm.getTranslation("categories", "media");

                expect(result).to.equal("additional:modules.storyCreator.addElementDropdown.categories.media");
            });

            it("should construct the correct translation path for items", () => {
                const result = wrapper.vm.getTranslation("items", "video");

                expect(result).to.equal("additional:modules.storyCreator.addElementDropdown.items.video");
            });
        });
    });

    describe("Edge Cases", () => {
        it("should render all default items when 'allowedActions' is explicitly an empty array", async () => {
            await wrapper.setProps({allowedActions: []});
            const items = wrapper.findAll(".dropdown-item");

            expect(items.length).to.equal(4);
        });

        it("should ignore unknown action names in 'allowedActions' and only render valid ones", async () => {
            await wrapper.setProps({allowedActions: ["text", "flying_unicorn"]});
            const items = wrapper.findAll(".dropdown-item");

            expect(items.length).to.equal(1);
            expect(items.at(0).find("i.bi-type").exists()).to.be.true;
        });

        it("should not render a divider if the filtered items belong to only one category", async () => {
            await wrapper.setProps({allowedActions: ["image", "video"]});

            const dividers = wrapper.findAll(".dropdown-divider"),
                headers = wrapper.findAll(".dropdown-header");

            expect(headers.length).to.equal(1);
            expect(dividers.length).to.equal(0);
        });
    });

    describe("Events", () => {
        it("should emit the 'action-triggered' event with the correct payload when an item is clicked", async () => {
            const items = wrapper.findAll(".dropdown-item"),
                firstItem = items.at(0);

            await firstItem.trigger("click");

            const emittedEvents = wrapper.emitted("action-triggered");

            expect(emittedEvents).to.exist;
            expect(emittedEvents.length).to.equal(1);
            expect(emittedEvents[0]).to.deep.equal(["text"]);
        });
    });
});
