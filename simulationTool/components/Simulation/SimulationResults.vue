<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import ConvertFeature from "../../js/convertFeatures";
import ConvertStyle from "../../js/convertStyle";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import FeaturesHandler from "../../../../src/modules/statisticDashboard/js/handleFeatures.js";
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
            finishedTimes: [],
            jobStatusTags: [],
            layers: [],
            legendValue: [],
            outputs: [],
            progressValues: [],
            startTimes: []
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "onJobStatusChange",
            "planningScenarios",
            "simulations",
            "simulationIdForResults",
            "simulationResultStyle",
            "simulations"
        ]),

        /**
         * Get the planning scenario containing the current simulation.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios?.find(scenario => scenario?.simulations?.[this.simulationIdForResults]);
        },

        /**
         * Get the current simulation based on the current simulation id.
         * @returns {Object} The current simulation.
         */
        currentSimulation () {
            return this.currentPlanningScenario?.simulations?.[this.simulationIdForResults];
        },

        /**
         * Get the earliest start time of all jobs.
         * @returns {String} The earliest time.
         */
        earliestStartTime () {
            const timeValues = this.startTimes
                    .map(time => new Date(time).getTime())
                    .filter(value => Number.isFinite(value)),
                earliestTimeValue = Math.min(...timeValues);

            if (!Number.isFinite(earliestTimeValue)) {
                return "";
            }
            return new Date(earliestTimeValue)
                .toLocaleString("de-DE", {dateStyle: "medium", timeStyle: "medium"});
        },

        /**
         * Get the inputs for inputs accordion.
         * @returns {Object} The inputs.
         */
        inputsToShow () {
            const inputs = {};

            Object.values(this.jobs)
                .map(job => job.requestBody?.inputs)
                .filter(inputsObj => isObject(inputsObj))
                .flatMap(inputsObj => Object.entries(inputsObj))
                .forEach(([inputKey, input]) => {
                    inputs[inputKey] = input;
                });

            return inputs;
        },

        /**
         * Get current jobs object or an empty object.
         * @returns {Object} The jobs object or {}.
         */
        jobs () {
            if (!isObject(this.currentSimulation?.jobs)) {
                return {};
            }
            return this.currentSimulation.jobs;
        },

        /**
         * Average progress of all jobs.
         * @returns {Number} The average progress of all jobs.
         */
        meanProgress () {
            if (!this.progressValues.length) {
                return 0;
            }
            const sum = this.progressValues.reduce((total, each) => total + each, 0);

            return Math.round(sum / this.progressValues.length);
        },

        /**
         * Get the latest finished time of all jobs.
         * @returns {String} The latest finished time.
         */
        latestFinishedTime () {
            const timeValues = this.finishedTimes
                    .map(time => new Date(time).getTime())
                    .filter(value => Number.isFinite(value)),
                latestTimeValue = Math.max(...timeValues);

            if (!Number.isFinite(latestTimeValue)) {
                return "";
            }
            return new Date(latestTimeValue)
                .toLocaleString("de-DE", {dateStyle: "medium", timeStyle: "medium"});
        },

        /**
         * Get the worst (least successful) job status tag.
         * @returns {String} The worst job status tag.
         */
        worstJobStatusTag () {
            return ["failed", "accepted", "running", "successful"].find(
                status => this.jobStatusTags.includes(status)
            );
        },

        /**
        * Get the simulation configuration for the current simulation.
        * @returns {Object} The current simulation configuration.
        */
        simulationConfig () {
            return this.simulations.find(simulation => simulation.id === this.currentSimulation.configId);
        }
    },
    watch: {
        /**
         * Watches for changes in the job status and updates the job status tags, start times, finished times, progress values and outputs.
         * Also calls showFeatures to display the features on the map.
         * @param {Object} jobs - The jobs object.
         */
        onJobStatusChange: {
            handler () {
                this.jobStatusTags = Object.values(this.jobs).map(job => job.jobStatus?.status);
                this.startTimes = Object.values(this.jobs).map(job => job.jobStatus?.started).filter(time => time);
                this.finishedTimes = Object.values(this.jobs).map(job => job.jobStatus?.finished).filter(time => time);
                this.progressValues = Object.values(this.jobs).map(job => job.jobStatus?.progress).filter(progress => Number.isFinite(progress));
                this.outputs = Object.keys(Object.values(this.jobs)[0]?.jobResults || {});
                this.showFeatures(this.simulationIdForResults, this.jobs, this.outputs);
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

        /**
         * Gets the legend value of style.
         * @param {Object} val The current style object.
         * @returns {Object[]} the legend value in array.
         */
        getLegendValue (val) {
            if (!isObject(val)) {
                return [];
            }

            const legendValue = [];

            if (val?.type === "polygon") {
                val.styles?.forEach((data, index) => {
                    const legendObj = {
                            "name": data.value
                        },
                        style = {
                            "polygonFillColor": data.style?.fillColor,
                            "polygonStrokeColor": data.style?.strokeColor,
                            "polygonStrokeWidth": data.style?.strokeWidth
                        };

                    legendValue[index] = FeaturesHandler.prepareLegendForPolygon(legendObj, style);
                });
            }

            return legendValue;
        },

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
         * Sets the legend value.
         * @returns {void}
         */
        setLegendValue () {
            this.legendValue = this.getLegendValue(this.currentStyle);
        },

        /**
         * Shows features in map.
         * @param {String} simulationId the simulation id.
         * @param {Object} jobs - The jobs.
         * @param {String[]} outputs - The output array.
         * @returns {void}
         */
        showFeatures (simulationId, jobs, outputs) {
            if (typeof simulationId !== "string" || !isObject(jobs) || !Array.isArray(outputs)) {
                return;
            }

            outputs.forEach(output => {
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

                Object.values(jobs).forEach(job => {
                    const featuresToAdd = ConvertFeature.geoJsonToOpenlayers(job.jobResults?.[output]?.features || []);

                    featuresToAdd?.forEach(feature => {
                        feature.set("simulationId", simulationId);
                        this.setFeatureStyle(feature, job.resultStyle);
                    });
                    layer.getLayerSource().addFeatures(featuresToAdd);
                });

                this.layers.push(layer);
            });
            this.setCurrentOutput(outputs[0]);
            this.setLegendValue();
        }
    }
};
</script>

<template>
    <div class="vh-100 overflow-y-auto">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simulationResults')"
        />
        <div v-if="simulationIdForResults">
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
                        {{ currentSimulation?.name }}
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
                        {{ earliestStartTime }}
                    </div>
                </div>
                <div
                    v-if="latestFinishedTime"
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
                        {{ latestFinishedTime }}
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
                            v-if="worstJobStatusTag === 'accepted' || typeof worstJobStatusTag === 'undefined'"
                            class="status running"
                        >
                            {{ $t('additional:modules.tools.simulationTool.progress') }}: {{ meanProgress }}%
                        </span>
                        <span
                            v-else-if="worstJobStatusTag === 'successful'"
                            class="status success"
                        >
                            {{ $t('additional:modules.tools.simulationTool.successfull') }}
                        </span>
                        <span
                            v-else-if="worstJobStatusTag === 'unsuccessfull'"
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
                v-if="currentSimulation?.jobs"
                id="simulation-results-accordion-inputs"
                class="ms-2 my-2"
                :title="$t('additional:modules.tools.simulationTool.inputParameters')"
            >
                <div
                    v-for="(input, inputKey) in inputsToShow"
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
                                {{ getMappedProperty(propertyKey, simulationConfig?.inputs?.[inputKey]?.propertiesMapping) + ":" }}
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
                v-if="worstJobStatusTag === 'successful'"
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
                            {{ getMappedProperty(output, simulationConfig?.outputs?.propertiesMapping) }}
                        </label>
                    </div>
                </div>
            </div>
            <div v-if="worstJobStatusTag === 'successful' && legendValue.length">
                <hr>
                <AccordionItem
                    id="simulation-results-accordion-legend"
                    class="mt-4"
                    :title="$t('additional:modules.tools.simulationTool.legend')"
                >
                    <h6
                        class="mb-3"
                    >
                        {{ currentStyle?.property }}
                    </h6>
                    <div class="row">
                        <div
                            v-for="legendObj in legendValue"
                            :key="legendObj.name"
                            class="row legend"
                        >
                            <div>
                                <img
                                    :alt="legendObj.name"
                                    :src="legendObj.graphic"
                                    class="col-3 col-xs px-0 left"
                                >
                                <span
                                    class="col col-xs legend-names px-0 ms-1"
                                >
                                    {{ legendObj.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </AccordionItem>
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
.legend {
    img {
        width: 30px;
    }
    .legend-names {
        font-size: $font_size_sm;
        align-content: center;
    }
}
</style>
