<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ConvertFeature from "../../js/convertFeatures";
import ConvertStyle from "../../js/convertStyle";
import dayjs from "dayjs";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        AccordionItem,
        SectionHeader
    },
    data () {
        return {
            currentOutput: "",
            finished: "",
            jobResult: {},
            jobStatus: {},
            layers: [],
            started: "",
            status: ""
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "currentJobID",
            "planningScenarios",
            "simulations",
            "simulationResultStyle"
        ]),

        /**
         * Get the current job based on the current job ID.
         * @returns {Object} The current job.
         */
        currentJob () {
            return this.currentPlanningScenario?.jobs?.[this.currentJobID];
        },

        /**
         * Get the current job status based on the current job.
         * @returns {Object} The current job status.
         */
        currentJobResult () {
            return this.currentJob?.jobResult;
        },

        /**
         * Get the current job status based on the current job.
         * @returns {Object} The current job status.
         */
        currentJobStatus () {
            return this.currentJob?.jobStatus;
        },

        /**
         * Get the planning scenario containing the current job.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios?.find(scenario => scenario?.jobs?.[this.currentJobID]);
        },

        /**
         * Gets the style object from current simulation.
         * @returns {Object} The current style object.
         */
        currentStyle () {
            return this.simulation?.resultStyle;
        },

        /**
         * Gets the outputs of results.
         * @returns {String[]} The outputs of results.
         */
        outputs () {
            if (isObject(this.currentJobResult)) {
                return Object.keys(this.currentJobResult);
            }

            return [];
        },

        /**
        * Get the simulation configuration for the current job.
        * May change, when more features for multiple simulations are added!
        * @returns {Object} The current simulation configuration.
        */
        simulation () {
            return this.currentJob?.simulation;
        }
    },
    watch: {
        /**
         * Shows the feature when the simulation is changed.
         */
        simulation () {
            this.showFeatures(this.currentJobID, this.currentJobResult, this.outputs);
        },

        /**
         * Sets different value of variable when the job status is changed.
         * @param {Object} val - The current job status.
         */
        currentJobStatus: {
            handler (val) {
                this.started = val?.started ? dayjs(val?.started).format("DD.MM.YYYY, hh:mm:ss") : val?.started;
                this.status = val?.status;
                this.finished = val?.finished ? dayjs(val?.finished).format("DD.MM.YYYY, hh:mm:ss") : val?.finished;
            },
            immediate: true
        },

        /**
         * Sets the visibility of output, only the layer of current output shows.
         * @param {String} val - The current output.
         */
        currentOutput (val) {
            this.layers.forEach(layer => {
                if (typeof layer?.layer?.get !== "function") {
                    return;
                }
                layer.layer.setVisible(layer.layer.get("id") === val);
            });
        }
    },
    mounted () {
        this.showFeatures(this.currentJobID, this.currentJobResult, this.outputs);
    },
    unmounted () {
        if (this.layers.length) {
            this.layers.forEach(layer => {
                layer.getLayerSource().clear();
            });
        }
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent"]),

        getMappedProperty,

        /**
         * Sets the Feature style according to the value of property.
         * @param {ol/Feature} feature - The feature.
         * @param {Object} currentStyles - The current style objects.
         * @returns {void}
         */
        setFeatureStyle (feature, currentStyles) {
            let style = null;

            if (!isObject(currentStyles) || !Array.isArray(currentStyles?.styles)) {
                feature.setStyle(style);
                return;
            }

            if (currentStyles?.type === "polygon") {
                style = currentStyles.styles.find(styleObj => feature.get(currentStyles?.property) === styleObj?.value)?.style;
                style = typeof style !== "undefined" ? ConvertStyle.geoJsonToOpenlayers(style) : null;
            }

            feature.setStyle(style);
        },

        /**
         * Sets the current output.
         * @param {String} output - The output.
         * @returns {void}
         */
        setCurrentOutput (output) {
            this.currentOutput = output;
        },

        /**
         * Shows features in map.
         * @param {String} jobID the job id.
         * @param {Object} jobResult - The job result.
         * @param {String[]} outputs - The output array.
         * @returns {void}
         */
        showFeatures (jobID, jobResult, outputs) {
            if (typeof jobID !== "string" || !isObject(jobResult) || !Array.isArray(outputs)) {
                return;
            }

            outputs.forEach(output => {
                if (!Array.isArray(jobResult[output]?.features) || !jobResult[output]?.features.length) {
                    return;
                }

                const geojsonFeature = ConvertFeature.geoJsonToOpenlayers(jobResult[output]?.features);
                let layer;

                if (typeof layerCollection.getLayerById(output) !== "undefined") {
                    layer = layerCollection.getLayerById(output);
                    layer?.getLayerSource()?.clear();
                }
                else {
                    layer = layerFactory.createLayer({
                        typ: "VECTORBASE",
                        id: output,
                        name: output
                    });

                    layer?.layer.setZIndex(9999998);

                    layerCollection.addLayer(layer);
                }

                geojsonFeature.forEach(feature => {
                    feature.set("jobID", jobID);
                    this.setFeatureStyle(feature, this.currentStyle);
                });

                layer.getLayerSource().addFeatures(geojsonFeature);

                this.layers.push(layer);
                this.zoomToExtent({extent: layer.getLayerSource()?.getExtent(), options: {maxZoom: 7}});
            });
            this.setCurrentOutput(outputs[0]);
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
        <div v-if="currentJobID">
            <div
                class="d-flex"
            >
                <div
                    class="me-2"
                >
                    {{ $t('additional:modules.tools.simulationTool.planningScenario') }} {{ currentPlanningScenario?.name }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.started') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ started }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.finished') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ finished }}
                </div>
            </div>
            <div
                class="d-flex"
            >
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.status') }}:
                </div>
                <div
                    class="me-2"
                >
                    {{ status }}
                </div>
            </div>
            <div>
                <div
                    class="me-2 fw-bold"
                >
                    {{ $t('additional:modules.tools.simulationTool.showResults') }}:
                </div>
                <div
                    v-for="output in outputs"
                    :key="output"
                    class="md-12"
                >
                    <input
                        :id="output"
                        :value="output"
                        class="form-check-input"
                        type="radio"
                        :checked="output === currentOutput"
                        @input="setCurrentOutput(output)"
                    >
                    <label
                        class="form-check-label"
                        :for="output"
                    >
                        {{ getMappedProperty(output, simulation?.outputs?.propertiesMapping) }}
                    </label>
                </div>
            </div>
            <AccordionItem
                v-if="currentJob"
                id="simulation-results-accordion-inputs"
                :title="$t('additional:modules.tools.simulationTool.inputParameters')"
            >
                <div
                    v-for="(input, inputKey) in currentJob?.requestBody?.inputs"
                    :key="inputKey"
                >
                    <div
                        v-if="typeof input === 'object' && input?.type !== 'FeatureCollection'"
                    >
                        <div
                            v-for="(property, propertyKey) in input"
                            :key="`${inputKey}-${propertyKey}`"
                        >
                            {{ getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping) }}: {{ property }} <br>
                        </div>
                    </div>
                </div>
            </AccordionItem>
        </div>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobsSelected') }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

</style>
