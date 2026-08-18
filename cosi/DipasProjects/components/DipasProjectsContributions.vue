<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import {Circle, Fill, Stroke, Style} from "ol/style.js";
import dayjs from "dayjs";
import DipasProjectsContributionsAnalyse from "./DipasProjectsContributionsAnalyse.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getLayerById} from "../../utils/layer/getLayerById.js";
import {mapActions} from "vuex";
import {pointerMove} from "ol/events/condition";
import {Select} from "ol/interaction";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import {VExpansionPanels, VExpansionPanel, VExpansionPanelTitle, VExpansionPanelText} from "vuetify/components/VExpansionPanel";

export default {
    name: "DipasProjectsContributions",
    components: {
        DipasProjectsContributionsAnalyse,
        AlertMessage,
        Badges,
        FlatButton,
        TagGroup,
        VExpansionPanels,
        VExpansionPanel,
        VExpansionPanelTitle,
        VExpansionPanelText
    },
    provide () {
        return {
            votingClassificationThresholds: this.getVotingClassificationThresholds(),
            votingLegend: this.votingLegend
        };
    },
    props: {
        project: {
            type: Object,
            required: true
        },
        items: {
            type: Array,
            required: true
        }
    },
    emits: ["back"],
    data () {
        return {
            colors: [
                "#005D00",
                "#075798",
                "#D80372",
                "#329CC0",
                "#ed1c24",
                "#329cc0",
                "#2C3E50",
                "#880E4F",
                "#006064",
                "#922B21",
                "#D55E00",
                "#512DA8"
            ],
            processedContributions: [],
            computedContributions: [],
            isProjectExpanded: false,
            isPointAnalyseActive: false,
            openedPanel: undefined,
            selectedCategories: this.project.categories,
            visibleCount: 30,
            pageSize: 30,
            observer: null,
            votingLegend: {
                positiv: {
                    color: "#63CC63",
                    icon: "bi bi-hand-thumbs-up",
                    id: "positiv",
                    text: this.$t("additional:modules.tools.cosi.dipasProjects.voting.positiveVotes")
                },
                negativ: {
                    color: "#EA5050",
                    icon: "bi bi-hand-thumbs-down",
                    id: "negativ",
                    text: this.$t("additional:modules.tools.cosi.dipasProjects.voting.negativeVotes")
                },
                balanced: {
                    color: "#f5a623",
                    icon: "bi bi-circle",
                    id: "balanced",
                    text: this.$t("additional:modules.tools.cosi.dipasProjects.voting.balancedVotes")
                },
                noVoting: {
                    color: "#888888",
                    icon: "bi bi-circle",
                    id: "noVoting",
                    text: this.$t("additional:modules.tools.cosi.dipasProjects.voting.noVotes")
                }
            }
        };
    },
    computed: {
        /**
         * Generates a mapping of project categories to specific colors.
         * @returns {Object} the mapped category colours.
         */
        categoryColors () {
            const map = {};

            this.project.categories?.forEach((cat, index) => {
                map[cat] = this.colors[index % this.colors.length];
            });
            return map;
        },
        /**
         * Transforms project categories into tag objects for tagroup.
         * @returns {Object[]} An array of tag objects containing label, selected state and color.
         */
        categoryTags () {
            return this.project.categories?.map(cat => ({
                label: cat,
                selected: this.selectedCategories.includes(cat),
                color: this.isPointAnalyseActive ? "#151C27" : this.categoryColors[cat]
            }));
        },
        /**
         * Slice of computedContributions that is actually rendered, to avoid mounting
         * hundreds of expansion panels at once. Grows automatically via IntersectionObserver.
         * @returns {Object[]} The currently visible contributions.
         */
        visibleContributions () {
            return this.computedContributions.slice(0, this.visibleCount);
        }
    },
    watch: {
        openedPanel () {
            this.select.getFeatures().clear();
            if (typeof this.openedPanel === "undefined") {
                return;
            }

            const contribution = this.computedContributions[this.openedPanel],
                  foundFeature = this.items.find(feature => feature.get("id") === contribution.id),
                  extent = foundFeature.getGeometry().getExtent();

            if (extent) {
                this.select.getFeatures().push(foundFeature);
                this.zoomToExtent({extent: extent, options: {padding: [10, 10, 10, 10]}});
            }
        }
    },
    created () {
        this.selectedCategories = this.project.categories;
        this.createSelectInteraction();
        this.createHoverInteraction();
        this.contributionsLayer = getLayerById("dipas-contributions").getLayer();
        this.map = mapCollection.getMap("2D");
        this.updateProcessedContributions();
    },
    mounted () {
        this.scrollToContributionPanel("contributions");
        this.contributionsLayer.setStyle(this.getContributionColorByCategory);
        this.addFeaturesToLayer(this.items, this.contributionsLayer);
        this.select.setActive(true);

        this.observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && this.visibleCount < this.computedContributions.length) {
                this.visibleCount += this.pageSize;
            }
        });
        this.$nextTick(() => this.observeSentinel());
    },
    updated () {
        this.observeSentinel();
    },
    unmounted () {
        this.select.setActive(false);
        this.hover.setActive(false);
        this.contributionsLayer.getSource().clear();
        this.observer?.disconnect();
    },
    methods: {
        ...mapActions("Maps", ["zoomToExtent", "addInteraction"]),

        /**
         * Recalculates the processed contributions.
         * @returns {void}
         */
        updateProcessedContributions () {
            this.processedContributions = this.items.map(feature => {
                const votingPro = parseInt(feature.get("votingPro"), 10),
                      votingContra = parseInt(feature.get("votingContra"), 10),
                      votingResultType = this.getVotingResultType(votingPro, votingContra),
                      {id, color, icon} = this.votingLegend[votingResultType];

                feature.set("isSelected", false);
                feature.set("votingResultValue", votingPro - votingContra);
                feature.set("votingResult", id);
                feature.set("color", color);
                feature.set("icon", icon);

                return feature.getProperties();
            });

            this.updateContributions();
        },

        /**
         * Cheap re-filter of the already-processed contributions.
         * Called on every category-filter change. Resets the visible slice
         * @returns {void}
         */
        updateContributions () {
            this.computedContributions = this.processedContributions.filter(k => this.selectedCategories.includes(k.category));
            this.visibleCount = this.pageSize;
        },

        /**
         * (Re-)attaches the IntersectionObserver to the current sentinel element,
         * so newly rendered/removed sentinel nodes keep triggering lazy loading.
         * @returns {void}
         */
        observeSentinel () {
            this.observer?.disconnect();
            if (this.$refs.loadMoreSentinel) {
                this.observer.observe(this.$refs.loadMoreSentinel);
            }
        },

        /**
         * Adds multiple features to a specified layer and makes the layer visible.
         * @param {ol/Feature[]} features - The features to be added to the layer.
         * @param {ol/layer/Vector} layer - The layer to which the features should be added.
         * @returns {void}
         */
        addFeaturesToLayer (features, layer) {
            if (layer) {
                const source = layer.getSource();

                source.clear();
                source.addFeatures(features);
                layer.setVisible(true);
            }
        },

        createHoverInteraction () {
            this.hover = new Select({
                condition: (evt) => pointerMove(evt),
                filter: (feature, layer) => {
                    return layer.get("id") === "dipas-contributions";
                },
                style: (feature) => {
                    if (this.isPointAnalyseActive) {
                        return this.getContributionAnalyseStyle(feature, true);
                    }
                    return this.getContributionStyle(feature.get("category"), true);
                }
            });
            this.hover.set("id", "dipas-contributions-hover");
            this.hover.getFeatures().on("add", this.setFeatureIsSelected);
            this.hover.getFeatures().on("remove", this.setFeatureIsSelected);
            this.addInteraction(this.hover);
        },

        createSelectInteraction () {
            this.select = new Select({
                filter: (feature, layer) => {
                    return layer.get("id") === "dipas-contributions";
                },
                style: (feature) => {
                    if (this.isPointAnalyseActive) {
                        return this.getContributionAnalyseStyle(feature, true);
                    }
                    return this.getContributionStyle(feature.get("category"), true);
                }
            });
            this.select.set("id", "dipas-contributions-select");
            this.select.on("select", this.handleMapSelect);
            this.select.getFeatures().on("add", this.setFeatureIsSelected);
            this.select.getFeatures().on("remove", this.setFeatureIsSelected);
            this.addInteraction(this.select);
        },


        /**
         * Generates a style for a contribution feature based on its category and whether it is highlighted.
         * @param {String} category - The category of the contribution, used to determine the fill color.
         * @param {Boolean} isHighlighted - A flag indicating whether the contribution is highlighted, affecting the radius and stroke of the style.
         * @returns {ol/style/Style} The generated style for the contribution feature.
         */
        getContributionStyle (category, isHighlighted = false) {
            const colorByCategory = this.categoryColors[category];

            return new Style({
                image: new Circle({
                    radius: isHighlighted ? 12 : 8,
                    fill: new Fill({color: colorByCategory}),
                    stroke: new Stroke({
                        color: isHighlighted ? "#fff" : "#000",
                        width: isHighlighted ? 1.5 : 1
                    })
                })
            });
        },

        /**
         * Gets the style for a contribution feature based on its voting result value and whether it is highlighted.
         * @param {ol/Feature} feature - The contribution feature whose voting result value is used to determine the style.
         * @param {Boolean} isHighlighted - A flag indicating whether the contribution is highlighted, affecting the radius and stroke of the style.
         * @returns {ol/style/Style} The generated style for the contribution feature.
         */
        getContributionAnalyseStyle (feature, isHighlighted = false) {
            const thresholds = this.getVotingClassificationThresholds(),
                  absValue = Math.abs(feature.get("votingResultValue")),
                  fillColor = this.votingLegend[feature.get("votingResult")].color;

            let radius = 6;

            if (absValue > thresholds[2]) {
                radius = 12;
            }
            else if (absValue > thresholds[1]) {
                radius = 9;
            }

            return new Style({
                image: new Circle({
                    radius: isHighlighted ? radius + 4 : radius,
                    fill: new Fill({color: fillColor}),
                    stroke: new Stroke({
                        color: isHighlighted ? "#fff" : "#000",
                        width: isHighlighted ? 1.5 : 1
                    })
                })
            });
        },

        /**
         * Returns the style for a contribution feature based on its category if that category is selected.
         * @param {ol/Feature} feature - The contribution feature whose category is used to determine the style.
         * @returns {ol/style/Style|null} The style for the contribution feature, or null if its category is not selected.
         */
        getContributionColorByCategory (feature) {
            const category = feature.get("category");

            if (!this.selectedCategories.includes(category)) {
                return null;
            }

            if (this.isPointAnalyseActive) {
                return this.getContributionAnalyseStyle(feature);
            }

            return this.getContributionStyle(category, feature.get("isSelected"));
        },

        /**
         * Formats a given date string into a localized date format.
         * @param {String} date the given date.
         * @returns {String} The formatted date string.
         */
        getDate (date) {
            return dayjs(date).format("DD.MM.YYYY");
        },

        /**
         * Calculates the thresholds for classifying voting results into three equal intervals.
         * Converts negative values to positive (absolute) values before calculation.
         * @returns {Number[]} Array with interval boundaries [min, threshold1, threshold2, max].
         */
        getVotingClassificationThresholds () {
            const values = this.computedContributions.map(c => Math.abs(c.votingResultValue)),
                  min = Math.min(...values),
                  max = Math.max(...values),
                  range = max - min,
                  intervalSize = Math.ceil(range / 3),
                  threshold1 = min + intervalSize,
                  threshold2 = min + 2 * intervalSize;

            return [min, threshold1, threshold2, threshold1 + threshold2];
        },

        /**
         * Determines the voting result type based on pro and contra votes.
         * @param {Number} votingPro - The number of positive votes.
         * @param {Number} votingContra - The number of negative votes.
         * @returns {String} The voting result type key ('positiv', 'negativ', 'balanced', or 'noVoting').
         */
        getVotingResultType (votingPro, votingContra) {
            if (votingPro > votingContra) {
                return "positiv";
            }
            if (votingPro < votingContra) {
                return "negativ";
            }
            if (votingPro === 0 && votingContra === 0) {
                return "noVoting";
            }
            return "balanced";
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
         * Handles the selection of a feature on the map and updates the opened panel accordingly.
         * @param {ol/interaction/SelectEvent} evt - The event triggered by selecting a feature on the map.
         * @returns {void}
         */
        handleMapSelect (evt) {
            const selectedFeature = evt.selected?.[0];

            if (!selectedFeature) {
                return;
            }

            const id = selectedFeature.get("id"),
                  index = this.computedContributions.findIndex(item => item.id === id);

            if (index >= this.visibleCount) {
                this.visibleCount = index + this.pageSize;
            }

            this.openedPanel = index;
            this.scrollToContributionPanel(`contribution-panel-${id}`);
        },

        /**
         * Scrolls the view to a specific contribution panel based on its ID.
         * @param {String} id - The ID of the contribution panel to scroll to.
         * @returns {void}
         */
        scrollToContributionPanel (id) {
            this.$nextTick(() => {
                const element = document.getElementById(id);

                if (element) {
                    element.scrollIntoView({behavior: "instant"});
                }
            });
        },

        /**
         * Sets the isSelected attribute of a feature
         * @param {ol/CollectionEvent} evt - Openlayers collection event object.
         */
        setFeatureIsSelected (evt) {
            if (evt.type === "add") {
                evt.element.set("isSelected", true);
            }
            else {
                evt.element.set("isSelected", false);
            }
        },

        /**
         * Toggles the state of the point analysis, enabling or disabling it based on its current state.
         * @returns {void}
         */
        toggleIsPointAnalyseActive () {
            this.isPointAnalyseActive = !this.isPointAnalyseActive;
        },

        /**
         * Updates the list of selected categories based on the provided tags.
         * @param {Object[]} tag the selected tags.
         * @returns {void}
         */
        updateCategory (tag) {
            this.select.getFeatures().clear();
            this.selectedCategories = tag.map(v => v.label);
            this.openedPanel = undefined;
            this.updateContributions();

            this.contributionsLayer.getSource().changed();
        },

        /**
         * Updates the style of a contribution feature on the map.
         * @param {Object} item - The contribution item used to identify the feature and its category.
         * @param {Boolean} isSelected - Indicates whether the highlighted style should be applied.
         * @returns {void}
         */
        updateHoverFeatureCollection (item, isSelected = false) {
            const features = this.contributionsLayer.getSource().getFeatures(),
                  foundFeature = features.find(feature => feature.get("id") === item.id);

            if (!foundFeature) {
                return;
            }

            if (isSelected) {
                this.hover.getFeatures().push(foundFeature);
            }
            else {
                this.hover.getFeatures().remove(foundFeature);
            }
        }
    }
};
</script>

