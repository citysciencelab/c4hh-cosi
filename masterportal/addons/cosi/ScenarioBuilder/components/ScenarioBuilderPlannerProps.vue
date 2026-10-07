<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import beautifyKey from "@shared/js/utils/beautifyKey.js";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import {unpackCluster} from "../../utils/features/unpackCluster.js";

export default {
    components: {
        AccordionItem,
        DropdownAutocomplete,
        InputText,
        TagGroup
    },

    inject: ["addFeatureToScenario", "featureProperties"],

    props: {
        selectedLayer: {
            type: Object,
            default: null
        }
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeObjectCard", "nameProperties"]),

        editableFieldNames () {
            return Object.keys(this.featureProperties || {});
        },

        /**
         * Returns reference features of the selected layer for the dropdown.
         * Includes clustered features if the layer uses clustering.
         * @returns {Array[]} Dropdown items with title and feature value.
         */
        referenceFeatures () {
            const source = this.selectedLayer?.getLayer().getSource();

            if (!source) {
                return [];
            }

            return source.getFeatures()
                .flatMap(feature => unpackCluster(feature))
                .map(feature => ({
                    title: this.getFeatureTitle(feature),
                    value: feature
                }));
        },

        /**
         * Returns the available options for selecting the source of the feature data.
         * Marks the currently active source data mode as selected.
         * @returns {Array[]} The available source data options.
         */
        sourceDataItems () {
            return [
                {
                    id: "empty",
                    label: this.$t("additional:modules.tools.cosi.objectManager.startWithEmptyData"),
                    selected: this.sourceDataMode === "empty"
                },
                {
                    id: "existing",
                    label: this.$t("additional:modules.tools.cosi.objectManager.useExistingData"),
                    selected: this.sourceDataMode === "existing"
                }
            ];
        },

        /**
         * Returns the currently selected source data mode.
         * Falls back to "empty" if no mode is set.
         * @returns {String} The active source data mode.
         */
        sourceDataMode () {
            return this.activeObjectCard?.sourceDataMode || "empty";
        },

        /**
         * Returns the currently selected reference feature based on its ID.
         * @returns {module:ol/Feature} The selected reference feature or null if none is selected.
         */
        selectedReferenceFeature () {
            const referenceFeatureId = this.activeObjectCard?.referenceFeatureId;

            if (!referenceFeatureId) {
                return null;
            }

            return this.referenceFeatures.find(
                item => String(item.value.getId()) === String(referenceFeatureId))?.value;
        },

        /**
         * Indicates whether a reference feature is currently selected.
         * @returns {Boolean} True if a reference feature is selected, otherwise false.
         */
        hasSelectedReferenceFeature () {
            return Boolean(this.selectedReferenceFeature);
        }
    },

    watch: {
        featureProperties: {
            handler (properties) {
                if (!Object.keys(properties || {}).length) {
                    return;
                }

                if (this.sourceDataMode === "empty") {
                    this.restoreFeatureData("empty");
                }
                else if (this.sourceDataMode === "existing") {
                    this.restoreFeatureData("existing");
                }
            },
            immediate: true
        }
    },

    methods: {
        beautifyKey,

        /**
         * Selects a reference feature and copies its editable properties to the active scenario feature.
         * @param {module:ol/Feature} feature - the feature picked as reference
         * @returns {void}
         */
        getDataFromReferenceFeature (feature) {
            if (!this.activeObjectCard || !feature) {
                return;
            }
            const properties = feature.getProperties();

            this.activeObjectCard.referenceFeatureId = feature.getId();

            this.activeObjectCard.referenceFeatureProperties = {};

            Object.keys(this.featureProperties || {}).forEach(key => {
                const value = properties[key] ?? null;

                this.activeObjectCard.referenceFeatureProperties[key] = value;
                this.activeObjectCard.feature.set(key, value);
            });
        },

        /**
         * Returns a display title for a feature based on available properties.
         * @param {Feature} feature - Feature to get the title from.
         * @returns {String} Display title of the feature.
         */
        getFeatureTitle (feature) {
            const props = feature.getProperties();

            for (const field of this.nameProperties) {
                if (props[field]) {
                    return typeof props[field] === "object"
                        ? JSON.stringify(props[field])
                        : String(props[field]);
                }
            }

            return String(feature.getId() || "Unbenanntes Objekt");
        },

        /**
         * Returns the property key for the given data mode.
         * @param {String} mode - The active data mode.
         * @returns {String} The matching feature property key.
         */
        getSourceModeKey (mode) {
            return mode === "empty" ? "manualFeatureProperties" : "referenceFeatureProperties";
        },

        /**
         * Saves the current feature properties for the given data mode.
         * @param {String} mode - The active data mode.
         * @returns {void}
         */
        saveFeatureData (mode) {
            if (!this.activeObjectCard?.feature) {
                return;
            }

            const sourceKey = this.getSourceModeKey(mode);

            this.activeObjectCard[sourceKey] = {};

            Object.keys(this.featureProperties || {}).forEach(key => {
                this.activeObjectCard[sourceKey][key] = this.activeObjectCard.feature.get(key) ?? null;
            });
        },

        /**
         * Restores the saved feature properties for the given data mode.
         * @param {String} mode - The active data mode.
         * @returns {void}
         */
        restoreFeatureData (mode) {
            if (!this.activeObjectCard?.feature) {
                return;
            }

            const sourceKey = this.getSourceModeKey(mode);

            Object.keys(this.featureProperties || {}).forEach(key => {
                this.activeObjectCard.feature.set(
                    key,
                    this.activeObjectCard[sourceKey]?.[key] ?? null
                );
            });
        },

        /**
         * Switches between manual and reference data modes and restores the corresponding feature properties.
         * @param {Object} selectedItem - The item to select.
         * @returns {void}
         */
        setSelectedItems (selectedItem) {
            if (!this.activeObjectCard || !selectedItem) {
                return;
            }

            const currentMode = this.sourceDataMode;
            const nextMode = selectedItem.id;

            if (currentMode === nextMode) {
                return;
            }

            this.saveFeatureData(currentMode);
            this.activeObjectCard.sourceDataMode = nextMode;

            if (nextMode === "existing" && this.selectedReferenceFeature) {
                this.restoreFeatureData("existing");
                return;
            }

            if (nextMode === "empty") {
                this.restoreFeatureData("empty");
            }
        },

        /**
         * Updates a feature property and stores it in the active data source.
         * @param {String} fieldName - The name of the property to update.
         * @param {String} value - The new property value.
         * @returns {void}
         */
        setFeatureProperty (fieldName, value) {
            if (!this.activeObjectCard?.feature) {
                return;
            }
            this.activeObjectCard.feature.set(fieldName, value);

            const propertyStore = this.sourceDataMode === "empty" ? "manualFeatureProperties" : "referenceFeatureProperties";

            if (!this.activeObjectCard[propertyStore]) {
                this.activeObjectCard[propertyStore] = {};
            }
            this.activeObjectCard[propertyStore][fieldName] = value;
            if (!this.activeObjectCard.isVisible) {
                this.activeObjectCard.feature.set("isModified", true);
                this.addFeatureToScenario(this.activeObjectCard.feature);
                this.activeObjectCard.isVisible = true;
            }
        }
    }
};
</script>

