<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {mapActions, mapGetters} from "vuex";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "DistrictSelectorStatisticalAdditionalLayer",
    components: {
        AccordionItem,
        SwitchInput
    },
    data () {
        return {
            // display additional info layers by key true/false
            visibleAdditionalLayers: []
        };
    },
    computed: {
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),
        ...mapGetters("Modules/DistrictSelector", ["additionalInfoLayers"])
    },
    watch: {
        /**
         * @description Watches Layer visiblity changes to determine whether the addtional info layers are active
         * @param {module:ol/layer[]} layerList - An array of visible layers.
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler (visibleLayerConfigs) {
                const newIdList = [],
                    visibleLayerIds = visibleLayerConfigs.map(config => config.id);

                for (const key in this.additionalInfoLayers) {
                    for (const layerId of this.additionalInfoLayers[key]) {
                        if (visibleLayerIds.includes(layerId)) {
                            newIdList.push(key);
                        }
                    }
                }
                this.visibleAdditionalLayers = [...new Set(newIdList)];
            },
            deep: true
        }
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        /**
         * Changes the visibility of the additional layers based on the passed layer name.
         * @param {String} layerName - The name of the additional layer to switch.
         * @returns {void}
         */
        switchAdditionalLayers (layerName) {
            const isLayerVisible = this.visibleAdditionalLayers.includes(layerName);

            for (const id of this.additionalInfoLayers[layerName]) {
                this.replaceByIdInLayerConfig({
                    layerConfigs: [{
                        id,
                        layer: {
                            id,
                            visibility: !isLayerVisible
                        }
                    }]
                });
            }
        }
    }
};

</script>

<template lang="html">
    <AccordionItem
        id="hidden-objects2"
        :title="$t('additional:modules.cosi.districtSelector.additionalLayer')"
        icon="bi bi-layers-half"
    >
        <div class="mb-2">
            {{ $t('additional:modules.cosi.districtSelector.additionalInfoLayersHelp') }}
        </div>
        <SwitchInput
            v-for="(ids, key) in additionalInfoLayers"
            :id="'layerSwitcher'"
            :key="key"
            :aria="key"
            :interaction="() => switchAdditionalLayers(key)"
            :label="key"
        />
    </AccordionItem>
</template>
