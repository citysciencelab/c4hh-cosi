<script>
import {mapGetters, mapActions} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import Multiselect from "vue-multiselect";
import TabResultTable from "./TabResultTable.vue";
import SumOfCheckedFiles from "./SumOfCheckedFiles.vue";
import {roundFileSizeToFixed, calcMetadataBytesForArchives, getHumanReadableFileSize} from "../utils/zipHelpers";
import {getTranslationForAttribute, capitalizeString} from "../utils/translationHelpers";

export default {
    name: "ArchiveList",
    components: {
        AccordionItem,
        FlatButton,
        Multiselect,
        SwitchInput,
        TabResultTable,
        SumOfCheckedFiles
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
            groupByRenderKeys: {},
            openAllAccordions: true,
            geomIsShownBy: null,
            groupedResultsForAllSteps: {},
            groupBySelections: {},
            sumOfCheckedFilesProgress: 0
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "getNameForArchiveId",
            "getDossierIdsForArchiveId",
            "archiveHasGeoref",
            "progressNow",
            "isFetchingPrimaryData"
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
        },
        /**
         * True when any dataset is checked.
         * @returns {Boolean} - Whether any of the datasets is checked.
         */
        somethingCheckedForDownload () {
            return this.datasets.some(data => data.checked);
        }
    },
    watch: {
        datasets: {
            handler () {
                this.groupResultsForAllSteps();
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "downloadSelectedFiles"
        ]),
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

            const sorted = resultsForGroup.sort((a, b) => {
                return Number(a.attributes[0]?.value) - Number(b.attributes[0]?.value);
            });

            const hasAnyPrimaryData = sorted.some(d => d.primaryData?.length);

            if (hasAnyPrimaryData) {
                sorted.forEach(dataset => {
                    const sizeValue = dataset.primaryData?.length && dataset.checked ? roundFileSizeToFixed(dataset.fileSizeBytes / 1e6, true) : "—";

                    dataset.attributes.push({name: "fileSizeMB", id: "fileSizeMB", value: sizeValue});
                });
            }

            return sorted;
        },
        /**
         * Groups the results for all steps by the specified attribute and stores them in groupedResultsForAllSteps.
         * The grouped results are stored in an object where each key is the index of the archive and the value is either an object of groups or an array of datasets.
         * @param {Array} [archives=this.archives] - The archives to group.
         * @param {Number|null} [onlyIndex=null] - If provided, only group the results for the archive at this index.
         * @returns {void}
         */
        groupResultsForAllSteps (archives = this.archives, onlyIndex = null) {
            const results = {...this.groupedResultsForAllSteps};

            archives.forEach((step, index) => {
                if (onlyIndex !== null && index !== onlyIndex) {
                    return;
                }

                if (step.attributeCount > 1) {
                    const groupedStep = {};

                    this.groupsForArchive(step).forEach((group) => {
                        groupedStep[group] = this.resultsForGroupsForArchive(step, group);
                    });
                    results[index] = groupedStep;
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
            let headers = this.resultsForGroupsForArchive(step, groupValue)[0].attributes
                .map(a => {
                    const key = `additional:modules.lzsResearchClient.tabs.tabSearch.${a.name.toLowerCase()}`;

                    return getTranslationForAttribute(key, capitalizeString(a.id));
                });

            if (groupValue) {
                headers = headers.filter(a => a !== step.attributeToGroupBy);
            }

            this.additionalHeaders.forEach((header) => {
                if (!this.archiveHasGeoref(step.archiveId) && header === this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.position")) {
                    return;
                }

                headers.push(header);
            });

            return headers;
        },
        /**
         * Returns a deep copy of the showTableButtons object
         *  set georef button to false if the archive has no georef
         * @param {Object} step - An object containing archiveId and attributeToGroupBy.
         * @returns {Object} - Information on which buttons shall be shown in the table
         */
        getTableButtons (step) {
            const localTableButtons = JSON.parse(JSON.stringify(this.showTableButtons));

            if (!this.archiveHasGeoref(step.archiveId)) {
                localTableButtons.georef = false;
            }

            return localTableButtons;
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
         * Clears the geometry indicator on the result table that previously showed the geometry,
         * and, if newGeomIsShownBy is null, removes the geometry layer from the map.
         * @param {String|null} newGeomIsShownBy - Ref name of the new geometry table (e.g. "result-table-0-1"), or null to affect the current table.
         * @returns {void}
         */
        clearGeomAndGeomIndicator (newGeomIsShownBy = null) {
            const previousGeomIsShownBy = this.geomIsShownBy;

            this.geomIsShownBy = newGeomIsShownBy;

            if (previousGeomIsShownBy !== newGeomIsShownBy) {
                this.$refs[previousGeomIsShownBy]?.[0]?.clearGeomIndicator();
            }

            if (newGeomIsShownBy === null) {
                this.$refs[previousGeomIsShownBy]?.[0]?.clearGeom();
            }
        },
        /**
         * Hides the geometry layer of the table that currently shows the geometry,
         * without clearing the indicator or the stored `geomIsShownBy` reference,
         * so it can be restored later via `showGeomAgain()`.
         * @returns {void}
         */
        hideGeom () {
            this.$refs[this.geomIsShownBy]?.[0]?.hideGeom();
        },
        /**
         * Shows the geometry layer on the map again for the table that previously showed it.
+         * @returns {void}
         */
        showGeomAgain () {
            const geomTableName = this.geomIsShownBy;
            const geomRef = this.$refs[geomTableName];

            geomRef?.[0]?.showGeomAgain();
        },
        /**
         * Hides the geometry layer if it does not belong to the given dataset. Used when arriving at the details tab.
         * @param {String} selectedDetail - The selected detail object containing instanceId and primaryDataId of the detail that is being shown.
         * @returns {void}
         */
        syncGeomToInstance (selectedDetail) {
            const geomTable = this.$refs[this.geomIsShownBy]?.[0];

            if (!geomTable) {
                return;
            }
            if (geomTable.currentlyShownGeorefId !== (selectedDetail.primaryDataId || selectedDetail.instanceId)) {
                geomTable.hideGeom();
            }
        },
        /** Toggles the checked state of all datasets in all tables.
         * @param {Boolean} changeTo - Is the new checked value for the SelectAll-Switch.
         * @returns {void}
         */
        async toggleAllTables (changeTo) {
            const tableRefPrefix = `${this.idPrefix}-table-`,
                  promises = [];

            Object.keys(this.$refs).forEach((refTable) => {
                if (refTable.startsWith(tableRefPrefix)) {
                    promises.push(this.$refs[refTable]?.[0]?.toggleAllRows(changeTo));
                }
            });

            await Promise.all(promises.filter(Boolean));
        },
        /** Toggles the checked state of all datasets in a specific archive.
         * @param {Number} index - The index of the archive to toggle.
         * @param {Boolean} changeTo - Is the new checked value for this archive.
         * @returns {void}
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
            this.groupByRenderKeys = {
                ...this.groupByRenderKeys,
                [index]: (this.groupByRenderKeys[index] || 0) + 1
            };

            const tableRefPrefix = `${this.idPrefix}-table-${index}`;

            if (this.geomIsShownBy?.startsWith(tableRefPrefix)) {
                Object.keys(this.$refs).forEach((refTable) => {
                    if (
                        this.$refs[refTable] &&
                        typeof this.$refs[refTable] === "object" &&
                        refTable.startsWith(tableRefPrefix)
                    ) {
                        this.$refs[refTable][0]?.clearGeomIndicator();
                        this.$refs[refTable][0]?.clearGeom();
                    }
                });
            }
            this.groupResultsForAllSteps(this.archives, index);
        },
        /**
         * Passes the openDetails event from the TabResultTable up to the parent.
         * @param {String} dataset - the dataset to show details for
         * @returns {void}
         */
        onOpenDetails (dataset) {
            this.$emit("openDetails", {instanceId: dataset.instanceId, primaryDataId: dataset.primaryDataId});
        },
        /**
         * Returns the translated label for an attribute key, falling back to the raw attribute name if no translation exists.
         * @param {String} key - The attribute key to translate.
         * @param {String} fallback - The raw attribute name to use if no translation is found.
         * @returns {String} The translated label or the fallback value.
         */
        getTranslationForAttributeWrapper (key, fallback) {
            return capitalizeString(getTranslationForAttribute(key, fallback));
        },
        /**
         * Returns the human-readable sum of file sizes for checked datasets belonging to a specific archive,
         * including the metadata overhead for that archive.
         * @param {String} archiveId - The archiveId to sum the checked file sizes for.
         * @returns {String} - Human-readable file size string (e.g. "12,3 MB").
         */
        sumOfCheckedFileSizesForArchive (archiveId) {
            const checkedForArchive = this.datasets.filter(d => d.archiveId === archiveId && d.checked && d.fileSizeBytes !== null && d.fileSizeBytes !== undefined);
            let sumOfFiles = 0;

            checkedForArchive.forEach(dataset => {
                sumOfFiles += dataset.fileSizeBytes ?? 0;
            });

            if (checkedForArchive.length === 0) {
                return null;
            }

            sumOfFiles += calcMetadataBytesForArchives([archiveId], this.getDossierIdsForArchiveId);

            return getHumanReadableFileSize(sumOfFiles);
        },
        /**
         * Returns a string indicating the sum of checked file sizes for a specific archive and step, formatted for display.
         * @param {String} archiveId - The archiveId to sum the checked file sizes for.
         * @returns {String} - Formatted string indicating the sum of checked file sizes, or an empty string if no files are checked.
         */
        archiveSumString (archiveId) {
            const sum = this.sumOfCheckedFileSizesForArchive(archiveId);

            if (!sum) {
                return "";
            }
            return ` - ${this.$t("additional:modules.lzsResearchClient.tabs.archiveList.selected", {sum: sum})}`;
        },
        /**
         * Starts the download for the files of all datasets that are checked in the tables.
         * @returns {void}
         */
        downloadChecked () {
            this.downloadSelectedFiles(this.datasets.filter(data => data.checked));
        }
    }
};
</script>

<template>
    <div
        id="ArchiveList"
        class="InnerLayoutFrame"
    >
        <div
            class="FixedContent top-header archive-list-header"
            padding-top="0"
        >
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
            <div class="downloadHandlingContainer">
                <SwitchInput
                    v-if="numberOfResults > 0"
                    id="idSelectAllSwitch"
                    class="selectAllSwitch"
                    :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.selectAllAriaLabel')"
                    :label="$t('additional:modules.lzsResearchClient.tabs.archiveList.selectAll')"
                    :checked="selectAllIsChecked"
                    :interaction="(evt) => toggleAllTables(evt.target.checked)"
                />

                <FlatButton
                    v-if="numberOfResults > 0"
                    id="tabResultDownloadButton"
                    :disabled="progressNow >= 0 || !somethingCheckedForDownload || isFetchingPrimaryData || sumOfCheckedFilesProgress > 100"
                    :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonAriaLabel')"
                    :text="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonText')"
                    @click="downloadChecked()"
                />
            </div>

            <SumOfCheckedFiles
                v-if="somethingCheckedForDownload"
                :checked-datasets="datasets.filter(data => data.checked)"
                @update:progress-percentage="sumOfCheckedFilesProgress = $event"
            />
        </div>

        <div class="ScrollableContent steps">
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
                    :title="`${getNameForArchiveId(step.archiveId)}${archiveSumString(step.archiveId)}`"
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
                                    :placeholder="getTranslationForAttributeWrapper(`additional:modules.lzsResearchClient.tabs.tabSearch.${step.attributeToGroupBy.toLowerCase()}`, step.attributeToGroupBy)"
                                    :show-labels="false"
                                    open-direction="bottom"
                                    :hide-selected="false"
                                    :allow-empty="false"
                                    :close-on-select="true"
                                    :clear-on-select="false"
                                    :internal-search="true"
                                    @select="changeGroupBy(index)"
                                >
                                    <template #singleLabel="props">
                                        <span>{{ getTranslationForAttributeWrapper(`additional:modules.lzsResearchClient.tabs.tabSearch.${props.option.toLowerCase()}`, props.option) }}</span>
                                    </template>

                                    <template #option="props">
                                        <div class="attribute-option-wrapper">
                                            <span :class="`attribute-check-icon ${props.option === step.attributeToGroupBy ? 'bi bi-check2' : ''}`" />
                                            <span>{{ getTranslationForAttributeWrapper(`additional:modules.lzsResearchClient.tabs.tabSearch.${props.option.toLowerCase()}`, props.option) }}</span>
                                        </div>
                                    </template>

                                    <template #noResult>
                                        {{ $t('additional:modules.lzsResearchClient.multiselect.noResult') }}
                                    </template>

                                    <template #noOptions>
                                        {{ $t('additional:modules.lzsResearchClient.multiselect.noOptions') }}
                                    </template>
                                </Multiselect>
                            </div>
                        </div>

                        <AccordionItem
                            v-for="(groupValue, groupIndex) in groupsForArchive(step)"
                            :id="`${idPrefix}-group-item-${index}-${groupIndex}`"
                            :key="`${groupIndex}-${groupByRenderKeys[index] || 0}`"
                            class="group-step"
                            :title="getTranslationForAttributeWrapper(`additional:modules.lzsResearchClient.tabs.tabSearch.${step.attributeToGroupBy.toLowerCase()}`, step.attributeToGroupBy) + ' ' + groupValue"
                            :is-open="openAllAccordions"
                            :coloured-header="true"
                        >
                            <TabResultTable
                                :ref="tableRefName(index, groupIndex)"
                                :table-index="tableRefName(index, groupIndex)"
                                :table-header="getTableHeaders(step, groupValue)"
                                :table-datasets="groupedResultsForAllSteps[index]?.[groupValue] || []"
                                :has-geo-ref="archiveHasGeoref(step.archiveId)"
                                :show-buttons="getTableButtons(step)"
                                @openDetails="onOpenDetails"
                                @clearOtherGeom="clearGeomAndGeomIndicator"
                                @showGeomAgain="showGeomAgain"
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
                            :show-buttons="getTableButtons(step)"
                            @openDetails="onOpenDetails"
                            @clearOtherGeom="clearGeomAndGeomIndicator"
                            @showGeomAgain="showGeomAgain"
                        />
                    </div>
                </AccordionItem>
            </div>
        </div>
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>

#ArchiveList {
    .archive-list-header {
        flex-direction: column;

        div.archiveListHeaderLine {
            display: flex;
            gap: 1rem;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0.5rem;

            p.numberOfResults {
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;

                span {
                    display: inline-block;
                    padding: 0.1rem 1rem;
                    border: 2px solid $secondary;
                    border-radius: 999px;
                    background: #fff;
                    font-weight: bold;
                    font-family: $font_family_accent;
                    margin-left: 1rem;
                }
            }
        }
    }

    div.downloadHandlingContainer {
        margin-bottom: 0.5rem;
        display: flex;
        gap: 2rem;
        align-items: center;

        .selectAllSwitch > * {
            cursor: pointer;
        }

        button#tabResultDownloadButton {
            margin-bottom: 0;
        }
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
            cursor: pointer;
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

            :deep(.multiselect) {
                cursor: text;

                .multiselect__tags {
                    cursor: text;
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

    :deep(.attribute-select) {
        .multiselect,
        .multiselect__input::placeholder,
        .multiselect__option {
            color: $black;
            font-weight: normal;
        }

        .multiselect__option {
            &:after,
            &--selected,
            &--selected:after {
                color: black;
                background: $light_grey_hover;
            }

            &--highlight,
            &--highlight:after {
                color: $white;
                background: $secondary;
            }
        }
    }
}
</style>

