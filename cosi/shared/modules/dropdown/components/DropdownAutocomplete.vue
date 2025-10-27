<script>
import {VAutocomplete} from "vuetify/components/VAutocomplete";
import {VCheckboxBtn} from "vuetify/components/VCheckbox";
import {VChip} from "vuetify/components/VChip";
import {VListItem} from "vuetify/components/VList";
import {VSkeletonLoader} from "vuetify/components/VSkeletonLoader";

export default {
    name: "DropdownAutocomplete",
    components: {
        VAutocomplete,
        VCheckboxBtn,
        VChip,
        VListItem,
        VSkeletonLoader
    },
    props: {
        items: {
            type: Array,
            required: true
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
        multiple: {
            type: Boolean,
            default: true,
            required: false
        },
        selectAll: {
            type: Boolean,
            default: false,
            required: false
        },
        selectedItems: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    computed: {
        /**
         * Checks whether all items are selected.
         * @returns {Boolean} True if all items are selected.
         */
        allSelectedItems () {
            return this.selectedItems.length === this.items.length;
        },

        /**
         * Checks whether some items are selected.
         * @returns {Boolean} True if more than one value is selected, but not all.
         */
        someSelectedItems () {
            return this.selectedItems.length > 0;
        }
    },

    methods: {
        /**
         * Toggles the selection of all items in the dropdown.
         * @returns {void}
         */
        toggleSelectAll () {
            if (this.allSelectedItems) {
                this.$emit("update:selected-items", []);
            }
            else {
                this.$emit("update:selected-items", this.items.slice());
            }
        },
        /**
         * Removes a specific item from the selected items.
         * @param {String} itemToRemove - The item to be removed.
         * @returns {void}
         */
        removeItem (itemToRemove) {
            const items = this.selectedItems.filter(item => item !== itemToRemove);

            this.$emit("update:selected-items", items);
        }
    }
};
</script>

<template lang="html">
    <div class="dropdown-autocomplete">
        <template v-if="loading">
            <v-skeleton-loader type="button" />
        </template>
        <v-autocomplete
            v-else
            :model-value="selectedItems"
            :items="items"
            :label="label"
            :multiple="multiple"
            class="mb-3"
            chips
            closable-chips
            hide-details
            @update:modelValue="(value) => $emit('update:selected-items', value)"
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
                    @click="removeItem(item.value)"
                >
                    {{ item.value }}
                    <template #close>
                        <v-icon>mdi-close</v-icon>
                    </template>
                </v-chip>
                <span
                    v-if="index === maxChipCount"
                    class="grey--text text-caption"
                >
                    (+{{ selectedItems.length - maxChipCount }} weitere)
                </span>
            </template>
        </v-autocomplete>
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
</style>
