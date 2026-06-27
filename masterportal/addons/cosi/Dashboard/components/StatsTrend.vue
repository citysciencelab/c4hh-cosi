<script>
import {getTrendStyle, getTrend} from "../utils/trends";
import {VIcon} from "vuetify/components/VIcon";
import {VTooltip} from "vuetify/components/VTooltip";

export default {
    name: "StatsTrend",
    components: {
        VIcon,
        VTooltip
    },
    props: {
        item: {
            type: Object,
            required: true
        },
        header: {
            type: Object,
            required: true
        },
        currentTimestamp: {
            type: Number,
            default: undefined
        },
        timestampPrefix: {
            type: String,
            default: "jahr_"
        },
        currentLocale: {
            type: String,
            default: "de-DE"
        },
        tooltipOffset: {
            type: Number,
            default: 0
        },
        trendColors: {
            type: [String, Array],
            default: ""
        }
    },
    computed: {
        dy () {
            const timestamp = this.item.expanded ? this.item.years[0] : this.currentTimestamp;

            return this.getTrend(this.item[this.header.value], this.item.years, timestamp, this.timestampPrefix);
        }
    },
    methods: {
        getTrend,
        getTrendStyle
    }
};

</script>

<template>
    <v-tooltip
        left
        :nudge-top="60"
        :nudge-left="tooltipOffset"
    >
        <template #activator="{ props }">
            <v-icon
                class="float-left"
                :style="getTrendStyle(dy, trendColors)"
                v-bind="props"
            >
                mdi-arrow-right
            </v-icon>
        </template>
        <span>
            <small>{{ ((dy - 1) * 100).toLocaleString(currentLocale) }}%</small>
        </span>
    </v-tooltip>
</template>

<style lang="scss" scoped>
    .float-left {
        float: left;
    }
</style>
