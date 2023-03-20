import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import trafficCountFooter from "../../../components/TrafficCountFooter.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/trafficCount/components/trafficCountFooter.vue", () => {
    let wrapper;
    const dummyApi = {
        updateTotal: (thingId, meansOfTransport, onupdate) => {
            onupdate("2020-03-17", "foo");
        },
        updateYear: (thingId, meansOfTransport, year, onupdate) => {
            onupdate("2020", "bar");
        },
        updateDay: (thingId, meansOfTransport, date, onupdate) => {
            onupdate("2020-02-17", "baz");
        },
        updateHighestWorkloadDay: (thingId, meansOfTransport, year, onupdate) => {
            onupdate("2020-01-17", "qox");
        },
        updateHighestWorkloadWeek: (thingId, meansOfTransport, year, onupdate) => {
            onupdate("calendarWeek", "quix");
        },
        updateHighestWorkloadMonth: (thingId, meansOfTransport, year, onupdate) => {
            onupdate("month", "foobar");
        },
        subscribeLastUpdate: (thingId, meansOfTransport, onupdate) => {
            onupdate("2020-03-22T00:00:00.000Z");
        },
        downloadData: (thingId, meansOfTransport, timeSettings, onsuccess) => {
            onsuccess({
                title: "title",
                data: []
            });
        }
    };

    beforeEach(() => {
        wrapper = shallowMount(trafficCountFooter, {
            propsData: {
                currentTabId: "infos",
                api: dummyApi,
                thingId: 5508,
                meansOfTransport: "Anzahl_Fahrraeder"
            },
            localVue
        });
    });

    describe("setFooterLastUpdate", function () {
        it("should return the last update time", function () {

            expect(wrapper.vm.lastUpdate).to.equal("22.03.2020, 00:00:00");
        });
    });

    describe("updateFooter", function () {
        wrapper = shallowMount(trafficCountFooter, {
            propsData: {
                currentTabId: "day",
                api: dummyApi,
                thingId: 5508,
                meansOfTransport: "Anzahl_Fahrraeder"
            },
            localVue
        });

        it("should return the last update time", function () {
            expect(wrapper.vm.lastUpdate).to.equal("22.03.2020, 00:00:00");
        });
    });
});
