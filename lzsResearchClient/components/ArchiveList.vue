<script>
import {mapGetters} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import Multiselect from "vue-multiselect";
import TabResultTable from "./TabResultTable.vue";
import {getTranslationForAttribute} from "../utils/translationHelpers";

export default {
    name: "ArchiveList",
    components: {
        AccordionItem,
        FlatButton,
        Multiselect,
        SwitchInput,
        TabResultTable
    },
    props: {
        datasets: {
            type: Array,
            required: true
        },
        idPrefix: {
            type: String,
            required: true
        },
        showTableButtons: {
            type: Object,
            required: true
        },
        showGroupBySelect: {
            type: Boolean,
            required: false,
            default: false
        },
        additionalHeaders: {
            type: Array,
            required: false,
            default: () => []
        },
        numberOfResultsLabel: {
            type: String,
            required: false,
            default: ""
        }
    },
    emits: ["openDetails"],
    data () {
        return {
            groupByReRenderKey: 0,
            openAllAccordions: true,
            geomIsShownBy: null,
            groupedResultsForAllSteps: {},
            groupBySelections: {}
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "getNameForArchiveId",
            "archiveHasGeoref"
        ]),
        /**
         * Computes a list of unique archive IDs from the datasets and determines the attribute to group by for each archive.
         * Each returned object contains the archiveId and the name of the attribute used for grouping.
         * @returns {Array<{archiveId: string, attributeToGroupBy: string, attributeCount: number}>} - Array of objects with archiveId, attributeToGroupBy and attributeCount.
         */
        archives () {
            const archiveIds = [...new Set(this.datasets.map(result => {
                    return result.archiveId;
                }))],
                result = archiveIds.map(val => {
                    const attributes = this.datasets.find(attr => attr.archiveId === val).attributes;

                    return {
                        archiveId: val,
                        attributeToGroupBy: this.groupBySelections?.[val] || attributes[0].name || attributes[0].id,
                        attributeCount: attributes.length
                    };
                });

            this.groupResultsForAllSteps(result);
            return result;
        },
        /**
         * Counts the number of datasets currently in the list.
         * @returns {Number} - Count of dataset objects
         */
        numberOfResults () {
            return this.datasets.length;
        },
        /**
         * Gets the text for the button to toggle the accordion items. Depending on the current toggle state.
         * @returns {String} - Button text
         */
        toggleAccordionText () {
            return this.openAllAccordions
                ? this.$t("additional:modules.lzsResearchClient.tabs.archiveList.toggleAccordions.closeAll")
                : this.$t("additional:modules.lzsResearchClient.tabs.archiveList.toggleAccordions.openAll");
        },
        /**
         * For each archive returns whether every dataset of that archive has its checked state set in the store.
         * @returns {Boolean[]} - Array of booleans, one per archive.
         */
        checkedArchives () {
            return this.archives.map((archive) => {
                const datasetsForArchive = this.datasets.filter(d => d.archiveId === archive.archiveId);

                return datasetsForArchive.length > 0 && datasetsForArchive.every(d => d.checked);
            });
        },
        /**
         * True when every archive is fully checked.
         * @returns {Boolean} - Whether all tables across all archives are fully checked.
         */
        selectAllIsChecked () {
            return this.checkedArchives.length > 0 && this.checkedArchives.every(Boolean);
        }
    },
    methods: {
        /**
         * Returns a sorted list of unique group values for a given archive.
         * The grouping is based on the attribute specified in archiveData.attributeToGroupBy.
         * @param {Object} archiveData - An object containing archiveId and attributeToGroupBy.
         * @returns {Array<string|number>} - Sorted array of unique group values for the archive.
         */
        groupsForArchive (archiveData) {
            const resultsForArchiveId = this.datasets.filter((archive) => {
                    return archive.archiveId === archiveData.archiveId;
                }),
                groupList = [...new Set(resultsForArchiveId.map(result => {
                    const groupByObj = result?.attributes?.find(attr => attr.name === archiveData.attributeToGroupBy || attr.id === archiveData.attributeToGroupBy),
                        groupByValue = groupByObj ? groupByObj.value : "";

                    return groupByValue;
                }))];

            return groupList.sort((a, b) => {
                return Number(a) - Number(b);
            });
        },
        /**
         * Returns all datasets for a given archive and group value.
         * Filters the datasets by archiveId and the value of the attribute specified in archiveData.attributeToGroupBy.
         * Removes the groupBy-attribute from the attributes list.
         * @param {Object} archiveData - An object containing archiveId and attributeToGroupBy.
         * @param {String|Number|null} groupByValue - The value to filter the group by, use null to get all results.
         * @returns {Object[]} - Array of dataset objects matching the group value.
         */
        resultsForGroupsForArchive (archiveData, groupByValue = null) {
            const resultsForArchiveId = JSON.parse(JSON.stringify(this.datasets.filter((archive) => {
                    return archive.archiveId === archiveData.archiveId;
                }))),
                resultsForGroup = groupByValue
                    ? resultsForArchiveId.filter((dataset) => {
                        const groupByObj = dataset.attributes.find(attr => attr.name === archiveData.attributeToGroupBy || attr.id === archiveData.attributeToGroupBy);

                        return groupByObj && groupByObj.value === groupByValue;
                    }).map((dataset) => {
                        const attributeIndexToDelete = dataset.attributes.findIndex(attr => attr.name === archiveData.attributeToGroupBy || attr.id === archiveData.attributeToGroupBy);

                        dataset.attributes.splice(attributeIndexToDelete, 1);

                        return dataset;
                    })
                    : resultsForArchiveId;

            return resultsForGroup.sort((a, b) => {
                return Number(a.attributes[0]?.value) - Number(b.attributes[0]?.value);
            });
        },
        /**
         * Groups the results for all steps by the specified attribute and stores them in groupedResultsForAllSteps.
         * The grouped results are stored in an object where each key is the index of the archive and the value is either an object of groups or an array of datasets.
         * @param {Array} [archives=this.archives] - The archives to group.
         * @returns {void}
         */
        groupResultsForAllSteps (archives = this.archives) {
            const results = {};

            archives.forEach((step, index) => {
                results[index] = {};

                if (step.attributeCount > 1) {
                    const groups = this.groupsForArchive(step);

                    groups.forEach((group) => {
                        results[index][group] = this.resultsForGroupsForArchive(step, group);
                    });
                }
                else {
                    results[index] = this.resultsForGroupsForArchive(step);
                }
            });

            this.groupedResultsForAllSteps = results;
        },
        /**
         * Returns the table headers for the result table.
         * Removes groupValue attributes, if given, because the groupValue is already set on the header of the accordion item.
         * Appends the default position header and any additional headers passed in via the prop.
         * @param {Object} step - An object containing archiveId and attributeToGroupBy.
         * @param {String|Number|null} groupValue - The value to filter the group by, use null to get all results.
         * @returns {String[]} - Array of strings to be used as table headers.
         */
        getTableHeaders (step, groupValue = null) {
            let headers = this.resultsForGroupsForArchive(step, groupValue)[0].attributes.map(a => getTranslationForAttribute(`additional:modules.lzsResearchClient.tabs.tabSearch.${a.name.toLowerCase()}`, a.id));

            if (groupValue) {
                headers = headers.filter(a => a !== step.attributeToGroupBy);
            }

            this.additionalHeaders.forEach((header) => {
                headers.push(header);
            });

            return headers;
        },
        /**
         * Returns all attributes available in this archive to be shown in the "group by" dropdown.
         * @param {Object} archiveData - An object containing archiveId and attributeCount.
         * @returns {String[]} - Array of attribute names to be used as values in the dropdown.
         */
        getAttributesToGroupBy (archiveData) {
            if (archiveData.attributeCount <= 1) {
                return [];
            }

            return this.datasets.find(attr => attr.archiveId === archiveData.archiveId).attributes.map((attribute) => {
                return attribute.name || attribute.id;
            });
        },
        /**
         * Returns the ref name used for the table at the given indices.
         * @param {Number} index - The archive index.
         * @param {Number|null} groupIndex - The group index, or null when the archive is not grouped.
         * @returns {String} - The ref name.
         */
        tableRefName (index, groupIndex = null) {
            return groupIndex === null
                ? `${this.idPrefix}-table-${index}`
                : `${this.idPrefix}-table-${index}-${groupIndex}`;
        },
        /**
         * Hides geometry indicators on all result tables except an optional table to skip,
         * and optionally remove the geometry layer from the map for all tables.
         *
         * Iterates over child refs that start with "result-table-" and calls clearGeomIndicators()
         * on each table component except the one specified by tableToSkip. If tableToSkip is null,
         * also calls clearGeom() on each table to remove the geometry layer from the map.
         *
         * @param {String|null} tableToSkip - Ref name of the table to skip (e.g. "result-table-0-1"), or null to affect all tables.
         * @returns {void}
         */
        clearGeomAndGeomIndicators (tableToSkip = null) {
            this.geomIsShownBy = tableToSkip;

            const tableRefPrefix = `${this.idPrefix}-table-`;

            Object.keys(this.$refs).forEach((refTable) => {
                if (this.$refs[refTable] && typeof this.$refs[refTable] === "object") {
                    if (refTable.startsWith(tableRefPrefix) && refTable !== tableToSkip) {
                        this.$refs[refTable][0]?.clearGeomIndicators();
                    }

                    if (tableToSkip === null) {
                        this.$refs[refTable][0]?.clearGeom();
                    }
                }
            });
        },
        /** Toggles the checked state of all datasets in all tables.
         * @param {Boolean} changeTo - Is the new checked value for the SelectAll-Switch.
         */
        toggleAllTables (changeTo) {
            const tableRefPrefix = `${this.idPrefix}-table-`;

            Object.keys(this.$refs).forEach((refTable) => {
                if (refTable.startsWith(tableRefPrefix)) {
                    this.$refs[refTable]?.[0]?.toggleAllRows(changeTo);
                }
            });
        },
        /** Toggles the checked state of all datasets in a specific archive.
         * @param {Number} index - The index of the archive to toggle.
         * @param {Boolean} changeTo - Is the new checked value for this archive.
         */
        toggleAllTablesInArchive (index, changeTo) {
            const tableRefPrefix = `${this.idPrefix}-table-${index}`;

            Object.keys(this.$refs).forEach((refTable) => {
                if (refTable.startsWith(tableRefPrefix)) {
                    this.$refs[refTable]?.[0]?.toggleAllRows(changeTo);
                }
            });
        },
        /**
         * Called after selecting a new option to group the tables by.
         * Updates the render key to rerender the tables and removes geometry and geometry indicators from map and table.
         * @param {Number} index - The archive index whose grouping changed.
         * @returns {void}
         */
        changeGroupBy (index) {
            this.groupBySelections[this.archives[index].archiveId] = this.archives[index].attributeToGroupBy;
            this.groupByReRenderKey++;

            const tableRefPrefix = `${this.idPrefix}-table-${index}`;

            if (this.geomIsShownBy?.startsWith(tableRefPrefix)) {
                Object.keys(this.$refs).forEach((refTable) => {
                    if (
                        this.$refs[refTable] &&
                        typeof this.$refs[refTable] === "object" &&
                        refTable.startsWith(tableRefPrefix)
                    ) {
                        this.$refs[refTable][0]?.clearGeomIndicators();
                        this.$refs[refTable][0]?.clearGeom();
                    }
                });
            }
            this.groupResultsForAllSteps();
        },
        /**
         * Passes the openDetails event from the TabResultTable up to the parent.
         * @param {String} datasetInstanceId - the instance id of the dataset to show details for
         * @returns {void}
         */
        onOpenDetails (datasetInstanceId) {
            this.$emit("openDetails", datasetInstanceId);
        }
    }
};
</script>

