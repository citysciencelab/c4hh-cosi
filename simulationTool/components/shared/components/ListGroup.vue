<script>
import {getMappedProperty} from "../js/getMappedProperty";
import IconButton from "../../../../../src/shared/modules/buttons/components/IconButton.vue";
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
        itemList: {
            type: Array,
            default: () => []
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
        }
    },
    data () {
        return {
            currentHightlightFeatureId: ""
        };
    },
    computed: {
        /**
         * Checks if the first feature in the list has more than three properties, include the geometry.
         * @returns {Boolean} True if the first feature has more than three properties, false otherwise.
         */
        hasMultipleProperties () {
            return Object.keys(this.itemList[0].getProperties()).length > 3;
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

            Object.keys(feature.getProperties()).forEach(key => {
                if (shownProperties.includes(key)) {
                    result[key] = feature.getProperties()[key];
                }
            });

            if (Object.keys(result).length) {
                return result;
            }

            return undefined;
        },

        /**
         * Extracts the properties of a feature, excluding the geometry property.
         * @param {ol/Feature} feature - The feature.
         * @returns {Object} All properties of the feature except the geometry.
         */
        propertiesWithoutGeometry (feature) {
            const properties = {...feature.getProperties()};

            delete properties.geometry;
            return properties;
        },

        /**
         * Emits 'setFeatureAttribute' to update a specific attribute of a feature with a new value.
         * @param {InputEvent} event - The event containing the new value.
         * @param {String|Number} oldValue - The old value of the attribute.
         * @param {String} key - The key of the attribute to be updated.
         * @param {ol/Feature} feature - The feature whose attribute needs to be updated.
         * @returns {void}
         */
        setFeatureAttribute (event, oldValue, key, feature) {
            const value = typeof oldValue === "number" ? event?.target?.valueAsNumber : event?.target?.value;

            if (Number.isNaN(value)) {
                return;
            }
            this.$emit("setFeatureAttribute", value, key, feature.getId());
        },

        /**
         * Emits 'setHighlightFeature' to update a specific style of the feature.
         * @param {String} id - The feature id.
         * @returns {void}
         */
        setHighlightFeature (id) {
            this.currentHightlightFeatureId = id;
            this.$emit("setHighlightFeature", id);
        },

        /**
         * Emits 'setFeatureStyle' to toggle the style of the given feature.
         * If the features current style is `null`, a new empty `Style` is assigned to it.
         * If the feature already has a style, it is reset to `null`.
         * Empty Style = not visible. Null = layer style.
         * @param {ol/Feature} feature - The feature whose style is being toggled.
         * @returns {void}
         */
        toggleStyle (feature) {
            if (feature.getId() === this.currentHightlightFeatureId) {
                if (feature.getStyle()?.getStroke() !== null) {
                    this.$emit("setFeatureStyle", new Style(), feature.getId());
                }
                else {
                    this.$emit("setFeatureStyle", null, feature.getId());
                    this.$emit("setHighlightFeature", feature.getId());
                }
            }
            else if (feature.getStyle() === null) {
                this.$emit("setFeatureStyle", new Style(), feature.getId());
            }
            else {
                this.$emit("setFeatureStyle", null, feature.getId());
            }
        }
    }
};
</script>

<template>
    <div class="list-group list-group-flush">
        <div
            v-for="(feature, index) in itemList"
            :key="index"
            class="list-group-item list-group-item-action"
            :class="feature.getId() === currentHightlightFeatureId ? 'selected' : ''"
            role="button"
            tabindex="0"
            @click="setHighlightFeature(feature.getId())"
            @keydown.enter="setHighlightFeature(feature.getId())"
        >
            <div class="d-flex justify-content-between align-items-center">
                <template v-if="!hasMultipleProperties">
                    <div
                        v-for="(value, key, idx) in propertiesWithoutGeometry(feature)"
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
                            @input="event => setFeatureAttribute(event, value, key, feature)"
                        >
                    </div>
                </template>
                <template v-else>
                    <div v-if="typeof getShownProperties(feature, shownProperties) !== 'undefined'">
                        <div
                            v-for="(value, key, idx) in getShownProperties(feature, shownProperties)"
                            :key="listKey + key"
                            class="d-flex no-stepper-arrows"
                            :class="idx === 0 ? 'flex-grow-1' : ''"
                        >
                            <input
                                :id="'property-' + listKey + '-' + key + '-' + idx"
                                :type="typeof value === 'number' ? 'number' : 'text'"
                                class="form-control"
                                :value="value"
                                :inputmode="typeof value === 'number' ? 'decimal' : 'text'"
                                @input="event => setFeatureAttribute(event, value, key, feature)"
                            >
                        </div>
                    </div>
                    <div
                        :class="typeof getShownProperties(feature, shownProperties) === 'undefined' ? 'flex-grow-1' : ''"
                    >
                        <button
                            type="button"
                            class="btn btn-link"
                        >
                            {{ $t('additional:modules.tools.simulationTool.showProperties') }}
                        </button>
                    </div>
                </template>
                <IconButton
                    v-if="hideable"
                    :icon="getIcon(feature)"
                    class="me-3"
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

