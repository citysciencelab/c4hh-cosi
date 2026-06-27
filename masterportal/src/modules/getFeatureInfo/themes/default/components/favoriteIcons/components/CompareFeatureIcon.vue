<script>
import {mapGetters, mapActions} from "vuex";

export default {
    name: "CompareFeatureIcon",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data: function () {
        return {
            gfiFeature: {
                featureId: this.feature.getId(),
                layerId: this.feature.getLayerId(),
                layerName: this.feature.getTitle(),
                attributesToShow: this.feature.getAttributesToShow(),
                properties: this.feature.getMappedProperties()
            }
        };
    },
    computed: {
        ...mapGetters("Modules/CompareFeatures", {isFeatureSelected: "isFeatureSelected", compareFeaturesType: "type"}),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters(["configuredModules"]),
        /**
         * Returns Boolean after checking if feature is on comparison list.
         * @returns {String} Title for the comparelist.
         */
        featureIsOnCompareList () {
            return this.isFeatureSelected(this.gfiFeature);
        }
    },
    watch: {
        /**
         * If the feature is changed with GFI open, the gfiFeature must be changed here.
         * @param {Object} value An object with gfi properties.
         * @returns {void}
         */
        feature (value) {
            this.gfiFeature = {
                featureId: value.getId(),
                layerId: value.getLayerId(),
                layerName: value.getTitle(),
                attributesToShow: value.getAttributesToShow(),
                properties: value.getMappedProperties()
            };
        }
    },
    methods: {
        ...mapActions("Modules/CompareFeatures", ["isFeatureOnCompareList", "removeFeature"]),

        /**
         * Triggers the event "addFeatureToList" of the CompareFeatures module to add the feature.
         * @param {Event} event The click event.
         * @returns {void}
         */
        toogleFeatureToCompareList: function (event) {
            if (event?.target?.classList?.contains("bi-star")) {
                this.isFeatureOnCompareList(this.gfiFeature);
            }
            else {
                const idLayer = this.gfiFeature.layerId,
                    idFeature = this.gfiFeature.featureId;

                this.removeFeature({idFeature, idLayer});
            }
        }
    }
};
</script>

<template>
    <span
        v-if="mode === '2D' && configuredModules.some(module => module.type === compareFeaturesType)"
        class="bootstrap-icon"
        :title="featureIsOnCompareList ? $t('modules.getFeatureInfo.favoriteIcons.compareFeatureIcon.fromCompareList') : $t('modules.getFeatureInfo.favoriteIcons.compareFeatureIcon.toCompareList')"
        role="button"
        tabindex="0"
        @click="toogleFeatureToCompareList"
        @keydown.enter="toogleFeatureToCompareList"
    >
        <i :class="[featureIsOnCompareList ? 'bi-star-fill' : 'bi-star']" />
    </span>
</template>

<style lang="scss" scoped>

$color: #fec44f;

.bi-star-fill {
    color: $color;
}
</style>
