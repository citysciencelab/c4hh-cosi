<script>
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import {mapActions} from "vuex";
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
                    propsForTabContent: {attributes: this.attributes},
                    renderComponent: true
                },
                {
                    id: "tabGraphics",
                    contentId: "tabGraphicsContent",
                    ref: "tabGraphics",
                    label: this.$t("additional:addons.gfiThemes.waterStatistics.tabs.tabGraphics.label"),
                    component: TabGraphics,
                    propsForTabContent: {params: this.params, allAttributes: this.allAttributes},
                    renderComponent: true
                }
            ];
        },
        attributes () {
            const definedAttributes = this.feature.getMappedProperties(),
                  attributesToShow = this.feature.getAttributesToShow();

            return Object.fromEntries(Object.values(attributesToShow).map(a => [a.name, definedAttributes[a.name]]));
        },
        params () {
            return this.feature?.getTheme().params;
        },
        allAttributes () {
            return this.feature.getProperties();
        }
    },
    mounted () {
        const oafParams = this.params?.themeTabs?.find(tab => tab.type === "timeline")?.oafParams;

        const queryParams = {
            url: oafParams?.url,
            collections: oafParams?.collection
        };

        this.queryOafSchema({params: queryParams});
    },
    methods: {
        ...mapActions("Modules/WaterStatistics", [
            "queryOafSchema"
        ])
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
