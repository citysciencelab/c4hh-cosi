<script>
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import Feature from "ol/Feature.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import hash from "object-hash";
import {mapActions} from "vuex";
import Point from "ol/geom/Point";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";

export default {
    components: {
        DropdownAutocomplete,
        FlatButton
    },

    inject: [
        "addFeatureToScenario",
        "featureProperties"
    ],

    props: {
        isSubjectDataSelected: {
            type: Boolean,
            default: false
        },
        layerList: {
            type: Array,
            default: () => []
        }
    },

    emits: [
        "add-object-card",
        "set-selected-layer",
        "set-is-location-active",
        "subject-data-selected",
        "toggle-object-status"
    ],

    data () {
        return {
            conditionKey: null,
            layer: null,
            styleCondition: null,
            styleConditionsList: []
        };
    },

    computed: {
        /**
         * Checks if there are any style conditions available for the selected layer.
         * @returns {boolean} True if there are style conditions, false otherwise.
         */
        hasStyleConditions () {
            return this.styleConditionsList.length > 0;
        },

        /*
        * Checks if the selected layer has a defined cluster distance, indicating that it is clustered.
        * @returns {boolean} True if the selected layer is clustered, false otherwise.
        */
        isLayerClustered () {
            return typeof this.layer?.attributes?.clusterDistance !== "undefined";
        },


        /**
         * Retrieves the style object for the selected layer based on its style ID.
         * @returns {Object} The style object for the selected layer.
         */
        layerStyleObject () {
            return styleList.returnStyleObject(this.layer?.attributes?.styleId);
        }
    },

    beforeUnmount () {
        this.stopPlacement();
    },

    methods: {
        ...mapActions("Maps", [
            "registerListener",
            "unregisterListener"
        ]),

        /**
         * Stops the feature placement process, resets relevant data properties.
         * @returns {void}
         */
        cancelPlacement () {
            this.stopPlacement();
            this.resetData();
        },

        /**
         * Creates a new feature with the given geometry and associates it with the selected layer.
         * @param {Object} geometry - The geometry object for the new feature.
         * @param {Object} selectedLayer - The selected map layer.
         * @param {boolean} hasStyleConditions - Indicates if the selected layer has style conditions.
         * @returns {void}
         */
        createFeature (geometry, layer, hasStyleConditions) {
            const feature = new Feature({geometry}),
                  olLayer = layer.getLayer(),
                  label = !hasStyleConditions ? olLayer.get("name") : olLayer.get("name") + " - " + this.styleCondition;

            feature.set("isSimulation", true);
            feature.setId(hash({geom: geometry}));
            if (hasStyleConditions) {
                feature.set(this.conditionKey[0], this.styleCondition);
            }
            const style = createStyle.createStyle(this.layerStyleObject, feature, this.isLayerClustered, Config.wfsImgPath);

            feature.setStyle(style);

            this.$emit("add-object-card", feature, label, olLayer.get("id"));
            this.addFeatureToScenario(feature);
        },

        /**
         * Extracts the style conditions from the provided styling rules.
         * @param {Array} stylingRules - The array of styling rules to extract conditions from.
         * @returns {Array} An array of style conditions extracted from the styling rules.
         */
        getStyleConditions (stylingRules) {
            if (stylingRules.length <= 1) {
                return [];
            }
            this.conditionKey = Object.keys(stylingRules[0]?.conditions.properties);

            return stylingRules.map(rule => rule.conditions.properties[this.conditionKey[0]]);
        },

        /**
         * Handles the map click event to create a feature at the clicked coordinates
         * and deactivates the placement mode.
         * @param {Object} evt - The map click event object containing the coordinates.
         * @returns {void}
         */
        onMapClick (evt) {
            const geometry = new Point(evt.coordinate);

            this.createFeature(geometry, this.layer, this.hasStyleConditions);
            this.stopPlacement();
            this.$emit("set-is-location-active", false);
        },

        /**
         * Initializes the feature placement process by setting the selected layer and determining if style conditions exist.
         * If no style conditions are present, it starts the location placement mode directly.
         * @param {Object} layer - The selected map layer for feature placement.
         * @returns {void}
         */
        processPlacement (layer) {
            this.$emit("set-selected-layer", layer);

            this.styleConditionsList = this.getStyleConditions(this.layerStyleObject.rules);
            if (!this.hasStyleConditions) {
                this.startPlacement();
            }
            else {
                this.stopPlacement();
            }
        },

        /**
         * Resets the data properties.
         * @returns {void}
         */
        resetData () {
            this.conditionKey = null;
            this.layer = null;
            this.styleCondition = null;
            this.styleConditionsList = [];
        },

        /**
         * Activates the map click listener to allow the user to place a feature on the map.
         * @returns {void}
         */
        startPlacement () {
            this.$emit("subject-data-selected", true);
            this.registerListener({type: "click", listener: this.onMapClick, keyForBoundFunctions: "scenario-place-mode"});
        },

        /**
         * Deactivates the map click listener and stops the placement mode.
         * @returns {void}
         */
        stopPlacement () {
            this.$emit("subject-data-selected", false);
            this.unregisterListener({type: "click", listener: this.onMapClick, keyForBoundFunctions: "scenario-place-mode"});
        }
    }
};
</script>

<template lang="html">
    <DropdownAutocomplete
        v-model="layer"
        class="flex-grow-1 mb-3"
        :items="layerList"
        :label="$t('additional:modules.tools.cosi.objectManager.selectObject')"
        @update:model-value="processPlacement"
    />
    <DropdownAutocomplete
        v-if="hasStyleConditions"
        v-model="styleCondition"
        class="flex-grow-1 mb-3"
        :items="styleConditionsList"
        :label="$t('additional:modules.tools.cosi.objectManager.selectObjectType')"
        @update:model-value="startPlacement"
    />
    <div
        v-if="isSubjectDataSelected"
        class="toast-minimal p-3 mb-3 border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
    >
        <div class="d-flex align-items-start gap-5">
            <div class="pulse-indicator mt-1 ms-3" />
            <div class="d-flex flex-column align-items-start text-start">
                <h5 class="mb-2">
                    {{ $t('additional:modules.tools.cosi.objectManager.setFeatureHeadline') }}
                </h5>
                <p class="mb-2 text-muted small lh-sm">
                    {{ $t('additional:modules.tools.cosi.objectManager.setFeature') }}
                </p>
                <FlatButton
                    id="cancel-placement"
                    :class-array="['btn-small', 'mt-1']"
                    icon="bi bi-x"
                    type="button"
                    :aria-label="$t('additional:modules.tools.cosi.objectManager.cancelPlacement')"
                    :text="$t('additional:modules.tools.cosi.objectManager.cancelPlacement')"
                    @click="cancelPlacement"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .toast-minimal {
        background: mix(#ffffff, $light_blue, 50%);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.03);
        transition: all 0.3s ease;
            h5 {
                color: $secondary;
                font-family: $font_family_accent;
            }
    }

    .pulse-indicator {
        width: 10px;
        height: 10px;
        background-color: $secondary;
        border-radius: 50%;
        position: relative;
        flex-shrink: 0;
        &::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background-color: $secondary;
            border-radius: 50%;
            animation: pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }
    }

    @keyframes pulse-ring {
        0% {
            transform: scale(0.5);
            opacity: 1;
        }
        80%, 100% {
            transform: scale(2.8);
            opacity: 0;
        }
    }
</style>
