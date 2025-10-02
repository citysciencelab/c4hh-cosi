<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import TabNewContent from "./tabs/TabNewContent.vue";
import TabListContent from "./tabs/TabListContent.vue";
import TabFilterContent from "./tabs/TabFilterContent.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";

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
            fullyLoaded: false
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "categories",
            "departments",
            "geoMarkerActiveTab",
            "geoMarkerEditLayerId"
        ]),
        ...mapGetters(["allLayerConfigs"])
    },
    watch: {
        geoMarkerActiveTab (newValue) {
            switch (newValue) {
                case "tabNew":
                    this.setNewGeoMarkerFeature(null);
                    this.setMapInteraction("Point");
                    break;
                case "tabFilter":
                    this.setMapInteraction(null);
                    break;
                case "tabList":
                    this.setMapInteraction("update");
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

        this.setLayerInformation(editLayerInformation);
        this.fullyLoaded = true;
    },
    unmounted () {
        this.resetGeomarkerFeature();
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setLayerInformation",
            "setNewGeoMarkerFeature"
        ]),
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments",
            "setMapInteraction"
        ]),
        setCurrentTab (tab) {
            this.setGeoMarkerActiveTab(tab);
        },
        /**
         * It resets the selected GeoMarker feature on the map
         * when switching the tab or leaving the addon.
         */
        resetGeomarkerFeature () {
            this.setNewGeoMarkerFeature(null);
            this.setMapInteraction(null);
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
                <TabNewContent />
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
                <TabListContent />
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
