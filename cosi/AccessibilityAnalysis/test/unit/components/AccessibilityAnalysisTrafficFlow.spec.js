import Vuex from "vuex";
import {config, mount, createLocalVue} from "@vue/test-utils";
import AccessibilityAnalysisTrafficFlow from "../../../components/AccessibilityAnalysisTrafficFlow.vue";
import {expect} from "chai";
import Vuetify from "vuetify";
import Vue from "vue";
import sinon from "sinon";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

/**
 * mocks vuetify data-app attr
 * @returns {void}
 */
function addElemWithDataAppToBody () {
    const app = document.createElement("div");

    app.setAttribute("data-app", true);
    document.body.append(app);
}

describe("AccessibilityAnalysisTrafficFlow.vue", () => {
    let vuetify, store;

    const factory = {
        getMount: () => {
            return mount(AccessibilityAnalysisTrafficFlow, {
                localVue,
                vuetify,
                store
            });
        }
    };

    before(() => {
        addElemWithDataAppToBody();
    });

    beforeEach(() => {
        vuetify = new Vuetify();
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: () => sinon.stub()
                    }
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find the checkbox ", () => {
            const wrapper = factory.getMount(),
                checkboxWrapper = wrapper.findComponent({name: "v-checkbox"});

            expect(checkboxWrapper.exists()).to.be.true;
        });

        it("should render the checkbox checked by default", () => {
            const wrapper = factory.getMount(),
                checkboxWrapper = wrapper.findComponent({name: "v-checkbox"});

            expect(checkboxWrapper.props("inputValue")).to.be.true;
        });

        it("should render the checkbox unchecked", async () => {
            const wrapper = factory.getMount(),
                checkboxWrapper = wrapper.findComponent({name: "v-checkbox"});

            await wrapper.setProps({useTravelTimeIndex: false});
            expect(checkboxWrapper.props("inputValue")).to.be.false;
        });

        it("should find the button", () => {
            const wrapper = factory.getMount(),
                buttonWrapper = wrapper.findComponent({name: "v-btn"});

            expect(buttonWrapper.exists()).to.be.true;
        });


        it("should find the slider", () => {
            const wrapper = factory.getMount(),
                sliderWrapper = wrapper.findComponent({name: "v-slider"});

            expect(sliderWrapper.exists()).to.be.true;
        });

        it("should render the append text field of the slider with the correct default", () => {
            const wrapper = factory.getMount(),
                sliderWrapper = wrapper.findComponent({name: "v-slider"});

            expect(sliderWrapper.find(".append-text-field").text()).to.be.equal("9:00");
        });

    });
    describe("User Interactions", () => {
        it("should call the method 'showInfo', if the button is clicked", async () => {
            const spyShowInfo = sinon.spy(AccessibilityAnalysisTrafficFlow.methods, "showInfo"),
                wrapper = factory.getMount(),
                buttonWrapper = wrapper.findComponent({name: "v-btn"});

            await buttonWrapper.trigger("click");
            expect(spyShowInfo.calledOnce).to.be.true;
        });

        it("should emit 'update:time' with the correct value, if 'dayTime' is changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({dayTime: 10});
            expect(wrapper.emitted()).to.have.property("update:time");
            expect(wrapper.emitted()["update:time"][0]).to.deep.equal([10]);
        });

        it("should emit 'update:useTravelTimeIndex with the correct value, if 'isChecked' is changed", async () => {
            const wrapper = factory.getMount();

            await wrapper.setData({isChecked: false});
            expect(wrapper.emitted()).to.have.property("update:useTravelTimeIndex");
            expect(wrapper.emitted()["update:useTravelTimeIndex"][0]).to.deep.equal([false]);
        });
    });
});
