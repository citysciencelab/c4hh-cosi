import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {Point, Polygon} from "ol/geom";
import TabFilterContent from "../../../../components/tabs/TabFilterContent.vue";

config.global.mocks.$t = key => key;

describe("addons/geoMarker/components/tabs/TabFilterContent.vue", () => {
    let wrapper = null,
        mockedFilterSelections = {
            departmentsSelected: [],
            statusSelected: ["offen"],
            filterValueSource: "",
            filterValueDescr: "",
            filterValueComment: "",
            filterValueId: "",
            categorySelected: [],
            creationDate: {
                from: "",
                to: ""
            },
            closedDate: {
                from: "",
                to: ""
            },
            reminderDate: {
                from: "",
                to: ""
            },
            geom: null
        };

    const mockFeatureA = {
            get: (key) => {
                if (key === "kategorie") {
                    return "Allgemeines";
                }
                else if (key === "quelle") {
                    return "source";
                }
                else if (key === "beschreibung") {
                    return "description";
                }

                return "";
            },
            getGeometry: () => {
                return new Point([1, 1]);
            },
            getId: () => "feature-A"
        },
        mockFeatureB = {
            get: (key) => {
                if (key === "kategorie") {
                    return "Außendienst";
                }
                else if (key === "quelle") {
                    return "Quelle";
                }
                else if (key === "beschreibung") {
                    return "Hinweis";
                }

                return "";
            },
            getGeometry: () => {
                return new Point([3, 3]);
            },
            getId: () => "feature-B"
        },
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            getters: {
                                filterSelections: () => {
                                    return mockedFilterSelections;
                                },
                                statusOptions: () => ["offen", "geschlossen", "inaktiv"],
                                categories: () => {
                                    return {
                                        "allgemeines": {
                                            "name": "Allgemeines",
                                            "description": "Hinweis allgemein; nicht spezifisch; wird von der Steuerungsstelle adressiert",
                                            "departments": ["steuerungsstelle"]
                                        },
                                        "aussendienst": {
                                            "name": "Außendienst",
                                            "description": "Hinweis für den Außendienst/Gebietstopographen; Feldvergleich",
                                            "departments": ["alkis_geotopographie", "atkis"]
                                        },
                                        "bauwerk": {
                                            "name": "Bauwerk",
                                            "description": "Hinweis mit Bezug auf ein 'Bauwerk'; Bei Verkehrsbezug ist ggf. die Kategorie 'Verkehrsdaten' zu wählen",
                                            "departments": ["alkis_geotopographie", "atkis"]
                                        }
                                    };
                                },
                                departments: () => {
                                    return {
                                        "gemis": {
                                            "name": "Gemis",
                                            "fields": {
                                                "status": "sta_gemis",
                                                "bemerkung": "bem_gemis",
                                                "wiedervorlage": "wie_gemis",
                                                "geschlossen": "ges_gemis"
                                            },
                                            "layerIds": {
                                                "offen": "geomarker_gemis",
                                                "geschlossen": "geomarker_gemis2",
                                                "inaktiv": "geomarker_gemis3"
                                            }
                                        },
                                        "hh_sib": {
                                            "name": "HH-SIB",
                                            "fields": {
                                                "status": "sta_hh_sib",
                                                "bemerkung": "bem_hh_sib",
                                                "wiedervorlage": "wie_hh_sib",
                                                "geschlossen": "ges_hh_sib"
                                            },
                                            "layerIds": {
                                                "offen": "geomarker_hh_sib",
                                                "geschlossen": "geomarker_hh_sib2",
                                                "inaktiv": "geomarker_hh_sib3"
                                            }
                                        }
                                    };
                                }
                            },
                            mutations: {
                                setFilterSelections: (select) => {
                                    mockedFilterSelections = select;
                                },
                                setGeoMarkerFeatureList: (feat) => {
                                    return feat;
                                }
                            }
                        },
                        GraphicalSelect: {
                            namespaced: true,
                            getters: {
                                selectedAreaGeoJson: () => {
                                    return new Polygon([[[0, 0], [2, 0], [2, 2], [0, 0]]]);
                                }
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        expanded: () => (side) => {
                            return side === "secondaryMenu";
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        registerListener: () => {
                            return null;
                        },
                        unregisterListener: () => {
                            return null;
                        }
                    }
                }
            },
            actions: {
                replaceByIdInLayerConfig: () => {
                    return null;
                }
            },
            getters: {
                layerUrlParams: () => {
                    return {};
                }
            }
        });

    beforeEach(() => {
        wrapper = shallowMount(TabFilterContent, {
            global: {
                plugins: [store]
            },
            props: {
                tabActive: true
            }
        });

        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist and have the correct id", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("geoMarkerFilterContent");
    });

    it("should have a headline and filter inputs", () => {
        expect(wrapper.find("div.headline").exists()).to.be.true;
        expect(wrapper.find("div.filterSettings").exists()).to.be.true;
        expect(wrapper.find("div.geomarkerFilterbuttons").exists()).to.be.true;
    });

    it("should compute options correctly", () => {
        expect(wrapper.vm.categoryOptions).to.be.an("array");
        expect(wrapper.vm.categoryOptions).to.have.lengthOf(3);
        expect(wrapper.vm.categoryOptions[0].key).to.be.equal("allgemeines");
        expect(wrapper.vm.categoryOptions[0].label).to.be.equal("Allgemeines");

        expect(wrapper.vm.departmentsToFilter).to.be.an("array");
        expect(wrapper.vm.departmentsToFilter).to.have.lengthOf(2);
        expect(wrapper.vm.departmentsToFilter[0].name).to.be.equal("Gemis");
        expect(wrapper.vm.departmentsToFilter[0].fields.status).to.be.equal("sta_gemis");
        expect(wrapper.vm.departmentsToFilter[0].layerIds.offen).to.be.equal("geomarker_gemis");

        expect(wrapper.vm.statusAllOrOpen).to.be.true;
        expect(wrapper.vm.statusAllOrInactive).to.be.false;
        expect(wrapper.vm.statusAllOrClosed).to.be.false;

        expect(wrapper.vm.relevantLayerIdsForFilterSelection).to.be.an("array");
        expect(wrapper.vm.relevantLayerIdsForFilterSelection).to.have.lengthOf(2);
        expect(wrapper.vm.relevantLayerIdsForFilterSelection).to.deep.equal(["geomarker_gemis", "geomarker_hh_sib"]);
    });

    it("should filter dates correctly", () => {
        const filterValue = {
            from: "2025-06-01",
            to: "2025-06-30"
        };

        expect(wrapper.vm.filterByDate(filterValue, "2025-06-12T08:23:39")).to.be.true;
        expect(wrapper.vm.filterByDate(filterValue, "2024-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, "2025-07-12T08:23:39")).to.be.false;

        filterValue.from = "";

        expect(wrapper.vm.filterByDate(filterValue, "2025-06-12T08:23:39")).to.be.true;
        expect(wrapper.vm.filterByDate(filterValue, "2024-06-12T08:23:39")).to.be.true;
        expect(wrapper.vm.filterByDate(filterValue, "2025-07-12T08:23:39")).to.be.false;

        filterValue.from = "2025-06-01";
        filterValue.to = "";

        expect(wrapper.vm.filterByDate(filterValue, "2025-06-12T08:23:39")).to.be.true;
        expect(wrapper.vm.filterByDate(filterValue, "2024-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, "2025-07-12T08:23:39")).to.be.true;

        filterValue.from = "";
        filterValue.to = "";

        expect(wrapper.vm.filterByDate(filterValue, "2025-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, "2024-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, "2025-07-12T08:23:39")).to.be.false;

        // insert trash
        expect(wrapper.vm.filterByDate(null, "2025-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate({}, "2024-06-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate("", "2025-07-12T08:23:39")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, "")).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, null)).to.be.false;
        expect(wrapper.vm.filterByDate(filterValue, {})).to.be.false;
    });

    it("should filter categories correctly", async () => {
        mockedFilterSelections.categorySelected = [wrapper.vm.categoryOptions[0]];

        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureA.getId());

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.categorySelected = [wrapper.vm.categoryOptions[2]];
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(0);

        // Reset to default value
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.categorySelected = [];
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(2);
    });

    it("should filter descriptions correctly", async () => {
        mockedFilterSelections.filterValueDescr = "hinweis";

        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureB.getId());

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueDescr = "abc";
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(0);

        // Reset to default value
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueDescr = "";
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(2);
    });

    it("should filter sources correctly", async () => {
        mockedFilterSelections.filterValueSource = "rce";

        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureA.getId());

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueSource = "abc";
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(0);

        // Reset to default value
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueSource = "";
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(2);
    });

    it("should filter mixed filters correctly", async () => {
        mockedFilterSelections.filterValueSource = " rce";
        mockedFilterSelections.categorySelected = [wrapper.vm.categoryOptions[0]];

        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureA.getId());

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueSource = "quelle   ";
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(0);

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.categorySelected = [wrapper.vm.categoryOptions[1]];
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureB.getId());

        // Reset to default value
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.filterValueSource = "";
        mockedFilterSelections.categorySelected = [];
        await wrapper.vm.applyAttributeFilters();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(2);
    });

    it("should filter geometry correctly", async () => {
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.geom = new Polygon([[[0, 0], [2, 0], [2, 2], [0, 0]]]);

        await wrapper.vm.applyGeomFilter();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(1);
        expect(wrapper.vm.allFilteredFeatures[0].getId()).to.equal(mockFeatureA.getId());

        // Reset
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.geom = new Polygon([[[10, 10], [20, 10], [20, 20], [10, 10]]]);
        await wrapper.vm.applyGeomFilter();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(0);

        // Reset to default value
        wrapper.vm.allFilteredFeatures = [mockFeatureA, mockFeatureB];
        mockedFilterSelections.geom = null;
        await wrapper.vm.applyGeomFilter();
        expect(wrapper.vm.allFilteredFeatures).to.have.lengthOf(2);
    });
});
