<script>
import dayjs from "dayjs";
import {getPublicHoliday, hasHolidayInWeek} from "../../../../src/shared/js/utils/calendar.js";
import ExportButtonCSV from "../../../../src/shared/modules/buttons/components/ExportButtonCSV.vue";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "TrafficCountDownloads",
    components: {
        ExportButtonCSV
    },
    props: {
        api: {
            type: Object,
            required: true
        },
        thingId: {
            type: [Number, String],
            required: true
        },
        meansOfTransport: {
            type: String,
            required: true
        },
        holidays: {
            type: Array,
            required: true
        },
        downloadUrl: {
            type: [String, Boolean],
            required: true
        },
        downloadFilename: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        activeTab: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            customStyle: {},
            lastUpdate: "",
            minInterval: "15-Min",
            hourInterval: "1-Stunde",
            dayInterval: "1-Tag",
            weekInterval: "1-Woche"
        };
    },
    computed: {
        ...mapGetters("Modules/TrafficCount", [
            "activeTabId"
        ]),

        downloadHandlerMin: function () {
            return this.getDownloadHandler(this.minInterval, this.meansOfTransport);
        },

        downloadHandlerHour: function () {
            return this.getDownloadHandler(this.hourInterval, this.meansOfTransport);
        },

        downloadHandlerDay: function () {
            return this.getDownloadHandler(this.dayInterval, this.meansOfTransport);
        },

        downloadHandlerWeek: function () {
            return this.getDownloadHandler(this.weekInterval, this.meansOfTransport);
        }
    },
    watch: {
        activeTab () {
            if (this.activeTab && this.activeTabId !== "downloads") {
                this.setActiveTabId("downloads");
            }
        }
    },
    methods: {
        ...mapMutations("Modules/TrafficCount", [
            "setActiveTabId"
        ]),
        /**
         * Gets the download handler with different interval and meansOfTransport
         * @param {String} interval the interval to get different type of data
         * @param {String} originMeansOfTransport the original means of transportation.
         * @returns {Boolean|Function} false if downloadUrl is false or return a function
         */
        getDownloadHandler: function (interval, originMeansOfTransport) {
            const meansOfTransport = originMeansOfTransport !== "Anzahl_Fahrraeder" ? "Anzahl_Kfz" : originMeansOfTransport,
                meansOfTransportSV = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "";

            if (typeof this.downloadUrl === "string") {
                return false;
            }

            return onsuccess => {
                if (interval === "15-Min") {
                    this.downloadDataMin(this.thingId, meansOfTransport, result => {
                        const nonSVData = result.data[meansOfTransport];
                        let jsonData;

                        if (meansOfTransportSV === "Anzahl_Schwerverkehr") {
                            this.downloadDataMin(this.thingId, meansOfTransportSV, svResult => {
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, svResult.data[meansOfTransportSV], interval, this.holidays);

                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            }, error => {
                                console.warn("error", "downloadDataDay", error);
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);
                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            });
                        }
                        else {
                            jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        }
                    }, error => {
                        console.warn("error", "downloadDataDay", error);
                        this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.exportButton.error.download"));
                    });
                }
                else if (interval === "1-Stunde") {
                    this.downloadDataHour(this.thingId, meansOfTransport, result => {
                        const nonSVData = result.data[meansOfTransport];
                        let jsonData;

                        if (meansOfTransportSV === "Anzahl_Schwerverkehr") {
                            this.downloadDataHour(this.thingId, meansOfTransportSV, svResult => {
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, svResult.data[meansOfTransportSV], interval, this.holidays);

                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            }, error => {
                                console.warn("error", "downloadDataDay", error);
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);
                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            });
                        }
                        else {
                            jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        }
                    }, error => {
                        console.warn("error", "downloadDataWeek", error);
                        this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.exportButton.error.download"));
                    });
                }
                else if (interval === "1-Tag") {
                    this.downloadDataDay(this.thingId, meansOfTransport, result => {
                        const nonSVData = result.data[meansOfTransport];
                        let jsonData;

                        if (meansOfTransportSV === "Anzahl_Schwerverkehr") {
                            this.downloadDataDay(this.thingId, meansOfTransportSV, svResult => {
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, svResult.data[meansOfTransportSV], interval, this.holidays);

                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            }, error => {
                                console.warn("error", "downloadDataDay", error);
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);
                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            });
                        }
                        else {
                            jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        }
                    }, error => {
                        console.warn("error", "downloadDataWeek", error);
                        this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.exportButton.error.download"));
                    });
                }
                else if (interval === "1-Woche") {
                    this.downloadDataWeek(this.thingId, meansOfTransport, result => {
                        const nonSVData = result.data[meansOfTransport];
                        let jsonData;

                        if (meansOfTransportSV === "Anzahl_Schwerverkehr") {
                            this.downloadDataWeek(this.thingId, meansOfTransportSV, svResult => {
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, svResult.data[meansOfTransportSV], interval, this.holidays);

                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            }, error => {
                                console.warn("error", "downloadDataDay", error);
                                jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);
                                if (typeof onsuccess === "function") {
                                    onsuccess(jsonData);
                                }
                            });
                        }
                        else {
                            jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        }
                    }, error => {
                        console.warn("error", "downloadDataYear", error);
                        this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.exportButton.error.download"));
                    });
                }
            };
        },

        /**
         * Gets the download data for the last 7 days for the given thingId and meansOfTransport with 15-Min interval
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataMin: function (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const api = this.api,
                timeSet = {
                    interval: this.minInterval,
                    from: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
                    until: dayjs().format("YYYY-MM-DD")
                };

            api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data for the given thingId and meansOfTransport with 1-hour Interval
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}  -
         */
        downloadDataHour: function (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const api = this.api,
                timeSet = {
                    interval: this.hourInterval,
                    from: dayjs().subtract(60, "day").format("YYYY-MM-DD"),
                    until: dayjs().format("YYYY-MM-DD")
                };

            api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data for the 54 weeks for the given thingId and meansOfTransport with 1-day interval
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}  -
         */
        downloadDataDay: function (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const api = this.api,
                timeSet = {
                    interval: this.dayInterval,
                    from: dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"),
                    until: dayjs().format("YYYY-MM-DD")
                };

            api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data since the beginning with 1-week interval
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataWeek: function (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const api = this.api;

            api.getFirstDateEver(thingId, meansOfTransport, firstDate => {
                const timeSet = {
                    interval: this.weekInterval,
                    from: firstDate,
                    until: dayjs().format("YYYY-MM-DD")
                };

                api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, false, oncomplete);
            }, onerror, onstart, false);
        },

        /**
         * Converts the data object into an array of objects for the csv download
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Object} data - the whole count of data for download
         * @param {Object|Boolean} dataAnzahlSV - the count of trucks for download
         * @param {String} interval - 15-min | 1-Stunde | 1-Tag | 1-Woche
         * @param {String[]} holidays - the holidays from parent component in array format
         * @returns {Object[]} objArr - converted data
         */
        prepareDataForDownload: function (meansOfTransport, data, dataAnzahlSV, interval, holidays) {
            const objArr = [];
            let countHeader = "Anzahl";

            if (meansOfTransport === "Anzahl_Kfz") {
                countHeader = "Anzahl Kfz";
            }
            else if (meansOfTransport === "Anzahl_Schwerverkehr") {
                countHeader = "Anzahl SV";
            }

            for (const key in data) {
                const obj = {},
                    date = key.split(" ");

                if (interval === "15-Min") {
                    obj.Datum = date[0];
                    obj["Uhrzeit von"] = date[1].slice(0, -3);
                    obj[countHeader] = data[key];
                    if (dataAnzahlSV) {
                        obj["Anzahl SV"] = typeof dataAnzahlSV[key] !== "undefined" ? dataAnzahlSV[key] : "";
                    }
                    obj.Feiertag = getPublicHoliday(date[0], holidays, "YYYY-MM-DD") ? "Ja" : "";
                }
                if (interval === "1-Stunde") {
                    obj.Datum = date[0];
                    obj["Uhrzeit von"] = date[1].slice(0, -3);
                    obj[countHeader] = data[key];
                    if (dataAnzahlSV) {
                        obj["Anzahl SV"] = typeof dataAnzahlSV[key] !== "undefined" ? dataAnzahlSV[key] : "";
                    }
                    obj.Feiertag = getPublicHoliday(date[0], holidays, "YYYY-MM-DD") ? "Ja" : "";
                }
                else if (interval === "1-Tag") {
                    obj.Datum = date[0];
                    obj[countHeader] = data[key];
                    if (dataAnzahlSV) {
                        obj["Anzahl SV"] = typeof dataAnzahlSV[key] !== "undefined" ? dataAnzahlSV[key] : "";
                    }
                    obj.Feiertag = getPublicHoliday(date[0], holidays, "YYYY-MM-DD") ? "Ja" : "";
                }
                else if (interval === "1-Woche") {
                    obj["Kalenderwoche ab"] = date[0];
                    obj[countHeader] = data[key];
                    if (dataAnzahlSV) {
                        obj["Anzahl SV"] = typeof dataAnzahlSV[key] !== "undefined" ? dataAnzahlSV[key] : "";
                    }
                    obj.Feiertag = hasHolidayInWeek(date[0], holidays, "YYYY-MM-DD") ? "Ja" : "";
                }
                objArr.push(obj);
            }

            return objArr;
        }
    }
};
</script>

