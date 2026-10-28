<script>
import BarList from "./SocialInfraMonitorBarList.vue";
import SizeLegend from "./SocialInfraMonitorSizeLegend.vue";
import {CATEGORY_BY_KEY, FUNDED_KEYS} from "../utils/categories.js";
import {areaRadius, euroPerVisit, formatEuro, formatNumber, legendValues} from "../utils/format.js";
import {RADII} from "../utils/mapStyles.js";

/**
 * "How many people do we reach?" — weekly visits against the money spent per
 * site, and a hand-over to the Erreichbarkeitsanalyse for the catchment.
 */
export default {
    name: "SocialInfraMonitorReachTab",
    components: {BarList, SizeLegend},
    props: {
        sites: {
            type: Array,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        selectedId: {
            type: String,
            default: null
        },
        sort: {
            type: String,
            required: true
        },
        maxVisits: {
            type: Number,
            required: true
        },
        maxEuro: {
            type: Number,
            required: true
        }
    },
    emits: ["update:categories", "update:selectedId", "update:sort", "open-accessibility", "zoom-site"],
    data () {
        return {
            fundedKeys: FUNDED_KEYS
        };
    },
    computed: {
        funded () {
            return this.sites
                .filter(site => FUNDED_KEYS.includes(site.kategorie) && this.categories.includes(site.kategorie))
                .map(site => ({...site, euroPerVisit: euroPerVisit(site.foerderung_standort_eur, site.besuche_woche)}));
        },
        totals () {
            const visits = this.funded.reduce((sum, site) => sum + (site.besuche_woche || 0), 0),
                  euro = this.funded.reduce((sum, site) => sum + (site.foerderung_standort_eur || 0), 0);

            return {visits, euroPerVisit: euroPerVisit(euro, visits)};
        },
        ringLegend () {
            return legendValues(this.maxVisits).map(value => ({
                value,
                radius: areaRadius(value, this.maxVisits, RADII.reachRingMax, RADII.reachRingMin),
                label: formatNumber(value)
            }));
        },
        discLegend () {
            return legendValues(this.maxEuro).map(value => ({
                value,
                radius: areaRadius(value, this.maxEuro, RADII.reachDiscMax, RADII.reachDiscMin),
                label: formatEuro(value)
            }));
        },
        rows () {
            const byVisits = this.sort === "visits",
                  sorted = [...this.funded].sort((a, b) => byVisits
                      ? b.besuche_woche - a.besuche_woche
                      : (a.euroPerVisit ?? Infinity) - (b.euroPerVisit ?? Infinity));

            return sorted.map(site => ({
                id: site.id,
                label: site.einrichtung,
                sublabel: `${site.angebotstyp} · ${site.stadtteil}`,
                value: byVisits ? site.besuche_woche : site.euroPerVisit,
                valueLabel: byVisits
                    ? this.$t("additional:modules.tools.cosi.socialInfraMonitor.reach.visitsValue", {value: formatNumber(site.besuche_woche)})
                    : this.$t("additional:modules.tools.cosi.socialInfraMonitor.reach.perVisitValue", {value: formatEuro(site.euroPerVisit)}),
                color: CATEGORY_BY_KEY[site.kategorie].color
            }));
        },
        selected () {
            const site = this.selectedId && this.funded.find(item => item.id === this.selectedId);

            return site ? {...site, color: CATEGORY_BY_KEY[site.kategorie].color} : null;
        }
    },
    methods: {
        formatEuro,
        formatNumber,
        color (key) {
            return CATEGORY_BY_KEY[key].color;
        },
        toggleCategory (key) {
            const next = this.categories.includes(key)
                ? this.categories.filter(item => item !== key)
                : [...this.categories, key];

            this.$emit("update:categories", next);
        },
        select (id) {
            this.$emit("update:selectedId", id);
            this.$emit("zoom-site", id);
        }
    }
};
</script>

<template lang="html">
    <div class="sim-reach">
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
        </div>

        <div class="row g-2 mb-3">
            <div class="col-6">
                <div class="sim-tile">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.totalVisits") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatNumber(totals.visits) }}
                    </div>
                </div>
            </div>
            <div class="col-6">
                <div class="sim-tile">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.avgPerVisit") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatEuro(totals.euroPerVisit) }}
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap align-items-end gap-4 mb-2">
            <SizeLegend
                :items="ringLegend"
                variant="ring"
                :title="$t('additional:modules.tools.cosi.socialInfraMonitor.reach.legendRing')"
            />
            <SizeLegend
                :items="discLegend"
                :title="$t('additional:modules.tools.cosi.socialInfraMonitor.reach.legendDisc')"
            />
        </div>
        <p class="small text-secondary mb-3">
            {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.howToRead") }}
        </p>

        <div
            v-if="selected"
            class="sim-card mb-3"
        >
            <div class="d-flex align-items-start gap-2 mb-2">
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
            <div class="row g-2 mb-2">
                <div class="col-4">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.visits") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatNumber(selected.besuche_woche) }}
                    </div>
                </div>
                <div class="col-4">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.funding") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatEuro(selected.foerderung_standort_eur) }}
                    </div>
                </div>
                <div class="col-4">
                    <div class="sim-tile-label">
                        {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.perVisit") }}
                    </div>
                    <div class="sim-tile-value">
                        {{ formatEuro(selected.euroPerVisit) }}
                    </div>
                </div>
            </div>
            <div class="small text-secondary mb-2">
                {{ selected.traeger }} · {{ selected.oeffnungszeiten_text }}
            </div>
            <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="$emit('open-accessibility', selected.id)"
            >
                <i class="bi bi-geo me-1" />{{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.catchment") }}
            </button>
            <div class="small text-secondary mt-2">
                {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.catchmentHint") }}
            </div>
        </div>

        <div class="d-flex align-items-center gap-2 mb-1">
            <span class="sim-tile-label me-auto">{{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.ranking") }}</span>
            <div
                class="btn-group btn-group-sm"
                role="group"
            >
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :class="{active: sort === 'visits'}"
                    @click="$emit('update:sort', 'visits')"
                >
                    {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.sortVisits") }}
                </button>
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    :class="{active: sort === 'perVisit'}"
                    @click="$emit('update:sort', 'perVisit')"
                >
                    {{ $t("additional:modules.tools.cosi.socialInfraMonitor.reach.sortPerVisit") }}
                </button>
            </div>
        </div>
        <BarList
            :rows="rows"
            :selected-id="selectedId"
            :limit="10"
            @select="select"
        />
    </div>
</template>
