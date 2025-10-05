import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import Vuex from "vuex";
import {expect} from "chai";
import TemplateManagerExportProgressBar from "../../../components/TemplateManagerExportProgressBar.vue";
import Vuetify from "vuetify";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/TemplateManager/components/TemplateManagerExportProgressBar.vue", () => {
    let vuetify;

    const factory = {
        getShallowMount: () => {
            return shallowMount(TemplateManagerExportProgressBar, {
                vuetify,
                localVue
            });
        }
    };

    beforeEach(() => {
        vuetify = new Vuetify();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
            wrapper.destroy();
        });
        it("should find progress-bar", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                showProgressBar: true
            });

            expect(wrapper.find(".progress").exists()).to.be.true;
            wrapper.destroy();
        });
    });
    describe("User Interaction", () => {
        it("should emits closeProgressBar if go back button was clicked", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                showGoBack: true
            });

            wrapper.find("button .bi-arrow-return-left").trigger("click");

            await wrapper.vm.$nextTick();

            expect(wrapper.emitted()).to.have.property("closeProgressBar");
            wrapper.destroy();
        });
    });
});
