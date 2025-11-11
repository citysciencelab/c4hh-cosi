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
            availableModes: [
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
        ...mapGetters("Modules/DistrictSelector", ["selectionMode"]),
        ...mapGetters("Modules/DistrictSelector", {
            cards: "selectionCardsStatisticalData"
        }),
        ...mapGetters("Modules/Language", ["currentLocale"])
    },
    watch: {
        cards: {
            handler () {
                if (this.cards.length > 0) {
                    this.availableModes[1].disabled = false;
                }
                else {
                    this.availableModes[1].disabled = true;
                }
            },
            deep: true
        }
    },
    created () {
        mapCollection.getMap("2D").once("rendercomplete", () => {
            this.loading = false;
        });
        if (!this.selectionMode) {
            this.setSelectionMode(this.availableModes[0]);
        }
    },
    methods: {
        ...mapMutations("Modules/DistrictSelector", ["setSelectionMode"])
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
        :active-item="selectionMode"
        :items="availableModes"
        :loading="loading"
        @change="setSelectionMode"
    />
    <keep-alive>
        <DistrictSelectorStatistical
            v-if="selectionMode.type === 'statistic'"
            :loading="loading"
        />
    </keep-alive>
    <DistrictSelectorSubject
        v-if="selectionMode.type === 'subject'"
        :loading="loading"
    />
</template>
