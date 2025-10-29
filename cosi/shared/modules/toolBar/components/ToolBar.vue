<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import ButtonGroup from "../../../../components/ButtonGroup.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "ToolBar",
    components: {
        AccordionItem,
        ButtonGroup,
        FlatButton,
        SwitchInput
    },
    props: {
        optionalButton: {
            type: Object,
            required: false,
            default: undefined
        },
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        isAccordion: {
            type: Boolean,
            required: false,
            default: true
        },
        enableCalculation: {
            type: Boolean,
            required: false,
            default: true
        },
        title: {
            type: String,
            required: false,
            default: ""
        },
        showDetail: {
            type: [Boolean, Object],
            required: false,
            default: false
        }
    },
    emits: ["exportTable"],
    data () {
        return {
            groupButtons: [
                {"icon": "bi-table", "name": "Tabelle"},
                {"icon": "bi-bar-chart", "name": "Diagramm"}
            ]
        };
    },
    methods: {
        uniqueId
    }
};
</script>

<template>
    <div class="toolbar-container">
        <component
            :is="isAccordion ? 'AccordionItem' : 'div'"
            :id="uniqueId()"
            :icon="icon"
            :title="title"
            :is-open="true"
        >
            <div class="button-level d-flex">
                <FlatButton
                    id="table-settings"
                    :aria-label="$t('common:shared.modules.table.settings')"
                    :text="$t('common:shared.modules.table.settings')"
                    :title="$t('common:shared.modules.table.settingsTooltip')"
                    :icon="'bi-gear'"
                    :class="'mb-1 me-3 rounded-pill'"
                    :interaction="() => {}"
                />
                <FlatButton
                    v-if="typeof optionalButton !== 'undefined'"
                    id="optional-button"
                    :aria-label="optionalButton.text"
                    :text="optionalButton.text"
                    :title="optionalButton.text"
                    :icon="optionalButton.icon"
                    :class="'mb-1 me-3 rounded-pill'"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    :interaction="optionalButton.event"
                />
                <slot name="optionalDropdown" />
                <FlatButton
                    v-if="enableCalculation"
                    id="calculation-button"
                    :aria-label="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate')"
                    :text="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate')"
                    :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate')"
                    :icon="'bi-plus-slash-minus'"
                    :class="'mb-1 me-3 rounded-pill'"
                    :interaction="() => {}"
                />
                <FlatButton
                    id="table-download"
                    :aria-label="$t('common:shared.modules.buttons.download')"
                    :text="$t('common:shared.modules.buttons.download')"
                    :title="$t('common:shared.modules.buttons.download')"
                    :icon="'bi-save'"
                    :class="'me-0 rounded-pill download'"
                    @click.native="$emit('exportTable', true)"
                />
            </div>
            <hr class="mt-0">
            <div class="d-flex">
                <ButtonGroup
                    class="mb-3 me-3"
                    :buttons="groupButtons"
                    group="tableDiagramm"
                    @show-view="() => {}"
                />
                <SwitchInput
                    v-if="showDetail"
                    id="show-detail"
                    :aria="$t('additional:modules.tools.cosi.dashboard.dietailView')"
                    :checked="showDetail.visibility"
                    :interaction="() => {}"
                    :label="$t('additional:modules.tools.cosi.dashboard.dietailView')"
                    class="mb-3 pt-1"
                />
            </div>
        </component>
    </div>
</template>

<style lang="scss" scoped>
    .button-level {
        .download {
            margin-left: auto;
            order: 2;
        }
    }

</style>
