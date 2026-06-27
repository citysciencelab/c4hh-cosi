<script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

/**
 * Component to display a list of all measurements with undo/redo and edit actions.
 * @module modules/MeasureList
 */
export default {
    name: "MeasureList",
    components: {
        IconButton,
        InputText
    },
    props: {
        /** List of enriched measurements to display. */
        measurementList: {
            type: Array,
            required: true
        },
        /** Currently selected (drawing) feature ID. */
        selectedFeatureId: {
            type: [String, Number],
            default: null
        },
        /** ID of the feature currently in modify mode. */
        currentlyModifyingFeatureId: {
            type: [String, Number],
            default: null
        },
        /** Active measurement being drawn (value + type), or null. */
        activeMeasurement: {
            type: Object,
            default: null
        },
        /** Whether the active sketch has points that can be undone. */
        canUndoActive: {
            type: Boolean,
            default: false
        },
        /** Whether the active sketch has points that can be redone. */
        canRedoActive: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        "modify-measurement",
        "delete-measurement",
        "undo-action",
        "redo-action",
        "highlight-feature",
        "unhighlight-feature",
        "rename-measurement",
        "undo-active-sketch",
        "redo-active-sketch"
    ],
    data () {
        return {
            editingFeatureId: null,
            editingName: ""
        };
    },
    methods: {
        /**
         * Returns the Bootstrap icon class for a measurement geometry type.
         * @param {String} type - "LineString" or "Polygon"
         * @returns {String} icon class
         */
        getTypeIcon (type) {
            return type === "LineString" ? "bi-rulers" : "bi-bounding-box";
        },
        /**
         * Returns the translated label for a measurement geometry type.
         * @param {String} type - "LineString" or "Polygon"
         * @returns {String} translated label
         */
        getTypeLabel (type) {
            return type === "LineString"
                ? this.$t("common:modules.measure.lineString")
                : this.$t("common:modules.measure.polygon");
        },
        /**
         * Returns the display name for a measurement, preferring the custom name.
         * @param {Object} measurement - enriched measurement object
         * @returns {String} display name
         */
        getDisplayName (measurement) {
            return measurement.customName || this.getTypeLabel(measurement.type);
        },
        /**
         * Returns whether the given feature is currently in modify mode.
         * @param {String|Number} featureId - feature ID
         * @returns {Boolean} true if the feature is in modify mode
         */
        isModifying (featureId) {
            if (!this.currentlyModifyingFeatureId) {
                return false;
            }
            return Number(this.currentlyModifyingFeatureId) === Number(featureId);
        },
        /**
         * Returns the label for the modify toggle button.
         * @param {String|Number} featureId - feature ID
         * @returns {String} the translated button label
         */
        getModifyButtonText (featureId) {
            return this.isModifying(featureId)
                ? this.$t("common:modules.measure.edit.finishModify")
                : this.$t("common:modules.measure.edit.modify");
        },
        /**
         * Starts inline name editing for a measurement entry.
         * @param {Object} measurement - enriched measurement object
         * @returns {void}
         */
        startEditingName (measurement) {
            this.editingFeatureId = measurement.id;
            this.editingName = measurement.customName || this.getTypeLabel(measurement.type);
            this.$nextTick(() => {
                const inputComponent = this.$refs[`nameInput-${measurement.id}`];

                if (inputComponent && inputComponent[0]) {
                    if (typeof inputComponent[0].focus === "function") {
                        inputComponent[0].focus();
                    }
                    const nativeInput = inputComponent[0].$refs?.input;

                    if (nativeInput) {
                        nativeInput.select();
                    }
                }
            });
        },
        /**
         * Commits the edited name and emits it to the parent.
         * @param {String|Number} featureId - feature ID
         * @returns {void}
         */
        saveEditedName (featureId) {
            const trimmedName = this.editingName.trim();

            if (trimmedName) {
                this.$emit("rename-measurement", {featureId, name: trimmedName});
            }
            this.editingFeatureId = null;
            this.editingName = "";
        },
        /**
         * Cancels inline name editing without saving.
         * @returns {void}
         */
        cancelEditingName () {
            this.editingFeatureId = null;
            this.editingName = "";
        }
    }
};
</script>

