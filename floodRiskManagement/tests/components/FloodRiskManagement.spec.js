import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import FloodRiskManagement from "../../components/FloodRiskManagement.vue";
import FloodRiskManagementCard from "../../components/FloodRiskManagementCard.vue";
import FloodRiskManagementSwitcher from "../../components/FloodRiskManagementSwitcher.vue";
import sinon from "sinon";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";

config.global.mocks.$t = key => key;

describe("addons/floodRiskManagement/components/FloodRiskManagement.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Modules: {
                namespaced: true,
                modules: {
                    FloodRiskManagement: {
                        namespaced: true,
                        getters: {
                            selectedCycle: () => "1. Zyklus",
                            selectedEvent: () => "event1",
                            selectedFrequency: () => "häufig",
                            selectedType: () => "Card1"
                        },
                        mutations: {
                            setSelectedCycle: sinon.stub(),
                            setSelectedEvent: sinon.stub(),
                            setSelectedFrequency: sinon.stub(),
                            setSelectedType: sinon.stub()
                        }
                    }
                }
            }
        }
    });

    describe("Component DOM", () => {
        const cycles = ["1. Zyklus", "2. Zyklus", "3. Zyklus"],
            types = [{
                type: "Card1",
                text: "Text1",
                icon: "bi bi-water"
            },
            {
                type: "Card2",
                text: "Text2",
                icon: "bi bi-buildings"
            }],
            events = {
                "event1": {
                    "häufig": "text1",
                    "mittel": "text2",
                    "selten": "text3"
                },
                "event2": {
                    "häufig": "text4",
                    "mittel": "text5",
                    "selten": "text6"
                }
            };

        it("should exist", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
        it("should render accordion", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findComponent(AccordionItem).exists()).to.be.true;
        });
        it("should render cycle switcher", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementSwitcher).at(0).attributes().class).to.equal("cycle-switch");
        });
        it("should render map type cards", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementCard).at(0).attributes().id).to.equal("map-type");
        });
        it("should render flood event switcher", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementSwitcher).at(1).attributes().class).to.equal("event-switch");
        });
        it("should render frequency cards", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FloodRiskManagementCard).at(3).attributes().id).to.equal("card-Frequency");
        });
        it("should render dropdown", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.find("#printScale").exists()).to.be.true;
        });
        it("should render switch", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findComponent(SwitchInput).exists()).to.be.true;
        });
        it("should render settings button", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FlatButton).at(0).attributes().id).to.equal("settingsBtn");
        });
        it("should render print button", () => {
            const wrapper = shallowMount(FloodRiskManagement, {
                global: {
                    plugins: [store]
                },
                data () {
                    return {
                        cycles,
                        types,
                        events
                    };
                }
            });

            expect(wrapper.findAllComponents(FlatButton).at(1).attributes().id).to.equal("printBtn");
        });
    });
});
