import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import StoryCreatorBreadcrumb from "../../../components/StoryCreatorBreadcrumb.vue";

describe("addons/storyTellingTool/storyCreator/components/StoryCreatorBreadcrumb.vue", () => {
    const props = {
        chapterTitle: "Chapter 1",
        currentView: "story",
        storyTitle: "My Story"
    };

    /**
     * Mounts the StoryCreatorBreadcrumb component with the given additional props.
     * @params {Object} additionalProps - Additional props to pass to the component.
     * @returns {Wrapper} - The mounted component wrapper.
     */
    function mountComponent (additionalProps = {}) {
        return shallowMount(StoryCreatorBreadcrumb, {
            props: {
                ...props,
                ...additionalProps
            }
        });
    }

    describe("DOM", () => {
        it("should render the story title and manager link", () => {
            const wrapper = mountComponent();

            expect(wrapper.find(".story-breadcrumb").exists()).to.be.true;
            expect(wrapper.findAll(".breadcrumb-item")).to.have.lengthOf(2);
            expect(wrapper.text()).to.include("My Story");
            expect(wrapper.text()).not.to.include("Chapter 1");
        });

        it("should render the story and chapter navigation", () => {
            const wrapper = mountComponent({currentView: "chapter"});

            expect(wrapper.findAll(".breadcrumb-item")).to.have.lengthOf(3);
            expect(wrapper.text()).to.include("My Story");
            expect(wrapper.text()).to.include("Chapter 1");
        });

        it("should not render chapter navigation for an unsupported view", () => {
            const wrapper = mountComponent({currentView: "unsupported"});

            expect(wrapper.findAll(".breadcrumb-item")).to.have.lengthOf(1);
            expect(wrapper.text()).not.to.include("Chapter 1");
        });
    });

    describe("User Interactions", () => {
        it("should emit go-to-manager when the manager link is clicked", async () => {
            const wrapper = mountComponent();

            await wrapper.find(".story-breadcrumb__link").trigger("click");

            expect(wrapper.emitted("go-to-manager")).to.have.lengthOf(1);
        });

        it("should emit go-to-story when the story link is clicked", async () => {
            const wrapper = mountComponent({currentView: "chapter"});
            const links = wrapper.findAll(".story-breadcrumb__link");

            await links[1].trigger("click");

            expect(wrapper.emitted("go-to-story")).to.have.lengthOf(1);
        });
    });
});
