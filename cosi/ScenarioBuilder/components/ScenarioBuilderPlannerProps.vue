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

    inject: ["featureProperties"],

    props: {
        selectedLayer: {
            type: Object,
            default: null
        }
    },

    data () {
        return {
            sourceDataItems: [
                {
                    id: "empty",
                    label: this.$t("additional:modules.tools.cosi.objectManager.startWithEmptyData"),
                    selected: true
                },
                {
                    id: "existing",
                    label: this.$t("additional:modules.tools.cosi.objectManager.useExistingData"),
                    selected: false
                }
            ]
        };
    },

    computed: {
        ...mapGetters("Modules/ScenarioBuilder", ["activeObjectCard"]),

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

        selectedSourceItem () {
            return this.sourceDataItems.find(item => {
                return item.selected === true;
            });
        }
    },

    methods: {
        beautifyKey,

        /**
         * Sets a reference feature's properties as the properties of the feature to create
         * deletes the original features geom if necessary
         * @param {module:ol/Feature} feature - the feature picked as reference
         * @returns {void}
         */
        getDataFromReferenceFeature (feature) {
            if (!feature) {
                return;
            }

            const properties = feature.getProperties();

            Object.keys(this.featureProperties || {}).forEach(key => {
                this.featureProperties[key] = properties[key] ?? null;
            });
        },

        /**
         * Returns a display title for a feature based on available properties.
         * @param {Feature} feature - Feature to get the title from.
         * @returns {String} Display title of the feature.
         */
        getFeatureTitle (feature) {
            const props = feature.getProperties(),
                  fields = [
                      "name",
                      "Name",
                      "facility",
                      "bezeichnung",
                      "einrichtungsname",
                      "titel"
                  ];

            for (const field of fields) {
                if (props[field]) {
                    return typeof props[field] === "object"
                        ? JSON.stringify(props[field])
                        : String(props[field]);
                }
            }

            return String(feature.getId() || "Unbenanntes Objekt");
        },


        /**
         * Sets the selected item and resets data if empty.
         * @param {Object} selectedItem - The item to select.
         * @returns {void}
         */
        setSelectedItems (selectedItem) {
            this.sourceDataItems.forEach(item => {
                item.selected = item.id === selectedItem.id;
            });

            if (selectedItem.id === "empty") {
                Object.keys(this.featureProperties || {}).forEach(key => {
                    this.featureProperties[key] = null;
                });
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
            class="mb-3 mt-5"
            :items="sourceDataItems"
            :multiple="false"
            :label="$t('additional:modules.tools.cosi.objectManager.sourceDataOption')"
            @update:selected-items="setSelectedItems"
        />
        <DropdownAutocomplete
            v-if="selectedSourceItem.id === 'existing'"
            class="mt-3"
            :items="referenceFeatures"
            :label="$t('additional:modules.tools.cosi.objectManager.selectReferenceDataset')"
            @update:model-value="getDataFromReferenceFeature"
        />
        <div
            v-if="activeObjectCard"
            class="mt-4"
        >
            <div
                v-for="fieldName in editableFieldNames"
                :key="fieldName"
                class="mb-3"
            >
                <InputText
                    :id="fieldName"
                    v-model="activeObjectCard.feature.getProperties()[fieldName]"
                    :label="beautifyKey(fieldName)"
                    :placeholder="beautifyKey(fieldName)"
                />
            </div>
        </div>
    </AccordionItem>
</template>

<style lang="scss" scoped>

</style>
