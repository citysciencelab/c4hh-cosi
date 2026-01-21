import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/TabSearch.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabSearch.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        const mockDataClassList = [
                {
                    name: "3D-Stadtmodell LoD1",
                    id: "DKL_3DSTADT_LOD1",
                    active: true,
                    highestActiveDataclassVersion: {
                        dataclassAttributs: [
                            {name: "JAHRGANG", usage: "I"},
                            {name: "KACHELNUMMER", usage: "I"}
                        ]
                    }
                },
                {
                    name: "3D-Stadtmodell LoD2",
                    id: "DKL_3DSTADT_LOD2",
                    active: true,
                    highestActiveDataclassVersion: {
                        dataclassAttributs: [
                            {name: "JAHRGANG", usage: "I"},
                            {name: "KACHELNUMMER", usage: "I"}
                        ]
                    }
                },
                {
                    name: "AFIS-Einzelnachweise",
                    id: "DKL_AFIS_EINZEL",
                    active: true,
                    highestActiveDataclassVersion: {
                        dataclassAttributs: [
                            {name: "JAHRGANG", usage: "I"},
                            {name: "PUNKTKENNUNG", usage: "I"}
                        ]
                    }
                }
            ],
            mockPlaceholdersJson = {
                "3D-Stadtmodell LoD1": {
                    "JAHRGANG": {
                        "PLACEHOLDER": "2023",
                        "PATTERN": "[0-9*]{4}"
                    },
                    "KACHELNUMMER": {
                        "PLACEHOLDER": "6628",
                        "PATTERN": "[0-9*]{4}"
                    }
                },
                "3D-Stadtmodell LoD2": {
                    "JAHRGANG": {
                        "PLACEHOLDER": "2023",
                        "PATTERN": "[0-9*]{4}"
                    },
                    "KACHELNUMMER": {
                        "PLACEHOLDER": "6628",
                        "PATTERN": "[0-9*]{4}"
                    }
                },
                "AFIS-Einzelnachweise": {
                    "JAHRGANG": {
                        "PLACEHOLDER": "2023",
                        "PATTERN": "[0-9*]{4}"
                    },
                    "PUNKTKENNUNG": {
                        "PLACEHOLDER": "232590148",
                        "PATTERN": "[0-9*]{9}"
                    }
                }
            };

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({}),
                            getters: {
                                dataClassList: () => mockDataClassList,
                                archiveList: () => mockDataClassList.map(a => ({id: a.id, name: a.name})),
                                yearsList: () => [2020],
                                archiveYears: () => ({}),
                                placeholderDataClassList: () => mockPlaceholdersJson
                            },
                            actions: {
                                fetchDataClassList: () => Promise.resolve(),
                                fetchPlaceholders: () => Promise.resolve(),
                                fetchYears: () => Promise.resolve()
                            },
                            mutations: {
                                setYearsList: () => Promise.resolve()
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
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

    it("clicking first list item shows attribute form", async () => {
        const searchOptionsList = wrapper.findAll("#searchOptionsList li");

        expect(searchOptionsList.length).to.be.at.least(1);

        await searchOptionsList[0].trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchFormWithAttributes");
        expect(wrapper.find("#searchFormWithAttributes").exists()).to.be.true;
    });

    it("clicking second list item shows geometry form", async () => {
        const searchOptionsList = wrapper.findAll("#searchOptionsList li");

        expect(searchOptionsList.length).to.be.at.least(2);

        await searchOptionsList[1].trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchFormWithGeometry");
        expect(wrapper.find("#searchFormWithGeometry").exists()).to.be.true;
    });

    it("back button returns to options list", async () => {
        const searchOptionsList = wrapper.findAll("#searchOptionsList li");

        await searchOptionsList[0].trigger("click");

        await wrapper.vm.$nextTick();

        const backButton = wrapper.find("#backButton");

        expect(backButton.exists()).to.be.true;

        await backButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeContent).to.equal("searchOptionsList");
        expect(wrapper.find("#searchOptionsList").exists()).to.be.true;
    });

    it("initializes searchWithAttributeFormData from dataClassList", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        await items[0].trigger("click");

        await wrapper.vm.$nextTick();

        const searchAttributes = wrapper.vm.searchWithAttributeFormData,
            searchWithAttributeForm = searchAttributes["3D-Stadtmodell LoD1"];

        expect(Object.keys(searchAttributes)).to.include.members([
            "3D-Stadtmodell LoD1",
            "3D-Stadtmodell LoD2",
            "AFIS-Einzelnachweise"
        ]);

        expect(searchWithAttributeForm).to.be.an("array");
        expect(searchWithAttributeForm.length).to.equal(3);
        expect(searchWithAttributeForm[0].value).to.equal("2023");
    });

    it("updates attribute value when input changes", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        await items[0].trigger("click");

        await wrapper.vm.$nextTick();

        const searchAttributes = wrapper.vm.searchWithAttributeFormData;

        expect(searchAttributes).to.have.property("3D-Stadtmodell LoD1");
        expect(searchAttributes["3D-Stadtmodell LoD1"]).to.be.an("array").that.is.not.empty;

        wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value = "newValue";

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value).to.equal("newValue");
    });

    it("select shows correct archive options and selecting updates selectedArchiv", async () => {
        const items = wrapper.findAll("#searchOptionsList li");

        await items[0].trigger("click");

        await wrapper.vm.$nextTick();

        const keys = Object.keys(wrapper.vm.searchWithAttributeFormData);

        expect(keys).to.include.members([
            "3D-Stadtmodell LoD1",
            "3D-Stadtmodell LoD2",
            "AFIS-Einzelnachweise"
        ]);

        const select = wrapper.find("select#archive");

        expect(select.exists()).to.be.true;

        wrapper.vm.setSelectedArchive("AFIS-Einzelnachweise");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedArchive).to.equal("AFIS-Einzelnachweise");
    });

    it("toggles archive checkbox updates selectedArchivIds", async () => {
        const items = wrapper.findAll("#searchOptionsList li"),
            archiveId = "DKL_3DSTADT_LOD2";

        await items[1].trigger("click");
        await wrapper.vm.$nextTick();
        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: true}});

        expect(wrapper.vm.selectedArchiveIds).to.include(archiveId);

        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: false}});

        expect(wrapper.vm.selectedArchiveIds).to.not.include(archiveId);
    });

    it("toggles year checkbox updates selectedYears", async () => {
        const items = wrapper.findAll("#searchOptionsList li"),
            year = 2020;

        await items[1].trigger("click");
        await wrapper.vm.$nextTick();
        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: true}});

        expect(wrapper.vm.selectedYears).to.include(year);

        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: false}});

        expect(wrapper.vm.selectedYears).to.not.include(year);
    });

    it("resetForm restores attribute form and geometric selections", async () => {
        const items = wrapper.findAll("#searchOptionsList li"),
            archiveId = "DKL_3DSTADT_LOD2",
            year = 2020;

        await items[0].trigger("click");
        await wrapper.vm.$nextTick();

        const formData = wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0];

        formData.value = "newValue";
        wrapper.vm.setSelectedArchive("AFIS-Einzelnachweise");

        await wrapper.vm.$nextTick();
        await items[1].trigger("click");
        await wrapper.vm.$nextTick();
        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: true}});
        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: true}});

        expect(wrapper.vm.selectedArchive).to.equal("AFIS-Einzelnachweise");
        expect(wrapper.vm.selectedArchiveIds).to.include(archiveId);
        expect(wrapper.vm.selectedYears).to.include(year);

        wrapper.vm.resetForm();

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedArchive).to.equal("3D-Stadtmodell LoD1");
        expect(wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value).to.equal("2023");
        expect(wrapper.vm.selectedArchiveIds).to.be.an("array").that.is.empty;
        expect(wrapper.vm.selectedYears).to.be.an("array").that.is.empty;
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
    });
});
