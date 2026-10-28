<script>
const LABEL_GAP = 12;

/**
 * Nested-circle legend for area-proportional map symbols: circles share a
 * baseline, a hairline leads from each top to its value.
 */
export default {
    name: "SocialInfraMonitorSizeLegend",
    props: {
        /** @type {Array<{value: Number, radius: Number, label: String}>} ascending */
        items: {
            type: Array,
            required: true
        },
        title: {
            type: String,
            default: ""
        },
        /** "disc" = filled like the funding symbol, "ring" = outlined like the visits ring */
        variant: {
            type: String,
            default: "disc"
        }
    },
    computed: {
        maxRadius () {
            return Math.max(...this.items.map(item => item.radius), 1);
        },
        width () {
            return this.maxRadius * 2 + 96;
        },
        height () {
            return this.maxRadius * 2 + 4 + this.labelOverflow;
        },
        baseline () {
            return this.maxRadius * 2 + 2;
        },
        offsetY () {
            return this.labelOverflow;
        },
        // Draw the largest first so smaller circles sit on top.
        /**
         * Circles largest first (so smaller ones sit on top), each with a label
         * position. Small symbols have tops only a few px apart, so labels are
         * pushed up to keep LABEL_GAP between them and the leader bends to reach.
         * @returns {Object[]} Circles with top and labelY.
         */
        circles () {
            const placed = [];
            let previous = Infinity;

            this.items.forEach(item => {
                const top = this.baseline - item.radius * 2,
                      labelY = Math.min(top, previous - LABEL_GAP);

                placed.push({...item, top, labelY});
                previous = labelY;
            });
            return placed.reverse();
        },
        labelOverflow () {
            return Math.max(0, ...this.circles.map(item => -item.labelY + 6));
        }
    }
};
</script>

<template lang="html">
    <figure class="sim-size-legend mb-0">
        <figcaption
            v-if="title"
            class="sim-legend-title"
        >
            {{ title }}
        </figcaption>
        <svg
            :width="width"
            :height="height"
            role="img"
            :aria-label="title + ': ' + items.map(item => item.label).join(', ')"
        >
            <g
                v-for="item in circles"
                :key="item.value"
                :transform="`translate(0, ${offsetY})`"
            >
                <circle
                    :cx="maxRadius + 1"
                    :cy="baseline - item.radius"
                    :r="item.radius"
                    :class="variant"
                />
                <polyline
                    :points="`${maxRadius + 1},${item.top} ${maxRadius * 2 + 4},${item.top} ${maxRadius * 2 + 10},${item.labelY}`"
                    class="leader"
                />
                <text
                    :x="maxRadius * 2 + 14"
                    :y="item.labelY"
                    dominant-baseline="middle"
                >{{ item.label }}</text>
            </g>
        </svg>
    </figure>
</template>

<style lang="scss" scoped>
    .sim-size-legend {
        svg {
            overflow: visible;
        }
        circle.disc {
            fill: rgba(11, 11, 11, 0.06);
            stroke: #898781;
            stroke-width: 1;
        }
        circle.ring {
            fill: none;
            stroke: #898781;
            stroke-width: 2;
        }
        .leader {
            fill: none;
            stroke: #c3c2b7;
            stroke-width: 1;
        }
        text {
            font-size: 11px;
            fill: #52514e;
        }
    }
</style>
