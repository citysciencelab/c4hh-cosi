<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import TabContainer from "./shared/TabContainer.vue";
import TabDetails from "./TabDetails.vue";
import TabResult from "./TabResult.vue";
import TabSearch from "./TabSearch.vue";
import TabDownload from "./TabDownload.vue";
import ConfirmModal from "@shared/modules/modals/components/ConfirmModal.vue";

export default {
    name: "LzsResearchClient",
    components: {
        SpinnerItem,
        IconButton,
        TabContainer,
        ConfirmModal
    },
    data () {
        return {
            modalDismissed: false
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "showLoadingSpinner",
            "requestToken",
            "globalError",
            "errorMessage"
        ]),
        errorOccured () {
            return this.errorMessage !== "";
        },
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
    async activated () {
        this.setShowLoadingSpinner(true);

        await this.fetchRequestToken();

        this.setShowLoadingSpinner(false);
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchRequestToken"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setShowLoadingSpinner",
            "setErrorMessage"
        ]),
        hideErrorMessage () {
            this.setErrorMessage("");
        }
    }
};
</script>

<template lang="html">
    <div id="lzsResearchClient">
        <div
            v-if="errorOccured"
            class="alertError"
        >
            <span>{{ errorMessage }}</span>

            <IconButton
                :class-array="['btn-light', 'me-2', 'errorCloseButton']"
                :aria="$t('additional:modules.lzsResearchClient.tabs.tabResult.table.goToDetails')"
                icon="bi-x"
                @click="hideErrorMessage"
            />
        </div>

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

        <template v-else-if="requestToken">
            <TabContainer
                :tabs="tabs"
                initial-active-tab-id="tabSearch"
            />
        </template>

        <ConfirmModal
            :show-modal="modalDismissed !== true && globalError !== null"
            :modal-title="$t('additional:modules.lzsResearchClient.globalError.title')"
            :modal-content="$t('additional:modules.lzsResearchClient.globalError.content')"
            :button-cancel-hidden="true"
            :button-close-hidden="true"
            @clicked-confirm="modalDismissed = true"
        />
    </div>
</template>

<style lang="scss" scoped>
    //@import "~variables";

    #lzsResearchClient{
        height: 100%;

        div.alertError {
            color: #a94442;
            background-color: #f2dede;
            border-color: #ebccd1;
            padding: 15px;
            margin-bottom: 5px;
            margin-top: 5px;
            border: 1px solid transparent;
            border-radius: 4px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;

            :deep(button.errorCloseButton) {
                opacity: .5;
            }
        }

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
