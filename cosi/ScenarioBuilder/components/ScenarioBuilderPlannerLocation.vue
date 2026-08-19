<script>
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import Feature from "ol/Feature.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import hash from "object-hash";
import {mapActions, mapGetters} from "vuex";
import Point from "ol/geom/Point";

export default {
    components: {
        DropdownAutocomplete,
        FlatButton
    },

    inject: ["addFeatureToScenario"],

    props: {
        featureProperties: {
            type: Object,
            default: () => ({})
        },
        layerItems: {
            type: Array,
            default: () => []
        },
        selectedLayer: {
            type: Object,
            default: null
        }
    },

    emits: ["set-selected-layer", "set-is-location-active", "toggle-object-status"],

    data () {
        return {
            isMapClickActive: false
        };
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeScenarioCard"])
    },

    methods: {
        ...mapActions("Maps", [
            "registerListener",
            "unregisterListener"
        ]),

        /**
         * Generates and adds a new object card based on the provided scenario feature.
         * @param {Object} scenarioFeature - The scenario feature containing the map feature and properties.
         * @param {String} name - The fallback label for the object.
         * @param {String} layerId - The associated layer id.
         * @returns {void}
         */
        addObjectCard (feature, name, layerId) {
            const properties = feature.getProperties();

            this.activeScenarioCard.objects.push({
                id: feature.getId(),
                icon: "bi bi-box",
                label: properties.facility || name,
                text: "Neues Objekt",
                feature,
                status: "",
                layerId: layerId,
                sourceDataMode: "empty",
                referenceFeatureId: null,
                manualFeatureProperties: {},
                referenceFeatureProperties: {}
            });

            this.$emit("toggle-object-status", this.activeScenarioCard.objects.length - 1);
            this.addFeatureToScenario(feature);
        },

        /**
         * Creates a new feature with the given geometry and associates it with the selected layer.
         * @param {Object} geometry - The geometry object for the new feature.
         * @param {Object} selectedLayer - The selected map layer.
         */
        createFeature (geometry, selectedLayer) {
            const feature = new Feature({geometry});

            feature.setProperties(this.featureProperties);
            feature.set("isSimulation", true);
            feature.setId(hash({...this.featureProperties, geom: geometry}));
            this.setFeatureStyle(feature, selectedLayer.getLayer());

            this.addObjectCard(feature, selectedLayer.getLayer().get("name"), selectedLayer.getLayer().get("id"));
        },

        /**
         * Handles the map click event to create a feature at the clicked coordinates and deactivates the placement mode.
         * @param {Object} evt - The map click event object containing the coordinates.
         * @returns {void}
         */
        placeFeature (evt) {
            const geometry = new Point(evt.coordinate);

            this.createFeature(geometry, this.selectedLayer);
            this.unregisterListener({type: "click", listener: this.placeFeature, keyForBoundFunctions: "123456"});
            this.isMapClickActive = false;
            this.$emit("set-is-location-active", false);
        },

        setFeatureStyle (feature, layer) {
            if (layer) {
                const styleFn = layer.getStyle && typeof layer.getStyle === "function"
                    ? layer.getStyle()
                    : layer.getStyle;

                if (typeof styleFn === "function") {
                    feature.setStyle((resolution) => styleFn(feature, resolution));
                }
                else if (styleFn) {
                    feature.setStyle(styleFn);
                }
            }
        },

        /**
         * Activates the location placement mode for the selected layer, allowing the user to place a new feature on the map.
         * @param {Object} layer - The map layer where the new feature should be placed.
         * @returns {void}
         */
        startLocation (layer) {
            if (!layer) {
                return;
            }

            this.$emit("set-selected-layer", layer);
            this.isMapClickActive = true;
            this.registerListener({type: "click", listener: this.placeFeature, keyForBoundFunctions: "123456"});
        }
    }
};
</script>

<template lang="html">
    <DropdownAutocomplete
        class="flex-grow-1 mb-3"
        :items="layerItems"
        :label="$t('additional:modules.tools.cosi.objectManager.selectObject')"
        @update:model-value="startLocation"
    />
    <div
        v-if="isMapClickActive"
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
