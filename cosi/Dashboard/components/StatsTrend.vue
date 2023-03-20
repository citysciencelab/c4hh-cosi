<script>
import {getTrendStyle, getTrend} from "../utils/trends";

export default {
    name: "StatsTrend",
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
        <template #activator="{ on, attrs }">
            <v-icon
                class="float-left"
                :style="getTrendStyle(dy)"
                v-bind="attrs"
                v-on="on"
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
