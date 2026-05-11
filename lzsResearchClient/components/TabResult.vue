<script>
import {mapGetters, mapMutations} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import Multiselect from "vue-multiselect";
import TabResultTable from "./TabResultTable.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";

export default {
    name: "TabResult",
    components: {
        AccordionItem,
        FlatButton,
        Multiselect,
        TabResultTable
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    props: {},
    data () {
        return {
            groupByReRenderKey: 0,
            openAllAccordions: true
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "searchAttributeResponse",
            "nameForArchiveId",
            "archiveHasGeoref"
        ]),
        /**
         * Computes a list of unique archive IDs from the searchAttributeResponse and determines the attribute to group by for each archive.
         * Each returned object contains the archiveId and the name of the attribute used for grouping.
         * @returns {Array<{archiveId: string, attributeToGroupBy: string}>} - Array of objects with archiveId and attributeToGroupBy.
         */
        searchAttributesArchives () {
            const archiveIds = [...new Set(this.searchAttributeResponse.map(result => {
                    return result.archiveId;
                }))],
                result = archiveIds.map(val => {
                    const attributes = this.searchAttributeResponse.find(attr => attr.archiveId === val).attributes;

                    return {
                        archiveId: val,
                        attributeToGroupBy: attributes[0].name || attributes[0].id,
                        attributeCount: attributes.length
                    };
                });

            return result;
        },
        /**
         * Counts the number of results, returned by the search request
         * @returns {Number} - Count of response objects
         */
        numberOfResults () {
            return this.searchAttributeResponse.length;
        },
        /**
         * Gets the text for the button to toggle the accordion items. Depending on the current toggle state
         * @returns {String} - Button text
         */
        toggleAccordionText () {
            return this.openAllAccordions
                ? this.$t("additional:modules.lzsResearchClient.tabs.tabResult.toggleAccordions.closeAll")
                : this.$t("additional:modules.lzsResearchClient.tabs.tabResult.toggleAccordions.openAll");
        }
    },
    watch: {},
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setSelectedInstanceId"
        ]),
        /**
         * Returns a sorted list of unique group values for a given archive.
         * The grouping is based on the attribute specified in archiveData.attributeToGroupBy.
         * @param {Object} archiveData - An object containing archiveId and attributeToGroupBy.
         * @returns {Array<string|number>} - Sorted array of unique group values for the archive.
         */
        groupsForArchive (archiveData) {
            const resultsForArchiveId = this.searchAttributeResponse.filter((archive) => {
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
         * Removes the groupBy-attribute from the attributes list
         * @param {Object} archiveData - An object containing archiveId and attributeToGroupBy.
         * @param {String|Number|null} groupByValue - The value to filter the group by, use null to get all results.
         * @returns {Object[]} - Array of dataset objects matching the group value.
         */
        resultsForGroupsForArchive (archiveData, groupByValue = null) {
            const resultsForArchiveId = JSON.parse(JSON.stringify(this.searchAttributeResponse.filter((archive) => {
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
         * Returns the table headers for the result table
         * removes groupValue attributes, if given, because the groupValue is already set on the header of the accordion item
         * @param {Object} step - An object containing archiveId and attributeToGroupBy.
         * @param {String|Number|null} groupValue - The value to filter the group by, use null to get all results.
         * @returns {String[]} - Array of strings to be used as table headers.
         */
        getTableHeaders (step, groupValue = null) {
            let headers = this.resultsForGroupsForArchive(step, groupValue)[0].attributes.map(a => a.name || a.id);

            if (groupValue) {
                headers = headers.filter(a => a !== step.attributeToGroupBy);
            }

            headers.push(this.$t("additional:modules.lzsResearchClient.tabs.tabResult.table.headers.position"));
            headers.push(this.$t("additional:modules.lzsResearchClient.tabs.tabResult.table.headers.details"));

            return headers;
        },
        /**
         * Returns all attributes available in this archive to be shown in the "group by" dropdown
         * @param {Object} archiveData - An object containing archiveId and attributeCount.
         * @returns {String[]} - Array of attribute names to be used as values in the dropdown.
         */
        getAttributesToGroupBy (archiveData) {
            if (archiveData.attributeCount <= 1) {
                return [];
            }

            return this.searchAttributeResponse.find(attr => attr.archiveId === archiveData.archiveId).attributes.map((attribute) => {
                return attribute.name || attribute.id;
            });
        },
        /**
         * Called after click on one table row to show details for this primary dataset
         * @param {String} datasetInstanceId - the instance id of the dataset to show details for
         * @returns {void}
         */
        openDetails (datasetInstanceId) {
            this.setSelectedInstanceId(datasetInstanceId);
            this.setCurrentTab("tabDetails");
        }
    }
};
</script>

<template>
    <div id="TabResult">
        <div class="tabResultHeaderLine">
            <p class="numberOfResults">
                {{ $t("additional:modules.lzsResearchClient.tabs.tabResult.numberOfResults") }}

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

        <div class="steps">
            <AccordionItem
                v-for="(step, index) in searchAttributesArchives"
                :id="`result-item-${index}`"
                :key="index + groupByReRenderKey"
                class="archive-step"
                :title="nameForArchiveId(step.archiveId)"
                :is-open="openAllAccordions"
                :coloured-header="true"
            >
                <!-- if the archive results have more than 1 attribute, group by the first one or the one selected in the dropdown -->
                <div v-if="step.attributeCount > 1">
                    <div class="groupBySelectContainer">
                        <label
                            class="input-label"
                            :for="`group-by-select-${index}`"
                        >
                            {{ $t("additional:modules.lzsResearchClient.tabs.tabResult.groupByLabel") }}
                        </label>

                        <Multiselect
                            :id="`group-by-select-${index}`"
                            v-model="step.attributeToGroupBy"
                            :options="getAttributesToGroupBy(step)"
                            name="select-box"
                            :multiple="false"
                            :show-labels="true"
                            open-direction="bottom"
                            :hide-selected="false"
                            :allow-empty="false"
                            :close-on-select="true"
                            :clear-on-select="false"
                            :internal-search="false"
                            @select="groupByReRenderKey++"
                        />
                    </div>

                    <AccordionItem
                        v-for="(groupValue, groupIndex) in groupsForArchive(step)"
                        :id="`year-item-${index}-${groupIndex}`"
                        :key="groupIndex"
                        class="group-step"
                        :title="step.attributeToGroupBy + ' ' + groupValue"
                        :is-open="openAllAccordions"
                        :coloured-header="true"
                    >
                        <TabResultTable
                            :table-index="`result-table-${index}-${groupIndex}`"
                            :table-header="getTableHeaders(step, groupValue)"
                            :table-datasets="resultsForGroupsForArchive(step, groupValue)"
                            :has-geo-ref="archiveHasGeoref(step.archiveId)"
                            @openDetails="openDetails"
                        />
                    </AccordionItem>
                </div>

                <div v-else>
                    <TabResultTable
                        :table-index="`result-table-${index}`"
                        :table-header="getTableHeaders(step)"
                        :table-datasets="resultsForGroupsForArchive(step)"
                        :has-geo-ref="archiveHasGeoref(step.archiveId)"
                        @openDetails="openDetails"
                    />
                </div>
            </AccordionItem>
        </div>
    </div>
</template>

<style lang="scss" scoped>
//@import "~variables";

#TabResult {
    div.tabResultHeaderLine {
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

    div.groupBySelectContainer {
        display: flex;
    }

    :deep(div.archive-step) {
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
