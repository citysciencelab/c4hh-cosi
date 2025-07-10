import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import AccessibilityAnalysisLegend from "../../../components/AccessibilityAnalysisLegend.vue";
import {expect} from "chai";
import Vuetify from "vuetify";
import Vue from "vue";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("AccessibilityAnalysisLegend.vue", () => {
    let vuetify;

    const factory = {
        getShallowMount: () => {
            return shallowMount(AccessibilityAnalysisLegend, {
                propsData: {
                    steps: [23, 43, 55],
                    colors: ["rot", "gelb", "lila"]
                },
                localVue,
                vuetify
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
        });

        it("should find as many circles as colors", () => {
            const wrapper = factory.getShallowMount(),
                circleWrapperArray = wrapper.findAllComponents({name: "v-icon"});

            expect(circleWrapperArray).to.have.lengthOf(wrapper.vm.colors.length);
        });

        it("should find the expected step value", () => {
            const wrapper = factory.getShallowMount(),
                stepsWrapperArray = wrapper.findAll(".steps");

            expect(stepsWrapperArray.wrappers[1].text()).to.be.equal("43");
        });

        it("should find the three circle icons, if useTravelTimeIndex is false", () => {
            const wrapper = factory.getShallowMount(),
                circleWrapperArray = wrapper.findAllComponents({name: "v-icon"});

            expect(wrapper.vm.useTravelTimeIndex).to.be.false;
            expect(circleWrapperArray.wrappers.length).to.be.equal(3);
        });

        it("should find the five circle icons, if useTravelTimeIndex is true", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setProps({
                steps: [23, 43, 55, 123]
            });

            expect(wrapper.vm.useTravelTimeIndex).to.be.true;
            expect(wrapper.findAllComponents({name: "v-icon"}).wrappers.length).to.be.equal(5);
        });

        it("should find the expected circle attributes", () => {
            const wrapper = factory.getShallowMount(),
                circleWrapperArray = wrapper.findAllComponents({name: "v-icon"}),
                expectedCircle = {
                    "color": "rot",
                    "small": ""
                };

            expect(circleWrapperArray.wrappers[0].attributes()).to.deep.equal(expectedCircle);
        });
    });
});

