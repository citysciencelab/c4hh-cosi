<script>
import axios from "axios";
import Card from "../../shared/modules/cards/components/Card.vue";
import {geoJsonCollectionToFeatures} from "../../utils/features/convertFromGeoJson";
import dayjs from "dayjs";
import DipasContributions from "./DipasProjectsContributions.vue";
import {exportFeatureAsGeoJSON} from "../../utils/features/exportAsGeoJSON";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {getLayerById} from "../../utils/layer/getLayerById.js";
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsDipasProjects";
import {Point} from "ol/geom";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";

export default {
    name: "DipasProjects",
    components: {
        Card,
        DipasContributions,
        FlatButton,
        IconButton,
        ToolInfo
    },
    data () {
        return {
            contributions: {},
            currentView: "projects",
            isExpanded: false,
            projects: [],
            selectedProjectId: null,
            sortOrder: "desc"
        };
    },
    computed: {
        ...mapGetters("Modules/DipasProjects", ["baseUrl"]),
        ...mapGetters("Maps", ["projectionCode"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),

        /**
         * Finds and returns the currently selected project based on the selectedProjectId.
         * @returns {Object|undefined} The selected project object or undefined if not found.
         */
        selectedProject () {
            return this.projects.find(project => project.id === this.selectedProjectId);
        },

        /**
         * Gets the icon name based on the current sort order.
         * @returns {String} The icon name.
         */
        sortOrderIcon () {
            return this.sortOrder === "asc" ? "bi bi-sort-up" : "bi bi-sort-down";
        },

        /**
         * Gets the label for the current sort order.
         * @returns {String} The sort order label.
         */
        sortOrderLabel () {
            return this.sortOrder === "asc"
                ? this.$t("additional:modules.tools.cosi.dipasProjects.ascending")
                : this.$t("additional:modules.tools.cosi.dipasProjects.descending");
        }
    },

    /**
     * fetches the projects and creates their layer with different color styles
     * @returns {void}
     */
    async mounted () {
        const projectFeatures = await this.getProjectFeatures();

        this.projects = this.prepareProjects(projectFeatures);
        this.sortProjectsByDate(this.projects, this.sortOrder);
        this.layer = getLayerById("dipas-projects", {
            "fill-color": "rgba(60, 95, 148, 0.2)",
            "stroke-color": "rgba(60, 95, 148, 1)",
            "stroke-width": 3
        });
    },

    unmounted () {
        this.layer.getLayer().getSource().clear();
    },

    methods: {
        ...mapMutations("Modules/DipasProjects", Object.keys(mutations)),
        ...mapActions("Maps", ["zoomToExtent"]),
        ...mapActions("Modules/DipasProjects", ["addLayer"]),
        ...mapActions("Modules/Draw_old", ["createCenterPoint"]),
        exportFeatureAsGeoJSON,

        /**
         * Adds a feature to a specified layer and makes the layer visible.
         * @param {ol/Feature} feature - The feature to be added to the layer.
         * @param {ol/layer/Vector} layer - The layer to which the feature should be added.
         * @returns {void}
         */
        addFeatureToLayer (feature, layer) {
            if (layer) {
                const source = layer.getSource();

                source.clear();
                source.addFeature(feature);
                layer.setVisible(true);
            }
        },

        /**
         * Toggles the sort order between ascending and descending.
         * @param {String} order - The current sort order ("asc" or "desc").
         * @returns {void}
         */
        changeSortOrder (order) {
            this.sortOrder = order === "asc" ? "desc" : "asc";
        },

        /**
         * Fetches GeoJSON data from a specified URL and returns it.
         * @param {String} url - The URL from which to fetch.
         * @returns {Object} The FeatureCollection as GeoJSON.
         */
        async fetchGeoJson (url) {
            const ret = await axios(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                        "Content-Type": "application/json"
                    }
                }),
                json = await ret.data;

            if (json.error) {
                throw Error(JSON.stringify(json));
            }
            return json;
        },

        /**
         * Gets the contribution features for a specific project from the DIPAS API.
         * @param {String} id - The id of the project
         * @returns {ol/Feature[]} The features of all contributions
         */
        async getContributionFeatures (id) {
            const featureCollection = await this.fetchGeoJson(this.baseUrl + "/" + id + "/contributions");

            for (let i = featureCollection.features.length - 1; i >= 0; i--) {
                // Filter out old DIPAS projects (before Drupal 8)
                if (featureCollection.features[i].properties.isDipasProceeding === false) {
                    featureCollection.features.splice(i, 1);
                }
            }

            return geoJsonCollectionToFeatures(featureCollection);
        },

        /**
         * Gets the project features from the DIPAS API.
         * @returns {ol/Feature[]} The project features.
         */
        async getProjectFeatures () {
            const featureCollection = await this.fetchGeoJson(this.baseUrl);

            for (let i = featureCollection.features.length - 1; i >= 0; i--) {
                // Filter out old DIPAS projects (before Drupal 8)
                if (featureCollection.features[i].properties.isDipasProceeding === false) {
                    featureCollection.features.splice(i, 1);
                }
            }

            return geoJsonCollectionToFeatures(featureCollection);
        },

        /**
         * Sets the contribution features for a specific project.
         * Checks if the contributions for the selected project are already loaded. If not, sets the contribution features for a specific project.
         * @param {String} id - The project Id
         * @returns {void}
         */
        async setContributionFeatures (id) {
            if (this.selectedProject.contributions.length === 0) {
                this.selectedProject.contributions = await this.getContributionFeatures(id);

                for (let i = 0; i < this.selectedProject.contributions.length; i++) {
                    const feature = this.selectedProject.contributions[i];

                    if (feature.getGeometry().getType() !== "Point") {
                        const center = await this.createCenterPoint({feature});

                        feature.setGeometry(new Point(center));
                    }
                }
            }
        },

        zoomToProject (feature) {
            const extent = feature.getGeometry().getExtent();

            this.zoomToExtent({extent: extent, options: {padding: [20, 20, 20, 20]}});
        },

        getDateString (feature) {
            const startDate = dayjs(feature.get("dateStart")).format("DD.MM.YYYY"),
                endDate = dayjs(feature.get("dateEnd")).format("DD.MM.YYYY");

            return `${startDate} - ${endDate}`;
        },


        /**
         * Prepares and formats the projects data.
         * @param {ol/Feature[]} features - The project features.
         * @returns {Object} - The project data.
        */
        prepareProjects (features) {
            return features.map(feature => {
                const props = feature.getProperties();

                return {
                    id: props.id,
                    title: props.nameFull,
                    categories: Object.values(props.standardCategories).map(cat => cat.name),
                    description: props.description,
                    dateRange: this.getDateString(feature),
                    feature,
                    contributionCount: props.hasParticipatoryText?.length || 0,
                    state: props.proceedingState,
                    website: props.website,
                    owner: props.owner,
                    status: "",
                    contributions: []
                };
            });
        },
        /**
         * Gets the formatted properties for the UI card component.
         * @param {Object} project - The project data object to be transformed.
         * @returns {Object} - The project data for card component.
        */
        getCardProps (project) {
            return {
                badgeList: [{
                    backgroundColor: project.state === "active" ? "#daefde" : "#3C5F94",
                    color: project.state === "active" ? "#005d00" : "#FFFFFF",
                    text: this.$t(`additional:modules.tools.cosi.dipasProjects.${project.state}`)
                }],
                data: [
                    {value: project.title},
                    {icon: "bi bi-calendar", label: project.dateRange},
                    {icon: "bi bi-card-list", label: `${project.contributionCount} Beiträge`}
                ],
                status: project.status
            };
        },
        /**
         * Gets the selected project by ID and updates its status to active.
         * @param {String} id - the id of the project to select.
         * @returns {void}
         */
        selectProject (id) {
            this.isExpanded = false;

            const foundProject = this.projects.find(project => project.id === id),
                activeProject = this.projects.find(project => project.status === "active");

            this.addFeatureToLayer(foundProject.feature, this.layer.getLayer());

            if (activeProject && activeProject.id !== id) {
                activeProject.status = "";
            }
            if (foundProject && foundProject.status !== "active") {
                foundProject.status = "active";
                this.zoomToProject(foundProject.feature);
            }
            else if (foundProject && foundProject.status === "active") {
                foundProject.status = "";
                this.layer.getLayer().getSource().clear();
            }
        },
        /**
         * Toggles the expanded view state and scrolls the selected card into view.
         * @param {String} id - the id of the selected project.
         * @returns {void}
         */
        toggleText (id) {
            if (this.isExpanded) {

                this.isExpanded = false;

                setTimeout(() => {
                    const element = document.getElementById(`card-${id}`);

                    if (element) {
                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });
                    }
                }, 50);
            }
            else {
                this.isExpanded = true;
            }
        },
        /**
         * Opens a given URL in a new browser tab.
         * @param {String} url - the web address to be opened.
         * @returns {void}
         */
        handleLinkClick (url) {
            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        },
        /**
         * Updates the view to display contributions for a specific project.
         * @param {String} id - the id of the project whose contributions should be shown.
         * @returns {void}
         */
        async showProjectContributions (id) {
            this.selectedProjectId = id;
            await this.setContributionFeatures(id);
            this.currentView = "contributions";
            this.isExpanded = false;
        },

        /**
         * Switches the view back to the project overview and resets the scroll position.
         * @returns {void}
         */
        returnToProjects () {
            this.currentView = "projects";

            const element = document.getElementById("dipas");

            if (element) {
                element.scrollIntoView({behavior: "instant"});
            }
        },

        /**
         * Sorts the projects by their start date in either ascending or descending order.
         * @param {Array} projects - The array of project objects to be sorted.
         * @param {String} order - The sort order, either "asc" for ascending or "desc" for descending.
         * @returns {void}
         */
        sortProjectsByDate (projects, order) {
            const sorted = [...projects].sort((a, b) => {
                const dateA = dayjs(a.dateRange.split(" - ")[0], "DD.MM.YYYY");
                const dateB = dayjs(b.dateRange.split(" - ")[0], "DD.MM.YYYY");

                if (order === "asc") {
                    return dateA - dateB;
                }
                return dateB - dateA;
            });

            this.projects = sorted;
        }
    }
};
</script>

