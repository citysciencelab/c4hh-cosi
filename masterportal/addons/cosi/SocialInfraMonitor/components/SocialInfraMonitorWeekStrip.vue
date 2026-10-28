<script>
import {MINUTES_PER_DAY, splitMinute, wrapMinute} from "../utils/openingHours.js";

/**
 * One facility's opening hours as seven day rows on a 0–24 h axis.
 */
export default {
    name: "SocialInfraMonitorWeekStrip",
    props: {
        /** Parsed opening hours, [start, end] in minutes of the week. */
        intervals: {
            type: Array,
            required: true
        },
        color: {
            type: String,
            required: true
        },
        minute: {
            type: Number,
            default: null
        },
        dayLabels: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            width: 420,
            rowHeight: 10,
            rowGap: 5,
            labelWidth: 26,
            axisHeight: 16
        };
    },
    computed: {
        plotWidth () {
            return this.width - this.labelWidth - 6;
        },
        height () {
            return 7 * (this.rowHeight + this.rowGap) + this.axisHeight;
        },
        // Cut every interval at midnight so each bar lives in one day row.
        bars () {
            const bars = [];

            this.intervals.forEach(([start, end]) => {
                for (let s = start; s < end;) {
                    const day = Math.floor(s / MINUTES_PER_DAY),
                          dayEnd = (day + 1) * MINUTES_PER_DAY,
                          e = Math.min(end, dayEnd);

                    bars.push({day: day % 7, from: s % MINUTES_PER_DAY, to: e - day * MINUTES_PER_DAY});
                    s = e;
                }
            });
            return bars;
        },
        cursor () {
            if (this.minute === null) {
                return null;
            }
            const m = wrapMinute(this.minute);

            return {day: splitMinute(m).day, at: m % MINUTES_PER_DAY};
        }
    },
    mounted () {
        this.observer = new ResizeObserver(entries => {
            this.width = Math.round(entries[0].contentRect.width) || this.width;
        });
        this.observer.observe(this.$refs.root);
    },
    beforeUnmount () {
        this.observer?.disconnect();
    },
    methods: {
        x (minuteOfDay) {
            return this.labelWidth + minuteOfDay / MINUTES_PER_DAY * this.plotWidth;
        },
        rowY (day) {
            return day * (this.rowHeight + this.rowGap);
        }
    }
};
</script>

<template lang="html">
    <div
        ref="root"
        class="sim-week-strip"
    >
        <svg
            :width="width"
            :height="height"
            aria-hidden="true"
        >
            <g
                v-for="(label, day) in dayLabels"
                :key="label"
            >
                <text
                    :x="0"
                    :y="rowY(day) + rowHeight / 2"
                    dominant-baseline="middle"
                    class="tick"
                >{{ label }}</text>
                <rect
                    :x="x(0)"
                    :y="rowY(day)"
                    :width="plotWidth"
                    :height="rowHeight"
                    class="track"
                />
            </g>
            <rect
                v-for="(bar, i) in bars"
                :key="i"
                :x="x(bar.from)"
                :y="rowY(bar.day)"
                :width="Math.max(1, x(bar.to) - x(bar.from))"
                :height="rowHeight"
                :fill="color"
                rx="2"
            />
            <line
                v-if="cursor"
                :x1="x(cursor.at)"
                :x2="x(cursor.at)"
                :y1="rowY(cursor.day) - 3"
                :y2="rowY(cursor.day) + rowHeight + 3"
                class="cursor"
            />
            <text
                v-for="hour in [0, 6, 12, 18, 24]"
                :key="hour"
                :x="x(hour * 60)"
                :y="height - 3"
                :text-anchor="hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'"
                class="tick"
            >{{ hour }}</text>
        </svg>
    </div>
</template>

<style lang="scss" scoped>
    .sim-week-strip svg {
        display: block;
    }
    .track {
        fill: #f0efec;
    }
    .tick {
        font-size: 11px;
        fill: #898781;
    }
    .cursor {
        stroke: #0b0b0b;
        stroke-width: 1.5;
    }
</style>
