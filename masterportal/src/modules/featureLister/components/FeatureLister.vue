<script>
import {mapGetters, mapActions} from "vuex";
import FeatureDetailView from "./FeatureDetailView.vue";
import FeatureListView from "./FeatureListView.vue";
import LayerListView from "./LayerListView.vue";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

/**
 * Feature Lister
 * @module modules/FeatureLister
 */
export default {
    name: "FeatureLister",
    components: {
        LayerListView,
        FeatureListView,
        FeatureDetailView,
        NavTab
    },
    computed: {
        ...mapGetters("Modules/FeatureLister", [
            "layer",
            "activeTab",
            "selectedRow"
        ])
    },
    unmounted () {
        this.switchToThemes();
    },
    methods: {
        ...mapActions("Modules/FeatureLister", [
            "switchBackToList",
            "switchToThemes",
            "switchToDetails"
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
                :active="activeTab === 'themes'"
                target="#feature-lister-themes"
                :interaction="switchToThemes"
            />
            <NavTab
                id="module-feature-lister-list"
                label="common:modules.featureLister.list"
                :active="activeTab === 'list'"
                :disabled="!layer"
                target="#feature-lister-list"
                :interaction="switchBackToList"
            />
            <NavTab
                id="module-feature-lister-details"
                label="common:modules.featureLister.details"
                :active="activeTab === 'details'"
                :disabled="!selectedRow"
                target="#feature-lister-details"
                :interaction="switchToDetails"
            />
        </ul>
        <template
            v-if="activeTab === 'themes'"
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
        <template v-if="activeTab === 'list'">
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
        <template v-if="activeTab === 'details'">
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

.nav-tabs {
border: 0;
}

.feature-lister-list {
    margin-bottom: 0;
    display: contents;
    overflow: auto;
}
.panel-heading {
    color: $dark_grey;
    cursor: default;
    padding: 10px 15px;
    font-weight: bold;
}

</style>
