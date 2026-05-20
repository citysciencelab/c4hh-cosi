import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabResultTable.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResultTable.spec.js", () => {
    let wrapper,
        store;

    const tableDatasets = [
        {
            instanceId: "dataset1",
            attributes: [
                {
                    value: "2017",
                    id: "JAHRGANG"
                },
                {
                    value: "6",
                    id: "KACHELNUMMER"
                },
                {
                    value: "Z Item",
                    id: "BESCHREIBUNG"
                }
            ]
        },
        {
            instanceId: "dataset2",
            attributes: [
                {
                    value: "2015",
                    id: "JAHRGANG"
                },
                {
                    value: "30",
                    id: "KACHELNUMMER"
                },
                {
                    value: "A Item",
                    id: "BESCHREIBUNG"
                }
            ]
        }
    ];

    const tableHeader = ["JAHRGANG", "KACHELNUMMER", "BESCHREIBUNG"];

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                // to be used later
                            }),
                            getters: {
                                // to be used later
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                tableIndex: "tableIndex-1",
                tableHeader,
                tableDatasets
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("sorts string column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-BESCHREIBUNG span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
    });

    it("sorts number column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-KACHELNUMMER span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
    });
});
