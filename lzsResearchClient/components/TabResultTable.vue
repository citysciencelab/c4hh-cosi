<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "TabResultTable",
    components: {
        IconButton
    },
    props: {
        tableIndex: {
            type: String,
            required: true
        },
        tableHeader: {
            type: Array,
            required: true
        },
        tableDatasets: {
            type: Array,
            required: true
        },
        hasGeoRef: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["openDetails"],
    data () {
        return {};
    },
    methods: {
        showDatasetPositionInMap (datasetInstanceId) {
            console.warn(datasetInstanceId + " noch nicht implementiert!");
        }
    }
};
</script>

<template>
    <div
        :id="`TabResultTable-${tableIndex}`"
        class="TabResultTable"
    >
        <table v-if="tableDatasets.length">
            <thead>
                <tr>
                    <th
                        v-for="attrName in tableHeader"
                        :key="attrName"
                    >
                        {{ attrName }}
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr
                    v-for="(dataset, datasetIndex) in tableDatasets"
                    :key="datasetIndex"
                    :class="'dataset-row dataset-row-' + datasetIndex"
                    :data-dataset-index="datasetIndex"
                >
                    <td
                        v-for="attrName in tableDatasets[0].attributes.map(a => a.name)"
                        :key="attrName"
                    >
                        {{
                            (dataset.attributes.find(a => a.name === attrName) || {}).value || ''
                        }}
                    </td>

                    <td>
                        <IconButton
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.showPositionInMap')"
                            icon="bi-crosshair"
                            :disabled="!hasGeoRef"
                            @click="showDatasetPositionInMap(dataset.instanceId)"
                        />
                    </td>

                    <td>
                        <IconButton
                            :class-array="['btn-light', 'me-2', 'listAction', datasetIndex % 2 !== 0 ? 'button-dark-background' : '']"
                            :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.goToDetails')"
                            icon="bi-arrow-right-circle"
                            @click="$emit('openDetails', dataset.instanceId)"
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.TabResultTable {
    table {
        width: 100%;

        tr {
            line-height: 3rem;

            /* Each dataset consists of multiple rows, so we group them using a data attribute. */
            &.dataset-row[data-dataset-index]:nth-child(odd) {
                background: $white;
            }
            &.dataset-row[data-dataset-index]:nth-child(even) {
                background: $light_grey_hover;
            }
            &.dataset-row[data-dataset-index]:nth-child(odd):hover,
            &.dataset-row[data-dataset-index]:nth-child(even):hover {
                background: $light_grey_active;
            }

            td:first-child {
                padding-left: 1rem;
            }
        }
    }

    :deep(button.button-dark-background) {
        background-color: $light_grey_hover;
        border-color: $light_grey_hover;
    }
}
</style>
