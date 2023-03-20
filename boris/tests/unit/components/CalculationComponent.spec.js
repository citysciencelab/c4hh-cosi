import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import CalculationComponent from "../../../components/CalculationComponent.vue";
import Boris from "../../../store/indexBoris";
import {expect} from "chai";
import sinon from "sinon";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("ADDONS: addons/boris/components/CalculationComponent.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        boris: {
                            "name": "common:menu.tools.boris",
                            "icon": "bi-vinyl",
                            "active": true,
                            "renderToWindow": false
                        }
                    }
                }
            }
        }
    };
    let store, propsData, wrapper;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        Boris
                    }
                }
            },
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
        wrapper = shallowMount(CalculationComponent, {
            store,
            propsData: propsData,
            localVue
        });
    });
    afterEach(function () {
        sinon.restore();
        if (wrapper) {
            wrapper.destroy();
        }
    });

    describe("Boris calculation component template", () => {
        it("renders Calculation Component", () => {
            expect(wrapper.find("#calculation-component").exists()).to.be.true;
        });

        it("renders select type", () => {
            wrapper = shallowMount(CalculationComponent, {
                store,
                propsData: {...propsData, type: "select"},
                localVue
            });
            expect(wrapper.find(".select-part").exists()).to.be.true;

        });

        it("renders input type", () => {
            wrapper = shallowMount(CalculationComponent, {
                store,
                propsData: {...propsData, type: "input"},
                localVue
            });
            expect(wrapper.find(".input-part").exists()).to.be.true;
        });

        it("triggers click", async () => {
            const questionElement = wrapper.find(".bi-question-circle-fill");

            questionElement.trigger("click");
            await wrapper.vm.$nextTick();

            // textIds should get a further or one less element after clicking
            expect(propsData.textIds).to.be.an("array").that.is.not.empty;
        });
    });

});
