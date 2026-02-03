<script>
import {getMappedProperty} from "../js/getMappedProperty.js";
import IconButton from "../../../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters} from "vuex";
import Style from "ol/style/Style.js";

export default {
    name: "ListGroup",
    components: {
        IconButton
    },
    props: {
        hideable: {
            type: Boolean,
            default: true
        },
        highlightFeatureId: {
            type: [Number, String],
            default: () => ""
        },
        itemList: {
            type: Array,
            default: () => []
        },
        itemSchema: {
            type: Object,
            default: () => undefined
        },
        listKey: {
            type: String,
            default: () => ""
        },
        propertiesMapping: {
            type: Object,
            default: () => undefined
        },
        removeable: {
            type: Boolean,
            default: true
        },
        shownProperties: {
            type: Array,
            default: () => []
        },
        sortBy: {
            type: String,
            default: () => ""
        }
    },
    emits: [
        "setFeatureAttribute",
        "setFeatureStyle",
        "setHighlightFeature",
        "removeFeature"
    ],
    data () {
        return {
            currentHightlightFeatureId: "",
            currentFeature: undefined,
            sortedItemList: [],
            editBuffer: {},
            skipNextBlur: new Set()
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", {
            highlightStyle: "planningScenarioHighlightFeatureStyle"
        }),
        /**
         * Determines if the `propertiesMapping` object contains more than two properties.
         * @returns {boolean} `true` if the number of keys in `propertiesMapping` exceeds 2, otherwise `false`.
         */
        hasMultipleProperties () {
            return Object.keys(this.propertiesMapping).length > 2;
        }
    },
    watch: {
        /**
         * Sets the current highlight feature id according to the props.
         * @param {(String|Number)} val - The highlight feature id from props.
         */
        highlightFeatureId (val) {
            this.currentHightlightFeatureId = val;
            this.scrollToHighlightFeature(val);
        },
        /**
         * Resort when the sort key changes.
         */
        sortBy () {
            this.sortItemList();
        },
        /**
         * Resort when the items array reference changes.
         */
        itemList () {
            this.sortItemList();
        }
    },
    mounted () {
        // Initialize the sorted list once the component is mounted
        this.sortItemList();
    },
    methods: {
        /**
         * Populates sortedItemList with items from itemList sorted by the configured sortBy key.
         * Does not mutate the original itemList.
         * @returns {void}
         */
        sortItemList () {
            const base = Array.isArray(this.itemList) ? [...this.itemList] : [];

            if (typeof this.sortBy === "string" && this.sortBy !== "" && base.length) {
                const declaredType = this.itemSchema?.properties?.[this.sortBy]?.type;

                base.sort((a, b) => {
                    const rawA = a?.get?.(this.sortBy),
                        rawB = b?.get?.(this.sortBy),

                        // check for undefined/null first so they sort to the end
                        isAUndefined = rawA === undefined || rawA === null,
                        isBUndefined = rawB === undefined || rawB === null,
                        stringA = String(rawA).toLowerCase(),
                        stringB = String(rawB).toLowerCase();

                    if (isAUndefined && !isBUndefined) {
                        return 1;
                    }
                    if (!isAUndefined && isBUndefined) {
                        return -1;
                    }
                    if (isAUndefined && isBUndefined) {
                        return 0;
                    }

                    if (declaredType === "number") {
                        const numA = typeof rawA === "number" ? rawA : Number(String(rawA).replace(",", ".")),
                            numB = typeof rawB === "number" ? rawB : Number(String(rawB).replace(",", ".")),
                            isANaN = Number.isNaN(numA),
                            isBNaN = Number.isNaN(numB);

                        if (isANaN && !isBNaN) {
                            return 1;
                        }
                        if (!isANaN && isBNaN) {
                            return -1;
                        }
                        if (numA > numB) {
                            return 1;
                        }
                        if (numA < numB) {
                            return -1;
                        }
                        return 0;
                    }

                    // Default string comparison, case-insensitive
                    if (stringA > stringB) {
                        return 1;
                    }
                    if (stringA < stringB) {
                        return -1;
                    }
                    return 0;
                });
            }

            this.sortedItemList = base;
        },

        /**
         * Determines the appropriate icon class based on the style of the given feature.
         * @param {ol/Feature} feature - The feature object to evaluate.
         * @returns {String} The icon class.
         */
        getIcon (feature) {
            if (feature && (feature.getStyle() === null || feature.getStyle()?.getStroke() !== null)) {
                return "bi-eye";
            }

            return "bi-eye-slash";
        },

        /**
         * Gets the mapped property from key and configured object.
         */
        getMappedProperty,

        /**
         * Gets the properties of a feature to be shown in list.
         * @param {ol/Feature} feature - The feature.
         * @param {String[]} shownProperties - the properties of features to be shown in list.
         * @returns {Object} All shown properties of the feature.
         */
        getShownProperties (feature, shownProperties) {
            if (!Array.isArray(shownProperties) || !shownProperties.length) {
                return undefined;
            }

            const result = {};

            shownProperties.forEach(key => {
                if (Object.prototype.hasOwnProperty.call(feature.getProperties(), key)) {
                    result[key] = feature.getProperties()[key];
                }
            });

            if (Object.keys(result).length) {
                return result;
            }

            return undefined;
        },

        /**
         * Sets the current feature to show properties or not.
         * @param {ol/Feature} feature - The feature to be set as current.
         * @returns {void}
         */
        setCurrentFeature (feature) {
            if (feature.getId() === this.currentFeature?.getId()) {
                this.currentFeature = undefined;
            }
            else {
                this.currentFeature = feature;
            }
        },

        /**
         * Emits 'setFeatureAttribute' to update a specific attribute of a feature with a new value.
         * @param {InputEvent} event - The event containing the new value.
         * @param {String} key - The key of the attribute to be updated.
         * @param {ol/Feature} feature - The feature whose attribute needs to be updated.
         * @param {String} type - The type of the attribute (e.g., "number" or "string").
         * @returns {void}
         */
        setFeatureAttribute (event, key, feature, type) {
            const value = type === "number" ? event?.target?.valueAsNumber : event?.target?.value;

            feature.set(key, value);
            this.$emit("setFeatureAttribute", value, key, feature.getId());
        },

        /**
         * Returns input value prioritizing buffered edits first, then the given fallback.
         * @param {ol/Feature} feature - The feature being edited.
         * @param {String} key - The feature property key.
         * @param {*} fallback - Value to use when there's no buffered edit.
         * @returns {*} The buffered value if present; otherwise the fallback.
         */
        getInputValue (feature, key, fallback) {
            const fid = feature?.getId?.(),
                buffered = this.editBuffer[fid]?.[key];

            return buffered !== undefined ? buffered : fallback;
        },

        /**
         * Buffers input locally to emit to parent later.
         * @param {InputEvent} event - The input event containing the new value.
         * @param {String} key - The feature property key.
         * @param {ol/Feature} feature - The feature being edited.
         * @returns {void}
         */
        handleInput (event, key, feature) {
            const fid = feature?.getId?.();

            if (!fid) {
                return;
            }

            if (!this.editBuffer[fid]) {
                this.editBuffer[fid] = {};
            }

            this.editBuffer[fid][key] = event?.target?.value ?? "";
        },

        /**
         * Updates the feature, emits the change, and clears the buffer.
         * @param {ol/Feature} feature - The feature being edited.
         * @param {String} key - The feature property key.
         * @returns {void}
         */
        commitEdit (feature, key) {
            const fid = feature?.getId?.(),
                buffer = fid ? this.editBuffer[fid] : undefined,
                hasKey = Boolean(buffer) && Object.prototype.hasOwnProperty.call(buffer, key),
                raw = hasKey ? buffer[key] : undefined,
                type = this.itemSchema?.properties?.[key]?.type === "number" ? "number" : "string",
                value = type === "number" ? Number(raw) : raw;

            if (!fid || !hasKey) {
                return;
            }

            feature.set(key, value);
            this.$emit("setFeatureAttribute", value, key, feature.getId());

            delete buffer[key];
            if (Object.keys(buffer).length === 0) {
                delete this.editBuffer[fid];
            }
        },

        /**
         * Commit on Enter: writes buffered value, emits to parent, then blurs input.
         * Guards against double-commit when blur follows Enter.
         * @param {KeyboardEvent} event - The keyboard event.
         * @param {String} key - The feature property key.
         * @param {ol/Feature} feature - The feature being edited.
         * @returns {void}
         */
        onEnterCommit (event, key, feature) {
            const guardKey = `${feature.getId?.()}::${key}`;

            this.commitEdit(feature, key);
            this.skipNextBlur.add(guardKey);
            event?.target?.blur?.();
        },

        /**
         * Commit on blur, unless the change is already committed via 'Enter' key event.
         * @param {FocusEvent} event - The focus event.
         * @param {String} key - The feature property key.
         * @param {ol/Feature} feature - The feature being edited.
         * @returns {void}
         */
        onBlurCommit (event, key, feature) {
            const guardKey = `${feature.getId?.()}::${key}`;

            if (this.skipNextBlur.has(guardKey)) {
                this.skipNextBlur.delete(guardKey);
                return;
            }

            this.commitEdit(feature, key);
        },

        /**
         * Scrolls to the highlight feature list.
         * @param {String} val - The feature id as list div id.
         * @returns {void}
         */
        scrollToHighlightFeature (val) {
            if (typeof val !== "string") {
                return;
            }

            document.getElementById(val).scrollIntoView({
                block: "center",
                behavior: "smooth"
            });
        },

        /**
         * Toggles the style of a given feature.
         * If the feature currently has a stroke style, it resets the style to a new empty `Style` object.
         * Otherwise, it emits an event to set the feature's style externally.
         * Empty Style = not visible
         * @param {Object} feature - The feature whose style is to be toggled.
         * @returns {void}
         */
        toggleStyle (feature) {
            if (feature.getStyle()?.getStroke() !== null) {
                feature.setStyle(new Style());
            }
            else {
                this.$emit("setFeatureStyle", feature);
            }
        },
        /**
         * Checks if a feature has any properties that are undefined.
         * @param {Object} feature
         */
        hasUndefinedProperty (feature) {
            if (!feature || !this.propertiesMapping) {
                return false;
            }
            return Object.keys(this.propertiesMapping).some(
                key => feature.get(key) === undefined
            );
        }
    }
};
</script>

