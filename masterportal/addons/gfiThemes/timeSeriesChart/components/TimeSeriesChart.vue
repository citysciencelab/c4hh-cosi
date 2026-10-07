<script>
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import TabBasicData from "./TabBasicData.vue";
import TabGraphics from "./TabGraphics.vue";

export default {
    name: "TimeSeriesChart",
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
        ...mapGetters("Modules/TimeSeriesChart", [
            "oafSchema",
            "menuWidthOnStart"
        ]),
        ...mapGetters(["isMobile"]),
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

            return Object.fromEntries(Object.keys(attributesToShow).map(key => [this.oafSchema?.properties?.[key]?.title, definedAttributes[key]]));
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

        if (!this.isMobile) {
            this.setMenuWidthSelectedForGfi(this.menuWidthOnStart);
            this.increaseSidebarWidth();
        }
    },
    unmounted () {
        if (!this.isMobile) {
            this.resetSidebarWidth();
        }
    },
    methods: {
        ...mapActions("Modules/TimeSeriesChart", [
            "queryOafSchema",
            "increaseSidebarWidth",
            "resetSidebarWidth"
        ]),
        ...mapMutations("Modules/TimeSeriesChart", [
            "setMenuWidthSelectedForGfi"
        ])
    }
};
</script>

<template>
    <div class="time-series-chart-theme">
        <TabContainer
            ref="tabContainer"
            :tabs="tabs"
            initial-active-tab-id="1"
        />
    </div>
</template>

<style lang="scss" scoped>
div.time-series-chart-theme {

}
</style>
