<script>
import {Select, Translate} from "ol/interaction";
import {mapGetters, mapActions} from "vuex";
import {unpackCluster} from "../../utils/features/unpackCluster";
import highlightVectorFeature from "../../utils/highlightVectorFeature";
import {getSearchResultsCoordinates} from "../../utils/getSearchResultsGeom";
import Point from "ol/geom/Point";
import {getAddress} from "../../utils/geocode";
import {onSearchbar, offSearchbar} from "../../utils/radioBridge.js";

export default {
    name: "MoveFeatures",
    props: {
        active: {
            type: Boolean,
            required: true
        },
        activeScenario: {
            type: Object,
            required: false,
            default: null
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
        },
        guideLayer: {
            type: Object,
            required: false,
            default: null
        }
    },
    data: () => ({
        translate: null,
        moveFeaturesActive: false,
        onlyEditSimulated: true,
        select: null,
        dialog: {
            open: false,
            color: "success",
            text: "",
            timeout: 4000
        },
        map: undefined
    }),
    computed: {
        ...mapGetters("Maps", ["getLayerById", "projectionCode"]),
        ...mapGetters("Tools/Routing", ["geosearchReverse"]),

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
         * Sets the interaction inactive, if the tool is closed
         * @param {Boolean} state the active state of the tool
         * @returns {void}
         */
        active (state) {
            if (!state) {
                this.moveFeaturesActive = false;
            }
        },

        /**
         * listens/unlistens according to the active state of the tool's functionality
         * @param {Boolean} state Whether the tools functionality is active
         * @returns {void}
         */
        moveFeaturesActive (state) {
            if (state) {
                this.$emit("moveFeaturesActive", true);
                this.listen();
                this.dialog.timeout = 5000;
                this.dialog.color = "primary";
                this.dialog.text = this.$t("additional:modules.tools.cosi.moveFeatures.help");
                this.dialog.open = true;
            }
            else {
                this.$emit("moveFeaturesActive", false);
                this.unlisten();
            }
        },

        /**
         * Disables the interaction if the workingLayer changes
         * @returns {void}
         */
        workingLayer () {
            this.moveFeaturesActive = false;
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
        ...mapActions("Maps", ["removeHighlightFeature"]),

        /**
         * Sets and adds all OL interactions to move features
         * @returns {void}
         */
        listen () {
            // initialize Select and Translate interactions
            this.select = new Select({
                layers: [this.layer],
                style: null,
                filter: this.filterFeaturesOnSelect
            });
            this.translate = new Translate({
                features: this.select.getFeatures()
            });

            // add interactions to the map
            this.map.addInteraction(this.select);
            this.map.addInteraction(this.translate);

            // bind event handler
            this.select.on("select", this.onSelect.bind(this));
            this.translate.on("translatestart", this.onTranslateStart.bind(this));
            this.translate.on("translateend", this.onTranslateEnd.bind(this));

            // bind listener to Searchbar
            onSearchbar(this.translateBySearchbar.bind(this));
        },

        /**
         * Removes and resets all interactions
         * @returns {void}
         */
        unlisten () {
            this.removeHighlightFeature();
            this.map.removeInteraction(this.translate);
            this.map.removeInteraction(this.select);
            this.translate = null;
            this.select = null;
            offSearchbar();
        },

        /**
         * Toggles the onlyEditSimulated flag and dispatches a warning to the user
         * @returns {void}
         */
        toggleOnlySimulated () {
            this.onlyEditSimulated = !this.onlyEditSimulated;

            if (!this.onlyEditSimulated) {
                this.dialog.timeout = 2000;
                this.dialog.color = "warning";
                this.dialog.text = this.$t("additional:modules.tools.cosi.moveFeatures.onlySimulatedWarning");
                this.dialog.open = true;
            }
        },

        /**
         * Event handler for the selection of a feature
         * Highlightes the feature on the map
         * @param {Event} evt the select event
         * @returns {void}
         */
        onSelect (evt) {
            const feature = evt.selected[0];

            this.removeHighlightFeature();
            highlightVectorFeature(feature, this.workingLayer.layerId);
        },

        /**
         * Event handler for the start of a feature translation
         * Binds the original location to the features properties
         * @param {Event} evt the translatestart event
         * @returns {void}
         */
        onTranslateStart (evt) {
            const feature = evt.features.item(0);
            let originalFeature;

            for (originalFeature of unpackCluster(feature)) {
                // Set the feature on the scenario as modified
                this.activeScenario.modifyFeature(originalFeature, {}, this.layer);
            }
        },

        /**
         * Event handler for the end of a feature translation
         * Triggers the updating of guide layer tags and updates clustered features
         * @param {Event} evt the translatestart event
         * @returns {void}
         */
        async onTranslateEnd (evt) {
            const feature = evt.features.item(0),
                targetGeometry = feature.getGeometry().clone();
            let originalFeature;

            for (originalFeature of unpackCluster(feature)) {
                originalFeature.setGeometry(targetGeometry);

                const
                    address = await getAddress(targetGeometry, this.projectionCode, this.geosearchReverse.type),
                    addressData = {};

                if (address) {
                    for (const prop of this.workingLayer.addressField) {
                        addressData[prop] = "";
                    }
                    addressData[this.workingLayer.addressField[0]] = address;
                }

                // modify the feature on the scenario. Update features already stored in the scenario
                // use the cloned geometry of the point or polygon as reference
                this.activeScenario.modifyFeature(originalFeature, {geometry: targetGeometry, ...addressData});
            }
        },

        /**
         * Retrieves the original location of a feature and resets its position on the map
         * @returns {void}
         */
        resetFeatureLocations () {
            this.activeScenario.resetFeaturesByLayer(this.layer, ["geometry", ...this.workingLayer.addressField], true);
        },

        /**
         * Filter function for selecting features only from the active working layer
         * @param {module:ol/Feature} feature the clicked feature
         * @returns {Boolean} whether the feature is permitted for the selection
         */
        filterFeaturesOnSelect (feature) {
            if (!this.onlyEditSimulated) {
                return true;
            }
            const features = unpackCluster(feature);

            if (features.length === 1 && features[0].get("isSimulation")) {
                return true;
            }

            return false;
        },

        translateBySearchbar () {
            const targetGeometry = new Point(this.getSearchResultsCoordinates()),
                feature = this.select.getFeatures().item(0);
            let originalFeature;

            if (!feature) {
                return;
            }

            for (originalFeature of unpackCluster(feature)) {
                // Set the feature on the scenario as modified
                this.activeScenario.modifyFeature(originalFeature, {}, this.layer);

                // set the new geometry based on search results
                originalFeature.setGeometry(targetGeometry);

                // modify the feature on the scenario. Update features already stored in the scenario
                // use the cloned geometry of the point or polygon as reference
                this.activeScenario.modifyFeature(originalFeature, {geometry: targetGeometry});
            }
        },

        getSearchResultsCoordinates
    }
};
</script>

<template>
    <div>
        <v-btn
            :title="$t('additional:modules.tools.cosi.moveFeatures.title')"
            dense
            small
            tile
            :color="moveFeaturesActive ? 'warning' : 'grey lighten-1'"
            :disabled="!activeScenario"
            @click="moveFeaturesActive = !moveFeaturesActive"
        >
            <span v-if="useIcons">
                <v-icon>mdi-axis-arrow</v-icon>
            </span>
            <span v-else>
                {{ $t('additional:modules.tools.cosi.moveFeatures.title') }}
            </span>
        </v-btn>
        <v-btn
            :title="onlyEditSimulated ? $t('additional:modules.tools.cosi.moveFeatures.toggleOnlySimulatedTooltip') : $t('additional:modules.tools.cosi.moveFeatures.toggleOnlySimulatedOffTooltip')"
            dense
            small
            tile
            :color="onlyEditSimulated ? 'grey lighten-1' : 'warning'"
            :disabled="!activeScenario"
            @click="toggleOnlySimulated"
        >
            <span v-if="useIcons">
                <v-icon>{{ onlyEditSimulated ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
            </span>
            <span v-else>
                {{ $t('additional:modules.tools.cosi.moveFeatures.toggleOnlySimulated') }}
            </span>
        </v-btn>
        <v-btn
            :title="$t('additional:modules.tools.cosi.moveFeatures.resetFeatureLocations')"
            dense
            small
            tile
            color="grey lighten-1"
            :disabled="!activeScenario"
            @click="resetFeatureLocations"
        >
            <span v-if="useIcons">
                <v-icon>mdi-undo</v-icon>
            </span>
            <span v-else>
                {{ $t('additional:modules.tools.cosi.moveFeatures.resetFeatureLocations') }}
            </span>
        </v-btn>
        <v-snackbar
            v-model="dialog.open"
            :timeout="2000"
            :color="dialog.color"
        >
            {{ dialog.text }}
            <template #action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="dialog.open = false"
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
