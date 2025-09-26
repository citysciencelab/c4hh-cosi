import Vuex from "vuex";
import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import StatsTrend from "../../../components/StatsTrend.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";

config.mocks.$t = key => key;
Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe("addons/cosi/Dashboard/components/StatsTrend.vue", () => {
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
            return mountFn(StatsTrend, {
                propsData: {
                    item: {
                        "39008": {
                            "kategorie": "Bevölkerung insgesamt",
                            "group": "Bevölkerung",
                            "stat_gebiet": "39008",
                            "stadtteil": "Lokstedt",
                            "jahr_2013": "2982",
                            "jahr_2014": "3008",
                            "jahr_2015": "3067",
                            "jahr_2016": "3132",
                            "jahr_2017": "3123",
                            "jahr_2018": "3101",
                            "jahr_2019": "3060",
                            "jahr_2020": "3205"
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
                    header: {value: "39008"},
                    currentTimestamp: 2020,
                    timestampPrefix: "jahr_",
                    currentLocale: "de",
                    tooltipOffset: 573.6
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
        expect(wrapper.findAll("span")).to.have.lengthOf(1);
        expect(wrapper.find("span").text()).to.be.equal("6,495%");
    });

    it("should compute the right parameter", async () => {
        await factory.initialize(shallowMount);
        expect(wrapper.vm.dy).to.be.equal(1.0649464422558221);
    });
});
