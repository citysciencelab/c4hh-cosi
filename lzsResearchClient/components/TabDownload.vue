<script>
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import {mapGetters, mapMutations} from "vuex";
import ArchiveList from "./ArchiveList.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "TabDownload",
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
                details: false,
                preview: false,
                download: false
            }
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "searchAttributeResponse",
            "attributesToDownload"
        ]),
        /**
         * Additional table headers added after sortable headers.
         * @returns {String[]} - Array of header labels.
         */
        additionalHeaders () {
            return [
                this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.position")
            ];
        }
    },
    watch: {
        searchAttributeResponse: {
            handler () {
                this.removeUncheckedFromAttributesToDownload();
            }
        }
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "removeUncheckedFromAttributesToDownload"
        ]),
        returnToSearchTab () {
            this.setCurrentTab("tabSearch");
        }
    }
};
</script>

<template>
    <div id="TabDownload">
        <ArchiveList
            :datasets="attributesToDownload"
            id-prefix="download"
            :show-table-buttons="showTableButtons"
            :additional-headers="additionalHeaders"
            :number-of-results-label="$t('additional:modules.lzsResearchClient.tabs.tabDownload.numberOfResults')"
        />

        <div class="searchButtons">
            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                @click="returnToSearchTab()"
            />
            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabDownload.downloadButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.tabDownload.downloadButtonLabel')"
                :disabled="!attributesToDownload.some(a => a.checked)"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

#TabDownload {
    div.searchButtons {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;

        *:nth-child(2) {
            margin-left: auto;
        }
    }
}
</style>
