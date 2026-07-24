import {createStore} from "vuex";
import {expect} from "chai";
import dayjs from "dayjs";
import {shallowMount} from "@vue/test-utils";
import sinon from "sinon";

import SensorTheme from "@modules/getFeatureInfo/themes/sensor/components/SensorTheme.vue";
import SensorThemeData from "@modules/getFeatureInfo/themes/sensor/components/SensorThemeData.vue";
import SensorThemeBarChart from "@modules/getFeatureInfo/themes/sensor/components/SensorThemeBarChart.vue";


describe("src/modules/getFeatureInfo/themes/senor/components/SensorTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(SensorTheme, {
            global: {
                plugins: [createStore({
                    namespaced: true,
                    getters: {
                        layerConfigById: () => sinon.stub()
                    }
                })]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                            dataStreamId: "123",
                            name: "Name",
                            description: "Beschreibung",
                            ownerThing: "Eigentümer"
                        };
                    },
                    getTheme: function () {
                        return {
                            name: "sensor",
                            params: {
                                charts: {
                                    values: ["available", "charging", "outoforder"]
                                }
                            }
                        };
                    },
                    getMimeType: () => "text/xml",
                    getLayerId: function () {
                        return 456;
                    }
                }
            }
        });
    });

    it("should return a date before 3 month + 1  week as buffer", () => {
        const periodLength = 3,
            periodUnit = "month";

        expect(wrapper.vm.createFilterDate(periodLength, periodUnit)).equals(
            dayjs().subtract(periodLength, periodUnit).subtract(1, "week").format("YYYY-MM-DDTHH:mm:ss.sss") + "Z"
        );
    });

    it("should return a filter for the dataStreamId", () => {
        expect(wrapper.vm.createFilterDataStream("1234")).equals("@iot.id%20eq%201234");
        expect(wrapper.vm.createFilterDataStream("1111 | 9999")).equals("@iot.id%20eq%201111%20or%20@iot.id%20eq%209999");
    });

    it("should return periodLength 3 and periodUnit 'month' by default", () => {
        expect(wrapper.vm.periodLength).equals(3);
        expect(wrapper.vm.periodUnit).equals("month");
    });

    it("should return periodLength 3 and periodUnit 'month' for incorrect input data", () => {
        const wrapper1 = shallowMount(SensorTheme, {
            global: {
                plugins: [createStore({
                    namespaced: true,
                    getters: {
                        layerConfigById: () => sinon.stub()
                    }
                })]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                            dataStreamId: "123",
                            name: "Name",
                            description: "Beschreibung",
                            ownerThing: "Eigentümer"
                        };
                    },
                    getMimeType: () => "text/xml",
                    getTheme: function () {
                        return {
                            name: "sensor",
                            params: {
                                historicalData: {
                                    periodLength: "10",
                                    periodUnit: "abc"
                                },
                                charts: {
                                    values: ["available", "charging", "outoforder"]
                                }
                            }
                        };
                    },
                    getLayerId: function () {
                        return 456;
                    }
                }
            }
        });

        expect(wrapper1.vm.periodLength).equals(3);
        expect(wrapper1.vm.periodUnit).equals("month");
    });

    it("should return periodLength 10 and periodUnit 'year' for these configured data", () => {
        const wrapper2 = shallowMount(SensorTheme, {
            global: {
                plugins: [createStore({
                    namespaced: true,
                    getters: {
                        layerConfigById: () => sinon.stub()
                    }
                })]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                            dataStreamId: "123",
                            name: "Name",
                            description: "Beschreibung",
                            ownerThing: "Eigentümer"
                        };
                    },
                    getMimeType: () => "text/xml",
                    getTheme: function () {
                        return {
                            name: "sensor",
                            params: {
                                historicalData: {
                                    periodLength: 10,
                                    periodUnit: "year"
                                },
                                charts: {
                                    values: ["available", "charging", "outoforder"]
                                }
                            }
                        };
                    },
                    getLayerId: function () {
                        return 456;
                    }
                }
            }
        });

        expect(wrapper2.vm.periodLength).equals(10);
        expect(wrapper2.vm.periodUnit).equals("year");
    });

    it("should render div with class 'gfi-theme-sensor'", () => {
        expect(wrapper.find("div").exists()).to.be.true;
        expect(wrapper.find("div").classes("gfi-theme-sensor")).to.be.true;
    });

    it("should render div > div with class 'sensor-text' if header exists", () => {
        expect(wrapper.find("div > div").exists()).to.be.true;
        expect(wrapper.findAll("div > div")[1].classes("sensor-text")).to.be.true;
    });

    it("should render the header", () => {
        expect(wrapper.findAll("div > div > strong")[0].text()).equals("common:modules.getFeatureInfo.themes.sensor.sensor.header.name: Name");
        expect(wrapper.findAll("div > div > strong")[1].text()).equals("common:modules.getFeatureInfo.themes.sensor.sensor.header.description: Beschreibung");
        expect(wrapper.findAll("div > div > strong")[2].text()).equals("common:modules.getFeatureInfo.themes.sensor.sensor.header.ownerThing: Eigentümer");
    });

    it("should render a menulist (div > div > ul) with class 'nav nav-tabs'", () => {
        expect(wrapper.find("div > div > ul").exists()).to.be.true;
        expect(wrapper.find("div > div > ul").classes()).to.includes("nav", "nav-tabs");
    });

    it("should render the four tabs in menulist for chart values configured as array", () => {
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        expect(navTabs.length).equals(4);
        expect(navTabs[0].props("label")).equals("common:modules.getFeatureInfo.themes.sensor.sensor.dataName");
        expect(navTabs[1].props("label")).equals("available");
        expect(navTabs[2].props("label")).equals("charging");
        expect(navTabs[3].props("label")).equals("outoforder");
    });

    it("should render the 4 tabs in menulist for chart values and data configured as object", () => {
        const wrapper1 = shallowMount(SensorTheme, {
            global: {
                plugins: [createStore({
                    namespaced: true,
                    getters: {
                        layerConfigById: () => sinon.stub()
                    }
                })]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                            dataStreamId: "123",
                            name: "Name",
                            description: "Beschreibung",
                            ownerThing: "Eigentümer"
                        };
                    },
                    getMimeType: () => "text/xml",
                    getTheme: function () {
                        return {
                            name: "sensor",
                            params: {
                                data: {
                                    name: "Daten"
                                },
                                charts: {
                                    values: {
                                        available: {
                                            title: "Verfügbar",
                                            color: "rgba(0, 220, 0, 1)"
                                        },
                                        charging: {
                                            title: "Auslastung",
                                            color: "rgba(220, 0, 0, 1)"
                                        },
                                        outoforder: {
                                            title: "Außer Betrieb",
                                            color: "rgba(175, 175, 175, 1)"
                                        }
                                    }
                                }
                            }
                        };
                    },
                    getLayerId: function () {
                        return 456;
                    }
                }
            }
        });

        const navTabs = wrapper1.findAllComponents({name: "NavTab"});

        expect(navTabs.length).equals(4);
        expect(navTabs[0].props("label")).equals("Daten");
        expect(navTabs[1].props("label")).equals("Verfügbar");
        expect(navTabs[2].props("label")).equals("Auslastung");
        expect(navTabs[3].props("label")).equals("Außer Betrieb");
    });

    it("should render 4 components => 1 SensorThemeData and 3 SensorThemeBarChart", () => {
        expect(wrapper.findAllComponents(SensorThemeData).length).equals(1);
        expect(wrapper.findAllComponents(SensorThemeBarChart).length).equals(3);
    });

    it("should pass active=true only to the data tab by default", () => {
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        expect(navTabs[0].props("active")).to.be.true;
        expect(navTabs[1].props("active")).to.be.false;
        expect(navTabs[2].props("active")).to.be.false;
        expect(navTabs[3].props("active")).to.be.false;
    });

    it("should pass disabled=true to chart tabs when no historical data is available", () => {
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        expect(navTabs[0].props("disabled")).to.be.false;
        expect(navTabs[1].props("disabled")).to.be.true;
        expect(navTabs[2].props("disabled")).to.be.true;
        expect(navTabs[3].props("disabled")).to.be.true;
    });

    it("should pass disabled=false to chart tabs when historical data is loaded", async () => {
        await wrapper.setData({processedHistoricalDataByWeekday: [1, 2, 3]});
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        expect(navTabs[1].props("disabled")).to.be.false;
        expect(navTabs[2].props("disabled")).to.be.false;
        expect(navTabs[3].props("disabled")).to.be.false;
    });

    it("should update activeTab to the chart index when a chart tab interaction is called", async () => {
        await wrapper.setData({processedHistoricalDataByWeekday: [1, 2, 3]});
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        navTabs[2].props("interaction")();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeTab).equals("1");
    });

    it("should set activeTab to 'data' when data tab interaction is called", async () => {
        await wrapper.setData({activeTab: "1"});
        const navTabs = wrapper.findAllComponents({name: "NavTab"});

        navTabs[0].props("interaction")();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeTab).equals("data");
    });
});
