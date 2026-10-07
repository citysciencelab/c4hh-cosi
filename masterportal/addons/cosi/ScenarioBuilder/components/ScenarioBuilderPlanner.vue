<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddCardButton from "../../shared/modules/cards/components/AddCardButton.vue";
import {computed} from "vue";
import {getNameProperty} from "../../utils/features/getNameProperty.js";
import highlightVectorFeature from "../../utils/highlightVectorFeature";
import Icon from "ol/style/Icon.js";
import layerCollection from "@core/layers/js/layerCollection";
import {mapActions, mapGetters} from "vuex";
import ScenarioBuilderPlannerHeader from "./ScenarioBuilderPlannerHeader.vue";
import ScenarioBuilderPlannerList from "./ScenarioBuilderPlannerList.vue";
import ScenarioBuilderPlannerLocation from "./ScenarioBuilderPlannerLocation.vue";
import ScenarioBuilderPlannerProps from "./ScenarioBuilderPlannerProps.vue";
import {Select, Translate} from "ol/interaction";
import {setStyleByLayer} from "../../utils/features/setStyleByLayer.js";
import {unpackCluster} from "../../utils/features/unpackCluster";
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

    inject: ["addFeatureToScenario", "removeFeatureFromScenario", "updateSimulationTag"],

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

    props: {
        scenarioLayerId: {
            type: String,
            required: true
        }
    },

    data () {
        return {
            featureProperties: {},
            isLocationActive: false,
            isSubjectDataSelected: false,
            selectedLayer: null,
            visibleVectorLayers: []
        };
    },

    computed: {
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Modules/ScenarioBuilder", ["activeObjectCard", "activeScenarioCard", "nameProperties"]),

        layerList () {
            return this.visibleVectorLayers.map(layer => ({
                title: layer.getLayer().get("name"),
                value: layer
            }));
        },

        visibleVectorLayerIds () {
            return this.visibleVectorLayers.map(layer => layer.getLayer().get("id"));
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
            }
        },

        selectedLayer (newLayer) {
            if (newLayer) {
                this.featureProperties = this.getEditableFeaturePropertiesFromSource(newLayer);
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
        this.select = new Select({
            filter: this.filterFeaturesOnSelect,
            style: null
        });
        this.translate = new Translate({
            features: this.select.getFeatures()
        });
        // add interactions to the map
        this.addInteraction(this.select);
        this.addInteraction(this.translate);

        // bind event handler
        this.select.on("select", this.onSelect.bind(this));
        this.translate.on("translateend", this.onTranslateEnd.bind(this));
    },

    unmounted () {
        this.removeInteraction(this.select);
        this.removeInteraction(this.translate);
    },

    methods: {
        ...mapActions("Maps", ["addInteraction", "removeHighlightFeature", "removeInteraction"]),

        /**
         * Adds a new object card to the active scenario card and adds the associated feature to the scenario layer.
         * @param {ol/Feature} feature - The feature to be added.
         * @param {String} name - The name of the feature.
         * @param {String} layerId - The ID of the layer to which the feature belongs.
         * @param {Boolean} isModified - Indicates if the feature is modified.
         * @returns {void}
         */
        addObjectCard (feature, name, layerId, isModified = false) {
            const properties = feature.getProperties(),
                  iconSrc = this.getFeatureIconSrc(feature);

            this.activeScenarioCard.objects.push({
                feature,
                iconSrc,
                id: feature.getId(),
                isVisible: isModified || feature.get("isSimulation"),
                label: properties.facility || name,
                layerId: layerId,
                manualFeatureProperties: {},
                originProperties: feature.clone().getProperties(),
                text: getNameProperty(feature, this.nameProperties)?.value || "Neues Objekt",
                referenceFeatureId: feature.getId(),
                referenceFeatureProperties: feature.clone().getProperties(),
                sourceDataMode: !feature.get("isSimulation") ? "existing" : "empty",
                status: ""
            });

            this.toggleObjectStatus(this.activeScenarioCard.objects.length - 1);
        },

        /**
         * Resolves the icon image source from a feature's style, if present.
         * @param {ol/Feature} feature - The feature to read the style from.
         * @returns {String|undefined} the icon image source, if any.
         */
        getFeatureIconSrc (feature) {
            const styleFn = feature.getStyle(),
                  style = typeof styleFn === "function" ? styleFn(feature, 0) : styleFn,
                  resolvedStyle = Array.isArray(style) ? style[0] : style;

            if (resolvedStyle?.getImage()?.constructor === Icon) {
                return resolvedStyle.getImage().getSrc();
            }
            return undefined;
        },

        /**
         * Finds the index of an existing object card for a feature.
         * @param {module:ol/Feature} feature - The selected feature.
         * @returns {Number} Index of the matching card, or -1 if not found.
         */
        getObjectCardIndexByFeature (feature) {
            const featureId = feature?.getId?.();

            return this.activeScenarioCard.objects.findIndex(objectCard => {
                return objectCard.id === featureId;
            });
        },

        /**
         * Event handler for the selection of a feature
         * Highlightes the feature on the map
         * @param {Event} evt the select event
         * @returns {void}
         */
        onSelect (evt) {
            const selectedFeature = evt.selected[0],
                  deselectedFeature = evt.deselected[0];

            if (deselectedFeature) {
                this.runDeselection(deselectedFeature);
            }
            if (selectedFeature) {
                this.runSelection(selectedFeature);
            }
        },

        runDeselection (feature) {
            this.removeHighlightFeature();

            if (!feature.get("isSimulation") && !feature.get("isModified")) {
                for (const unpackedFeature of unpackCluster(feature)) {
                    this.removeObjectCard(unpackedFeature.getId());
                }
            }
        },

        runSelection (feature) {
            const layer = this.select.getLayer(feature);
            let objectCardIndex = -1;

            for (const unpackedFeature of unpackCluster(feature)) {
                objectCardIndex = this.getObjectCardIndexByFeature(unpackedFeature);
                if (objectCardIndex !== -1) {
                    this.toggleObjectStatus(objectCardIndex);
                    break;
                }
                else {
                    this.addObjectCard(unpackedFeature, layer.get("name"), layer.get("id"), false);
                }
            }
            highlightVectorFeature(feature, layer.get("id"));
        },


        /**
         * Event handler for the end of a feature translation
         * Triggers the updating of guide layer tags and updates clustered features
         * @param {Event} evt the translatestart event
         * @returns {void}
         */
        onTranslateEnd (evt) {
            const feature = evt.features.item(0);

            let originalFeature;

            for (originalFeature of unpackCluster(feature)) {
                if (!originalFeature.get("isModified") && !originalFeature.get("isSimulation")) {
                    const layer = this.select.getLayer(feature);

                    originalFeature.set("isModified", true);
                    setStyleByLayer(originalFeature, layer);
                    this.activeObjectCard.isVisible = true;
                    this.addFeatureToScenario(originalFeature);
                    layer.getSource().removeFeature(feature);
                }
                this.updateSimulationTag(originalFeature);
            }
            this.removeHighlightFeature();
        },

        /**
         * Filter function for selecting features only from the active working layer
         * @param {module:ol/Feature} feature the clicked feature
         * @returns {Boolean} whether the feature is permitted for the selection
         */
        filterFeaturesOnSelect (feature, layer) {
            const layerList = [...this.visibleVectorLayerIds, this.scenarioLayerId];

            if (layerList.includes(layer.get("id")) === false) {
                return false;
            }
            return true;
        },

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
         * Removes an object card from the active scenario card and
         * removes the associated feature from the scenario layer.
         * @param {String|Number} cardId - Id of the object card to remove
         */
        removeObjectCard (cardId) {
            const index = this.activeScenarioCard.objects.findIndex(card => card.id === cardId);

            if (index === -1) {
                return;
            }

            const objectCard = this.activeScenarioCard.objects[index];

            if (objectCard.feature.get("isModified")) {
                this.resetFeatureToOriginal(objectCard);
            }
            this.removeFeatureFromScenario(objectCard.feature);
            this.activeScenarioCard.objects.splice(index, 1);
        },

        /**
         * Resets a feature to its original properties and geometry, and adds it back to the specified layer.
         * @param {Object} params - Parameters for resetting the feature.
         * @param {ol/Feature} params.feature - The feature to reset.
         * @param {String} params.layerId - The ID of the layer to which the feature belongs.
         * @param {Object} params.originProperties - The original properties of the feature.
         * @returns {void}
         */
        resetFeatureToOriginal ({feature, layerId, originProperties}) {
            const olLayer = layerCollection.getLayerById(layerId).getLayer();

            if (!feature || feature.get("isSimulation")) {
                return;
            }

            Object.keys(feature.getProperties()).forEach(key => {
                if (key !== "features") {
                    feature.unset(key);
                }
            });

            Object.entries(originProperties).forEach(([key, value]) => {
                feature.set(key, value);
            });

            feature.setGeometry(originProperties.geometry);
            olLayer.getSource().addFeature(feature);
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
                this.featureProperties = this.getEditableFeaturePropertiesFromSource(this.selectedLayer);
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
            :is-subject-data-selected="isSubjectDataSelected"
            @remove-object-card="removeObjectCard($event)"
            @toggle-object-status="toggleObjectStatus($event)"
        />
        <AddCardButton
            class="w-100"
            :text="$t('additional:modules.tools.cosi.objectManager.createNewObject')"
            :disabled="isSubjectDataSelected"
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
            :is-subject-data-selected="isSubjectDataSelected"
            :layer-list="layerList"
            @add-object-card="addObjectCard"
            @set-selected-layer="selectedLayer = $event"
            @set-is-location-active="setIsLocationActive($event)"
            @subject-data-selected="isSubjectDataSelected = $event"
            @toggle-object-status="toggleObjectStatus($event)"
        />
        <ScenarioBuilderPlannerProps
            v-if="!isLocationActive && activeObjectCard"
            :selected-layer="selectedLayer"
        />
    </template>
</template>

