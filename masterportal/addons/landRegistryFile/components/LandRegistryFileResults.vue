<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import TableComponent from "./shared/TableComponent.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {isWebLink} from "@shared/js/utils/urlHelper.js";
import {openSecuredPopup} from "@shared/js/utils/openSecuredPopup";
import PaginationControl from "@shared/modules/pagination/components/PaginationControl.vue";
import DropdownSelect from "@shared/modules/dropdown/components/DropdownSelect.vue";

export default {
    name: "LandRegistryFileResults",
    components: {
        TableComponent,
        IconButton,
        SwitchInput,
        PaginationControl,
        DropdownSelect
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            showMoreFields: false,
            scrollPending: false,
            currentDatasetsPerPage: 10,
            datasetsPerPage: [10, 25, 50],
            currentPage: 1
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "selectedDetailFeatureId",
            "tableFields",
            "oafSchema",
            "sorting",
            "getSortedFeatures",
            "showLoadingSpinner",
            "mapFeaturesSelected"
        ]),
        ...mapGetters("Menu", [
            "expanded"
        ]),
        /**
         * Prepares the data structure for the table component, including headers and items.
         * @returns {Object} - An object containing headers and items for the table.
         */
        tableData () {
            const headers = [
                ...this.tableFields
                    .filter((field) => this.showMoreFields || field.showAlways)
                    .map((field, index) => ({
                        name: field.name,
                        displayName: this.oafSchema?.properties?.[field.name]?.title || field.name,
                        index
                    })),
                {
                    name: "actions",
                    displayName: this.$t("additional:modules.landRegistryFile.tabs.tabResults.actionsHeader"),
                    index: this.tableFields.length
                }
            ];

            const reorderedFeatures = this.getSortedFeatures || [];
            const startIndex = (this.currentPage - 1) * this.currentDatasetsPerPage;
            const items = reorderedFeatures.map(feature => ({
                ...feature.properties,
                id: feature.id
            })).slice(startIndex, startIndex + this.currentDatasetsPerPage);

            return {
                headers,
                items
            };
        },
        /**
         * Calculate the total number of pages to show in the paginator. Based on the total number of datasets and the number of datasets to display on one page
         * @returns {Number} total number of pages
         */
        totalNumberOfPages () {
            const addLastPage = this.getSortedFeatures.length % this.currentDatasetsPerPage > 0 ? 1 : 0;

            return Math.floor(this.getSortedFeatures.length / this.currentDatasetsPerPage) + addLastPage;
        },
        mapSelectedRowIds () {
            return (this.mapFeaturesSelected || []).map(f => f.getId());
        }
    },
    watch: {
        getSortedFeatures () {
            if (this.selectedDetailFeatureId) {
                this.updatePageToShowSelectedFeature(this.selectedDetailFeatureId);
            }
            else {
                this.currentPage = 1;
            }

            this.scrollPending = true;
            this.performPendingScroll();
        },
        showLoadingSpinner (isLoading) {
            if (!isLoading) {
                this.performPendingScroll();
            }
        },
        currentDatasetsPerPage () {
            this.currentPage = 1;
        }
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setSorting"
        ]),
        ...mapActions("Modules/LandRegistryFile", [
            "selectFeatureOnMap",
            "deselectFeatureOnMap"
        ]),
        ...mapActions("Maps", [
            "setCenter",
            "setZoom"
        ]),
        /**
         * Displays the position of the table row on the map.
         * @param {Object} row - The table row containing UTM coordinates.
         * @returns {void}
         */
        showMapPosition (row) {
            if (this.mapSelectedRowIds.includes(row.id)) {
                this.deselectFeatureOnMap({featureId: row.id});
                return;
            }

            this.selectFeatureOnMap({featureId: row.id, zoomToFeature: true});
        },
        /**
         * Selects the feature on the map and switches to the details tab.
         * @param {Object} row - The row object containing the feature ID.
         * @returns {void}
         */
        showDetails (row) {
            this.selectFeatureOnMap({featureId: row.id, zoomToFeature: true});
            this.setCurrentTab("tabDetails");
        },
        /**
         * Scrolls to the selected row or the top, but only if a scroll is pending and the table is visible.
         * @returns {void}
         */
        performPendingScroll () {
            this.$nextTick(() => {
                if (!this.scrollPending || this.$el.offsetParent === null) {
                    return;
                }
                this.scrollPending = false;

                if (this.selectedDetailFeatureId) {
                    this.scrollToSelectedDetail();
                }
                else {
                    this.scrollToTop();
                }
            });
        },
        /**
         * Scrolls the results table back to the top after new results are loaded.
         * @returns {void}
         */
        scrollToTop () {
            this.$nextTick(() => {
                this.$el
                    .querySelectorAll(".table-wrapper, .land-registry-table-scroll")
                    .forEach(el => el.scrollTo({top: 0, behavior: "smooth"}));
            });
        },
        /**
         * Scrolls the selected detail row into view after the the selected feature or the table sorting changes.
         * @returns {void}
         */
        scrollToSelectedDetail () {
            this.$nextTick(() => {
                const selectedButton = this.$el.querySelector(".map-selected-button"),
                      selectedRow = selectedButton?.closest("tr");

                selectedRow?.scrollIntoView({behavior: "smooth", block: "center"});
            });
        },
        /**
         * Opens the link to the record in ELDORADO by opening it in a new window
         * @returns {void}
         */
        goToEldorado (row) {
            if (row?.eldorado && isWebLink(row.eldorado)) {
                openSecuredPopup(row.eldorado, "_blank", "noopener,noreferrer");
            }
            else {
                console.warn("Der Datensatz hat keinen ELDORADO-Link");
            }
        },
        /**
         * Updates the current page.
         * @param {number} newPage - The page number to display.
         * @returns {void}
         */
        pageChange (newPage) {
            this.currentPage = newPage;
        },
        /**
         * Navigates to the page containing the feature with the given ID.
         * @param {string|number} featureId - The ID of the feature to display.
         * @returns {void}
         */
        updatePageToShowSelectedFeature (featureId) {
            const indexInSortedFeatures = (this.getSortedFeatures || []).findIndex((feature) => {
                      return feature.id === featureId;
                  }),
                  addOnePage = (indexInSortedFeatures + 1) % this.currentDatasetsPerPage > 0 ? 1 : 0,
                  updatedPage = Math.floor((indexInSortedFeatures + 1) / this.currentDatasetsPerPage) + addOnePage;

            if (indexInSortedFeatures === -1 || updatedPage < 1) {
                return;
            }

            this.pageChange(updatedPage);
        }
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileResults"
        class="InnerLayoutFrame"
    >
        <div
            v-if="tableData.items.length === 0"
            class="ScrollableContent"
        >
            <p class="no-results-message">
                {{ $t("additional:modules.landRegistryFile.tabs.tabResults.noResultsMessage") }}
            </p>
        </div>
        <div
            v-else
            class="ScrollableContent table-wrapper results-content"
        >
            <div class="table-info-wrapper">
                <div>
                    <span class="number-of-results-label">
                        {{ $t("additional:modules.landRegistryFile.tabs.tabResults.numberOfResults") }}
                    </span>
                    <span class="number-of-results">{{ getSortedFeatures.length }}</span>
                </div>

                <SwitchInput
                    id="idShowMoreFieldsSwitch"
                    class="showMoreFieldsSwitch"
                    name="showMoreFieldsSwitch"
                    :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.showMoreFieldsLabel')"
                    :label="$t('additional:modules.landRegistryFile.tabs.tabResults.showMoreFieldsLabel')"
                    :checked="showMoreFields"
                    :interaction="(evt) => showMoreFields = evt.target.checked"
                />
            </div>

            <TableComponent
                table-class="land-registry-table-scroll"
                :data="tableData"
                :sortable="true"
                :sorting="sorting"
                :manual-sorting="true"
                :selected-row-ids="mapSelectedRowIds"
                select-mode="row"
                @update:sorting="(newSorting) => setSorting(newSorting)"
            >
                <template #cell-actions="{ row }">
                    <div class="actions-wrapper">
                        <IconButton
                            v-if="row.eldorado"
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsOpenLink')"
                            icon="bi-folder-symlink"
                            :class-array="['action-button']"
                            @click.stop="goToEldorado(row)"
                        />
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowPosition')"
                            icon="bi-crosshair"
                            :class-array="['action-button', mapSelectedRowIds.includes(row.id) ?'map-selected-button' : '']"
                            @click.stop="showMapPosition(row)"
                        />
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowDetails')"
                            icon="bi-arrow-right-circle"
                            :class-array="['action-button']"
                            @click.stop="showDetails(row)"
                        />
                    </div>
                </template>
            </TableComponent>

            <div class="pagination-control-wrapper">
                <div class="spacer-div" />

                <PaginationControl
                    :current-page="currentPage"
                    :total-pages="totalNumberOfPages"
                    @page-change="pageChange"
                />

                <div class="spacer-div" />

                <div class="pagination-settings">
                    <label for="datasetsPerPage">
                        {{ $t("additional:modules.landRegistryFile.tabs.tabResults.datasetsPerPageLabel") }}
                    </label>
                    <DropdownSelect
                        id="datasetsPerPage"
                        v-model="currentDatasetsPerPage"
                        class="datasets-per-page-select"
                        :items="datasetsPerPage"
                        :menu-props="{contentClass: 'land-registry-file-results__menu mp-dropdown-menu'}"
                        label=""
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    :global(.land-registry-file-results__menu .v-list-item) {
        min-height: 2.25rem;
        align-items: center;
    }

    #LandRegistryFileResults{
        height: 100%;
        padding-top: 0.5rem;

        p.no-results-message {
            padding-top: 1rem;
            text-align: center;
        }

        div.table-wrapper {
            display: flex;
            gap: 0.25rem;

            div.table-info-wrapper {
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 1rem;
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;

                span.number-of-results-label {
                    margin-right: 0.5rem;
                }

                span.number-of-results {
                    display: inline-block;
                    padding: 0.1rem 0.6rem;
                    border: 2px solid $secondary;
                    border-radius: 999px;
                    background: #fff;
                    font-family: $font_family_accent;
                }

                :deep(.showMoreFieldsSwitch) {
                    display: flex;
                    align-items: center;
                    flex-direction: row-reverse;
                    margin-left: auto;
                    padding-left: 0;

                    .form-check-input {
                        margin-left: 0;
                    }

                    > * {
                        cursor: pointer;
                    }

                    .form-check-label {
                        text-align: right;
                    }
                }
            }

            :deep(div.fixed) {
                flex: 1;
            }

            div.actions-wrapper {
                display: flex;
                align-items: center;
                gap: 0.25rem;

                :deep(.action-button) {
                    width: 1.8rem;
                    height: 1.8rem;
                    z-index: 1;

                    &.map-selected-button {
                        background-color: #03ffff;
                    }

                    > i {
                        font-size: 1.35rem;
                    }
                }
            }

            :deep(table) {
                width: auto;
                table-layout: fixed;

                th.fixedWidth {
                    min-width: 70px;
                    height: 1rem;
                    text-align: left;
                    background-color: $secondary;
                    color: $white;
                    vertical-align: middle;

                    > div {
                        margin: 0 !important;
                        padding-right: 0.5rem;
                    }

                    .sortable-icon {
                        font-size: 0.75rem;
                    }

                    .th-style {
                        font-size: clamp(0.8rem, 1.2vw, 0.875rem);
                        white-space: normal;
                        line-height: 1rem;
                        margin: 0 !important;
                        padding: 0.75rem 0.2rem;
                        hyphens: auto;
                    }

                    &:first-child .th-style {
                        padding-left: 0.5rem;
                    }

                    &:last-child {
                        .th-style {
                            padding-right: 0.5rem;
                        }

                        .sortable-icon {
                            display: none;
                        }
                    }
                }

                td {
                    vertical-align: middle;
                    padding: 0.5rem 0.2rem;
                    word-break: normal;
                    hyphens: auto;

                    &:first-child {
                        padding-left: 0.5rem;
                    }

                    &:last-child {
                        padding-right: 0.5rem;
                    }

                    p {
                        margin: 0;
                    }
                }

                tbody tr:nth-of-type(even):not(.fixed-row):not(.fixed) > td {
                    background-color: rgba(0, 0, 0, 0.05);
                }
            }
        }

        div.pagination-control-wrapper {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;

            div.spacer-div {
                flex: 1;
            }

            :deep(.pagination-controls) {
                width: auto;
                flex: 0 0 auto;
            }

            .pagination-settings {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1 1 11.5rem;
                max-width: max-content;
                min-width: 0;

                label {
                    font-size: 13px;
                    font-weight: normal;
                    line-height: 17px;
                    color: #646262;
                    min-width: 0;
                    white-space: normal;
                    hyphens: auto;
                }

                .datasets-per-page-select {
                    flex: 0 0 auto;
                }

                :deep(.v-field__field) {
                    height: 2.25rem;
                    align-items: center;
                }
            }
        }
    }
</style>
