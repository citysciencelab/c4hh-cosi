import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import PlanningScenarioOverview from "../../../PlanningScenarioOverview.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/PlanningScenario/PlanningScenarioOverview.vue", () => {
    const factory = {
        getShallowMount: () => {
            return shallowMount(PlanningScenarioOverview, {});
        }
    };

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find a overview list component", () => {
            const wrapper = factory.getShallowMount(),
                overviewListWrapper = wrapper.find("planning-scenario-overview-list-stub");

            expect(overviewListWrapper.exists()).to.be.true;
        });

        it("should find a flat button component to create a scenario", () => {
            const wrapper = factory.getShallowMount(),
                flatButtonWrapper = wrapper.findAll("flat-button-stub");

            expect(flatButtonWrapper.at(0).attributes("text")).to.be.equal("additional:modules.tools.simulationTool.planningScenarioCreate");
        });

        it("should find a flat button component to download all scenario", () => {
            const wrapper = factory.getShallowMount(),
                flatButtonWrapper = wrapper.findAll("flat-button-stub");

            expect(flatButtonWrapper.at(1).attributes("text")).to.be.equal("additional:modules.tools.simulationTool.planningScenarioDownloads");
        });

        it("should find file upload component", () => {
            const wrapper = factory.getShallowMount(),
                fileUploadWrapper = wrapper.find("file-upload-stub");

            expect(fileUploadWrapper.exists()).to.be.true;
        });
    });
});
