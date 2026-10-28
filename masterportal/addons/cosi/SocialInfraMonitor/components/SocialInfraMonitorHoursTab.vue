<script>
import WeekChart from "./SocialInfraMonitorWeekChart.vue";
import WeekStrip from "./SocialInfraMonitorWeekStrip.vue";
import {CATEGORIES, CATEGORY_BY_KEY} from "../utils/categories.js";
import {MINUTES_PER_DAY, MINUTES_PER_WEEK, isOpen, nextChange, splitMinute, weeklyProfile} from "../utils/openingHours.js";

const STEP = 15,
      DAY_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];

/**
 * "When is what open?" — a week clock with a slider, play button and the share
 * of each category open over the week.
 */
export default {
    name: "SocialInfraMonitorHoursTab",
    components: {WeekChart, WeekStrip},
    props: {
        sites: {
            type: Array,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        minute: {
            type: Number,
            required: true
        },
        playing: {
            type: Boolean,
            required: true
        },
        speed: {
            type: Number,
            required: true
        },
        selectedId: {
            type: String,
            default: null
        }
    },
    emits: ["update:minute", "update:categories", "update:speed", "update:selectedId", "toggle-play", "now"],
    data () {
        return {
            step: STEP,
            weekEnd: MINUTES_PER_WEEK - STEP,
            speeds: [1, 2, 4]
        };
    },
    computed: {
        dayShort () {
            return DAY_KEYS.map(key => this.$t(`additional:modules.tools.cosi.socialInfraMonitor.days.short.${key}`));
        },
        dayLong () {
            return DAY_KEYS.map(key => this.$t(`additional:modules.tools.cosi.socialInfraMonitor.days.long.${key}`));
        },
        clock () {
            const {day, time} = splitMinute(this.minute);

            return {day, label: `${this.dayLong[day]}, ${time}`};
        },
        // Static over the session: one profile per category, computed once.
        profiles () {
            return CATEGORIES.map(category => {
                const members = this.sites.filter(site => site.kategorie === category.key);

                return {
                    key: category.key,
                    color: category.color,
                    label: this.$t(`additional:modules.tools.cosi.socialInfraMonitor.categories.${category.key}`),
                    counts: weeklyProfile(members.map(site => site._intervals), STEP),
                    total: members.length,
                    members
                };
            });
        },
        series () {
            return this.profiles.filter(profile => this.categories.includes(profile.key));
        },
        openNow () {
            return this.profiles.map(profile => ({
                ...profile,
                open: profile.members.filter(site => isOpen(site._intervals, this.minute)).length
            }));
        },
        selected () {
            const site = this.selectedId && this.sites.find(item => item.id === this.selectedId);

            if (!site) {
                return null;
            }
            const change = nextChange(site._intervals, this.minute);
            let status = this.$t("additional:modules.tools.cosi.socialInfraMonitor.hours.neverOpen");

            if (change) {
                const {day, time} = splitMinute(change.at),
                      when = day === this.clock.day && change.at > this.minute % MINUTES_PER_WEEK ? time : `${this.dayShort[day]} ${time}`;

                status = change.open
                    ? this.$t("additional:modules.tools.cosi.socialInfraMonitor.hours.openUntil", {when})
                    : this.$t("additional:modules.tools.cosi.socialInfraMonitor.hours.closedUntil", {when});
            }
            return {
                ...site,
                color: CATEGORY_BY_KEY[site.kategorie].color,
                open: change?.open || false,
                status
            };
        }
    },
    methods: {
        setDay (day) {
            this.$emit("update:minute", day * MINUTES_PER_DAY + this.minute % MINUTES_PER_DAY);
        },
        toggleCategory (key) {
            const next = this.categories.includes(key)
                ? this.categories.filter(item => item !== key)
                : [...this.categories, key];

            this.$emit("update:categories", next);
        }
    }
};
</script>

<template lang="html">
    <div class="sim-hours">
        <div class="d-flex align-items-center gap-2 mb-2">
            <button
                type="button"
                class="btn btn-primary btn-sm sim-play"
                :aria-label="playing ? $t('additional:modules.tools.cosi.socialInfraMonitor.hours.pause') : $t('additional:modules.tools.cosi.socialInfraMonitor.hours.play')"
                @click="$emit('toggle-play')"
            >
                <i :class="playing ? 'bi bi-pause-fill' : 'bi bi-play-fill'" />
            </button>
            <div
                class="sim-clock me-auto"
                aria-live="polite"
            >
                {{ clock.label }}
            </div>
            <div
                class="btn-group btn-group-sm"
                role="group"
                :aria-label="$t('additional:modules.tools.cosi.socialInfraMonitor.hours.speed')"
            >
                <button
                    v-for="value in speeds"
                    :key="value"
                    type="button"
                    class="btn btn-outline-secondary"
                    :class="{active: speed === value}"
                    @click="$emit('update:speed', value)"
                >
                    {{ value }}×
                </button>
            </div>
            <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                :title="$t('additional:modules.tools.cosi.socialInfraMonitor.hours.nowTitle')"
                @click="$emit('now')"
            >
                {{ $t("additional:modules.tools.cosi.socialInfraMonitor.hours.now") }}
            </button>
        </div>

        <div
            class="btn-group btn-group-sm w-100 mb-3"
            role="group"
        >
            <button
                v-for="(label, day) in dayShort"
                :key="label"
                type="button"
                class="btn btn-outline-secondary"
                :class="{active: clock.day === day}"
                @click="setDay(day)"
            >
                {{ label }}
            </button>
        </div>

        <WeekChart
            :series="series"
            :minute="minute"
            :step="step"
            :day-labels="dayShort"
            @update:minute="$emit('update:minute', $event)"
        />
        <input
            type="range"
            class="form-range sim-range"
            min="0"
            :max="weekEnd"
            :step="step"
            :value="Math.floor(minute / step) * step"
            :aria-label="$t('additional:modules.tools.cosi.socialInfraMonitor.hours.slider')"
            :aria-valuetext="clock.label"
            @input="$emit('update:minute', Number($event.target.value))"
        >

        <div class="sim-tile-label mt-3 mb-1">
            {{ $t("additional:modules.tools.cosi.socialInfraMonitor.hours.openNow") }}
        </div>
        <div class="sim-category-list mb-3">
            <button
                v-for="item in openNow"
                :key="item.key"
                type="button"
                class="sim-category-row"
                :class="{off: !categories.includes(item.key)}"
                :aria-pressed="categories.includes(item.key)"
                @click="toggleCategory(item.key)"
            >
                <span
                    class="sim-swatch"
                    :style="{background: categories.includes(item.key) ? item.color : '#c3c2b7'}"
                />
                <span class="me-auto">{{ item.label }}</span>
                <span class="sim-count">{{ $t("additional:modules.tools.cosi.socialInfraMonitor.hours.openOf", {open: item.open, total: item.total}) }}</span>
            </button>
        </div>

        <div
            v-if="selected"
            class="sim-card"
        >
            <div class="d-flex align-items-start gap-2 mb-1">
                <div class="me-auto">
                    <div class="sim-card-kicker">
                        {{ selected.angebotstyp }} · {{ selected.stadtteil }}
                    </div>
                    <h5 class="sim-card-title">
                        {{ selected.einrichtung }}
                    </h5>
                </div>
                <button
                    type="button"
                    class="btn-close"
                    :aria-label="$t('additional:modules.tools.cosi.socialInfraMonitor.clearSelection')"
                    @click="$emit('update:selectedId', null)"
                />
            </div>
            <div class="small mb-2">
                <i
                    class="bi me-1"
                    :class="selected.open ? 'bi-door-open' : 'bi-door-closed'"
                />{{ selected.status }}
            </div>
            <WeekStrip
                :intervals="selected._intervals"
                :color="selected.color"
                :minute="minute"
                :day-labels="dayShort"
            />
            <div class="small text-secondary mt-2">
                {{ selected.oeffnungszeiten_text }} · {{ $t("additional:modules.tools.cosi.socialInfraMonitor.hours.perWeek", {hours: selected.oeffnungsstunden_woche}) }}
            </div>
        </div>
        <p
            v-else
            class="small text-secondary mb-0"
        >
            <i class="bi bi-hand-index me-1" />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.hours.hint") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    .sim-play {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        padding: 0;
        font-size: 18px;
        line-height: 1;
    }
    .sim-clock {
        font-size: 20px;
        font-weight: 600;
        color: #0b0b0b;
        font-variant-numeric: tabular-nums;
    }
    .sim-range {
        // align the thumb track with the chart's plot area (left margin 38px, right 8px)
        width: calc(100% - 46px);
        margin-left: 38px;
    }
    .sim-category-row {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 5px 8px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        font-size: 13px;
        color: #0b0b0b;
        text-align: left;
        &:hover, &:focus-visible {
            background: rgba(60, 95, 148, 0.08);
        }
        &.off {
            color: #898781;
        }
    }
    .sim-count {
        color: #52514e;
        font-variant-numeric: tabular-nums;
    }
</style>
