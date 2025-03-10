<script>
import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
    name: "DashboardTabs",
    props: {
        tabItems: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    computed: {
        ...mapGetters("Modules/VpiDashboard", ["gridLayerId", "currentTabIndex", "selectedLocationBId", "selectedFeatures"]),
        tabItemsComputed () {
            return this.tabItems;
        }
    },
    mounted () {
        this.selectTab(this.currentTabIndex);
    },
    methods: {
        ...mapMutations("Modules/VpiDashboard", ["setCurrentTabIndex", "setSelectedLocationBId"]),
        ...mapActions("Modules/VpiDashboard", ["toggleLayer"]),
        /**
         * reacts on the change of tab in the dashboard
         * @param {Integer} selectedIndex number of selected tab
         * @returns {void}
         */
        selectTab (selectedIndex) {
            this.setCurrentTabIndex(selectedIndex);

            this.tabItems.forEach((tab, index) => {
                tab.selected = index === selectedIndex;
            });
            this.toggleLayer(this.tabItemsComputed[selectedIndex].showLocationSelectMenu ? this.gridLayerId : "");
            if (this.selectedLocationBId) {
                this.selectedFeatures.find(f => f?.get("geoid") === this.selectedLocationBId).setStyle(null);
                this.setSelectedLocationBId("");
            }
        }
    }
};
</script>

<template>
    <div id="vpiDashboard-tabs">
        <ul class="nav nav-tabs">
            <li
                v-for="(tab, index) in tabItemsComputed"
                :key="index"
                class="nav-item"
            >
                <a
                    class="nav-link"
                    :class="{ active: tab.selected }"
                    role="button"
                    tabindex="0"
                    @click="selectTab(index)"
                    @keydown="selectTab(index)"
                >{{ tab.name }}</a>
            </li>
        </ul>
        <div :class="`tab-content-` + currentTabIndex">
            <slot :name="`tab-content-` + currentTabIndex" />
        </div>
    </div>
</template>

<style scoped>
.nav{
    margin-bottom:1rem;
}
.nav-item{
    cursor: pointer;
    color:black;
    font-size: 0.7rem;
}

.nav-item .nav-link{
    color:gray;
}
</style>
