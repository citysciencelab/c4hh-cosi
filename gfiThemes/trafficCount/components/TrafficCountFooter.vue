<script>
export default {
    name: "TrafficCountFooter",
    props: {
        currentTabId: {
            type: String,
            required: true
        },
        api: {
            type: Object,
            default: null
        },
        thingId: {
            type: [String, Number],
            default: ""
        },
        meansOfTransport: {
            type: String,
            default: ""
        }
    },
    emits: ["resetTab"],
    data () {
        return {
            customStyle: {},
            isMqttLive: true,
            statusHandler: null
        };
    },
    computed: {
        indication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.notice");
        },

        autoUpdateNote: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.autoUpdateNote");
        },

        tableIndication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign");
        }
    },
    watch: {
        // When the gfi window switched with arrow, reset the live status
        thingId: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.isMqttLive = true;
                }
            },
            immediate: true,
            deep: true
        },

        meansOfTransport: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.isMqttLive = true;
                }
            },
            immediate: true
        },

        currentTabId: function (newVal) {
            if (newVal !== "info" && newVal !== "downloads") {
                this.fixIndicationPosition();
            }
        }
    },
    mounted: function () {
        this.statusHandler = (status) => {
            this.isMqttLive = status;
        };

        if (typeof this.api?.api?.onMqttStatusChange === "function") {
            this.api.api.onMqttStatusChange(this.statusHandler);
        }
    },
    beforeUnmount: function () {
        if (typeof this.api?.api?.offMqttStatusChange === "function" && this.statusHandler) {
            this.api.api.offMqttStatusChange(this.statusHandler);
        }
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
        }
    }
};
</script>

<template>
    <div>
        <div
            v-if="currentTabId !== 'info' && currentTabId !== 'downloads'"
            class="tableIndication"
            :style="customStyle"
        >
            * {{ tableIndication }}
        </div>
        <div
            v-if="currentTabId !== 'info' && currentTabId !== 'downloads'"
            class="trucksStatusIndication"
            :style="customStyle"
        >
            {{ $t("additional:modules.tools.gfi.themes.trafficCount.trucksStatus") }}
        </div>
        <div
            v-if="currentTabId !== 'info' && currentTabId !== 'downloads'"
            class="indication"
            :style="customStyle"
        >
            {{ indication }}
        </div>
        <div
            v-if="currentTabId !== 'downloads'"
            class="footer-main-content"
        >
            <div
                v-if="currentTabId !== 'info'"
                class="action-row"
            >
                <div class="reset-container">
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="reset"
                    >
                        {{ $t("additional:modules.tools.gfi.themes.trafficCount.reset") }}
                    </button>
                </div>
            </div>
            <div
                v-if="!isMqttLive"
                class="indication last-line mt-2 mqtt-warning"
                :style="customStyle"
            >
                <i class="bi bi-exclamation-triangle-fill pe-1" />
                {{ autoUpdateNote }}
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/variables";
    .tableIndication, .trucksStatusIndication, .indication {
        font-size: 10px;
    }
    .mqtt-warning {
        color: $danger;
        font-weight: bold;
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

    .footer-main-content {
        width: 100%;
    }

    .action-row {
        width: 100%;
    }

    .last-line {
        clear: both;
        display: block;
        width: 100%;
        padding-top: 10px;
    }

    table {
        margin-bottom: 0;
        .text-right {
            text-align: right;
        }
        &:not(.info) {
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
