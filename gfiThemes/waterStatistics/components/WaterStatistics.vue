<script>
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import TabBasicData from "./TabBasicData.vue";
import TabGraphics from "./TabGraphics.vue";

export default {
    name: "WaterStatistics",
    components: {
        TabContainer
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        tabs () {
            return [
                {
                    id: "tabBasicData",
                    contentId: "tabBasicDataContent",
                    ref: "tabBasicData",
                    label: this.$t("additional:addons.gfiThemes.waterStatistics.tabs.tabBasicData.label"),
                    component: TabBasicData,
                    propsForTabContent: {attributes: this.attributes, params: this.params},
                    renderComponent: true
                },
                {
                    id: "tabGraphics",
                    contentId: "tabGraphicsContent",
                    ref: "tabGraphics",
                    label: this.$t("additional:addons.gfiThemes.waterStatistics.tabs.tabGraphics.label"),
                    component: TabGraphics,
                    propsForTabContent: {attributes: this.attributes, params: this.params},
                    renderComponent: true
                }
            ];
        },
        attributes () {
            return this.feature.getMappedProperties();
        },
        params () {
            return this.feature?.getTheme().params;
        }
    }
};
</script>

<template>
    <div class="water-statistics-theme">
        <TabContainer
            ref="tabContainer"
            :tabs="tabs"
            initial-active-tab-id="tabBasicData"
        />
    </div>
</template>

<style lang="scss" scoped>
div.water-statistics-theme {

}
</style>
