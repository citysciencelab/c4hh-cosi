import {createStore} from "vuex";
import {shallowMount, config} from "@vue/test-utils";
import {expect} from "chai";
import dayjs from "dayjs";
import TrafficCountHeader from "../../../components/TrafficCountHeader.vue";

config.global.mocks.$t = (key, options) => {
    return options ? key + ":" + JSON.stringify(options) : key;
};

describe("addons/gfiThemes/trafficCount/components/TrafficCountHeader.vue", () => {
    let wrapper,
        downloadDataCalls,
        firstDateEver;

    /**
     * Creates a mocked api recording the download requests and providing a first date.
     * @returns {Object} the mocked api
     */
    function createApiMock () {
        downloadDataCalls = [];
        return {
            downloadData: (thingId, meansOfTransport, timeSet) => {
                downloadDataCalls.push({thingId, meansOfTransport, timeSet});
            },
            getFirstDateEver: (thingId, meansOfTransport, onsuccess) => {
                if (typeof onsuccess === "function") {
                    onsuccess(firstDateEver);
                }
            }
        };
    }

    /**
     * Mounts the component with the given overriding props.
     * @param {Object} [propsOverride={}] props to override the defaults
     * @returns {Object} the mounted wrapper
     */
    function mountComponent (propsOverride = {}) {
        const store = createStore({
            modules: {
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: () => null
                    }
                }
            }
        });

        return shallowMount(TrafficCountHeader, {
            global: {
                plugins: [store]
            },
            props: {
                api: createApiMock(),
                direction: "Ost nach West",
                holidays: [],
                thingId: "123",
                downloadUrl: false,
                downloadFilename: "Anzahl_Kfz_123_Ost",
                isHeavyTrafficAvailable: false,
                isMqttLive: false,
                lastUpdate: "12.06.2026 03:00 Uhr",
                meansOfTransport: "Anzahl_Kfz",
                title: "Verkehrszählstelle 297981",
                type: "Infrarotsensor",
                ...propsOverride
            }
        });
    }

    beforeEach(() => {
        firstDateEver = "2020-01-06";
        wrapper = mountComponent();
    });

    it("getTimeRange returns ranges matching the request logic of each interval", () => {
        const today = dayjs().format("YYYY-MM-DD"),
            minRange = wrapper.vm.getTimeRange("15-Min"),
            hourRange = wrapper.vm.getTimeRange("1-Stunde"),
            dayRange = wrapper.vm.getTimeRange("1-Tag");

        expect(minRange.from.format("YYYY-MM-DD")).to.equal(dayjs().subtract(14, "day").format("YYYY-MM-DD"));
        expect(minRange.until.format("YYYY-MM-DD")).to.equal(today);
        expect(hourRange.from.format("YYYY-MM-DD")).to.equal(dayjs().subtract(60, "day").format("YYYY-MM-DD"));
        expect(dayRange.from.format("YYYY-MM-DD")).to.equal(dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"));
        expect(dayRange.until.format("YYYY-MM-DD")).to.equal(today);
    });

    it("derives the week period dynamically from the first date provided by the api", () => {
        const weekRange = wrapper.vm.getTimeRange("1-Woche");

        expect(wrapper.vm.weekFromDate).to.equal("2020-01-06");
        expect(weekRange.from.format("YYYY-MM-DD")).to.equal("2020-01-06");
        expect(wrapper.vm.getPeriodLabel("1-Woche")).to.equal("additional:modules.tools.gfi.themes.trafficCount.downloadPeriodSince:{\"year\":\"2020\"}");
    });

    it("startDownload requests the data with the normalized means of transport and matching interval", () => {
        wrapper.vm.startDownload("15-Min");

        expect(wrapper.vm.isDownloading).to.be.true;
        expect(downloadDataCalls).to.have.lengthOf(1);
        expect(downloadDataCalls[0].thingId).to.equal("123");
        expect(downloadDataCalls[0].meansOfTransport).to.equal("Anzahl_Kfz");
        expect(downloadDataCalls[0].timeSet.interval).to.equal("15-Min");
        expect(downloadDataCalls[0].timeSet.from).to.equal(dayjs().subtract(14, "day").format("YYYY-MM-DD"));
    });
});