<template lang="html">
    <InputText
        id="scenario-title"
        v-model="activeObjectCard.text"
        class="mt-2"
        :disabled="!activeObjectCard.isVisible || !activeObjectCard.feature.get('isSimulation')"
        :label="$t('additional:modules.tools.cosi.objectManager.addObjectTitle')"
        :placeholder="$t('additional:modules.tools.cosi.objectManager.addObjectTitle')"
        max-length="50"
    />
    <AccordionItem
        id="attributes"
        :is-open="true"
        :title="$t('additional:modules.tools.cosi.objectManager.optionalInformation')"
        icon="bi bi-info"
    >
        <TagGroup
            v-if="activeObjectCard.isVisible && activeObjectCard.feature.get('isSimulation')"
            class="mb-3 mt-5"
            :items="sourceDataItems"
            :multiple="false"
            :label="$t('additional:modules.tools.cosi.objectManager.sourceDataOption')"
            @update:selected-items="setSelectedItems"
        />
        <DropdownAutocomplete
            v-if="sourceDataMode === 'existing' && activeObjectCard.isVisible && activeObjectCard.feature.get('isSimulation')"
            class="mt-3"
            :items="referenceFeatures"
            :model-value="selectedReferenceFeature"
            :label="$t('additional:modules.tools.cosi.objectManager.selectReferenceDataset')"
            @update:model-value="getDataFromReferenceFeature"
        />
        <div
            v-if="activeObjectCard && (sourceDataMode === 'empty' || hasSelectedReferenceFeature)"
            class="mt-4"
        >
            <div
                v-for="fieldName in editableFieldNames"
                :key="fieldName"
                class="mb-3"
            >
                <InputText
                    :id="fieldName"
                    :model-value="activeObjectCard.feature.get(fieldName)"
                    :label="beautifyKey(fieldName)"
                    :placeholder="beautifyKey(fieldName)"
                    @update:model-value="value => setFeatureProperty(fieldName, value)"
                />
            </div>
        </div>
    </AccordionItem>
</template>

<style lang="scss" scoped>

</style>
