<script>
import {MINUTES_PER_DAY, MINUTES_PER_WEEK, splitMinute} from "../utils/openingHours.js";

/**
 * Share of facilities open over the week, one line per category.
 *
 * Shares instead of counts: 126 Kitas against 15 family sites on one count axis
 * would flatten every category but one. Normalised to "% of the category open",
 * all four live on the same 0–100 % axis and the 8 o'clock wave of schools and
 * the afternoon wave of youth centres read side by side.
 *
 * Click or drag sets the time; hover shows the exact values.
 */
export default {
    name: "SocialInfraMonitorWeekChart",
    props: {
        /** @type {Array<{key: String, label: String, color: String, counts: Number[], total: Number}>} */
        series: {
            type: Array,
            required: true
        },
        minute: {
            type: Number,
            required: true
        },
        /** Slot length of the counts in minutes. */
        step: {
            type: Number,
            default: 15
        },
        dayLabels: {
            type: Array,
            required: true
        }
    },
    emits: ["update:minute"],
    data () {
        return {
            width: 480,
            height: 150,
            margin: {top: 8, right: 8, bottom: 20, left: 38},
            hoverMinute: null,
            dragging: false
        };
    },
    computed: {
        plotWidth () {
            return Math.max(10, this.width - this.margin.left - this.margin.right);
        },
        plotHeight () {
            return this.height - this.margin.top - this.margin.bottom;
        },
        paths () {
            return this.series.map(serie => ({
                key: serie.key,
                color: serie.color,
                d: serie.counts.map((count, i) => `${i ? "L" : "M"}${this.x(i * this.step).toFixed(1)},${this.y(this.share(serie, i)).toFixed(1)}`).join("")
            }));
        },
        days () {
            return this.dayLabels.map((label, day) => ({label, day}));
        },
        hover () {
            if (this.hoverMinute === null) {
                return null;
            }
            const {day, time} = splitMinute(this.hoverMinute),
                  slot = this.slotOf(this.hoverMinute),
                  left = this.x(this.hoverMinute);

            return {
                title: `${this.dayLabels[day]} ${time}`,
                rows: this.series.map(serie => ({
                    key: serie.key,
                    label: serie.label,
                    color: serie.color,
                    open: serie.counts[slot],
                    total: serie.total
                })),
                // keep the tooltip inside the chart
                left: Math.min(Math.max(left, 90), this.width - 90)
            };
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
        x (minute) {
            return this.margin.left + minute / MINUTES_PER_WEEK * this.plotWidth;
        },
        y (share) {
            return this.margin.top + (1 - share) * this.plotHeight;
        },
        share (serie, slot) {
            return serie.total ? serie.counts[slot] / serie.total : 0;
        },
        slotOf (minute) {
            return Math.min(Math.floor(minute / this.step), Math.ceil(MINUTES_PER_WEEK / this.step) - 1);
        },
        cursorY (serie) {
            return this.y(this.share(serie, this.slotOf(this.minute)));
        },
        /**
         * Pointer position -> minute of the week, snapped to the slot length.
         * @param {PointerEvent} event - The pointer event.
         * @returns {Number} The minute.
         */
        minuteAt (event) {
            const rect = this.$refs.svg.getBoundingClientRect(),
                  t = (event.clientX - rect.left - this.margin.left) / this.plotWidth,
                  minute = Math.min(Math.max(t, 0), 0.9999) * MINUTES_PER_WEEK;

            return Math.floor(minute / this.step) * this.step;
        },
        onDown (event) {
            this.dragging = true;
            this.$refs.svg.setPointerCapture(event.pointerId);
            this.$emit("update:minute", this.minuteAt(event));
        },
        onMove (event) {
            this.hoverMinute = this.minuteAt(event);
            if (this.dragging) {
                this.$emit("update:minute", this.hoverMinute);
            }
        },
        onUp (event) {
            this.dragging = false;
            this.$refs.svg.releasePointerCapture(event.pointerId);
        },
        onLeave () {
            if (!this.dragging) {
                this.hoverMinute = null;
            }
        },
        percent (open, total) {
            return total ? Math.round(open / total * 100) : 0;
        }
    },
    MINUTES_PER_DAY
};
</script>

<template lang="html">
    <div
        ref="root"
        class="sim-week-chart"
    >
        <svg
            ref="svg"
            :width="width"
            :height="height"
            role="img"
            :aria-label="$t('additional:modules.tools.cosi.socialInfraMonitor.hours.chartLabel')"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointerleave="onLeave"
        >
            <g class="grid">
                <line
                    v-for="level in [0, 0.5, 1]"
                    :key="'y' + level"
                    :x1="margin.left"
                    :x2="width - margin.right"
                    :y1="y(level)"
                    :y2="y(level)"
                    :class="{baseline: level === 0}"
                />
                <line
                    v-for="day in 6"
                    :key="'d' + day"
                    :x1="x(day * $options.MINUTES_PER_DAY)"
                    :x2="x(day * $options.MINUTES_PER_DAY)"
                    :y1="margin.top"
                    :y2="margin.top + plotHeight"
                />
            </g>
            <g class="ticks">
                <text
                    v-for="level in [0, 0.5, 1]"
                    :key="'t' + level"
                    :x="margin.left - 6"
                    :y="y(level)"
                    text-anchor="end"
                    dominant-baseline="middle"
                >{{ level * 100 }} %</text>
                <text
                    v-for="item in days"
                    :key="'l' + item.day"
                    :x="x(item.day * $options.MINUTES_PER_DAY + $options.MINUTES_PER_DAY / 2)"
                    :y="height - 5"
                    text-anchor="middle"
                >{{ item.label }}</text>
            </g>
            <path
                v-for="path in paths"
                :key="path.key"
                :d="path.d"
                :stroke="path.color"
                class="series"
            />
            <line
                v-if="hover"
                :x1="x(hoverMinute)"
                :x2="x(hoverMinute)"
                :y1="margin.top"
                :y2="margin.top + plotHeight"
                class="hover-line"
            />
            <line
                :x1="x(minute)"
                :x2="x(minute)"
                :y1="margin.top - 4"
                :y2="margin.top + plotHeight"
                class="cursor"
            />
            <circle
                v-for="serie in series"
                :key="'c' + serie.key"
                :cx="x(minute)"
                :cy="cursorY(serie)"
                r="4"
                :fill="serie.color"
                class="dot"
            />
        </svg>
        <div
            v-if="hover"
            class="sim-chart-tooltip"
            :style="{left: hover.left + 'px'}"
        >
            <div class="fw-semibold mb-1">
                {{ hover.title }}
            </div>
            <div
                v-for="row in hover.rows"
                :key="row.key"
                class="d-flex align-items-center gap-2"
            >
                <span
                    class="sim-swatch"
                    :style="{background: row.color}"
                />
                <span class="me-auto">{{ row.label }}</span>
                <span class="tabular">{{ percent(row.open, row.total) }} % ({{ row.open }}/{{ row.total }})</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .sim-week-chart {
        position: relative;
        width: 100%;
        user-select: none;
        svg {
            display: block;
            cursor: crosshair;
            touch-action: none;
        }
    }
    .grid line {
        stroke: #e1e0d9;
        stroke-width: 1;
        &.baseline {
            stroke: #c3c2b7;
        }
    }
    .ticks text {
        font-size: 11px;
        fill: #898781;
        font-variant-numeric: tabular-nums;
    }
    .series {
        fill: none;
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
    }
    .cursor {
        stroke: #0b0b0b;
        stroke-width: 1.5;
    }
    .hover-line {
        stroke: #898781;
        stroke-width: 1;
    }
    .dot {
        stroke: #ffffff;
        stroke-width: 2;
    }
    .sim-chart-tooltip {
        position: absolute;
        top: 0;
        transform: translate(-50%, -100%);
        min-width: 180px;
        padding: 6px 8px;
        background: #ffffff;
        border: 1px solid rgba(11, 11, 11, 0.1);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        font-size: 12px;
        color: #0b0b0b;
        pointer-events: none;
        z-index: 2;
        .tabular {
            font-variant-numeric: tabular-nums;
            color: #52514e;
        }
    }
</style>
