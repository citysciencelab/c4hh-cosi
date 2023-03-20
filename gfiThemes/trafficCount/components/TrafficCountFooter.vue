<script>
import dayjs from "dayjs";

export default {
    name: "TrafficCountFooter",
    props: {
        currentTabId: {
            type: String,
            required: true
        },
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
        }
    },
    data () {
        return {
            customStyle: {},
            lastUpdate: ""
        };
    },
    computed: {
        indication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.notice");
        },

        tableIndication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign");
        },

        lastupdateLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.lastupdateLabel");
        },

        tableClass: function () {
            return this.currentTabId + " table table-hover table-striped";
        }
    },
    watch: {
        // When the gfi window switched with arrow, the new data will be fetched from api
        thingId: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.setFooterLastUpdate(this.api, newVal, this.meansOfTransport);
                }
            },
            immediate: true
        },

        meansOfTransport: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.setFooterLastUpdate(this.api, this.thingId, newVal);
                }
            },
            immediate: true
        },

        currentTabId: function (newVal) {
            if (newVal !== "infos" && newVal !== "downloads") {
                this.fixIndicationPosition();
            }
        }
    },
    mounted: function () {
        // set the date
        this.setFooterLastUpdate(this.api, this.thingId, this.meansOfTransport);
    },
    methods: {
        /**
         * Making the indication position always fixed when the window is scrolled
         * @returns {void}
         */
        fixIndicationPosition: function () {
            const gfiContent = document.querySelector(".gfi-content");

            if (gfiContent) {
                gfiContent.addEventListener("scroll", () => {
                    this.customStyle = {
                        "left": gfiContent.scrollLeft + "px"
                    };
                });
            }
        },

        /**
         * trigger the function of resetting tab
         * @returns {void}
         */
        reset: function () {
            this.$emit("resetTab");
        },

        /**
         * setup of the last update date
         * @param {Object} api instance of TrafficCountApi
         * @param {String} thingId the thingId to be send to any api call
         * @param {String} meansOfTransport the meansOfTransport to be send with any api call
         * @returns {void}
         */
        setFooterLastUpdate: function (api, thingId, meansOfTransport) {
            api.subscribeLastUpdate(thingId, meansOfTransport, datetime => {
                this.setLastUpdate(dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY, HH:mm:ss"));
            }, errormsg => {
                this.setLastUpdate("(aktuell keine Zeitangabe)");
                console.warn("The last update received is incomplete:", errormsg);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.tools.gfi.themes.trafficCount.error.subscribeLastUpdate"));
            });
        },

        /**
         * setter for lastUpdate
         * @param {String} value the datetime of the last update to be shown in the template
         * @returns {void}
         */
        setLastUpdate: function (value) {
            this.lastUpdate = value;
        }
    }
};
</script>

<template>
    <div>
        <div
            v-if="currentTabId !== 'infos' && currentTabId !== 'downloads' "
            class="tableIndication"
            :style="customStyle"
        >
            * {{ tableIndication }}
        </div>
        <div
            v-if="currentTabId !== 'infos' && currentTabId !== 'downloads' && meansOfTransport === 'Anzahl_Kfz'"
            class="trucksStatusIndication"
            :style="customStyle"
        >
            {{ $t("additional:modules.tools.gfi.themes.trafficCount.trucksStatus") }}
        </div>
        <div
            v-if="currentTabId !== 'infos' && currentTabId !== 'downloads'"
            class="indication"
            :style="customStyle"
        >
            {{ indication }}
        </div>
        <div
            v-if="currentTabId !== 'infos' && currentTabId !== 'downloads'"
            class="reset-container"
        >
            <button
                type="button"
                class="btn btn-primary"
                @click="reset"
            >
                {{ $t("additional:modules.tools.gfi.themes.trafficCount.reset") }}
            </button>
        </div>
        <div
            v-if="currentTabId !== 'downloads'"
            class="update"
        >
            <table
                :class="tableClass"
            >
                <tbody>
                    <tr colspan="2">
                        <td class="bold">
                            {{ lastupdateLabel }}
                        </td>
                        <td class="text-right">
                            {{ lastUpdate }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    .tableIndication, .trucksStatusIndication, .indication {
        font-size: 10px;
    }

    .trucksStatusIndication {
        display: none;
    }

    .download-container {
        float: left;
        padding-top: 10px;
    }
    .reset-container {
        float: left;
        padding-top: 10px;
        margin-left: 10px;
    }
    table {
        margin-bottom: 0;
        .text-right {
            text-align: right;
        }
        &:not(.infos) {
            min-width: 280px;
            width: 50%;
            float: right;
            margin-top: 10px;
            tbody {
                tr {
                    &:nth-of-type(odd){
                        background-color: $white;
                    }
                    td {
                        border-top: none;
                    }
                }
            }
        }
    }
</style>