<template>
    <div v-if="typeof downloadUrl === 'string' && activeTab">
        <ExportButtonCSV
            :url="downloadUrl"
            :filename="downloadFilename"
            :handler="false"
            :use-semicolon="true"
            :title="$t('additional:modules.tools.gfi.themes.trafficCount.downloadsAll')"
        />
    </div>
    <div v-else>
        <ExportButtonCSV
            :url="downloadUrl"
            :filename="downloadFilename + ' ' + minInterval"
            :handler="downloadHandlerMin"
            :use-semicolon="true"
            :title="$t('additional:modules.tools.gfi.themes.trafficCount.downloadsMin')"
        />
        <ExportButtonCSV
            :url="downloadUrl"
            :filename="downloadFilename + ' ' + hourInterval"
            :handler="downloadHandlerHour"
            :use-semicolon="true"
            :title="$t('additional:modules.tools.gfi.themes.trafficCount.downloadsHour')"
        />
        <ExportButtonCSV
            :url="downloadUrl"
            :filename="downloadFilename + ' ' + dayInterval"
            :handler="downloadHandlerDay"
            :use-semicolon="true"
            :title="$t('additional:modules.tools.gfi.themes.trafficCount.downloadsDay')"
        />
        <ExportButtonCSV
            :url="downloadUrl"
            :filename="downloadFilename + ' ' + weekInterval"
            :handler="downloadHandlerWeek"
            :use-semicolon="true"
            :title="$t('additional:modules.tools.gfi.themes.trafficCount.downloadsWeek')"
        />
    </div>
</template>

<style lang="scss" scoped>

.download-container {
    float: left;
    padding-top: 10px;
}

button {
    display: block;
    width: 100%;
    margin-top: 20px;
}

</style>
