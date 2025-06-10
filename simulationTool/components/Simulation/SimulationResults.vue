<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ConvertFeature from "../../js/convertFeatures";
import ConvertStyle from "../../js/convertStyle";
import dayjs from "dayjs";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {mapActions, mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationResults",
    components: {
        AccordionItem,
        SectionHeader,
        FlatButton
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
            "simulations"
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
         * Get the current progress of the current job and get 0 by undefined.
         * @returns {String} The current progress
         */
        currentProgress () {
            return typeof this.currentJobStatus?.progress === "undefined" ? 0 : this.currentJobStatus?.progress;
        },

        /**
         * Get the planning scenario containing the current job.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios?.find(scenario => scenario?.jobs?.[this.currentJobID]);
        },

        /**
         * Get the current simulation name based on the current job.
         * @returns {Object} The current job simulation name.
         */
        currentSimulationName () {
            return this.currentJob?.simulationName;
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
        if (typeof this.currentPlanningScenario !== "undefined") {
            this.updateFeatures();
            this.zoomToFeature();
        }
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
        ...mapActions("Modules/SimulationTool", ["updateFeatures", "zoomToFeature"]),
        ...mapMutations("Modules/SimulationTool", [
            "setMode"
        ]),

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
                class="d-flex flex-column"
            >
                <h5
                    class="mb-3"
                >
                    {{ currentPlanningScenario?.name }}
                </h5>
            </div>
            <div class="result-container">
                <div
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.name') }}
                    </div>
                    <div
                        class="me-2 font-bold"
                    >
                        {{ currentSimulationName }}
                    </div>
                </div>
                <div
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.started') }}
                    </div>
                    <div
                        class="me-2 font-bold"
                    >
                        {{ started }}
                    </div>
                </div>
                <div
                    v-if="finished"
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.finished') }}
                    </div>
                    <div
                        class="me-2 font-bold"
                    >
                        {{ finished }}
                    </div>
                </div>
                <div
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.status') }}
                    </div>
                    <div
                        class="me-2 ps-label"
                    >
                        <span
                            v-if="status === 'accepted' || typeof status === 'undefined'"
                            class="status running"
                        >
                            {{ $t('additional:modules.tools.simulationTool.progress') }}: {{ currentProgress }}%
                        </span>
                        <span
                            v-else-if="status === 'successful'"
                            class="status success"
                        >
                            {{ $t('additional:modules.tools.simulationTool.successfull') }}
                        </span>
                        <span
                            v-else-if="status === 'unsuccessfull'"
                            class="status unsuccessfull"
                        >
                            {{ $t('additional:modules.tools.simulationTool.unsuccessfull') }}
                        </span>
                        <span
                            v-else
                            class="status error"
                        >
                            {{ $t('additional:modules.tools.simulationTool.unsuccessfull') }}
                        </span>
                    </div>
                </div>
            </div>
            <AccordionItem
                v-if="currentJob"
                id="simulation-results-accordion-inputs"
                class="ms-2 my-2"
                :title="$t('additional:modules.tools.simulationTool.inputParameters')"
            >
                <div
                    v-for="(input, inputKey) in currentJob?.requestBody?.inputs"
                    :key="inputKey"
                >
                    <div
                        v-if="typeof input === 'object' && input?.type !== 'FeatureCollection'"
                        class="container"
                    >
                        <div
                            v-for="(property, propertyKey) in input"
                            :key="`${inputKey}-${propertyKey}`"
                            class="py-1 row"
                        >
                            <div class="col col-md-5">
                                {{ getMappedProperty(propertyKey, simulation?.inputs?.[inputKey]?.propertiesMapping) + ":" }}
                            </div>
                            <div class="col col-md-7 font-bold align-self-center">
                                {{ property }}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>
            <hr>
            <div
                v-if="status === 'successful'"
                class="result-output-container"
            >
                <h5
                    class="mb-3"
                >
                    {{ $t('additional:modules.tools.simulationTool.showResults') }}
                </h5>
                <div
                    class="list-group list-group-flush mt-3"
                >
                    <div
                        v-for="output in outputs"
                        :key="output"
                        class="form-check list-group-item list-group-item-action"
                        :class="output === currentOutput ? 'selected-ouput' : ''"
                    >
                        <input
                            :id="output"
                            :value="output"
                            class="form-check-input d-flex justify-content-between align-items-center"
                            type="radio"
                            :checked="output === currentOutput"
                            @input="setCurrentOutput(output)"
                        >
                        <label
                            class="form-check-label d-flex justify-content-between align-items-center"
                            :for="output"
                        >
                            {{ getMappedProperty(output, simulation?.outputs?.propertiesMapping) }}
                        </label>
                    </div>
                </div>
            </div>
            <div v-if="status === 'successful'">
                <hr>
                <AccordionItem
                    id="simulation-results-accordion-legend"
                    class="mt-4"
                    :title="$t('additional:modules.tools.simulationTool.legend')"
                />
            </div>
        </div>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobsSelected') }}
        </div>
        <div
            class="my-5"
        >
            <form>
                <div
                    class="d-flex justify-content-between button"
                >
                    <FlatButton
                        id="back"
                        :icon="'bi bi-gear'"
                        :aria-label="$t('additional:modules.tools.simulationTool.showProperties')"
                        :text="$t('additional:modules.tools.simulationTool.showProperties')"
                        @click="() => setMode('simulationParameter')"
                    />
                    <FlatButton
                        id="start"
                        :icon="'bi bi-list-task'"
                        :aria-label="$t('additional:modules.tools.simulationTool.toSimulations')"
                        :text="$t('additional:modules.tools.simulationTool.toSimulations')"
                        @click="() => setMode('simulationList')"
                    />
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
.selected-ouput {
    background-color: $light_blue;
}
.result-output-container .form-check {
    margin-bottom: 0;
}
.result-output-container label {
    padding-left: 1.313rem;
}
.result-output-container .form-check .form-check-input {
    margin-left: -0.625rem;
}
.result-output-container {
    margin-left: 0.625rem;
}
.result-output-container .list-group-item-action {
    margin-left: 0.625rem;
}
.result-output-container .list-group-item-action:active {
    background-color: $light_blue;
}
.result-container {
    margin-left: 0.625rem;
}
.ps-label {
    font-size: $font_size_sm;
}
.font-bold {
    font-family: $font_family_accent;
}
.status {
    line-height: 1.125rem;
    text-align: center;
    user-select: none;
    color: #ffffff;
    display: inline-block;
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 100;
    vertical-align: middle;
    border-radius: 0.938rem;
}
.error {
    background-color: #e10019;
    border-color: #e10019;
}
.success {
    background-color: #198754;
    border-color: #198754;
}
.running {
    background-color: #3C5F94;
    border-color: #3C5F94;
}

</style>
