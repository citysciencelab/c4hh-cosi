import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import trafficCountYear from "../../../components/TrafficCountYear.vue";
import {addMissingDataYear} from "../../../utils/addMissingData.js";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/trafficCount/components/TrafficCountYear.vue", () => {
    let wrapper;
    const dummyApi = {
        updateDataset: (thingId, meansOfTransport, timeSettings, onupdate) => {
            onupdate([
                {
                    fahrrad: {
                        "2020-07-20 00:00:01": 114,
                        "2020-07-27 00:00:01": 202,
                        "2020-08-03 00:00:01": 179
                    }
                }
            ]);
        }
    };

    beforeEach(() => {
        wrapper = shallowMount(trafficCountYear, {
            propsData: {
                api: dummyApi,
                thingId: 5508,
                meansOfTransport: "Anzahl_Fahrraeder",
                reset: true,
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
                checkGurlittInsel: false
            },
            localVue
        });
    });

    describe("yearDatepickerValueChanged", () => {
        it("should get the parsed api data", () => {
            const dates = [
                    "2020-07-20T22:00:00.000Z"
                ],
                data = [
                    {
                        fahrrad: addMissingDataYear("2020", {
                            "2020-07-20 00:00:00": 114,
                            "2020-07-27 00:00:00": 202,
                            "2020-08-03 00:00:00": 179
                        })
                    }
                ];

            wrapper.vm.yearDatepickerValueChanged(dates);

            expect(wrapper.vm.apiData).to.deep.equal(data);
        });
    });
});
