<script>
export default {
    name: "HrSnackbar",

    props: {
        modelValue: {
            type: Boolean,
            required: true
        },
        message: {
            type: String,
            default: ""
        },
        timeout: {
            type: Number,
            default: 3000
        },
        color: {
            type: String,
            default: "success",
            validator: value => ["success", "error", "warning", "info"].includes(value)
        },
        closable: {
            type: Boolean,
            default: false
        }
    },

    emits: ["update:modelValue"],

    data () {
        return {
            hideTimeoutId: null
        };
    },

    computed: {
        snackbarClasses () {
            return [
                "hr-snackbar",
                `hr-snackbar--${this.color}`
            ];
        }
    },

    watch: {
        modelValue (value) {
            if (value) {
                this.startHideTimeout();
            }
            else {
                this.clearHideTimeout();
            }
        }
    },

    beforeUnmount () {
        this.clearHideTimeout();
    },

    methods: {
        /**
         * Starts the auto-hide timeout.
         * @returns {void}
         */
        startHideTimeout () {
            this.clearHideTimeout();
            this.hideTimeoutId = window.setTimeout(() => {
                this.$emit("update:modelValue", false);
            }, this.timeout);
        },

        /**
         * Clears the current auto-hide timeout.
         * @returns {void}
         */
        clearHideTimeout () {
            if (this.hideTimeoutId) {
                window.clearTimeout(this.hideTimeoutId);
                this.hideTimeoutId = null;
            }
        },

        /**
         * Closes the snackbar manually.
         * @returns {void}
         */
        closeSnackbar () {
            this.$emit("update:modelValue", false);
        }
    }
};
</script>

<template>
    <transition name="hr-snackbar-fade">
        <div
            v-if="modelValue && message"
            :class="snackbarClasses"
            role="status"
            aria-live="polite"
        >
            <div class="hr-snackbar__content">
                <i
                    v-if="color === 'success'"
                    class="bi-check2-circle hr-snackbar__icon"
                />
                <i
                    v-else-if="color === 'error'"
                    class="bi-exclamation-octagon hr-snackbar__icon"
                />

                <span class="hr-snackbar__message">
                    {{ message }}
                </span>
                <button
                    v-if="closable"
                    type="button"
                    class="hr-snackbar__close"
                    :aria-label="$t('additional:modules.snackbar.close')"
                    @click="closeSnackbar"
                >
                    <i class="bi-x-lg" />
                </button>
            </div>
        </div>
    </transition>
</template>

<style lang="scss" scoped>
.hr-snackbar {
    position: relative;
    width: 100%;
    z-index: 2000;
    display: flex;
    justify-content: center;
    padding-top: 0.5rem;
    pointer-events: none;
}

.hr-snackbar__content {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    max-width: 600px;
    padding: 1rem 1.25rem;
    border-radius: 0.375rem;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.hr-snackbar--success .hr-snackbar__content {
    background-color: #4a6a96;
}

.hr-snackbar--error .hr-snackbar__content {
    background-color: #dc3545;
}

.hr-snackbar__icon {
    font-size: 1.4rem;
    display: flex;
    align-items: center;
}

.hr-snackbar__message {
    flex: 1;
    font-size: 1rem;
    font-weight: 400;
}

.hr-snackbar__close {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    opacity: 0.8;

    &:hover {
        opacity: 1;
    }
}

.hr-snackbar-fade-enter-active,
.hr-snackbar-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.hr-snackbar-fade-enter-from,
.hr-snackbar-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
