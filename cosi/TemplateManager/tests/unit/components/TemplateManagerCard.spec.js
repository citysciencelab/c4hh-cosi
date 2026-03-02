// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
// import Vuex from "vuex";
import {expect} from "chai";
// import TemplateManagerCard from "../../../components/TemplateManagerCard.vue";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// localVue.use(Vuex);

describe.skip("addons/cosi/TemplateManager/components/TemplateManagerCard.vue", () => {

    const TemplateManagerCard = undefined,
        factory = {
            getShallowMount: () => {
                return shallowMount(TemplateManagerCard, {
                    // localVue,
                    propsData: {
                        title: "Card Title",
                        created: "01.01.2024",
                        cardId: "1",
                        isEnabled: false
                    },
                    computed: {
                        currentActiveTemplate: () => "Card Title",
                        checked: () => true
                    }
                });
            }
        };

    describe("Component DOM", () => {
        it("should render card", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".card").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render card title", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".card-title").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render created", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".created-section").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render switch", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".switch").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render hint", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".hint").exists()).to.be.true;
            wrapper.destroy();
        });
    });
});
