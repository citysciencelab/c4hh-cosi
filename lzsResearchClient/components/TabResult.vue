<script>
import {mapGetters, mapMutations} from "vuex";
import ArchiveList from "./ArchiveList.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";

export default {
    name: "TabResult",
    components: {
        ArchiveList,
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            showTableButtons: {
                georef: true,
                details: true,
                preview: false,
                download: false
            }
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "searchAttributeResponse",
            "progressNow"
        ]),
        /**
         * Additional table headers added after sortable headers.
         * @returns {String[]} - Array of header labels.
         */
        additionalHeaders () {
            return [
                this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.position"),
                this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.details")
            ];
        }
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setSelectedDetail"
        ]),
        /**
         * Called after click on one table row to show details for this primary dataset
         * @param {String} selectedDetail - The selected detail object containing instanceId and primaryDataId to show details for
         * @returns {void}
         */
        openDetails (selectedDetail) {
            this.setCurrentTab("tabDetails");
            this.setSelectedDetail(selectedDetail);
        },
        returnToSearchTab () {
            this.setCurrentTab("tabSearch");
        },
        clearGeomAndGeomIndicator (newGeomIsShownBy = null) {
            this.$refs.archiveList?.clearGeomAndGeomIndicator(newGeomIsShownBy);
        },
        hideGeom () {
            this.$refs.archiveList?.hideGeom();
        },
        showGeomAgain () {
            this.$refs.archiveList?.showGeomAgain();
        },
        syncGeomToInstance (selectedDetail) {
            this.$refs.archiveList?.syncGeomToInstance(selectedDetail);
        }
    }
};
</script>

<template>
    <div
        id="TabResult"
        class="LayoutFrame"
    >
        <ArchiveList
            ref="archiveList"
            :datasets="searchAttributeResponse"
            id-prefix="result"
            :show-table-buttons="showTableButtons"
            :show-group-by-select="true"
            :additional-headers="additionalHeaders"
            :number-of-results-label="$t('additional:modules.lzsResearchClient.tabs.tabResult.numberOfResults')"
            @openDetails="openDetails"
        />

        <div class="FixedContent">
            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                @click="returnToSearchTab()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

#TabResult {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 0.5rem;
}
</style>
