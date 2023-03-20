import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import trafficCountDownloads from "../../../components/TrafficCountDownloads.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/trafficCount/components/TrafficCountDownloads.vue", () => {
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
        wrapper = shallowMount(trafficCountDownloads, {
            propsData: {
                currentTabId: "infos",
                api: dummyApi,
                thingId: 5508,
                meansOfTransport: "Anzahl_Fahrraeder",
                holidays: [
                    "newYearsDay",
                    "goodFriday",
                    "easterSunday",
                    "easterMonday",
                    "laborDay",
                    "ascensionDay",
                    "pentecostSunday",
                    "pentecostMonday",
                    "germanUnityDay",
                    "reformationDay",
                    "christmasEve",
                    "christmasDay",
                    "secondDayOfChristmas",
                    "newYearsEve"
                ],
                downloadUrl: false
            },
            localVue
        });
    });

    describe("prepareDataForDownload", function () {
        it("should return the prepared data for the csv download", function () {
            const meansOfTransport = "Anzahl_Kfz",
                obj = {
                    "2020-06-23 00:00:01": 0.16,
                    "2020-06-23 00:15:01": 0.07,
                    "2020-06-23 00:30:01": 0.13,
                    "2020-06-23 00:45:01": 0.15
                },
                objAnzahlSV = {
                    "2020-06-23 00:00:01": 0.06,
                    "2020-06-23 00:15:01": 0.05,
                    "2020-06-23 00:30:01": 0.03,
                    "2020-06-23 00:45:01": 0.05
                },
                dataMin = wrapper.vm.prepareDataForDownload(meansOfTransport, obj, objAnzahlSV, "15-Min", wrapper.vm.holidays),
                dataHour = wrapper.vm.prepareDataForDownload(meansOfTransport, obj, objAnzahlSV, "1-Stunde", wrapper.vm.holidays),
                dataDay = wrapper.vm.prepareDataForDownload(meansOfTransport, obj, objAnzahlSV, "1-Tag", wrapper.vm.holidays),
                dataWeek = wrapper.vm.prepareDataForDownload(meansOfTransport, obj, objAnzahlSV, "1-Woche", wrapper.vm.holidays);

            expect(dataMin[0]).to.have.all.keys("Datum", "Uhrzeit von", "Anzahl KFZ", "Anzahl SV", "Feiertag");
            expect(dataMin[0].Datum).to.equal("2020-06-23");
            expect(dataMin[1]["Uhrzeit von"]).to.equal("00:15");
            expect(dataMin[1].Feiertag).to.equal("");
            expect(dataMin[2]["Anzahl KFZ"]).to.equal(0.13);
            expect(dataMin[3]["Anzahl SV"]).to.equal(0.05);

            expect(dataHour[0].Datum).to.equal("2020-06-23");
            expect(dataHour[1]["Uhrzeit von"]).to.equal("00:15");
            expect(dataHour[1].Feiertag).to.equal("");
            expect(dataHour[2]["Anzahl KFZ"]).to.equal(0.13);
            expect(dataHour[3]["Anzahl SV"]).to.equal(0.05);

            expect(dataDay[0]).to.have.all.keys("Datum", "Anzahl KFZ", "Anzahl SV", "Feiertag");
            expect(dataDay[0].Datum).to.equal("2020-06-23");
            expect(dataDay[2]["Anzahl KFZ"]).to.equal(0.13);
            expect(dataDay[3]["Anzahl SV"]).to.equal(0.05);

            expect(dataWeek[0]).to.have.all.keys("Kalenderwoche ab", "Anzahl KFZ", "Anzahl SV", "Feiertag");
            expect(dataWeek[0]["Kalenderwoche ab"]).to.equal("2020-06-23");
            expect(dataWeek[2]["Anzahl KFZ"]).to.equal(0.13);
            expect(dataWeek[3]["Anzahl SV"]).to.equal(0.05);
        });
    });
});
