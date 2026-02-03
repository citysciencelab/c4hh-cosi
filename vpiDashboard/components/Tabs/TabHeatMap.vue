<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import actions from "../../store/actionsVpiDashboard.js";
import getters from "../../store/gettersVpiDashboard.js";

export default {
    name: "TabHeatMap",
    data () {
        return {
            activeLayerId: ""
        };
    },
    computed: {
        ...mapGetters("Modules/VpiDashboard", Object.keys(getters)),
        ...mapGetters("Maps", ["clickCoordinate"]),
        ...mapGetters("Modules/LayerSwiper", {
            layerSwiperActive: "active"
        })
    },
    watch: {
        clickCoordinate: {
            handler () {
                this.collectGfiFeatures();
            },
            deep: true
        }
    },
    beforeMount () {
        if (this.layerConfigs.length === 1) {
            const configs = [];

            this.heatmapLayers.forEach(l => {
                configs.push({
                    id: l.id,
                    layer: {
                        visibility: false,
                        showInLayerTree: true
                    }
                });
            });
            this.setLayerConfigs(this.layerConfigs.concat(configs));
        }
    },
    beforeUnmount () {
        if (this.layerSwiperActive) {
            this.toggleSwiper(this.activeLayerId);
        }
    },
    methods: {
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapActions("Modules/GetFeatureInfo", ["collectGfiFeatures"]),
        ...mapActions("Modules/WmsTime", ["toggleSwiper"]),
        ...mapMutations("Modules/VpiDashboard", ["setLayerConfigs"]),
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
        },
        /**
         * toggles the layer with the given id
         * @param {String} layerId the id of the layer to toggle
         * @returns {void}
         */
        toggleHeatmapLayer (layerId) {
            this.toggleLayer(layerId);
            this.activeLayerId = layerId;
        }
    }
};
</script>

<template>
    <div class="tab">
        <div
            class="tab-panel h-100"
            role="tabpanel"
        >
            <div class="tab-content h100">
                <div class="row d-flex justify-content-center vpi-dashboard-heatmap">
                    <p> {{ translate("additional:modules.tools.vpidashboard.tab.heatmap.headline") }}</p>
                    <div class="row d-flex justify-content-center mt-3">
                        <button
                            v-for="(layer, index) in heatmapLayers"
                            :key="index"
                            :class="['btn', activeLayerId === layer.id ? 'btn-primary' : 'btn-secondary']"
                            @click="toggleHeatmapLayer(layer.id)"
                        >
                            {{ translate(layer.name) }}
                        </button>
                        <p
                            v-for="(line, index) in $t('additional:modules.tools.vpidashboard.tab.heatmap.footnote', {returnObjects: true})"
                            :key="index"
                            class="text-body"
                        >
                            {{ line }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
p {
    font-weight: bold;
}
button {
    margin-top: 10px;
}
.text-body {
    margin-top: 0.5em;
    margin-left: 2em;
}
</style>
