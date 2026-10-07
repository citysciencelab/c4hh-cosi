import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";
import sinon from "sinon";

import Component from "../../../components/ArchiveList.vue";

describe("addons/lzsResearchClient/tests/unit/components/ArchiveList.spec.js", () => {
    let wrapper,
        store,
        mockDatasets;

    beforeEach(() => {
        mockDatasets = reactive([
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id1", "checked": false, fileSizeBytes: 1e7, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "6232", "type": "I"}]},
            {"archiveId": "DKL_3DSTADT_LOD1", "instanceId": "id2", "checked": false, fileSizeBytes: 4e7, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "4835", "type": "I"}]},
            {"archiveId": "test", "instanceId": "id3", "checked": false, fileSizeBytes: 3e7, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}, {"name": "KACHELNUMMER", "value": "1000", "type": "I"}]},
            {"archiveId": "testOneColumn", "instanceId": "id4", "checked": false, fileSizeBytes: 2e7, "attributes": [{"name": "JAHRGANG", "value": "2022", "type": "I"}]}
        ]);

        const tableStubInstances = [];

        const TabResultTableStub = {
            name: "TabResultTable",
            props: ["tableIndex", "tableHeader", "tableDatasets", "hasGeoRef", "showButtons"],
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
                                getDossierIdsForArchiveId: () => (id) => {
                                    if (id === "DKL_3DSTADT_LOD1") {
                                        return ["dossierId1", "dossierId2"];
                                    }
                                    return [];
                                },
                                archiveHasGeoref: () => (id) => {
                                    return id === "test";
                                },
                                progressNow: () => -1,
                                isFetchingPrimaryData: () => false
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

    it("should enable download button only when one or more table rows are checked", async () => {
        expect(wrapper.vm.somethingCheckedForDownload).to.be.false;

        const downloadButton = wrapper.find("#tabResultDownloadButton");

        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("true");

        // check only one dataset => button should be enabled
        mockDatasets[0].checked = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.true;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("false");

        // check all datasets => button should be enabled
        mockDatasets.forEach((data) => {
            data.checked = true;
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.true;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("false");

        // uncheck all datasets => button should be disabled again
        mockDatasets.forEach((data) => {
            data.checked = false;
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.false;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("true");
    });

    describe("sumOfCheckedFileSizesForArchive", async () => {
        it("should return the correct sum of checked file sizes for a given archive, including metadata bytes", async () => {
            mockDatasets[0].checked = true;
            mockDatasets[1].checked = true;

            await wrapper.vm.$nextTick();

            const sumForArchive1 = wrapper.vm.sumOfCheckedFileSizesForArchive("DKL_3DSTADT_LOD1");

            expect(sumForArchive1).to.equal("50,10 MB");

        });

        it("should return null when no datasets are checked for a given archive", async () => {
            const sumForArchive2 = wrapper.vm.sumOfCheckedFileSizesForArchive("DKL_3DSTADT_LOD1");

            expect(sumForArchive2).to.equal(null);
        });
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

        it("should disable download button when sumOfCheckedFilesProgress exceeds 100", async () => {
            mockDatasets[0].checked = true;
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#tabResultDownloadButton").attributes("disabled")).to.equal("false");

            wrapper.vm.sumOfCheckedFilesProgress = 101;
            await wrapper.vm.$nextTick();

            expect(wrapper.find("#tabResultDownloadButton").attributes("disabled")).to.equal("true");
        });
    });
});
