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
         * Checks if the first feature in the list has more than three properties, include the geometry.
         * @returns {Boolean} True if the first feature has more than three properties, false otherwise.
         */
        hasMultipleProperties () {
            const properties = this.extractedProperties(this.itemList[0]);

            return Object.keys(properties).length > 4;
        }
    },
    watch: {
        /**
         * Sets the current highlight feature id accroding to the props.
         * @param {String} val the highlight feature id from props.
         */
        highlightFeatureId (val) {
            this.currentHightlightFeatureId = val;
        }
    },
    methods: {
        /**
         * Extracts the properties of a given feature, excluding specific keys.
         * @param {ol/Feature} feature - The feature object containing properties.
         * @returns {Object} A new object containing all properties of the feature except for `geometry` and `created`.
         */
        extractedProperties (feature) {
            const properties = {...feature.getProperties()};

            delete properties.geometry;
            delete properties.created;
            delete properties.fid;
            return properties;
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
         * @param {String|Number} oldValue - The old value of the attribute.
         * @param {String} key - The key of the attribute to be updated.
         * @param {ol/Feature} feature - The feature whose attribute needs to be updated.
         * @returns {void}
         */
        setFeatureAttribute (event, oldValue, key, feature) {
            const value = typeof oldValue === "number" ? event?.target?.valueAsNumber : event?.target?.value;

            feature.set(key, value);
            this.$emit("setFeatureAttribute", value, key, feature.getId());
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
        }
    }
};
</script>

<template>
    <div class="list-group list-group-flush">
        <div
            v-for="(feature, index) in itemList"
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
                <template v-if="!hasMultipleProperties">
                    <div
                        v-for="(value, key, idx) in extractedProperties(feature)"
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
                            @click="setCurrentFeature(feature)"
                        >
                            <i
                                :class="currentFeature?.getId() === feature.getId() ? 'bi-chevron-down' : 'bi-chevron-up'"
                                role="img"
                            />
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
            <template
                v-if="currentFeature?.getId() === feature.getId()"
            >
                <div
                    v-for="(value, key, idx) in extractedProperties(feature)"
                    :key="idx"
                    class="m-3 d-flex justify-content-between"
                >
                    <template v-if="getMappedProperty(key, propertiesMapping) !== key">
                        <label
                            :for="`${key}-${feature.getId()}`"
                            class="col-form-label"
                        >
                            {{ getMappedProperty(key, propertiesMapping) }}
                        </label>
                        <input
                            :id="`${key}-${feature.getId()}`"
                            :type="typeof value === 'number' ? 'number' : 'text'"
                            class="form-control text-end w-50"
                            :value="value"
                            :inputmode="typeof value === 'number' ? 'decimal' : 'text'"
                            @input="event => setFeatureAttribute(event, value, key, feature)"
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

