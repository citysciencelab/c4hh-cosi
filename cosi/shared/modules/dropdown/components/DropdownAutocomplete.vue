<script>
import {VAutocomplete} from "vuetify/components/VAutocomplete";
import {VCheckboxBtn} from "vuetify/components/VCheckbox";
import {VChip} from "vuetify/components/VChip";
import {VListItem, VListSubheader} from "vuetify/components/VList";
import {VSkeletonLoader} from "vuetify/components/VSkeletonLoader";

export default {
    name: "DropdownAutocomplete",
    components: {
        VAutocomplete,
        VCheckboxBtn,
        VChip,
        VListItem,
        VListSubheader,
        VSkeletonLoader
    },
    props: {
        clearable: {
            type: Boolean,
            default: false,
            required: false
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },
        isGroup: {
            type: Boolean,
            default: false,
            required: false
        },
        items: {
            type: Array,
            required: true
        },
        itemTitle: {
            type: String,
            default: undefined,
            required: false
        },
        label: {
            type: String,
            required: true
        },
        loading: {
            type: Boolean,
            default: false,
            required: false
        },
        maxChipCount: {
            type: Number,
            default: 3,
            required: false
        },
        modelValue: {
            type: null,
            required: false,
            default: undefined
        },
        multiple: {
            type: Boolean,
            default: false,
            required: false
        },
        selectAll: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    emits: ["update:modelValue"],
    computed: {
        /**
         * Checks whether all items are selected.
         * @returns {Boolean} True if all items are selected.
         */
        allSelectedItems () {
            return this.modelValue?.length === this.items.length;
        },

        /**
         * Checks whether some items are selected.
         * @returns {Boolean} True if more than one value is selected, or all values.
         */
        someSelectedItems () {
            if (!this.multiple) {
                return this.modelValue !== null && this.modelValue !== undefined;
            }
            return this.modelValue?.length > 0;
        }
    },
    methods: {
        /**
         * Toggles the selection of all items in the dropdown. Only for multiple selection.
         * @returns {void}
         */
        toggleSelectAll () {
            if (!this.multiple) {
                return;
            }
            if (this.allSelectedItems) {
                this.$emit("update:modelValue", []);
            }
            else {
                this.$emit("update:modelValue", this.items.slice());
            }
        },
        /**
         * Removes a specific item from the selected items. Only for multiple selection.
         * @param {String} itemToRemove - The item to be removed.
         * @returns {void}
         */
        removeItem (itemToRemove) {
            if (!this.multiple) {
                return;
            }
            const items = this.modelValue.filter(item => item !== itemToRemove);

            this.$emit("update:modelValue", items);
        }
    }
};
</script>

<template lang="html">
    <div class="dropdown-autocomplete">
        <template v-if="loading">
            <v-skeleton-loader type="button" />
        </template>
        <template v-else-if="!isGroup">
            <v-autocomplete
                v-if="multiple"
                :model-value="modelValue"
                :items="items"
                :item-title="itemTitle"
                :label="label"
                multiple
                class="mb-3"
                chips
                closable-chips
                hide-details
                @update:modelValue="(value) => $emit('update:modelValue', value)"
            >
                <template
                    v-if="selectAll"
                    #prepend-item
                >
                    <v-list-item
                        title="Alle auswählen"
                        @click="toggleSelectAll"
                    >
                        <template #prepend>
                            <v-checkbox-btn
                                :indeterminate="someSelectedItems && !allSelectedItems"
                                :model-value="allSelectedItems"
                            />
                        </template>
                    </v-list-item>
                    <v-divider class="mt-2" />
                </template>
                <template #chip="{ item, index, props }">
                    <v-chip
                        v-if="index < maxChipCount"
                        v-bind="props"
                        closable
                        close-icon="mdi-close"
                        @click="removeItem(item.value)"
                    >
                        {{ item.value }}
                    </v-chip>
                    <span
                        v-if="multiple && index === maxChipCount"
                        class="grey--text text-caption"
                    >
                        (+{{ modelValue.length - maxChipCount }} weitere)
                    </span>
                </template>
            </v-autocomplete>
            <v-autocomplete
                v-else
                :model-value="modelValue"
                :items="items"
                :item-title="itemTitle"
                :disabled="disabled"
                hide-details
                :label="label"
                :clearable="clearable"
                @update:modelValue="(value) => $emit('update:modelValue', value?.value ? value.value : value)"
            />
        </template>
        <template v-else>
            <v-autocomplete
                :model-value="modelValue"
                :items="items"
                chips
                closable-chips
                :label="label"
                item-title="name"
                item-value="name"
                :multiple="multiple"
                @update:modelValue="(value) => $emit('update:modelValue', value)"
            >
                <template #chip="{ item, index, props }">
                    <v-chip
                        v-if="index < maxChipCount"
                        v-bind="props"
                        closable
                        close-icon="mdi-close"
                        @click="removeItem(item.value)"
                    >
                        {{ item.value }}
                    </v-chip>
                    <span
                        v-if="multiple && index === maxChipCount"
                        class="grey--text text-caption"
                    >
                        (+{{ modelValue.length - maxChipCount }} weitere)
                    </span>
                </template>
                <template #item="{ props, item }">
                    <v-list-subheader
                        v-if="typeof item.raw.group !== 'undefined'"
                        class="group-title"
                    >
                        {{ item.raw.group }}
                    </v-list-subheader>
                    <v-list-item
                        v-else
                        v-bind="props"
                        :title="item.raw.name"
                    >
                        <template
                            v-if="multiple"
                            #prepend="{ isSelected }"
                        >
                            <v-checkbox-btn :model-value="isSelected" />
                        </template>
                    </v-list-item>
                </template>
            </v-autocomplete>
        </template>
    </div>
</template>

<style lang="scss">
    .v-autocomplete {
        .v-field__overlay {
            background-color: unset;
        }
        .v-input__control {
            border: 1px solid $border-color;
            border-radius: $border-radius;
        }
        .v-chip {
            background-color: $light_blue;
            &:hover {
                background-color: $dark_blue;
                color: white;
                cursor: pointer;
            }
        }
        .v-chip__underlay {
            background-color: unset;
        }
        .v-field__outline {
            --v-field-border-width: 0;
        }
        .v-field--focused {
            .v-field__outline::after, .v-field__outline::before {
                border: 1px solid $secondary;
                border-radius: $border-radius;
            }
        }
        .v-field--focused {
            .v-field-label--floating {
                color: $secondary;
            }
        }
    }
    .v-autocomplete__content {
        .v-list-item {
            &:hover {
                background-color: $secondary;
                color: white;
            }
        }
        .v-list-item__overlay {
            background-color: unset;
        }
        .v-list-item--active {
            background-color: $light_blue;
        }
    }

    .dropdown-autocomplete {
        .v-skeleton-loader__button {
            max-width: 100%;
            height: 56px;
            margin: 0 0 5px 0;
        }
    }

    .group-title {
        font-size: $font_size_big;
    }
</style>