<template>
    <div id="contributions">
        <div class="d-flex justify-content-between align-items-start ps-7">
            <h4>
                {{ $t('additional:modules.tools.cosi.dipasProjects.contributionsHeadline') }}
            </h4>
            <FlatButton
                class="btn btn-sm"
                icon="bi bi-chevron-left"
                :text="$t('additional:modules.tools.cosi.dipasProjects.backToProjects')"
                @click="() => $emit('back')"
            />
        </div>
        <h5 class="project-title px-4 pt-3">
            {{ project.title }}
        </h5>
        <span class="project-date px-4">
            {{ project.dateRange }}
        </span>
        <div class="text-wrapper px-4 py-3">
            <div
                :class="['expand-content', { 'is-collapsed': !isProjectExpanded }]"
            >
                <div
                    class="text-start"
                    v-html="project.description"
                />
            </div>
            <button
                class="btn btn-link p-0 mt-1 text-decoration-none"
                @click="isProjectExpanded = !isProjectExpanded"
            >
                {{ isProjectExpanded ? 'Schließen' : 'Weiterlesen...' }}
            </button>
        </div>
        <DipasProjectsContributionsAnalyse
            :is-point-analyse-active="isPointAnalyseActive"
            :selected-categories="selectedCategories"
            @toggle:is-point-analyse-active="toggleIsPointAnalyseActive"
        />
        <TagGroup
            class="my-4 ps-3"
            :items="categoryTags"
            :multiple="true"
            :label="$t('additional:modules.tools.cosi.dipasProjects.categories')"
            @update:selected-items="updateCategory"
        />
        <AlertMessage
            v-if="computedContributions.length === 0"
            :text="$t('additional:modules.tools.cosi.dipasProjects.noContributions')"
            type="noData"
        />
        <div
            class="cont-wrapper pt-3"
        >
            <span class="ps-3">
                {{ $t('additional:modules.tools.cosi.dipasProjects.numberOfContribution', { count: computedContributions.length }) }}
            </span>
            <v-expansion-panels
                v-model="openedPanel"
                variant="accordion"
                flat
                class="custom-panels"
            >
                <v-expansion-panel
                    v-for="i in visibleContributions"
                    :id="`contribution-panel-${i.id}`"
                    :key="i.id"
                    @mouseover="updateHoverFeatureCollection(i, true)"
                    @focus="updateHoverFeatureCollection(i, true)"
                    @mouseleave="updateHoverFeatureCollection(i, false)"
                    @blur="updateHoverFeatureCollection(i, false)"
                >
                    <v-expansion-panel-title>
                        <hr>
                        <div class="d-flex justify-space-between align-center w-100">
                            <div class="d-flex align-center text-start">
                                <template v-if="isPointAnalyseActive">
                                    <div class="d-flex flex-column align-items-center me-3">
                                        <i
                                            :class="[
                                                i.icon,
                                                'rounded-circle fs-5 p-2 mb-1',
                                                { 'text-white': ['positiv', 'negativ'].includes(i.votingResult) }
                                            ]"
                                            :style="{
                                                background: i.color,
                                                color: ['positiv', 'negativ'].includes(i.votingResult) ? undefined : i.color
                                            }"
                                        />
                                        <span v-if="['positiv', 'negativ'].includes(i.votingResult)">
                                            {{ i.votingResultValue }}
                                        </span>
                                    </div>
                                </template>
                                <template v-else>
                                    <span
                                        class="d-inline-block rounded-circle me-3 legend-icon-size legend-icon-border"
                                        :style="{ background: categoryColors[i.category] }"
                                    />
                                </template>

                                <div class="d-flex flex-column">
                                    <h6 class="mb-0">
                                        {{ i.title }}
                                    </h6>
                                    <small class="pt-1 text-muted">
                                        {{ $t('additional:modules.tools.cosi.dipasProjects.created') }} {{ getDate(i.dateCreated) }}
                                    </small>
                                </div>
                            </div>
                            <div class="text-end mx-2">
                                <Badges
                                    class="mb-2 mt-1"
                                    :color="isPointAnalyseActive ? undefined : '#FFFFFF'"
                                    :text="i.category"
                                    :background-color="isPointAnalyseActive ? '#e3e3e3' : categoryColors[i.category]"
                                />
                            </div>
                        </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div class="d-flex justify-content-between align-items-start mb-3 ps-7">
                            <div class="d-flex flex-column">
                                <small
                                    class="type"
                                >
                                    {{ $t('additional:modules.tools.cosi.dipasProjects.contributionType') }}
                                </small>
                                <small>
                                    {{ i.contributionType }}
                                </small>
                            </div>
                            <FlatButton
                                class="btn btn-sm btn-light py-0 px-2"
                                icon="bi bi-link-45deg"
                                :text="$t('additional:modules.tools.cosi.dipasProjects.viewOriginalPost')"
                                @click="handleLinkClick(i.link)"
                            />
                        </div>
                        <p class="ps-7">
                            {{ i.contributionContent }}
                        </p>
                        <div class="d-flex align-items-center gap-2 pt-4 ps-7">
                            <i
                                class="bi bi-chat-square-text"
                                aria-hidden="true"
                            />
                            <p class="mb-0 me-3">
                                <span class="visually-hidden">
                                    {{ $t('additional:modules.tools.cosi.dipasProjects.numberOfComments') }}
                                </span>
                                {{ i.commentsNumber }}
                            </p>

                            <i
                                class="bi bi-hand-thumbs-up"
                                aria-hidden="true"
                            />
                            <p class="mb-0 me-3">
                                <span class="visually-hidden">
                                    {{ $t('additional:modules.tools.cosi.dipasProjects.positiveVotes') }}
                                </span>
                                {{ i.votingPro }}
                            </p>

                            <i
                                class="bi bi-hand-thumbs-down"
                                aria-hidden="true"
                            />
                            <p class="mb-0">
                                <span class="visually-hidden">
                                    {{ $t('additional:modules.tools.cosi.dipasProjects.negativeVotes') }}
                                </span>
                                {{ i.votingContra }}
                            </p>
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
            <div
                v-if="visibleCount < computedContributions.length"
                ref="loadMoreSentinel"
            />
        </div>
        <div class="d-flex justify-content-center my-4 pt-3">
            <FlatButton
                class="btn btn-sm"
                icon="bi bi-chevron-left"
                :text="$t('additional:modules.tools.cosi.dipasProjects.backToProjects')"
                @click="() => $emit('back')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .legend-icon-border {
        border-width: 1px;
        border-color: #000 !important;
        border-style: solid;
    }
    .legend-icon-size {
        width: 24px;
        height: 24px;
    }
    h6 {
        color: $secondary;
        font-family: $font_family_accent;
    }
    .type {
        color: $dark-grey;
        font-family: $font_family_accent;
    }
    .project-title {
        color: $secondary;
        font-family: $font_family_accent;
    }
    .project-date {
        color: $secondary;
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
    :deep(.v-expansion-panel) {
        border-radius: 0;
        background-color: transparent;

        &:not(:first-child) {
            border-top: 1px solid rgba(0, 0, 0, 0.12);
        }
        &::before {
            display: none;
        }
    }
</style>
