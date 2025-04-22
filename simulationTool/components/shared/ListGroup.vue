<script>
import IconButton from "../../../../src/shared/modules/buttons/components/IconButton.vue";
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
        removeable: {
            type: Boolean,
            default: true
        }
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
            if (feature && feature.getStyle() === null) {
                return "bi-eye";
            }
            return "bi-eye-slash";
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
         * @param {String} value - The value to set.
         * @param {String} key - The key of the attribute to be updated.
         * @param {ol/Feature} feature - The feature whose attribute needs to be updated.
         * @returns {void}
         */
        setFeatureAttribute (value, key, feature) {
            this.$emit("setFeatureAttribute", value, key, feature.getId());
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
            if (feature.getStyle() === null) {
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
    <ul class="list-group list-group-flush">
        <li
            v-for="(feature, index) in itemList"
            :key="index"
            class="list-group-item list-group-item-action"
        >
            <div class="d-flex justify-content-between align-items-center">
                <template v-if="!hasMultipleProperties">
                    <div
                        v-for="(value, key, idx) in propertiesWithoutGeometry(feature)"
                        :key="key"
                        class="d-flex me-3"
                        :class="idx === 0 ? 'flex-grow-1' : ''"
                    >
                        <label
                            :for="'property-' + key + '-' + idx"
                            class="col-form-label me-3"
                        >
                            {{ key }}
                        </label>
                        <input
                            :id="'property-' + key + '-' + idx"
                            type="text"
                            class="form-control text-end w-50"
                            :value="value"
                            @input="event => setFeatureAttribute(event.target.value, key, feature)"
                        >
                    </div>
                </template>
                <template v-else>
                    <div class="flex-grow-1">
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
                    @click="toggleStyle(feature)"
                />
                <IconButton
                    v-if="removeable"
                    icon="bi-trash"
                    :aria="$t('additional:modules.tools.simulationTool.toggleVisibility')"
                    @click="$emit('removeFeature', feature.getId())"
                />
            </div>
        </li>
    </ul>
</template>

