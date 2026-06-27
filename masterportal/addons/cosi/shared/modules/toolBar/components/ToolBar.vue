<script>
import ButtonGroup from "../../../../components/ButtonGroup.vue";
import draggable from "vuedraggable";
import {Dropdown} from "bootstrap";
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
        downloadDisabled: {
            type: Boolean,
            required: false,
            default: false
        },
        itemTitle: {
            type: String,
            default: "title"
        },
        mandatorySettingItems: {
            type: Array,
            required: false,
            default: () => []
        },
        optionalButton: {
            type: Object,
            required: false,
            default: undefined
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
    emits: ["exportTable", "update:setting-items", "showView"],
    data () {
        return {
            optionalDropdownInstance: null,
            filterMenuDropdownInstance: null,
            filterButtonId: "add-filter-button",
            groupButtons: [
                {"value": "table", "icon": "bi-table", "name": "Tabelle"},
                {"value": "chart", "icon": "bi-bar-chart", "name": "Diagramm"}
            ]
        };
    },
    computed: {
        /**
         * Whether the optional dropdown should close when clicking outside.
         * @returns {Boolean} `true` if outside clicks should close the optional dropdown.
         */
        closeOnOutside () {
            return this.optionalButton?.closeOnOutside === true;
        }
    },
    mounted () {
        const toggleElement = document.getElementById(this.optionalButton?.id),
            filterElement = document.getElementById(this.filterButtonId);

        if (filterElement) {
            this.filterMenuDropdownInstance = Dropdown.getOrCreateInstance(filterElement);
        }
        if (toggleElement) {
            this.optionalDropdownInstance = Dropdown.getOrCreateInstance(toggleElement);
        }
        document.addEventListener("pointerdown", this.onGlobalPointerDown, true);
        document.addEventListener("keydown", this.onGlobalKeyDown);
    },
    beforeUnmount () {
        document.removeEventListener("pointerdown", this.onGlobalPointerDown, true);
        document.removeEventListener("keydown", this.onGlobalKeyDown);
    },
    methods: {
        /**
         * Handles global pointer interactions to close the dropdown
         * when clicking outside of it.
         * The dropdown remains open when the interaction occurs:
         * - inside a dropdown container
         * - inside a Vuetify overlay (e.g. autocomplete menus)
         * @param {PointerEvent} event - The global pointer event.
         * @returns {void}
         */
        onGlobalPointerDown (event) {
            const roots = [this.$refs.optionalDropdownRoot, this.$refs.filterDropdownRoot],
                clickedInVuetifyOverlay = event.target.closest(".v-overlay"),
                clickedInside = roots.some(root => root?.contains(event.target));

            if (clickedInside || clickedInVuetifyOverlay) {
                return;
            }

            this.filterMenuDropdownInstance?.hide();
            if (this.closeOnOutside) {
                this.optionalDropdownInstance?.hide();
            }
        },
        /**
         * Handles global keyboard interactions for the optional dropdown.
         * Closes the dropdown when the Escape key is pressed
         * @param {KeyboardEvent} event - The keyboard event.
         * @returns {void}
         */
        onGlobalKeyDown (event) {
            if (event.key !== "Escape") {
                return;
            }
            this.filterMenuDropdownInstance?.hide();
            if (this.closeOnOutside) {
                this.optionalDropdownInstance?.hide();
            }
        }
    }
};
</script>

<template>
    <div class="toolbar-container mb-3">
        <div class="d-flex">
            <FlatButton
                id="table-settings"
                :aria-label="$t('common:shared.modules.table.settings')"
                :text="$t('common:shared.modules.table.settings')"
                :title="$t('common:shared.modules.table.settingsTooltip')"
                :icon="'bi-gear'"
                :class="'me-3 rounded-pill'"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
            />
            <div
                class="dropdown-menu p-0 border-0 mt-1"
            >
                <Draggable
                    class="ps-0 m-2"
                    handle=".list-group-item-draggable"
                    item-key="id"
                    tag="ul"
                    :model-value="settingItems"
                    @update:model-value="$emit('update:setting-items', $event)"
                >
                    <template #item="{ element }">
                        <li
                            :key="element.value"
                            class="list-group-item d-flex justify-content-between align-items-center p-2 rounded list-group-item-draggable"
                        >
                            <div class="ms-2 me-auto d-flex form-check">
                                <input
                                    :id="element.value"
                                    v-model="element.show"
                                    class="me-2 mt-1 form-check-input opacity-100"
                                    :disabled="mandatorySettingItems.includes(element.value)"
                                    type="checkbox"
                                >
                                <label
                                    class="text-nowrap form-check-label"
                                    :for="element.value"
                                >
                                    <span>
                                        {{ element[itemTitle] }}
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
                v-if="$slots.filterMenu"
                ref="filterDropdownRoot"
                class="dropdown"
            >
                <FlatButton
                    :id="filterButtonId"
                    :aria-label="$t('additional:modules.tools.cosi.dashboard.addFilter')"
                    :text="$t('additional:modules.tools.cosi.dashboard.addFilter')"
                    :title="$t('additional:modules.tools.cosi.dashboard.addFilter')"
                    icon="bi-funnel-fill"
                    class="mb-1 me-3 rounded-pill"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="false"
                />
                <div
                    class="dropdown-menu px-3 border-0 mt-1"
                >
                    <slot name="filterMenu" />
                </div>
            </div>
            <div
                v-if="typeof optionalButton !== 'undefined'"
                ref="optionalDropdownRoot"
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
                id="table-download"
                :aria-label="$t('common:shared.modules.buttons.download')"
                :text="$t('common:shared.modules.buttons.download')"
                :title="$t('common:shared.modules.buttons.download')"
                :icon="'bi-save'"
                :disabled="downloadDisabled"
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
                @show-view="$emit('showView', $event)"
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
