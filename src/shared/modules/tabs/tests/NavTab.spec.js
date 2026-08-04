import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";


describe("src/shared/modules/tabs/components/NavTab.vue", () => {

    const factory = {
        getShallowMount: (props = {}) => {
            return shallowMount(NavTab, {
                props: {
                    id: "nav-tab-1",
                    label: "Test Tab",
                    active: true,
                    target: "#section-1",
                    ...props
                }
            });
        }
    };

    it("should not render an icon if the icon prop is not set", () => {
        const wrapper = factory.getShallowMount(),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.false;
    });

    it("should render an icon if the icon prop is set", () => {
        const wrapper = factory.getShallowMount({icon: "bi-geo-alt"}),
            iconWrapper = wrapper.find("i");

        expect(iconWrapper.exists()).to.be.true;
        expect(iconWrapper.classes()).to.include("bi-geo-alt");
        expect(iconWrapper.classes()).to.include("bi");
        expect(iconWrapper.classes()).to.include("me-2");
    });

    it("should not add styleVariant classes if styleVariant prop is not set", () => {
        const wrapper = factory.getShallowMount(),
            button = wrapper.find("button"),
            listItem = wrapper.find("li");

        expect(button.classes()).not.to.include("nav-link--blue");
        expect(listItem.classes()).not.to.include("nav-item--blue");
    });

    it("should add styleVariant classes to both button and li if styleVariant prop is set", () => {
        const wrapper = factory.getShallowMount({styleVariant: "blue"}),
            button = wrapper.find("button"),
            listItem = wrapper.find("li");

        expect(button.classes()).to.include("nav-link--blue");
        expect(listItem.classes()).to.include("nav-item--blue");
    });
});
