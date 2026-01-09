<script>
import {mapGetters, mapMutations} from "vuex";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import TabContainer from "./TabContainer.vue";
import TabDetails from "./tabs/TabDetails.vue";
import TabResult from "./tabs/TabResult.vue";
import TabSearch from "./tabs/TabSearch.vue";
import TabDownload from "./tabs/TabDownload.vue";

export default {
    name: "LzsResearchClient",
    components: {
        SpinnerItem,
        TabContainer
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "showLoadingSpinner"
        ]),
        loadingSpinnerText () {
            return this.$t("additional:modules.lzsResearchClient.loadingSpinnerText.general");
        },
        tabs () {
            return [
                {
                    id: "tabSearch",
                    contentId: "tabSearchContent",
                    ref: "tabSearch",
                    label: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.label"),
                    component: TabSearch,
                    propsForTabContent: {},
                    renderComponent: true
                },
                {
                    id: "tabResult",
                    contentId: "tabResultContent",
                    ref: "tabResult",
                    label: this.$t("additional:modules.lzsResearchClient.tabs.tabResult.label"),
                    component: TabResult,
                    propsForTabContent: {},
                    renderComponent: true
                },
                {
                    id: "tabDetails",
                    contentId: "tabDetailsContent",
                    ref: "tabDetails",
                    label: this.$t("additional:modules.lzsResearchClient.tabs.tabDetails.label"),
                    component: TabDetails,
                    propsForTabContent: {},
                    renderComponent: true
                },
                {
                    id: "tabDownload",
                    contentId: "tabDownloadContent",
                    ref: "tabDownload",
                    label: this.$t("additional:modules.lzsResearchClient.tabs.tabDownload.label"),
                    component: TabDownload,
                    propsForTabContent: {},
                    renderComponent: true
                }
            ];
        }
    },

    /**
     * KeepAlive: This addon uses the Masterportal module caching feature,
     * see docs/Dev/vueComponents/ModuleCaching.md
     * The mounted hook is only called once, when the component is created the first time.
     * The activated and deactivated hooks are called, when the component is
     * shown or closed via "menu" link.
     */
    async mounted () {
        // this.setShowLoadingSpinner(true);
    },
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setShowLoadingSpinner"
        ])
    }
};
</script>

<template lang="html">
    <div id="lzsResearchClient">
        <div
            v-if="showLoadingSpinner"
            class="loadingSpinner"
        >
            <SpinnerItem
                custom-class="spinner"
                class="ms-3"
            />

            <p v-if="loadingSpinnerText">
                {{ loadingSpinnerText }}
            </p>
        </div>

        <template v-else>
            <TabContainer
                :tabs="tabs"
                initial-active-tab-id="tabSearch"
            />
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #lzsResearchClient{
        height: 100%;

        div.loadingSpinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.7);
            z-index: 2;

            div.spinner {
                width: 4rem;
                height: 4rem;
            }

            p {
                background-color: white;
                white-space: pre-line;
                padding: 1.5rem;
            }
        }
    }
</style>
