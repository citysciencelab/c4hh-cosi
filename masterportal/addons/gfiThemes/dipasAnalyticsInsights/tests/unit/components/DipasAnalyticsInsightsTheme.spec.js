import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import DipasAnalyticsInsightsTheme from "../../../components/DipasAnalyticsInsightsTheme.vue";

config.global.mocks.$t = key => key;

describe("addons/dipasAnalyticsInsights/components/DipasAnalyticsInsightsTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(DipasAnalyticsInsightsTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            "title": "Ein Beitragstitel",
                            "categories": ["Umwelt", "Verkehr", null]
                        };
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

    it("should render the DipasAnalyticsInsightsTheme", () => {
        expect(wrapper.find(".dipas-analytics-insights-theme").exists()).to.be.true;
    });

    it("should form the label for the categories of the contribution correctly", () => {
        const vm = wrapper.vm;

        expect(vm.categories).to.equal("Umwelt, Verkehr");
    });

    it("should count the number of categories of the contribution correctly", () => {
        const vm = wrapper.vm;

        expect(vm.categoriesCount).to.equal(2);
    });

    it("should render the title of the contribution correctly", () => {
        expect(wrapper.find(".dipas-analytics-insights-title").text()).to.equal("Ein Beitragstitel");
    });

    it("should render the categories of the contribution correctly", () => {
        const combinedText = "additional:addons.gfiThemes.dipasAnalyticsInsights.categories:  Umwelt, Verkehr";

        expect(wrapper.find(".dipas-analytics-insight-categories").text()).to.equal(combinedText);
    });

    it("should render the contribution text correctly", () => {
        expect(wrapper.find(".dipas-analytics-insights-contribution-text").text()).to.equal("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
    });
});

