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
        ])
    },
    beforeMount () {
        this.checkIfAllLayersAvailable(this.layerIds);
        this.addInformationToLayerIds(this.layerIds);
    },
    unmounted () {
        this.setWindowsInterval(null);
        this.resetActiveLayer();
        this.layerIds.forEach((initialLayerInformation) => this.sendModification(initialLayerInformation));
    },
    methods: {
        ...mapMutations("Modules/LayerSlider", [
            "resetActiveLayer",
            "setWindowsInterval"
        ]),
        ...mapActions("Modules/LayerSlider", [
            "addInformationToLayerIds",
            "checkIfAllLayersAvailable",
            "sendModification"
        ]),
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