<template>
    <div class="ArchiveList">
        <div class="archiveListHeaderLine">
            <p class="numberOfResults">
                {{ numberOfResultsLabel }}
                <span>{{ numberOfResults }}</span>
            </p>
            <FlatButton
                id="idOpenOrCloseAccordions"
                :aria="toggleAccordionText"
                :text="toggleAccordionText"
                :secondary="true"
                @click="openAllAccordions = !openAllAccordions"
            />
        </div>
        <div class="switch-container">
            <SwitchInput
                v-if="numberOfResults > 0"
                id="idSelectAllSwitch"
                :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.selectAll')"
                :label="$t('additional:modules.lzsResearchClient.tabs.archiveList.selectAll')"
                :checked="selectAllIsChecked"
                :interaction="(evt) => toggleAllTables(evt.target.checked)"
            />
        </div>

        <div class="steps">
            <div
                v-for="(step, index) in archives"
                :key="index"
                :class="`${archives.length > 1 ? 'accordion-container' : ''}`"
            >
                <input
                    v-if="archives.length > 1"
                    :id="`archive-checkbox-${index}`"
                    class="archive-checkbox-input"
                    type="checkbox"
                    :checked="checkedArchives[index]"
                    @change="(evt) => toggleAllTablesInArchive(index, evt.target.checked)"
                >
                <AccordionItem
                    :id="`${idPrefix}-item-${index}`"
                    class="archive-step"
                    :title="getNameForArchiveId(step.archiveId)"
                    :is-open="openAllAccordions"
                    :coloured-header="true"
                >
                    <!-- if the archive results have more than 1 attribute, group by the first one or the one selected in the dropdown -->
                    <div v-if="step.attributeCount > 1">
                        <div
                            v-if="showGroupBySelect"
                            class="groupBySelectContainer"
                        >
                            <label
                                class="input-label"
                                :for="`group-by-select-${index}`"
                            >
                                {{ $t("additional:modules.lzsResearchClient.tabs.archiveList.groupByLabel") }}
                            </label>

                            <div class="attribute-select">
                                <Multiselect
                                    :id="`group-by-select-${index}`"
                                    v-model="step.attributeToGroupBy"
                                    :aria-label="$t('additional:modules.lzsResearchClient.tabs.archiveList.selectOptionLabel')"
                                    :options="getAttributesToGroupBy(step)"
                                    name="select-box"
                                    :multiple="false"
                                    :placeholder="$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${step.attributeToGroupBy.toLowerCase()}`)"
                                    :show-labels="false"
                                    open-direction="bottom"
                                    :hide-selected="false"
                                    :allow-empty="false"
                                    :close-on-select="true"
                                    :clear-on-select="false"
                                    :internal-search="false"
                                    @select="changeGroupBy(index)"
                                >
                                    <template #singleLabel="props">
                                        <span>{{ $t(`additional:modules.lzsResearchClient.tabs.tabSearch.${props.option.toLowerCase()}`) }}</span>
                                    </template>
                                    <template #option="props">
                                        <div class="attribute-option-wrapper">
                                            <span :class="`attribute-check-icon ${props.option === step.attributeToGroupBy ? 'bi bi-check2' : ''}`" />
                                            <span>{{ $t(`additional:modules.lzsResearchClient.tabs.tabSearch.${props.option.toLowerCase()}`) }}</span>
                                        </div>
                                    </template>
                                </Multiselect>
                            </div>
                        </div>

                        <AccordionItem
                            v-for="(groupValue, groupIndex) in groupsForArchive(step)"
                            :id="`${idPrefix}-group-item-${index}-${groupIndex}`"
                            :key="groupIndex + groupByReRenderKey"
                            class="group-step"
                            :title="$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${step.attributeToGroupBy.toLowerCase()}`) + ' ' + groupValue"
                            :is-open="openAllAccordions"
                            :coloured-header="true"
                        >
                            <TabResultTable
                                :ref="tableRefName(index, groupIndex)"
                                :table-index="tableRefName(index, groupIndex)"
                                :table-header="getTableHeaders(step, groupValue)"
                                :table-datasets="groupedResultsForAllSteps[index][groupValue] || []"
                                :has-geo-ref="archiveHasGeoref(step.archiveId)"
                                :show-buttons="showTableButtons"
                                @openDetails="onOpenDetails"
                                @clearOtherGeom="clearGeomAndGeomIndicators(tableRefName(index, groupIndex))"
                            />
                        </AccordionItem>
                    </div>

                    <div v-else>
                        <TabResultTable
                            :ref="tableRefName(index)"
                            :table-index="tableRefName(index)"
                            :table-header="getTableHeaders(step)"
                            :table-datasets="groupedResultsForAllSteps[index] || []"
                            :has-geo-ref="archiveHasGeoref(step.archiveId)"
                            :show-buttons="showTableButtons"
                            @openDetails="onOpenDetails"
                            @clearOtherGeom="clearGeomAndGeomIndicators(tableRefName(index))"
                        />
                    </div>
                </AccordionItem>
            </div>
        </div>
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>

