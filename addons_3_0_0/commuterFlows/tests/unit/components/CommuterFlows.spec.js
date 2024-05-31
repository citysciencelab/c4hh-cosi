import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import CommuterFlowsComponent from "../../../components/CommuterFlows.vue";
import CommuterFlows from "../../../store/indexCommuterFlows";
import {createStore} from "vuex";

config.global.mocks.$t = key => key;

/**
 * mocks secondary menu
 * @returns {void}
 */
function addSecondaryMenuElement () {
    const app = document.createElement("div");

    app.setAttribute("id", "mp-menu-secondaryMenu");
    document.body.append(app);
}

describe("addons/commuterFlows/components/CommuterFlows.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Modules: {
                namespaced: true,
                modules: {
                    CommuterFlows
                }
            }
        }
    });

    beforeEach(() => {
        addSecondaryMenuElement();
    });

    it("wrapper should exist", () => {
        const wrapper = shallowMount(CommuterFlowsComponent, {
            global: {
                plugins: [store]
            },
            data () {
                return {
                    wfsApi: "wfsApi",
                    olApi: "wfsApi"
                };
            }
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("renders CommuterFlows", () => {
        const wrapper = shallowMount(CommuterFlowsComponent, {
            global: {
                plugins: [store]
            },
            data () {
                return {
                    wfsApi: "wfsApi",
                    olApi: "wfsApi"
                };
            }
        });

        expect(wrapper.find("#CommuterFlows").exists()).to.be.true;
    });
});
