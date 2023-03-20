<script>
import {Select} from "ol/interaction";
import {mapGetters} from "vuex";
import Modal from "../../../../src/share-components/modals/components/ModalItem.vue";

export default {
    name: "ReferencePicker",
    components: {
        Modal
    },
    props: {
        active: {
            type: Boolean,
            required: true
        },
        workingLayer: {
            type: Object,
            required: false,
            default: null
        },
        useIcons: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    data: () => ({
        select: null,
        referencePickerActive: false,
        referenceFeature: null,
        clusteredFeatures: [],
        showClusteredFeaturePicker: false,
        map: undefined
    }),
    computed: {
        ...mapGetters("Maps", ["getLayerById"]),

        /**
         * Returns the OpenLayers map layer from the workingLayer object
         * @returns {module:ol/layer/Vector} the map layer currently worked on
         */
        layer () {
            return this.getLayerById({layerId: this.workingLayer.layerId});
        }
    },
    watch: {

        /**
         * Watches the active state of the tool
         * Triggers the unlisten method, if the tool is closed
         * @param {Boolean} state the active state of the tool
         * @returns {void}
         */
        active (state) {
            if (!state) {
                this.unlisten();
            }
        },

        /**
         * Watches the referencePickerActive boolean,
         * triggers the listen/unlisten methods
         * @param {Boolean} state the state of the referencePickerActive boolean
         * @returns {void}
         */
        referencePickerActive (state) {
            if (state) {
                this.listen();
                this.$emit("referencePickerActive", true);
            }
            else {
                this.unlisten();
                this.$emit("referencePickerActive", false);
            }
        }
    },

    created () {
        this.map = mapCollection.getMap("2D");
    },

    /**
     * Deactivate the map interaction when tool is closed forcefully
     * @returns {void}
     */
    beforeDestroy () {
        this.unlisten();
    },
    methods: {

        /**
         * Toggles the Select interaction boolean on/off
         * @returns {void}
         */
        togglePickReference () {
            this.referencePickerActive = !this.referencePickerActive;
        },

        /**
         * Activates the OpenLayers Select interaction
         * @returns {void}
         */
        listen () {
            this.select = new Select({
                layers: [this.layer],
                style: null
            });

            this.map.addInteraction(this.select);
            this.select.on("select", this.pickReference.bind(this));
        },

        /**
         * Deactivates the OpenLayers Select interaction
         * @returns {void}
         */
        unlisten () {
            this.map.removeInteraction(this.select);
            this.select = null;
        },


        /**
         * Pick a feature as reference on map click
         * @param {Event} evt The OpenLayers Select event
         * @returns {void}
         */
        pickReference (evt) {
            const feature = this.unpackClusteredFeatures(evt.selected[0]);

            if (feature) {
                this.$emit("pickReference", feature);
            }

            this.referencePickerActive = false;
        },

        /**
         * Checks whether a feature is a cluster and extracts its child features
         * Opens the cluster feature picker modal, if more than 1 feature is in the cluster
         * @param {module:ol/Feature} selectedFeature The feature selected on the map
         * @returns {void}
         */
        unpackClusteredFeatures (selectedFeature) {
            const clusteredFeatures = selectedFeature.get("features");

            if (clusteredFeatures) {
                if (clusteredFeatures.length === 1) {
                    return clusteredFeatures[0];
                }
                if (clusteredFeatures.length > 1) {
                    this.clusteredFeatures = clusteredFeatures;
                    this.showClusteredFeaturePicker = true;
                }
                return null;
            }
            return selectedFeature;
        },

        /**
         * Triggers the "pickReference" event with the feature selected from a cluster
         * @param {module:ol/Feature} feature The feature selected from the table
         * @fires event#pickReference
         * @returns {void}
         */
        pickClusteredFeature (feature) {
            this.showClusteredFeaturePicker = false;
            this.$emit("pickReference", feature);
        },

        /**
         * Escape the modal, no feature selected
         * @returns {void}
         */
        escapeClusteredFeaturePicker () {
            this.showClusteredFeaturePicker = false;
        }
    }
};
</script>

<template>
    <div>
        <v-btn
            dense
            small
            tile
            :color="referencePickerActive ? 'warning' : 'grey lighten-1'"
            :title="$t('additional:modules.tools.cosi.scenarioBuilder.pickReference')"
            @click="togglePickReference"
        >
            <span v-if="useIcons">
                <v-icon>mdi-eyedropper</v-icon>
            </span>
            <span v-else>
                {{ $t('additional:modules.tools.cosi.scenarioBuilder.pickReference') }}
            </span>
        </v-btn>
        <Modal
            :show-modal="showClusteredFeaturePicker"
            @modalHid="escapeClusteredFeaturePicker"
            @clickedOnX="escapeClusteredFeaturePicker"
            @clickedOutside="escapeClusteredFeaturePicker"
        >
            <v-simple-table dense>
                <template #default>
                    <thead>
                        <tr class="header-row">
                            <th>{{ $t('additional:modules.tools.cosi.featuresList.colFacility') }}</th>
                            <th>{{ $t('additional:modules.tools.cosi.featuresList.colType') }}</th>
                            <th>{{ $t('additional:modules.tools.cosi.featuresList.colAddress') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(feature, i) in clusteredFeatures"
                            :key="i"
                            class="selectable-row"
                            @click="pickClusteredFeature(feature)"
                        >
                            <th>{{ feature.get(workingLayer.keyOfAttrName) }}</th>
                            <td>{{ feature.get(workingLayer.categoryField) }}</td>
                            <td>{{ workingLayer.addressField.map(field => feature.get(field)).join(", ") }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </Modal>
    </div>
</template>

<style lang="scss" scoped>
    .selectable-row {
        cursor: pointer;
    }
</style>
