// import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
// import Vuetify from "vuetify";
// import DistrictSelectorLevel from "../../../components/DistrictSelectorLevel.vue";
// import Vue from "vue";

// config.mocks.$t = key => key;

// const localVue = createLocalVue();

// Vue.use(Vuetify);

describe.skip("addons/cosi/DistrictSelector/components/DistrictSelectorLevel.vue", () => {
    let vuetify;

    const districtLevels = [
            {layerId: "123"},
            {layerId: "456"}
        ],
        DistrictSelectorLevel = undefined,
        factory = {
            getShallowMount: () => {
                return shallowMount(DistrictSelectorLevel, {
                    // localVue,
                    vuetify,
                    propsData: {
                        districtLevels: districtLevels,
                        selectedLevelId: "123"
                    }
                });
            }
        };


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
            wrapper.destroy();
        });

        it("should find a label elements with the correct text", () => {
            const wrapper = factory.getShallowMount(),
                labelElements = wrapper.findAll("label");

            expect(labelElements.wrappers).to.be.an("array").to.have.lengthOf(1);
            expect(labelElements.at(0).text()).to.be.equal("additional:modules.tools.cosi.districtSelector.districtLevel");
            wrapper.destroy();
        });

        it("should find two vuetify components", () => {
            const wrapper = factory.getShallowMount(),
                labelElements = wrapper.findAllComponents("v-chip-stub");

            expect(labelElements.wrappers).to.be.an("array").to.have.lengthOf(2);
            wrapper.destroy();
        });
    });
});
