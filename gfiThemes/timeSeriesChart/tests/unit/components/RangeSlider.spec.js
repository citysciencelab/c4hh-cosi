import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import RangeSlider from "../../../components/RangeSlider.vue";

describe("addons/gfiThemes/timeSeriesChart/components/RangeSlider.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(RangeSlider, {
            props: {
                modelValue: ["2025-08-21", "2025-08-24"],
                data: [
                    {
                        id: "2025-08-21",
                        name: "2025-08-21"
                    },
                    {
                        id: "2025-08-22",
                        name: "2025-08-22"
                    },
                    {
                        id: "2025-08-23",
                        name: "2025-08-23"
                    },
                    {
                        id: "2025-08-24",
                        name: "2025-08-24"
                    }
                ]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the RangeSlider component", () => {
        expect(wrapper.find(".RangeSlider").exists()).to.be.true;
    });
});