<template>
    <div>
        <div
            v-if="activeMeasurement"
            class="active-measurement-container mb-3"
        >
            <h6 class="active-measurement-title mb-2">
                {{ $t("common:modules.measure.activeMeasurement") }}
            </h6>
            <div class="active-measurement-card">
                <div class="active-measurement-info">
                    <span class="active-measurement-type">
                        <i :class="getTypeIcon(activeMeasurement.type)" />
                        {{ getTypeLabel(activeMeasurement.type) }}
                    </span>
                    <span class="active-measurement-value">
                        {{ activeMeasurement.displayValue }}
                    </span>
                </div>
                <div class="active-measurement-actions">
                    <IconButton
                        id="measure-active-undo"
                        :aria="$t('common:modules.measure.edit.undo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!canUndoActive"
                        :interaction="() => $emit('undo-active-sketch')"
                        icon="bi-arrow-left"
                        :title="$t('common:modules.measure.edit.undo')"
                    />
                    <IconButton
                        id="measure-active-redo"
                        :aria="$t('common:modules.measure.edit.redo')"
                        :class-array="['btn-sm', 'btn-light']"
                        :disabled="!canRedoActive"
                        :interaction="() => $emit('redo-active-sketch')"
                        icon="bi-arrow-right"
                        :title="$t('common:modules.measure.edit.redo')"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="measurementList.length > 0"
            class="measure-list-container mb-3"
        >
            <h6 class="measure-list-title mb-2">
                {{ $t("common:modules.measure.measurementList") }}
            </h6>
            <div
                class="measure-list"
            >
                <div
                    v-for="measurement in measurementList"
                    :key="measurement.id"
                    class="measure-list-item"
                    :class="{ 'modifying': isModifying(measurement.id) }"
                    role="button"
                    tabindex="0"
                    :aria-label="getDisplayName(measurement) + ' – ' + measurement.displayValue"
                    @mouseenter="$emit('highlight-feature', measurement.id)"
                    @mouseleave="$emit('unhighlight-feature', measurement.id)"
                    @focus="$emit('highlight-feature', measurement.id)"
                    @blur="$emit('unhighlight-feature', measurement.id)"
                    @keydown.enter.self="$emit('highlight-feature', measurement.id)"
                    @keydown.space.self.prevent="$emit('highlight-feature', measurement.id)"
                >
                    <div class="measure-item-info">
                        <span
                            v-if="editingFeatureId !== measurement.id"
                            class="measure-item-type"
                            role="button"
                            tabindex="0"
                            :title="$t('common:modules.measure.edit.renameHint')"
                            @click="startEditingName(measurement)"
                            @keydown.enter="startEditingName(measurement)"
                            @keydown.space.prevent="startEditingName(measurement)"
                        >
                            <i :class="getTypeIcon(measurement.type)" />
                            <span class="measure-item-name">{{ getDisplayName(measurement) }}</span>
                            <i class="bi-pencil-fill edit-icon" />
                        </span>
                        <InputText
                            v-else
                            :id="'nameInput-' + measurement.id"
                            :ref="'nameInput-' + measurement.id"
                            v-model="editingName"
                            :label="$t('common:modules.measure.edit.nameLabel')"
                            :placeholder="$t('common:modules.measure.edit.namePlaceholder')"
                            :class-obj="['form-control-sm', 'measure-item-name-input']"
                            @keydown.enter="saveEditedName(measurement.id)"
                            @keydown.esc="cancelEditingName"
                            @blur="saveEditedName(measurement.id)"
                        />
                        <span class="measure-item-value">
                            {{ measurement.displayValue }}
                        </span>
                    </div>
                    <div class="measure-item-actions">
                        <IconButton
                            :id="'measure-item-undo-' + measurement.id"
                            :aria="$t('common:modules.measure.edit.undo')"
                            :class-array="['btn-sm', 'btn-light']"
                            :disabled="!measurement.canUndo"
                            :interaction="() => $emit('undo-action', measurement.id)"
                            icon="bi-arrow-left"
                            :title="$t('common:modules.measure.edit.undo')"
                        />
                        <IconButton
                            :id="'measure-item-redo-' + measurement.id"
                            :aria="$t('common:modules.measure.edit.redo')"
                            :class-array="['btn-sm', 'btn-light']"
                            :disabled="!measurement.canRedo"
                            :interaction="() => $emit('redo-action', measurement.id)"
                            icon="bi-arrow-right"
                            :title="$t('common:modules.measure.edit.redo')"
                        />
                        <IconButton
                            :id="'measure-item-modify-' + measurement.id"
                            :aria="getModifyButtonText(measurement.id)"
                            :class-array="['btn-sm', 'btn-light', isModifying(measurement.id) ? 'active' : '']"
                            :interaction="() => $emit('modify-measurement', measurement.id)"
                            icon="bi-tools"
                            :title="getModifyButtonText(measurement.id)"
                        />
                        <IconButton
                            :id="'measure-item-delete-' + measurement.id"
                            :aria="$t('common:modules.measure.edit.delete')"
                            :class-array="['btn-sm', 'btn-light']"
                            :interaction="() => $emit('delete-measurement', measurement.id)"
                            icon="bi-trash"
                            :title="$t('common:modules.measure.edit.delete')"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.active-measurement-container {
    margin-top: 1rem;

    .active-measurement-title {
        font-weight: bold;
        font-size: 0.9rem;
        color: $dark_grey;
    }

    .active-measurement-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 2px solid $dark_blue;
        border-radius: 6px;
        background-color: lighten($dark_blue, 70%);

        .active-measurement-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .active-measurement-type {
                font-size: 0.9rem;
                color: $dark_grey;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-weight: 500;

                i {
                    font-size: 1rem;
                    color: $dark_blue;
                }
            }

            .active-measurement-value {
                font-weight: bold;
                font-size: 1rem;
                color: $dark_blue;
            }
        }

        .active-measurement-actions {
            display: flex;
            gap: 0.5rem;
        }
    }
}

