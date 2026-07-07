import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";

import Component from "../../../components/TabDetails.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabDetails.spec.js", () => {
    let wrapper,
        store,
        details;

    beforeEach(() => {
        details = reactive({
            "archiveId": "DKL_GNW",
            "instanceId": "79d300ee-0029-a4d2-53d9-a8524541f72d",
            "attributes": [
                {
                    "name": "GEMARKUNG",
                    "value": "147",
                    "type": "I",
                    "id": "GEMARKUNG"
                },
                {
                    "name": "JAHRGANG",
                    "value": "2021",
                    "type": "I",
                    "id": "JAHRGANG"
                },
                {
                    "name": "AUFTRAG_BLATT_NUMMER",
                    "value": "416491",
                    "type": "I",
                    "id": "AUFTRAG_BLATT_NUMMER"
                }
            ],
            "geom": null,
            "checked": false,
            "primaryData": [
                {
                    "objectId": "40bdee17-be4c-2cbd-4878-7b306fa5b10f",
                    "checked": false,
                    "georeferencePrimarydata": null,
                    "primarydataAttributes": [
                        {
                            "value": "416491",
                            "key": "AUFTRAG_BLATT_NUMMER"
                        },
                        {
                            "value": "2021",
                            "key": "JAHRGANG"
                        },
                        {
                            "value": "E",
                            "key": "AKTENHINWEIS"
                        },
                        {
                            "value": "147",
                            "key": "GEMARKUNG"
                        },
                        {
                            "value": "00002",
                            "key": "SEITENNUMMER"
                        }
                    ],
                    "contentFilename": "147202141649100002.tif",
                    "dklId": "DKL_GNW",
                    "geoDatatype": null,
                    "primaryDataId": "FB8305947897840444B93EB9FC3DF46C2B854A4B9DCDA659027250D4DA190D21",
                    "contentMimetype": null,
                    "geoDatatypeCtrl": "RASTER_OHNE_RAUMBEZUG",
                    "contentFileSize": 961558,
                    "dklVersionId": "d69ea1b1-7f0a-c7e9-aa8d-ded48507a386",
                    "dklVersion": 2,
                    "instanceId": "79d300ee-0029-a4d2-53d9-a8524541f72d",
                    "geoFileFormat": "TIFF"
                },
                {
                    "objectId": "47d0abac-e072-6cfe-5e05-afb7eb930a43",
                    "checked": false,
                    "georeferencePrimarydata": null,
                    "primarydataAttributes": [
                        {
                            "value": "416491",
                            "key": "AUFTRAG_BLATT_NUMMER"
                        },
                        {
                            "value": "2021",
                            "key": "JAHRGANG"
                        },
                        {
                            "value": "E",
                            "key": "AKTENHINWEIS"
                        },
                        {
                            "value": "147",
                            "key": "GEMARKUNG"
                        },
                        {
                            "value": "00003",
                            "key": "SEITENNUMMER"
                        }
                    ],
                    "contentFilename": "147202141649100003.tif",
                    "dklId": "DKL_GNW",
                    "geoDatatype": null,
                    "primaryDataId": "FE3C518992558A0237BF6183D30A0DECD2F8E40B2289D58C68A7223E2E84FA40",
                    "contentMimetype": null,
                    "geoDatatypeCtrl": "RASTER_OHNE_RAUMBEZUG",
                    "contentFileSize": 959916,
                    "dklVersionId": "d69ea1b1-7f0a-c7e9-aa8d-ded48507a386",
                    "dklVersion": 2,
                    "instanceId": "79d300ee-0029-a4d2-53d9-a8524541f72d",
                    "geoFileFormat": "TIFF"
                }
            ]
        });

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
                                findDatasetInAttributes: () => () => details,
                                getNameForArchiveId: () => (id) => {
                                    return id;
                                },
                                getDataProtectionClassForArchiveId: () => (id) => {
                                    return id + " Öffentlich";
                                },
                                selectedDetail: () => {
                                    return {
                                        instanceId: "abc",
                                        primaryDataId: "def"
                                    };
                                },
                                progressNow: () => -1,
                                currentProgressValue: () => "",
                                placeholderDataClassList: () => null
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
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

    it("should have buttons and table content to show preview and download but nothing more", () => {
        expect(wrapper.vm.showTableButtons).to.deep.equal({
            georef: false,
            details: false,
            preview: true,
            download: true
        });

        const lengthOfHeaders = wrapper.vm.getTableHeaders().length,
            lengthOfDatasets = wrapper.vm.getTableDatasets()[0].attributes.length,
            numberOfAdditionalButtons = Object.values(wrapper.vm.showTableButtons).filter(v => v === true).length;

        expect(lengthOfDatasets + numberOfAdditionalButtons).to.equal(lengthOfHeaders);
        expect(wrapper.vm.getTableHeaders()).to.deep.equal(
            [
                "Aktenhinweis",
                "Seitennummer",
                "additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB",
                "additional:modules.lzsResearchClient.tabs.archiveList.table.headers.preview",
                "additional:modules.lzsResearchClient.tabs.archiveList.table.headers.download"
            ]
        );
        expect(wrapper.vm.getTableDatasets()[0].attributes[0]).to.deep.equal({name: "AKTENHINWEIS", value: "E"});
        expect(wrapper.vm.getTableDatasets()[0].attributes[1]).to.deep.equal({name: "SEITENNUMMER", value: "00002"});
        expect(wrapper.vm.getTableDatasets()[0].attributes[2]).to.deep.equal({name: "additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB", value: "0,96"});
        expect(wrapper.vm.getTableDatasets()[0].hasPreview).to.be.true;
        expect(wrapper.vm.getTableDatasets()[1].hasPreview).to.be.true;
    });

    it("should have buttons and table content to show only download but nothing more when no geoFileFormat is given", () => {
        details.primaryData.forEach((data) => {
            data.geoFileFormat = null;
        });

        expect(wrapper.vm.showTableButtons).to.deep.equal({
            georef: false,
            details: false,
            preview: false,
            download: true
        });

        const lengthOfHeaders = wrapper.vm.getTableHeaders().length,
            lengthOfDatasets = wrapper.vm.getTableDatasets()[0].attributes.length,
            numberOfAdditionalButtons = Object.values(wrapper.vm.showTableButtons).filter(v => v === true).length;

        expect(lengthOfDatasets + numberOfAdditionalButtons).to.equal(lengthOfHeaders);
        expect(wrapper.vm.getTableHeaders()).to.deep.equal(
            [
                "Aktenhinweis",
                "Seitennummer",
                "additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB",
                "additional:modules.lzsResearchClient.tabs.archiveList.table.headers.download"
            ]
        );
        expect(wrapper.vm.getTableDatasets()[0].hasPreview).to.be.false;
        expect(wrapper.vm.getTableDatasets()[1].hasPreview).to.be.false;
    });

    it("should enable download button only when one or more table rows are checked", async () => {
        expect(wrapper.vm.somethingCheckedForDownload).to.be.false;

        const downloadButton = wrapper.find("#tabDetailsDownloadButton");

        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("true");

        // check only one dataset => button should be enabled
        details.primaryData[0].checked = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.true;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("false");

        // check all datasets => button should be enabled
        details.primaryData.forEach((data) => {
            data.checked = true;
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.true;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("false");

        // uncheck all datasets => button should be disabled again
        details.primaryData.forEach((data) => {
            data.checked = false;
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.somethingCheckedForDownload).to.be.false;
        expect(downloadButton.exists()).to.be.true;
        expect(downloadButton.attributes("disabled")).to.be.equal("true");
    });

    describe("getAllFilesForDownload", () => {
        it("should return correct subset of datasets for download single dataset", async () => {
            let dataForDownload = wrapper.vm.getAllFilesForDownload("FE3C518992558A0237BF6183D30A0DECD2F8E40B2289D58C68A7223E2E84FA40");

            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(1);
            expect(dataForDownload.primaryData[0].contentFilename).to.equal("147202141649100003.tif");

            dataForDownload = wrapper.vm.getAllFilesForDownload();
            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);
        });

        it("should return correct subset of datasets for checking all datasets", async () => {
            // check all datasets => all should be contained in files for download
            details.primaryData.forEach((data) => {
                data.checked = true;
            });
            await wrapper.vm.$nextTick();

            const dataForDownload = wrapper.vm.getAllFilesForDownload();

            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(2);
            expect(dataForDownload.primaryData[0].primaryDataId).to.equal("FB8305947897840444B93EB9FC3DF46C2B854A4B9DCDA659027250D4DA190D21");
            expect(dataForDownload.primaryData[1].primaryDataId).to.equal("FE3C518992558A0237BF6183D30A0DECD2F8E40B2289D58C68A7223E2E84FA40");
        });

        it("should return correct subset of datasets for checking no datasets", async () => {
            // uncheck all datasets => none should be contained in files for download
            details.primaryData.forEach((data) => {
                data.checked = false;
            });
            await wrapper.vm.$nextTick();

            const dataForDownload = wrapper.vm.getAllFilesForDownload();

            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);
        });

        it("should return correct subset of datasets for nonsens intut", async () => {
            let dataForDownload = wrapper.vm.getAllFilesForDownload(null);

            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);

            dataForDownload = wrapper.vm.getAllFilesForDownload(123);
            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);

            dataForDownload = wrapper.vm.getAllFilesForDownload("abc");
            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);

            dataForDownload = wrapper.vm.getAllFilesForDownload(false);
            expect(dataForDownload).to.be.an("object");
            expect(dataForDownload.primaryData).to.be.an("array").to.have.length(0);

        });
    });
});
