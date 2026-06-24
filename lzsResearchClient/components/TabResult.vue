<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
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
         * Counts the number of datasets currently in the list.
         * @returns {Number} - Count of dataset objects
         */
        numberOfResults () {
            return this.searchAttributeResponse.length;
        },
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
            "setSelectedInstanceId"
        ]),
        ...mapActions("Modules/LzsResearchClient", [
            "downloadSelectedFiles"
        ]),
        /**
         * Called after click on one table row to show details for this primary dataset
         * @param {String} datasetInstanceId - the instance id of the dataset to show details for
         * @returns {void}
         */
        openDetails (datasetInstanceId) {
            this.setCurrentTab("tabDetails");
            this.setSelectedInstanceId(datasetInstanceId);
        },
        returnToSearchTab () {
            this.setCurrentTab("tabSearch");
        },
        toDownload () {
            this.setCurrentTab("tabDownload");
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
        syncGeomToInstance (datasetInstanceId) {
            this.$refs.archiveList?.syncGeomToInstance(datasetInstanceId);
        },
        download () {
            this.downloadSelectedFiles(this.searchAttributeResponse);
        }
    }
};
</script>

<template>
    <div id="TabResult">
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

        <div class="searchButtons">
            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                @click="returnToSearchTab()"
            />

            <FlatButton
                v-if="numberOfResults > 0"
                :disabled="progressNow >= 0"
                :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonAriaLabel')"
                :text="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonText')"
                @click="download()"
            />

            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabResult.toDownload')"
                :text="$t('additional:modules.lzsResearchClient.tabs.tabResult.toDownload')"
                :disabled="!searchAttributeResponse.some(d => d.checked)"
                @click="toDownload()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

#TabResult {
    div.searchButtons {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;

        *:nth-child(2) {
            margin-left: auto;
        }
    }

    :deep(.attribute-select) {
        .multiselect,
        .multiselect__input::placeholder,
        .multiselect__option {
            color: $black;
            font-weight: normal;
        }

        .multiselect__option {
            &:after,
            &--selected,
            &--selected:after {
                color: black;
                background: $light_grey_hover;
            }

            &--highlight,
            &--highlight:after {
                color: $white;
                background: $secondary;
            }
        }
    }
}
</style>
