<script>
import getters from "../store/gettersScenarioBuilder";
import mutations from "../store/mutationsScenarioBuilder";
import actions from "../store/actionsScenarioBuilder";
import {mapGetters, mapActions, mapMutations} from "vuex";
import Modal from "../../../../src/share-components/modals/components/ModalItem.vue";
import Scenario from "../classes/Scenario";

export default {
    name: "ScenarioManager",
    components: {
        Modal
    },
    data: () => ({
        newScenarioName: "",
        newScenarioValid: true,
        createNewScenarioModalOpen: false,
        confirmDialog: false,
        confirmText: "",
        confirmAction: {
            function: () => null,
            text: ""
        }
    }),
    computed: {
        ...mapGetters("Tools/ScenarioBuilder", Object.keys(getters)),

        scenarioNames () {
            return this.scenarios.map(scenario => scenario.name);
        },

        invalidScenarioName () {
            return this.newScenarioName.length === 0 || this.scenarioNames.includes(this.newScenarioName);
        },

        scenarioByName: () => name => {
            return this.scenarios.find(scenario => scenario.name === name);
        },

        newScenarioRules () {
            return [
                value => Boolean(value) || this.$t("additional:modules.tools.cosi.scenarioBuilder.required"),
                value => !this.scenarioNames.includes(value) || this.$t("additional:modules.tools.cosi.scenarioManager.dublicateName")
            ];
        },

        _activeScenario: {
            get () {
                return this.activeScenario;
            },
            set (v) {
                this.setActiveScenario(v);
            }
        }
    },
    watch: {
        activeScenario (newActiveScenario, oldActiveScenario) {
            if (oldActiveScenario) {
                oldActiveScenario.hideScenario();
            }
            if (newActiveScenario) {
                newActiveScenario.restore();
            }
        },
        createNewScenarioModalOpen (state) {
            return state ?
                document.addEventListener("keyup", this.checkKey) :
                document.removeEventListener("keyup", this.checkKey);
        }
    },
    methods: {
        ...mapMutations("Tools/ScenarioBuilder", Object.keys(mutations)),
        ...mapActions("Tools/ScenarioBuilder", Object.keys(actions)),

        /**
         * quickly checks the key evt code
         * and executes createNewScenario
         * @param {Event} evt - the key event
         * @returns {void}
         */
        checkKey (evt) {
            if (evt.code === "Enter") {
                if (!this.invalidScenarioName) {
                    this.createNewScenario();
                }
            }
        },

        createNewScenario () {
            const newScenario = new Scenario(this.newScenarioName, this.guideLayer);

            this.scenarios.push(newScenario);
            this.createNewScenarioModalOpen = false;
            this.newScenarioName = "";

            this.setActiveScenario(newScenario);
        },

        deleteScenario () {
            this.activeScenario.prune();
            this.setScenarios(this.scenarios.filter(scenario => scenario !== this.activeScenario));
            this.setActiveScenario(null);
            this.confirmDialog = false;
        },

        pruneActiveScenario () {
            this.activeScenario.prune();
            this.confirmDialog = false;
            this.$emit("pruneScenario");
        },

        pruneActiveScenarioNeighborhoods () {
            this.activeScenario.pruneNeighborhoods();
            this.confirmDialog = false;
            this.$emit("pruneScenario", "neighborhoods");
        },

        pruneActiveScenarioSimulatedFeatures () {
            this.activeScenario.pruneSimulatedFeatures();
            this.confirmDialog = false;
            this.$emit("pruneScenario", "simulated");
        },

        onDelete () {
            this.confirmDialog = true;
            this.confirmText = this.$t("additional:modules.tools.cosi.scenarioManager.deleteScenarioWarning");
            this.confirmAction.function = this.deleteScenario;
            this.confirmAction.text = this.$t("common:button.delete");
        },
        onPruneAll () {
            this.confirmDialog = true;
            this.confirmText = this.$t("additional:modules.tools.cosi.scenarioManager.pruneAllFeaturesWarning");
            this.confirmAction.function = this.pruneActiveScenario;
            this.confirmAction.text = this.$t("common:button.delete");
        },
        onPruneNeighborhoods () {
            this.confirmDialog = true;
            this.confirmText = this.$t("additional:modules.tools.cosi.scenarioManager.pruneNeighborhoodsWarning");
            this.confirmAction.function = this.pruneActiveScenarioNeighborhoods;
            this.confirmAction.text = this.$t("common:button.delete");
        },
        onPruneSimulation () {
            this.confirmDialog = true;
            this.confirmText = this.$t("additional:modules.tools.cosi.scenarioManager.pruneSimulatedFeaturesWarning");
            this.confirmAction.function = this.pruneActiveScenarioSimulatedFeatures;
            this.confirmAction.text = this.$t("common:button.delete");
        }
    }
};
</script>

