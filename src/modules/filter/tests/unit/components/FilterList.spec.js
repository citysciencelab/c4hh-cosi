import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import FilterList from "@modules/filter/components/FilterList.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;


describe("src/modules/filter/components/FilterList.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: sinon.spy()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        Filter: {
                            namespaced: true,
                            getters: {
                                rulesOfFilters: () => [],
                                shouldSubjectDataSelectedInTree: () => false
                            }
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(FilterList, {
            propsData: {
                filters: [{filterId: 0, title: "i am a filter"}],
                multiLayerSelector: false
            },
            global: {
                plugins: [store]
            }
        });
    });

    it("should render filters", () => {
        expect(wrapper.findAll(".panel-default")).to.have.length(1);
    });

    it("should render filter title disabled true if multiLayerSelector is false", async () => {
        wrapper = shallowMount(FilterList, {
            propsData: {
                filters: [{filterId: 0, title: "i am a filter"}, {filterId: 1, title: "i am a filter"}],
                multiLayerSelector: false
            },
            global: {
                plugins: [store]
            }
        });

        await wrapper.setProps({
            selectedLayers: [{
                filterId: 0
            }]
        });
        expect(wrapper.find(".disabled").exists()).to.be.true;
    });
    it("should render filter title not disabled if multiLayerSelector is true", async () => {
        await wrapper.setProps({
            multiLayerSelector: true,
            selectedLayers: [0]
        });
        expect(wrapper.find(".disabled").exists()).to.be.false;
    });
    it("should render an accordion if there are layer filter", async () => {
        wrapper.vm.hasUnfixedRules = () => true;
        await wrapper.setProps({
            selectedLayers: [{
                filterId: 0
            }],
            filters: [{
                filterId: 0,
                layerId: "19091"
            }]
        });
        expect(wrapper.findComponent(AccordionItem).exists()).to.be.true;
    });

    it("should render collapse element if collapseButton is true", async () => {
        wrapper.vm.hasUnfixedRules = () => true;
        await wrapper.setProps({
            selectedLayers: [{
                filterId: 0
            }],
            collapseButtons: true,
            filters: [{
                filterId: 0
            }]
        });
        expect(wrapper.find(".button-collapse").exists()).to.be.true;
    });

    describe("updateSelectedLayers", () => {
        it("should not change selected layers if passed argument is not an id", () => {
            const expected = [];

            wrapper.vm.updateSelectedLayers(null);
            wrapper.vm.updateSelectedLayers(undefined);
            wrapper.vm.updateSelectedLayers([]);
            wrapper.vm.updateSelectedLayers("1234");
            wrapper.vm.updateSelectedLayers({});
            wrapper.vm.updateSelectedLayers(false);
            wrapper.vm.updateSelectedLayers(true);

            expect(wrapper.vm.selectedLayers).to.deep.equal(expected);

        });

        it("should update selected layers", () => {
            const filterId = 1234;

            wrapper.vm.updateSelectedLayers(filterId);
            expect(wrapper.emitted()).to.have.property("selectedAccordions");
        });
    });
    describe("scrollToView", () => {
        it("should emit if aynthing but a number is given", () => {
            wrapper.vm.scrollToView([]);
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView({});
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView("string");
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView(true);
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView(false);
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView(undefined);
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
            wrapper.vm.scrollToView(null);
            expect(wrapper.emitted()).to.not.have.property("resetJumpToId");
        });
        it("should emit if a number is given", async () => {
            await wrapper.vm.$nextTick();
            wrapper.vm.scrollToView(0);
            expect(wrapper.emitted()).to.have.property("resetJumpToId");
        });
    });
    describe("showRulesNumber", () => {
        it("should return false, if the first parameter is not correct", () => {
            expect(wrapper.vm.showRulesNumber(null)).to.be.false;
            expect(wrapper.vm.showRulesNumber(undefined)).to.be.false;
            expect(wrapper.vm.showRulesNumber([])).to.be.false;
            expect(wrapper.vm.showRulesNumber("str")).to.be.false;
            expect(wrapper.vm.showRulesNumber({})).to.be.false;
            expect(wrapper.vm.showRulesNumber(false)).to.be.false;
            expect(wrapper.vm.showRulesNumber(true)).to.be.false;
        });
        it("should return false, if the second parameter is not correct", () => {
            expect(wrapper.vm.showRulesNumber(1, null)).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, undefined)).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, "str")).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, {})).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, false)).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, true)).to.be.false;
        });
        it("should return false, if the third parameter is not correct", () => {
            const selectedLayers = [
                {
                    "layerId": "19091",
                    "filterId": 0
                }
            ];

            expect(wrapper.vm.showRulesNumber(1, selectedLayers, 123)).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, selectedLayers, "str")).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, selectedLayers, {})).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, selectedLayers, false)).to.be.false;
            expect(wrapper.vm.showRulesNumber(1, selectedLayers, true)).to.be.false;
        });
        it("should return false, if the rule object is a real rule, but layer id is not selected", () => {
            const selectedLayers = [
                    {
                        "layerId": "19091",
                        "filterId": 0
                    }
                ],
                rulesOfFilters = [
                    {
                        "snippetId": 0,
                        "startup": false,
                        "fixed": false,
                        "attrName": "@Datastreams.0.Observations.0.result",
                        "operatorForAttrName": "AND",
                        "operator": "BETWEEN",
                        "value": [
                            0,
                            95
                        ],
                        "tagTitle": "0 - 95"
                    }
                ];

            expect(wrapper.vm.showRulesNumber(1, selectedLayers, rulesOfFilters)).to.be.false;
        });
        it("should return false, if the rule object is a real rule but layer id is not selected", () => {
            const selectedLayers = [
                    {
                        "layerId": "19091",
                        "filterId": 1
                    }
                ],
                rulesOfFilters = [];

            rulesOfFilters[0] = [];
            rulesOfFilters[0] =
                {
                    "snippetId": 0,
                    "startup": false,
                    "fixed": false,
                    "attrName": "@Datastreams.0.Observations.0.result",
                    "operatorForAttrName": "AND",
                    "operator": "BETWEEN",
                    "value": [
                        0,
                        95
                    ],
                    "tagTitle": "0 - 95"
                };
            expect(wrapper.vm.showRulesNumber(1, selectedLayers, rulesOfFilters)).to.be.false;
        });
    });
    describe("getRulesNumber", () => {
        it("should return 0, if first parameter is not correct", () => {
            expect(wrapper.vm.getRulesNumber(null)).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(undefined)).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber("str")).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(false)).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber({})).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber([])).to.be.equals(0);
        });
        it("should return 0, if second parameter is not correct", () => {
            expect(wrapper.vm.getRulesNumber(123, undefined)).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(123, "str")).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(123, false)).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(123, {})).to.be.equals(0);
            expect(wrapper.vm.getRulesNumber(123, [])).to.be.equals(0);
        });
        it("should return the number of rules", () => {
            const rulesOfFilters = [];

            rulesOfFilters[8] = [];

            rulesOfFilters[8] = [
                {
                    "snippetId": 0,
                    "startup": false,
                    "fixed": false,
                    "attrName": "@Datastreams.0.Observations.0.result",
                    "operatorForAttrName": "AND",
                    "operator": "BETWEEN",
                    "value": [
                        0,
                        95
                    ],
                    "tagTitle": "0 - 95"
                }
            ];

            expect(wrapper.vm.getRulesNumber(8, rulesOfFilters)).to.be.equals(1);
        });
    });
});
