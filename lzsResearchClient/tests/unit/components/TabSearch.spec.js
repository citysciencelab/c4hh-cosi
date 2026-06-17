import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";

import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";

import Component from "../../../components/TabSearch.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabSearch.spec.js", () => {
    let wrapper,
        store;
    const mockMaxResultValueCount = 100;

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
                        "PATTERN": "[0-9*]{4}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 4}
                    },
                    "KACHELNUMMER": {
                        "PLACEHOLDER": "6628",
                        "PATTERN": "[0-9*]{4}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 4}
                    }
                },
                "3D-Stadtmodell LoD2": {
                    "JAHRGANG": {
                        "PLACEHOLDER": "2023",
                        "PATTERN": "[0-9*]{4}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 4}
                    },
                    "KACHELNUMMER": {
                        "PLACEHOLDER": "6628",
                        "PATTERN": "[0-9*]{4}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 4}
                    }
                },
                "AFIS-Einzelnachweise": {
                    "JAHRGANG": {
                        "PLACEHOLDER": "2023",
                        "PATTERN": "[0-9*]{4}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 4}
                    },
                    "PUNKTKENNUNG": {
                        "PLACEHOLDER": "232590148",
                        "PATTERN": "[0-9*]{9}",
                        "ERROR_KEY": "patternError",
                        "ERROR_PARAMS": {"digitNumber": 9}
                    }
                }
            },
            drawLayerSourceMock = {
                clear: sinon.stub(),
                addFeature: sinon.stub()
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
                                archiveHasGeoref: () => (id) => {
                                    return id === "DKL_AFIS_EINZEL";
                                },
                                yearsList: () => [2020],
                                archiveYears: () => ({}),
                                placeholderDataClassList: () => mockPlaceholdersJson,
                                lzsCurrentLayout: () => ({
                                    fillColor: [148, 10, 65, 0.5],
                                    strokeColor: [148, 10, 65],
                                    strokeWidth: 3,
                                    circleStrokeColor: [148, 10, 65]
                                }),
                                lzsDrawIcons: () => ({
                                    box: "bi-square",
                                    deleteAll: "bi-trash",
                                    pen: "bi-pencil",
                                    point: "bi-dot",
                                    polygon: "bi-hexagon"
                                }),
                                lzsDrawTypes: () => ["box", "polygon", "pen", "point"],
                                lzsSelectedDrawType: () => "",
                                lzsSelectedInteraction: () => null,
                                lzsDrawEdits: () => ["deleteAll"],
                                minScaleValue: () => 5000,
                                maxResultValueCount: () => mockMaxResultValueCount,
                                addressSearchCoordinates: () => [1, 2]
                            },
                            actions: {
                                fetchDataClassList: () => Promise.resolve(),
                                fetchPlaceholders: () => Promise.resolve(),
                                fetchYears: () => Promise.resolve(),
                                searchByGeometry: () => Promise.resolve()
                            },
                            mutations: {
                                setYearsList: () => Promise.resolve(),
                                setLzsSelectedDrawType: () => "box",
                                setLzsSelectedInteraction: () => "draw",
                                setSearchInput: () => sinon.stub(),
                                setAddressSearchCoordinates: () => sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: () => ({
                            getSource: () => drawLayerSourceMock
                        }),
                        registerListener: () => sinon.stub(),
                        addInteraction: () => sinon.stub(),
                        removeInteraction: () => sinon.stub(),
                        removePointMarker: () => sinon.stub(),
                        placingPointMarker: () => sinon.stub()
                    },
                    getters: {
                        projectionCode: () => "EPSG:25832",
                        scale: () => 5000,
                        extent: () => [0, 0, 100, 100]
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        expanded: () => sinon.stub()
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            global: {
                mocks: {
                    $t: (key, pattern) => {
                        if (pattern) {
                            return key + ":" + Object.values(pattern).join(",");
                        }
                        return key;
                    }
                },
                plugins: [store],
                stubs: {
                    SwitchInput: false
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    /**
     * Returns the switchInput.
     * @return {Object}
     */
    function getSearchModeSwitch () {
        return wrapper.find("input#idSearchModeSwitch");
    }
    /**
     * Checks/Unchecks the switchInput.
     * @param {Boolean} checked - Whether the switch is to be changed to checked or unchecked.
     */
    async function toggleSwitch (checked = true) {
        await getSearchModeSwitch().setChecked(checked);
    }

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("the geometry search form is active by default", async () => {
        const switchInput = getSearchModeSwitch();

        expect(switchInput.element.checked).to.be.false;
        expect(wrapper.vm.attributeSearchModeIsActive).to.be.false;
        expect(wrapper.find("#searchFormWithGeometry").exists()).to.be.true;
    });

    it("clicking on the switch input switches to the other form", async () => {
        const switchInput = getSearchModeSwitch();

        await toggleSwitch();

        expect(switchInput.element.checked).to.be.true;
        expect(wrapper.vm.attributeSearchModeIsActive).to.be.true;
        expect(wrapper.find("#searchFormWithAttributes").exists()).to.be.true;

        await toggleSwitch(false);

        expect(switchInput.element.checked).to.be.false;
        expect(wrapper.vm.attributeSearchModeIsActive).to.be.false;
        expect(wrapper.find("#searchFormWithGeometry").exists()).to.be.true;
    });

    it("initializes searchWithAttributeFormData from dataClassList", async () => {
        await toggleSwitch();

        const searchAttributes = wrapper.vm.searchWithAttributeFormData,
            searchWithAttributeForm = searchAttributes["3D-Stadtmodell LoD1"];

        expect(Object.keys(searchAttributes)).to.include.members([
            "3D-Stadtmodell LoD1",
            "3D-Stadtmodell LoD2",
            "AFIS-Einzelnachweise"
        ]);

        expect(searchWithAttributeForm).to.be.an("array");
        expect(searchWithAttributeForm.length).to.equal(3);
        expect(searchWithAttributeForm[0].value).to.equal("");
        expect(searchWithAttributeForm[2].name).to.equal("maxValueCount");
        expect(searchWithAttributeForm[2].value).to.equal("25");
        expect(searchWithAttributeForm[2].placeholder).to.equal("10");
        expect(searchWithAttributeForm[2].testNumberRange).to.deep.equal([1, mockMaxResultValueCount]);
    });

    it("updates attribute value when input changes", async () => {
        await toggleSwitch();

        const searchAttributes = wrapper.vm.searchWithAttributeFormData;

        expect(searchAttributes).to.have.property("3D-Stadtmodell LoD1");
        expect(searchAttributes["3D-Stadtmodell LoD1"]).to.be.an("array").that.is.not.empty;

        wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value = "newValue";

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value).to.equal("newValue");
    });

    it("select shows correct archive options and selecting updates selectedArchiv", async () => {
        await toggleSwitch();

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
        const archiveId = "DKL_3DSTADT_LOD2";

        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: true}});

        expect(wrapper.vm.selectedArchiveIds).to.include(archiveId);

        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: false}});

        expect(wrapper.vm.selectedArchiveIds).to.not.include(archiveId);
    });

    it("toggles year checkbox updates selectedYears", async () => {
        const year = 2020;

        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: true}});

        expect(wrapper.vm.selectedYears).to.include(year);

        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: false}});

        expect(wrapper.vm.selectedYears).to.not.include(year);
    });

    it("resetForm restores attribute form and geometric selections", async () => {
        // Ensure lzsDrawLayerSource is mocked before calling setSearchGeometry
        wrapper.vm.lzsDrawLayerSource = {
            clear: sinon.stub(),
            addFeature: sinon.stub()
        };
        const archiveId = "DKL_3DSTADT_LOD2",
            year = 2020;

        await toggleSwitch();

        const formData = wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0];

        formData.value = "newValue";
        wrapper.vm.setSelectedArchive("AFIS-Einzelnachweise");

        await wrapper.vm.$nextTick();
        await toggleSwitch(false);
        await wrapper.vm.onSelectedArchiveIdsChange(archiveId, {target: {checked: true}});
        await wrapper.vm.onSelectedYearsChange(year, {target: {checked: true}});
        await wrapper.vm.setSearchGeometry(new Point([0, 0]));

        expect(wrapper.vm.selectedArchive).to.equal("AFIS-Einzelnachweise");
        expect(wrapper.vm.selectedArchiveIds).to.include(archiveId);
        expect(wrapper.vm.selectedYears).to.include(year);
        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Point", coordinates: [0, 0]});

        wrapper.vm.resetForm();

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedArchive).to.equal("3D-Stadtmodell LoD1");
        expect(wrapper.vm.searchWithAttributeFormData["3D-Stadtmodell LoD1"][0].value).to.equal("");
        expect(wrapper.vm.selectedArchiveIds).to.be.an("array").that.is.empty;
        expect(wrapper.vm.selectedYears).to.be.an("array").that.is.empty;
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
        expect(wrapper.vm.isSpatialSearchFormValid).to.be.false;
        expect(wrapper.vm.searchGeometry).to.be.null;
    });

    it("set SearchGeometry correctly", async () => {
        const mockPoint = new Point([0, 0]),
            mockLineString = new LineString([[0, 0], [1, 1]]),
            mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]);

        await wrapper.vm.setSearchGeometry(mockPoint);

        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Point", coordinates: [0, 0]});

        await wrapper.vm.setSearchGeometry(mockLineString);

        // Lines should be converted to polygons
        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Polygon", coordinates: [[[0, 0], [1, 1], [0, 0]]]});

        await wrapper.vm.setSearchGeometry(mockPolygon);

        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]]});
    });

    it("sets selected button group of spatial selection", async () => {
        await wrapper.vm.setSelectedButtonGroup("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.geometries");

        expect(wrapper.vm.selectedButtonGroup).to.equal("geometry");

        await wrapper.vm.setSelectedButtonGroup("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.extent");

        expect(wrapper.vm.selectedButtonGroup).to.equal("extent");

        await wrapper.vm.setSelectedButtonGroup("additional:modules.lzsResearchClient.tabs.tabSearch.spatialSelectionGroup.address");

        expect(wrapper.vm.selectedButtonGroup).to.equal("address");
    });

    it("validating the attribute search form input", async () => {
        await toggleSwitch();

        const searchAttributes = wrapper.vm.searchWithAttributeFormData,
            searchWithAttributeForm = searchAttributes["3D-Stadtmodell LoD1"];

        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
        expect(searchWithAttributeForm[2].errorMessage).to.equal("");

        // maxValueCount
        searchWithAttributeForm[2].value = "1000";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[2].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.numberRangeError:1," + mockMaxResultValueCount);

        searchWithAttributeForm[2].value = "-1";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[2].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.numberRangeError:1," + mockMaxResultValueCount);

        searchWithAttributeForm[2].value = "abc";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[2].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.numberRangeError:1," + mockMaxResultValueCount);

        searchWithAttributeForm[2].value = "";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[2].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.numberRangeError:1," + mockMaxResultValueCount);

        // other patterns from placeholder.json
        searchWithAttributeForm[0].value = "2026";
        searchWithAttributeForm[2].value = "20";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("");

        searchWithAttributeForm[0].value = "20*6";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("");

        searchWithAttributeForm[0].value = "";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.true;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("");

        searchWithAttributeForm[0].value = "100";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.patternError:4");

        searchWithAttributeForm[0].value = "abc";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.patternError:4");

        searchWithAttributeForm[0].value = "1a0";
        wrapper.vm.validateSearchWithAttributeForm();
        expect(wrapper.vm.isAttributeSearchFormValid).to.be.false;
        expect(searchWithAttributeForm[0].errorMessage).to.equal("additional:modules.lzsResearchClient.tabs.tabSearch.patternError:4");
    });
});
