import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import ResetTreeComponent from "../../../components/ResetTree.vue";
import ResetTree from "../../../store/index";
import {expect} from "chai";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/resetTree/components/ResetTree.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        ResetTree:
                            {
                                "name": "translate#additional:modules.tools.resetTree.title",
                                "glyphicon": "glyphicon-repeat"
                            }
                    }
                }
            }
        }
    };
    let store;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        ResetTree
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/ResetTree/setActive", true);
    });

    it("should find the component ResetTree", () => {
        store.commit("Tools/ResetTree/setActive", true);
        const wrapper = shallowMount(ResetTreeComponent, {store, localVue});

        expect(wrapper.findComponent({name: "ResetTree"}).exists()).to.be.true;
    });
});
