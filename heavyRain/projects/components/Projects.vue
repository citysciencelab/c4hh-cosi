<script>
import {createPolygonStyle} from "../../shared/js/createPolygonStyle.js";
import HrCard from "../../shared/components/HrCard.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
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
        ...mapGetters("Modules/Projects", ["criteria", "currentProject", "currentView", "wfstAttributes", "wfstLayerId"])
    },
    async mounted () {
        if (this.wfstLayerId) {
            await this.addOrReplaceLayer({layerId: this.wfstLayerId, visibility: true});
            // the layer is created by a watcher of the layer config, so it exists after the next tick
            await this.$nextTick();
            layerCollection.getLayerById(this.wfstLayerId)?.setStyle(createPolygonStyle(this.getFeatureColor));
        }
    },
    unmounted () {
        if (this.wfstLayerId) {
            this.replaceByIdInLayerConfig({layerConfigs: [{id: this.wfstLayerId, layer: {visibility: false}}]});
        }
    },
    methods: {
        ...mapActions(["addOrReplaceLayer", "replaceByIdInLayerConfig"]),
        ...mapMutations("Modules/Projects", ["setCurrentProject", "setCurrentView"]),

        /**
         * Creates a new project
         * @returns {void}
         */
        createProject () {
            this.setCurrentProject(undefined);
            this.setCurrentView("edit");
        },

        /**
         * Gets the background color.
         * @param {Object[]} val the chosen criteria.
         * @returns {String} the hex color.
         */
        getBgcolor (val) {
            if (!Array.isArray(val) || !val.length) {
                return this.criteria[0].color;
            }

            const index = [];

            val.forEach(chosenCri => {
                index.push(this.criteria.findIndex(cri => cri.name === chosenCri.trim()));
            });

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
                            v-for="(cri, index) in currentProject?.formValues?.criteria.split(',')"
                            :key="index"
                            :style="{background: getBgcolor(currentProject?.formValues?.criteria.split(','))}"
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
                                {{ currentProject?.formValues?.createdAt }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.startDate") }}
                            </p>
                            <p class="mb-0">
                                {{ currentProject?.formValues?.startDate }}
                            </p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0 small fw-semibold">
                                {{ $t("additional:modules.projects.labels.endDate") }}
                            </p>
                            <p class="mb-0">
                                {{ currentProject?.formValues?.endDate }}
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
