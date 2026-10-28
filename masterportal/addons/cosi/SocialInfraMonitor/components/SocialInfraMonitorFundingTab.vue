<script>
import BarList from "./SocialInfraMonitorBarList.vue";
import SizeLegend from "./SocialInfraMonitorSizeLegend.vue";
import {ACCENT_COLOR, CATEGORY_BY_KEY, FUNDED_KEYS, PAID_COLOR, SPENT_COLOR} from "../utils/categories.js";
import {areaRadius, formatEuro, legendValues} from "../utils/format.js";
import {RADII} from "../utils/mapStyles.js";

const T = "additional:modules.tools.cosi.socialInfraMonitor.funding.";

/**
 * "Where does the money flow?" — map symbols sized by funding, Träger networks,
 * and the Stadtteil comparison of where money is paid vs. where it is spent.
 */
export default {
    name: "SocialInfraMonitorFundingTab",
    components: {BarList, SizeLegend},
    props: {
        sites: {
            type: Array,
            required: true
        },
        districts: {
            type: Array,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        showAllNetworks: {
            type: Boolean,
            required: true
        },
        selectedTraegerId: {
            type: String,
            default: null
        },
        coloring: {
            type: String,
            required: true
        },
        coloringLegend: {
            type: Array,
            required: true
        },
        maxEuro: {
            type: Number,
            required: true
        }
    },
    emits: ["update:categories", "update:showAllNetworks", "update:selectedTraegerId", "update:coloring", "zoom-traeger", "zoom-district"],
    data () {
        return {
            fundedKeys: FUNDED_KEYS,
            accent: ACCENT_COLOR,
            paidColor: PAID_COLOR,
            spentColor: SPENT_COLOR
        };
    },
    computed: {
        visibleSites () {
            return this.sites.filter(site => FUNDED_KEYS.includes(site.kategorie) && this.categories.includes(site.kategorie));
        },
        totals () {
            return {
                euro: this.visibleSites.reduce((sum, site) => sum + (site.foerderung_standort_eur || 0), 0),
                traeger: new Set(this.visibleSites.map(site => site.traeger_id)).size,
                sites: this.visibleSites.length
            };
        },
        legend () {
            return legendValues(this.maxEuro).map(value => ({
                value,
                radius: areaRadius(value, this.maxEuro, RADII.fundingMax, RADII.fundingMin),
                label: formatEuro(value)
            }));
        },
        traeger () {
            if (!this.selectedTraegerId) {
                return null;
            }
            const sites = this.sites.filter(site => site.traeger_id === this.selectedTraegerId),
                  main = sites.find(site => site.rolle !== "Standort") || sites[0];

            if (!main) {
                return null;
            }
            return {
                name: main.traeger,
                address: main.zahlungsadresse,
                total: main.foerderung_traeger_eur,
                programmes: main.foerderprogramme,
                funders: main.foerdergeber,
                year: main.foerderjahr,
                count: sites.length,
                rows: [...sites]
                    .sort((a, b) => b.foerderung_standort_eur - a.foerderung_standort_eur)
                    .map(site => ({
                        id: site.id,
                        label: site.einrichtung,
                        sublabel: `${site.angebotstyp} · ${site.stadtteil}`,
                        value: site.foerderung_standort_eur,
                        valueLabel: `${formatEuro(site.foerderung_standort_eur)} (${Math.round(site.foerderung_standort_eur / main.foerderung_traeger_eur * 100)} %)`,
                        color: CATEGORY_BY_KEY[site.kategorie].color,
                        badge: site.rolle === "Hauptsitz" ? this.$t(T + "mainSite") : ""
                    }))
            };
        },
        districtRows () {
            return [...this.districts]
                .sort((a, b) => b.demo_foerd_wirkungsort_eur - a.demo_foerd_wirkungsort_eur)
                .map(row => ({
                    name: row.stadtteil,
                    paid: row.demo_foerd_zahladresse_eur,
                    spent: row.demo_foerd_wirkungsort_eur,
                    saldo: row.demo_foerd_saldo_eur,
                    perU18: row.demo_foerd_je_u18_eur
                }));
        },
        districtMax () {
            return Math.max(...this.districtRows.flatMap(row => [row.paid, row.spent]), 1);
        }
    },
    methods: {
        formatEuro,
        color (key) {
            return CATEGORY_BY_KEY[key].color;
        },
        toggleCategory (key) {
            const next = this.categories.includes(key)
                ? this.categories.filter(item => item !== key)
                : [...this.categories, key];

            this.$emit("update:categories", next);
        },
        barWidth (value) {
            return `${Math.max(0.5, value / this.districtMax * 70)}%`;
        },
        selectSite (siteId) {
            const site = this.sites.find(item => item.id === siteId);

            if (site) {
                this.$emit("zoom-traeger", site.traeger_id, site.id);
            }
        }
    }
};
</script>

<template lang="html">
    <div class="sim-funding">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <button
                v-for="key in fundedKeys"
                :key="key"
                type="button"
                class="btn btn-sm sim-chip"
                :class="{active: categories.includes(key)}"
                :aria-pressed="categories.includes(key)"
                @click="toggleCategory(key)"
            >
                <span
                    class="sim-swatch"
                    :style="{background: color(key)}"
                />
                {{ $t(`additional:modules.tools.cosi.socialInfraMonitor.categories.${key}`) }}
            </button>
            <div class="form-check form-switch ms-auto mb-0">
                <input
                    id="sim-show-all-networks"
                    class="form-check-input"
                    type="checkbox"
                    :checked="showAllNetworks"
                    @change="$emit('update:showAllNetworks', $event.target.checked)"
                >
                <label
                    class="form-check-label small"
                    for="sim-show-all-networks"
                >{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.showAllNetworks") }}</label>
            </div>
        </div>

        <div class="row g-2 mb-3">
            <div class="col-4">
                <div class="sim-tile">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.total") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatEuro(totals.euro) }}
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="sim-tile">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.traeger") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ totals.traeger }}
                    </div>
                </div>
            </div>
            <div class="col-4">
                <div class="sim-tile">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.sites") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ totals.sites }}
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap align-items-end gap-4 mb-3">
            <SizeLegend
                :items="legend"
                :title="$t('additional:modules.tools.cosi.socialInfraMonitor.funding.legendSize')"
            />
            <div class="small text-secondary">
                <svg
                    width="30"
                    height="10"
                    aria-hidden="true"
                    class="me-1"
                >
                    <line
                        x1="1"
                        y1="5"
                        x2="29"
                        y2="5"
                        :stroke="accent"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
                {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.legendLink") }}
            </div>
        </div>

        <div
            v-if="traeger"
            class="sim-card mb-4"
        >
            <div class="d-flex align-items-start gap-2 mb-2">
                <div class="me-auto">
                    <div class="sim-card-kicker">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.traegerKicker") }}
                    </div>
                    <h5 class="sim-card-title">
                        {{ traeger.name }}
                    </h5>
                </div>
                <button
                    type="button"
                    class="btn-close"
                    :aria-label="$t('additional:modules.tools.cosi.socialInfraMonitor.clearSelection')"
                    @click="$emit('update:selectedTraegerId', null)"
                />
            </div>
            <div class="row g-2 mb-2">
                <div class="col-6">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.traegerTotal", {year: traeger.year}) }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatEuro(traeger.total) }}
                    </div>
                </div>
                <div class="col-6">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.paidTo") }}
                    </div>
                    <div class="small">
                        <i class="bi bi-bank me-1" />{{ traeger.address }}
                    </div>
                </div>
            </div>
            <div class="small text-secondary mb-2">
                {{ traeger.programmes }} · {{ traeger.funders }}
            </div>
            <div class="sim-tile-label mb-1">
                {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.spentAt", {count: traeger.count}) }}
            </div>
            <BarList
                :rows="traeger.rows"
                @select="selectSite"
            />
            <button
                type="button"
                class="btn btn-outline-secondary btn-sm mt-2"
                @click="$emit('zoom-traeger', selectedTraegerId)"
            >
                <i class="bi bi-zoom-in me-1" />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.zoomTraeger") }}
            </button>
        </div>
        <p
            v-else
            class="small text-secondary mb-4"
        >
            <i class="bi bi-hand-index me-1" />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.hint") }}
        </p>

        <h6 class="sim-section-title">
            {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.districtsTitle") }}
        </h6>
        <div class="d-flex align-items-center gap-2 mb-2">
            <label
                class="small text-secondary mb-0"
                for="sim-district-coloring"
            >{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.coloring") }}</label>
            <select
                id="sim-district-coloring"
                class="form-select form-select-sm w-auto"
                :value="coloring"
                @change="$emit('update:coloring', $event.target.value)"
            >
                <option value="none">
                    {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.coloringNone") }}
                </option>
                <option value="saldo">
                    {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.coloringSaldo") }}
                </option>
                <option value="perU18">
                    {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.coloringPerU18") }}
                </option>
            </select>
        </div>
        <div
            v-if="coloringLegend.length"
            class="d-flex flex-wrap gap-2 small text-secondary mb-3"
        >
            <span
                v-for="item in coloringLegend"
                :key="item.color"
                class="d-inline-flex align-items-center gap-1"
            >
                <span
                    class="sim-swatch square"
                    :style="{background: item.color}"
                />{{ item.label }}
            </span>
        </div>

        <div class="d-flex gap-3 small text-secondary mb-1">
            <span class="d-inline-flex align-items-center gap-1">
                <span
                    class="sim-swatch square"
                    :style="{background: paidColor}"
                />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.seriesPaid") }}
            </span>
            <span class="d-inline-flex align-items-center gap-1">
                <span
                    class="sim-swatch square"
                    :style="{background: spentColor}"
                />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.seriesSpent") }}
            </span>
        </div>
        <button
            v-for="row in districtRows"
            :key="row.name"
            type="button"
            class="sim-district-row"
            @click="$emit('zoom-district', row.name)"
        >
            <span class="d-flex justify-content-between align-items-baseline">
                <span class="fw-semibold">{{ row.name }}</span>
                <span class="small text-secondary">
                    <i :class="row.saldo >= 0 ? 'bi bi-box-arrow-in-down-right' : 'bi bi-box-arrow-up-right'" />
                    {{ row.saldo >= 0 ? "+" : "−" }}{{ formatEuro(Math.abs(row.saldo)) }}
                    {{ row.saldo >= 0 ? $t("additional:modules.tools.cosi.socialInfraMonitor.funding.inflow") : $t("additional:modules.tools.cosi.socialInfraMonitor.funding.outflow") }}
                </span>
            </span>
            <span class="sim-pair">
                <span
                    class="sim-hbar"
                    :style="{width: barWidth(row.paid), background: paidColor}"
                />
                <span class="sim-hbar-value">{{ formatEuro(row.paid) }}</span>
            </span>
            <span class="sim-pair">
                <span
                    class="sim-hbar"
                    :style="{width: barWidth(row.spent), background: spentColor}"
                />
                <span class="sim-hbar-value">{{ formatEuro(row.spent) }} · {{ formatEuro(row.perU18) }} {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.perU18Short") }}</span>
            </span>
        </button>
        <p class="small text-secondary mt-2 mb-0">
            {{ $t("additional:modules.tools.cosi.socialInfraMonitor.funding.saldoExplain") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    .sim-district-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        padding: 6px 8px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        text-align: left;
        &:hover, &:focus-visible {
            background: rgba(60, 95, 148, 0.08);
        }
    }
    .sim-pair {
        display: flex;
        align-items: center;
    }
    .sim-hbar {
        height: 8px;
        border-radius: 0 4px 4px 0;
    }
    .sim-hbar-value {
        margin-left: 6px;
        font-size: 12px;
        color: #52514e;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }
</style>
