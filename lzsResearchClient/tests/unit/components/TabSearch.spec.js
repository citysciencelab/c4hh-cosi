import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature";

import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";

import Component from "../../../components/TabSearch.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabSearch.spec.js", () => {
    let wrapper,
        store,
        drawLayerSourceMock,
        currentModifyInteractionMock;
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
                "DKL_3DSTADT_LOD1": {
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
                "DKL_3DSTADT_LOD2": {
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
                "DKL_AFIS_EINZEL": {
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
            };

        drawLayerSourceMock = {
            clear: sinon.stub(),
            addFeature: sinon.stub(),
            on: sinon.stub(),
            un: sinon.stub(),
            getFeatures: sinon.stub().returns([])
        };

        currentModifyInteractionMock = {
            on: sinon.stub(),
            un: sinon.stub()
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
                                maxGeometryArea: () => 4000000,
                                addressSearchCoordinates: () => [1, 2],
                                alkisBaseUrl: () => "https://alkis_vereinfacht",
                                parcelSearchSelectSource: () => "https://test/gemarkungen_hh.json",
                                parcelSourceData: () => null

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
                        placingPointMarker: () => sinon.stub(),
                        zoomToExtent: () => sinon.stub()
                    },
                    state: () => ({
                        scale: 5000
                    }),
                    getters: {
                        // FIX: EPSG:3857 is registered in OL by default (with EPSG:4326 transform),
                        // so getArea() can call geometry.transform() without returning null.
                        projectionCode: () => "EPSG:3857",
                        scale: state => state.scale,
                        extent: () => [0, 0, 100, 100]
                    },
                    mutations: {
                        // Mirror the real mutation signature
                        setScale: (state, value) => {
                            state.scale = value;
                        }
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

        wrapper.vm.currentModifyInteraction = currentModifyInteractionMock;
        sinon.stub(modifyInteraction, "createModifyInteraction").returns(currentModifyInteractionMock);
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
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
            mockLineString = new LineString([[0, 0], [1, 0], [0, 1]]),
            mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]);

        await wrapper.vm.setSearchGeometry(mockPoint);

        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Point", coordinates: [0, 0]});

        await wrapper.vm.setSearchGeometry(mockLineString);

        // Lines should be converted to polygons
        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]]});

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
    it("onDrawEnd sets searchGeometry", async () => {
        const mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]);

        await wrapper.vm.onDrawEnd({feature: {getGeometry: () => mockPolygon}});

        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]]});
    });

    it("onDrawEnd creates modify interaction and registers modifyend listener", async () => {
        const mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]);

        await wrapper.vm.onDrawEnd({feature: {getGeometry: () => mockPolygon}});

        expect(wrapper.vm.currentModifyInteraction).to.deep.equal(currentModifyInteractionMock);
        expect(currentModifyInteractionMock.on.calledWith("modifyend", wrapper.vm.onModifyEnd)).to.be.true;
    });

    it("onModifyEnd updates searchGeometry", async () => {
        const mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]),
            modifiedMockPolygon = new Polygon([[[0, 0], [1, 1], [1, 2], [1, 0], [0, 0]]]);

        await wrapper.vm.onDrawEnd({feature: {getGeometry: () => mockPolygon}});
        await wrapper.vm.onModifyEnd({features: {getArray: () => [{getGeometry: () => modifiedMockPolygon}]}});

        expect(wrapper.vm.searchGeometry).to.deep.equal({type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 2], [1, 0], [0, 0]]]});
    });

    it("removeSearchGeometry clears searchGeometry, currentModifyInteraction and unregisters modifyend listener", async () => {
        const mockPolygon = new Polygon([[[0, 0], [1, 1], [1, 0], [0, 0]]]);

        await wrapper.vm.onDrawEnd({feature: {getGeometry: () => mockPolygon}});
        await wrapper.vm.removeSearchGeometry();

        expect(wrapper.vm.searchGeometry).to.be.null;
        expect(wrapper.vm.currentModifyInteraction).to.be.null;
        expect(currentModifyInteractionMock.un.calledWith("modifyend", wrapper.vm.onModifyEnd)).to.be.true;
    });

    it("spatialAreaWarning computed returns null when no warning conditions are met (default state)", () => {
        expect(wrapper.vm.spatialAreaWarning).to.be.null;
    });

    it("spatialAreaWarning computed returns null when extent mode is active but scale equals minScaleValue", () => {
        wrapper.vm.selectedButtonGroup = "extent";

        expect(wrapper.vm.spatialAreaWarning).to.be.null;
    });

    it("spatialAreaWarning computed returns the extent warning when scale exceeds minScaleValue", async () => {
        store.commit("Maps/setScale", 10000);

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedButtonGroup).to.equal("extent");
        expect(wrapper.vm.spatialAreaWarning).to.equal(
            "additional:modules.lzsResearchClient.tabs.tabSearch.extentWarningMessage:5000"
        );
    });

    it("spatialAreaWarning computed returns the geometry area warning translation key when geometry mode is active and showAreaWarning is true", async () => {
        wrapper.vm.selectedButtonGroup = "geometry";
        wrapper.vm.showAreaWarning = true;
        wrapper.vm.searchGeometryArea = 1500000000; // 1500 km²

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.spatialAreaWarning).to.equal(
            "additional:modules.lzsResearchClient.tabs.tabSearch.geometryAreaWarningMessage:4,1500"
        );
    });

    it("spatialAreaWarning computed returns null when geometry mode is active but showAreaWarning is false", async () => {
        wrapper.vm.selectedButtonGroup = "geometry";
        wrapper.vm.showAreaWarning = false;

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.spatialAreaWarning).to.be.null;
    });

    describe("checkSearchGeometryArea", () => {
        // A ~1 km² polygon in EPSG:3857 (well within limit)
        const smallPolygon = new Polygon([[[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]]]),
            // A ~9 km² polygon in EPSG:3857 (exceeds limit)
            largePolygon = new Polygon([[[0, 0], [3000, 0], [3000, 3000], [0, 3000], [0, 0]]]);

        it("returns true when area is within the allowed limit", () => {
            const result = wrapper.vm.checkSearchGeometryArea(smallPolygon);

            expect(result).to.be.true;
        });

        it("does not set showAreaWarning when area is within the allowed limit", () => {
            wrapper.vm.checkSearchGeometryArea(smallPolygon);

            expect(wrapper.vm.showAreaWarning).to.be.false;
        });

        it("sets searchGeometryArea to the calculated numeric value", () => {
            wrapper.vm.checkSearchGeometryArea(smallPolygon);

            expect(wrapper.vm.searchGeometryArea).to.be.a("number").and.to.be.above(0);
        });

        it("returns false when area exceeds the allowed limit", () => {
            const result = wrapper.vm.checkSearchGeometryArea(largePolygon);

            expect(result).to.be.false;
        });

        it("sets showAreaWarning to true when area exceeds the allowed limit", () => {
            wrapper.vm.checkSearchGeometryArea(largePolygon);

            expect(wrapper.vm.showAreaWarning).to.be.true;
        });

        it("sets searchGeometry to null when area exceeds the allowed limit", () => {
            wrapper.vm.searchGeometry = {type: "Point", coordinates: [0, 0]};

            wrapper.vm.checkSearchGeometryArea(largePolygon);

            expect(wrapper.vm.searchGeometry).to.be.null;
        });
    });

    describe("clearParcelSearch", () => {
        it("resets parcelNumberInputValue to an empty string", () => {
            wrapper.vm.parcelNumberInputValue = "12345";

            wrapper.vm.clearParcelSearch();

            expect(wrapper.vm.parcelNumberInputValue).to.equal("");
        });

        it("does not change selectedParcelDistrict when clearDistrict is false", () => {
            wrapper.vm.selectedParcelDistrict = "SomeDistrict";

            wrapper.vm.clearParcelSearch();

            expect(wrapper.vm.selectedParcelDistrict).to.equal("SomeDistrict");
        });

        it("does change selectedParcelDistrict when clearDistrict is true", () => {
            wrapper.vm.selectedParcelDistrict = "SomeDistrict";

            wrapper.vm.clearParcelSearch(true);

            expect(wrapper.vm.selectedParcelDistrict).to.be.null;
        });

        it("does not clear the draw layer source when searchGeometry is null", () => {
            wrapper.vm.searchGeometry = null;

            wrapper.vm.clearParcelSearch();

            expect(drawLayerSourceMock.clear.called).to.be.false;
        });

        it("sets searchGeometry to null when it was set", () => {
            wrapper.vm.searchGeometry = {type: "Point", coordinates: [0, 0]};

            wrapper.vm.clearParcelSearch();

            expect(wrapper.vm.searchGeometry).to.be.null;
        });

        it("clears the draw layer source when searchGeometry was set", () => {
            wrapper.vm.searchGeometry = {type: "Point", coordinates: [0, 0]};

            wrapper.vm.clearParcelSearch();

            expect(drawLayerSourceMock.clear.called).to.be.true;
        });
    });

    describe("fetchParcelSearchResults", () => {
        it("returns the GeoJSON array returned by getOAFFeatureGet on success", async () => {
            const mockResult = [{geometry: {type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}}];

            sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves(mockResult);

            const result = await wrapper.vm.fetchParcelSearchResults();

            expect(result).to.deep.equal(mockResult);
        });

        it("returns null when getOAFFeatureGet rejects", async () => {
            sinon.stub(console, "warn");
            sinon.stub(getOAFFeature, "getOAFFeatureGet").rejects(new Error("Network error"));

            const result = await wrapper.vm.fetchParcelSearchResults();

            expect(result).to.be.null;
        });

        it("calls getOAFFeatureGet for the Flurstueck collection with the correct literal filters", async () => {
            const stub = sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves([]);

            wrapper.vm.selectedParcelDistrict = "123";
            wrapper.vm.parcelNumberInputValue = "789";

            await wrapper.vm.fetchParcelSearchResults();

            expect(stub.calledOnce).to.be.true;
            expect(stub.firstCall.args[1]).to.equal("Flurstueck");
            expect(stub.firstCall.args[2].literalFilters).to.deep.equal({
                gemaschl: "02123",
                flstnrzae: "789"
            });
        });
    });

    describe("handleParcelSearchSubmit", () => {
        // MultiPolygon coordinates: array of polygon arrays, each polygon = [outerRing, ...innerRings]
        const smallRing = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]],
            largeRing = [[0, 0], [500, 0], [500, 500], [0, 500], [0, 0]],
            singlePolygonGeoCoords = [[smallRing]],
            twoPolygonGeoCoords = [[smallRing], [largeRing]];

        it("does not set searchGeometry when parcelGeoJson is null", async () => {
            sinon.stub(console, "warn");
            sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves(null);

            wrapper.vm.handleParcelSearchSubmit();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(wrapper.vm.searchGeometry).to.be.null;
        });

        it("does not set searchGeometry when the first feature has no geometry", async () => {
            sinon.stub(console, "warn");
            sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves([{type: "Feature"}]);

            wrapper.vm.handleParcelSearchSubmit();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(wrapper.vm.searchGeometry).to.be.null;
        });

        it("sets searchGeometry when the parcel contains a single polygon", async () => {
            sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves([{
                geometry: {coordinates: singlePolygonGeoCoords}
            }]);

            wrapper.vm.handleParcelSearchSubmit();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(wrapper.vm.searchGeometry).to.not.be.null;
            expect(wrapper.vm.searchGeometry.type).to.equal("Polygon");
            expect(wrapper.vm.searchGeometry.coordinates).to.deep.equal([smallRing]);
        });

        it("selects the largest polygon when the parcel contains multiple polygons", async () => {
            sinon.stub(getOAFFeature, "getOAFFeatureGet").resolves([{
                geometry: {coordinates: twoPolygonGeoCoords}
            }]);

            wrapper.vm.handleParcelSearchSubmit();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(wrapper.vm.searchGeometry).to.not.be.null;
            expect(wrapper.vm.searchGeometry.type).to.equal("Polygon");
            expect(wrapper.vm.searchGeometry.coordinates).to.deep.equal([largeRing]);
        });
    });
});
