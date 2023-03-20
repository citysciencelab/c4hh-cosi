import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import CommuterFlowsComponent from "../../../components/CommuterFlows.vue";
import CommuterFlows from "../../../store/indexCommuterFlows";

import sinon from "sinon";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/commuterFlows/components/CommuterFlows.vue", () => {

    const mockMapGetters = {
            map: () => sinon.stub()
        },
        mockMapActions = {
        },
        mockMapMutations = {
        },
        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            CommuterFlows:
                                {
                                    "name": "translate#additional:modules.tools.commuterFlows.title",
                                    "icon": "bi-arrow-left-right"
                                }
                        }
                    }
                }
            }
        };

    let store,
        wrapper;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules:
                        {
                            CommuterFlows
                        }
                },
                Map: {
                    namespaced: true,
                    getters: mockMapGetters,
                    mutations: mockMapMutations,
                    actions: mockMapActions
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        wrapper = shallowMount(CommuterFlowsComponent, {
            store,
            localVue,
            data () {
                return {
                    wfsApi: "wfsApi",
                    olApi: "wfsApi"
                };
            }
        });
        store.commit("Tools/CommuterFlows/setActive", true);
    });

    sinon.stub(CommuterFlowsComponent, "mounted");

    it("wrapper should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("renders CommuterFlows", () => {
        expect(wrapper.find("#CommuterFlows").exists()).to.be.true;
    });
});