<template lang="html">
    <div
        id="dipas"
    >
        <div v-if="currentView === 'projects'">
            <ToolInfo
                :locale="currentLocale"
                :summary="$t('additional:modules.tools.cosi.dipasProjects.summary')"
            />
            <hr>
            <div v-if="projects.length > 0">
                <div class="d-flex justify-content-between align-items-center pb-3 pt-3 ps-2">
                    <h4 class="pb-3">
                        {{ $t('additional:modules.tools.cosi.dipasProjects.projectsHeadline') }}
                    </h4>
                    <IconButton
                        :aria="sortOrderLabel"
                        :icon="sortOrderIcon"
                        :title="sortOrderLabel"
                        :interaction="() => {
                            sortProjectsByDate(projects, sortOrder);
                            changeSortOrder(sortOrder);
                        }"
                        :class-array="['btn-light']"
                        :label="sortOrderLabel"
                    />
                </div>
                <div
                    v-for="project in projects"
                    :id="`card-${project.id}`"
                    :key="project.id"
                    class="px-3"
                >
                    <Card
                        :badge-list="getCardProps(project).badgeList"
                        :data="getCardProps(project).data"
                        :downloadable="true"
                        :removable="false"
                        :link-to="!!project.website"
                        icon="bi-folder2-open"
                        :status="getCardProps(project).status"
                        @click="selectProject(project.id)"
                        @link-opened="handleLinkClick(project.website)"
                        @download-set="exportFeatureAsGeoJSON(project.feature, project.title)"
                    />
                    <div
                        v-if="project.status === 'active'"
                        class="project-details-container"
                    >
                        <div class="text-wrapper p-4">
                            <div :class="['expand-content', { 'is-collapsed': !isExpanded }]">
                                <div class="d-flex flex-column pb-3">
                                    <small
                                        class="cardLabel"
                                    >
                                        {{ $t('additional:modules.tools.cosi.dipasProjects.owner') }}
                                    </small>
                                    <small>
                                        {{ project.owner }}
                                    </small>
                                </div>
                                <div class="d-flex flex-column">
                                    <small
                                        class="cardLabel"
                                    >
                                        {{ $t('additional:modules.tools.cosi.dipasProjects.projectDescription') }}
                                    </small>
                                    <div
                                        class="text-start"
                                        v-html="project.description"
                                    />
                                </div>
                            </div>
                            <div class="d-flex justify-content-center">
                                <button
                                    class="btn btn-link p-0 mt-2 text-decoration-none small d-flex align-items-center"
                                    @click="toggleText(project.id)"
                                >
                                    {{ isExpanded ? 'Schließen' : 'Weiterlesen...' }}
                                    <i :class="['bi ms-1', isExpanded ? 'bi-chevron-up' : 'bi-chevron-down']" />
                                </button>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center py-3">
                            <FlatButton
                                v-if="project.contributionCount !== 0"
                                class="btn-primary"
                                icon="bi bi-card-list"
                                :text="$t('additional:modules.tools.cosi.dipasProjects.showAllContributions')"
                                @click="showProjectContributions(project.id)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="d-flex flex-column align-items-center justify-content-center py-10 my-5">
                    <div
                        class="spinner-border text-primary-emphasis mb-4"
                        role="status"
                    />
                    <h6 class="">
                        {{ $t('additional:modules.tools.cosi.dipasProjects.loading') }}
                    </h6>
                </div>
            </div>
        </div>
        <div
            v-else-if="currentView === 'contributions'"
        >
            <DipasContributions
                :project="selectedProject"
                :items="selectedProject.contributions"
                @back="returnToProjects"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

html {
    scroll-behavior: smooth;
}
.spinner-border {
    width: 3em;
    height: 3rem;
    color: $secondary;
}
.text-wrapper {
    background-color: #f8f9fb;
    border-radius: 15px;
    border: 1px solid rgba(0, 0, 0, 0.03);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    line-height: 1.6;
}

.cardLabel {
    color: $dark-grey;
    font-family: $font_family_accent;
}

.expand-content {
  transition: max-height 0.5s ease-in-out;
  overflow: hidden;
  white-space: pre-line;
  line-break: loose;
  word-spacing: normal;
}

.expand-content.is-collapsed {
  max-height: 7rem;
  mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 20%, transparent 100%);
}

.expand-content:not(.is-collapsed) {
  mask-image: none;
  -webkit-mask-image: none;
}

[id^="card-"] {
  scroll-margin-top: 2rem;
}
</style>
