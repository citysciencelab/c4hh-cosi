import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import TabGraphics from "../../../components/TabGraphics.vue";

describe("addons/gfiThemes/waterStatistics/components/TabGraphics.vue", () => {
    let store, wrapper, queryOaf, params;

    beforeEach(() => {
        queryOaf = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        WaterStatistics: {
                            namespaced: true,
                            actions: {
                                queryOaf
                            }
                        }
                    }
                }
            }
        });

        params = {
            oafParams: {
                url: "https://some/oaf/api",
                collection: "grundwassermessstellen",
                filterCRS: "http://www.opengis.net/def/crs/EPSG/0/25832"
            },
            chartThemes: [
                {
                    chartId: 1,
                    chartTitle: "Wasserstand",
                    queryParams: {
                        properties: [
                            "gid",
                            "datum_as_date",
                            "messstellennummer",
                            "wasserstand_mnhn",
                            "wasserstand_mugok",
                            "klassifikation_gwstand"
                        ],
                        literalFilters: {
                            queryAttribute: "messstellennummer",
                            sortBy: "datum_as_date"
                        }
                    },
                    chartParams: {
                        xAxis: "datum_as_date",
                        yAxisLeft: "wasserstand_mnhn",
                        yAxisRight: "wasserstand_mugok",
                        yAxisRightEquation: ""
                    }
                }
            ]
        };

        wrapper = shallowMount(TabGraphics, {
            global: {
                plugins: [store]
            },
            props: {
                params,
                allAttributes: {}
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        sinon.restore();
    });

    it("should render the TabGraphics component", () => {
        expect(wrapper.find("#TabGraphics").exists()).to.be.true;
    });

    it("should call queryOaf with the right params when attributes change", async () => {
        await wrapper.setProps({
            allAttributes: {
                messstellennummer: "12345"
            }
        });

        expect(queryOaf.getCall(1).args[1]).to.deep.equal({
            params: {
                url: "https://some/oaf/api",
                collections: "grundwassermessstellen",
                queryField: "messstellennummer",
                queryProperties: [
                    "gid",
                    "datum_as_date",
                    "messstellennummer",
                    "wasserstand_mnhn",
                    "wasserstand_mugok",
                    "klassifikation_gwstand"
                ],
                literalFilters: {
                    sortby: "datum_as_date"
                },
                queryValue: "12345",
                queryCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                dateField: "datum_as_date"
            }
        });
    });
});
