<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddCardButton from "../../shared/modules/cards/components/AddCardButton.vue";
import {computed} from "vue";
import {mapGetters} from "vuex";
import layerCollection from "@core/layers/js/layerCollection";
import ScenarioBuilderPlannerHeader from "./ScenarioBuilderPlannerHeader.vue";
import ScenarioBuilderPlannerList from "./ScenarioBuilderPlannerList.vue";
import ScenarioBuilderPlannerLocation from "./ScenarioBuilderPlannerLocation.vue";
import ScenarioBuilderPlannerProps from "./ScenarioBuilderPlannerProps.vue";
import VectorLayer from "ol/layer/Vector.js";

export default {
    components: {
        AccordionItem,
        AddCardButton,
        ScenarioBuilderPlannerHeader,
        ScenarioBuilderPlannerList,
        ScenarioBuilderPlannerLocation,
        ScenarioBuilderPlannerProps
    },

    provide () {
        return {
            featureProperties: computed({
                get: () => this.featureProperties,
                set: value => {
                    this.featureProperties = value;
                }
            })
        };
    },

    data () {
        return {
            featureProperties: {},
            isLocationActive: false,
            nameProperties: ["name", "facility", "bezeichnung", "einrichtungsname", "titel"],
            selectedLayer: null,
            visibleVectorLayers: []
        };
    },

    computed: {
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Modules/ScenarioBuilder", ["activeObjectCard", "activeScenarioCard"]),

        layerItems () {
            return this.visibleVectorLayers.map(layer => ({
                title: layer.getLayer().get("name"),
                value: layer
            }));
        }
    },

    watch: {
        activeObjectCard (newCard) {
            if (newCard) {
                this.restoreSelectedLayer();
            }
        },
        featureProperties: {
            handler (newProperties) {
                if (!this.activeObjectCard) {
                    return;
                }

                Object.entries(newProperties).forEach(([key, value]) => {
                    this.activeObjectCard.feature.set(key, value);
                });
            },
            deep: true
        },

        selectedLayer (newLayer) {
            if (newLayer) {
                this.loadFeatureDescription(newLayer);
            }
        },

        /**
         * Synchronizes visible vector layers and resets the selected layer if it becomes hidden.
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.visibleVectorLayers = this.getVisibleVectorLayers();
                if (!this.visibleVectorLayers.includes(this.selectedLayer)) {
                    this.selectedLayer = null;
                }
            },
            deep: true,
            immediate: true
        }
    },

    mounted () {
        this.visibleVectorLayers = this.getVisibleVectorLayers();
        this.restoreSelectedLayer();
    },

    methods: {
        getEditableFeaturePropertiesFromSource (layer) {
            const normalizedNameProperties = this.nameProperties.map(name => name.toLowerCase());

            return Object.entries(layer.attributes.gfiAttributes).reduce((editableProperties, [key]) => {
                if (!normalizedNameProperties.includes(String(key).toLowerCase())) {
                    editableProperties[key] = null;
                }
                return editableProperties;
            }, {});
        },

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleVectorLayers () {
            const supportedLayerTypes = ["WFS", "OAF", "GeoJSON"];

            return layerCollection.getLayers().filter(layer => {
                return layer.getLayer() instanceof VectorLayer && layer?.attributes.visibility === true && layer?.attributes?.isNeverVisibleInTree !== true && supportedLayerTypes.includes(layer.get("typ"));
            });
        },

        /**
         * Loads and processes the feature description for a given layer.
         * @param {Object} layer - The layer object containing attributes and configuration.
         * @returns {void}
         */
        loadFeatureDescription (layer) {
            this.featureProperties = this.getEditableFeaturePropertiesFromSource(layer);
        },

        /**
         * Restores the previously selected layer from the active object card.
         * @returns {void}
         */
        restoreSelectedLayer () {
            const layerId = this.activeObjectCard?.layerId;

            if (!layerId) {
                return;
            }

            this.selectedLayer = this.visibleVectorLayers.find(
                layer => layer.getLayer().get("id") === layerId
            );

            if (this.selectedLayer) {
                this.loadFeatureDescription(this.selectedLayer);
            }
        },

        setIsLocationActive (value) {
            this.isLocationActive = value;
        },

        /**
         * Activates the location placement mode for the selected layer, allowing the user to place a new feature on the map.
         * @returns {void}
         */
        startCreateObject () {
            this.isLocationActive = true;
            if (this.activeObjectCard) {
                this.activeObjectCard.status = "";
            }
        },

        /**
         * Toggles the status of a card at the specified index.
         * @param {Number} index - Index of the card to toggle
         * @return {void}
         */
        toggleObjectStatus (index) {
            const activeIndex = this.activeScenarioCard.objects.findIndex(card => card.status === "active");

            if (activeIndex === index) {
                this.activeScenarioCard.objects[index].status = "active";
                return;
            }

            if (activeIndex !== -1 && activeIndex !== index) {
                this.activeScenarioCard.objects[activeIndex].status = "";
            }
            this.activeScenarioCard.objects[index].status = "active";
        }
    }
};
</script>

<template lang="html">
    <ScenarioBuilderPlannerHeader />
    <AccordionItem
        id="objects"
        :is-open="true"
        :title="$t('additional:modules.tools.cosi.objectManager.createdObjects')"
        icon="bi bi-box"
    >
        <ScenarioBuilderPlannerList
            @set-is-location-active="setIsLocationActive($event)"
            @toggle-object-status="toggleObjectStatus($event)"
        />
        <AddCardButton
            class="w-100"
            :text="$t('additional:modules.tools.cosi.objectManager.createNewObject')"
            @click="startCreateObject"
        />
    </AccordionItem>
    <template v-if="isLocationActive || activeObjectCard">
        <hr class="my-4">
        <h5 class="mb-3">
            {{ $t('additional:modules.tools.cosi.objectManager.titleEditObject') }}
        </h5>
        <ScenarioBuilderPlannerLocation
            v-if="isLocationActive"
            :feature-properties="featureProperties"
            :layer-items="layerItems"
            :selected-layer="selectedLayer"
            @set-selected-layer="selectedLayer = $event"
            @set-is-location-active="setIsLocationActive($event)"
            @toggle-object-status="toggleObjectStatus($event)"
        />
        <ScenarioBuilderPlannerProps
            v-if="!isLocationActive && activeObjectCard"
            :selected-layer="selectedLayer"
        />
    </template>
</template>
