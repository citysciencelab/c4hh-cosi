<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import TabNewContent from "./tabs/TabNewContent.vue";
import TabListContent from "./tabs/TabListContent.vue";
import TabFilterContent from "./tabs/TabFilterContent.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";

export default {
    name: "GeoMarker",
    components: {
        NavTab,
        TabListContent,
        TabNewContent,
        TabFilterContent
    },
    data () {
        return {
            fullyLoaded: false,
            renderListKey: 0
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "categories",
            "departments",
            "geoMarkerActiveTab",
            "geoMarkerEditLayerId",
            "rollbackGeoMarkerFeature",
            "geoMarkerFeatureList",
            "newGeoMarkerCreated",
            "isFilterApplied",
            "geoMarkerFeatureSelected",
            "reloadIntervalId"
        ]),
        ...mapGetters(["allLayerConfigs"])
    },
    watch: {
        geoMarkerActiveTab (newValue, oldValue) {
            switch (newValue) {
                case "tabNew":
                    this.setNewGeoMarkerFeature(null);
                    this.setGeoMarkerUpdateFeature(null);
                    this.setMapInteraction("Point");
                    this.setNewGeoMarkerCreated(false);
                    this.removePointMarker();

                    if (this.rollbackGeoMarkerFeature && oldValue === "tabList") {
                        this.rollbackGeoMarkerUpdateFeature();
                        this.$refs.tabList && (this.$refs.tabList.geoMarkerUpdateMode = false);
                    }
                    break;
                case "tabFilter":
                    this.setMapInteraction(null);
                    this.setGeoMarkerUpdateFeature(null);
                    this.$refs.tabList.resetGeoMarkerForm();
                    this.removePointMarker();
                    this.setScrollToGeoMarkerId(null);

                    if (this.rollbackGeoMarkerFeature && oldValue === "tabList") {
                        this.rollbackGeoMarkerUpdateFeature();
                        this.$refs.tabList && (this.$refs.tabList.geoMarkerUpdateMode = false);
                    }
                    break;
                case "tabList":
                    this.setMapInteraction(null);
                    this.setGeoMarkerUpdateFeature(null);
                    this.setNewGeoMarkerFeature(null);

                    if (!this.newGeoMarkerCreated) {
                        this.setGeoMarkerFeatureSelected(null);
                    }
                    break;
                default:
                    this.setMapInteraction(null);
            }
        }
    },
    async mounted () {
        this.setCurrentTab("tabFilter");

        await this.loadCategories();
        await this.loadDepartments();

        const editLayerInformation = this.allLayerConfigs.filter(item => item.id === this.geoMarkerEditLayerId);

        this.activateGeoMarkerReloading();

        this.setLayerInformation(editLayerInformation);
        await this.getGeoMarkerEditLayerUrl();
        this.fullyLoaded = true;
    },
    activated () {
        // keep alive lifecycle hook for module caching
    },
    deactivated () {
        // keep alive lifecycle hook for module caching
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setLayerInformation",
            "setNewGeoMarkerFeature",
            "setGeoMarkerUpdateFeature",
            "setGeoMarkerFeatureSelected",
            "setGeoMarkerFeatureList",
            "setLockListSelection",
            "setNewGeoMarkerCreated",
            "setScrollToGeoMarkerId",
            "setReloadIntervalId"
        ]),
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments",
            "setMapInteraction",
            "getGeoMarkerEditLayerUrl",
            "rollbackGeoMarkerUpdateFeature"
        ]),
        ...mapActions("Maps", ["removePointMarker"]),
        setCurrentTab (tab) {
            this.setGeoMarkerActiveTab(tab);
        },
        activateGeoMarkerReloading () {
            // Reloading the GeoMarker features every minute to have latest data all the time
            if (this.reloadIntervalId) {
                clearInterval(this.reloadIntervalId);
                this.setReloadIntervalId(null);
            }

            const reloadInterval = setInterval(async () => {
                let allNewFeaturesLoaded = [];
                // get all possible layerIds
                const layerIds = Object.values(this.departments).flatMap(options => [
                        options.layerIds.offen,
                        options.layerIds.inaktiv,
                        options.layerIds.geschlossen
                    ]),
                    loadPromises = layerIds.map(layerId => {
                        return new Promise(resolve => {
                            const layer = layerCollection.getLayerById(layerId);

                            // the layer is currently visible
                            if (layer && layer.layer && layer.layer.isVisible()) {
                                const layerSource = layer.getLayerSource();

                                // reload layer features
                                layerSource?.refresh();

                                // wait until all features are loaded
                                layerSource?.once("featuresloadend", () => {
                                    allNewFeaturesLoaded = allNewFeaturesLoaded.concat(layerSource.getFeatures());
                                    resolve();
                                });
                            }
                            // resolve as long as the layer is not visible
                            else {
                                resolve();
                            }
                        });
                    });

                await Promise.all(loadPromises);

                // recreate the addon state after having reloaded all visible layers
                // if the filter has been applied before, re-filter all features
                if (this.isFilterApplied) {
                    await this.$refs.tabFilter?.updateFilterSelection(false, false);
                }
                // if the filter has not been applied before but one or more features are visible in the list (e.g. GFI)
                // refresh the list entries with newly loaded feature parameters
                else if (this.geoMarkerFeatureList.length > 0) {
                    const filteredIds = this.geoMarkerFeatureList.map((feat) => feat.getId()),
                        newFeatureList = allNewFeaturesLoaded.filter((feat) => {
                            return filteredIds.includes(feat.getId());
                        }),
                        uniqueNewFeatures = [],
                        seenIds = new Set();

                    newFeatureList.forEach(feat => {
                        const id = feat.getId();

                        if (!seenIds.has(id)) {
                            seenIds.add(id);
                            uniqueNewFeatures.push(feat);
                        }
                    });

                    this.setGeoMarkerFeatureList(uniqueNewFeatures);
                }

                // if there are features in the list after having refreshed filtering and / or GFI list entries, refresh the list
                if (this.geoMarkerFeatureList.length > 0) {
                    this.renderListKey++;

                    // if a GeoMarker was selected before, search for this GeoMarker in the list and re-select it to update the parameters in the form
                    if (this.geoMarkerFeatureSelected) {
                        const selectedID = this.geoMarkerFeatureSelected.getId(),
                            updatedSelectedFeature = this.geoMarkerFeatureList.filter((feat) => {
                                return feat.getId() === selectedID;
                            });

                        if (updatedSelectedFeature && updatedSelectedFeature.length > 0) {
                            this.setGeoMarkerFeatureSelected(updatedSelectedFeature[0]);
                        }
                    }
                }

            }, 600000);

            this.setReloadIntervalId(reloadInterval);
        }
    }
};
</script>

