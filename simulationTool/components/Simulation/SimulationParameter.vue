<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import DynamicInputByType from "../shared/components/DynamicInputByType.vue";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getBBOXGeometry from "../shared/js/getBBoxGeometry";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import OgcApiProcess from "../../js/ogcApiProcess";
import SectionHeader from "../SectionHeader.vue";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "SimulationParameter",
    components: {
        AccordionItem,
        DynamicInputByType,
        FileUpload,
        FlatButton,
        SectionHeader,
        SpinnerItem,
        SwitchInput
    },
    data () {
        return {
            inputsValue: {},
            jobResults: undefined,
            jobStatus: undefined,
            oafLoadingStates: {},
            primaryTypeInputs: {},
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
         * Get the optional inputs of type FeatureCollection from the process description.
         * @returns {Object} An object of inputs.
         */
        optionalOafTypeInputs () {
            if (!isObject(this.processDescription?.inputs)) {
                return {};
            }

            return Object.fromEntries(
                Object.entries(this.processDescription?.inputs).filter(([, input]) => {
                    return input.minOccurs === 0
                        && input.schema?.allOf?.some(schema => schema.format === "geojson-feature-collection");
                })
            );
        },

        /**
         * Get the subset of optionalOafTypeInputs that is neither primary nor invisible.
         * @returns {Object} An object of inputs.
         */
        optionalOafTypeInputsAdvanced () {
            return Object.fromEntries(
                Object.entries(this.optionalOafTypeInputs).filter(([inputKey]) => {
                    return this.simulation?.inputs?.[inputKey]?.menu !== "primary"
                        && this.simulation?.inputs?.[inputKey]?.menu !== "nowhere";
                })
            );
        },

        /**
         * Get the subset of optionalOafTypeInputs that is primary.
         * @returns {Object} An object of inputs.
         */
        optionalOafTypeInputsPrimary () {
            return Object.fromEntries(
                Object.entries(this.optionalOafTypeInputs).filter(([inputKey]) => {
                    return this.simulation?.inputs?.[inputKey]?.menu === "primary";
                })
            );
        },


        /**
         * Returns an array of Objects with code and name property for select options.
         * @return {Object[]} The array of Objects for options.
         */
        outputOptions () {
            const optionsArray = [];

            if (typeof this.processDescription !== "object") {
                return optionsArray;
            }

            Object.keys(this.processDescription?.outputs || {}).forEach(key => {
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
         * Gets the keys of the primaryTypeInputs object.
         * @returns {String[]} The keys of the primaryTypeInputs object.
         */
        primaryTypeInputsKeys () {
            return Object.keys(this.primaryTypeInputs);
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
        /**
         * Renders the new inputs according to the inputs value.
         * @param {Object[]} val the inputs value.
         */
        inputsValue: {
            handler (val) {
                this.requestBody.inputs = {
                    ...val,
                    ...this.currentPlanningScenario.inputs,
                    crs: this.simulation?.inputs?.crs
                };
            },
            deep: true
        },

        /**
         * Changes the requestBody according to the selected outputs.
         * @param {Object[]} val the selected outputs.
         */
        selectedOutputOptions (val) {
            this.requestBody.outputs = {};
            val.forEach(elem => {
                this.requestBody.outputs[elem.code] = {};
            });
        }
    },
    async mounted () {
        if (this.simulation) {
            await this.prepareRequestBody();
            this.primaryTypeInputs = this.getPrimaryTypeInputs();
        }

        this.selectedOutputOptions = this.outputOptions;
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
         * Excludes the primary type keys from the given object.
         * @param {Object} properties The properties object.
         * @returns {Object} The filtered properties object.
         */
        excludePrimaryTypeKeys (properties) {
            const result = {};

            Object.entries(properties || {}).forEach(([propertyKey, property]) => {
                if (!this.primaryTypeInputsKeys.includes(propertyKey)) {
                    result[propertyKey] = property;
                }
            });
            return result;
        },

        /**
         * Gets the inputs value according to input and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @returns {String} the parameter value. It could be the rendered value or default value.
         */
        getInputsValue (inputKey, propertyKey, val) {
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                return val;
            }

            if (typeof this.inputsValue[inputKey]?.[propertyKey] !== "undefined") {
                return this.inputsValue[inputKey][propertyKey];
            }

            return val;
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
         * Gets the inputs of the primary type from the process description.
         * @returns {Object} The inputs of the primary type.
         */
        getPrimaryTypeInputs () {
            const propertiesToExtract = {};

            if (!isObject(this.processDescription?.inputs)) {
                return propertiesToExtract;
            }
            Object.entries(this.processDescription?.inputs).forEach(([inputKey, input]) => {
                if (this.simulation?.inputs?.[inputKey]?.menu !== "primary") {
                    return;
                }
                if (input.schema?.type === "object") {
                    const foundProperties = Object.entries(input.schema.properties || {}).filter(([propertyKey]) => {
                        return this.simulation?.inputs?.[inputKey]?.primaryProperties?.includes(propertyKey);
                    });

                    foundProperties.forEach(([foundPropKey, foundPropVal]) => {
                        propertiesToExtract[foundPropKey] = {...foundPropVal};
                        propertiesToExtract[foundPropKey].inputKey = inputKey;
                    });
                }
                else if (input.schema?.type === "string") {
                    propertiesToExtract[inputKey] = {...input};
                    propertiesToExtract[inputKey].type = "string";
                    propertiesToExtract[inputKey].inputKey = inputKey;
                    delete propertiesToExtract[inputKey].schema;
                    delete propertiesToExtract[inputKey].title;
                }
            });
            return propertiesToExtract;
        },

        /**
         * Event handler for change of switch for oaf input type.
         * Loads the data from the source if it is not already loaded.
         * @param {Object} event The change event.
         * @param {String} inputKey The input key.
         * @returns {void}
         */
        async onOafSwitchChange (event, inputKey) {
            const scenarioInputs = this.currentPlanningScenario.inputs;

            if (!scenarioInputs[inputKey]) {
                this.oafLoadingStates[inputKey] = true;

                const source = this.simulation.inputs[inputKey].source,
                    crs = this.simulation.inputs.crs,
                    filter = getOAFFeature.getOAFGeometryFilter(getBBOXGeometry(this.currentPlanningScenario), "geometry", "intersects");

                scenarioInputs[inputKey] = {
                    type: "FeatureCollection",
                    features: await getOAFFeature.getOAFFeatureGet(
                        source.url, source.collection, 100, filter, crs, crs
                    )
                };

                this.oafLoadingStates[inputKey] = false;
            }

            this.requestBody.inputs[inputKey] = event.target.checked
                ? scenarioInputs[inputKey]
                : undefined;
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
            this.inputsValue = OgcApiProcess.getInputDefaultsFromDescription(this.processDescription);
            this.requestBody.inputs = {
                ...this.inputsValue,
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

            Object.assign(scenario.jobs[jobID], {jobStatus: typeof this.jobStatus !== "undefined" ? JSON.parse(JSON.stringify(this.jobStatus)) : this.jobStatus});
            Object.assign(scenario.jobs[jobID], {jobResult: typeof this.jobResults !== "undefined" ? JSON.parse(JSON.stringify(this.jobResults)) : this.jobResults});
        },

        /**
         * Sets the inputs value according to input and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @returns {void}
         */
        setInputsValue (inputKey, propertyKey, val) {
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                return;
            }

            if (propertyKey === "") {
                this.inputsValue[inputKey] = val;
                return;
            }

            if (typeof this.inputsValue[inputKey] === "undefined") {
                this.inputsValue[inputKey] = {};
            }

            this.inputsValue[inputKey][propertyKey] = val;
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
        <div v-if="primaryTypeInputsKeys.length">
            <hr>
            <div>
                <div
                    v-for="(input, propertyKey) in primaryTypeInputs"
                    :key="propertyKey"
                >
                    <DynamicInputByType
                        :id="propertyKey"
                        :input-type="input.type"
                        :label="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                        :placeholder="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                        :value="getInputsValue(input.inputKey, propertyKey, input.default)"
                        :min="input.minimum"
                        :max="input.maximum"
                        :aria="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                        @update:value="setInputsValue(input.inputKey, propertyKey, $event)"
                        @update:checked="setInputsValue(input.inputKey, propertyKey, $event)"
                    />
                </div>
            </div>
        </div>
        <div
            v-for="(input, inputKey) in optionalOafTypeInputsPrimary"
            :key="inputKey"
            class="mb-2"
        >
            <div
                v-if="oafLoadingStates[inputKey]"
                class="d-flex align-items-center"
            >
                <SpinnerItem />
                <span class="ms-2">
                    {{ getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping) }}
                </span>
            </div>
            <div
                v-else
                class="form-switch"
            >
                <SwitchInput
                    :id="`simulation-parameter-switch-input-${inputKey}`"
                    :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                    :aria="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                    :interaction="event => onOafSwitchChange(event, inputKey)"
                    :checked="Object.hasOwn(currentPlanningScenario?.inputs, inputKey)"
                />
            </div>
        </div>
        <div v-if="Object.keys(stringTypeInputs).length || Object.keys(objectTypeInputs).length">
            <hr>
            <AccordionItem
                id="advanced-simulation-parameters"
                :title="$t('additional:modules.tools.simulationTool.simulationAdditionalParameter')"
            >
                <div
                    v-for="(input, inputKey) in optionalOafTypeInputsAdvanced"
                    :key="inputKey"
                    class="mb-2"
                >
                    <div
                        v-if="oafLoadingStates[inputKey]"
                        class="d-flex align-items-center"
                    >
                        <SpinnerItem />
                        <span class="ms-2">
                            {{ getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping) }}
                        </span>
                    </div>
                    <div
                        v-else
                        class="form-switch"
                    >
                        <SwitchInput
                            :id="`simulation-parameter-switch-input-${inputKey}`"
                            :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :aria="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :interaction="event => onOafSwitchChange(event, inputKey)"
                            :checked="Object.hasOwn(currentPlanningScenario?.inputs, inputKey)"
                        />
                    </div>
                </div>
                <div
                    v-for="(input, inputKey) in excludePrimaryTypeKeys(stringTypeInputs)"
                    :key="inputKey"
                >
                    <DynamicInputByType
                        :id="inputKey"
                        input-type="string"
                        :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                        :placeholder="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                        :value="input.default"
                        @update:value="setInputsValue(inputKey, '', $event)"
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
                        v-for="(property, propertyKey) in excludePrimaryTypeKeys(input.schema.properties)"
                        :key="propertyKey"
                    >
                        <DynamicInputByType
                            :id="`${inputKey}-${propertyKey}`"
                            :label="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :max="property.maximum"
                            :min="property.minimum"
                            :placeholder="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :input-type="property.type"
                            :step="property.type === 'integer' ? 1 : 0.1"
                            :value="getInputsValue(inputKey, propertyKey, property?.default)"
                            :aria="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :checked="typeof property.default === 'boolean' ? property.default : false"
                            @update:value="setInputsValue(inputKey, propertyKey, $event)"
                            @update:checked="setInputsValue(inputKey, propertyKey, $event)"
                        />
                    </div>
                </AccordionItem>
            </AccordionItem>
        </div>
        <label
            for="simulateForOutput"
            class="typo__label"
        >
            {{ $t('additional:modules.tools.simulationTool.chooseOutputParam') }}
        </label>
        <div class="mb-3">
            <select
                id="simulateForOutput"
                v-model="selectedOutputOptions"
                class="form-select"
                :aria-label="$t('additional:modules.tools.simulationTool.outputParam')"
                multiple
            >
                <option
                    v-for="(option, i) in outputOptions"
                    :key="option.name + i"
                    :value="option"
                    selected
                >
                    {{ option.name }}
                </option>
            </select>
        </div>
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