<template>
    <div class="list-group list-group-flush">
        <div
            v-for="(feature) in sortedItemList"
            :id="feature.getId()"
            :key="feature.getId()"
            class="list-group-item list-group-item-action p-0"
            role="button"
            tabindex="0"
            @click="$emit('setHighlightFeature', feature)"
            @keydown.enter="$emit('setHighlightFeature', feature)"
        >
            <div
                class="d-flex justify-content-between align-items-center p-2"
                :class="feature.getId() === currentHightlightFeatureId ? 'selected' : ''"
            >
                <div
                    v-for="(value, key, idx) in getShownProperties(feature, shownProperties)"
                    :key="listKey + key"
                    class="d-flex me-3 no-stepper-arrows"
                    :class="idx === 0 ? 'flex-grow-1' : ''"
                >
                    <label
                        :for="'property-' + listKey + '-' + key + '-' + idx + '-' + feature.getId()"
                        class="col-form-label me-3"
                        @click.prevent
                    >
                        {{ getMappedProperty(key, propertiesMapping) }}
                    </label>
                    <input
                        :id="'property-' + listKey + '-' + key + '-' + idx + '-' + feature.getId()"
                        :type="typeof value === 'number' ? 'number' : 'text'"
                        class="form-control text-end w-50"
                        :value="getInputValue(feature, key, value)"
                        :inputmode="typeof value === 'number' ? 'decimal' : 'text'"
                        @input="handleInput($event, key, feature)"
                        @blur="onBlurCommit($event, key, feature)"
                        @keydown.enter.prevent="onEnterCommit($event, key, feature)"
                    >
                </div>
                <div
                    v-if="hasMultipleProperties"
                    :class="typeof getShownProperties(feature, shownProperties) === 'undefined' ? 'flex-grow-1' : ''"
                >
                    <i
                        v-if="hasUndefinedProperty(feature)"
                        class="bi-exclamation-triangle-fill text-warning"
                        role="img"
                    />
                    <button
                        type="button"
                        class="btn btn-link"
                        @click="setCurrentFeature(feature)"
                    >
                        <i
                            :class="currentFeature?.getId() === feature.getId() ? 'bi-chevron-down' : 'bi-chevron-up'"
                            role="img"
                        />
                        {{ $t('additional:modules.tools.simulationTool.showProperties') }}
                    </button>
                </div>
                <IconButton
                    v-if="hideable"
                    :icon="getIcon(feature)"
                    :class-array="['me-3']"
                    :aria="$t('additional:modules.tools.simulationTool.toggleVisibility')"
                    @click.stop="toggleStyle(feature)"
                />
                <IconButton
                    v-if="removeable"
                    icon="bi-trash"
                    :aria="$t('additional:modules.tools.simulationTool.toggleVisibility')"
                    @click.stop="$emit('removeFeature', feature.getId())"
                />
            </div>
            <template
                v-if="currentFeature?.getId() === feature.getId()"
            >
                <div
                    v-for="(value, key, idx) in propertiesMapping"
                    :key="idx"
                    class="m-3 d-flex justify-content-between no-stepper-arrows"
                >
                    <template v-if="getMappedProperty(key, propertiesMapping) !== key">
                        <label
                            :for="`${key}-${feature.getId()}`"
                            class="col-form-label"
                            @click.prevent
                        >
                            <i
                                v-if="feature.get(key) === undefined"
                                class="bi-exclamation-triangle-fill text-warning fs-5 me-2"
                                role="img"
                            />
                            {{ getMappedProperty(key, propertiesMapping) }}
                        </label>
                        <input
                            :id="`${key}-${feature.getId()}`"
                            :type="itemSchema.properties[key].type === 'number' ? 'number' : 'text'"
                            class="form-control text-end w-50"
                            :value="getInputValue(feature, key, feature.get(key))"
                            :inputmode="itemSchema.properties[key].type === 'number' ? 'decimal' : 'text'"
                            @input="handleInput($event, key, feature)"
                            @blur="onBlurCommit($event, key, feature)"
                            @keydown.enter.prevent="onEnterCommit($event, key, feature)"
                        >
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">

.no-stepper-arrows {
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
}

.selected {
    background-color: $light_blue;
}
</style>

