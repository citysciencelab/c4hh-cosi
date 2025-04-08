<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "PlanningScenarioLanduse",
    components: {
        FlatButton,
        IconButton
    },
    data () {
        return {
            buildingsOrStreets: "buildings"
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarios"
        ]),

        /**
         * Gets the currently selected planning scenario.
         * @return {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        },

        /**
         * Gets all buildings in the current scenario that are not marked as created.
         * @return {Object[]} Array of existing buildings in current scenario.
         */
        existingBuildings () {
            return this.currentPlanningScenario?.features?.building?.features
                ?.filter(feature => !feature.properties.created)
                ?? [];
        },

        /**
         * Gets all buildings in the current scenario that are marked as created.
         * @return {Object[]} Array of created buildings in current scenario.
         */
        createdBuildings () {
            return this.currentPlanningScenario?.features?.building?.features
                ?.filter(feature => feature.properties.created)
                ?? [];
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent"
        ]),

        /**
         * Applies a height change to a building.
         * @param {Object} event The event that contains that demanded heigth change.
         * @param {Object} building The building whose heigth property is to be changed.
         * @returns {void}
         */
        changeHeight (event, building) {
            building.properties ??= {};
            building.properties.building_height = event.target.valueAsNumber;
        }
    }
};

</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <h4 class="text-decoration-underline mt-3">
            {{ $t("additional:modules.tools.simulationTool.landuseTitle") }}
        </h4>
        <div class="d-flex flex-column rounded shadow mt-4">
            <div class="position-sticky mt-2 mx-3 top-0 z-2 bg-body">
                <h5>{{ currentPlanningScenario?.name }}</h5>
                <div class="d-flex justify-content-between">
                    <div>
                        <div class="form-check form-check-inline">
                            <input
                                id="radioBuildings"
                                v-model="buildingsOrStreets"
                                value="buildings"
                                class="form-check-input"
                                type="radio"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="radioBuildings"
                            >
                                {{ $t('additional:modules.tools.simulationTool.buildings') }}
                            </label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input
                                id="radioStreets"
                                v-model="buildingsOrStreets"
                                value="streets"
                                class="form-check-input"
                                type="radio"
                            >
                            <label
                                class="form-check-label"
                                for="radioStreets"
                            >
                                {{ $t('additional:modules.tools.simulationTool.streets') }}
                            </label>
                        </div>
                    </div>
                    <div v-if="buildingsOrStreets === 'buildings'">
                        {{ $t('additional:modules.tools.simulationTool.hideExistingsBuildings') }}<br>
                        {{ $t('additional:modules.tools.simulationTool.off') }}
                        <div class="form-check form-check-inline form-switch">
                            <input
                                id="hideExistingBuildings"
                                class="form-check-input"
                                type="checkbox"
                                role="switch"
                            >
                            {{ $t('additional:modules.tools.simulationTool.on') }}
                        </div>
                    </div>
                </div>
                <ul
                    v-if="buildingsOrStreets === 'buildings'"
                    class="nav nav-underline mt-3 d-flex"
                    role="tablist"
                >
                    <li
                        class="nav-item flex-grow-1"
                        role="presentation"
                    >
                        <button
                            id="existing-tab"
                            class="nav-link p-1 w-100 active"
                            data-bs-toggle="tab"
                            data-bs-target="#existing"
                            type="button"
                            role="tab"
                            aria-controls="existing"
                            aria-selected="true"
                        >
                            {{ $t('additional:modules.tools.simulationTool.existingBuildings') }}
                        </button>
                    </li>
                    <li
                        class="nav-item flex-grow-1"
                        role="presentation"
                    >
                        <button
                            id="created-tab"
                            class="nav-link p-1 w-100"
                            data-bs-toggle="tab"
                            data-bs-target="#created"
                            type="button"
                            role="tab"
                            aria-controls="created"
                            aria-selected="false"
                        >
                            {{ $t('additional:modules.tools.simulationTool.createdBuildings') }}
                        </button>
                    </li>
                </ul>
            </div>
            <div
                v-if="buildingsOrStreets === 'buildings'"
                class="tab-content m-3"
            >
                <div
                    id="existing"
                    class="tab-pane active"
                    role="tabpanel"
                    aria-labelledby="existing-tab"
                    tabindex="0"
                >
                    <ul class="list-group list-group-flush">
                        <li
                            v-for="building in existingBuildings"
                            :key="building.id"
                            class="list-group-item list-group-item-action"
                        >
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    {{ building.properties?.id }}
                                </div>
                                <div class="d-flex">
                                    <label
                                        for="height"
                                        class="col-form-label mx-2"
                                    >
                                        {{ $t('additional:modules.tools.simulationTool.heightInM') }}
                                    </label>
                                    <input
                                        id="height"
                                        type="number"
                                        class="form-control text-end height-input"
                                        :value="building.properties?.building_height"
                                        @input="event => changeHeight(event, building)"
                                    >
                                </div>
                                <IconButton
                                    icon="bi-eye"
                                    :aria="$t('additional:modules.tools.simulationTool.toggleVisibility')"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
                <div
                    id="created"
                    class="tab-pane"
                    role="tabpanel"
                    aria-labelledby="created-tab"
                    tabindex="0"
                >
                    <ul class="list-group list-group-flush">
                        <li
                            v-for="building in createdBuildings"
                            :key="building.id"
                            class="list-group-item list-group-item-action"
                        >
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    {{ building.properties?.id }}
                                </div>
                                <div class="d-flex">
                                    <label
                                        for="height"
                                        class="col-form-label mx-2"
                                    >
                                        {{ $t('additional:modules.tools.simulationTool.heightInM') }}
                                    </label>
                                    <input
                                        id="height"
                                        type="number"
                                        class="form-control text-end height-input"
                                        :value="building.properties?.building_height"
                                        @input="event => changeHeight(event, building)"
                                    >
                                </div>
                                <IconButton
                                    icon="bi-eye"
                                    :aria="$t('additional:modules.tools.simulationTool.toggleVisibility')"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="position-sticky bottom-0 bg-body z-2 p-3 d-flex justify-content-between">
                <FlatButton
                    v-if="buildingsOrStreets === 'buildings'"
                    class="m-3"
                    :secondary="true"
                    :text="$t('additional:modules.tools.simulationTool.newBuilding')"
                    icon="bi-pencil-square"
                />
                <FlatButton
                    class="m-3"
                    :text="$t('additional:modules.tools.simulationTool.planningScenarioSave')"
                    :interaction="() => setCurrentPlanningComponent('')"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">

.height-input {
    width: 6em;
}

</style>
