<script>

/**
 * SwitchInput component: A small toggle/switch input interface used for toggles and on/off-switches.
 * @module shared/modules/checkboxes/SwitchInput
 * @vue-prop {String} id - is used to set the id of the input-tag.
 * @vue-prop {String} label - sets the label of the toggle.
 * @vue-prop {Boolean} omitLabel - if true, omits the toggle's built-in label.
 * @vue-prop {String} aria - sets a description of the toggle for assistive technology like screenreaders.
 * @vue-prop {Boolean} disabled - if true, the input is disabled.
 * @vue-prop {Boolean} checked - the current state of the toggle.
 * @vue-prop {Boolean} modelValue - the current state of the toggle.
 * @vue-prop {Function} interaction - can bind a function to be executed on using the toggle.
 */
export default {
    name: "SwitchInput",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        omitLabel: {
            type: Boolean,
            default: false
        },
        aria: {
            type: String,
            required: true
        },
        disabled: {
            type: Boolean,
            default: null,
            required: false
        },
        /** @deprecated Use modelValue instead. */
        checked: {
            type: Boolean,
            default: null,
            required: false
        },
        modelValue: {
            type: Boolean,
            default: null,
            required: false
        },
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        }
    },
    emits: ["update:modelValue"],
    methods: {
        /**
         * Emits the updated model value and calls the optional interaction callback.
         * @param {Event} event The input change event.
         * @returns {void}
         */
        updateModelValue (event) {
            this.$emit("update:modelValue", event.target.checked);
            this.interaction(event);
        },
        /**
         * Sets focus to the checkbox input element.
         * @public
         * @returns {void}
         */
        focus () {
            this.$refs.input?.focus();
        }
    }
};
</script>

<template>
    <div class="form-check form-switch">
        <input
            :id="id"
            ref="input"
            type="checkbox"
            role="switch"
            :aria-checked="modelValue ?? checked"
            :aria-label="aria"
            class="form-check-input"
            :disabled="disabled"
            :checked="modelValue ?? checked"
            @change="updateModelValue"
        >
        <label
            v-if="!omitLabel"
            class="form-check-label ps-2 pt-1 me-2"
            :for="id"
        >
            {{ $t(label) }}
        </label>
    </div>
</template>

<style lang="scss" scoped>


.form-check-input {
        width: 2.5rem;
        height: 1.5rem;

        &:focus-visible {
            outline: 2px solid var(--bs-primary, #0d6efd);
            outline-offset: 2px;
        }
}
</style>
