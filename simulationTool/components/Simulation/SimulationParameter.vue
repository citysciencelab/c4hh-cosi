<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import OgcApiProcess from "../../js/ogcApiProcess";
import SectionHeader from "../SectionHeader.vue";
import SliderItem from "../../../../src/shared/modules/slider/components/SliderItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import Multiselect from "vue-multiselect";

export default {
    name: "SimulationParameter",
    components: {
        AccordionItem,
        FileUpload,
        FlatButton,
        InputText,
        SectionHeader,
        SliderItem,
        SwitchInput,
        Multiselect
    },
    data () {
        return {
            jobResults: undefined,
            jobStatus: undefined,
            parameterValue: {},
            processDescription: undefined,
            processHandler: undefined,
            requestBody: {},
            selectedOutputOptions: []
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
         * Returns an array of Objects with code and name property for multiselect options.
         * @return {Object[]} The array of Objects for options.
         */
        outputOptions () {
            const optionsArray = [];

            if (typeof this.processDescription !== "object") {
                return optionsArray;
            }

            Object.keys(this.processDescription?.outputs).forEach(key => {
                optionsArray.push({code: key, name: this.processDescription?.outputs[key]?.title});
            });

            return optionsArray;
        },

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
    watch: {
        selectedOutputOptions () {
            this.requestBody.outputs = {};
            this.selectedOutputOptions.forEach(elem => {
                this.requestBody.outputs[elem.code] = {};
            });
        }
    },
    async mounted () {
        if (this.simulation) {
            await this.prepareRequestBody();
        }
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
         * Gets the mapped property from key and configured object.
         */
        getMappedProperty,

        /**
         * Gets the parameter value according to input and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @returns {String} the parameter value. It could be the rendered value or default value.
         */
        getParameterValue (inputKey, propertyKey, val) {
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                return val;
            }

            const key = inputKey + "-" + propertyKey;

            if (typeof this.parameterValue[key] !== "undefined") {
                return this.parameterValue[key];
            }

            return val;
        },

        /**
         * Event handler for change of selected planning scenario.
         * @param {Object} event The change event.
         * @returns {void}
         */
        async onPlanningScenarioChange (event) {
            this.setCurrentPlanningScenarioId(event.target.value);
            this.prepareRequestBody();
        },

        /**
         * Event handler for progress update of the simulation.
         * @param {Object} jobStatus The job status object.
         */
        onProgressUpdate (jobStatus) {
            this.jobStatus = jobStatus;
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

        /** Prepares the request body for the simulation.
         * @returns {void}
         */
        async prepareRequestBody () {
            this.processHandler = new OgcApiProcess(this.simulation.url, this.simulation.id);
            this.processDescription = await this.processHandler.getDescription();
            this.requestBody.inputs = {
                ...OgcApiProcess.getInputDefaultsFromDescription(this.processDescription),
                ...this.currentPlanningScenario.inputs,
                crs: this.simulation?.inputs?.crs
            };
            this.requestBody.outputs = {};
        },

        /**
         * Starts the simulation.
         * @returns {void}
         */
        async startSimulation () {
            const scenario = this.planningScenarios.find(scnrio => scnrio.id === this.currentPlanningScenarioId), // Cannot use computed property here, which may change during async call.
                executeResponse = await this.processHandler.execute(this.requestBody),
                jobID = executeResponse.jobID;

            if (!jobID) {
                console.warn("No job ID returned from process execution.");
                return;
            }

            scenario.jobs ??= {};
            scenario.jobs[jobID] = {requestBody: JSON.parse(JSON.stringify(this.requestBody))}; // Deep copy to avoid reference issues.

            this.jobResults = await this.processHandler.pollJobStatusAndGetResults( // Das soll später auch im szenario gespeichert werden
                jobID,
                this.simulation.pollingInterval,
                this.onProgressUpdate
            );
        },

        /**
         * Sets the parameter value according to input and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @returns {void}
         */
        setParameterValue (inputKey, propertyKey, val) {
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                return;
            }

            const key = inputKey + "-" + propertyKey;

            this.parameterValue[key] = val;
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
            :title="$t('additional:modules.tools.simulationTool.simulationSetParams')"
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
            :title="$t('additional:modules.tools.simulationTool.simulationAdditionalParameter')"
        >
            <div
                v-for="(input, inputKey) in stringTypeInputs"
                :key="inputKey"
            >
                <InputText
                    :id="inputKey"
                    class="form-control mb-3"
                    :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                    :placeholder="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                    :value="input.default"
                />
            </div>
            <AccordionItem
                v-for="(input, inputKey) in objectTypeInputs"
                :id="inputKey"
                :key="inputKey"
                :title="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                font-size="font-size-small"
            >
                <div
                    v-for="(property, propertyKey) in input.schema.properties"
                    :key="propertyKey"
                >
                    <template v-if="property?.type === 'string'">
                        <InputText
                            :id="`${inputKey}-${propertyKey}`"
                            class="form-control mb-3"
                            :label="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :placeholder="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :value="property.default"
                        />
                    </template>
                    <template v-else-if="property?.type === 'boolean'">
                        <div class="form-switch">
                            <SwitchInput
                                :id="`${inputKey}-${propertyKey}`"
                                :label="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                                :aria="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                                :checked="property?.default"
                            />
                        </div>
                    </template>
                    <template v-else-if="property?.type === 'number' || property?.type === 'integer'">
                        <label :for="`${inputKey}-${propertyKey}`">
                            {{ getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping) }}
                        </label>
                        <div class="d-flex justify-content-between value">
                            <span>{{ property?.minimum }}</span>
                            <span><b>{{ getParameterValue(inputKey, propertyKey, property?.default) }}</b></span>
                            <span>{{ property?.maximum }}</span>
                        </div>
                        <SliderItem
                            :id="`${inputKey}-${propertyKey}`"
                            :aria="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :class-array="['mb-3']"
                            :min="property?.minimum"
                            :max="property?.maximum"
                            :step="property?.type === 'integer' ? 1 : 0.1"
                            :value="getParameterValue(inputKey, propertyKey, property?.default)"
                            :interaction="$event=> setParameterValue(inputKey, propertyKey, Number($event.target.value))"
                        />
                    </template>
                </div>
            </AccordionItem>
        </AccordionItem>
        <label
            for="outputParam"
            class="typo__label"
        >
            {{ $t('additional:modules.tools.simulationTool.chooseOutputParam') }}
        </label>
        <multiselect
            id="outputParam"
            v-model="selectedOutputOptions"
            :placeholder="$t('additional:modules.tools.simulationTool.outputParam')"
            :aria-label="$t('additional:modules.tools.simulationTool.outputParam')"
            label="name"
            track-by="code"
            :options="outputOptions"
            :searchable="true"
            :multiple="true"
            :open="true"
        >
            <template #tag="{ option, remove }">
                <span
                    class="multiselect__tag"
                    :class="option.code"
                >
                    <span>{{ option.name }}</span>
                    <i
                        tabindex="0"
                        class="multiselect__tag-icon"
                        role="button"
                        @click="remove(option)"
                        @keypress="remove(option)"
                    />
                </span>
            </template>
            <template #option="p">
                <div class="option__desc">
                    <span
                        class="option__title"
                        :class="p.option.name"
                    >
                        {{ p.option.name }}
                    </span>
                </div>
            </template>
        </multiselect>
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
                        :interaction="startSimulation"
                        :aria-label="$t('additional:modules.tools.simulationTool.simulationStart')"
                        :text="$t('additional:modules.tools.simulationTool.simulationStart')"
                    />
                </div>
            </form>
            Job status: {{ jobStatus?.status }} <br>
            Job progress: {{ jobStatus?.progress }} % <br>
            Job Result: <br> {{ JSON.stringify(jobResults) }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.multiselect__tag {
    background-color: #3C5F94;
    color: #ffffff;
}

.d-flex {
    .select-scenario {
        padding-top: 30px;
        margin-bottom: 30px;
    }
    .create-scenario {
        padding-top: 10px;
        button {
            min-height: 3.5rem;
        }
    }
    .value {
        margin-top: 5px;
    }
}
form {
    .button {
        margin-top: 40px;
    }
}

</style>
