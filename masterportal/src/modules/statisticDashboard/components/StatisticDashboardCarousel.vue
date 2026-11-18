<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import {mapGetters, mapMutations} from "vuex";
import {Popover} from "bootstrap";

export default {
    name: "StatisticDashboardCarousel",
    components: {
        IconButton
    },
    data () {
        return {
            indexSelectedStatistics: 0
        };
    },
    computed: {
        ...mapGetters("Modules/StatisticDashboard", [
            "chosenStatisticName",
            "selectedDatesValues",
            "selectedReferenceData",
            "selectedRegionsValues",
            "selectedStatistics"
        ]),

        isStatisticsSelected () {
            return this.selectedDatesValues.length > 0 && this.selectedRegionsValues.length > 0 && Object.keys(this.selectedStatistics)?.length > 1;
        },

        /**
         * Gets if the reference subtitle is defined.
         * @returns {Boolean} true if the reference subtitle is defined, false otherwise.
         */
        referenceSubTitle () {
            if (typeof this.selectedReferenceData === "undefined") {
                return false;
            }

            return true;
        },

        /**
         * Gets the total number of statistics.
         * @returns {Number} The total number of statistics.
         */
        totalStatistics () {
            return Object.keys(this.selectedStatistics)?.length;
        }
    },
    watch: {
        /**
         * Watches for changes of chosenStatisticName to set the right index.
         * @param {val} string - The chosen statisticName.
         * @returns {void}
         */
        chosenStatisticName: {
            handler (val) {
                this.indexSelectedStatistics = Object.keys(this.selectedStatistics).findIndex(index => this.selectedStatistics[index].name === val);
            },
            immediate: true
        }
    },
    mounted () {
        this.initializePopovers();
    },
    methods: {
        ...mapMutations("Modules/StatisticDashboard", [
            "setChosenStatisticName"
        ]),

        /**
         * Initializes Bootstrap popovers after their trigger elements are rendered.
         * @returns {void}
         */
        initializePopovers () {
            const popoverTriggerList = document.querySelectorAll(
                "[data-bs-toggle='popover']"
            );

            popoverTriggerList.forEach((element) => Popover.getOrCreateInstance(element));
        },

        /**
         * Sets indexSelectedStatistics after clicking previous arrow.
         * @param {Number} index - The current indexSelectedStatistics.
         * @param {Object} selectedStatistics - The selected statistics.
         * @returns {void}
         */
        prevStatistic (index, selectedStatistics) {
            if (!isObject(selectedStatistics) || !Object.keys(selectedStatistics).length) {
                return;
            }

            this.indexSelectedStatistics = index - 1 >= 0 ? index - 1 : Object.keys(selectedStatistics).length + index - 1;
            this.setChosenStatisticName(selectedStatistics[Object.keys(selectedStatistics)[this.indexSelectedStatistics]]?.name);
        },
        /**
         * Sets indexSelectedStatistics after clicking next arrow.
         * @param {Number} index - The current indexSelectedStatistics.
         * @param {Object} selectedStatistics - The selected statistics.
         * @returns {void}
         */
        nextStatistic (index, selectedStatistics) {
            if (!isObject(selectedStatistics) || !Object.keys(selectedStatistics).length) {
                return;
            }

            this.indexSelectedStatistics = index + 1 < Object.keys(selectedStatistics).length ? index + 1 : 0;
            this.setChosenStatisticName(selectedStatistics[Object.keys(selectedStatistics)[this.indexSelectedStatistics]]?.name);
        },
        /**
         * Sets the chosen statistic name and index from select.
         * @param {Object} evt - The click event in select.
         * @returns {void}
         */
        setChosenStatisticFromSelect (evt) {
            if (evt?.target?.value) {
                this.setChosenStatisticName(evt.target.value);
                this.indexSelectedStatistics = evt.target.selectedIndex;
            }
        }
    }
};
</script>

<template>
    <div
        v-if="isStatisticsSelected"
        class="container static-name mt-3 mb-3 border-1 border rounded-2 p-3"
    >
        <div class="statistic-name d-flex flex-row justify-content-between align-items-center">
            <IconButton
                class="slider-control btn-light bg-transparent mx-3"
                :aria="$t('common:modules.statisticDashboard.button.arrowLeft')"
                icon="bi bi-chevron-left"
                :interaction="() => prevStatistic(indexSelectedStatistics, selectedStatistics)"
            />
            <div class="col col-auto">
                <span>
                    {{ $t('common:modules.statisticDashboard.carouselStatistics', { index: indexSelectedStatistics + 1, total: totalStatistics }) }}
                </span>
                <span
                    class="d-flex align-items-center justify-content-center name"
                >
                    <button
                        type="button"
                        class="btn btn-link p-0 text-dark border-0 me-2"
                        tabindex="0"
                        data-bs-toggle="popover"
                        data-bs-placement="bottom"
                        data-bs-trigger="focus"
                        :data-bs-content="$t('common:modules.statisticDashboard.label.chooseSatistics')"
                    >
                        <i class="bi bi-info-circle" />
                    </button>
                    <select
                        id="statistic-list"
                        ref="statistic-list"
                        class="form-select"
                        @change="setChosenStatisticFromSelect($event)"
                    >
                        <option
                            v-for="index in Object.keys(selectedStatistics).length"
                            :key="index - 1"
                            :value="selectedStatistics[Object.keys(selectedStatistics)[index - 1]]?.name"
                            :selected="chosenStatisticName === selectedStatistics[Object.keys(selectedStatistics)[index - 1]]?.name"
                        >
                            {{ selectedStatistics[Object.keys(selectedStatistics)[index - 1]]?.name }}
                        </option>
                    </select>
                </span>
                <span
                    v-if="referenceSubTitle"
                    class="text-center badge"
                >
                    <span>{{ $t('common:modules.statisticDashboard.reference.active') }}</span>
                </span>
            </div>
            <IconButton
                class="slider-control btn-light bg-transparent mx-3"
                :aria="$t('common:modules.statisticDashboard.button.arrowRight')"
                icon="bi bi-chevron-right"
                :interaction="() => nextStatistic(indexSelectedStatistics, selectedStatistics)"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
select {
    border: none;
    outline: none;
    text-align: left;
    text-align-last: center;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    white-space: normal;
    height: auto;
    min-height: 38px;
    text-overflow: clip;
    &:hover, &:focus {
        border: inherit;
        outline: inherit;
    }
}

.badge {
    color: white;
    background-color: $secondary;
}

.statistic-name {
    text-align: center;
    width: 100%;
    .col-auto {
        min-width: 0;
        flex: 1;
    }
    .name {
        font-family: $font_family_accent;
        font-size: $font_size_big;
        cursor: pointer;
    }
}

.statistic-name-subtitle {
    font-family: $font_family_accent;
    font-size: $font_size_sm;
    display: block;
}
</style>
