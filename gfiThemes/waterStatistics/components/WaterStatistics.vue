<script>
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import {mapActions, mapGetters} from "vuex";
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
        ...mapGetters("Modules/WaterStatistics", [
            "oafSchema"
        ]),
        tabs () {
            const tabParams = this.params?.themeTabs?.map(tab => {
                const tabProps = tab.type === "gfiAttributes"
                    ? {attributes: this.attributes}
                    : {
                        allAttributes: this.allAttributes,
                        params: tab
                    };

                return {
                    id: String(tab.tabId),
                    contentId: tab.type === "gfiAttributes" ? "tabBasicDataContent" : "tabGraphicsContent",
                    ref: tab.type === "gfiAttributes" ? "tabBasicData" : "tabGraphics",
                    label: tab.title,
                    component: tab.type === "gfiAttributes" ? TabBasicData : TabGraphics,
                    propsForTabContent: tabProps,
                    renderComponent: true
                };
            });

            return tabParams;
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
        },
        themeTabs () {
            return this.params?.themeTabs || [];
        }
    },
    mounted () {
        if (this.oafSchema) {
            return;
        }

        const oafParams = this.themeTabs?.find(tab => "oafParams" in tab).oafParams,
              queryParams = {
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
            initial-active-tab-id="1"
        />
    </div>
</template>

<style lang="scss" scoped>
div.water-statistics-theme {

}
</style>
