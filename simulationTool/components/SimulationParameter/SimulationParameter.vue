<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import axios from "axios";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationParameter",
    components: {
        AccordionItem,
        FileUpload,
        FlatButton,
        SectionHeader
    },
    data () {
        return {
            processDescription: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarios",
            "previousComponentOfSimulation",
            "simulations"
        ]),

        /**
         * Get the current planning scenario.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        },

        /**
         * Get an inputs object from the process description containing only the inputs of type "object".
         * Also filters out inputs that the config defines as not editable or not having a menu position.
         * @returns {Object} The inputs object.
         */
        objectTypeInputs () {
            if (typeof this.processDescription?.inputs !== "object") {
                return {};
            }

            return Object.fromEntries(Object.entries(this.processDescription?.inputs).filter(
                ([inputKey, input]) => input.schema?.type === "object"
                    && this.simulation?.inputs?.[inputKey]?.menu !== "nowhere"
                    && !this.simulation?.inputs?.[inputKey]?.editable
            ));
        },

        /**
         * Get the simulation configuration to the currently selected planning scenario.
         * @returns {Object} The current simulation configuration.
         */
        simulation () {
            return this.simulations.find(simulation => simulation.id === this.currentPlanningScenario?.simulationId);
        },

        /**
         * Get an inputs object from the process description containing only the inputs of type "string".
         * Also filters out inputs that the config defines as not editable or not having a menu position.
         * @returns {Object} The inputs object.
         */
        stringTypeInputs () {
            if (typeof this.processDescription?.inputs !== "object") {
                return {};
            }

            return Object.fromEntries(Object.entries(this.processDescription?.inputs).filter(
                ([inputKey, input]) => input.schema?.type === "string"
                    && this.simulation?.inputs?.[inputKey]?.menu !== "nowhere"
                    && !this.simulation?.inputs?.[inputKey]?.editable
            ));
        }
    },
    async mounted () {
        this.processDescription = await this.fetchProcessDescription(this.simulation);
    },
    methods: {
        ...mapActions("Modules/SimulationTool", ["addFile"]),
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode"
        ]),

        /**
         * Back to previous component.
         * @returns {void}
         */
        backToPrevious () {
            this.setMode(this.previousComponentOfSimulation);
            if (this.previousComponentOfSimulation === "planningScenario") {
                this.setCurrentPlanningScenarioId("");
                this.getLayer().getLayerSource().clear();
            }
        },
        /**
         * Creates a layer if it does not yet exist and returns it.
         * @returns {Object} A VECTORBASE Layer
         */
        getLayer () {
            if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
                return layerCollection.getLayerById("planning-scenario");
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "planning-scenario",
                name: "planning-scenario",
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);
            return layer;
        },

        /**
         * Fetches the process description from the simulation URL.
         * @param {Object} simulation The simulation configuration object containing url and id.
         * @returns {Promise<Object|undefined>} The process description or undefined if an error occurs.
         */
        async fetchProcessDescription (simulation) {
            if (!simulation?.url) {
                console.warn("Simulation URL is not defined.");
                return undefined;
            }

            try {
                const url = new URL(`api/processes/${simulation.id}`, simulation.url),
                    response = await axios.get(url);

                return response.data;

            }
            catch (error) {
                console.warn("Error fetching process description:", error);
                return undefined;
            }
        },

        /**
         * Gets the mapped property from key and configured object.
         */
        getMappedProperty,

        /**
         * Event handler for change of selected planning scenario.
         * @param {Object} event The change event.
         * @returns {void}
         */
        async onPlanningScenarioChange (event) {
            this.setCurrentPlanningScenarioId(event.target.value);
            this.processDescription = await this.fetchProcessDescription(this.simulation);
        },

        /**
         * Called when user drops a file in the upload container
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onDrop (e) {
            if (e.dataTransfer.files !== undefined) {
                this.addFile(e.dataTransfer.files);
            }
        },

        /**
         * Called when user uploads a file to process
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onInputChange (e) {
            if (e.target.files !== undefined) {
                this.addFile(e.target.files);
                e.target.value = null;
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
         * Called when user clicks to input files
         * @param {HTMLInputEvent} e event with click.
         * @returns {void}
         */
        triggerClickOnFileInput (e) {
            if (e.which === 32 || e.which === 13) {
                this.$refs["upload-input-file"].click();
            }
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simlulationSetParams')"
            icon="bi bi-person-fill"
        />
        <div class="row d-flex">
            <div class="col col-6 select-scenario">
                <div class="form-floating mb-3">
                    <select
                        id="simulateForPlanning"
                        class="form-select"
                        :aria-label="$t('additional:modules.tools.simulationTool.selectPlanningScenario')"
                        :value="currentPlanningScenarioId"
                        @change="onPlanningScenarioChange"
                    >
                        <option
                            v-for="(scenario, i) in planningScenarios"
                            :key="i"
                            :value="scenario.id"
                        >
                            {{ scenario.name }}
                        </option>
                    </select>
                    <label for="simulateForPlanning">
                        {{ $t('additional:modules.tools.simulationTool.selectPlanningScenario') }}
                    </label>
                </div>
            </div>
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
        <h6 class="mb-3">
            {{ $t('additional:modules.tools.simulationTool.planningScenarioUpload') }}
        </h6>
        <FileUpload
            :id="'planningScenarioUpload'"
            :keydown="(e) => triggerClickOnFileInput(e)"
            :change="(e) => onInputChange(e)"
            :drop="(e) => onDrop(e)"
            class="col-md-12"
        />
        <hr>
        <AccordionItem
            id="advanced-simulation-parameters"
            :title="$t('Erweitere Parameter')"
        >
            <div
                v-for="(input, inputKey) in stringTypeInputs"
                :key="inputKey"
            >
                <label :for="inputKey">
                    {{ getMappedProperty(inputKey, simulation?.inputs[inputKey]?.propertiesMapping) }}
                </label>
                <input
                    :id="inputKey"
                    type="text"
                    class="form-control mb-3"
                    :value="input.default"
                    :aria-label="inputKey"
                >
            </div>
            <AccordionItem
                v-for="(input, inputKey) in objectTypeInputs"
                :id="inputKey"
                :key="inputKey"
                :title="inputKey"
                font-size="font-size-small"
            >
                <div
                    v-for="(property, propertyKey) in input.schema.properties"
                    :key="propertyKey"
                >
                    <label :for="`${inputKey}-${propertyKey}`">
                        {{ getMappedProperty(propertyKey, simulation?.inputs[inputKey]?.propertiesMapping) }}
                    </label>
                    <input
                        :id="`${inputKey}-${propertyKey}`"
                        type="text"
                        class="form-control mb-3"
                        :value="property.default"
                        :aria-label="`${inputKey}-${propertyKey}`"
                    >
                </div>
            </AccordionItem>
        </AccordionItem>
        <div
            class="mb-5"
        >
            <form>
                <div
                    class="d-flex justify-content-between button"
                >
                    <FlatButton
                        id="back"
                        :aria-label="$t('additional:modules.tools.simulationTool.back')"
                        :interaction="() => backToPrevious()"
                        :text="$t('additional:modules.tools.simulationTool.back')"
                    />
                    <FlatButton
                        id="start"
                        :aria-label="$t('additional:modules.tools.simulationTool.simulationStart')"
                        :text="$t('additional:modules.tools.simulationTool.simulationStart')"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.d-flex {
    margin-bottom: 30px;
    .select-scenario {
        padding-top: 30px;
    }
    .create-scenario {
        padding-top: 10px;
        button {
            min-height: 3.5rem;
        }
    }
}
form {
    .button {
        margin-top: 40px;
    }
}

</style>
