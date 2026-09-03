<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import LayerSliderHandle from "./LayerSliderHandle.vue";
import LayerSliderPlayer from "./LayerSliderPlayer.vue";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

/**
 * Layer Slider
 * @module modules/LayerSlider
 */
export default {
    name: "LayerSlider",
    components: {
        LayerSliderHandle,
        LayerSliderPlayer,
        NavTab
    },
    props: {
        config: {
            type: Object,
            default: () => ({})
        }
    },
    data () {
        return {
            activeTab: "handle"
        };
    },
    computed: {
        ...mapGetters("Modules/LayerSlider", [
            "activeLayer",
            "layerIds",
            "sliderType",
            "title"
        ]),

        /**
         * Returns the configured layer ids for the current menu instance.
         * @returns {Object[]} The configured layer ids.
         */
        configuredLayerIds () {
            return this.config.layerIds || this.layerIds;
        }
    },
    beforeMount () {
        this.applyConfiguredState();
        this.checkIfAllLayersAvailable(this.configuredLayerIds);
        this.addInformationToLayerIds(this.configuredLayerIds);
    },
    activated () {
        this.applyConfiguredState();
        this.checkIfAllLayersAvailable(this.configuredLayerIds);
        this.addInformationToLayerIds(this.configuredLayerIds);
    },
    unmounted () {
        this.setWindowsInterval(null);
        this.resetActiveLayer();
        this.configuredLayerIds.forEach((initialLayerInformation) => this.sendModification(initialLayerInformation));
    },
    methods: {
        ...mapMutations("Modules/LayerSlider", [
            "setConfiguredProperties",
            "resetActiveLayer",
            "setWindowsInterval"
        ]),
        ...mapActions("Modules/LayerSlider", [
            "addInformationToLayerIds",
            "checkIfAllLayersAvailable",
            "sendModification"
        ]),

        /**
         * Applies the menu-provided configuration to the layer slider state.
         * @returns {void}
         */
        applyConfiguredState () {
            this.setConfiguredProperties(this.config);
        },

        changeTab (tabName) {
            this.activeTab = tabName;
        }
    }
};
</script>

<template lang="html">
    <div id="module-layer-slider">
        <h5 class="my-4">
            {{ $t(title) }}
        </h5>
        <ul
            id="layer-slider-tabs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                :id="'handle-tab'"
                :active="activeTab === 'handle'"
                :target="'#handle-tab-pane'"
                :label="'common:modules.layerSlider.sliderTypeHandle'"
                :interaction="() => changeTab('handle')"
            />
            <NavTab
                :id="'player-tab'"
                :active="activeTab === 'player'"
                :target="'#player-tab-pane'"
                :label="'common:modules.layerSlider.sliderTypePlayer'"
                :interaction="() => changeTab('player')"
            />
        </ul>
        <div
            id="myTabContent"
            class="tab-content"
        >
            <div
                id="handle-tab-pane"
                class="tab-pane fade show active"
                role="tabpanel"
                aria-labelledby="handle-tab"
            >
                <LayerSliderHandle />
            </div>
            <div
                id="player-tab-pane"
                class="tab-pane fade"
                role="tabpanel"
                aria-labelledby="player-tab"
                tabindex="0"
            >
                <LayerSliderPlayer />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

#module-layer-slider {
    .form-check-input {
        width: 2.5rem;
        height: 1.5rem;
    }
}


</style>
