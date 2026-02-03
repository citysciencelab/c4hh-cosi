<script>
import {mapState, mapActions, mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import axios from "axios";
import {Config} from "../config.js";

export default {
    name: "LocationSelectMenu",
    components: {
        Multiselect
    },
    props: {
        mode: {
            type: String,
            required: false,
            default: "single"
        }
    },
    computed: {
        ...mapState("Modules/VpiDashboard", [
            "selectedFeatures",
            "selectedLocationId",
            "selectedLocationBId",
            "selectInteraction"
        ]),
        ...mapGetters("Modules/VpiDashboard", ["gridLayerId", "selectStyle", "uniqueGeoIdsWithNames", "initialSelectedGeoId"]),
        ...mapGetters("Maps", ["projectionCode"]),
        selectedLocationModel: {
            /**
             * gets the selected location
             * @returns {Array} the selected values
             */
            get () {
                return this.uniqueGeoIdsWithNames.find(f => f.geoId === this.selectedLocationId);
            },
            /**
             * sets the selected location
             * @param {Array} value the selected values
             * @returns {void}
             */
            set (value) {
                const olLayer = layerCollection.getLayerById(this.gridLayerId).getLayerSource().getFeatures().find(feature => feature.get("geoid") === value.geoId);

                this.selectedFeatures.forEach(feature => feature?.setStyle(undefined));
                olLayer.setStyle(this.selectStyle);
                this.setSelectedFeatures([olLayer]);
                this.setSelectedLocationId(value.geoId);
                this.setSelectedLocationBId("");
            }
        },
        selectedLocationBModel: {
            /**
             * gets the selected locationB
             * @returns {Array} the selected values
             */
            get () {
                return this.uniqueGeoIdsWithNames.find(f => f.geoId === this.selectedLocationBId);
            },
            /**
             * sets the selected locationB
             * @param {Array} value the selected values
             * @returns {void}
             */
            set (value) {
                const olLayer = layerCollection.getLayerById(this.gridLayerId).getLayerSource().getFeatures().find(feature => feature.get("geoid") === value.geoId);

                this.selectedFeatures.forEach((feature) => {
                    if (feature?.get("geoid") !== this.selectedLocationId) {
                        feature?.setStyle(undefined);
                    }
                });
                this.setSelectedFeatures([this.selectedFeatures.find(f => f?.get("geoid") === Config.initialSelectedGeoId), olLayer]);
                olLayer.setStyle(this.selectStyle);

                this.setSelectedLocationBId(value.geoId);
            }
        }
    },
    async created () {
        try {
            const response = await axios.get(Config.geoIdToNamePath);

            this.setGeoIdToNameMapping(response.data);
        }
        catch { /* empty */ }

        if (this.uniqueGeoIdsWithNames.length > 0 && this.selectedLocationId === "") {
            const initialSelectedGeoId = this.initialSelectedGeoId || this.uniqueGeoIdsWithNames[0].geoId,
                olLayer = layerCollection.getLayerById(this.gridLayerId).getLayerSource().getFeatures().find(feature => feature.get("geoid") === initialSelectedGeoId);

            this.setSelectedFeatures([olLayer]);
            olLayer.setStyle(this.selectStyle);
            this.setSelectedLocationId(initialSelectedGeoId);
        }
    },
    unmounted () {
        this.selectedFeatures.forEach(feature => feature?.setStyle(undefined));
    },
    methods: {
        ...mapActions("Modules/VpiDashboard", ["getVisitors"]),
        ...mapMutations("Modules/VpiDashboard", ["setSelectedLocationId", "setSelectedLocationBId", "setSelectedFeatures", "setGeoIdToNameMapping"]),
        /**
         * translates the given key, checks if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }

            return this.$t(key, options);
        }
    }
};
</script>

<template>
    <div>
        <div class="locationselectmenu headline mb-2">
            <label
                for="locationSelect"
            >
                {{ translate('additional:modules.tools.vpidashboard.locationSelectMenu.firstLabel') }} {{ mode === 'double' ? " A" : "" }}
            </label>
            <Multiselect
                id="locationSelect"
                v-model="selectedLocationModel"
                :placeholder="translate('additional:modules.tools.vpidashboard.locationSelectMenu.menuPlaceholder')"
                label="name"
                track-by="geoId"
                :options="uniqueGeoIdsWithNames"
            />
        </div>
        <div
            v-if="mode === 'double'"
            class="locationselectmenu headline mb-2"
        >
            <label
                for="locationSelect"
            >
                {{ translate('additional:modules.tools.vpidashboard.locationSelectMenu.secondLabel') }}
            </label>
            <Multiselect
                id="locationBSelect"
                v-model="selectedLocationBModel"
                :placeholder="translate('additional:modules.tools.vpidashboard.locationSelectMenu.menuPlaceholder')"
                label="name"
                track-by="geoId"
                :options="uniqueGeoIdsWithNames.filter(f => f.geoId !== selectedLocationId)"
            />
        </div>
    </div>
</template>

<style scoped>
.locationselectmenu {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin-top: 20px;
}
.locationselectmenu > label {
    font-size: 16px;
    text-wrap: nowrap;
}
</style>
