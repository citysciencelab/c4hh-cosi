import Vuex from "vuex";
import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import TableCell from "../../../components/TableCell.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";

config.mocks.$t = key => key;
Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe("addons/cosi/Dashboard/components/TableCell.vue", () => {
    before(() => {
        global.ShadowRoot = () => "";
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            updateSize: () => sinon.stub()
        };

        mapCollection.addMap(map, "2D");
    });

    let store, vuetify, wrapper;

    const factory = {
        getMount: (mountFn = mount) => {
            return mountFn(TableCell, {
                propsData: {
                    item: {
                        "44001": {
                            "kategorie": "Bevölkerung insgesamt",
                            "group": "Bevölkerung",
                            "stat_gebiet": "44001",
                            "stadtteil": "Hoheluft-Ost",
                            "jahr_2013": "1984",
                            "jahr_2014": "2003",
                            "jahr_2015": "2040",
                            "jahr_2016": "2076",
                            "jahr_2017": "2089",
                            "jahr_2018": "2167",
                            "jahr_2019": "2172",
                            "jahr_2020": "2266"
                        },
                        "expanded": false,
                        "years": [
                            2020,
                            2019,
                            2018,
                            2017,
                            2016,
                            2015,
                            2014,
                            2013
                        ]
                    },
                    header: {
                        value: "44001",
                        minimized: false,
                        text: "44001"
                    },
                    currentTimestamp: 2020,
                    timestampPrefix: "jahr_",
                    currentLocale: "de",
                    tooltipOffset: 607.2
                },
                store,
                localVue,
                vuetify,
                sync: false
            });
        },
        initialize: async (mountFn = mount) => {
            wrapper = factory.getMount(mountFn);
        }
    };

    beforeEach(async () => {
        vuetify = new Vuetify();
        store = new Vuex.Store({
            namespaced: true
        });
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper) {
            wrapper.destroy();
        }
    });

    it("should render Component", async () => {
        await factory.initialize(shallowMount);
        expect(wrapper.findAll("span")).to.have.length(1);
        expect(wrapper.find("span").text()).to.be.equal("44001 (2020)");
    });
});
