<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import TabDetails from "./TabDetails.vue";
import TabResult from "./TabResult.vue";
import TabSearch from "./TabSearch.vue";
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
            modalDismissed: false,
            newSearchPerformed: false,
            tabWatcherAttached: false,
            unwatchTabContainer: null,
            initialMenuWidth: "25%"
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "showLoadingSpinner",
            "requestToken",
            "requestTokenExpireTime",
            "globalError",
            "errorMessage",
            "currentProgressValue",
            "progressNow",
            "searchAttributeResponse",
            "selectedDetail",
            "menuWidthOnStart"
        ]),
        ...mapGetters("Menu", [
            "currentMenuWidth"
        ]),
        progressBarWidthClass () {
            return `width: ${this.progressNow}%;`;
        },
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
                }
            ];
        }
    },
    watch: {
        searchAttributeResponse () {
            this.newSearchPerformed = true;
        },
        progressNow (val) {
            if (val === 100) {
                setTimeout(() => {
                    this.setProgressNow(-1);
                    this.setCurrentProgressValue("");
                }, 1000);
            }
        }
    },
    /**
     * KeepAlive: This addon uses the Masterportal module caching feature,
     * see docs/Dev/vueComponents/ModuleCaching.md
     * The mounted hook is only called once, when the component is created the first time.
     * The activated and deactivated hooks are called, when the component is
     * shown or closed via "menu" link.
     * The component is not destroyed when closed, but kept in memory so that previous state is preserved when reopened.
     */
    async activated () {
        const hadToken = Boolean(this.requestToken);

        if (!hadToken) {
            this.setShowLoadingSpinner(true);
        }

        if (!hadToken || this.isTokenExpired()) {
            await this.fetchRequestToken();
        }

        if (!hadToken) {
            this.setShowLoadingSpinner(false);
        }

        if (this.requestToken) {
            await this.attachTabWatcher();
        }

        await this.$nextTick();
        const tabContainerRef = this.$refs.tabContainer;

        if (!tabContainerRef) {
            return;
        }

        // Call handleTabChange to ensure the correct state is set for the active tab when the component is activated.
        this.handleTabChange(tabContainerRef, tabContainerRef.activeTabIdLocal, "tabSearch");

        this.initialMenuWidth = this.currentMenuWidth(this.$attrs.side);
        this.setCurrentMenuWidth({side: this.$attrs.side, width: this.menuWidthOnStart});
    },
    /**
     * Triggered if component is deactivated.
     * Removes the watcher on the TabContainer and hides the geometry in the TabResult.
     */
    deactivated () {
        if (this.unwatchTabContainer) {
            this.unwatchTabContainer();
            this.unwatchTabContainer = null;
        }
        this.tabWatcherAttached = false;

        const tabContainerRef = this.$refs.tabContainer;

        if (!tabContainerRef) {
            return;
        }

        const tabResult = tabContainerRef.$refs.tabResult?.[0];

        if (tabResult) {
            tabResult.hideGeom();
        }

        this.setCurrentMenuWidth({side: this.$attrs.side, width: this.initialMenuWidth});
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchRequestToken"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setShowLoadingSpinner",
            "setErrorMessage",
            "setProgressNow",
            "setCurrentProgressValue"
        ]),
        ...mapMutations("Menu", ["setCurrentMenuWidth"]),
        hideErrorMessage () {
            this.setErrorMessage("");
        },
        /**
         * Handle tab changes in the TabContainer.
         * @param {Object} tabContainerRef - Reference to the TabContainer component.
         * @param {string} newTabId - Id of the newly activated tab.
         * @param {string} oldTabId - Id of the previously active tab.
         */
        handleTabChange (tabContainerRef, newTabId, oldTabId) {
            const tabResult = tabContainerRef.$refs.tabResult?.[0];
            const tabSearch = tabContainerRef.$refs.tabSearch?.[0];

            if (newTabId === "tabSearch") {
                tabResult?.hideGeom();
            }
            else if (oldTabId === "tabSearch") {
                if (newTabId === "tabResult" && this.newSearchPerformed) {
                    tabResult?.clearGeomAndGeomIndicator();
                    this.newSearchPerformed = false;
                }
                else {
                    tabResult?.showGeomAgain();
                }
            }
            else if (oldTabId === "tabDetails") {
                tabResult?.showGeomAgain();
            }

            if (newTabId === "tabDetails") {
                tabResult?.syncGeomToInstance(this.selectedDetail);
            }

            if (newTabId === "tabSearch") {
                tabSearch?.setMapInteractionsActive(true);
            }
            else if (oldTabId === "tabSearch") {
                tabSearch?.setMapInteractionsActive(false);
                tabSearch?.cancelIncompleteDrawing();
            }

            this.setErrorMessage("");
        },
        /**
         * Activates a watcher on the activeTabIdLocal of the TabContainer to react to tab changes.
         * Calls handleTabChange when the active tab changes.
         */
        async attachTabWatcher () {
            if (this.tabWatcherAttached) {
                return;
            }
            await this.$nextTick();

            const tabContainerRef = this.$refs.tabContainer;

            if (!tabContainerRef) {
                return;
            }
            this.tabWatcherAttached = true;

            this.unwatchTabContainer = tabContainerRef.$watch("activeTabIdLocal", (newTabId, oldTabId) => {
                this.handleTabChange(tabContainerRef, newTabId, oldTabId);
            });
        },
        /**
         * Checks if the request token is expired or about to expire.
         * @returns {boolean} - True if the token is expired or about to expire, false otherwise.
         */
        isTokenExpired () {
            const expireTimeInMs = this.requestTokenExpireTime;

            if (!expireTimeInMs) {
                return true;
            }

            const safetyMs = 3e4;

            return Date.now() >= expireTimeInMs - safetyMs;
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
                :aria="$t('additional:modules.lzsResearchClient.tabs.archiveList.table.goToDetails')"
                icon="bi-x"
                @click="hideErrorMessage"
            />
        </div>

        <div
            v-if="progressNow >= 0"
            class="progress"
            role="progressbar"
            :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.progressAriaLabel', {percent: progressNow})"
            :aria-valuenow="progressNow"
            aria-valuemin="0"
            aria-valuemax="100"
        >
            <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                :style="progressBarWidthClass"
            />
        </div>

        <p id="result">
            {{ currentProgressValue }}
        </p>

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
                ref="tabContainer"
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
    @import "bootstrap/scss/progress";

    #lzsResearchClient{
        height: 100%;

        div.progress-bar {
            background-color: #3C5F94;
        }

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
