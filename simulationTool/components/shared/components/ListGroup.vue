<script>
import ConvertStyle from "../../../js/convertStyle";
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
        "removeFeature"
    ],
    data () {
        return {
            currentHightlightFeatureId: ""
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
            return Object.keys(this.itemList[0].getProperties()).length > 4;
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
            feature.set(key, value);
            this.$emit("setFeatureAttribute", value, key, feature.getId());
        },

        /**
         * Emits 'setHighlightFeature' to update a specific style of the feature.
         * @param {String} id - The feature id.
         * @returns {void}
         */

        /**
         * Sets the highlight style for a given feature and resets the style of the previously highlighted feature.
         * @param {Object} feature - The feature to be highlighted.
         * @returns {void}
         */
        setHighlightFeature (feature) {
            const oldHighlightFeature = this.itemList.find(item => item.getId() === this.currentHightlightFeatureId);

            if (oldHighlightFeature) {
                this.$emit("setFeatureStyle", oldHighlightFeature);
            }
            this.currentHightlightFeatureId = feature.getId();
            feature.setStyle(ConvertStyle.geoJsonToOpenlayers(this.highlightStyle));
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
            class="list-group-item list-group-item-action"
            :class="feature.getId() === currentHightlightFeatureId ? 'selected' : ''"
            role="button"
            tabindex="0"
            @click="setHighlightFeature(feature)"
            @keydown.enter="setHighlightFeature(feature)"
        >
            <div class="d-flex justify-content-between align-items-center">
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