.ArchiveList {
    div.archiveListHeaderLine {
        display: flex;
        gap: 1rem;
        justify-content: space-between;

        p.numberOfResults {
            margin-top: 1rem;

            span {
                display: inline-block;
                padding: 0.1rem 1rem;
                border: 2px solid $secondary;
                border-radius: 999px;
                background: #fff;
                font-weight: bold;
                margin-left: 1rem;
            }
        }

        :deep(button#idOpenOrCloseAccordions) {
            padding-right: 0;
            padding-left: 0;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            min-height: unset;

            span {
                margin-right: 0.5rem;
            }
        }
    }

    div.switch-container {
        margin-bottom: 0.5rem;
    }

    div.accordion-container {
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 1rem;

        input.archive-checkbox-input {
            margin-top: calc(0.5rem + 18px);
            width: 16.5px;
            height: 16.5px;
        }
    }

    div.groupBySelectContainer {
        display: flex;
        flex-direction: column;

        .attribute-select {
            margin: 0.5rem 0;

            .attribute-option-wrapper {
                display: flex;
                flex-direction: row;
                gap: 0.5rem;

                .attribute-check-icon {
                    width: 16px;
                }
            }
        }
    }

    :deep(div.archive-step) {
        width: 100%;

        div.accordion-body {
            padding-left: 0;
            padding-right: 0;
        }
    }

    :deep(div.group-step) {
        button.accordion-button {
            border-bottom: solid 1px $light_blue;
            background-color: lighten($light_blue, 5%);
            padding: 0.5rem 1rem;
            font-size: 1rem;
            margin-top: 0.5rem;
        }
    }
}
</style>

