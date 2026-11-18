<script>
import {mapGetters, mapMutations} from "vuex";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import StatisticDashboardCarousel from "./StatisticDashboardCarousel.vue";

export default {
    name: "StatisticDashboardControls",
    components: {
        NavTab,
        StatisticDashboardCarousel
    },
    props: {
        descriptions: {
            type: Array,
            required: false,
            default: () => []
        },
        showGrid: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["showChartTable", "showChartsInGrid"],
    data () {
        return {
            currentDescriptionIndex: 0,
            tabs: [
                {id: "tab-table", view: "table", label: "common:modules.statisticDashboard.tabs.table", icon: "bi-table", target: "#table-pane"},
                {id: "tab-diagram", view: "chart", label: "common:modules.statisticDashboard.tabs.diagram", icon: "bi-bar-chart", target: "#diagram-pane"},
                {id: "tab-map", view: "map", label: "common:modules.statisticDashboard.tabs.map", icon: "bi-map", target: "#map-pane"}
            ]
        };
    },
    computed: {
        ...mapGetters("Maps", ["projection"]),
        ...mapGetters("Modules/StatisticDashboard", [
            "chartTableToggle",
            "chosenStatisticName",
            "selectedDates",
            "selectedDatesValues",
            "selectedStatistics",
            "selectedReferenceData",
            "selectedRegions",
            "selectedRegionsValues"
        ]),
        /**
         * Checks if there is at least one description
         * @returns {Boolean} True if there is one otherwise false.
         */
        hasDescription () {
            if (this.descriptions.length === 0) {
                return false;
            }
            return true;
        },
        /**
         * Gets the title of the current description.
         * @returns {void}
         */
        titleDescription () {
            return this.descriptions[this.currentDescriptionIndex].title;
        },
        /**
         * Gets the content of the current description.
         * @returns {void}
         */
        contentDescription () {
            return this.descriptions[this.currentDescriptionIndex].content;
        },
        isStatisticsSelected () {
            return this.selectedDatesValues.length > 0 && this.selectedRegionsValues.length > 0 && Object.keys(this.selectedStatistics)?.length > 1;
        },
        showStatisticnameInChart () {
            return this.isStatisticsSelected && typeof this.chosenStatisticName === "string" && this.chosenStatisticName !== "" && this.chartTableToggle === "chart";
        }
    },
    methods: {
        ...mapMutations("Modules/StatisticDashboard", [
            "setChosenStatisticName"
        ]),
        /**
         * Sets the description index one higher.
         * If the index reaches the end of the descriptions,it is set back to the beginning.
         * @returns {void}
         */
        nextDescription () {
            if (this.currentDescriptionIndex < this.descriptions.length - 1) {
                this.currentDescriptionIndex++;
            }
            else {
                this.currentDescriptionIndex = 0;
            }
        },
        /**
         * Sets the description index one lower.
         * If the index reaches the beginning of the descriptions, it is set to the end again.
         * @returns {void}
         */
        prevDescription () {
            if (this.currentDescriptionIndex > 0) {
                this.currentDescriptionIndex--;
            }
            else {
                this.currentDescriptionIndex = this.descriptions.length - 1;
            }
        }
    }
};
</script>

<template>
    <div class="align-items-center justify-content-between mb-3 dashboard-controls">
        <!-- Descriptions -->
        <div
            v-if="hasDescription"
            class="flex-grow-1 pb-1 description"
        >
            <div class="hstack gap-1">
                <button
                    class="p-2 fs-5 lh-1 border-0 bg-transparent description-icons"
                    @click="prevDescription"
                    @keydown="prevDescription"
                >
                    <i class="bi bi-chevron-left" />
                </button>
                <p class="pe-2 fs-6 description-content">
                    {{ titleDescription }}<br>{{ contentDescription }}
                </p>
                <button
                    class="p-2 fs-5 lh-1 border-0 bg-transparent description-icons"
                    @click="nextDescription"
                    @keydown="nextDescription"
                >
                    <i class="bi bi-chevron-right" />
                </button>
            </div>
        </div>
        <div
            v-else
            class="flex-grow-1 pb-1 descriptions-placeholder"
        >
            <div
                class="gap-1 empty"
            />
        </div>
        <ul
            class="nav nav-tabs border-bottom-0 btn-table-diagram"
            role="tablist"
        >
            <NavTab
                v-for="tab in tabs"
                :id="tab.id"
                :key="tab.id"
                :label="$t(tab.label)"
                :icon="tab.icon"
                :active="chartTableToggle === tab.view"
                :target="tab.target"
                @click="$emit('showChartTable', tab.view)"
            />
        </ul>
        <div
            v-if="showStatisticnameInChart"
            class="back-overview"
            role="button"
            tabindex="0"
            @click="$emit('showChartsInGrid', true)"
            @keydown="$emit('showChartsInGrid', true)"
        >
            <button
                class="p-2 fs-5 lh-1 border-0 bg-transparent"
            >
                <i class="bi bi-chevron-left" />
            </button>
            <span>
                {{ $t('common:modules.statisticDashboard.backToOverview') }}
            </span>
        </div>
        <StatisticDashboardCarousel v-if="!showGrid && chartTableToggle !== 'map'" />
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
.dashboard-controls {
    .description {
        margin-top: 25px;
        .description-content {
            width: 350px;
        }
        .description-icons {
            opacity: 0.5;
        }
        .description-icons:hover {
            opacity: 1;
        }
    }
    .descriptions-placeholder {
         margin-top: 10px;
        .empty {
            width: 350px;
        }
    }
}

.btn-table-diagram {
    margin-top: 25px;
}

.difference-button {
    display: inline-block;
}

.toolbar-button-icon {
    font-size: $font_size_sm;
}

.vertical-divider {
    border-left: 1px solid $dark_grey;
    height: 35px;
}

.dropdown-menu {
    width: calc(60 * 47vw / 100);
    --bs-dropdown-zindex: 1100;
}

.btn-light {
    background-color: $light_grey;
    color: $light_grey_inactive_contrast;
    border-color: $light_grey;
}
.btn-light:hover {
    background-color: $primary;
    color: $black;
    border-color: $primary;
}

.btn {
    &.activated {
        background-color: $dark_blue;
        &:hover {
            background-color: $primary;
            color: $black;
            .badge {
            background-color: $secondary;
            color: $white;
            }
        }
    }
}

.badge {
    background-color: $primary;
    color: $black;
    --bs-badge-padding-y: 0.2rem;
    --bs-badge-padding-x: 0.7rem;
 }

.back-overview {
    font-size: 12px;
    cursor: pointer;
}
</style>
