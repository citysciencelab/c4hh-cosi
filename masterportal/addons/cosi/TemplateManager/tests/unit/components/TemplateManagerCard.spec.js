import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TemplateManagerCard from "../../../components/TemplateManagerCard.vue";

describe("addons/cosi/TemplateManager/components/TemplateManagerCard.vue", () => {

    const factory = {
        getShallowMount: (options = {}) => {
            return shallowMount(TemplateManagerCard, {
                propsData: {
                    title: "Card Title",
                    created: "01.01.2024",
                    cardId: "1",
                    isEnabled: false,
                    ...options.propsData
                },
                computed: {
                    currentActiveTemplate: () => "Card Title",
                    checked: () => true,
                    ...options.computed
                },
                mocks: {
                    $t: key => key
                }
            });
        }
    };

    describe("Component DOM", () => {
        it("should render card", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should render card title", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".card-title").exists()).to.be.true;
            expect(wrapper.find(".card-title").text()).to.equal("Card Title");
        });

        it("should render created section", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".created-section").exists()).to.be.true;
            expect(wrapper.find(".created-section").text()).to.equal("01.01.2024");
        });

        it("should render hint when isEnabled is false", () => {
            const wrapper = factory.getShallowMount({
                propsData: {
                    title: "Card Title",
                    created: "01.01.2024",
                    cardId: "1",
                    isEnabled: false
                }
            });

            expect(wrapper.find(".hint").exists()).to.be.true;
            expect(wrapper.find(".form-switch").exists()).to.be.false;
        });

        it("should render switch when isEnabled is true", () => {
            const wrapper = factory.getShallowMount({
                propsData: {
                    title: "Card Title",
                    created: "01.01.2024",
                    cardId: "1",
                    isEnabled: true
                }
            });

            expect(wrapper.find(".form-switch").exists()).to.be.true;
            expect(wrapper.find(".hint").exists()).to.be.false;
        });
    });

    describe("User Interactions", () => {
        it("should emit showTemplate when title link is clicked", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.find("a.stretched-link").trigger("click");

            expect(wrapper.emitted().showTemplate).to.be.an("array");
            expect(wrapper.emitted().showTemplate[0]).to.deep.equal(["Card Title"]);
        });
    });
});
