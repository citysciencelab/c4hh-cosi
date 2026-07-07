<script>
import dayjs from "dayjs";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {createCsvBlob, downloadBlobPerNavigator, downloadBlobPerHTML5} from "@shared/modules/buttons/js/exportButtonUtils.js";
import {getPublicHoliday, hasHolidayInWeek} from "../../../../src/shared/js/utils/calendar.js";

export default {
    name: "TrafficCountHeader",
    components: {
        FlatButton
    },
    props: {
        api: {
            type: Object,
            required: true
        },
        direction: {
            type: String,
            required: true
        },
        downloadFilename: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        downloadUrl: {
            type: [String, Boolean],
            required: true
        },
        holidays: {
            type: Array,
            required: true
        },
        isHeavyTrafficAvailable: {
            type: Boolean,
            required: true
        },
        isMqttLive: {
            type: Boolean,
            required: true
        },
        lastUpdate: {
            type: String,
            required: true
        },
        meansOfTransport: {
            type: String,
            required: true
        },
        thingId: {
            type: [Number, String],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            dayInterval: "1-Tag",
            downloadOptions: [
                {interval: "15-Min", intervalLabel: "downloadIntervalMin"},
                {interval: "1-Stunde", intervalLabel: "downloadIntervalHour"},
                {interval: "1-Tag", intervalLabel: "downloadIntervalDay"},
                {interval: "1-Woche", intervalLabel: "downloadIntervalWeek"}
            ],
            hourInterval: "1-Stunde",
            isDownloading: false,
            meansOfTransportIcons: {
                Anzahl_Fahrraeder: "bi-bicycle",
                Anzahl_Kfz: "bi-car-front",
                Anzahl_Schwerverkehr: "bi-truck"
            },
            minInterval: "15-Min",
            weekFromDate: "",
            weekInterval: "1-Woche"
        };
    },
    computed: {
        /**
         * Gets the indication if heavy traffic is available, if the means of transport is "Anzahl_Kfz".
         * @return {String} The indication.
         */
        heavyTrafficIndication () {
            if (this.meansOfTransport !== "Anzahl_Kfz") {
                return "";
            }

            return this.isHeavyTrafficAvailable ? this.$t("additional:modules.tools.gfi.themes.trafficCount.isHeavyTrafficAvailable") : this.$t("additional:modules.tools.gfi.themes.trafficCount.isHeavyTrafficNotAvailable");
        },

        /**
         * Gets the icon class for the current means of transport.
         * @return {String} The icon class.
         */
        meansOfTransportIcon () {
            return this.meansOfTransportIcons[this.meansOfTransport];
        },

        /**
         * Gets the means of transport used for the data requests, normalized to "Anzahl_Kfz" for motorized traffic.
         * @return {String} The normalized means of transport.
         */
        normalizedMeansOfTransport () {
            return this.meansOfTransport !== "Anzahl_Fahrraeder" ? "Anzahl_Kfz" : this.meansOfTransport;
        },

        /**
         * Gets the indication whether the sensor type is an induction loop.
         * @return {Boolean} True if the sensor type is an induction loop.
         */
        isInductionLoop () {
            return this.type === this.$t("additional:modules.tools.gfi.themes.trafficCount.inductionLoop");
        },

        /**
         * Gets the interval download options that should be visible, none for an induction loop.
         * @return {Object[]} The visible download options.
         */
        visibleDownloadOptions () {
            return this.isInductionLoop ? [] : this.downloadOptions;
        }
    },
    watch: {
        thingId: {
            /**
             * Updates the week start date whenever the thingId changes.
             * @returns {void}
             */
            handler () {
                this.updateWeekFromDate();
            },
            immediate: true
        },
        /**
         * Updates the week start date whenever the meansOfTransport changes.
         * @returns {void}
         */
        meansOfTransport () {
            this.updateWeekFromDate();
        }
    },
    methods: {
        /**
         * Gets the time range ({from, until} as dayjs objects) matching the request logic of the given interval.
         * @param {String} interval the interval (15-Min | 1-Stunde | 1-Tag | 1-Woche)
         * @returns {Object} an object with the dayjs objects "from" and "until"; "from" is null for the week interval as long as the first date is not yet known
         */
        getTimeRange (interval) {
            const until = dayjs();

            if (interval === this.minInterval) {
                return {from: dayjs().subtract(14, "day"), until};
            }
            if (interval === this.hourInterval) {
                return {from: dayjs().subtract(60, "day"), until};
            }
            if (interval === this.dayInterval) {
                return {from: dayjs().subtract(1, "year").startOf("year"), until};
            }

            return {from: this.weekFromDate ? dayjs(this.weekFromDate) : null, until};
        },

        /**
         * Gets the period label of the given interval, dynamically generated from the request time range.
         * @param {String} interval the interval (15-Min | 1-Stunde | 1-Tag | 1-Woche)
         * @returns {String} the translated period label
         */
        getPeriodLabel (interval) {
            const range = this.getTimeRange(interval);

            if (interval === this.weekInterval) {
                if (!range.from) {
                    return this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadPeriodAll");
                }
                return this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadPeriodSince", {year: range.from.format("YYYY")});
            }

            return this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadPeriod", {
                from: range.from.format("DD.MM.YYYY"),
                until: range.until.format("DD.MM.YYYY")
            });
        },

        /**
         * Requests the first available date for the week interval to generate its period label dynamically.
         * @returns {void}
         */
        updateWeekFromDate () {
            if (typeof this.downloadUrl === "string" || !this.api || typeof this.api.getFirstDateEver !== "function") {
                this.weekFromDate = "";
                return;
            }

            this.api.getFirstDateEver(this.thingId, this.normalizedMeansOfTransport, firstDate => {
                this.weekFromDate = firstDate;
            }, () => {
                this.weekFromDate = "";
            });
        },

        /**
         * Triggers the data export for the given interval.
         * @param {String} interval the interval to download data for (15-Min | 1-Stunde | 1-Tag | 1-Woche)
         * @returns {void}
         */
        startDownload (interval) {
            if (this.isDownloading || this.isInductionLoop) {
                return;
            }

            if (typeof this.downloadUrl === "string") {
                window.location = this.downloadUrl;
                return;
            }

            const handler = this.getDownloadHandler(interval, this.meansOfTransport);

            if (typeof handler !== "function") {
                return;
            }

            this.isDownloading = true;
            handler(jsonData => {
                this.downloadCsv(jsonData, this.downloadFilename ? this.downloadFilename + " " + interval : interval);
            });
        },

        /**
         * Triggers the data export for all available intervals at once, combining them into a single csv file.
         * @returns {void}
         */
        startDownloadAll () {
            if (this.isDownloading || !this.isInductionLoop) {
                return;
            }

            if (typeof this.downloadUrl === "string") {
                window.location = this.downloadUrl;
                return;
            }

            const options = this.downloadOptions,
                  results = [];
            let remaining = options.length;

            this.isDownloading = true;

            options.forEach((option, index) => {
                const handler = this.getDownloadHandler(option.interval, this.meansOfTransport);

                if (typeof handler !== "function") {
                    results[index] = [];
                    remaining -= 1;
                    if (remaining <= 0) {
                        this.finishDownloadAll(options, results);
                    }
                    return;
                }

                handler(jsonData => {
                    results[index] = Array.isArray(jsonData) ? jsonData : [];
                    remaining -= 1;
                    if (remaining <= 0) {
                        this.finishDownloadAll(options, results);
                    }
                });
            });
        },

        /**
         * Combines the data of all intervals into a single array and triggers the csv file download.
         * @param {Object[]} options the download options in the order their data should appear
         * @param {Object[][]} results the prepared data per interval, indexed like options
         * @returns {void}
         */
        finishDownloadAll (options, results) {
            const jsonData = [],
                  intervalHeader = this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadIntervalColumn");

            options.forEach((option, index) => {
                const intervalLabel = this.$t("additional:modules.tools.gfi.themes.trafficCount." + option.intervalLabel);

                (results[index] || []).forEach(row => {
                    jsonData.push({[intervalHeader]: intervalLabel, ...row});
                });
            });

            this.downloadCsv(jsonData, this.downloadFilename ? this.downloadFilename + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadAllFilename") : this.$t("additional:modules.tools.gfi.themes.trafficCount.downloadAllFilename"));
        },

        /**
         * Converts the given json data to csv and triggers the file download.
         * @param {Object[]} jsonData the prepared data to download
         * @param {String} filenamePrefix the prefix of the filename to use
         * @returns {void}
         */
        downloadCsv (jsonData, filenamePrefix) {
            const onerror = msg => {
                      console.warn(msg);
                      this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:shared.modules.buttons.error.download"));
                  },
                  csvText = convertJsonToCsv(jsonData, onerror, true);

            if (typeof csvText === "string") {
                const blob = createCsvBlob(csvText),
                      filename = String(filenamePrefix) + dayjs().format("_YYYY-MM-DD_HH-mm-ss") + ".csv";

                if (!downloadBlobPerNavigator(blob, filename)) {
                    downloadBlobPerHTML5(blob, filename, onerror);
                }
            }

            setTimeout(() => {
                this.isDownloading = false;
            }, 2200);
        },

        /**
         * Gets the download handler with different interval and meansOfTransport.
         * @param {String} interval the interval to get different type of data
         * @param {String} originMeansOfTransport the original means of transportation.
         * @returns {Boolean|Function} false if downloadUrl is a string or a handler function otherwise
         */
        getDownloadHandler (interval, originMeansOfTransport) {
            const meansOfTransport = originMeansOfTransport !== "Anzahl_Fahrraeder" ? "Anzahl_Kfz" : originMeansOfTransport,
                  meansOfTransportSV = meansOfTransport === "Anzahl_Kfz" ? "Anzahl_Schwerverkehr" : "";

            if (typeof this.downloadUrl === "string") {
                return false;
            }

            return onsuccess => {
                const downloadData = this.getDownloadDataFn(interval);

                downloadData(this.thingId, meansOfTransport, result => {
                    const nonSVData = result.data[meansOfTransport];

                    if (meansOfTransportSV === "Anzahl_Schwerverkehr") {
                        downloadData(this.thingId, meansOfTransportSV, svResult => {
                            const jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, svResult.data[meansOfTransportSV], interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        }, error => {
                            console.warn("error", "downloadData", error);
                            const jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                            if (typeof onsuccess === "function") {
                                onsuccess(jsonData);
                            }
                        });
                    }
                    else {
                        const jsonData = this.prepareDataForDownload(meansOfTransport, nonSVData, false, interval, this.holidays);

                        if (typeof onsuccess === "function") {
                            onsuccess(jsonData);
                        }
                    }
                }, error => {
                    console.warn("error", "downloadData", error);
                    this.isDownloading = false;
                    this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:modules.exportButton.error.download"));
                });
            };
        },

        /**
         * Gets the download data function matching the given interval.
         * @param {String} interval the interval (15-Min | 1-Stunde | 1-Tag | 1-Woche)
         * @returns {Function} the download data function
         */
        getDownloadDataFn (interval) {
            if (interval === this.minInterval) {
                return this.downloadDataMin;
            }
            if (interval === this.hourInterval) {
                return this.downloadDataHour;
            }
            if (interval === this.dayInterval) {
                return this.downloadDataDay;
            }
            return this.downloadDataWeek;
        },

        /**
         * Gets the download data for the last 14 days for the given thingId and meansOfTransport with 15-Min interval.
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result); fired once on success
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataMin (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const timeSet = {
                interval: this.minInterval,
                from: dayjs().subtract(14, "day").format("YYYY-MM-DD"),
                until: dayjs().format("YYYY-MM-DD")
            };

            this.api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data for the last 60 days for the given thingId and meansOfTransport with 1-Stunde interval.
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result); fired once on success
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataHour (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const timeSet = {
                interval: this.hourInterval,
                from: dayjs().subtract(60, "day").format("YYYY-MM-DD"),
                until: dayjs().format("YYYY-MM-DD")
            };

            this.api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data for the given thingId and meansOfTransport with 1-Tag interval.
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result); fired once on success
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataDay (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const timeSet = {
                interval: this.dayInterval,
                from: dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"),
                until: dayjs().format("YYYY-MM-DD")
            };

            this.api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * Gets the download data since the beginning with 1-Woche interval.
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result); fired once on success
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {void}
         */
        downloadDataWeek (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            this.api.getFirstDateEver(thingId, meansOfTransport, firstDate => {
                const timeSet = {
                    interval: this.weekInterval,
                    from: firstDate,
                    until: dayjs().format("YYYY-MM-DD")
                };

                this.api.downloadData(thingId, meansOfTransport, timeSet, onsuccess, onerror, false, oncomplete);
            }, onerror, onstart, false);
        },

        /**
         * Converts the data object into an array of objects for the csv download.
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Object} data - the whole count of data for download
         * @param {Object|Boolean} dataAnzahlSV - the count of trucks for download
         * @param {String} interval - 15-Min | 1-Stunde | 1-Tag | 1-Woche
         * @param {String[]} holidays - the holidays from parent component in array format
         * @returns {Object[]} objArr - converted data
         */
        prepareDataForDownload (meansOfTransport, data, dataAnzahlSV, interval, holidays) {
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

                if (interval === "15-Min" || interval === "1-Stunde") {
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
    <div class="mb-3">
        <div class="d-flex flex-row align-items-center p-3 rounded-3 background-color header-row">
            <div class="fs-1 p-2">
                <i :class="['bi', meansOfTransportIcon]" />
            </div>
            <div class="ms-4">
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.idLabel") }}</span>
                <span class="header-color"> {{ title }} </span>
                <br>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.typeLabel") }}</span>
                <span class="header-color"> {{ type }} </span>
                <br>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.directionLabel") }}</span>
                <span class="header-color"> {{ direction }} </span>
                <br>
                <span class="header-color"> {{ heavyTrafficIndication }} </span>
            </div>
            <div class="ms-auto download-wrapper">
                <div class="dropdown">
                    <FlatButton
                        :icon="'bi-cloud-arrow-down'"
                        :text="$t('additional:modules.tools.gfi.themes.trafficCount.download')"
                        :customclass="'mb-0'"
                        :disabled="isDownloading"
                        :spinner-trigger="isDownloading"
                        data-bs-toggle="dropdown"
                        data-bs-auto-close="true"
                        aria-expanded="false"
                    />
                    <ul class="dropdown-menu dropdown-menu-end download-menu shadow">
                        <li class="dropdown-header download-menu-header d-flex align-items-center">
                            <i class="bi bi-calendar3 me-2" />
                            <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.downloadChoose") }}</span>
                        </li>
                        <li><hr class="dropdown-divider m-0"></li>
                        <li
                            v-for="option in visibleDownloadOptions"
                            :key="option.interval"
                        >
                            <button
                                type="button"
                                class="dropdown-item download-menu-item"
                                @click="startDownload(option.interval)"
                            >
                                <span class="download-menu-item-title">
                                    {{ $t("additional:modules.tools.gfi.themes.trafficCount." + option.intervalLabel) }}
                                </span>
                                <span class="download-menu-item-period">
                                    {{ getPeriodLabel(option.interval) }}
                                </span>
                            </button>
                        </li>
                        <li v-if="isInductionLoop">
                            <hr class="dropdown-divider m-0">
                        </li>
                        <li v-if="isInductionLoop">
                            <button
                                type="button"
                                class="dropdown-item download-menu-item"
                                @click="startDownloadAll"
                            >
                                <span class="download-menu-item-title">
                                    {{ $t("additional:modules.tools.gfi.themes.trafficCount.downloadAll") }}
                                </span>
                                <span class="download-menu-item-period">
                                    {{ $t("additional:modules.tools.gfi.themes.trafficCount.downloadAllDescription") }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="p-2">
            <div class="d-flex flex-row align-items-center">
                <span class="pt-1">
                    <i class="bi bi-arrow-clockwise fs-5 me-3" />
                </span>
                <span>{{ $t("additional:modules.tools.gfi.themes.trafficCount.lastupdateLabel") }} {{ lastUpdate }}</span>
                <br>
            </div>
            <div
                v-if="!isMqttLive"
                class="indication"
            >
                <i class="bi bi-exclamation-triangle-fill pe-1 text-danger" />
                {{ $t("additional:modules.tools.gfi.themes.trafficCount.autoUpdateNote") }}
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .indication {
        font-size: $font-size-sm;
    }

    .background-color {
        background-color: rgba($light_grey, 0.5);
    }

    @container trafficCountGfi (max-width: 360px) {
        .header-row {
            flex-wrap: wrap;
        }

        .download-wrapper {
            display: flex;
            justify-content: center;
            margin-left: 0 !important;
            margin-top: 0.5rem;
            width: 100%;
        }
    }

    .header-color {
        color: $secondary;
    }

    .download-menu {
        min-width: 16rem;
        padding: 0;
        overflow: hidden;
        border-radius: 0.5rem;
    }

    .download-menu-header {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: $secondary;
    }

    .download-menu-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.6rem 1rem;
        white-space: normal;

        &:hover,
        &:focus,
        &:active {
            color: inherit;
            background-color: rgba($light_grey, 0.5);
        }
    }

    .download-menu-item + .download-menu-item,
    li + li .download-menu-item {
        border-top: 1px solid rgba($light_grey, 0.8);
    }

    .download-menu-item-title {
        font-weight: 600;
    }

    .download-menu-item-period {
        font-size: 0.8rem;
        color: $secondary;
    }
</style>
