<script>
import {getPublicHoliday, hasHolidayInWeek} from "../../../../src/shared/js/utils/calendar.js";

export default {
    name: "TrafficCountCompTable",
    props: {
        /**
         * the array as it comes from the api
         * e.g. [{bikes: {date: value}}]
         */
        apiData: {
            type: Array,
            required: true
        },

        /**
         * the title of the table - this is the top left field
         */
        tableTitle: {
            type: String,
            required: true
        },
        /**
         * a function to create the title of a column, the given values are only from the first line
         * if you need to differ between datasets, use a second and third table instead
         * @param {String} date the date of the first dataset for this column
         * @return {String}  the title of the column - use param date and e.g. moment to create your title
         */
        setColTitle: {
            type: Function,
            required: true
        },
        /**
         * a function to create the row title
         * @param {String} key the dataset key of this row (e.g. car)
         * @param {Object} dataset the dataset of this row as Object{date: value}
         * @return {String}  the row title - use the key and date from dataset to create your title
         */
        setRowTitle: {
            type: Function,
            required: true
        },
        /**
         * a function to manipulate the value of a table field
         * @param {String|null} value the value of the field - this may be null if no data was given
         * @return {String}  the new value of the field
         */
        setFieldValue: {
            type: Function,
            required: true
        },
        /**
         * the holidays in array format
         */
        holidays: {
            type: Array,
            required: true
        },
        /**
         * the name of the active tab
         */
        currentTabId: {
            type: String,
            required: true
        },
        /**
         * The keys of meansOfTransport
         */
        meansOfTransportKey: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            tableData: []
        };
    },
    computed: {
        tableIndication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign");
        }
    },
    watch: {
        /**
         * Generates the table data when api data changes.
         * @param {Object[]} val the api data.
         * @returns {Void}  -
         */
        apiData: {
            handler (val) {
                this.tableData = this.getFlatApiData(val);
            },
            deep: true,
            immediate: true
        },
        /**
         * Generates the new chart when means of transport key changes.
         * @returns {Void}  -
         */
        meansOfTransportKey: {
            handler () {
                this.tableData = this.getFlatApiData(this.apiData);
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        /**
         * a very special function to grap the first dataset of the first dataObj from the given apiData
         * @param {Object[]} apiDataRef an array of data, e.g. [{bikes: {date: valueBike}, cars: {date: valueCar}}]
         * @returns {Object}  the first dataset of the first dataObj, e.g. {date: valueBike}
         */
        getFirstDataset (apiDataRef) {
            if (!Array.isArray(apiDataRef) || apiDataRef.length === 0) {
                return {};
            }

            const keys = Object.keys(apiDataRef[0]);

            if (keys.length === 0) {
                return {};
            }

            return apiDataRef[0][keys[0]];
        },
        /**
         * returns the first key in an object
         * @param {Object} obj the object
         * @returns {String|Boolean}  the first key or false if no key was found
         */
        getFirstKeyOfObject (obj) {
            if (typeof obj !== "object" || obj === null) {
                return false;
            }

            const keys = Object.keys(obj);

            if (keys.length === 0) {
                return false;
            }

            return keys[0];
        },
        /**
         * flattens the given apiData by pushing keys and datasets into a new Object{key, dataset}
         * @param {Object[]} apiDataRef an array of data, e.g. [{bikes: {date: valueBike1}}, {bikes: {date: valueBike2}}]
         * @returns {Object[]}  an array of Object{key, dataset}, e.g. [{key: "bikes", dataset: {date: valueBike1}}, {key: "bikes", dataset: {date: valueBike2}}]
         */
        getFlatApiData (apiDataRef) {
            if (!Array.isArray(apiDataRef) || apiDataRef.length === 0) {
                return [];
            }

            const result = [];

            apiDataRef.forEach(dataObj => {
                this.meansOfTransportKey.forEach(key => {
                    result.push({
                        key,
                        dataset: dataObj[key]
                    });
                });
            });

            return result;
        },
        /**
         * returns a star if the given datetime is a public holiday
         * @param {String} datetime a string representing a date in format YYYY-MM-DD HH:mm:ss
         * @return {string} a star as a string or empty string
         */
        setStar (datetime) {
            if (this.currentTabId === "week") {
                return getPublicHoliday(datetime, this.holidays, "YYYY-MM-DD HH:mm:ss") ? "*" : "";
            }
            else if (this.currentTabId === "year") {
                return hasHolidayInWeek(datetime, this.holidays, "YYYY-MM-DD HH:mm:ss") ? "*" : "";
            }

            return "";
        },
        /**
         * returns a star if the given datetime is a public holiday
         * @param {String[]} datetimeArray - an array of strings representing a date in format YYYY-MM-DD HH:mm:ss
         * @return {string} a star as a string or empty string
         */
        setStarAtDay (datetimeArray) {
            if (this.currentTabId === "day") {
                return getPublicHoliday(datetimeArray[0], this.holidays, "YYYY-MM-DD HH:mm:ss") ? "*" : "";
            }

            return "";
        }
    }
};
</script>

<template>
    <div class="table-wrapper">
        <div
            v-if="currentTabId !== 'info'"
            class="holiday-indication"
        >
            * {{ tableIndication }}
        </div>
        <div class="table-container">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>
                            {{ tableTitle }}
                        </th>
                        <th
                            v-for="(dataObjFlat, idx) in tableData"
                            :key="idx"
                        >
                            {{ setRowTitle(dataObjFlat?.key, getFirstKeyOfObject(dataObjFlat?.dataset)) }}
                            {{ setStarAtDay(Object.keys(dataObjFlat?.dataset ? dataObjFlat?.dataset : {})) }}
                        </th>
                    </tr>
                </thead>
                <tbody v-if="tableData.length">
                    <tr
                        v-for="(value, datetime, rowIdx) in getFirstDataset(apiData)"
                        :key="datetime"
                    >
                        <td>
                            {{ setColTitle(datetime) }}
                        </td>
                        <td
                            v-for="(dataObjFlat, idx) in tableData"
                            :key="idx"
                        >
                            {{ setFieldValue(dataObjFlat?.dataset ? Object.values(dataObjFlat.dataset)[rowIdx] : '') }}
                            {{ setStar(datetime) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.table-wrapper {
    margin-top: 5px;
    margin-bottom: 10px;

    .holiday-indication {
        font-size: 10px;
    }
}

.table-container {
    overflow: auto;
    max-height: 500px;
    position: relative;
    text-align: center;

    &::-webkit-scrollbar {
        height: 10px;
        width: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
    }

    table {
        margin-bottom: 0;
        border-collapse: separate;
        border-spacing: 0;

        th,
        td {
            padding: 0.6rem 0.3125rem;
            border: none;
            vertical-align: middle;
        }

        thead th {
            position: sticky;
            top: 0;
            background-color: $white;
            z-index: 15;
            border-bottom: 2px solid $light_grey;
            white-space: normal;
            word-break: break-word;
            line-height: 1.3;
            min-width: 120px;
            font-weight: 600;
        }

        th:first-child,
        td:first-child {
            position: sticky;
            left: 0;
            z-index: 10;
            font-family: $font_family_accent;
            font-size: $font-size-base;
            text-align: center;

            &::after {
                content: "";
                position: absolute;
                top: 0;
                right: -10px;
                bottom: 0;
                width: 10px;
                background: linear-gradient(to right, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0));
                pointer-events: none;
            }
        }

        th:first-child {
            z-index: 30;
            background-color: $white;
        }

        tbody tr {
            &:nth-child(odd) td {
                background-color: $light_blue;
            }

            &:nth-child(even) td {
                background-color: $white;
            }

            &:hover td {
                background-color: $table-hover-bg;
                transition: background-color 0.12s ease;
            }
        }
    }
}
</style>
