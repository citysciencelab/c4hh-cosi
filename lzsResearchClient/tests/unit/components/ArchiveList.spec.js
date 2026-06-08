import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";

import Component from "../../../components/ArchiveList.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResult.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        const mockDatasets = reactive([
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id1", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "6232", "type": "I"}]},
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id2", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "4835", "type": "I"}]},
            {"archiveId": "test", "instanceId": "id3", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "1000", "type": "I"}]}
        ]);

        const tableStubInstances = [];

        const TabResultTableStub = {
            name: "TabResultTable",
            props: ["tableIndex", "tableHeader", "tableDatasets", "hasGeoRef", "showCheckboxes", "showButtons"],
            template: "<div class='table-stub' />",
            created () {
                tableStubInstances.push(this);
            },
            methods: {
                toggleAllRows (changeTo) {
                    const instanceIds = this.tableDatasets.map(d => d.instanceId);

                    mockDatasets.forEach(d => {
                        if (instanceIds.includes(d.instanceId)) {
                            d.checked = changeTo;
                        }
                    });
                }
            }
        };

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            getters: {
                                getNameForArchiveId: () => (id) => {
                                    return id;
                                },
                                archiveHasGeoref: () => (id) => {
                                    return id === "test";
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                datasets: mockDatasets,
                idPrefix: "test",
                showTableButtons: {georef: true, details: true, preview: false, download: false}
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store],
                stubs: {
                    TabResultTable: TabResultTableStub
                }
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

    it("checking the switch should check the checkboxes", async () => {
        const checkboxes = wrapper.findAll("input[type='checkbox'].archive-checkbox-input");

        checkboxes.forEach(checkbox => {
            expect(checkbox.element.checked).to.be.false;
        });

        await wrapper.vm.toggleAllTables(true);

        checkboxes.forEach(checkbox => {
            expect(checkbox.element.checked).to.be.true;
        });

        await wrapper.vm.toggleAllTables(false);

        checkboxes.forEach(checkbox => {
            expect(checkbox.element.checked).to.be.false;
        });
    });

    it("checking the last archive checkbox should flip the switch", async () => {
        expect(wrapper.vm.selectAllIsChecked).to.be.false;

        await wrapper.vm.toggleAllTablesInArchive(0, true);

        expect(wrapper.vm.selectAllIsChecked).to.be.false;

        await wrapper.vm.toggleAllTablesInArchive(1, true);

        expect(wrapper.vm.selectAllIsChecked).to.be.true;
    });
});
