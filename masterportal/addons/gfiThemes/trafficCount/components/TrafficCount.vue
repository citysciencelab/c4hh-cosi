<script>
/* eslint-disable no-undef */
import axios from "axios";
import dayjs from "dayjs";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";
import {TrafficCountCache} from "../utils/trafficCountCache.js";
import {DauerzaehlstellenRadApi} from "../utils/dauerzaehlstellenRadApi.js";
import TrafficCountInfo from "./TrafficCountInfo.vue";
import TrafficCountDay from "./TrafficCountDay.vue";
import TrafficCountHeader from "./TrafficCountHeader.vue";
import TrafficCountWeek from "./TrafficCountWeek.vue";
import TrafficCountYear from "./TrafficCountYear.vue";
import convertHttpLinkToSSL from "../../../../src/shared/js/utils/convertHttpLinkToSSL.js";
import NavTab from "../../../../src/shared/modules/tabs/components/NavTab.vue";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";

export default {
    name: "TrafficCount",
    components: {
        FlatButton,
        NavTab,
        TrafficCountInfo,
        TrafficCountDay,
        TrafficCountHeader,
        TrafficCountWeek,
        TrafficCountYear
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            api: null,
            propThingId: 0,
            propMeansOfTransport: "",
            selectedTimeView: "day",
            title: "",
            type: "",
            meansOfTransport: "",
            direction: "",
            currentTabId: "info",
            keyInfo: "info",
            keyDay: "day",
            keyWeek: "week",
            keyYear: "year",
            dayCheckReset: false,
            weekCheckReset: false,
            yearCheckReset: false,
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
            checkGurlittInsel: false,
            lastDayValueSecond: undefined,
            lastUpdate: "",
            isMqttLive: true,
            statusHandler: null
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        infoLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.infoLabel");
        },

        dayLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.dayLabel");
        },

        weekLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.weekLabel");
        },

        yearLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.yearLabel");
        },

        lastupdateLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.lastupdateLabel");
        },

        typeAssoc: function () {
            return {
                Anzahl_Kfz: this.$t("additional:modules.tools.gfi.themes.trafficCount.infraredsensor"),
                Anzahl_Fahrraeder: this.$t("additional:modules.tools.gfi.themes.trafficCount.infraredsensor"),
                Anzahl_Schwerverkehr: this.$t("additional:modules.tools.gfi.themes.trafficCount.infraredsensor")
            };
        },

        meansOfTransportAssoc: function () {
            return {
                Anzahl_Kfz: this.$t("additional:modules.tools.gfi.themes.trafficCount.carLabel"),
                Anzahl_Fahrraeder: this.$t("additional:modules.tools.gfi.themes.trafficCount.bicycleLabel"),
                Anzahl_Schwerverkehr: this.$t("additional:modules.tools.gfi.themes.trafficCount.heavyTrafficLabel")
            };
        },

        idLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.idLabel");
        },

        typeLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.typeLabel");
        },

        meansOfTransportLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.meansOfTransportLabel");
        },

        directionLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.directionLabel");
        },

        downloadUrl: function () {
            if (this.checkGurlittInsel && this.feature?.getProperties()?.link_download) {
                return convertHttpLinkToSSL(this.feature.getProperties().link_download);
            }

            return false;
        },

        downloadFilename () {
            if (this.checkGurlittInsel && this.feature?.getProperties()?.link_download) {
                return false;
            }

            return this.propMeansOfTransport + "_" + this.propThingId + "_" + this.direction;
        },

        /**
         * Gets if the information about heavy traffic is available, currently only for "Anzahl_Kfz" and only if the last day value of "Anzahl_Schwerverkehr" is available
         * @return {Boolean} True if the information about heavy traffic is available, false otherwise.
         */
        isHeavyTrafficAvailable () {
            return typeof this.lastDayValueSecond !== "undefined";
        }
    },
    watch: {
        // When the gfi window switched with arrow, the connection will be refreshed
        feature: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    if (this.isGurlittInsel(newVal)) {
                        this.createDataConnectionDauerzaehlstellenRad(newVal, errormsg => {
                            console.warn("An error occured constructing Gurlitt Insel:", errormsg);
                        });
                        this.checkGurlittInsel = true;
                    }
                    else {
                        this.createDataConnection(newVal.getProperties(), errormsg => {
                            console.warn("An error occured constructing SensorThings Api:", errormsg);
                        }, null);
                        this.checkGurlittInsel = false;
                    }
                    this.isMqttLive = true;
                    this.setHeader(this.api, this.propThingId, this.propMeansOfTransport);
                    this.setComponentKey(this.propThingId + this.propMeansOfTransport);
                    this.setActiveDefaultTab();
                    this.setHolidays(newVal);
                }
            },
            immediate: true
        },
        propThingId: {
            handler (_newVal, oldVal) {
                if (oldVal) {
                    this.isMqttLive = true;
                }
            },
            immediate: true,
            deep: true
        },
        propMeansOfTransport: {
            handler (_newVal, oldVal) {
                if (oldVal) {
                    this.isMqttLive = true;
                }
            },
            immediate: true
        },
        // When language is switched, the header will be rerendered
        currentLocale: function (newVal, oldVal) {
            if (oldVal) {
                this.setHeader(this.api, this.propThingId, this.propMeansOfTransport);
                this.setComponentKey(newVal);
            }
        }
    },
    created: function () {
        if (this.isGurlittInsel(this.feature)) {
            this.createDataConnectionDauerzaehlstellenRad(this.feature, errormsg => {
                console.warn("An error occured constructing Gurlitt Insel:", errormsg);
            });
            this.checkGurlittInsel = true;
        }
        else {
            this.createDataConnection(this.feature.getProperties(), errormsg => {
                console.warn("An error occured constructing SensorThings Api:", errormsg);
            }, null);
            this.checkGurlittInsel = false;
        }
    },
    mounted: function () {
        this.statusHandler = (status) => {
            this.isMqttLive = status;
        };

        if (typeof this.api?.api?.onMqttStatusChange === "function") {
            this.api.api.onMqttStatusChange(this.statusHandler);
        }
        this.setHeader(this.api, this.propThingId, this.propMeansOfTransport);
        this.setHolidays(this.feature);
    },
    beforeUnmount: function () {
        if (typeof this.api?.api?.offMqttStatusChange === "function" && this.statusHandler) {
            this.api.api.offMqttStatusChange(this.statusHandler);
        }
        this.api.unsubscribeEverything();
    },
    methods: {
        /**
         * checks if this is the feature of Gurlitt-Insel
         * @param {Object} feature the feature
         * @returns {void}
         */
        isGurlittInsel (feature) {
            return typeof feature === "object" && feature !== null
                && typeof feature.getMimeType === "function" && feature.getMimeType() === "text/xml"
                && typeof feature.getId === "function" && typeof feature.getId() === "string" && feature.getId().indexOf("DE.HH.UP_DAUERZAEHLSTELLEN_RAD") === 0;
        },
        /**
         * sets the GFI up for the Gurlitt-Insel feature
         * @param {Object} feature the feature
         * @param {Function} [onerror] a function to call on error
         * @returns {void}
         */
        createDataConnectionDauerzaehlstellenRad (feature, onerror) {
            this.api = new DauerzaehlstellenRadApi(feature, onerror, (link, onsuccess, onAxiosError) => {
                axios({
                    method: "get",
                    url: link,
                    responseType: "text"
                }).then(function (response) {
                    if (typeof onsuccess === "function" && typeof response === "object" && response !== null && Object.prototype.hasOwnProperty.call(response, "data")) {
                        onsuccess(response.data);
                    }
                }).catch(function (error) {
                    if (typeof onAxiosError === "function") {
                        onAxiosError(error);
                    }
                });
            });
            this.propThingId = this.api.getThingId(onerror);
            this.propMeansOfTransport = this.api.getMeansOfTransport();
        },
        /**
         * it will make conntection to thing api
         * @param {Object} feature the feature properties from thing
         * @param {Function} [onerror] a function to call on error
         * @param {Object} [sensorThingsApiOpt=null] an optional api for testing
         * @returns {void}
         */
        createDataConnection: function (feature, onerror, sensorThingsApiOpt = null) {
            const thingId = feature["@iot.id"],
                  meansOfTransport = this.getMeansOfTransportFromDatastream(feature.Datastreams, Object.keys(this.typeAssoc)),
                  url = feature.requestUrl,
                  sensorThingsApiVersion = "v" + feature.versionUrl,
                  mqttOptions = {
                      host: url.split("/")[2],
                      rhPath: url,
                      context: this,
                      path: "/mqtt",
                      protocol: "wss",
                      mqttVersion: "3.1.1"
                  };

            this.api = new TrafficCountCache(url, sensorThingsApiVersion, mqttOptions, sensorThingsApiOpt);
            this.propThingId = thingId;
            this.propMeansOfTransport = meansOfTransport;
        },

        /**
         * returns the value in meansOfTransportArray that matches the start of the given array of datastreams property layerName, returns first match
         * @param {Object[]} datastreams the array of datastreams from the SensorThingsAPI
         * @param {String[]} meansOfTransportArray an array representing all terms to look for in the datastreams layerName
         * @returns {String|Boolean}  a string representing the means of transport (e.g. Anzahl_Kfz, Anzahl_Fahrraeder) or false if no means of transport where found
         */
        getMeansOfTransportFromDatastream: function (datastreams, meansOfTransportArray) {
            let key,
                i,
                datastream = null;

            if (!Array.isArray(datastreams) || datastreams.length === 0) {
                return false;
            }

            for (i in datastreams) {
                datastream = datastreams[i];

                if (!datastream || typeof datastream !== "object" || !datastream?.properties || !datastream.properties?.layerName) {
                    continue;
                }

                for (key in meansOfTransportArray) {
                    if (datastream.properties.layerName.indexOf(meansOfTransportArray[key]) === 0) {
                        return meansOfTransportArray[key];
                    }
                }
            }

            return false;
        },

        /**
         * set the default infs tab active when switch the language by triggering the click event
         * @returns {Void} -
         */
        setActiveDefaultTab: function () {
            this.$el.querySelector("#info-tab").click();
        },
        /**
         * set the current tab id after clicking.
         * @param {String} id the id of current tab
         * @returns {Void} -
         */
        setCurrentTabId: function (id) {
            if (id) {
                this.currentTabId = id;
            }
        },

        /**
         * setup of the last update date for the header
         * @param {Object} api instance of TrafficCountApi
         * @param {String} thingId the thingId to be send to any api call
         * @param {String} meansOfTransport the meansOfTransport to be send with any api call
         * @returns {void}
         */
        updateLastUpdate: function (api, thingId, meansOfTransport) {
            api.subscribeLastUpdate(thingId, meansOfTransport, datetime => {
                this.lastUpdate = dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm [Uhr]");
            }, () => {
                this.lastUpdate = "";
            });
        },

        /**
         * set the header of gfi theme
         * @param {Object} api the api from library
         * @param {String} thingId the current thing Id
         * @param {String} meansOfTransport the means of transportation
         * @returns {Void} -
         */
        setHeader: function (api, thingId, meansOfTransport) {
            // title
            api.updateTitle(thingId, title => {
                this.setTitle(title);
            }, errormsg => {
                this.setTitle("(kein Titel empfangen)");
                console.warn("The title received is incomplete:", errormsg);
                Radio.trigger("Alert", "alert", {
                    content: "Der vom Sensor-Server erhaltene Titel des geöffneten GFI konnte wegen eines API-Fehlers nicht empfangen werden.",
                    category: "Info"
                });
            });

            // type
            if (meansOfTransport && Object.prototype.hasOwnProperty.call(this.typeAssoc, meansOfTransport)) {
                if (this.isGurlittInsel(this.feature)) {
                    this.type = this.$t("additional:modules.tools.gfi.themes.trafficCount.inductionLoop");
                }
                else {
                    this.type = this.typeAssoc[meansOfTransport];
                }
            }
            else {
                this.type = "";
            }

            // means of transport
            if (meansOfTransport && Object.prototype.hasOwnProperty.call(this.meansOfTransportAssoc, meansOfTransport)) {
                this.meansOfTransport = this.meansOfTransportAssoc[meansOfTransport];
            }
            else {
                this.meansOfTransport = "";
            }

            // direction
            api.updateDirection(thingId, direction => {
                this.setDirection(direction);
            }, errormsg => {
                this.setDirection("");
                console.warn("The direction received is incomplete:", errormsg);
                Radio.trigger("Alert", "alert", {
                    content: "Die vom Sensor-Server erhaltene Richtung des geöffneten GFI konnte wegen eines API-Fehlers nicht empfangen werden.",
                    category: "Info"
                });
            });

            if (meansOfTransport === "Anzahl_Kfz" || meansOfTransport === "Anzahl_Schwerverkehr") {
                const meansOfTransportSecond = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "Anzahl_Kfz";

                api.updateDay(thingId, meansOfTransportSecond, dayjs().subtract(1, "day").format("YYYY-MM-DD"), (_, secondValue) => {
                    this.lastDayValueSecond = thousandsSeparator(secondValue);
                }, errormsg => {
                    this.lastDayValueSecond = undefined;
                    console.warn("The last update last day of traffic is incomplete:", errormsg);
                });
            }

            // last update for header
            this.updateLastUpdate(api, thingId, meansOfTransport);
        },

        /**
         * setter for title
         * @param {String} value the title to be shown in the template
         * @returns {void}
         */
        setTitle: function (value) {
            this.title = value;
        },

        /**
         * setter for direction
         * @param {String} value the direction to be shown in the template
         * @returns {void}
         */
        setDirection: function (value) {
            this.direction = value;
        },

        /**
         * setter for the compoent key
         * @param {String} value the dynamic changed value from watch hook
         * @returns {void}
         */
        setComponentKey: function (value) {
            this.keyInfo = value + "info";
            this.keyDay = value + "day";
            this.keyWeek = value + "week";
            this.keyYear = value + "year";
        },

        /**
         * Setting the holidays in Array if there are holiday configured in config.json
         * @param {Object} feature the feature
         * @returns {void}
         */
        setHolidays (feature) {
            const gfiTheme = feature?.getTheme(),
                  gfiParams = gfiTheme?.params,
                  holidays = gfiParams?.holidays;

            if (Array.isArray(holidays) && holidays.length) {
                this.holidays = holidays;
            }
        }
    }
};
</script>

