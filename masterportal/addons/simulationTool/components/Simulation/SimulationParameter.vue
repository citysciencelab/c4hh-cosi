<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import DynamicInputByType from "../shared/components/DynamicInputByType.vue";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getBBOXGeometry from "../shared/js/getBBoxGeometry.js";
import {getMappedProperty} from "../shared/js/getMappedProperty.js";
import getOAFFeature from "../../../../src/shared/js/api/oaf/getOAFFeature.js";
import InputText from "../../../../src/shared/modules/inputs/components/InputText.vue";
import isObject from "../../../../src/shared/js/utils/isObject.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../../src/core/layers/js/layerFactory.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import OgcApiProcess from "../../js/ogcApiProcess.js";
import SectionHeader from "../SectionHeader.vue";
import SpinnerItem from "../../../../src/shared/modules/spinner/components/SpinnerItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import {infrastructureLayerId} from "../../layerIds.js";

export default {
    name: "SimulationParameter",
    components: {
        AccordionItem,
        DynamicInputByType,
        FileUpload,
        FlatButton,
        InputText,
        Multiselect,
        SectionHeader,
        SpinnerItem,
        SwitchInput
    },
    data () {
        return {
            currentSimulationId: "",
            oafLoadingStates: {},
            primaryTypeInputs: {},
            processDescriptions: [],
            processHandlers: [],
            requestBodies: [],
            selectedOutputOptions: [],
            simulationName: "",
            ignoreProperties: [],
            flatInputs: {},
            nestedInputs: {}
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentPlanningScenarioId",
            "planningScenarios",
            "previousComponentOfSimulation",
            "simulations"
        ]),
        ...mapGetters("Modules/Login", ["accessToken"]),

        /**
         * Gets the current planning scenario.
         * If no scenario is selected, it defaults to the first scenario.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            if (this.planningScenarios && this.planningScenarios.length > 0) {
                if (!this.currentPlanningScenarioId) {
                    this.setCurrentPlanningScenarioId(this.planningScenarios[0]?.id);
                    return this.planningScenarios[0];
                }
                return this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
            }
            return null;
        },

        /**
         * Gets the combined inputs from all process descriptions.
         * This includes every input that is defined in at least one process description.
         * @returns {Object} The combined inputs.
         */
        combinedInputs () {
            if (!this.processDescriptions.length) {
                return {};
            }

            return this.processDescriptions.reduce((inputs, description) => Object.assign(inputs, description.inputs), {});
        },

        /**
         * Checks if any  value in `oafLoadingStates` is `true`.
         * @returns {boolean} true if true, false otherwise.
         */
        isSomeOafLoading () {
            return Object.values(this.oafLoadingStates).some(value => value === true);
        },

        /**
         * Gets the optional inputs of type FeatureCollection from the process description.
         * @returns {Object} An object of inputs.
         */
        optionalOafTypeInputs () {
            return Object.fromEntries(
                Object.entries(this.combinedInputs).filter(([, input]) => {
                    return input.minOccurs === 0
                        && input.schema?.allOf?.some(schema => schema.format === "geojson-feature-collection");
                })
            );
        },

        /**
         * Gets the subset of optionalOafTypeInputs that is neither primary nor invisible.
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
         * Gets the subset of optionalOafTypeInputs that is primary.
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
         * Returns only those outputs that are defined in all process descriptions.
         * @return {Object[]} The array of Objects for options.
         */
        outputOptions () {
            if (!this.processDescriptions.length ||
                this.processDescriptions.some(description => !isObject(description.outputs))
            ) {
                return [];
            }

            const [firstDescription, ...otherDescriptions] = this.processDescriptions,
                keysExistingInAllDescriptions = Object.keys(firstDescription.outputs).filter(
                    outputKey => otherDescriptions.every(description => description.outputs[outputKey])
                );

            return keysExistingInAllDescriptions.map(key => ({
                code: key,
                name: this.getMappedProperty(key, this.simulation?.outputs?.propertiesMapping)
            }));
        },

        /**
         * Gets the keys of the primaryTypeInputs object.
         * @returns {String[]} The keys of the primaryTypeInputs object.
         */
        primaryTypeInputsKeys () {
            return Object.keys(this.primaryTypeInputs);
        },

        /**
         * Gets the simulation configuration to the currently selected planning scenario.
         * @returns {Object} The current simulation configuration.
         */
        simulation () {
            return this.simulations.find(simulation => simulation.id === this.currentSimulationId);
        }
    },
    watch: {
        /**
         * Render current scenario feature and shows it.
         */
        currentPlanningScenario () {
            this.updateFeatures();
            this.zoomToFeature();
        },

        /**
         * Split input mapping into nested and flat inputs by looking at their schema type.
         */
        combinedInputs (combinedInputs) {
            this.nestedInputs = {};
            this.flatInputs = {};

            Object.entries(combinedInputs).forEach(([inputKey, input]) => {
                if (this.simulation?.inputs?.[inputKey]?.menu !== "nowhere" //
                    && !this.simulation?.inputs?.[inputKey]?.editable) {
                    switch (input.schema?.type) {
                        case "object":
                            this.nestedInputs[inputKey] = input;
                            break;
                        case "string":
                            // for some reason not nested inputs always have the type "string"
                            this.flatInputs[inputKey] = input;
                            break;
                        default:
                            console.warn(`Unsupported input type for ${inputKey}: ${input.schema?.type}`);
                            break;
                    }
                }
            });
        },

        /**
         * Changes the requestBody according to the selected outputs.
         * @param {Object[]} val the selected outputs.
         */
        selectedOutputOptions (val) {
            this.requestBodies.forEach(requestBody => {
                requestBody.outputs = {};
                val.forEach(elem => {
                    requestBody.outputs[elem.code] = {};
                });
            });
        },

        currentSimulationId: {
            async handler () {
                if (this.currentPlanningScenario && this.simulation) {
                    await this.prepareRequestBodies();
                    this.primaryTypeInputs = this.getPrimaryTypeInputs();
                    this.selectedOutputOptions = this.outputOptions;
                }
            },
            immediate: true
        },

        simulations: {
            handler (newSimulations) {
                if (newSimulations.length > 0 && !this.currentSimulationId) {
                    this.currentSimulationId = newSimulations[0].id;
                }
            },
            immediate: true
        }
    },
    mounted () {
        if (typeof this.currentPlanningScenario !== "undefined") {
            this.updateFeatures();
            this.zoomToFeature();
        }
    },
    unmounted () {
        if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
        }
        if (typeof layerCollection.getLayerById(infrastructureLayerId) !== "undefined") {
            layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/SimulationTool", [
            "addFile",
            "jobStatusChanged",
            "updateFeatures",
            "zoomToFeature"
        ]),
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setCurrentPlanningScenarioId",
            "setMode",
            "setSimulationIdForResults"
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
         * Gets non-primary properties from an object input.
         * @param {Object} input - The input object.
         * @param {String} inputKey - The input key.
         * @returns {Object} The filtered properties object.
         */
        getNonPrimaryProperties (input, inputKey) {
            if (!input?.schema?.properties) {
                return {};
            }

            const primaryProperties = this.simulation?.inputs?.[inputKey]?.primaryProperties || [],
                result = {};

            Object.entries(input.schema.properties).forEach(([propertyKey, property]) => {
                if (!primaryProperties.includes(propertyKey) && !this.ignoreProperties.includes(propertyKey)) {
                    result[propertyKey] = this.processInputProperty(property, inputKey, propertyKey);
                }
            });
            return result;
        },

        /**
         * Gets non-primary string inputs.
         * @returns {Object} The filtered string inputs.
         */
        getNonPrimaryStringInputs () {
            const result = {};

            Object.entries(this.flatInputs).forEach(([inputKey, input]) => {
                if (this.simulation?.inputs?.[inputKey]?.menu !== "primary") {
                    result[inputKey] = this.processInputProperty(input, inputKey);
                }
            });
            return result;
        },

        /**
         * Gets the requestBody inputs value according to input and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @returns {String} the parameter value. It could be the rendered value or default value.
         */
        getRequestBodyInputByKey (inputKey, propertyKey, val) {
            if (this.ignoreProperties.includes(propertyKey)) {
                return undefined;
            }
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                return val;
            }

            const requestBody = this.requestBodies.find(body => body.inputs?.[inputKey]);

            if (typeof requestBody?.inputs?.[inputKey]?.[propertyKey] !== "undefined") {
                if (requestBody.inputs[inputKey][propertyKey].enum) {
                    return {
                        enum: requestBody.inputs[inputKey][propertyKey].enum,
                        value: requestBody.inputs[inputKey][propertyKey].value
                    };
                }
                return requestBody.inputs[inputKey][propertyKey];
            }

            if (propertyKey === "") {
                if (requestBody?.inputs?.[inputKey]?.enum) {
                    return {
                        enum: requestBody.inputs[inputKey].enum,
                        value: requestBody.inputs[inputKey].value
                    };
                }
                return requestBody?.inputs?.[inputKey];
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
         * Processes an input property to extract type information and handle enums.
         * @param {Object} property - The property object from the schema.
         * @param {String} inputKey - The input key this property belongs to.
         * @param {String} propertyKey - The property key (for nested properties) or input key (for top-level).
         * @returns {Object} Processed property with consistent structure.
         */
        processInputProperty (property, inputKey, propertyKey = null) {
            const processed = {...property};

            // Handle enum detection consistently
            if (property.schema?.enum?.length) {
                processed.type = "enum";
                processed.enum = [...property.schema.enum];
                processed.default = property.schema.default ?? property.schema.enum[0];
            }
            else if (property.enum?.length) {
                processed.type = "enum";
                processed.enum = [...property.enum];
                processed.default = property.default ?? property.enum[0];
            }
            else if (property.schema?.type) {
                processed.type = property.schema.type;
                processed.default = property.schema.default ?? property.default;
                processed.minimum = property.schema.minimum ?? property.minimum;
                processed.maximum = property.schema.maximum ?? property.maximum;
            }
            else {
                processed.type = property.type || "string";
            }

            processed.inputKey = inputKey;
            processed.propertyKey = propertyKey;

            // Clean up schema references for consistency
            delete processed.schema;
            delete processed.title;
            delete processed.description;

            return processed;
        },

        /**
     * Gets inputs based on menu type and filters.
     * @param {String|null} [menuType=null] - The menu type to filter by ("primary", "advanced", etc.).
     * @param {Boolean} [includeObjectProperties=true] - Whether to include object properties.
     * @returns {Object} Filtered inputs based on criteria.
     */
        getInputsByMenuType (menuType = null, includeObjectProperties = true) {
            const result = {};

            Object.entries(this.combinedInputs).forEach(([inputKey, input]) => {
                const inputConfig = this.simulation?.inputs?.[inputKey];

                // Skip if menu type doesn't match (null means all types)
                if (menuType && inputConfig?.menu !== menuType) {
                    return;
                }

                // Skip editable inputs (handled elsewhere)
                if (inputConfig?.editable) {
                    return;
                }

                // Skip inputs marked as "nowhere"
                if (inputConfig?.menu === "nowhere") {
                    return;
                }

                if (input.schema?.type === "object" && includeObjectProperties) {
                    // Handle object properties
                    const properties = input.schema.properties || {},
                        primaryProperties = inputConfig?.primaryProperties || [];

                    Object.entries(properties).forEach(([propertyKey, property]) => {
                        // For primary menu, only include properties marked as primary
                        if (menuType === "primary" && !primaryProperties.includes(propertyKey)) {
                            return;
                        }

                        // For non-primary menus, exclude primary properties to avoid duplication
                        if (menuType !== "primary" && primaryProperties.includes(propertyKey)) {
                            return;
                        }

                        result[propertyKey] = this.processInputProperty(property, inputKey, propertyKey);
                    });
                }
                else if (input.schema?.type !== "object") {
                    // Handle non-object inputs (string, number, etc.)
                    result[inputKey] = this.processInputProperty(input, inputKey);
                }
            });

            return result;
        },

        /**
         * Gets the primary inputs without oaf types from the process description.
         * @returns {Object} The inputs of the primary type.
         */
        getPrimaryTypeInputs () {
            const primaryInputs = this.getInputsByMenuType("primary");

            return Object.fromEntries(
                Object.entries(primaryInputs).filter(([inputKey]) => {
                    const input = this.combinedInputs[inputKey];

                    return !(input?.minOccurs === 0
                && input?.schema?.allOf?.some(schema => schema.format === "geojson-feature-collection"));
                })
            );
        },

        /**
         * Gets the optional BBOX URL inputs from the process description.
         * It returns an object with the inputKey as key and the URL as value.
         * @returns {Object} The optional BBOX URL inputs.
         */
        getOptionalBBOXUrlInputs () {
            const result = {};

            Object.keys(this.combinedInputs).forEach(inputKey => {
                const input = this.combinedInputs[inputKey];

                if (input.schema?.type === "string"
                    && input.schema?.format === "uri"
                    && this.simulation?.inputs?.[inputKey]?.source?.type === "optional_bbox_url") {
                    result[inputKey] = this.simulation?.inputs?.[inputKey]?.source?.url;
                }
            });
            return result;
        },

        /**
         * Checks if the value for the given inputKey is set.
         * @param {String} inputKey The input key.
         * @param {String} defaultVal The default value.
         * @returns {Boolean} true if the input is checked, false otherwise.
         */
        isValueSet (inputKey, defaultVal) {
            return typeof this.getRequestBodyInputByKey(inputKey, "", defaultVal) !== "undefined";
        },

        /**
         * Event handler for change of switch for oaf input type.
         * Loads the data from the source if it is not already loaded.
         * Caches the data in the current planning scenario.
         * @param {Object} event The change event.
         * @param {String} inputKey The input key.
         * @returns {void}
         */
        async onOafSwitchChange (event, inputKey) {
            if (!event?.target?.checked) {
                this.setRequestBodyInput(inputKey, "", undefined);
                return;
            }
            if (this.currentPlanningScenario.inputs[inputKey]) {
                this.setRequestBodyInput(inputKey, "", this.currentPlanningScenario.inputs[inputKey]);
                return;
            }
            this.oafLoadingStates[inputKey] = true;

            const source = this.simulation.inputs[inputKey].source,
                crs = this.currentPlanningScenario.inputs.crs,
                filter = getOAFFeature.getOAFGeometryFilter(getBBOXGeometry(this.currentPlanningScenario), "geometry", "intersects"),
                featureCollection = {
                    type: "FeatureCollection",
                    features: await getOAFFeature.getOAFFeatureGet(
                        source.url, source.collection, {limit: 100, filter, filterCrs: crs, crs}
                    )
                };

            this.setRequestBodyInput(inputKey, "", featureCollection);
            this.oafLoadingStates[inputKey] = false;

            this.currentPlanningScenario.inputs[inputKey] = featureCollection;
        },

        /**
         * Event handler for change of selected planning scenario.
         * @param {Object} event The change event.
         * @returns {void}
         */
        async onPlanningScenarioChange (event) {
            this.setCurrentPlanningScenarioId(event.target.value);
            this.currentSimulationId = "";
        },

        /**
         * Event handler for progress update of the simulation.
         * @param {Object} jobStatus The job status object.
         * @param {Object} job The job object.
         * @returns {void}
         */
        onProgressUpdate (jobStatus, job) {
            job.jobStatus = jobStatus;
            this.jobStatusChanged();
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
         * Opens simulation results component.
         * @param {String} simulationId - Id of the simulation to open.
         * @returns {void}
         */
        openSimulation (simulationId) {
            this.setSimulationIdForResults(simulationId);
            this.setMode("simulationList");
        },

        /**
         * Checks if an access token is present.
         * Sends an alert if not.
         * @returns {boolean} True if an access token is present, false otherwise.
         */
        isLoggedIn () {
            if (!this.accessToken) {
                this.addSingleAlert({
                    content: this.$t("additional:modules.tools.simulationTool.simulationLoginRequiredText"),
                    category: "warning",
                    title: this.$t("additional:modules.tools.simulationTool.simulationLoginRequired")
                });
                return false;
            }
            return true;
        },

        /**
         * Initializes the process handlers for the simulation.
         * @returns {void}
         */
        initializeProcessHandlers () {
            this.processHandlers = (this.simulation?.processes ?? []).map(
                process => new OgcApiProcess(process.url, process.id)
            );
        },

        /**
         * Fetches the process descriptions for the simulation.
         * @returns {Promise<void>}
         */
        async fetchProcessDescriptions () {
            this.processDescriptions = await Promise.all(
                this.processHandlers.map(handler => handler.getDescription(this.accessToken))
            );
        },

        /**
         * Sets up the ignore properties for the simulation.
         * @returns {void}
         */
        setupIgnoreProperties () {
            this.ignoreProperties = Object.keys(this.simulation.inputs)
                .filter(inputKey => this.simulation.inputs[inputKey].ignoreProperties)
                .flatMap(inputKey => this.simulation.inputs[inputKey].ignoreProperties);

        },

        /**
         * Creates the request bodies for the simulation.
         * @returns {void}
         */
        createRequestBodies () {
            const filteredProcessDescriptions = [];

            this.processDescriptions.forEach(
                description => filteredProcessDescriptions.push(this.removeUnwantedProperty(description, this.ignoreProperties)));
            this.requestBodies = filteredProcessDescriptions.map(description => ({
                inputs: {
                    ...OgcApiProcess.getInputDefaultsFromDescription(description),
                    ...this.currentPlanningScenario.inputs
                },
                outputs: {}
            }));
        },

        /** Prepares the request body for the simulation.
         * @returns {void}
         */
        async prepareRequestBodies () {
            if (!this.isLoggedIn()) {
                return;
            }

            this.initializeProcessHandlers();
            await this.fetchProcessDescriptions();
            this.setupIgnoreProperties();
            this.createRequestBodies();
        },

        /**
         * Recursively removes unwanted properties from an object.
         * @param {Object|Array} obj - The object or array to process.
         * @param {String[]} ignoreProperties - The properties to remove.
         * @returns {Object|Array} The processed object or array.
         */
        removeUnwantedProperty (obj, ignoreProperties = []) {
            if (!obj || typeof obj !== "object") {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(item => this.removeUnwantedProperty(item, ignoreProperties));
            }

            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([key]) => !ignoreProperties.includes(key))
                    .map(([key, value]) => [key, this.removeUnwantedProperty(value, ignoreProperties)])
            );
        },

        /**
         * Removes all inputs of type "FeatureCollection" from the request bodies that have no features.
         * @param {Object[]} requestBodies - The original request bodies. Modified in place.
         * @returns {Object[]} The modified request bodies.
         */
        removeEmptyCollections (requestBodies) {
            requestBodies.forEach(requestBody => {
                if (!isObject(requestBody?.inputs)) {
                    return;
                }
                requestBody.inputs = Object.fromEntries(
                    Object.entries(requestBody.inputs).filter(
                        ([, input]) => input?.type !== "FeatureCollection" || input?.features?.length > 0
                    )
                );
            });

            return requestBodies;
        },
        /**
         * Replaces all objects with {enum: ..., value: ...} in a deeply nested object with the value of 'value'.
         * @param {Object|Array} obj - The object or array to process.
         * @returns {Object|Array} The processed object or array.
         */
        replaceEnumValueObjects (obj) {
            if (Array.isArray(obj)) {
                return obj.map(item => this.replaceEnumValueObjects(item));
            }
            else if (obj && typeof obj === "object") {
                if (Object.prototype.hasOwnProperty.call(obj, "enum") && Object.prototype.hasOwnProperty.call(obj, "value")) {

                    return obj.value;
                }
                return Object.fromEntries(
                    Object.entries(obj).map(([key, value]) => [key, this.replaceEnumValueObjects(value)])
                );
            }
            return obj;
        },


        /**
         * Prepares the request bodies for the execution and starts the simulation.
         * @returns {void}
         */
        async startSimulation () {
            if (!this.isLoggedIn()) {
                return;
            }
            this.removeEmptyCollections(this.requestBodies);
            this.requestBodies = this.replaceEnumValueObjects(this.requestBodies);

            const scenario = this.planningScenarios.find(scnrio => scnrio.id === this.currentPlanningScenarioId), // Cannot use computed property here, which may change during async call.
                executeResponses = await Promise.all(
                    this.processHandlers.map((handler, index) => handler.execute(this.requestBodies[index], this.accessToken))
                ),
                jobIDs = executeResponses.map(response => response.jobID),
                initialStatuses = executeResponses.map(response => response.status),
                newSimulationId = jobIDs.join("_"),
                newSimulation = {
                    name: this.simulationName || this.simulation.title,
                    configId: this.currentSimulationId};

            if (jobIDs.some(ID => !ID)) {
                console.warn("Not all job IDs returned from process execution.");
                return;
            }

            scenario.simulations ??= {};
            scenario.simulations[newSimulationId] = newSimulation;
            this.openSimulation(newSimulationId);

            newSimulation.jobs = Object.fromEntries(jobIDs.map(ID => [ID, {}]));

            Object.values(newSimulation.jobs).forEach(async (job, index) => {
                job.requestBody = JSON.parse(JSON.stringify(this.requestBodies[index]));
                job.jobStatus = {status: initialStatuses[index]};
                job.resultStyle = this.simulation.processes[index].resultStyle;
                job.jobResults = await this.processHandlers[index].pollJobStatusAndGetResults(
                    this.accessToken,
                    jobIDs[index],
                    this.simulation.processes[index].pollingInterval,
                    jobStatus => this.onProgressUpdate(jobStatus, job)
                );
                this.jobStatusChanged();
            });
        },

        /**
         * Sets the inputs value of the request body input according to inputKey and property as key.
         * @param {String} inputKey the input key.
         * @param {String} propertyKey the property key.
         * @param {String} val the value.
         * @param {Boolean} isEnum whether the input is an enum or not.
         * @returns {void}
         */
        setRequestBodyInput (inputKey, propertyKey, val, isEnum = false) {
            if (typeof inputKey !== "string" || typeof propertyKey !== "string") {
                console.warn(`Invalid parameters: inputKey=${inputKey}, propertyKey=${propertyKey}`);
                return;
            }

            this.processDescriptions.forEach((description, index) => {
                if (!description.inputs?.[inputKey]) {
                    return;
                }

                if (!this.requestBodies[index]) {
                    this.requestBodies[index] = {inputs: {}};
                }
                if (!this.requestBodies[index].inputs) {
                    this.requestBodies[index].inputs = {};
                }
                if (propertyKey === "") {
                    // top-level input
                    if (isEnum && this.requestBodies[index]?.inputs?.[inputKey]?.value !== undefined) {
                        // Only update value part of enum object
                        this.requestBodies[index].inputs[inputKey].value = val;
                        return;
                    }
                    this.requestBodies[index].inputs[inputKey] = val;
                    return;
                }

                if (typeof this.requestBodies[index].inputs[inputKey] === "undefined") {
                    this.requestBodies[index].inputs[inputKey] = {};
                }
                if (isEnum && this.requestBodies[index].inputs[inputKey][propertyKey]?.value !== undefined) {
                    this.requestBodies[index].inputs[inputKey][propertyKey].value = val;
                    return;
                }
                this.requestBodies[index].inputs[inputKey][propertyKey] = val;
            });
        },

        /**
         * Toggles the optional BBOX URL inputs for the given key.
         * @param {String} inputKey The input key.
         * @param {Object} event The event object.
         */
        toggleOptionalBBOXUrlInputs (inputKey, event) {
            if (!event?.target?.checked) {
                this.setRequestBodyInput(inputKey, "", undefined);
                return;
            }
            const completedURI = `${this.getOptionalBBOXUrlInputs()[inputKey]}/${getBBOXGeometry(this.currentPlanningScenario)?.getExtent()}/500x500.tif?coord_crs=epsg:25832`;

            this.setRequestBodyInput(inputKey, "", completedURI);
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
        <h5 class="mb-3">
            {{ $t('additional:modules.tools.simulationTool.planningScenario') }}
        </h5>
        <div class="container">
            <div class="row">
                <div class="col-md-6 select-scenario">
                    <div class="form-floating mb-3">
                        <select
                            id="planingScenario"
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
                <div class="col-md-6 create-scenario pt-0">
                    <FlatButton
                        class="pe-2"
                        :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                        :icon="'bi bi-pencil-square'"
                        :interaction="() => openCreatePlanningScenario()"
                        :text="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
                    />
                </div>
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
        <div v-if="currentPlanningScenario">
            <h5 class="my-4">
                {{ $t('additional:modules.tools.simulationTool.addSimulation') }}
            </h5>
            <InputText
                id="simulation-name"
                v-model="simulationName"
                :label="$t('additional:modules.tools.simulationTool.simulationName')"
                :placeholder="$t('additional:modules.tools.simulationTool.simulationName')"
            />
            <div class="form-floating mb-3">
                <select
                    id="simulateForPlanning"
                    v-model="currentSimulationId"
                    class="form-select"
                    :aria-label="$t('additional:modules.tools.simulationTool.selectSimulation')"
                >
                    <option
                        v-for="model in simulations"
                        :key="model.id"
                        :value="model.id"
                    >
                        {{ model.title }}
                    </option>
                </select>
                <label for="simulateForPlanning">
                    {{ $t('additional:modules.tools.simulationTool.selectSimulation') }}
                </label>
            </div>
            <div v-if="primaryTypeInputsKeys.length">
                <div>
                    <h6 class="mt-5 mb-3">
                        {{ $t('additional:modules.tools.simulationTool.parameters') }}
                    </h6>
                    <div
                        v-for="(input, propertyKey) in primaryTypeInputs"
                        :key="propertyKey"
                    >
                        <DynamicInputByType
                            :id="propertyKey"
                            :input-type="input.type"
                            :label="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                            :placeholder="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                            :value="getRequestBodyInputByKey(input.inputKey, propertyKey, input.default)"
                            :min="input.minimum"
                            :max="input.maximum"
                            :aria="getMappedProperty(propertyKey, simulation?.inputs?.[input.inputKey]?.propertiesMapping)"
                            @update:value="setRequestBodyInput(input.inputKey, propertyKey, $event, Boolean(input.enum))"
                            @update:checked="setRequestBodyInput(input.inputKey, propertyKey, $event, Boolean(input.enum))"
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
                        :checked="isValueSet(inputKey, input?.default)"
                    />
                </div>
            </div>
            <div v-if="Object.keys(flatInputs).length || Object.keys(nestedInputs).length">
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
                                :checked="isValueSet(inputKey, input?.default)"
                            />
                        </div>
                    </div>
                    <div
                        v-for="(input, inputKey) in getNonPrimaryStringInputs()"
                        :key="inputKey"
                    >
                        <div
                            v-if="getOptionalBBOXUrlInputs()[inputKey]"
                            class="form-switch"
                        >
                            <SwitchInput
                                :id="`simulation-parameter-switch-input-${inputKey}`"
                                :ref="`simulation-parameter-switch-input-${inputKey}`"
                                :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                                :aria="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                                :interaction="event => toggleOptionalBBOXUrlInputs(inputKey, event)"
                                :checked="isValueSet(inputKey, input?.default)"
                            />
                        </div>
                        <DynamicInputByType
                            v-else
                            :id="inputKey"
                            :input-type="input.type"
                            :label="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :placeholder="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                            :value="getRequestBodyInputByKey(inputKey, '', input.default)"
                            :min="input.minimum"
                            :max="input.maximum"
                            @update:value="setRequestBodyInput(inputKey, '', $event, Boolean(input?.enum))"
                            @update:checked="setRequestBodyInput(inputKey, '', $event, Boolean(input?.enum))"
                        />
                    </div>
                    <AccordionItem
                        v-for="(input, inputKey) in nestedInputs"
                        :id="inputKey"
                        :key="inputKey"
                        :title="getMappedProperty(inputKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                        font-size="font-size-small"
                    >
                        <div
                            v-for="(property, propertyKey) in getNonPrimaryProperties(input, inputKey)"
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
                                :value="getRequestBodyInputByKey(inputKey, propertyKey, property?.default)"
                                :aria="getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping)"
                                :checked="typeof property.default === 'boolean' ? property.default : false"
                                @update:value="setRequestBodyInput(inputKey, propertyKey, $event, Boolean(property.enum))"
                                @update:checked="setRequestBodyInput(inputKey, propertyKey, $event, Boolean(property.enum))"
                            />
                        </div>
                    </AccordionItem>
                </AccordionItem>
            </div>
            <h6 class="mt-2 mb-3">
                {{ $t('additional:modules.tools.simulationTool.outputParam') }}
            </h6>
            <Multiselect
                id="outputParam"
                v-model="selectedOutputOptions"
                :placeholder="$t('additional:modules.tools.simulationTool.chooseOutputParam')"
                :aria-label="$t('additional:modules.tools.simulationTool.chooseOutputParam')"
                label="name"
                track-by="code"
                :show-labels="false"
                :allow-empty="false"
                :options="outputOptions"
                :searchable="true"
                :multiple="true"
                :open="true"
            >
                <template #tag="{ option, remove }">
                    <button
                        class="multiselect__tag"
                        :class="option.code"
                        @click="remove(option)"
                        @keypress="remove(option)"
                    >
                        {{ option.name }}
                    </button>
                </template>
            </Multiselect>
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
                        id="startSimulation"
                        :interaction="startSimulation"
                        :aria-label="$t('additional:modules.tools.simulationTool.simulationStart')"
                        :text="$t('additional:modules.tools.simulationTool.simulationStart')"
                        :disabled="!currentPlanningScenario || isSomeOafLoading || !currentSimulationId"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.d-flex {
    .select-scenario {
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
h6 {
    font-size: $font_size_big;
}

</style>

<style lang="scss">

.multiselect__tag {
        background: $secondary;
        border-radius: $badge-border-radius;
        border: none;
        padding-top: 5px;
        color: $white;
}
.multiselect__option--selected.multiselect__option--highlight,
.multiselect__option--selected.multiselect__option--highlight:after,
.multiselect__option:after,
.multiselect__option--selected,
.multiselect__option--selected:after{
  font-size: $font_size_sm;
  background: $light-blue;
  color: $black;
  font-weight: normal;
}

</style>
