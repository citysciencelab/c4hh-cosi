<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";
import {infrastructureLayerId} from "../../layerIds.js";
import SimulationResults from "./SimulationResults.vue";

export default {
    name: "SimulationList",
    components: {
        FlatButton,
        SectionHeader,
        SimulationResults
    },
    data () {
        return {
            expandedSimulationId: null
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "planningScenarios",
            "simulationIdForResults"
        ]),

        /**
         * Returns the list of planning scenarios sorted by name.
         * @returns {Object[]} Sorted list of planning scenarios.
         */
        sortedPlanningScenarios () {
            return this.planningScenarios ? [...this.planningScenarios].sort((a, b) => a.name.localeCompare(b.name)) : [];
        },

        /**
         * Returns a list of all conducted simulations in all planning scenarios.
         * @returns {Object[]} - List of simulations with simulation name and scenario name.
         */
        simulationList () {
            const list = [];

            this.sortedPlanningScenarios?.forEach(scenario => {
                if (!isObject(scenario.simulations)) {
                    return;
                }
                const sortedSimulations = Object.entries(scenario.simulations).sort(([, a], [, b]) => a.name.localeCompare(b.name));

                sortedSimulations.forEach(([simulationId, simulation]) => {
                    const listEntry = {
                        scenarioName: scenario.name,
                        scenarioId: scenario.id,
                        simulationId: simulationId,
                        simulationName: simulation.name
                    };

                    list.push(listEntry);
                });
            });

            return list;
        }
    },
    mounted () {
        this.clearLayers();

        if (this.simulationIdForResults) {
            this.toggleSimulationExpansion(this.simulationIdForResults);
        }
    },
    unmounted () {
        this.clearLayers();
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode",
            "setSimulationIdForResults"
        ]),
        ...mapActions("Modules/SimulationTool", [
            "updateFeatures"
        ]),

        /**
         * Clears the planning scenario and infrastructure layers from the map.
         * @returns {void}
         */
        clearLayers () {
            if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
                layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
            }
            if (typeof layerCollection.getLayerById(infrastructureLayerId) !== "undefined") {
                layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
            }
        },

        /**
         * Opens create planning scenario component.
         * @returns {void}
         */
        openCreatePlanningScenario () {
            this.setMode("planningScenario");
            this.setCurrentPlanningComponent("create");
        },

        /**
         * Opens simulation results component.
         * @param {String} simulationId - Id of the simulation to open.
         * @param {String} scenarioId - ID of the scenario.
         * @returns {void}
         */
        openSimulation (simulationId, scenarioId) {
            this.setSimulationIdForResults(simulationId);
            this.setCurrentPlanningScenarioId(scenarioId);
            this.scrollIntoView(simulationId, false, -1);
        },

        /**
         * Closes the currently opened simulation.
         * Resets the simulation ID and scenario ID.
         * @param {String} simulationId - ID of the simulation to close.
         * @returns {void}
         */
        closeSimulation (simulationId) {
            this.setSimulationIdForResults(null);
            this.setCurrentPlanningScenarioId(null);
            this.expandedSimulationId = null;
            this.updateFeatures();
            this.scrollIntoView(simulationId);
        },

        /**
         * Scrolls a simulation entry into view with optional offset and positioning.
         * @param {String} simulationId - ID of the simulation to use as reference point for scrolling.
         * @param {Boolean} [shouldCenter=true] - Whether to center the element (true) or position it at the top (false).
         * @param {Number} [offset=0] - List element offset relative to the reference simulation.
         * @returns {void}
         */
        scrollIntoView (simulationId, shouldCenter = true, offset = 0) {
            this.$nextTick(() => {
                let focusElement;

                if (!offset) {
                    focusElement = document.getElementById(`simulation-element-${simulationId}`);
                }
                else {
                    const listIndex = this.simulationList.findIndex(entry => entry.simulationId === simulationId);
                    let focusIndex = listIndex + offset;

                    focusIndex = Math.max(0, focusIndex);
                    focusIndex = Math.min(this.simulationList.length - 1, focusIndex);

                    if (this.simulationList[focusIndex]?.simulationId) {
                        focusElement = document.getElementById(`simulation-element-${this.simulationList[focusIndex]?.simulationId}`);
                    }
                }

                if (focusElement) {
                    const focusMode = shouldCenter ? "center" : "start";

                    focusElement.scrollIntoView({behavior: "smooth", block: focusMode});
                }
            });
        },

        /**
         * Toggles the expansion state of a simulation entry.
         * Only one simulation can be expanded at a time.
         * @param {String} simulationId - ID of the simulation to toggle.
         */
        toggleSimulationExpansion (simulationId) {
            if (this.expandedSimulationId === simulationId) {
                this.closeSimulation(simulationId);
            }
            else {
                this.expandedSimulationId = simulationId;
                this.openSimulation(simulationId, this.simulationList.find(entry => entry.simulationId === simulationId).scenarioId);
            }
        },

        /**
         * Checks if a simulation is expanded.
         * @param {String} simulationId - ID of the simulation to check.
         * @returns {Boolean} True if expanded.
         */
        isSimulationExpanded (simulationId) {
            return this.expandedSimulationId === simulationId;
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationList')"
        />
        <div v-if="simulationList.length">
            <div
                v-for="simulationEntry in simulationList"
                :id="`simulation-element-${simulationEntry.simulationId}`"
                :key="simulationEntry.simulationId"
                class="simulation-entry"
            >
                <div
                    class="simulation-header"
                    role="button"
                    tabindex="0"
                    @click="() => toggleSimulationExpansion(simulationEntry.simulationId)"
                    @keypress.enter="() => toggleSimulationExpansion(simulationEntry.simulationId)"
                >
                    <div class="simulation-info">
                        <div class="simulation-name">
                            <i
                                class="bi"
                                :class="isSimulationExpanded(simulationEntry.simulationId) ? 'bi-chevron-down' : 'bi-chevron-right'"
                            />
                            {{ simulationEntry.simulationName }}
                        </div>
                        <div class="scenario-name">
                            {{ simulationEntry.scenarioName }}
                        </div>
                    </div>
                </div>

                <div
                    v-if="isSimulationExpanded(simulationEntry.simulationId)"
                    class="simulation-details"
                >
                    <SimulationResults />
                </div>
            </div>
        </div>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobs') }}
        </div>
        <div class="row d-flex">
            <div class="col col-6 create-scenario">
                <FlatButton
                    class="pe-2 mt-4"
                    :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                    :icon="'bi bi-pencil-square'"
                    :interaction="() => openCreatePlanningScenario()"
                    :text="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.simulation-entry {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    overflow: hidden;
}

.simulation-header {
    padding: 1rem;
    background-color: #f8f9fa;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: #e9ecef;
    }

    &:focus {
        outline: 2px solid #0d6efd;
        outline-offset: -2px;
    }
}

.simulation-info {
    flex: 1;
}

.simulation-name {
    font-weight: 600;
    margin-bottom: 0.25rem;

    .bi {
        margin-right: 0.5rem;
        transition: transform 0.2s ease;
    }
}

.scenario-name {
    font-size: 0.875rem;
    color: #6c757d;
}

.simulation-actions {
    .btn {
        white-space: nowrap;
    }
}

.simulation-details {
    padding: 0.5rem;
    background-color: #fff;
    border-top: 1px solid #dee2e6;
}
</style>
