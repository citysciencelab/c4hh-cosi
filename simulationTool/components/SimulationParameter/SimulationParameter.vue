<script>
import FileUpload from "../../../../src/shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import {mapGetters, mapMutations} from "vuex";
import SectionHeader from "../SectionHeader.vue";

export default {
    name: "SimulationParameter",
    components: {
        FileUpload,
        FlatButton,
        SectionHeader
    },
    data () {
        return {
            selectedPlanningScenarios: ""
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["currentPlanningScenarioId", "planningScenarios", "previousComponentOfSimulation"])
    },
    mounted () {
        if (this.previousComponentOfSimulation === "planningScenario" && this.currentPlanningScenarioId !== "") {
            this.selectedPlanningScenarios = this.planningScenarios.find(scenario => scenario.id === this.currentPlanningScenarioId);
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", [
            "setCurrentPlanningComponent",
            "setMode"
        ]),

        /**
         * Back to previous component.
         * @returns {void}
         */
        backToPrevious () {
            this.setMode(this.previousComponentOfSimulation);
        },

        /**
         * Opens create planning scenario component.
         * @returns {void}
         */
        openCreatePlanningScenario () {
            this.setMode("planningScenario");
            this.setCurrentPlanningComponent("create");
        }
    }
};
</script>

<template>
    <div class="simulation">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.simlulationSetParams')"
            icon="bi bi-person-fill"
        />
        <div class="row d-flex">
            <div class="col col-6 select-scenario">
                <div class="form-floating mb-3">
                    <select
                        id="simulateForPlanning"
                        v-model="selectedPlanningScenarios.id"
                        class="form-select"
                        :aria-label="$t('additional:modules.tools.simulationTool.selectPlanningScenario')"
                    >
                        <option
                            v-for="scenario in planningScenarios"
                            :key="scenario.id"
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
            :keydown="() => true"
            :change="() => true"
            :drop="() => true"
            class="col-md-12"
        />
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
