<script>
import CustomCard from "../../shared/modules/cards/components/CustomCard.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "CalculateRatioSelectionCard",
    components: {
        CustomCard,
        DropdownAutocomplete,
        InputText
    },
    props: {
        cardType: {
            type: String,
            required: false,
            default: "subjectData"
        },
        divisor: {
            type: String,
            required: false,
            default: "1"
        },
        factor: {
            type: String,
            required: false,
            default: "1"
        },
        id: {
            type: String,
            required: true
        },
        itemList: {
            type: Array,
            required: false,
            default: () => []
        },
        itemListSelected: {
            type: Array,
            required: false,
            default: () => []
        },
        numericalValues: {
            type: Array,
            required: false,
            default: () => []
        },
        numericalValuesSelected: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    emits: ["set-selected-items", "set-divisor", "set-factor", "set-numerical-values", "set-type-card"],
    data () {
        return {
            isCollapsed: true
        };
    },
    computed: {
        /**
         * Returns the icon class based on the card type.
         * @returns {String} Icon class.
         */
        cardTypeIcon () {
            return this.cardType === "statisticalData" ? "bi bi-bar-chart" : "bi bi-layers";
        }
    },
    methods: {
        /**
         * Toggles the collapse state.
         * @returns {void}
         */
        toggleCollapse () {
            this.isCollapsed = !this.isCollapsed;
        }
    }
};
</script>

<template lang="html">
    <CustomCard>
        <div class="d-flex flex-row mt-3 me-3">
            <div class="dropdown align-self-start mt-2 me-3">
                <button
                    class="btn btn-secondary dropdown-toggle rounded-3"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="true"
                >
                    <i
                        class="fs-5 me-2"
                        :class="cardTypeIcon"
                    />
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <button
                            class="dropdown-item"
                            @click="$emit('set-type-card', 'subjectData')"
                        >
                            <i class="bi bi-layers fs-5 me-3" />
                            {{ $t('additional:modules.tools.cosi.calculateRatio.subjectData') }}
                        </button>
                    </li>
                    <li>
                        <button
                            class="dropdown-item"
                            @click="$emit('set-type-card', 'statisticalData')"
                        >
                            <i class="bi bi-bar-chart fs-5 me-3" />
                            {{ $t('additional:modules.tools.cosi.calculateRatio.statData') }}
                        </button>
                    </li>
                </ul>
            </div>
            <div class="d-flex flex-column w-100">
                <template v-if="cardType === 'statisticalData'">
                    <Dropdown-Autocomplete
                        class="flex-grow-1"
                        :items="itemList"
                        :model-value="itemListSelected"
                        :label="$t('additional:modules.tools.cosi.calculateRatio.statData')"
                        @update:model-value="$emit('set-selected-items', [$event])"
                    />
                    <a
                        data-bs-toggle="collapse"
                        :data-bs-target="'#collapseOptions' + id"
                        :href="'#collapseOptions' + id"
                        aria-expanded="false"
                        :aria-controls="'collapseOptions' + id"
                        @click="toggleCollapse"
                    >
                        <small>
                            <i
                                class="bi me-2"
                                :class="isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"
                            />
                            Weitere Optionen
                        </small>
                    </a>
                    <div
                        :id="'collapseOptions' + id"
                        class="collapse mt-3"
                    >
                        <div class="d-flex flex-row">
                            <div class="align-self-center mb-3 me-2">
                                berechnen Pro
                            </div>
                            <InputText
                                :id="'Einheit'"
                                class="w-25"
                                :min="1"
                                :model-value="divisor"
                                :label="'Einheit'"
                                :placeholder="'Einheit'"
                                @update:model-value="$emit('set-divisor', $event)"
                            />
                        </div>
                    </div>
                </template>
                <template v-else>
                    <Dropdown-Autocomplete
                        class="flex-grow-1"
                        :items="itemList"
                        :model-value="itemListSelected"
                        :label="$t('additional:modules.tools.cosi.calculateRatio.subjectData')"
                        @update:model-value="$emit('set-selected-items', [$event])"
                    />
                    <a
                        data-bs-toggle="collapse"
                        :data-bs-target="'#collapseOptions' + id"
                        :href="'#collapseOptions' + id"
                        aria-expanded="false"
                        :aria-controls="'collapseOptions' + id"
                        @click="toggleCollapse"
                    >
                        <small>
                            <i
                                class="bi me-2"
                                :class="isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"
                            />
                            Weitere Optionen
                        </small>
                    </a>
                    <div
                        :id="'collapseOptions' + id"
                        class="collapse mt-3"
                    >
                        <div class="d-flex flex-row">
                            <InputText
                                :id="'test'"
                                class="w-25 me-3 align-self-center"
                                :label="'Faktor'"
                                :min="1"
                                :model-value="factor"
                                :placeholder="'Faktor'"
                                :type="'number'"
                                @update:model-value="$emit('set-factor', $event)"
                            />
                            <Dropdown-Autocomplete
                                class="w-50"
                                :items="numericalValues"
                                :model-value="numericalValuesSelected"
                                label="Parameter"
                                @update:model-value="$emit('set-numerical-values', [$event])"
                            />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </CustomCard>
</template>

<style lang="scss" scoped>
    .dropdown-menu {
        li:hover {
            background-color: $primary;
        }
    }
</style>