<template>
    <div id="scenario-manager">
        <div>
            <span class="text-subtitle-2">
                {{ $t('additional:modules.tools.cosi.scenarioManager.title') }}
            </span>
        </div>
        <div class="mb-2">
            Anlegen und Verwalten der Szenarien für fiktive Daten. In einem Szenario können Einrichtungen und Wohnquartiere simuliert, sowie bestehende Einrichtungen verändert werden.
        </div>
        <v-row dense>
            <v-col cols="6">
                <v-select
                    v-model="_activeScenario"
                    :items="scenarios"
                    item-text="name"
                    item-value="name"
                    return-object
                    :no-data-text="$t('additional:modules.tools.cosi.scenarioManager.noScenarios')"
                    :label="$t('additional:modules.tools.cosi.scenarioManager.selectScenarios')"
                    :title="$t('additional:modules.tools.cosi.scenarioManager.selectScenarios')"
                    outlined
                    dense
                    clearable
                />
            </v-col>
            <v-col
                class="flex"
                cols="6"
            >
                <v-btn
                    dense
                    small
                    tile
                    color="grey lighten-1"
                    :title="$t('additional:modules.tools.cosi.scenarioManager.createNewTitle')"
                    class="flex-item"
                    @click="createNewScenarioModalOpen = !createNewScenarioModalOpen"
                >
                    <span v-if="useIcons">
                        <v-icon>mdi-domain-plus</v-icon>
                    </span>
                    <span v-else>
                        {{ $t('additional:modules.tools.cosi.scenarioManager.createNewTitle') }}
                    </span>
                </v-btn>
                <v-menu
                    open-on-hover
                    top
                    offset-y
                >
                    <template #activator="{ on, attrs }">
                        <v-btn
                            dense
                            small
                            tile
                            color="grey lighten-1"
                            :title="$t('additional:modules.tools.cosi.scenarioManager.exportScenario')"
                            :disabled="!activeScenario"
                            class="flex-item"
                            v-bind="attrs"
                            v-on="on"
                            @click="activeScenario ? activeScenario.exportScenario() : null"
                        >
                            <span v-if="useIcons">
                                <v-icon>mdi-download</v-icon>
                            </span>
                            <span v-else>
                                {{ $t('additional:modules.tools.cosi.scenarioManager.exportScenario') }}
                            </span>
                        </v-btn>
                    </template>

                    <v-list>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.exportSimulatedFeatures')"
                                :disabled="!activeScenario"
                                class="flex-item"
                                @click="activeScenario ? activeScenario.exportScenarioFeatures() : null"
                            >
                                <span v-if="useIcons">
                                    <v-icon>mdi-map-marker-multiple</v-icon>
                                </span>
                                <span v-else>
                                    {{ $t('additional:modules.tools.cosi.scenarioManager.exportSimulatedFeatures') }}
                                </span>
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.exportNeighborhoods')"
                                :disabled="!activeScenario"
                                class="flex-item"
                                @click="activeScenario ? activeScenario.exportScenarioNeighborhoods() : null"
                            >
                                <span v-if="useIcons">
                                    <v-icon>mdi-home</v-icon>
                                </span>
                                <span v-else>
                                    {{ $t('additional:modules.tools.cosi.scenarioManager.exportNeighborhoods') }}
                                </span>
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.exportScenario')"
                                :disabled="!activeScenario"
                                class="flex-item"
                                @click="activeScenario ? activeScenario.exportScenario() : null"
                            >
                                <span v-if="useIcons">
                                    <v-icon>mdi-download</v-icon>
                                </span>
                                <span v-else>
                                    {{ $t('additional:modules.tools.cosi.scenarioManager.exportScenario') }}
                                </span>
                            </v-btn>
                        </v-list-item>
                    </v-list>
                </v-menu>
                <v-btn
                    dense
                    small
                    tile
                    color="grey lighten-1"
                    :disabled="!_activeScenario"
                    :title="$t('additional:modules.tools.cosi.scenarioManager.deleteScenario')"
                    class="flex-item"
                    @click="onDelete"
                >
                    <span v-if="useIcons">
                        <v-icon>mdi-delete-forever</v-icon>
                    </span>
                    <span v-else>
                        {{ $t('additional:modules.tools.cosi.scenarioManager.deleteScenario') }}
                    </span>
                </v-btn>
            </v-col>
        </v-row>
        <v-row dense>
            <v-col
                class="flex"
                cols="12"
            >
                <v-menu
                    open-on-hover
                    bottom
                    offset-y
                >
                    <template #activator="{ on, attrs }">
                        <v-btn
                            dense
                            small
                            tile
                            color="grey lighten-1"
                            :disabled="!activeScenario"
                            :title="$t('additional:modules.tools.cosi.scenarioManager.helpPruneAllFeatures')"
                            class="flex-item"
                            v-bind="attrs"
                            v-on="on"
                            @click="onPruneAll"
                        >
                            <v-icon left>
                                mdi-domain-remove
                            </v-icon>
                            {{ $t('additional:modules.tools.cosi.scenarioManager.pruneAllFeatures') }}
                        </v-btn>
                    </template>

                    <v-list>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :disabled="!activeScenario"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.helpPruneSimulatedFeatures')"
                                class="flex-item"
                                @click="onPruneSimulation"
                            >
                                <v-icon left>
                                    mdi-map-marker-remove
                                </v-icon>
                                {{ $t('additional:modules.tools.cosi.scenarioManager.pruneSimulatedFeatures') }}
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :disabled="!activeScenario"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.helpPruneNeighborhoods')"
                                class="flex-item"
                                @click="onPruneNeighborhoods"
                            >
                                <v-icon left>
                                    mdi-home-remove
                                </v-icon>
                                {{ $t('additional:modules.tools.cosi.scenarioManager.pruneNeighborhoods') }}
                            </v-btn>
                        </v-list-item>
                        <v-list-item>
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                :disabled="!activeScenario"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.helpPruneAllFeatures')"
                                class="flex-item"
                                @click="onPruneAll"
                            >
                                <v-icon left>
                                    mdi-domain-remove
                                </v-icon>
                                {{ $t('additional:modules.tools.cosi.scenarioManager.pruneAllFeatures') }}
                            </v-btn>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>
        </v-row>
        <v-row dense>
            <v-col cols="12">
                <div v-if="!activeScenario">
                    {{ $t('additional:modules.tools.cosi.scenarioManager.noActiveScenario') }}
                </div>
            </v-col>
        </v-row>
        <Modal
            :show-modal="createNewScenarioModalOpen"
            @modalHid="createNewScenarioModalOpen = false"
            @clickedOnX="createNewScenarioModalOpen = false"
            @clickedOutside="createNewScenarioModalOpen = false"
        >
            <h4> {{ $t('additional:modules.tools.cosi.scenarioManager.createNewTitle') }} </h4>
            <div id="new-scenario-form">
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field
                                v-model="newScenarioName"
                                required
                                dense
                                :rules="newScenarioRules"
                                :label="$t('additional:modules.tools.cosi.scenarioManager.scenarioName')"
                            />
                            <v-btn
                                dense
                                small
                                tile
                                color="grey lighten-1"
                                type="button"
                                :disabled="invalidScenarioName"
                                :title="$t('additional:modules.tools.cosi.scenarioManager.createNewTitle')"
                                @click="createNewScenario"
                            >
                                {{ $t('additional:modules.tools.cosi.scenarioManager.createNewSubmit') }}
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </div>
        </Modal>
        <v-snackbar
            v-model="confirmDialog"
            :timeout="-1"
            color="white"
            light
            centered
        >
            {{ confirmText }}

            <template #action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="confirmAction.function"
                >
                    {{ confirmAction.text }}
                </v-btn>
                <v-btn
                    text
                    v-bind="attrs"
                    @click="confirmDialog = false"
                >
                    {{ $t('common:button.cancel') }}
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<style lang="scss" scoped>
    #new-scenario-form {
        width: 40vw;
    }
</style>
