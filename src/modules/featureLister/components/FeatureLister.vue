<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import tabStatus from "../constantsTabStatus.js";
import FeatureDetailView from "./FeatureDetailView.vue";
import FeatureListView from "./FeatureListView.vue";
import LayerListView from "./LayerListView.vue";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

/**
 * Feature Lister
 * @module modules/FeatureLister
 * @vue-data {String} enabledTabClass - The CSS-Class for the enabled tab.
 * @vue-data {String} activeTabClass - The CSS-Class "active" tab.
 * @vue-computed {String} themeTabClasses - The class for the current theme-tab.
 */
export default {
    name: "FeatureLister",
    components: {
        LayerListView,
        FeatureListView,
        FeatureDetailView,
        NavTab
    },
    data () {
        return {
            tabStatus: tabStatus
        };
    },
    computed: {
        ...mapGetters("Modules/FeatureLister", [
            "layer",
            "layerListView",
            "featureListView",
            "featureDetailView"
        ])
    },
    unmounted () {
        this.resetToThemeChooser();
        this.removeHighlightFeature();
        this.removePointMarker();
        this.removePolygonMarker();
    },
    methods: {
        ...mapActions("Modules/FeatureLister", [
            "switchBackToList",
            "switchToThemes",
            "switchToDetails"
        ]),
        ...mapActions("Maps", ["removeHighlightFeature", "removePointMarker", "removePolygonMarker"]),
        ...mapMutations("Modules/FeatureLister", [
            "resetToThemeChooser"
        ])
    }
};
</script>

<template lang="html">
    <div
        id="feature-lister"
    >
        <ul
            class="nav nav-tabs"
            role="tablist"
        >
            <NavTab
                id="module-feature-lister-themeChooser"
                label="common:modules.featureLister.chooseTheme"
                :active="layerListView === tabStatus.ACTIVE"
                :enabled="layerListView !== tabStatus.DISABLED"
                target="#feature-lister-themes"
                :interaction="switchToThemes"
            />
            <NavTab
                id="module-feature-lister-list"
                label="common:modules.featureLister.list"
                :active="featureListView === tabStatus.ACTIVE"
                :enabled="featureListView !== tabStatus.DISABLED"
                target="#feature-lister-list"
                :interaction="switchBackToList"
            />
            <NavTab
                id="module-feature-lister-details"
                label="common:modules.featureLister.details"
                :active="featureDetailView === tabStatus.ACTIVE"
                :enabled="featureDetailView !== tabStatus.DISABLED"
                target="#feature-lister-details"
                :interaction="switchToDetails"
            />
        </ul>
        <template
            v-if="layerListView === tabStatus.ACTIVE"
        >
            <div
                id="feature-lister-themes"
                class="panel panel-default"
            >
                <div
                    id="feature-lister-themes-header"
                    class="panel-heading"
                >
                    {{ $t("common:modules.featureLister.visibleVectorLayers") }}
                </div>
                <LayerListView />
            </div>
        </template>
        <template v-if="featureListView === tabStatus.ACTIVE">
            <div
                id="feature-lister-list-header"
                class="panel-heading"
            >
                <span>{{ $t(layer.name) }}</span>
            </div>
            <div
                id="feature-lister-list"
                class="panel panel-default feature-lister-list"
            >
                <FeatureListView />
            </div>
        </template>
        <template v-if="featureDetailView === tabStatus.ACTIVE">
            <div
                id="feature-lister-details-header"
                class="panel-heading"
            >
                <span> {{ $t("common:modules.featureLister.detailsOfSelected") }} </span>
            </div>
            <FeatureDetailView />
        </template>
    </div>
</template>


<style lang="scss" scoped>

.feature-lister-list {
    margin-bottom: 0;
    display: contents;
    overflow: auto;
}
.panel-heading {
    color: $dark_grey;
    cursor: default;
    border-left: 1px solid $light_grey;
    border-right: 1px solid $light_grey;
    padding: 10px 15px;
    border-bottom: 1px solid transparent;
    font-weight: bold;
}

</style>
