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
            finished: "",
            jobStatus: {},
            layer: undefined,
            scenarioName: "",
            started: ""
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
        * Get the simulation configuration to the currently selected planning scenario.
        * @returns {Object} The current simulation configuration.
        */
        simulation () {
            return this.simulations?.find(simulation => simulation.id === this.currentPlanningScenario?.simulationId);
        }
    },
    mounted () {
        this.planningScenarios?.forEach(scenario => {
            this.setData(scenario, this.currentJobID);
            this.showFeatures(scenario, this.currentJobID);
        });
    },
    unmounted () {
        if (typeof this.layer !== "undefined") {
            this.layer.getLayerSource().clear();
        }
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent"]),

        getMappedProperty,

        /**
         * Sets the job status data.
         * @param {Object} scenario - The scenario
         * @param {string} jobID - The job id.
         * @returns {void}
         */
        setData (scenario, jobID) {
            if (!isObject(scenario) || !isObject(scenario.jobs) || typeof jobID !== "string") {
                return;
            }

            if (typeof scenario.jobs[Object.keys(scenario.jobs).find(key => key === jobID)] === "undefined") {
                return;
            }

            this.jobStatus = scenario.jobs[Object.keys(scenario.jobs).find(key => key === jobID)]?.jobStatus;
            this.scenarioName = scenario.name;
            this.started = this.jobStatus?.started ? dayjs(this.jobStatus?.started).format("DD.MM.YYYY, hh:mm:ss") : this.jobStatus?.started;
            this.finished = this.jobStatus?.finished ? dayjs(this.jobStatus?.finished).format("DD.MM.YYYY, hh:mm:ss") : this.jobStatus?.finished;
        },

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
         * Shows features in map.
         * @param {Object} scenario - The scenario
         * @param {String} jobID the job id.
         * @returns {void}
         */
        showFeatures (scenario, jobID) {
            if (!isObject(scenario) || typeof jobID !== "string") {
                return;
            }

            const jobResult = scenario?.jobs[Object.keys(scenario?.jobs).find(key => key === jobID)]?.jobResult,
                layerName = "simulation-results";

            if (!isObject(jobResult)) {
                return;
            }

            if (typeof layerCollection.getLayerById(layerName) !== "undefined") {
                this.layer = layerCollection.getLayerById(layerName);
                this.layer.getLayerSource().clear();
            }
            else {
                this.layer = layerFactory.createLayer({
                    typ: "VECTORBASE",
                    id: layerName,
                    name: layerName,
                    alwaysOnTop: true
                });

                layerCollection.addLayer(this.layer);
            }

            Object.keys(jobResult).forEach(key => {
                if (!Array.isArray(jobResult[key]?.features) || !jobResult[key]?.features.length) {
                    return;
                }

                const geojsonFeature = ConvertFeature.geoJsonToOpenlayers(jobResult[key]?.features);

                geojsonFeature.forEach(feature => {
                    feature.set("jobID", jobID);
                    feature.set("output", key);
                    this.setFeatureStyle(feature, this.currentStyle);
                });

                this.layer.getLayerSource().addFeatures(geojsonFeature);
            });

            this.zoomToExtent({extent: this.layer.getLayerSource().getExtent(), options: {maxZoom: 7}});
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
                    {{ $t('additional:modules.tools.simulationTool.planningScenario') }} {{ scenarioName }}
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
                    {{ jobStatus?.status }}
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
