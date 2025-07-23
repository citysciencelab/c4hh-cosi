<script>
import {downloadBlobPerHTML5, downloadBlobPerNavigator} from "../../../../src/shared/modules/buttons/js/exportButtonUtils.js";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {mapActions, mapGetters} from "vuex";
import PlanningScenarioOverviewList from "./PlanningScenarioOverviewList.vue";
import layerCollection from "../../../../src/core/layers/js/layerCollection.js";
import {infrastructureLayerId} from "../../layerIds.js";

export default {
    name: "PlanningScenarioOverview",
    components: {
        FileUpload,
        FlatButton,
        PlanningScenarioOverviewList
    },
    emits: ["openCreateScenario"],
    computed: {
        ...mapGetters("Modules/SimulationTool", ["planningScenarios"])
    },
    mounted () {
        if (typeof layerCollection.getLayerById("planning-scenario") !== "undefined") {
            layerCollection.getLayerById("planning-scenario").getLayerSource().clear();
        }
        if (typeof layerCollection.getLayerById(infrastructureLayerId) !== "undefined") {
            layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
        }
    },
    methods: {
        ...mapActions("Modules/SimulationTool", ["addFile"]),

        /**
         * Creates a file based on given blob.
         * @param {Blob} blob the blob to create the file on.
         * @param {String} fileName the file name.
         * @returns {void}
         */
        createFile (blob, fileName) {
            const succeed = downloadBlobPerNavigator(blob, fileName);

            if (!succeed) {
                downloadBlobPerHTML5(blob, fileName);
            }
        },

        /**
         * Downloads the scenario(s) data.
         * @param {Object[]} scenarios - The current list of scenarios.
         * @param {String} name the file name.
         * @returns {void}
         */
        download (scenarios, name = this.$t("additional:modules.tools.simulationTool.planningScenarioAllFiles")) {
            if (!Array.isArray(scenarios) || !scenarios.length) {
                return;
            }

            this.createFile(new Blob([JSON.stringify(scenarios)], {type: "application/json;"}), name);
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
    <h4 class="text-decoration-underline mt-3">
        {{ $t("additional:modules.tools.simulationTool.planningScenarioOverview") }}
    </h4>
    <PlanningScenarioOverviewList
        @download="download"
    />
    <FlatButton
        class="pe-2 mt-4"
        :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
        :icon="'bi bi-pencil-square'"
        :interaction="() => $emit('openCreateScenario')"
        :text="$t('additional:modules.tools.simulationTool.planningScenarioCreate')"
    />
    <FlatButton
        class="pe-2 mt-4"
        :aria-label="$t('additional:modules.tools.simulationTool.planningScenarioDownloads')"
        :icon="'bi bi-download'"
        :interaction="() => download(planningScenarios)"
        :text="$t('additional:modules.tools.simulationTool.planningScenarioDownloads')"
        :disabled="!Array.isArray(planningScenarios) || !planningScenarios.length"
    />
    <FileUpload
        :id="'planningScenarioUpload'"
        :keydown="(e) => triggerClickOnFileInput(e)"
        :change="(e) => onInputChange(e)"
        :drop="(e) => onDrop(e)"
        class="mt-4"
    />
</template>

<style scoped lang="scss">
    #planningScenarioUpload {
        max-width: 300px;
    }
</style>
