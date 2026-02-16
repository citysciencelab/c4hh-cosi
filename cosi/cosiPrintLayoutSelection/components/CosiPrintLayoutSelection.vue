<script>

export default {
    name: "CosiPrintLayoutSelection",
    props: {
        items: {
            type: Array,
            required: true,
            validator: (value) => {
                const valid = Array.isArray(value) && value.every(
                    item => typeof item.name === "string" && item.name.split(" ").length === 3
                );

                if (!valid) {
                    console.warn("CosiPrintLayoutSelection: items must be an array of objects with a 'name' string property in the format '<pageSize> <orientation> <layoutVariant>'");
                }
                return valid;
            }
        },
        modelValue: {
            type: String,
            required: true,
            validator: (value) => {
                const valid = typeof value === "string" && value.split(" ").length === 3;

                if (!valid) {
                    console.warn("CosiPrintLayoutSelection: modelValue must be a string in the format '<pageSize> <orientation> <layoutVariant>'");
                }
                return valid;
            }
        }
    },
    emits: ["update:modelValue"],
    computed: {
        layoutVariant: {
            /**
             * Gets the layout variant from the modelValue.
             * @returns {String} The layout variant.
             */
            get () {
                return this.modelValue.split(" ")[2];
            },
            /**
             * Sets the layout variant in the modelValue.
             * @param {String} newVariant The new layout variant.
             */
            set (newVariant) {
                const parts = this.modelValue.split(" ");

                parts[2] = newVariant;
                this.$emit("update:modelValue", parts.join(" "));
            }
        },
        /**
         * Returns the available layout variants.
         * @returns {String[]} The available layout variants.
         */
        layoutVariantOptions () {
            const variantsWithDuplicates = this.items.map(item => item.name.split(" ")[2]);

            return [...new Set(variantsWithDuplicates)];
        },
        orientation: {
            /**
             * Gets the orientation from the modelValue.
             * @returns {String} The orientation.
             */
            get () {
                return this.modelValue.split(" ")[1];
            },
            /**
             * Sets the orientation in the modelValue.
             * @param {String} newOrientation The new orientation.
             */
            set (newOrientation) {
                const parts = this.modelValue.split(" ");

                parts[1] = newOrientation;
                this.$emit("update:modelValue", parts.join(" "));
            }
        },
        /**
         * Returns the available orientations.
         * @returns {String[]} The available orientations.
         */
        orientationOptions () {
            const orientationsWithDuplicates = this.items.map(item => item.name.split(" ")[1]);

            return [...new Set(orientationsWithDuplicates)];
        },
        pageSize: {
            /**
             * Gets the page size from the modelValue.
             * @returns {String} The page size.
             */
            get () {
                return this.modelValue.split(" ")[0];
            },
            /**
             * Sets the page size in the modelValue.
             * @param {String} newPageSize The new page size.
             */
            set (newPageSize) {
                const parts = this.modelValue.split(" ");

                parts[0] = newPageSize;
                this.$emit("update:modelValue", parts.join(" "));
            }
        },
        /**
         * Returns the available page sizes.
         * @returns {String[]} The available page sizes.
         */
        pageSizeOptions () {
            const pageSizesWithDuplicates = this.items.map(item => item.name.split(" ")[0]);

            return [...new Set(pageSizesWithDuplicates)];
        }
    }
};
</script>

<template>
    <div class="form-floating my-4">
        <div class="d-flex flex-wrap mb-2">
            <div class="flex-grow-1 px-2">
                <fieldset class="">
                    <legend class="mb-2">
                        {{ $t("additional:modules.vueComponents.cosiPrintLayoutSelection.layoutVariant") }}
                    </legend>
                    <div
                        v-for="variantOption in layoutVariantOptions"
                        :key="variantOption"
                        class="form-check ms-3 my-2"
                    >
                        <input
                            :id="'radio' + variantOption"
                            v-model="layoutVariant"
                            class="form-check-input"
                            type="radio"
                            :value="variantOption"
                        >
                        <label
                            class="form-check-label"
                            :for="'radio' + variantOption"
                        >
                            {{ variantOption }}
                        </label>
                    </div>
                </fieldset>
            </div>
            <div class="flex-grow-1 px-2">
                <fieldset>
                    <legend class="mb-2">
                        {{ $t("additional:modules.vueComponents.cosiPrintLayoutSelection.orientation") }}
                    </legend>
                    <div
                        v-for="orientationOption in orientationOptions"
                        :key="orientationOption"
                        class="form-check ms-3 my-2"
                    >
                        <input
                            :id="'radio' + orientationOption"
                            v-model="orientation"
                            class="form-check-input"
                            type="radio"
                            :value="orientationOption"
                        >
                        <label
                            class="form-check-label"
                            :for="'radio' + orientationOption"
                        >
                            {{ orientationOption }}
                        </label>
                    </div>
                </fieldset>
            </div>
        </div>
        <div class="row info mb-3 mt-2">
            <span class="col-1 fs-4 d-flex align-items-center">
                <i class="bi-info-circle" />
            </span>
            <div class="col font-size-sm ps-3">
                {{ $t("additional:modules.vueComponents.cosiPrintLayoutSelection.infoText") }}
            </div>
        </div>
        <div class="form-floating">
            <select
                id="pageSizeSelect"
                v-model="pageSize"
                class="form-select"
                aria-label="Seitenformat"
            >
                <option
                    v-for="pageSizeOption in pageSizeOptions"
                    :key="pageSizeOption"
                    :value="pageSizeOption"
                >
                    {{ pageSizeOption }}
                </option>
            </select>
            <label for="pageSizeSelect">{{ $t("additional:modules.vueComponents.cosiPrintLayoutSelection.pageSize") }}</label>
        </div>
    </div>
</template>

<style scoped lang="scss">
    legend {
        font-size: $font-size-base;
    }
    .font-size-sm {
        font-size: $font-size-sm;
    }
</style>
