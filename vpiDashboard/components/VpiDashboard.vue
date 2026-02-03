<script>
import getters from "../store/gettersVpiDashboard.js";
import mutations from "../store/mutationsVpiDashboard.js";
import actions from "../store/actionsVpiDashboard.js";
import {mapGetters, mapActions, mapMutations} from "vuex";
import LoaderOverlay from "../utils/loaderOverlay.js";
import {nextTick} from "vue";

// Components Import
import Tabs from "./DashboardTabs.vue";
import TabVisitors from "./Tabs/TabVisitors.vue";
import TabCompareDashboard from "./Tabs/TabCompareDashboard.vue";
import TabGenders from "./Tabs/TabGenders.vue";
import TabInfo from "./Tabs/TabInfo.vue";
import TabOrigins from "./Tabs/TabOrigins.vue";
import VpiLoader from "./VpiLoader.vue";
import TabAgeGroups from "./Tabs/TabAgeGroups.vue";
import LocationSelectMenuVue from "./LocationSelectMenu.vue";
import TabHeatMap from "./Tabs/TabHeatMap.vue";

export default {
    name: "VpiDashboard",
    components: {
        Tabs,
        TabVisitors,
        TabCompareDashboard,
        TabGenders,
        TabInfo,
        VpiLoader,
        TabAgeGroups,
        TabOrigins,
        LocationSelectMenuVue,
        TabHeatMap
    },
    data () {
        return {
            chartType: "bar",
            map: null,
            TabItems: [
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.visitors"),
                    selected: false,
                    showLocationSelectMenu: "single"
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.origins"),
                    selected: false,
                    showLocationSelectMenu: "single"
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.age"),
                    selected: false,
                    showLocationSelectMenu: "single"
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.gender"),
                    selected: false,
                    showLocationSelectMenu: "single"
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.compare"),
                    selected: false,
                    showLocationSelectMenu: "double"
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.heatmap"),
                    selected: false,
                    showLocationSelectMenu: null
                },
                {
                    name: this.translate("additional:modules.tools.vpidashboard.tabitems.info"),
                    selected: false,
                    showLocationSelectMenu: "single"
                }
            ],
            renderTab: false,
            finishedLoading: false
        };
    },
    computed: {
        ...mapGetters("Modules/VpiDashboard", Object.keys(getters)),
        ...mapGetters("Maps", {
            layerById: "getLayerById",
            projectionCode: "projectionCode",
            getVisibleLayerList: "getVisibleLayerList"
        }),
        showLocationSelectMenu () {
            const selectedTab = this.TabItems.find(tab => tab.selected === true);

            return selectedTab?.showLocationSelectMenu;
        }
    },
    watch: {
        async layerConfigs (val) {
            await this.replaceByIdInLayerConfig({layerConfigs: val});
        },
        /**
         * Shows loader.
         * When the showLoader value in state set to true, it shows the loader.
         * Otherwise hides to loader.
         * @param {boolean} val showLoader
         * @returns {void}
         */
        showLoader (val) {
            val ? LoaderOverlay.show() : LoaderOverlay.hide();
        },
        allLocationsArray: async function () {
            this.finishedLoading = true;
            this.renderTab = true;
        }
    },
    async mounted () {
        await this.changeCurrentMouseMapInteractionsComponent({type: this.type, side: this.$attrs.side});
        this.setCurrentMenuWidth({side: this.$attrs.side, width: "40%"});
        this.initCurrentLocale();
        this.map = mapCollection.getMap("2D");
        this.createYearList();
        this.activateGridLayer();
    },
    created () {
        this.initSelectInteraction();
    },
    async unmounted () {
        await this.replaceByIdInLayerConfig({layerConfigs: [{
            id: this.gridLayerId,
            layer: {
                visibility: false
            }
        }]});

        this.setCurrentMenuWidth({side: this.$attrs.side, width: "25%"});
    },
    methods: {
        ...mapMutations("Modules/VpiDashboard", Object.keys(mutations)),
        ...mapMutations("Menu", ["setCurrentMenuWidth"]),
        ...mapActions("Menu", ["changeCurrentMouseMapInteractionsComponent"]),
        ...mapActions("Modules/VpiDashboard", Object.keys(actions)),
        ...mapActions("Maps", ["createVectorLayer"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        createYearList () {
            if (!this.yearList.length) {
                const thisYear = new Date().getFullYear();
                let firstYear = 2024;

                while (firstYear <= thisYear) {
                    this.addYearListEntry(firstYear);
                    firstYear++;
                }
                this.setCurrentIndex(this.yearList.length - 1);
            }
        },
        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
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
         * activates the grid layer and sets the allLocationsArray
         * @returns {void}
         */
        async activateGridLayer () {
            if (this.TabItems[this.currentTabIndex].showLocationSelectMenu) {
                this.setLayerConfigs([{
                    id: this.gridLayerId,
                    layer: {
                        visibility: true,
                        showInLayerTree: true,
                        zIndex: 10
                    }
                }]);
            }

            await nextTick();
            const vpiLayerSource = this.map.getLayers().getArray().find(l => {
                return l.get("id") === this.gridLayerId;
            }).getSource();

            if (vpiLayerSource.getFeatures().length) {
                this.setAllLocationsArray(vpiLayerSource.getFeatures().map(feature => feature.get("geoid")));
            }
            else {
                vpiLayerSource.once("featuresloadend", event => {
                    this.setAllLocationsArray(event?.features.map(feature => feature.get("geoid")));
                });
            }
        }
    }
};
</script>

<template lang="html">
    <div
        class="vpidashboardbasic"
        :class="{ dashboardActive: active }"
    >
        <VpiLoader />
        <div class="row h-100">
            <div class="col-12 col-md-12 col-lg-12 h-100">
                <div class="h-100">
                    <div>
                        <LocationSelectMenuVue
                            v-if="finishedLoading"
                            v-show="showLocationSelectMenu !== null"
                            :mode="showLocationSelectMenu"
                        />
                    </div>
                    <!-- Tabs Component (START) -->
                    <div
                        class="tabs horizontal"
                        disabled="false"
                    >
                        <!-- <Tabs /> -->
                        <Tabs :tab-items="TabItems">
                            <template
                                v-if="renderTab"
                                #tab-content-0
                            >
                                <TabVisitors />
                            </template>
                            <template #tab-content-1>
                                <TabOrigins />
                            </template>
                            <template #tab-content-2>
                                <TabAgeGroups />
                            </template>
                            <template #tab-content-3>
                                <TabGenders />
                            </template>
                            <template #tab-content-4>
                                <TabCompareDashboard />
                            </template>
                            <template #tab-content-5>
                                <TabHeatMap />
                            </template>
                            <template #tab-content-6>
                                <TabInfo />
                            </template>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>
<style scoped>
.vpidashboardbasic.dashboardActive {
    height: 100%;
}
</style>
