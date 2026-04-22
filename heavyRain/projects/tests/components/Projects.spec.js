import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import Projects from "../../components/Projects.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/projects/components/Projects.vue", () => {
    let store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Projects: {
                            namespaced: true,
                            getters: {
                                criteria: () => [{
                                    "name": "Bauprojekte (Umsetzungsmaßnahmen)",
                                    "color": "#0055A4"
                                },
                                {
                                    "name": "Bekannte Bereiche (z.B. Presse)",
                                    "color": "#D55E00"
                                }]
                            }
                        }
                    }
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

            expect(wrapper.exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("getBgcolor", () => {
            it("should return the first color as standard", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}});

                expect(wrapper.vm.getBgcolor(0)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(null)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(undefined)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor("")).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor(true)).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor({})).to.deep.equal("#0055A4");
                expect(wrapper.vm.getBgcolor([])).to.deep.equal("#0055A4");
            });

            it("should return the right color from chosen criteria", () => {
                const wrapper = shallowMount(Projects, {global: {plugins: [store]}}),
                    chosenCriteria = [{
                        "name": "Bekannte Bereiche (z.B. Presse)",
                        "color": "#D55E00"
                    }];

                expect(wrapper.vm.getBgcolor(chosenCriteria)).to.deep.equal("#D55E00");
            });
        });
    });
});
