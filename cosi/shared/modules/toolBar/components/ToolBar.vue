<script>
import ButtonGroup from "../../../../components/ButtonGroup.vue";
import draggable from "vuedraggable";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "ToolBar",
    components: {
        ButtonGroup,
        Draggable: draggable,
        FlatButton,
        SwitchInput
    },
    props: {
        optionalButton: {
            type: Object,
            required: false,
            default: undefined
        },
        enableCalculation: {
            type: Boolean,
            required: false,
            default: true
        },
        settingItems: {
            type: Array,
            required: true
        },
        showDetail: {
            type: [Boolean, Object],
            required: false,
            default: false
        }
    },
    emits: ["exportTable", "reorderedSettingItems", "toggleSettingItem"],
    data () {
        return {
            checkedSettingItems: {},
            groupButtons: [
                {"icon": "bi-table", "name": "Tabelle"},
                {"icon": "bi-bar-chart", "name": "Diagramm"}
            ],
            settingItemList: this.settingItems.slice()
        };
    },
    watch: {
        /**
         * Emits an event to notify that the setting items have been reordered.
         * @param {Array} items - The reordered list of setting items.
         * @returns {void}
         */
        settingItemList (items) {
            this.$emit("reorderedSettingItems", items);
        }
    },
    mounted () {
        this.checkedSettingItems = {
            ...this.settingItems.reduce((acc, item) => {
                acc[item] = true;
                return acc;
            }, {})
        };
    },
    methods: {
        /**
         * Emits the toggleSettingItem event with the changed setting item
         * @param {Objecet} evt - Change event
         * @returns {void}
         */
        toggleSettingItem (evt) {
            this.$emit("toggleSettingItem", evt.target.value);
        }
    }
};
</script>

<template>
    <div class="toolbar-container">
        <div class="d-flex">
            <FlatButton
                id="table-settings"
                :aria-label="$t('common:shared.modules.table.settings')"
                :text="$t('common:shared.modules.table.settings')"
                :title="$t('common:shared.modules.table.settingsTooltip')"
                :icon="'bi-gear'"
                :class="'mb-1 me-3 rounded-pill'"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
            />
            <div
                class="dropdown-menu p-0 border-0 mt-1"
            >
                <Draggable
                    v-model="settingItemList"
                    class="ps-0 m-2"
                    handle=".list-group-item-draggable"
                    item-key="id"
                    tag="ul"
                >
                    <template #item="{ element }">
                        <li
                            :key="element"
                            class="list-group-item d-flex justify-content-between align-items-center p-2 rounded list-group-item-draggable"
                        >
                            <div class="ms-2 me-auto d-flex form-check">
                                <input
                                    :id="element"
                                    v-model="checkedSettingItems[element]"
                                    :value="element"
                                    class="me-2 mt-1 form-check-input"
                                    type="checkbox"
                                    @change="toggleSettingItem"
                                >
                                <label
                                    class="text-nowrap form-check-label"
                                    :for="element"
                                >
                                    <span>
                                        {{ element }}
                                    </span>
                                </label>
                            </div>
                            <span class="me-2">
                                <i class="bi bi-grip-vertical" />
                            </span>
                        </li>
                    </template>
                </Draggable>
            </div>
            <slot name="table-settings" />
            <div
                v-if="typeof optionalButton !== 'undefined'"
                class="dropdown"
            >
                <FlatButton
                    :id="optionalButton.id ?? 'optional-button'"
                    :aria-label="optionalButton.text"
                    :text="optionalButton.text"
                    :title="optionalButton.text"
                    :icon="optionalButton.icon"
                    class="mb-1 me-3 rounded-pill"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="false"
                    :interaction="() => optionalButton.event?.()"
                />
                <div
                    class="dropdown-menu px-3 border-0 mt-1"
                >
                    <slot name="optionalDropdown" />
                </div>
            </div>
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
                class="me-0 rounded-pill ms-auto"
                @click.native="$emit('exportTable', true)"
            />
        </div>
        <hr class="mt-0">
        <slot
            name="underHorizontalRule"
            class="mb-3"
        />
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
    </div>
</template>

<style lang="scss" scoped>
    .dropdown-menu {
        --bs-dropdown-min-width: 25em;
        overflow: auto;
        li {
            cursor: grab;
            input:hover {
                cursor: pointer;
            }
            .form-check-label {
                cursor: pointer;
            }
            &:hover {
                background: $light_blue;
            }
        }
    }
</style>
