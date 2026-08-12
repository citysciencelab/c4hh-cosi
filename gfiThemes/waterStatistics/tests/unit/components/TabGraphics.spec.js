import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import TabGraphics from "../../../components/TabGraphics.vue";

describe("addons/gfiThemes/waterStatistics/components/TabGraphics.vue", () => {
    let wrapper,
        store,
        queryOafStub;

    beforeEach(() => {
        queryOafStub = sinon.stub();
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        WaterStatistics: {
                            namespaced: true,
                            actions: {
                                queryOaf: queryOafStub
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(TabGraphics, {
            props: {
                params: {
                    themeTabs: []
                },
                allAttributes: {}
            },
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("should render the TabGraphics component", () => {
        expect(wrapper.find("#TabGraphics").exists()).to.be.true;
    });
});

