<script>
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";

/**
 * Progress Bar
 * @module modules/ProgressBar
 * @vue-prop {Object} paging - Paging object with current page and total amount.
 */
export default {
    name: "ProgressBar",
    components: {
        FlatButton
    },
    props: {
        paging: {
            type: Object,
            required: false,
            default: () => ({
                page: 1,
                total: 1
            })
        }
    },
    emits: ["stop"],
    methods: {
        /**
         * Gets the value in percent.
         * @returns {void}
         */
        getValueInPercent () {
            if (this.paging.total <= 0) {
                return 100;
            }

            return Math.min(
                100,
                Math.round(100 / this.paging.total * this.paging.page)
            );
        },
        /**
         * Emits a stop event to cancel the filter.
         * @returns {void}
         */
        stopFilter () {
            this.$emit("stop");
        }
    }
};
</script>

<template>
    <div
        class="toast show filter-progress-toast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-bs-autohide="false"
    >
        <div class="toast-body">
            <div class="progress-header">
                <span class="progress-title">
                    Filter werden aktualisiert ...
                </span>

                <span class="progress-value">
                    {{ getValueInPercent() }}%
                </span>

                <FlatButton
                    class="btn btn-secondary me-1"
                    :aria-label="$t('common:modules.filter.button.stop')"
                    :text="$t('common:modules.filter.button.stop')"
                    :icon="'bi-x-circle'"
                    :interaction="stopFilter"
                />
            </div>

            <div
                class="progress filter-progress"
                role="progressbar"
                :aria-valuenow="getValueInPercent()"
                aria-valuemin="0"
                :aria-valuemax="paging.total"
            >
                <div
                    class="progress-bar"
                    :style="{width: `${getValueInPercent()}%`}"
                />
            </div>

            <div class="progress-description">
                Daten werden geladen
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.filter-progress-toast {
    position: fixed;
    right: 50px;
    bottom: 34px;
    width: 320px;
    max-width: calc(100vw - 40px);
    background-color: rgba($white, 0.96);
    border: 0;
    border-radius: 14px;
    box-shadow:
        0 4px 10px rgba(0, 0, 0, 0.12),
        0 8px 24px rgba(0, 0, 0, 0.08);
    z-index: 1090;
}

.toast-body {
    width: 100%;
    padding: 10px 14px 9px;
}

.progress-header {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
}

.progress-title {
    flex: 1;
    min-width: 0;
    color: $gray-900;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
}

.progress-value {
    flex-shrink: 0;
    color: $secondary;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
}

.progress-close {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    padding: 4px;
    margin: 0 0 0 2px;
    font-size: 10px;
}

.filter-progress {
    width: 100%;
    height: 9px;
    margin-top: 7px;
    background-color: $gray-300;
    border-radius: 999px;
    overflow: hidden;
}

.filter-progress .progress-bar {
    height: 100%;
    background-color: $secondary;
    border-radius: 999px;
    transition: width 0.2s ease;
}

.progress-description {
    margin-top: 4px;
    color: $gray-600;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;
}

@media (max-width: 576px) {
    .filter-progress-toast {
        right: 16px;
        bottom: 16px;
        width: calc(100vw - 32px);
        max-width: 320px;
    }
}
</style>
