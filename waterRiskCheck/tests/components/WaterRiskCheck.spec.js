import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import WaterRiskCheck from "../../components/WaterRiskCheck.vue";
import {createStore} from "vuex";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";

config.global.mocks.$t = key => key;

describe("addons/waterRiskCheck/components/WaterRiskCheck.vue", () => {
    const factory = {
        createVuexStore: (initialGetters) => {
            return createStore({
                namespaced: true,
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            namespaced: true,
                            WaterRiskCheck: {
                                namespaced: true,
                                getters: {
                                    ...initialGetters
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    describe("Component DOM", () => {
        it("should exist", () => {
            const store = factory.createVuexStore({configuredQuestions: () => []}),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.exists()).to.be.true;
        });
        it("should find a start button", () => {
            const store = factory.createVuexStore({configuredQuestions: () => []}),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.find("#start-form").exists()).to.be.true;
        });
        it("should find a disabled back and forward button", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: () => [
                        {title: "foo", question: "bar", info: {}}
                    ]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#page-back").exists()).to.be.true;
            expect(wrapper.findAllComponents(FlatButton).length).to.be.equal(2);
        });
        it("should have increased progress if page is not 0", async () => {
            const store = factory.createVuexStore({
                    configuredQuestions: () => [
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}},
                        {title: "foo", question: "bar", info: {}}
                    ]
                }),
                wrapper = shallowMount(WaterRiskCheck, {
                    global: {
                        plugins: [store]
                    }
                });

            wrapper.vm.currentQuestionIdx = 1;
            wrapper.vm.formStarted = true;

            await wrapper.vm.$nextTick();
            expect(wrapper.findAll(".progress-bar").at(0).attributes()).to.have.property("aria-valuenow", "20.00");
        });
    });
});
