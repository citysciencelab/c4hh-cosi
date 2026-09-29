<script>
import {createPolygonStyle} from "../../shared/js/createPolygonStyle.js";
import {formatDate} from "../../shared/js/formatDate.js";
import {getClickedWfstFeature} from "../../shared/js/getClickedWfstFeature.js";
import {getDownloadFileName, toFileHref} from "../../shared/js/fileData.js";
import HrCard from "../../shared/components/HrCard.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import ProjectsEdit from "./ProjectsEdit.vue";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Projects",
    components: {
        HrCard,
        HrHeader,
        HrSnackbar,
        IconButton,
        ProjectsEdit
    },
    data () {
        return {
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    computed: {
        ...mapGetters("Modules/Projects", ["criteria", "currentProject", "currentView", "wfstAttributes", "wfstLayerId"]),

        /**
         * Gets the link of the file of the current project for the download.
         * @returns {String|undefined} the link of the file or undefined, if the project has no file.
         */
        fileHref () {
            return toFileHref(this.currentProject?.formValues?.file);
        },

        /**
         * Gets the name of the file of the current project for the download.
         * The name of a saved file is not known, so it is created from the name of the project.
         * @returns {String} the name of the file.
         */
        downloadFileName () {
            return getDownloadFileName(this.currentProject?.formValues?.file, this.currentProject?.formValues?.fileName, this.currentProject?.formValues?.projectName);
        },

        /**
         * Gets the criteria of the current project without empty entries, as the criteria are optional.
         * @returns {String[]} the criteria of the current project.
         */
        projectCriteria () {
            const value = this.currentProject?.formValues?.criteria;

            return typeof value === "string" ? value.split(",").map(cri => cri.trim()).filter(cri => cri !== "") : [];
        }
    },
    async mounted () {
        if (this.wfstLayerId) {
            await this.addOrReplaceLayer({layerId: this.wfstLayerId, visibility: true});
            // the layer is created by a watcher of the layer config, so it exists after the next tick
            await this.$nextTick();
            layerCollection.getLayerById(this.wfstLayerId)?.setStyle(createPolygonStyle(this.getFeatureColor));
            // the content of a clicked project is shown in the module, so the gfi is not needed
            layerCollection.getLayerById(this.wfstLayerId)?.getLayer()?.set("gfiAttributes", "ignore");
            this.registerListener({type: "singleclick", listener: this.onMapClick, keyForBoundFunctions: "heavyRainProjectsClick"});
        }
    },
    unmounted () {
        this.removePointMarker();
        if (this.wfstLayerId) {
            this.unregisterListener({type: "singleclick", listener: this.onMapClick, keyForBoundFunctions: "heavyRainProjectsClick"});
            this.replaceByIdInLayerConfig({layerConfigs: [{id: this.wfstLayerId, layer: {visibility: false}}]});
        }
    },
    methods: {
        formatDate,
        ...mapActions("Maps", ["placingPointMarker", "registerListener", "removePointMarker", "unregisterListener"]),
        ...mapActions(["addOrReplaceLayer", "replaceByIdInLayerConfig"]),
        ...mapMutations("Modules/Projects", ["setCurrentProject", "setCurrentView"]),

        /**
         * Shows the content of the clicked project and marks the clicked position.
         * Clicks are ignored in the edit view, as the map is used for drawing there.
         * @param {Object} evt the OpenLayers map click event.
         * @returns {void}
         */
        onMapClick (evt) {
            if (this.currentView !== "main") {
                return;
            }

            const project = getClickedWfstFeature(evt, this.wfstLayerId, this.wfstAttributes);

            if (project) {
                this.setCurrentProject(project);
                this.placingPointMarker(evt.coordinate);
            }
        },

        /**
         * Opens the form for a new project.
         * The current project and its marker are reset, so that the new project does not update it.
         * @returns {void}
         */
        createProject () {
            this.removePointMarker();
            this.setCurrentProject(undefined);
            this.setCurrentView("edit");
        },

        /**
         * Downloads the file of the current project.
         * @returns {void}
         */
        downloadFile () {
            const link = document.createElement("a");

            link.href = this.fileHref;
            link.download = this.downloadFileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        /**
         * Gets the background color.
         * @param {Object[]} val the chosen criteria.
         * @returns {String} the hex color.
         */
        getBgcolor (val) {
            const index = Array.isArray(val) ? val
                .map(chosenCri => this.criteria.findIndex(cri => cri.name === String(chosenCri).trim()))
                .filter(idx => idx >= 0) : [];

            if (!index.length) {
                return this.criteria[0]?.color;
            }

            return this.criteria[Math.min(...index)].color;
        },

        /**
         * Gets the color of a saved project on the map.
         * A project with several criteria gets the color of the criterion with the highest priority.
         * @param {module:ol/Feature} feature the saved project.
         * @returns {String} the hex color.
         */
        getFeatureColor (feature) {
            const names = feature.get(this.wfstAttributes.criteria)?.split(",") || [];

            return this.getBgcolor(names.filter(name => this.criteria.some(cri => cri.name === name.trim())));
        },

        /**
         * Shows a snackbar message.
         * @param {String} message the message to display
         * @param {String} color the snackbar color
         * @returns {void}
         */
        showSnackbarMessage (message, color = "success") {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.showSnackbar = true;
        }
    }
};
</script>

<template lang="html">
    <div>
        <div v-if="currentView === 'main'">
            <HrHeader
                :text="$t('additional:modules.projects.description')"
                :button-text="$t('additional:modules.projects.createProject')"
                @click:button="createProject"
            />
            <HrCard
                v-if="typeof currentProject !== 'undefined'"
                :title="$t('additional:modules.projects.labels.projectName')"
                :edit-aria-label="$t('additional:modules.projects.labels.editProject')"
                @click:edit="setCurrentView('edit')"
            >
                <template #above-title>
                    <div class="d-flex flex-wrap gap-2">
                        <span
                            v-for="(cri, index) in projectCriteria"
                            :key="index"
                            :style="{background: getBgcolor(projectCriteria)}"
                            class="badge rounded-pill fw-normal px-3 py-2"
                        >
                            {{ cri }}
                        </span>
                    </div>
                </template>

                <template #card>
                    <div class="row g-3 mb-3">
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.createdBy") }}
                            </p>
                            <p class="mb-0 text-body-secondary">
                                {{ currentProject?.formValues?.creator }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.lastUpdate") }}
                            </p>
                            <p class="mb-0">
                                {{ formatDate(currentProject?.formValues?.lastUpdate) }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.startDate") }}
                            </p>
                            <p class="mb-0">
                                {{ formatDate(currentProject?.formValues?.startDate) }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.endDate") }}
                            </p>
                            <p class="mb-0">
                                {{ formatDate(currentProject?.formValues?.endDate) }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.contact") }}
                            </p>
                            <p class="mb-0 text-body-secondary">
                                {{ currentProject?.formValues?.contactPerson }}
                            </p>
                        </div>
                    </div>

                    <section class="mb-3">
                        <h6 class="mb-1 fw-semibold">
                            {{ $t("additional:modules.projects.labels.description") }}
                        </h6>
                        <p class="mb-2">
                            {{ currentProject?.formValues?.description }}
                        </p>
                        <a
                            :href="currentProject?.formValues?.infoLink"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ currentProject?.formValues?.infoLink }}
                        </a>
                    </section>

                    <section class="mb-3">
                        <h6 class="mb-1 fw-semibold">
                            {{ $t("additional:modules.projects.labels.source") }}
                        </h6>
                        <p class="mb-0">
                            {{ currentProject?.formValues?.source }}
                        </p>
                    </section>

                    <section class="mb-3">
                        <h6 class="mb-1 fw-semibold">
                            {{ $t("additional:modules.projects.labels.contactExt") }}
                        </h6>
                        <p class="mb-0">
                            {{ currentProject?.formValues?.contactExt }}
                        </p>
                    </section>

                    <section class="mb-3">
                        <h6 class="mb-1 fw-semibold">
                            {{ $t("additional:modules.projects.labels.history") }}
                        </h6>
                        <p class="mb-0">
                            {{ currentProject?.formValues?.history }}
                        </p>
                    </section>

                    <section class="mb-0">
                        <h6 class="mb-1 fw-semibold">
                            {{ $t("additional:modules.projects.labels.protectedAreas") }}
                        </h6>
                        <p class="mb-0">
                            {{ currentProject?.formValues?.protectedAreas }}
                        </p>
                    </section>
                    <div
                        v-if="typeof fileHref !== 'undefined'"
                        class="position-absolute bottom-0 end-0 p-3 me-5"
                    >
                        <IconButton
                            :class-array="['btn-light']"
                            icon="bi bi-paperclip"
                            :aria="downloadFileName"
                            :title="downloadFileName"
                            :interaction="() => downloadFile()"
                        />
                    </div>
                </template>
            </HrCard>
        </div>

        <div v-else-if="currentView === 'edit'">
            <ProjectsEdit
                @showSnackbarMessage="showSnackbarMessage"
            />
        </div>

        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
    </div>
</template>
