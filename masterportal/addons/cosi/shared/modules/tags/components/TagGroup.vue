<script>
import {VChip} from "vuetify/components/VChip";
import {VChipGroup} from "vuetify/components/VChipGroup";
import {VSkeletonLoader} from "vuetify/components/VSkeletonLoader";

export default {
    name: "TagGroup",
    components: {
        VChip,
        VChipGroup,
        VSkeletonLoader
    },
    props: {
        items: {
            type: Array,
            required: true,
            /**
             * Checks whether each object in the array has the properties selected (of type Boolean) and label (of type String).
             * @param {Array} items - Array of objects to validate.
             * @returns {boolean} True if all objects have the required properties with correct types, false otherwise.
             */
            validator: (items) => {
                return items.every(item => {
                    return typeof item.label === "string" && typeof item.selected === "boolean";
                });
            }
        },
        closeable: {
            type: Boolean,
            default: false,
            required: false
        },
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },
        label: {
            type: String,
            default: null,
            required: false
        },
        loading: {
            type: Boolean,
            default: false,
            required: false
        },
        multiple: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    emits: ["update:selected-items"],
    computed: {
        /**
         * Gets the selected items from the items prop.
         * @returns {Array} An array of selected items.
         */
        selectedItems () {
            return this.items.filter(obj => obj.selected === true);
        },

        /**
         * Determines the skeleton loader type based on the number of items.
         * @returns {string} The skeleton loader type string.
         */
        skeletonType () {
            const itemCount = this.items.length;

            return this.label ? `chip@${itemCount}` : `chip@${itemCount}`;
        }
    },
    methods: {
        /**
         * Emits the selected items to the parent component.
         * If `multiple` is true, this is an array of items, otherwise it is a single item.
         * @param {Array|any} selectedItems - The selected item(s).
         */
        emitSelectedItems (selectedItems) {
            this.$emit("update:selected-items", selectedItems);
        }
    }
};
</script>

<template lang="html">
    <div class="tag-group">
        <template v-if="loading">
            <v-skeleton-loader type="subtitle" />
            <v-skeleton-loader :type="skeletonType" />
        </template>
        <template v-else>
            <h6
                v-if="label"
                class="mb-0"
            >
                {{ label }}
            </h6>
            <v-chip-group
                :model-value="selectedItems"
                :disabled="disabled"
                :multiple="multiple"
                column
                @update:model-value="emitSelectedItems"
            >
                <v-chip
                    v-for="(item, idx) in items"
                    :key="idx"
                    :closable="closeable"
                    :value="item"
                    :style="{'--selected-chip-color': item.color}"
                    filter
                >
                    {{ item.label }}
                </v-chip>
            </v-chip-group>
        </template>
    </div>
</template>

<style lang="scss">
    .tag-group {
        h6 {
            color: $light_grey_inactive_contrast;
        }
        .v-chip {
            background-color: $light_blue;
            &:hover {
                background-color: $dark_blue;
                color: white;
                cursor: pointer;
            }
        }
        .v-chip--selected {
            background-color: var(--selected-chip-color, #{$dark_blue});
            color: white;
        }
        .v-chip__overlay {
            background-color: unset;
        }

        .v-skeleton-loader__subtitle {
            .v-skeleton-loader__text {
                margin-left: 0;
                margin-top: 0;
            }
        }
        .v-skeleton-loader__chip {
            margin: 0 10px 5px 0;
        }
    }
</style>
