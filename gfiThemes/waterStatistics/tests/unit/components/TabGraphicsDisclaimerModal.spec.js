import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TabGraphicsDisclaimerModal from "../../../components/TabGraphicsDisclaimerModal.vue";

describe("addons/gfiThemes/waterStatistics/components/TabGraphicsDisclaimerModal.vue", () => {
    let wrapper, store, fetchDisclaimer;

    beforeEach(() => {
        fetchDisclaimer = function () {
            return [
                {
                    type: "h2",
                    content: [
                        {
                            text: "Haftungsausschluss",
                            type: "text"
                        }
                    ]
                },
                {
                    type: "p",
                    content: [
                        {
                            text: "HaftungsausEs ist zu beachten, dass es sich bei den dargestellten Daten teilweise um ",
                            type: "text"
                        },
                        {
                            text: "nicht geprüfte Rohdaten",
                            type: "strong"
                        },
                        {
                            text: " handelt, die vollautomatisch übermittelt werden.",
                            type: "text"
                        }
                    ]
                }
            ];
        };

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        WaterStatistics: {
                            namespaced: true,
                            actions: {
                                fetchDisclaimer
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(TabGraphicsDisclaimerModal, {
            global: {
                plugins: [store]
            },
            props: {
                params: {
                    disclaimer: {
                        data: "blabla"
                    }
                },
                show: true
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the TabGraphicsDisclaimerModal component", () => {
        expect(wrapper.find("div.TabGraphicsDisclaimerModal").exists()).to.be.true;
    });
});
