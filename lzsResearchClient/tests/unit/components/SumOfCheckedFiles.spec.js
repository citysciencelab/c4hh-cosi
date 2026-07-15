import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {reactive} from "vue";

import Component from "../../../components/SumOfCheckedFiles.vue";

describe("addons/lzsResearchClient/tests/unit/components/SumOfCheckedFiles.spec.js", () => {
    let wrapper,
        store,
        mockCheckedData;

    beforeEach(() => {
        mockCheckedData = reactive([
            {
                "archiveId": "DKL_ALKIS",
                "checked": true,
                "fileSizeBytes": 9800,
                "primaryData": [
                    {
                        "id": "primaryDataId1",
                        "fileSizeBytes": 9800,
                        "georeferencePrimarydata": null
                    }
                ]
            },
            {
                "archiveId": "DKL_3DSTADT_LOD1",
                "checked": true,
                "fileSizeBytes": 200200,
                "primaryData": [
                    {
                        "id": "primaryDataId2",
                        "fileSizeBytes": 100100,
                        "georeferencePrimarydata": {
                            "id": "georeferencePrimarydataId2",
                            "fileSizeBytes": 100
                        }
                    },
                    {
                        "id": "primaryDataId3",
                        "fileSizeBytes": 100100,
                        "georeferencePrimarydata": {
                            "id": "georeferencePrimarydataId3",
                            "fileSizeBytes": 100
                        }
                    }
                ]
            }
        ]);

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
                                getDossierIdsForArchiveId: () => (id) => {
                                    if (id === "DKL_ALKIS") {
                                        return [1, 2];
                                    }
                                    return [];
                                },
                                maxDownloadMB: () => 50,
                                isFetchingPrimaryData: () => false
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                checkedDatasets: mockCheckedData
            },
            global: {
                mocks: {
                    $t: (key, pattern) => {
                        if (pattern) {
                            return key + ":" + Object.values(pattern).join(",");
                        }
                        return key;
                    }
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

    it("should calculate current and max files sizes correctly, including metadata bytes", async () => {
        expect(wrapper.vm.maxDownloadMB).to.equal(50);
        expect(wrapper.vm.maxDownloadBytes).to.equal(50000000);
        expect(wrapper.vm.sumOfFileSizes).to.equal(310000);
        expect(wrapper.vm.progressPercentage).to.equal(0.62);

        mockCheckedData[0].fileSizeBytes = 50000000;

        expect(wrapper.vm.sumOfFileSizes).to.equal(50300200);
        expect(wrapper.vm.progressPercentage).to.equal(100.6004);
    });

    it("should build css rules and user information correctly based on current files sizes", () => {
        expect(wrapper.vm.progressBarCss).to.deep.equal({
            "--maxValueReached": "#3C5F94",
            "width": "0.62%"
        });
        expect(wrapper.vm.currentProgressInformation).to.deep.equal("additional:modules.lzsResearchClient.sumOfCheckedFiles.sumOk:310 kB,50 MB");

        mockCheckedData[0].fileSizeBytes = 55000000;

        expect(wrapper.vm.progressBarCss).to.deep.equal({
            "--maxValueReached": "#E10019",
            "width": "110.6004%"
        });
        expect(wrapper.vm.currentProgressInformation).to.deep.equal("additional:modules.lzsResearchClient.sumOfCheckedFiles.sumTooHigh:55,30 MB");
    });
});
