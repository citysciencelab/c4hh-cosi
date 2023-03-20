import Vuex from "vuex";
import {
    config,
    mount,
    createLocalVue
} from "@vue/test-utils";
import {
    expect
} from "chai";
import Vuetify from "vuetify";
import Vue from "vue";
import sinon from "sinon";
import Dipas from "../../../components/Dipas.vue";
import DipasStore from "../../../store/index";
import crs from "@masterportal/masterportalapi/src/crs";
import GeoJSON from "ol/format/GeoJSON";

config.mocks.$t = key => key;

const localVue = createLocalVue();

Vue.use(Vuetify);
localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

before(() => {
    const namedProjections = [
        ["EPSG:31467", "+title=Bessel/GauÃŸ-KrÃ¼ger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/GauÃŸ-KrÃ¼ger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ];

    crs.registerProjections(namedProjections);
    i18next.init({
        lng: "cimode",
        debug: false
    });
});

describe("Dipas.vue", () => {
    let store, vuetify, features,
        wrapper = null;

    const factory = {
        getMount: () => {
            return mount(Dipas, {
                store,
                localVue,
                vuetify
            });
        }
    };

    /**
     * initializes some required data for the component to render and work
     * @returns {void}
     */
    async function initialize () {
        const featureCollection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    9.809107774930826,
                                    53.474231389244096
                                ],
                                [
                                    9.85362494532307,
                                    53.443859412098085
                                ],
                                [
                                    9.874256576873353,
                                    53.439809705258845
                                ],
                                [
                                    9.92505999838155,
                                    53.43876114132604
                                ],
                                [
                                    9.977765584184882,
                                    53.437390003741044
                                ],
                                [
                                    10.011357738149698,
                                    53.44976329695383
                                ],
                                [
                                    9.985009536297651,
                                    53.47650782709502
                                ],
                                [
                                    9.9635865790036,
                                    53.481153802914804
                                ],
                                [
                                    9.901003949673758,
                                    53.48563763480332
                                ],
                                [
                                    9.85325800160902,
                                    53.490839846263256
                                ],
                                [
                                    9.815259769690767,
                                    53.48083069739721
                                ],
                                [
                                    9.809107774930826,
                                    53.474231389244096
                                ]
                            ]
                        ]
                    },
                    "properties": {
                        "id": "clever-leitsystem",
                        "nameFull": "CLEVER Cities Korridorleitsystem",
                        "description": "Beschreibung",
                        "dateStart": "2021-05-01T00:00:00Z",
                        "dateEnd": "2021-06-27T00:00:00Z",
                        "dipasPhase": "phasemix",
                        "website": "https://clever-leitsystem.beteiligung.hamburg/dipas/#",
                        "owner": "Bezirksamt Harburg",
                        "publisher": "",
                        "standardCategories": {
                            "3": "Sonstiges",
                            "1": "Wunschstandort",
                            "2": "CLEVER Projekt"
                        },
                        "projectContributionType": [],
                        "referenceSystem": "4326",
                        "hasParticipatoryText": [
                            "12",
                            "8",
                            "23",
                            "18",
                            "16",
                            "14",
                            "13",
                            "11",
                            "20",
                            "19",
                            "17",
                            "15",
                            "22",
                            "21",
                            "10",
                            "9",
                            "157",
                            "158",
                            "159"
                        ],
                        "dipasCategoriesCluster": null
                    }
                }
            ]
        };

        features = new GeoJSON().readFeatures(featureCollection);
        await wrapper.setData({
            projectsFeatureCollection: wrapper.vm.transformFeatures(features),
            contributions: {
                "clever-leitsystem": {
                    "index": 0,
                    "colors": {
                        "Wunschstandort": "rgba(255, 255, 255, 0.75)",
                        "CLEVER Projekt": "rgba(182, 178, 179, 0.8333333333333334)",
                        "Sonstiges": "rgba(108, 100, 103, 0.9166666666666666)"
                    },
                    "rainbowColors": {
                        "Wunschstandort": "rgb(110, 64, 170)",
                        "CLEVER Projekt": "rgb(255, 94, 99)",
                        "Sonstiges": "rgb(175, 240, 91)"
                    },
                    "features": [],
                    "loading": false
                }
            },
            projectsActive: {
                "clever-leitsystem": {
                    layer: false,
                    contributions: false,
                    heatmap: false
                }
            },
            projectsColors: ["rgb(35, 23, 27)"]
        });
    }

    beforeEach(async () => {
        vuetify = new Vuetify();

        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Language: {
                    namespaced: true,
                    getters: {
                        currentLocale: () => "de-DE"
                    }
                },
                Tools: {
                    namespaced: true,
                    modules: {
                        Dipas: DipasStore,
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                isFeatureDisabled: () => sinon.stub(),
                                isFeatureActive: () => sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        ol2DMap: () => ({
                            getLayers: () => ({getArray: sinon.stub()})
                        }),
                        projectionCode: () => "EPSG:25832"
                    }
                }
            },
            getters: {
                isDefaultStyle: () => true,
                uiStyle: () => true,
                mobile: () => sinon.stub()
            }
        });
        store.commit("Tools/Dipas/setActive", true);
        sinon.stub(Dipas.methods, "addLayer");
        sinon.stub(Dipas.methods, "initialize");
        sinon.stub(Dipas.methods, "scrollPosition");
        sinon.stub(Dipas.methods, "changeProjectVisibility");
        sinon.stub(Dipas.methods, "changeContributionVisibility");
        sinon.stub(Dipas.methods, "changeHeatmapVisibility");
        wrapper = factory.getMount();
        initialize();
        await wrapper.vm.$nextTick();
    });

    afterEach(() => {
        wrapper.destroy();
        sinon.restore();
    });

    it("renders Component", () => {
        expect(wrapper.find("#dipas").exists()).to.be.true;
        expect(wrapper.find("#dipas").html()).to.not.be.empty;
        expect(wrapper.find(".v-list").exists()).to.be.true;
    });

    it("renders list item for project", () => {
        const projects = wrapper.findAll(".v-list-group"),
            project = projects.wrappers[0];

        expect(projects.length).to.eql(1);
        expect(project.find(".v-list-item__title").text()).to.eql("CLEVER Cities Korridorleitsystem");
        expect(project.find(".v-list-item__subtitle").text()).to.eql("1.5.2021 - 27.6.2021");
        expect(project.find(".v-btn").attributes().style).to.eql("background-color: rgb(35, 23, 27); border-color: rgb(35, 23, 27);");
        expect(project.find(".v-list-group__items").exists()).to.be.false;
    });

    it("clicking on project opens and closes the detail view", async () => {
        const header = wrapper.find(".v-list-group__header");

        expect(wrapper.find(".v-list-group__items").exists()).to.be.false;
        header.trigger("click");
        await wrapper.vm.$nextTick();
        expect(wrapper.find(".v-list-group__items").exists()).to.be.true;
    });

    it("toggling project layer updates the projects icon to reflect changes on the map", async () => {
        const project = wrapper.find(".v-list-group"),
            header = wrapper.find(".v-list-group__header");

        expect(project.find("i").attributes().class).not.contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).contains("mdi-cancel");

        header.trigger("click");
        await wrapper.vm.$nextTick();

        project.findAllComponents({name: "v-switch"}).wrappers[0].vm.$emit("change", true);
        await wrapper.vm.$nextTick();

        expect(project.find("i").attributes().class).contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).not.contains("mdi-cancel");
    });

    it("toggling contribution layer updates the projects icon to reflect changes on the map", async () => {
        const project = wrapper.find(".v-list-group"),
            header = wrapper.find(".v-list-group__header");

        expect(project.find("i").attributes().class).not.contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).contains("mdi-cancel");

        header.trigger("click");
        await wrapper.vm.$nextTick();

        project.findAllComponents({name: "v-switch"}).wrappers[1].vm.$emit("change", true);
        await wrapper.vm.$nextTick();

        expect(project.find("i").attributes().class).contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).not.contains("mdi-cancel");
    });

    it("toggling heatmap layer updates the projects icon to reflect changes on the map", async () => {
        const project = wrapper.find(".v-list-group"),
            header = wrapper.find(".v-list-group__header");

        expect(project.find("i").attributes().class).not.contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).contains("mdi-cancel");

        header.trigger("click");
        await wrapper.vm.$nextTick();

        project.findAllComponents({name: "v-switch"}).wrappers[2].vm.$emit("change", true);
        await wrapper.vm.$nextTick();

        expect(project.find("i").attributes().class).contains("mdi-checkbox-marked-circle");
        expect(project.find("i").attributes().class).not.contains("mdi-cancel");
    });

    it("toggling styling changes selectedStyling", () => {
        const inputs = wrapper.find("#radio").findAll("input");

        expect(wrapper.vm.selectedStyling).to.be.null;
        inputs.wrappers[0].trigger("click");
        expect(wrapper.vm.selectedStyling).to.eql("project");
        inputs.wrappers[1].trigger("click");
        expect(wrapper.vm.selectedStyling).to.eql("category");
        inputs.wrappers[2].trigger("click");
        expect(wrapper.vm.selectedStyling).to.eql("categoryRainbow");
        inputs.wrappers[3].trigger("click");
        expect(wrapper.vm.selectedStyling).to.eql("voting");
    });

    it("download geoJSON button is disabled if there are no DIPAS layers on the map", async () => {
        const button = wrapper.find("#download-geojson");

        expect(button.attributes().disabled).to.eql("disabled");
    });
});
