import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";
import sinon from "sinon";

import Component from "../../../components/ArchiveList.vue";

describe("addons/lzsResearchClient/tests/unit/components/ArchiveList.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        const mockDatasets = reactive([
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id1", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "6232", "type": "I"}]},
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id2", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "4835", "type": "I"}]},
            {"archiveId": "test", "instanceId": "id3", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "1000", "type": "I"}]},
            {"archiveId": "testOneColumn", "instanceId": "id4", "checked": false, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}]}
        ]);

        const tableStubInstances = [];

        const TabResultTableStub = {
            name: "TabResultTable",
            props: ["tableIndex", "tableHeader", "tableDatasets", "hasGeoRef", "showCheckboxes", "showButtons"],
            template: "<div class='table-stub' />",
            data () {
                return {
                    currentlyShownGeorefId: null
                };
            },
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
                },
                hideGeom () {
                    // overridden per test
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
                showTableButtons: {georef: true, details: true, preview: false, download: false},
                additionalHeaders: [
                    "additional:modules.lzsResearchClient.tabs.archiveList.table.headers.position",
                    "additional:modules.lzsResearchClient.tabs.archiveList.table.headers.details"
                ]
            },
            global: {
                mocks: {
                    $t: key => key,
                    $i18next: {
                        exists: () => false // always fall back to the attribute name
                    }
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
        sinon.restore();
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
        await wrapper.vm.toggleAllTablesInArchive(2, true);

        expect(wrapper.vm.selectAllIsChecked).to.be.true;
    });

    it("should include position column header only for archives with georef", async () => {
        const archives = wrapper.vm.archives;

        expect(archives).to.have.lengthOf(3);
        expect(archives[0].archiveId).to.equal("DKL_3DSTADT_LOD1");
        expect(archives[1].archiveId).to.equal("test");
        expect(archives[2].archiveId).to.equal("testOneColumn");
        // archive DKL_3DSTADT_LOD1 has no georef in this test, should therefore not have column "position"
        expect(wrapper.vm.getTableHeaders(archives[0])).to.have.lengthOf(3);
        expect(wrapper.vm.getTableButtons(archives[0]).georef).to.be.false;
        // archive test has  georef in this test, should therefore have column "position"
        expect(wrapper.vm.getTableHeaders(archives[1])).to.have.lengthOf(4);
        expect(wrapper.vm.getTableButtons(archives[1]).georef).to.be.true;
        // archive testOneColumn has no georef in this test, should therefore not have column "position"
        expect(wrapper.vm.getTableHeaders(archives[2])).to.have.lengthOf(2);
        expect(wrapper.vm.getTableButtons(archives[2]).georef).to.be.false;
    });

    it("should find the correct number of attributes to group by for the archives", async () => {
        const archives = wrapper.vm.archives;

        // archive DKL_3DSTADT_LOD1 has 2 instance-specific columns in this test
        expect(wrapper.vm.getAttributesToGroupBy(archives[0])).to.have.lengthOf(2);
        // archive test has 2 instance-specific columns in this test
        expect(wrapper.vm.getAttributesToGroupBy(archives[1])).to.have.lengthOf(2);
        // archive testOneColumn has only 1 instance-specific column in this test, therefore nothing to "group by"
        expect(wrapper.vm.getAttributesToGroupBy(archives[2])).to.have.lengthOf(0);
    });

    describe("syncGeomToInstance", async () => {
        it("calls hideGeom() on the active table when currentlyShownGeorefId does not match datasetInstanceId", async () => {
            const refName = "test-table-0-0";
            const tableInstance = wrapper.vm.$refs[refName]?.[0];

            expect(tableInstance).to.exist;

            tableInstance.currentlyShownGeorefId = "id2";
            const hideGeomFake = sinon.fake();

            tableInstance.hideGeom = hideGeomFake;

            wrapper.vm.geomIsShownBy = refName;

            wrapper.vm.syncGeomToInstance({instanceId: "id1"});

            expect(hideGeomFake.calledOnce).to.be.true;
        });

        it("does nothing when currentlyShownGeorefId already matches the given instanceId", async () => {
            const refName = "test-table-0-0";
            const tableInstance = wrapper.vm.$refs[refName]?.[0];

            expect(tableInstance).to.exist;

            tableInstance.currentlyShownGeorefId = "id1";
            const hideGeomFake = sinon.fake();

            tableInstance.hideGeom = hideGeomFake;

            wrapper.vm.geomIsShownBy = refName;

            wrapper.vm.syncGeomToInstance({instanceId: "id1"});

            expect(hideGeomFake.called).to.be.false;
        });
    });
});
