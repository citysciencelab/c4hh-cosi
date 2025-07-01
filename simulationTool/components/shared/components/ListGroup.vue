<script>
import {getMappedProperty} from "../js/getMappedProperty";
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
            currentFeature: undefined
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
        },

        /**
         * Returns the sorted item list according to configured property.
         * @returns {Object[]} the sorted item list.
         */
        sortedItemList () {
            const list = this.itemList;

            if (typeof this.sortBy === "string" && this.sortBy !== "" && list.length) {
                list.sort((a, b) => {
                    if (a.get(this.sortBy) > b.get(this.sortBy)) {
                        return 1;
                    }
                    else if (a.get(this.sortBy) < b.get(this.sortBy)) {
                        return -1;
                    }
                    return 0;
                });
            }

            return list;
        }
    },
    watch: {
        /**
         * Sets the current highlight feature id according to the props.
         * @param {String} val the highlight feature id from props.
         */
        highlightFeatureId (val) {
            this.currentHightlightFeatureId = val;
            this.scrollToHighlightFeature(val);
        }
    },
    methods: {

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
            v-for="(feature, index) in sortedItemList"
            :id="feature.getId()"
            :key="index"
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
                        :for="'property-' + listKey + '-' + key + '-' + idx"
                        class="col-form-label me-3"
                    >
                        {{ getMappedProperty(key, propertiesMapping) }}
                    </label>
                    <input
                        :id="'property-' + listKey + '-' + key + '-' + idx"
                        :type="typeof value === 'number' ? 'number' : 'text'"
                        class="form-control text-end w-50"
                        :value="value"
                        :inputmode="typeof value === 'number' ? 'decimal' : 'text'"
                        @input="event => setFeatureAttribute(event, key, feature, itemSchema.properties[key].type)"
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
                            :value="feature.get(key)"
                            :inputmode="itemSchema.properties[key].type === 'number' ? 'decimal' : 'text'"
                            @input="event => setFeatureAttribute(event, key, feature, itemSchema.properties[key].type)"
                        >
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~variables";

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

