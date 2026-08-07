import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TabBasicData from "../../../components/TabBasicData.vue";

describe("addons/gfiThemes/waterStatistics/components/TabBasicData.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(TabBasicData, {
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

    it("should render the TabBasicData component", () => {
        expect(wrapper.find("#TabBasicData").exists()).to.be.true;
    });
});
