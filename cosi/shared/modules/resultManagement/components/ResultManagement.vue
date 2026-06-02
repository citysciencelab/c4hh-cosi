<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import Card from "../../cards/components/Card.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "ResultManagement",
    components: {
        AccordionItem,
        Card,
        IconButton
    },
    props: {
        cardLayoutStyle: {
            type: String,
            required: false,
            default: "list"
        },
        dataSets: {
            type: Array,
            required: true
        },
        icon: {
            type: [Boolean, String],
            default: true
        },
        isAccordion: {
            type: Boolean,
            default: true
        },
        isDownloadAll: {
            type: Boolean,
            default: true
        },
        isRemoveAll: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: "additional:modules.tools.cosi.accessibilityAnalysis.resultManagement.title"
        },
        subjectData: {
            type: Boolean,
            default: false
        }
    },
    emits: ["downloadAll", "removeAllData", "updateActiveSet", "removeSet", "subjectDataSet"],
    methods: {
        uniqueId
    }
};
</script>

<template>
    <component
        :is="isAccordion ? 'AccordionItem' : 'div'"
        :id="uniqueId()"
        :icon="icon"
        :title="title"
        :is-open="true"
    >
        <h5
            v-if="!isAccordion"
            class="mb-3"
        >
            <i
                v-if="icon"
                :class="`${icon} mt-1 me-3`"
            />
            {{ $t(title) }}
        </h5>
        <div class="col-12 d-flex justify-content-between mb-3">
            <slot name="top" />
            <div class="d-flex align-self-center">
                <IconButton
                    v-if="isDownloadAll"
                    class="p-1 btn-light mb-0"
                    :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.resultManagement.downloadAll')"
                    icon="bi bi-download"
                    :interaction="() => $emit('downloadAll')"
                />
                <IconButton
                    v-if="isRemoveAll"
                    class="p-1 btn-light mb-0"
                    :aria="$t('additional:modules.tools.cosi.accessibilityAnalysis.resultManagement.removeAll')"
                    icon="bi bi-trash"
                    :interaction="() => $emit('removeAllData')"
                />
            </div>
        </div>
        <div class="col-12">
            <div
                v-for="(set, index) in dataSets"
                :key="set"
            >
                <Card
                    :title="set.title"
                    :badge-list="set.badge"
                    :data="set.data"
                    :downloadable="set.downloadable"
                    :icon="set.icon"
                    :removable="set.removable"
                    :status="set.status"
                    :visible="set.visible"
                    :data-index="index"
                    :layout-style="cardLayoutStyle"
                    :subject-data="set.subjectData"
                    :subject-data-disabled="set.subjectDataDisabled"
                    class="col-12"
                    @click="$emit('updateActiveSet', index)"
                    @hide-set="$emit('updateActiveSet', index)"
                    @remove-set="$emit('removeSet', index)"
                    @subject-Data-Set="$emit('subjectDataSet', index)"
                >
                    <template #download-menu>
                        <slot name="card" />
                    </template>
                    <template #subjectData-menu>
                        <slot
                            name="subjectData"
                            :index="index"
                        />
                    </template>
                </Card>
                <slot
                    name="after-card"
                    :index="index"
                />
            </div>
        </div>
    </component>
</template>
