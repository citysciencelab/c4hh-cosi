<script>
import AddCardButton from "../../shared/modules/cards/components/AddCardButton.vue";
import dayjs from "dayjs";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import hash from "object-hash";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";

export default {
    name: "ScenarioBuilderManagerAdd",
    components: {
        AddCardButton,
        FlatButton,
        InputText
    },
    data () {
        return {
            showNewScenario: false,
            scenarioTitle: ""
        };
    },
    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["scenarioCards"])
    },

    methods: {
        /**
         * Creates a new scenario and adds a corresponding card.
         * @returns {void}
         */
        addScenarioCard () {
            this.scenarioCards.push({
                title: this.scenarioTitle,
                data: [
                    {value: this.scenarioTitle},
                    {icon: "bi bi-pencil", label: "Erstellt: " + dayjs().format("DD.MM.YYYY")}
                ],
                downloadable: true,
                icon: "bi bi-bounding-box",
                id: hash({
                    title: this.scenarioTitle,
                    created: dayjs().format("DD.MM.YYYY")
                }),
                objects: [],
                removable: false,
                status: ""
            });
            this.showNewScenario = false;
            this.scenarioTitle = "";
            this.$emit("toggle-active-scenario", this.scenarioCards.length - 1);
        }
    }
};
</script>

<template lang="html">
    <div>
        <AddCardButton
            class="mb-4"
            :text="$t('additional:modules.tools.cosi.scenarioManager.createNewScenario')"
            @click="showNewScenario = true"
        />
        <hr class="mx-4">
        <div v-if="showNewScenario">
            <InputText
                id="scenario-title"
                v-model="scenarioTitle"
                :label="$t('additional:modules.tools.cosi.scenarioManager.addScenarioTitle')"
                :placeholder="$t('additional:modules.tools.cosi.scenarioManager.addScenarioTitle')"
                max-length="50"
                @keyup.enter="addScenarioCard"
            />
            <div class="d-flex justify-content-center">
                <FlatButton
                    id="add-scenario"
                    :icon="'bi bi-plus-circle'"
                    type="button"
                    :aria-label="$t('additional:modules.tools.cosi.scenarioManager.addScenario')"
                    :disabled="!scenarioTitle.length"
                    :text="$t('additional:modules.tools.cosi.scenarioManager.addScenario')"
                    @click="addScenarioCard"
                />
            </div>
        </div>
    </div>
</template>
