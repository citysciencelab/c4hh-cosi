<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersSaveSession";
import mutations from "../store/mutationsSaveSession";
import actions from "../store/actionsSaveSession";
import {downloadJsonToFile} from "../../utils/download";
import {Point, Polygon, MultiPoint, MultiPolygon} from "ol/geom";
<<<<<<< HEAD
import {serializeState} from "../utils/serializeState.js";
import parseState from "../utils/parseState";
=======
import serializeState from "./serializeState";
import parseState from "./parseState";
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
import ToolInfo from "../../components/ToolInfo.vue";
import openDB from "../utils/indexedDb";
import {addModelsByAttributes, getModelByAttributes} from "../../utils/radioBridge.js";

export default {
    name: "SaveSession",
    components: {
        Tool,
        ToolInfo
    },
    data () {
        return {
            localStorage: null,
            db: null,
            storePaths: {
                // The order matters for loading
                Maps: [
                    "layerIds",
<<<<<<< HEAD
                    "loadedLayers",
                    // "view"
                    "center",
                    "zoom"
=======
                    // "view"
                    "center",
                    "zoomLevel"
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                ],
                Tools: {
                    ChartGenerator: [
                        "datasets",
                        "chartConfigs"
                    ],
                    CalculateRatio: [
                        "dataSets",
                        "resultHeaders",
                        "results",
                        "active"
                    ],
                    ScenarioBuilder: [
                        "scenarios",
                        "active"
                    ],
                    DistrictSelector: [
                        "selectedDistrictLevelId",
                        "selectedDistrictNames",
                        "active"
                    ],
                    AccessibilityAnalysis: [
                        "dataSets",
                        "isochroneFeatures",
                        "rawGeoJson",
                        "mode",
                        "coordinate",
                        "clickCoordinate",
                        "selectedFacilityNames",
                        "setByFeature",
                        "transportType",
                        "scaleUnit",
                        "distance",
                        "steps",
                        "active"
                    ],
                    Dashboard: [
                        "statsFeatureFilter",
                        "calculations"
                    ],
                    AreaSelector: [
                        "geometry"
                    ],
                    Draw: [
                        "layer"
                    ],
                    QueryDistricts: [
                        "dataSets",
                        "propertiesMap"
                    ]
                }
            },
            state: null,
            session: {
                meta: {
                    title: `${this.$t("additional:modules.tools.cosi.saveSession.newSession")}-${new Date().toLocaleString()}`,
                    info: null,
                    created: null,
                    date: null
                },
                state: null
            },
            latestDate: null,
            loadDialog: false,
            saveDialog: false,
            saveMode: "quickSave",
            sessionFile: null,
            autoSave: null,
            autoSaveInterval: undefined,
            autoSaveDialog: false,
            successDialog: false,
            successText: "",
            confirmDialog: false,
            geomConstructors: {Point, Polygon, MultiPoint, MultiPolygon},
            // toolsWithDatasets: ["AccessibilityAnalysis", "CalculateRatio", "QueryDistricts"]
            deepFeatures: {
                AccessibilityAnalysis: ["dataSets"],
                QueryDistricts: ["propertiesMap"]
            }
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/SaveSession", Object.keys(getters)),
        ...mapGetters("Tools/ScenarioBuilder", {simGuideLayer: "guideLayer"}),
        ...mapGetters("Tools/ResidentialSimulation", {simNeighborhoodLayer: "drawingLayer"}),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictLevel", "districtLevels"]),
        ...mapGetters("Maps", ["getLayerById"]),
        ...mapGetters("Tools/TemplateManager", ["useTemplatesForMapping"])
    },
    watch: {
        /**
         * Unselect the Menu item if the tool is deactivated
         * @param {boolean} state - Defines if the tool is active.
         * @returns {void}
         */
        active (state) {
            if (!state) {
                const model = getComponent(this.id);

                if (model) {
                    model.set("isActive", false);
                }
            }
        },

        autoSave () {
            this.successText = this.$t("additional:modules.tools.cosi.saveSession.settingsChanged");
            this.successDialog = true;

            if (this.autoSave) {
                this.localStorage.setItem("cosi-auto-save", true);
                this.enableAutoSave();
            }
            else {
                this.localStorage.setItem("cosi-auto-save", false);
                this.disableAutoSave();
            }
        },

        sessionToLoad (session) {
            this.load(session);
        }
    },
    created () {
        /**
         * listens to the close event of the Tool Component
         * @listens #close
         */
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    async mounted () {
        this.localStorage = window.localStorage;
        this.db = await openDB("cosi");

        const autoSave = JSON.parse(this.localStorage.getItem("cosi-auto-save"));

        if (autoSave !== null) {
            this.autoSave = autoSave;
            this.$nextTick(() => {
                this.successDialog = false;
            });
        }
        else {
            this.autoSaveDialog = true;
        }

        this.checkLastSession();
    },
    methods: {
<<<<<<< HEAD
        ...mapActions("Maps", ["addNewLayerIfNotExists", "registerListener", "unregisterListener"]),
=======
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        ...mapMutations("Tools/SaveSession", Object.keys(mutations)),
        ...mapActions("Tools/SaveSession", Object.keys(actions)),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Tools/DistrictSelector", ["setDistrictsByName"]),
        ...parseState,
<<<<<<< HEAD
        downloadJsonToFile,
        /**
         * Saving the data
         * @returns {void}
        */
        save () {
            this.saveDialog = false;
            this.state = serializeState(this.storePaths, this.$store, this.deepFeatures);
=======
        ...serializeState,
        downloadJsonToFile,

        save () {
            this.saveDialog = false;
            this.serializeState();
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)

            this.session.state = JSON.stringify(this.state);
            this.session.meta.created = new Date().toLocaleString();
            this.session.meta.date = new Date();
        },
<<<<<<< HEAD
        /**
         * Saving the data in local storage
         * @returns {void}
         */
=======
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        quickSave () {
            this.save();
            this.storeToLocalStorage();
        },
<<<<<<< HEAD
        /**
         * Saving the data in extra file
         * @returns {void}
         */
=======
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        saveAs () {
            this.save();
            this.downloadJsonToFile(this.session, this.session.meta.title + ".json");
        },
<<<<<<< HEAD
        /**
         * Clearing the data in local storage
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        clear () {
            if (this.db) {
                const
                    transaction = this.db.transaction("sessions", "readwrite"),
                    request = transaction.objectStore("sessions").clear();

                request.onsuccess = () => {
                    this.latestDate = null;
                    this.confirmDialog = false;
                    this.successText = this.$t("additional:modules.tools.cosi.saveSession.cleared");
                    this.successDialog = true;
                };
            }
            this.localStorage.removeItem("cosi-state");
        },
<<<<<<< HEAD
        /**
         * Saving the data in local storage
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        storeToLocalStorage () {
            if (this.db) {
                const
                    transaction = this.db.transaction("sessions", "readwrite"),
                    request = transaction.objectStore("sessions").put(this.session, 0);

                request.onerror = (err) => {
                    console.error(err);
                    this.addSingleAlert({
<<<<<<< HEAD
                        content: this.$t("additional:modules.tools.cosi.saveSession.saveToLocalStorageError"),
=======
                        content: "Die Sitzung konnte nicht gespeichert werden. Die Fehlermeldung finden Sie, indem Sie die Taste F12 drücken. Wenden Sie sich bitte damit an Ihren Administrator.",
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                        category: "Error",
                        displayClass: "error"
                    });
                };
                request.onsuccess = () => {
                    this.successText = this.$t("additional:modules.tools.cosi.saveSession.success");
                    this.successDialog = true;
                    this.latestDate = this.session.meta?.created;
                };
            }
            else {
                this.localStorage.setItem("cosi-state", JSON.stringify(this.session));
                this.successText = this.$t("additional:modules.tools.cosi.saveSession.success");
                this.successDialog = true;
                this.latestDate = this.session.meta?.created;
            }
        },
<<<<<<< HEAD
        /**
         * Loading the last session
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        loadLastSession () {
            this.loadFromLocalStorage();
            this.loadDialog = false;
        },
<<<<<<< HEAD
        /**
         * Checking the last session
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        checkLastSession () {
            let
                lastSession = this.db ? undefined : JSON.parse(this.localStorage.getItem("cosi-state"));
            const
                transaction = this.db?.transaction("sessions", "readwrite"),
                request = transaction?.objectStore("sessions").get(0);

            if (lastSession) {
                this.loadDialog = true;
                this.latestDate = lastSession?.meta?.created;
            }

            request.onsuccess = () => {
                lastSession = request.result;
                if (lastSession) {
                    this.loadDialog = true;
                    this.latestDate = lastSession?.meta?.created;
                }
            };
        },
<<<<<<< HEAD
        /**
         * Loading the session from local storage
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        async loadFromLocalStorage () {
            try {
                const session = new Promise((res, rej) => {
                    if (this.db) {
                        const
                            transaction = this.db.transaction("sessions", "readwrite"),
                            request = transaction.objectStore("sessions").get(0);

                        request.onerror = (err) => {
                            rej(err);
                        };
                        request.onsuccess = () => {
                            res(request.result);
                        };
                    }
                    else {
                        res(JSON.parse(this.localStorage.getItem("cosi-state")));
                    }
                });

                this.load(await session);
            }
            catch (e) {
                console.error(e);
                this.addSingleAlert({
<<<<<<< HEAD
                    content: this.$t("additional:modules.tools.cosi.saveSession.loadFromLocalStorageError"),
=======
                    content: "Die letzte Sitzung konnte nicht geladen werden. Die Fehlermeldung finden Sie, indem Sie die Taste F12 drücken. Wenden Sie sich bitte damit an Ihren Administrator.",
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                    category: "Error",
                    displayClass: "error"
                });
            }
        },
<<<<<<< HEAD
        /**
         * Loading the data from file
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        loadFromFile () {
            this.$refs["file-prompt"].click();
            this.loadDialog = false;
        },
<<<<<<< HEAD
        /**
         * Loading the data from file
         * @param {Object[]} evt The target of current change event.
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        handleFile (evt) {
            const file = evt.target.files[0],
                reader = new FileReader();

            reader.onload = res => {
                try {
                    const session = JSON.parse(res.target.result);

                    this.load(session);
                }
                catch (e) {
                    console.error(e);
                    console.warn("File could not be read");

                    this.addSingleAlert({
                        content: "Die Datei konnte nicht gelesen werden.",
                        category: "Warning",
                        displayClass: "warning"
                    });
                }
            };
            reader.readAsText(file);
        },
<<<<<<< HEAD
        /**
         * Loading function
         * @param {Object} session The saved session
         * @returns {void}
         */
        load (session) {
            const state = session.state || session; // fallback for old saves
=======

        load (session) {
            const
                state = session.state || session; // fallback for old saves
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)

            this.session.meta.title = session.meta?.title || this.session.meta.title;
            this.setActive(false);
            this.parseState(this.storePaths, typeof state === "string" ? JSON.parse(state) : state);
            this.addSingleAlert({
                content: `Sitzung ${session.meta?.title} vom ${session.meta?.created} erfolgreich geladen.`,
                category: "Erfolg",
                displayClass: "success"
            });
        },
<<<<<<< HEAD
        /**
         * Getting the saved layers from id
         * @param {String} layerId The layer Id
         * @returns {module:ol/Layer} the layer
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        getTopicsLayer (layerId) {
            let layer = this.getLayerById({layerId: layerId});

            if (layer) {
                return layer;
            }
            if (this.onlyUdpServices && isNaN(parseInt(layerId, 10))) {
                return undefined;
            }

            const model = this.initializeLayer(layerId);

            if (model) {
                model.set("isSelected", true);
                layer = model.get("layer");
            }

            return layer;
        },

        /**
         * @description Checks if the layers are added to the ModelList and adds them if not.
         * @param {String} layerId - the layer id
         * @todo Refactor to vue when MP Core is updated
         * @returns {Object} the layer model from the MP core
         */
        initializeLayer (layerId) {
            if (!getModelByAttributes({id: layerId})) {
                addModelsByAttributes({id: layerId});
            }

            return getModelByAttributes({id: layerId});
        },

        onSavePrompt () {
            this.saveDialog = false;
            this[this.saveMode]();
        },
<<<<<<< HEAD
        /**
         * Enable auto save regularly
         * @returns {void}
         */
=======

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        enableAutoSave () {
            this.autoSaveInterval = setInterval(() => {
                this.quickSave();
            }, 600000);
        },
<<<<<<< HEAD
        /**
         * Disable auto save
         * @returns {void}
         */
        disableAutoSave () {
            clearInterval(this.autoSaveInterval);
        },
        /**
         * Check if it has deep features
         * @param {String} key - the key in deep features
         * @param {String} attr - the attribute
         * @returns {void}
         */
=======

        disableAutoSave () {
            clearInterval(this.autoSaveInterval);
        },

>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
        hasDeepFeatures (key, attr) {
            const tool = Object.keys(this.deepFeatures).find(id => key.includes(id));

            return this.deepFeatures[tool]?.includes(attr);
        }
    }
};
</script>

<template lang="html">
    <div>
        <Tool
            ref="tool"
            :title="$t('additional:modules.tools.cosi.saveSession.title')"
            :icon="icon"
            :active="active"
            :render-to-window="renderToWindow"
            :resizable-window="resizableWindow"
            :deactivate-gfi="deactivateGFI"
        >
            <template
                v-if="active"
                #toolBody
            >
                <v-app class="clamp-40vw">
                    <ToolInfo
                        :url="readmeUrl"
                        :locale="currentLocale"
                    />
                    <v-container class="flex btn-grid">
                        <v-card-title secondary-title>
<<<<<<< HEAD
                            {{ $t('additional:modules.tools.cosi.saveSession.quickSave') }}
                        </v-card-title>
                        <div
                            class="mb-2"
                            v-html="$t('additional:modules.tools.cosi.saveSession.quickSaveDescription')"
                        />
=======
                            Schnelles Speichern
                        </v-card-title>
                        <div class="mb-2">
                            Sitzungen im Browser (z.B. Edge, Firefox) speichern. Diese können beim Start von CoSI über den Button 'Letzte Laden' wieder geladen werden. <br>
                            Wenn Browserverlauf oder Cache geleert werden, geht dieser Speicherstand verloren! Es kann immer nur eine Sitzung vorgehalten werden.
                        </div>
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                        <v-row class="flex">
                            <v-col
                                cols="6"
                                class="flex"
                            >
                                <v-btn
                                    id="save-session"
                                    tile
                                    dense
                                    small
                                    color="grey lighten-1"
                                    :title="$t('additional:modules.tools.cosi.saveSession.saveTooltip')"
                                    @click="quickSave"
                                >
                                    {{ $t('additional:modules.tools.cosi.saveSession.save') }}
                                </v-btn>
                            </v-col>
                            <v-col
                                cols="5"
                                class="flex"
                            >
                                <v-btn
                                    id="load-session"
                                    tile
                                    dense
                                    small
                                    color="grey lighten-1"
                                    :title="$t('additional:modules.tools.cosi.saveSession.loadTooltip')"
                                    :disabled="!latestDate"
                                    @click="loadLastSession"
                                >
                                    {{ $t('additional:modules.tools.cosi.saveSession.load') }}
                                </v-btn>
                            </v-col>
                            <v-col
                                cols="1"
                                class="flex"
                            >
                                <v-btn
                                    id="clear-session"
                                    tile
                                    dense
                                    small
                                    color="grey lighten-1"
                                    :title="$t('additional:modules.tools.cosi.saveSession.clear')"
                                    @click="confirmDialog = true"
                                >
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </v-col>
                        </v-row>
                        <v-row
                            class="flex"
                            dense
                        >
                            <v-col
                                cols="6"
                                class="flex"
                            >
                                <v-checkbox
                                    id="auto-save"
                                    v-model="autoSave"
                                    dense
                                    hide-details
                                    :label="$t('additional:modules.tools.cosi.saveSession.autoSave')"
                                    :title="$t('additional:modules.tools.cosi.saveSession.autoSaveCheck')"
                                />
                            </v-col>
                        </v-row>
                        <v-divider />
                        <v-card-title secondary-title>
<<<<<<< HEAD
                            {{ $t('additional:modules.tools.cosi.saveSession.localSave') }}
                        </v-card-title>
                        <div
                            class="mb-2"
                            v-html="$t('additional:modules.tools.cosi.saveSession.localSaveDescription')"
                        />
=======
                            Lokales Speichern
                        </v-card-title>
                        <div class="mb-2">
                            Sitzungen als Datei auf dem Rechner speichern und über den Button 'Datei laden' wieder laden. Diese können jederzeit wieder geladen oder mit anderen CoSI Nutzer:innen geteilt werden.
                        </div>
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                        <v-row class="flex">
                            <v-col
                                cols="6"
                                class="flex"
                            >
                                <v-btn
                                    id="save-to-file"
                                    tile
                                    dense
                                    small
                                    color="grey lighten-1"
                                    :title="$t('additional:modules.tools.cosi.saveSession.saveToFileTooltip')"
                                    @click="saveDialog = true; saveMode = 'saveAs'"
                                >
                                    {{ $t('additional:modules.tools.cosi.saveSession.saveToFile') }}
                                </v-btn>
                            </v-col>
                            <v-col
                                cols="6"
                                class="flex"
                            >
                                <v-btn
                                    id="load-from-file"
                                    tile
                                    dense
                                    small
                                    color="grey lighten-1"
                                    :title="$t('additional:modules.tools.cosi.saveSession.loadFromFileTooltip')"
                                    @click="loadFromFile"
                                >
                                    {{ $t('additional:modules.tools.cosi.saveSession.loadFromFile') }}
                                </v-btn>
                            </v-col>
                        </v-row>
                        <v-row class="hidden">
                            <v-col
                                cols="6"
                                class="flex"
                            >
                                <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
                                <input
                                    id="file-prompt"
                                    ref="file-prompt"
                                    type="file"
                                    accept="text/json;charset=utf-8"
                                    @change="handleFile"
                                >
                            </v-col>
                        </v-row>
                        <v-divider />
                        <v-row
                            class="flex"
                            dense
                        >
                            <small>
<<<<<<< HEAD
                                {{ $t('additional:modules.tools.cosi.saveSession.sessionHint') }}
=======
                                Bitte beachten Sie, dass nicht alle Daten und Aktionen gespeichert werden können. Grundsätzlich bezieht sich das Speichern auf die Gebiets- und Themenauswahl, Analyse- und Simulationsergebnisse. Welche Daten gespeichert werden können entnehmen Sie bitte der Anleitung.
>>>>>>> 46944dd7 (add new addons_3_0_0 structure-add missing addons)
                            </small>
                        </v-row>
                    </v-container>
                </v-app>
            </template>
        </Tool>
        <v-app>
            <v-snackbar
                v-model="loadDialog"
                :timeout="60000"
                color="white"
                class="light"
            >
                <span>
                    {{ $t('additional:modules.tools.cosi.saveSession.loadLast') }}
                    <template v-if="latestDate">
                        ({{ latestDate }})
                    </template>
                </span>
                <template #action="{ attrs }">
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="loadLastSession"
                    >
                        {{ $t("additional:modules.tools.cosi.saveSession.load") }}
                    </v-btn>
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="loadDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
            </v-snackbar>
            <v-snackbar
                id="save-dialog"
                v-model="saveDialog"
                :timeout="-1"
                color="primary"
            >
                {{ $t('additional:modules.tools.cosi.saveSession.filenamePrompt') }}
                <v-text-field
                    id="title-field"
                    v-model="session.meta.title"
                    name="session-title"
                />

                <template #action="{ attrs }">
                    <v-btn
                        id="save-to-file-action"
                        v-bind="attrs"
                        text
                        @click="onSavePrompt"
                    >
                        <v-icon>mdi-content-save</v-icon>
                    </v-btn>
                    <v-btn
                        id="close-save-dialog"
                        v-bind="attrs"
                        text
                        @click="saveDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
            </v-snackbar>
            <v-snackbar
                v-model="autoSaveDialog"
                :multi-line="true"
                :timeout="-1"
                color="secondary"
            >
                {{ $t('additional:modules.tools.cosi.saveSession.autoSaveCheck') }} <br>
                <small>{{ $t('additional:modules.tools.cosi.saveSession.autoSaveInfo') }}</small>
                <template #action="{ attrs }">
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="autoSave = true; autoSaveDialog = false"
                    >
                        {{ $t('additional:modules.tools.cosi.saveSession.yes') }}
                    </v-btn>
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="autoSave = false; autoSaveDialog = false"
                    >
                        {{ $t('additional:modules.tools.cosi.saveSession.no') }}
                    </v-btn>
                </template>
            </v-snackbar>
            <v-snackbar
                v-model="successDialog"
                :timeout="2000"
                color="success"
            >
                {{ successText }}
                <template #action="{ attrs }">
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="successDialog = false"
                    >
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
            </v-snackbar>
            <v-snackbar
                v-model="confirmDialog"
                :timeout="-1"
                color="white"
                light
                centered
            >
                {{ $t('additional:modules.tools.cosi.saveSession.clearConfirm') }}

                <template #action="{ attrs }">
                    <v-btn
                        v-bind="attrs"
                        text
                        @click="clear"
                    >
                        {{ $t('common:button.delete') }}
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
        </v-app>
    </div>
</template>

<style lang="scss" scoped>
    @import "../../utils/variables.scss";

    .hidden {
        display: hidden;
    }

    #title-field {
        width: 20vw;
    }

    .light {
        span {
            color: #111;
        }
        button {
            color: #111;
        }
    }
</style>
