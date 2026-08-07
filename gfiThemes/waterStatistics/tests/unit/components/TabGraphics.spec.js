import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TabGraphics from "../../../components/TabGraphics.vue";

describe("addons/gfiThemes/waterStatistics/components/TabGraphics.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(TabGraphics, {
            props: {
                attributes: {},
                params: {}
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the TabGraphics component", () => {
        expect(wrapper.find("#TabGraphics").exists()).to.be.true;
    });
});
