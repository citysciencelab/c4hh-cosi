import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import WaterStatistics from "../../../components/WaterStatistics.vue";

describe("addons/gfiThemes/waterStatistics/components/WaterStatistics.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(WaterStatistics, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getTheme: function () {
                        return {};
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the WaterStatistics theme", () => {
        expect(wrapper.find(".water-statistics-theme").exists()).to.be.true;
    });
});

