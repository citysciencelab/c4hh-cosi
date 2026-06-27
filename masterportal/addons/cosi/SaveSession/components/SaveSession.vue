<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersSaveSession";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import mutations from "../store/mutationsSaveSession";
import actions from "../store/actionsSaveSession";
import {downloadJsonToFile} from "../../utils/download";
import {Point, Polygon, MultiPoint, MultiPolygon} from "ol/geom";
import {serializeState} from "../utils/serializeState.js";
import parseState from "../utils/parseState";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import openDB from "../utils/indexedDb";
import layerCollection from "@core/layers/js/layerCollection";
import {VSnackbar} from "vuetify/components/VSnackbar";
import SimpleCard from "../../shared/modules/cards/components/SimpleCard.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "SaveSession",
    components: {
        AlertMessage,
        FileUpload,
        FlatButton,
        InputText,
        ToolInfo,
        SimpleCard,
        VSnackbar
    },
    data () {
        return {
            localStorage: null,
            db: null,
            storePaths: {
                // The order matters for loading
                Root: [
                    "layerConfig"
                ],
                Maps: [
                    "center",
                    "zoom"
                ],
                Modules: {
                    ChartGenerator: [
                        // "datasets",
                        // "chartConfigs"
                    ],
                    CalculateRatio: [
                        "dataSets"
                    ],
                    ScenarioBuilder: [
                        // "scenarios",
                        // "active"
                    ],
                    DistrictSelector: [
                        "selectedTabItem",
                        "selectionCardsStatisticalData",
                        "selectionCardsSubjectData"
                    ],
                    AccessibilityAnalysis: [
                        "dataSets"
                    ],
                    Dashboard: [
                        "calculations",
                        "statsFeatureFilter",
                        "timestamps",
                        "timestampsFiltered"
                    ],
                    Draw: [
                        // "layer"
                    ]
                }
            },
            state: null,
            session: {
                meta: {
                    title: `${this.$t("additional:modules.cosi.saveSession.newSession")}-${new Date().toLocaleString()}`,
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
            displayWorkStatus: false,
            successLoading: false,
            failedLoading: false,
            geomConstructors: {Point, Polygon, MultiPoint, MultiPolygon},
            // toolsWithDatasets: ["AccessibilityAnalysis", "CalculateRatio", "QueryDistricts"]
            deepFeatures: {
                AccessibilityAnalysis: ["dataSets"],
                QueryDistricts: ["propertiesMap"]
            }
        };
    },
    computed: {
        ...mapGetters("Modules/About", ["version"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/SaveSession", Object.keys(getters)),
        // ...mapGetters("Modules/ScenarioBuilder", {simGuideLayer: "guideLayer"}),
        // ...mapGetters("Modules/ResidentialSimulation", {simNeighborhoodLayer: "drawingLayer"}),
        ...mapGetters("Modules/DistrictSelector", ["selectedDistrictLevel", "districtLevels", "selectedDistrictNames"]),
        ...mapGetters("Maps", ["getLayerById", "getVisibleLayerList"]),
        ...mapGetters("Modules/TemplateManager", ["useTemplatesForMapping"]),
        ...mapGetters(["layerConfig"])
    },
    watch: {
        autoSave () {
            this.successText = this.$t("additional:modules.cosi.saveSession.settingsChanged");
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
        this.setDefaultActiveLayerIds(this.getVisibleLayers().map(x => x?.getLayer().getProperties()?.id));
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
        ...mapActions("Maps", ["addNewLayerIfNotExists", "registerListener", "unregisterListener"]),
        ...mapActions("Modules/About", ["currentMasterportalVersionNumber"]),
        ...mapActions("Modules/SaveSession", Object.keys(actions)),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Modules/DistrictSelector", ["setDistrictsByName"]),
        ...mapMutations("Modules/SaveSession", Object.keys(mutations)),
        ...parseState,
        downloadJsonToFile,

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleLayers () {
            return layerCollection.getLayers().filter(layer => {
                return layer?.attributes.visibility === true;
            });
        },
        /**
         * Saving the data
         * @returns {void}
        */
        save () {
            this.saveDialog = false;
            this.state = serializeState(this.storePaths, this.$store, this.deepFeatures);

            this.session.state = JSON.stringify(this.state);
            this.session.meta.created = new Date().toLocaleString();
            this.session.meta.date = new Date();

            if (this.version) {
                this.currentMasterportalVersionNumber();
                this.session.meta.version = this.version;
            }
        },
        /**
         * Saving the data in local storage
         * @returns {void}
         */
        quickSave () {
            this.save();
            this.storeToLocalStorage();
        },
        /**
         * Saving the data in extra file
         * @returns {void}
         */
        saveAs () {
            this.save();
            this.downloadJsonToFile(this.session, this.session.meta.title + ".json");
        },
        /**
         * Clearing the data in local storage
         * @returns {void}
         */
        clear () {
            if (this.db) {
                const
                    transaction = this.db.transaction("sessions", "readwrite"),
                    request = transaction.objectStore("sessions").clear();

                request.onsuccess = () => {
                    this.latestDate = null;
                    this.confirmDialog = false;
                    this.successText = this.$t("additional:modules.cosi.saveSession.cleared");
                    this.successDialog = true;
                };
            }
            this.localStorage.removeItem("cosi-state");
        },
        /**
         * Saving the data in local storage
         * @returns {void}
         */
        storeToLocalStorage () {
            if (this.db) {
                const
                    transaction = this.db.transaction("sessions", "readwrite"),
                    request = transaction.objectStore("sessions").put(this.session, 0);

                request.onerror = (err) => {
                    console.error(err);
                    this.addSingleAlert({
                        content: this.$t("additional:modules.cosi.saveSession.saveToLocalStorageError"),
                        category: "Error",
                        displayClass: "error"
                    });
                };
                request.onsuccess = () => {
                    this.successText = this.$t("additional:modules.cosi.saveSession.success");
                    this.successDialog = true;
                    this.latestDate = this.session.meta?.created;
                };
            }
            else {
                this.localStorage.setItem("cosi-state", JSON.stringify(this.session));
                this.successText = this.$t("additional:modules.cosi.saveSession.success");
                this.successDialog = true;
                this.latestDate = this.session.meta?.created;
            }
        },
        /**
         * Loading the last session
         * @returns {void}
         */
        loadLastSession () {
            this.loadFromLocalStorage();
            this.loadDialog = false;
        },
        /**
         * Checking the last session
         * @returns {void}
         */
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
        /**
         * Loading the session from local storage
         * @returns {void}
         */
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
                    content: this.$t("additional:modules.cosi.saveSession.loadFromLocalStorageError"),
                    category: "Error",
                    displayClass: "error"
                });
            }
        },
        /**
         * Loading the data from file
         * @returns {void}
         */
        loadFromFile () {
            this.$refs["file-prompt"].click();
            this.loadDialog = false;
        },
        /**
         * Loading the data from file
         * @param {Object[]} evt The target of current change event.
         * @returns {void}
         */
        handleFile (evt) {
            const file = evt.target.files[0],
                reader = new FileReader();

            this.failedLoading = false;

            reader.onload = res => {
                try {
                    const session = JSON.parse(res.target.result);

                    this.load(session);
                }
                catch (e) {
                    console.error(e);
                    console.warn("File could not be read");

                    this.failedLoading = true;
                }
            };
            reader.readAsText(file);
        },
        /**
         * Loading function
         * @param {Object} session The saved session
         * @returns {void}
         */
        load (session) {
            let state;
            // createdTime;

            if (!Object.hasOwnProperty.call(session, "template") && !Object.hasOwnProperty.call(session, "reset")) {
                state = session.state || session; // fallback for old saves
                this.session.meta.title = session.meta?.title || this.session.meta.title;
                // createdTime = session.meta?.created;
            }
            else {
                state = session.template.state || session.template; // fallback for old saves
                this.session.meta.title = session.template.meta?.title || this.session.meta.title;
                // createdTime = session.template.meta?.created;
            }

            this.setActive(false);
            this.parseState(this.storePaths, typeof state === "string" ? JSON.parse(state) : state, [], false, session.reset);
            if (Object.hasOwnProperty.call(session, "reset") && session.reset) {
                this.$store.commit("Tools/DistrictSelector/setActive", false);
            }

            if (!session.reset) {
                this.displayWorkStatus = true;
                this.successLoading = true;
            }
        },
        /**
         * Getting the saved layers from id
         * @param {String} layerId The layer Id
         * @param {Boolean} reset if layers are reset as not selected.
         * @returns {module:ol/Layer} the layer
         */
        getTopicsLayer (layerId, reset = false) {
            let layer = this.getLayerById({layerId: layerId});

            if (layer) {
                return layer;
            }
            if (this.onlyUdpServices && isNaN(parseInt(layerId, 10))) {
                return undefined;
            }

            const model = this.initializeLayer(layerId);

            if (model) {
                model.set("isSelected", !(reset && !this.defaultActiveLayerIds.includes(layerId)));
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
        initializeLayer () {
        // initializeLayer (layerId) {
            // if (!getModelByAttributes({id: layerId})) {
            //     addModelsByAttributes({id: layerId});
            // }

            // return getModelByAttributes({id: layerId});
        },

        onSavePrompt () {
            this.saveDialog = false;
            this[this.saveMode]();
        },
        /**
         * Enable auto save regularly
         * @returns {void}
         */
        enableAutoSave () {
            this.autoSaveInterval = setInterval(() => {
                this.quickSave();
            }, 600000);
        },
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
        hasDeepFeatures (key, attr) {
            const tool = Object.keys(this.deepFeatures).find(id => key.includes(id));

            return this.deepFeatures[tool]?.includes(attr);
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
        },
        /**
         * Called when user drops a file in the upload container
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onDrop (e) {
            if (e.dataTransfer.files !== undefined) {
                this.handleFile(e);
            }
        },
        /**
         * Called when user uploads a file to process
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onInputChange (e) {
            if (e.target.files !== undefined) {
                this.handleFile(e);
                e.target.value = null;
            }
        }
    }
};
</script>

<template lang="html">
    <div>
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.cosi.saveSession.localSaveDescription')"
        />
        <h5 class="mb-3">
            {{ $t("additional:modules.cosi.saveSession.currentWorkStatus") }}
        </h5>
        <InputText
            id="session-name"
            v-model="session.meta.title"
            class="mb-3"
            :placeholder="$t('additional:modules.cosi.saveSession.sessionName')"
            :label="$t('additional:modules.cosi.saveSession.sessionName')"
        />
        <FlatButton
            class="mx-auto"
            icon="bi bi-cloud-arrow-down"
            :disabled="session.meta.title.length === 0"
            :text="$t('additional:modules.cosi.saveSession.saveAsFile')"
            @click="saveMode = 'saveAs', onSavePrompt()"
        />
        <hr class="my-8">
        <h5 class="mb-3">
            {{ $t("additional:modules.cosi.saveSession.currentWorkStatusFromFile") }}
        </h5>
        <FileUpload
            :id="'sessionUpload'"
            class="mt-5 ms-3"
            :keydown="(e) => triggerClickOnFileInput(e)"
            :change="(e) => onInputChange(e)"
            :drop="(e) => onDrop(e)"
        />
        <AlertMessage
            v-if="failedLoading"
            :text="$t('additional:modules.cosi.saveSession.sessionError')"
            type="error"
            :closeable="true"
        />
        <div
            v-if="displayWorkStatus"
            class="mx-4 mt-5"
        >
            <h6 class="loaded-work-status">
                {{ $t("additional:modules.cosi.saveSession.loadedWorkingStatus") }}
            </h6>
            <SimpleCard
                icon="bi bi-file-earmark-text"
                :label="$t('additional:modules.cosi.saveSession.sessionName')"
                :text="session.meta.title"
                @click:close="''"
            />
        </div>
        <v-snackbar
            v-model="successLoading"
            :timeout="6000"
            color="primary"
        >
            <span>
                {{ $t("additional:modules.cosi.saveSession.succesLoadingFile") + session.meta.title }}
            </span>
        </v-snackbar>
    </div>
</template>

<style lang="scss" scoped>
    .loaded-work-status{
        color: $secondary;
        font-family: $font_family_accent;
    }
</style>
