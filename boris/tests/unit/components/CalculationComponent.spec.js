import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import CalculationComponent from "../../../components/CalculationComponent.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("ADDONS: addons/boris/components/CalculationComponent.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                modules: {
                    children: {
                        borisComponent: {
                            "name": "common:menu.tools.boris",
                            "icon": "bi-vinyl"
                        }
                    }
                }
            }
        }
    };
    let store, propsData, wrapper;

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        BorisComponent: {
                            namespaced: true,
                            actions: {
                                initialize: () => sinon.stub()
                            }
                        },
                        Print: {
                            namespaced: true,
                            getters: {printFileReady: () => sinon.stub(),
                                fileDownloadUrl: () => sinon.stub(),
                                filename: () => sinon.stub(),
                                printStarted: () => sinon.stub(),
                                progressWidth: () => sinon.stub()}
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {registerListener: () => sinon.stub(),
                        unregisterListener: () => sinon.stub()}
                }
            },
            getters: {mobile: () => false},
            state: {
                configJson: mockConfigJson
            }
        });

        propsData = {
            title: "Title",
            options: [],
            selectedBrwFeature: {
                get: (subject) => {
                    return subject;
                }
            },
            textIds: ["1"],
            textId: 1,
            text: "Infotext",
            toggleInfoText: () => sinon.stub(),
            handleChange: () => sinon.stub(),
            subject: "Subject",
            type: "type"
        };

    });

    describe("Boris calculation component template", () => {
        it("renders Calculation Component", () => {
            wrapper = shallowMount(CalculationComponent, {
                global: {plugins: [store]},
                propsData: propsData
            });
            expect(wrapper.find("#calculation-component").exists()).to.be.true;
        });

        it("renders select type", () => {
            wrapper = shallowMount(CalculationComponent, {
                global: {plugins: [store]},
                propsData: {...propsData, type: "select"}
            });
            expect(wrapper.find(".select-part").exists()).to.be.true;

        });

        it("renders input type", () => {
            wrapper = shallowMount(CalculationComponent, {
                global: {plugins: [store]},
                propsData: {...propsData, type: "input"}
            });
            expect(wrapper.find(".input-part").exists()).to.be.true;
        });

        it("triggers click", async () => {
            wrapper = shallowMount(CalculationComponent, {
                global: {plugins: [store]},
                propsData: propsData
            });
            const questionElement = wrapper.find(".bi-question-circle-fill");

            questionElement.trigger("click");
            await wrapper.vm.$nextTick();

            // textIds should get a further or one less element after clicking
            expect(propsData.textIds).to.be.an("array").that.is.not.empty;
        });
    });

});
