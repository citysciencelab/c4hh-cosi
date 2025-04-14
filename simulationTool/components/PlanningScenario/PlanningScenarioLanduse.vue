<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature";
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters, mapMutations} from "vuex";
import NavTab from "../../../../src/shared/modules/tabs/components/NavTab.vue";
import {Polygon} from "ol/geom";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "PlanningScenarioLanduse",
    components: {
        FlatButton,
        IconButton,
        NavTab,
        SwitchInput
    },
    data () {
        return {
            currentEditableInput: ""
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarios",
            "simulations"
        ]),

        /**
         * Gets the bounding box of the current planning scenario.
         * @returns {Number[]} The bounding box as an extent.
         */
        currentBBoxGeometry () {
            const coordinates = this.currentPlanningScenario?.scenarioFeature?.features?.[0]?.geometry?.coordinates;

            if (!coordinates) {
                return undefined;
            }
            return new Polygon(coordinates);
        },

        /**
         * Gets the crs configured in the current simulation.
         * @returns {String} The current crs.
         */
        currentCrs () {
            return this.currentSimulation?.inputs?.crs;
        },

        /**
         * Gets the currently selected planning scenario.
         * @return {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        },

        /**
         * Gets the simulation config object that is set for the current planning scenario.
         * @returns {Object} The current simulation config.
         */
        currentSimulation () {
            return this.simulations.find(sim => sim.id === this.currentPlanningScenario.simulationId);
        },

        /**
         * Gets all simulation inputs marked as editable.
         * @returns {Object} An inputs object containing only the editable inputs.
         */
        editableInputs () {
            if (!this.currentSimulation?.inputs) {
                return undefined;
            }

            return Object.fromEntries(
                Object.entries(this.currentSimulation.inputs).filter(([, value]) => {
                    return value.editable;
                })
            );
        },

        /**
         * Gets all buildings in the current scenario that are not marked as created.
         * @return {Object[]} Array of existing buildings in current scenario.
         */
        existingBuildings () {
            return this.currentPlanningScenario?.inputs?.buildings?.features
                ?.filter(feature => !feature.properties.created)
                ?? [];
        },

        /**
         * Gets all buildings in the current scenario that are marked as created.
         * @return {Object[]} Array of created buildings in current scenario.
         */
        createdBuildings () {
            return this.currentPlanningScenario?.inputs?.buildings?.features
                ?.filter(feature => feature.properties.created)
                ?? [];
        }
    },
    async mounted () {
        if (!this.currentPlanningScenario) {
            return;
        }
        if (!this.currentPlanningScenario.featuresLoaded) {
            try {
                await this.fetchFeatures(
                    this.currentPlanningScenario, this.editableInputs, this.currentBBoxGeometry, this.currentCrs
                );
                this.currentPlanningScenario.featuresLoaded = true;
            }
            catch (error) {
                console.warn(error);
            }
        }

        this.currentEditableInput = this.editableInputs ? Object.keys(this.editableInputs)[0] : "buildings";
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
        },

        /**
         * Performs GET-Requests for all editable oaf inputs and sets the features in the scenario parameter object.
         * @param {Object} scenario The planning scenario for which the features are to be loaded.
         * @param {Object} inputs Config object from simulation containing input types and sources.
         * @param {ol/Geometry/Polygon} bboxGeometry - The polygon geometry of the bbox.
         * @param {String} crs The crs for the simulation.
         * @return {void}
         */
        async fetchFeatures (scenario, inputs, bboxGeometry, crs) {
            const entries = Object.entries(inputs);

            for (let i = 0; i < entries.length; i++) {
                const [inputKey, input] = entries[i];

                if (input?.source?.type === "oaf") {
                    const filter = getOAFFeature.getOAFGeometryFilter(bboxGeometry, "geometry", "intersects");

                    scenario.inputs[inputKey].features = await getOAFFeature.getOAFFeatureGet(input.source.url, input.source.collection, 100, filter, "http://www.opengis.net/def/crs/OGC/1.3/CRS84", crs);
                }
            }
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
                <hr>
                <div class="d-flex">
                    <div
                        v-for="(value, key, index) in editableInputs"
                        :key="key"
                        class="form-check form-check-inline"
                    >
                        <input
                            :id="key"
                            v-model="currentEditableInput"
                            :value="key"
                            class="form-check-input"
                            type="radio"
                            :checked="index === 0"
                        >
                        <label
                            class="form-check-label"
                            :for="key"
                        >
                            {{ value.label }}
                        </label>
                    </div>
                    <div
                        v-if="currentEditableInput === 'buildings'"
                        class="form-check form-switch"
                    >
                        <SwitchInput
                            id="hideExistingBuildings"
                            :label="$t('additional:modules.tools.simulationTool.hideExistingBuildings')"
                            :aria="$t('additional:modules.tools.simulationTool.hideExistingsBuildings')"
                            :interaction="() => {}"
                        />
                    </div>
                </div>
                <div id="building-tabs-container">
                    <ul
                        v-if="currentEditableInput === 'buildings'"
                        class="nav nav-tabs nav-justified mt-3 d-flex"
                        role="tablist"
                    >
                        <NavTab
                            id="existing-tab"
                            :active="true"
                            :target="'#existing'"
                            :label="'additional:modules.tools.simulationTool.existingBuildings'"
                        />
                        <NavTab
                            id="created-tab"
                            :active="false"
                            :target="'#created'"
                            :label="'additional:modules.tools.simulationTool.createdBuildings'"
                        />
                    </ul>
                </div>
            </div>
            <div
                v-if="currentEditableInput === 'buildings'"
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
            <div v-if="currentEditableInput === 'roads'">
                {{ currentPlanningScenario?.inputs?.roads }}
            </div>
            <div class="position-sticky bottom-0 bg-body z-2 p-3 d-flex justify-content-between">
                <FlatButton
                    v-if="currentEditableInput === 'buildings'"
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
@import "~mixins";
@import "~variables";

.height-input {
    width: 6em;
}

#building-tabs-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
}

.nav-tabs {
    display: contents;
    li {
        list-style: none;
    }
    .nav-item {
        flex: 1;
    }
}

</style>
