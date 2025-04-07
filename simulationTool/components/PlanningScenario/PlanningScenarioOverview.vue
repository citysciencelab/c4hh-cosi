<script>
import {downloadBlobPerHTML5, downloadBlobPerNavigator} from "../../../../src/shared/modules/buttons/js/exportButtonUtils.js";
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {mapGetters} from "vuex";
import PlanningScenarioOverviewList from "./PlanningScenarioOverviewList.vue";

export default {
    name: "PlanningScenarioOverview",
    components: {
        FileUpload,
        FlatButton,
        PlanningScenarioOverviewList
    },
    emits: ["openCreateScenario"],
    computed: {
        ...mapGetters("Modules/SimulationTool", ["planningScenarios", "downloadDataFormat"])
    },
    methods: {
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

            const blobScenario = [];

            scenarios.forEach(scenario => {
                blobScenario.push(
                    {...scenario, ...this.downloadDataFormat}
                );
            });

            this.createFile(new Blob([JSON.stringify(blobScenario)], {type: "application/json;"}), name);
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
    />
    <FileUpload
        :id="'planningScenarioUpload'"
        :keydown="() => true"
        :change="() => true"
        :drop="() => true"
        class="mt-4"
    />
</template>

<style scoped lang="scss">
    #planningScenarioUpload {
        max-width: 300px;
    }
</style>
