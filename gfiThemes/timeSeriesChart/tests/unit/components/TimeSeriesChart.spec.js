import {vi} from "vitest";
import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";

vi.mock("chart.js", async () => {
    const actual = await vi.importActual("chart.js");

    return {
        ...actual,
        Tooltip: {
            ...actual.Tooltip,
            positioners: {
                ...actual.Tooltip?.positioners || {}
            }
        }
    };
});

import TimeSeriesChart from "../../../components/TimeSeriesChart.vue";

describe("addons/gfiThemes/timeSeriesChart/components/TimeSeriesChart.vue", () => {
    let store, wrapper, themeTabs;

    beforeEach(() => {
        themeTabs = [
            {
                "tabId": 1,
                "title": "Stammdaten",
                "type": "gfiAttributes"
            },
            {
                "tabId": 2,
                "title": "Statistik",
                "type": "timeline",
                "oafParams": {
                    "url": "https://some/oaf/api",
                    "collection": "grundwassermessstellen",
                    "filterCRS": "http://www.opengis.net/def/crs/EPSG/0/25832"
                },
                "disclaimer": {
                    "text": "Ungeprüfte Rohdaten. Bitte beachten Sie den Haftungsausschluss",
                    "data": "./disclaimer.html"
                },
                "chartThemes": [
                    {
                        "chartId": 1,
                        "chartTitle": "Wasserstand",
                        "queryParams": {
                            "properties": [
                                "gid",
                                "datum_as_date",
                                "messstellennummer",
                                "wasserstand_mnhn",
                                "wasserstand_mugok",
                                "klassifikation_gwstand"
                            ],
                            "literalFilters": {
                                "queryAttribute": "messstellennummer",
                                "sortBy": "datum_as_date"
                            }
                        },
                        "chartParams": {
                            "xAxis": "datum_as_date",
                            "yAxisLeft": "wasserstand_mnhn",
                            "yAxisRight": "wasserstand_mugok",
                            "yAxisRightEquation": ""
                        },
                        "tableParams": [
                            "datum_as_date",
                            "wasserstand_mnhn",
                            "wasserstand_mugok",
                            "klassifikation_gwstand"
                        ],
                        "csvParams": []
                    }
                ]
            }
        ];

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        TimeSeriesChart: {
                            namespaced: true,
                            actions: {
                                queryOaf: sinon.spy(),
                                queryOafSchema: sinon.spy(),
                                increaseSidebarWidth: sinon.stub(),
                                resetSidebarWidth: sinon.stub()
                            },
                            getters: {
                                oafSchema: () => null,
                                menuWidthOnStart: () => "40%"
                            },
                            mutations: {
                                setMenuWidthSelectedForGfi: sinon.stub()
                            }
                        }
                    }
                }
            },
            getters: {
                isMobile: () => false
            }
        });

        wrapper = shallowMount(TimeSeriesChart, {
            global: {
                plugins: [store]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getTheme: function () {
                        return {
                            params: {
                                themeTabs
                            }
                        };
                    },
                    getAttributesToShow: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                        };
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the TimeSeriesChart theme", () => {
        expect(wrapper.find(".time-series-chart-theme").exists()).to.be.true;
    });

    it("should render two tabs", () => {
        const tabContainer = wrapper.findComponent({name: "TabContainer"});

        expect(tabContainer.exists()).to.be.true;
        expect(tabContainer.props("tabs").length).to.equal(2);
        expect(tabContainer.props("tabs")[0].label).to.equal("Stammdaten");
        expect(tabContainer.props("tabs")[1].label).to.equal("Statistik");
    });

    it("should provide the right props to each tab content", () => {
        const tabContainer = wrapper.findComponent({name: "TabContainer"}),
            tabs = tabContainer.props("tabs");

        expect(tabs[0].propsForTabContent).to.deep.equal({
            attributes: {}
        });

        expect(tabs[1].propsForTabContent).to.deep.equal({
            allAttributes: {},
            params: themeTabs[1]
        });
    });
});
