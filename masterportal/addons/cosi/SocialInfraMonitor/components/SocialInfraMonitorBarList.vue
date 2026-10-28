<script>
/**
 * Thin horizontal bars with the value at the tip. Rows are clickable; the
 * colour dot carries identity, all text stays in text colours.
 */
export default {
    name: "SocialInfraMonitorBarList",
    props: {
        /** @type {Array<{id: String, label: String, sublabel: String, value: Number, valueLabel: String, color: String, badge: String}>} */
        rows: {
            type: Array,
            required: true
        },
        selectedId: {
            type: String,
            default: null
        },
        /** Show only the first n rows until expanded; 0 = all. */
        limit: {
            type: Number,
            default: 0
        }
    },
    emits: ["select"],
    data () {
        return {
            expanded: false
        };
    },
    computed: {
        max () {
            return Math.max(...this.rows.map(row => row.value || 0), 1);
        },
        visibleRows () {
            return this.limit && !this.expanded ? this.rows.slice(0, this.limit) : this.rows;
        }
    },
    methods: {
        /**
         * Bar length; the bar never takes the whole track so the value fits behind it.
         * @param {Number} value - The row value.
         * @returns {String} CSS width.
         */
        width (value) {
            return `${Math.max(0.5, (value || 0) / this.max * 72)}%`;
        }
    }
};
</script>

<template lang="html">
    <div class="sim-bar-list">
        <button
            v-for="row in visibleRows"
            :key="row.id"
            type="button"
            class="sim-bar-row"
            :class="{selected: row.id === selectedId}"
            @click="$emit('select', row.id)"
        >
            <span class="sim-bar-head">
                <span
                    class="sim-swatch"
                    :style="{background: row.color}"
                />
                <span class="sim-bar-label">{{ row.label }}</span>
                <span
                    v-if="row.badge"
                    class="badge rounded-pill sim-badge"
                >{{ row.badge }}</span>
            </span>
            <span
                v-if="row.sublabel"
                class="sim-bar-sublabel"
            >{{ row.sublabel }}</span>
            <span class="sim-bar-track">
                <span
                    class="sim-bar"
                    :style="{width: width(row.value), background: row.color}"
                />
                <span class="sim-bar-value">{{ row.valueLabel }}</span>
            </span>
        </button>
        <button
            v-if="limit && rows.length > limit"
            type="button"
            class="btn btn-link btn-sm px-0"
            @click="expanded = !expanded"
        >
            {{ expanded ? $t("additional:modules.tools.cosi.socialInfraMonitor.showLess") : $t("additional:modules.tools.cosi.socialInfraMonitor.showAll", {count: rows.length}) }}
        </button>
    </div>
</template>

<style lang="scss" scoped>
    .sim-bar-row {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 6px 8px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        text-align: left;
        &:hover, &:focus-visible {
            background: rgba(60, 95, 148, 0.08);
        }
        &.selected {
            background: rgba(60, 95, 148, 0.14);
        }
    }
    .sim-bar-head {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .sim-bar-label {
        font-size: 13px;
        color: #0b0b0b;
    }
    .sim-bar-sublabel {
        font-size: 11px;
        color: #52514e;
        margin-left: 16px;
    }
    .sim-badge {
        background: #3C5F94;
        font-size: 10px;
        font-weight: normal;
    }
    .sim-bar-track {
        display: flex;
        align-items: center;
        margin: 4px 0 0 16px;
    }
    .sim-bar {
        height: 8px;
        border-radius: 0 4px 4px 0;
    }
    .sim-bar-value {
        margin-left: 6px;
        font-size: 12px;
        color: #52514e;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }
</style>
