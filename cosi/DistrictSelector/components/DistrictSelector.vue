<script>
import DistrictSelectorStatistical from "./DistrictSelectorStatistical.vue";
import DistrictSelectorSubject from "./DistrictSelectorSubject.vue";
import {mapGetters, mapMutations} from "vuex";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TabBar from "../../shared/modules/tabBar/components/TabBar.vue";

export default {
    name: "DistrictSelector",
    components: {
        DistrictSelectorStatistical,
        DistrictSelectorSubject,
        TabBar,
        ToolInfo
    },
    data () {
        return {
            tabItems: [
                {
                    type: "statistic",
                    text: this.$t("additional:modules.cosi.districtSelector.tabLabelOne"),
                    icon: "bi bi-bar-chart",
                    disabled: false
                },
                {
                    type: "subject",
                    text: this.$t("additional:modules.cosi.districtSelector.tabLabelTwo"),
                    icon: "bi bi-layers",
                    disabled: true
                }
            ],
            loading: true
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", ["selectedTabItem"]),
        ...mapGetters("Modules/DistrictSelector", {
            cards: "selectionCardsStatisticalData"
        }),
        ...mapGetters("Modules/Language", ["currentLocale"])
    },
    watch: {
        cards: {
            handler () {
                if (this.cards.length > 0) {
                    this.tabItems[1].disabled = false;
                }
                else {
                    this.tabItems[1].disabled = true;
                }
            },
            deep: true
        }
    },
    created () {
        mapCollection.getMap("2D").once("rendercomplete", () => {
            this.loading = false;
        });
        if (!this.selectedTabItem) {
            this.setSelectedTabItem(this.tabItems[0]);
        }
        if (this.cards.length > 0) {
            this.tabItems[1].disabled = false;
        }
    },
    methods: {
        ...mapMutations("Modules/DistrictSelector", ["setSelectedTabItem"])
    }
};
</script>

<template lang="html">
    <ToolInfo
        :locale="currentLocale"
        :loading="loading"
        :summary="$t('additional:modules.cosi.districtSelector.description')"
        :url="{}"
    />
    <hr class="my-4 mt-0 mx-0 text-black-50">
    <TabBar
        class="mb-4"
        :active-item="selectedTabItem"
        :items="tabItems"
        :loading="loading"
        @change="setSelectedTabItem"
    />
    <keep-alive>
        <DistrictSelectorStatistical
            v-if="selectedTabItem.type === 'statistic'"
            :loading="loading"
        />
    </keep-alive>
    <DistrictSelectorSubject
        v-if="selectedTabItem.type === 'subject'"
        :loading="loading"
    />
</template>