<template>
    <div class="trafficCount-gfi">
        <TrafficCountHeader
            :title="title"
            :type="type"
            :direction="direction"
            :api="api"
            :thing-id="propThingId"
            :holidays="holidays"
            :download-url="downloadUrl"
            :download-filename="downloadFilename"
            :means-of-transport="propMeansOfTransport"
            :is-mqtt-live="isMqttLive"
            :is-heavy-traffic-available="isHeavyTrafficAvailable"
            :last-update="lastUpdate"
        />
        <div>
            <ul
                id="traffic-count-tabs"
                class="nav nav-tabs nav-justified"
                role="tablist"
                tabindex="0"
            >
                <NavTab
                    :id="'info-tab'"
                    :active="true"
                    :target="'#info'"
                    :label="infoLabel"
                    :icon="'bi-info-circle'"
                    :interaction="() => setCurrentTabId('info')"
                />
                <NavTab
                    :id="'analysis-tab'"
                    :active="false"
                    :target="'#analysis'"
                    :label="'Analyse'"
                    :icon="'bi-bar-chart'"
                    :interaction="() => setCurrentTabId('analysis')"
                />
            </ul>
            <div class="tab-content">
                <TrafficCountInfo
                    id="info"
                    :key="keyInfo"
                    :class="{ 'tab-pane': true, 'active': currentTabId === 'info' }"
                    :api="api"
                    :thing-id="propThingId"
                    :holidays="holidays"
                    :means-of-transport="propMeansOfTransport"
                    :active-tab="currentTabId === 'info'"
                />
                <div
                    id="analysis"
                    :class="{ 'tab-pane': true, 'active': currentTabId === 'analysis' }"
                    :active-tab="currentTabId === 'analysis'"
                >
                    <div class="mt-2 ms-2 small text-secondary">
                        {{ $t("additional:modules.tools.gfi.themes.trafficCount.period") }}
                    </div>
                    <div
                        class="d-flex gap-2 flex-wrap m-2"
                        role="group"
                        :aria-label="$t('additional:modules.tools.gfi.themes.trafficCount.timeViewLabel')"
                    >
                        <FlatButton
                            :secondary="selectedTimeView !== 'day'"
                            :text="dayLabel"
                            :interaction="() => selectedTimeView = 'day'"
                            :aria-pressed="selectedTimeView === 'day'"
                        />
                        <FlatButton
                            :secondary="selectedTimeView !== 'week'"
                            :text="weekLabel"
                            :interaction="() => selectedTimeView = 'week'"
                            :aria-pressed="selectedTimeView === 'week'"
                        />
                        <FlatButton
                            :secondary="selectedTimeView !== 'year'"
                            :text="yearLabel"
                            :interaction="() => selectedTimeView = 'year'"
                            :aria-pressed="selectedTimeView === 'year'"
                        />
                    </div>
                    <keep-alive>
                        <TrafficCountDay
                            v-if="selectedTimeView === 'day'"
                            :key="keyDay"
                            :api="api"
                            :thing-id="propThingId"
                            :means-of-transport="propMeansOfTransport"
                            :reset="dayCheckReset"
                            :holidays="holidays"
                            :check-gurlitt-insel="checkGurlittInsel"
                        />
                        <TrafficCountWeek
                            v-else-if="selectedTimeView === 'week'"
                            :key="keyWeek"
                            :api="api"
                            :thing-id="propThingId"
                            :means-of-transport="propMeansOfTransport"
                            :reset="weekCheckReset"
                            :holidays="holidays"
                        />
                        <TrafficCountYear
                            v-else-if="selectedTimeView === 'year'"
                            :key="keyYear"
                            :api="api"
                            :thing-id="propThingId"
                            :means-of-transport="propMeansOfTransport"
                            :reset="yearCheckReset"
                            :holidays="holidays"
                            :check-gurlitt-insel="checkGurlittInsel"
                        />
                    </keep-alive>
                </div>
            </div>
        </div>
        <div
            v-if="currentTabId !== 'info'"
            class="indication"
        >
            {{ $t("additional:modules.tools.gfi.themes.trafficCount.notice") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
.trafficCount-gfi {
    padding: 10px 5px 0;
    container-type: inline-size;
    container-name: trafficCountGfi;

    @media (max-width: 600px) {
        width: inherit;
        height: inherit;
        padding-left: 10px;
        padding-right: 10px;

        div.graph {
            width: inherit;
            height: inherit;
        }
    }

    .last-update-bar {
        font-size: 12px;
        color: #555;
        padding: 4px 8px 6px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    #traffic-count-tabs {
        :deep(.nav-link.active) {
            color: #3C5F94;
            border-bottom-color: #3C5F94;
        }
    }

    .nav-pills {

        & > li > a {
            margin-bottom: 0.5em;
        }
    }

    .indication {
        font-size: 10px;
        position: relative;
        display: inline-block;
        width: 100%;
        padding-bottom: 5px;
    }

    // Shared styling for the date selectors of the day, week and year tabs (all use class "dateSelector").
    :deep(.dateSelector) {
        .mx-datepicker {
            width: 100%;
        }
        .mx-input {
            border-radius: var(--bs-border-radius);
        }
        .wrap-input {
            height: auto;
            min-height: calc(1.5em + 0.75rem + 2px);
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
            cursor: pointer;
        }
        .wrap-input-placeholder {
            color: $dark_grey;
        }
        .mx-icon-calendar,
        .mx-icon-clear {
            .bi {
                font-size: 16px;
                color: rgba($black, 0.5);
            }
        }
    }
}
</style>
