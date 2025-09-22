<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import TabListContent from "./tabs/TabListContent.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "GeoMarker",
    components: {
        NavTab,
        TabListContent
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
        await this.loadCategories();
        await this.loadDepartments();

        const editLayerInformation = this.allLayerConfigs.filter(item => item.id === this.geoMarkerEditLayerId);

        this.setLayerInformation(editLayerInformation);
        this.fullyLoaded = true;
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setLayerInformation"
        ]),
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments",
            "setMapInteraction"
        ]),
        setCurrentTab (tab) {
            this.setGeoMarkerActiveTab(tab);
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
                <p>Neuen GeoMarker anlegen</p>

                <!-- As an example, will be deleted. -->
                <!-- <p v-if="fullyLoaded">
                    {{ categories }}
                </p> -->

                <!-- As an example, will be deleted. -->
                <!-- <p v-if="fullyLoaded">
                    {{ departments }}
                </p> -->
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
                <p>Filter GeoMarker</p>
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
                    :tab-active="geoMarkerActiveTab === 'tabList'"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
div#geoMarker {
    ul#geoMarkerTabs {
        button.nav-link {
            padding: 0.5rem;
        }
    }

    div#geomarkerTabContent {
        padding-top: 1rem;
    }
}
</style>