<template>
    <div id="geoMarker">
        <ul
            id="geoMarkerTabs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                id="tabNew"
                :active="geoMarkerActiveTab === 'tabNew'"
                target="#tabNewContent"
                :label="$t('additional:modules.geoMarker.tabs.tabNew.label')"
                @click="setCurrentTab('tabNew')"
            />

            <NavTab
                id="tabFilter"
                :active="geoMarkerActiveTab === 'tabFilter'"
                target="#tabFilterContent"
                :label="$t('additional:modules.geoMarker.tabs.tabFilter.label')"
                @click="setCurrentTab('tabFilter')"
            />

            <NavTab
                id="tabList"
                :active="geoMarkerActiveTab === 'tabList'"
                target="#tabListContent"
                :label="$t('additional:modules.geoMarker.tabs.tabList.label')"
                :active-tab="geoMarkerActiveTab === 'tabList'"
                @click="setCurrentTab('tabList')"
            />
        </ul>

        <div
            id="geomarkerTabContent"
            class="tab-content"
        >
            <div
                v-if="fullyLoaded"
                id="tabNewContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabNew' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabNew"
                tabindex="0"
            >
                <TabNewContent
                    :tab-active="geoMarkerActiveTab === 'tabNew'"
                />
            </div>

            <div
                id="tabFilterContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabFilter' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabFilter"
                tabindex="0"
            >
                <TabFilterContent
                    ref="tabFilter"
                    :tab-active="geoMarkerActiveTab === 'tabFilter'"
                />
            </div>

            <div
                id="tabListContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabList' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabList"
                tabindex="0"
            >
                <TabListContent
                    ref="tabList"
                    :key="renderListKey"
                    :tab-active="geoMarkerActiveTab === 'tabList'"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
div#geoMarker {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    margin-top: -1.5rem;

    ul#geoMarkerTabs {
        button.nav-link {
            padding: 0.5rem;
        }
    }

    div#geomarkerTabContent {
        height: 100%;
        overflow: hidden;
        padding-top: 1rem;

        div#tabNewContent {
            height: 100%;
        }

        div#tabFilterContent.active {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            overflow: hidden;
            height: 100%;
        }

        div#tabListContent.active {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            overflow: hidden;
            height: 100%;
        }
    }
}
</style>
