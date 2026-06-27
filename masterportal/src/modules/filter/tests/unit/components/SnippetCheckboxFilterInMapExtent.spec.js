import {config, shallowMount} from "@vue/test-utils";
import SnippetCheckboxFilterInMapExtentComponent from "@modules/filter/components/SnippetCheckboxFilterInMapExtent.vue";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("src/modules/filter/components/SnippetCheckboxFilterInMapExtent.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(SnippetCheckboxFilterInMapExtentComponent, {
            propsData: {
                filterId: 1
            }
        });
    });
    it("should render SwitchInput", () => {
        expect(wrapper.findComponent({name: "SwitchInput"}).exists()).to.be.true;
    });
    it("should not render SnippetInfo if info is false", async () => {
        await wrapper.setProps({
            info: false
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".right").exists()).to.be.false;
    });
    it("should render SnippetInfo if info text is given", async () => {
        await wrapper.setProps({
            info: "Test"
        });
        expect(wrapper.findComponent({name: "SnippetInfo"}).exists()).to.be.true;
    });
});