.measure-list-container {
    .measure-list-title {
        font-weight: bold;
        font-size: 0.9rem;
        margin-top: 0.75rem;
    }

    .measure-list {
        max-height: 500px;
        overflow-y: auto;
        border: 1px solid $light_grey;
        border-radius: 4px;
        background-color: $white;
    }

    .measure-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border-bottom: 1px solid $light_grey;
        cursor: default;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background-color: $light_blue;
        }

        .measure-item-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .measure-item-type {
                font-size: 0.85rem;
                color: $dark_grey;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                cursor: pointer;
                padding: 0.25rem 0.375rem;
                border-radius: 4px;
                border: 1px solid transparent;

                i {
                    font-size: 0.9rem;
                }

                .measure-item-name {
                    flex: 1;
                }

                .edit-icon {
                    font-size: 0.75rem;
                    opacity: 0;
                    color: $dark_grey;
                }

                &:hover {
                    background-color: lighten($light_blue, 5%);
                    border-color: darken($light_blue, 10%);

                    .edit-icon {
                        opacity: 1;
                    }
                }

                &:focus {
                    outline: 2px solid $dark_blue;
                    outline-offset: 2px;
                }
            }

            .measure-item-name-input {
                font-size: 0.85rem;
                padding: 0.125rem 0.25rem;
                height: auto;
            }

            .measure-item-value {
                font-weight: bold;
                font-size: 0.9rem;
            }
        }

        .measure-item-actions {
            display: flex;
            gap: 0.25rem;
        }

        &.modifying {
            border-left: 3px solid $dark_blue;
            background-color: lighten($dark_blue, 65%);
        }
    }
}
</style>
