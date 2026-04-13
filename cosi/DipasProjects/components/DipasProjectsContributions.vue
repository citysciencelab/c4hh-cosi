<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import Badges from "../../shared/modules/badges/components/Badges.vue";
import dayjs from "dayjs";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import {VExpansionPanels, VExpansionPanel, VExpansionPanelTitle, VExpansionPanelText} from "vuetify/components/VExpansionPanel";

export default {
    name: "DipasProjectsContributions",
    components: {
        AlertMessage,
        Badges,
        FlatButton,
        TagGroup,
        VExpansionPanels,
        VExpansionPanel,
        VExpansionPanelTitle,
        VExpansionPanelText
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
            isProjectExpanded: false,
            selectedCategories: this.project.categories,
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
            openedPanel: undefined
        };
    },
    computed: {
        /**
         * Filters the project contributions based on the selected categories.
         * @returns {Object[]} An array of filtered contribution property objects.
         */
        contributions () {
            const contributions = this.items.map(feature => feature.getProperties());

            return contributions.filter(k => this.selectedCategories.includes(k.category));
        },
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
                color: this.categoryColors[cat]
            }));
        }
    },
    mounted () {
        const element = document.getElementById("contributions");

        if (element) {
            element.scrollIntoView({behavior: "instant"});
        }
    },
    methods: {
        /**
         * Updates the list of selected categories based on the provided tags.
         * @param {Object[]} tag the selected tags.
         * @returns {void}
         */
        updateCategory (tag) {
            this.selectedCategories = tag.map(v => v.label);
            this.openedPanel = undefined;
        },
        /**
         * Updates the list of selected categories based on the provided tags.
         * @param {String} category the name of the category.
         * @returns {String} The color from the category mapping.
         */
        getCategoryColor (category) {
            return this.categoryColors[category];
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
         * Opens a given URL in a new browser tab.
         * @param {String} url - the web address to be opened.
         * @returns {void}
         */
        handleLinkClick (url) {
            if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
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
                class="btn btn-sm small"
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
        <TagGroup
            class="my-4 ps-3"
            :items="categoryTags"
            :multiple="true"
            :label="$t('additional:modules.tools.cosi.dipasProjects.categories')"
            @update:selected-items="updateCategory"
        />
        <AlertMessage
            v-if="contributions.length === 0"
            :text="$t('additional:modules.tools.cosi.dipasProjects.noContributions')"
            type="noData"
        />
        <div
            class="cont-wrapper pt-3"
        >
            <span class="ps-3">
                {{ $t('additional:modules.tools.cosi.dipasProjects.numberOfContribution', { count: contributions.length }) }}
            </span>
            <v-expansion-panels
                v-model="openedPanel"
                variant="accordion"
                flat
                class="custom-panels"
            >
                <v-expansion-panel
                    v-for="i in contributions"
                    :key="i.id"
                >
                    <v-expansion-panel-title>
                        <hr>
                        <div class="d-flex justify-space-between align-center w-100">
                            <div class="d-flex align-center text-start">
                                <i
                                    class="bi bi-circle-fill me-3 category-icon"
                                    :style="{ color: getCategoryColor(i.category) }"
                                />

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
                                    :color="'#FFFFFF'"
                                    :text="i.category"
                                    :background-color="getCategoryColor(i.category)"
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
                                class="btn btn-sm btn-light py-0 px-2 small"
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
        </div>
        <div class="d-flex justify-content-center my-4 pt-3">
            <FlatButton
                class="btn btn-sm small"
                icon="bi bi-chevron-left"
                :text="$t('additional:modules.tools.cosi.dipasProjects.backToProjects')"
                @click="() => $emit('back')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    h6 {
        color: $secondary;
        font-family: $font_family_accent;
    }
    .category-icon {
        font-size: 1.4rem;
        display: inline-flex;
        align-self: center;
        vertical-align: middle;
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
