<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import TabResultTable from "./TabResultTable.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";

export default {
    name: "TabDetails",
    components: {
        TabResultTable,
        FlatButton,
        SpinnerItem,
        ModalItem
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    props: {},
    data () {
        return {
            primaryDataCount: this.getDetailsForSelectedInstanceId?.primaryData?.length ?? 0,
            showTableButtons: {
                georef: false,
                details: false,
                preview: true,
                download: true
            },
            showSpinner: false,
            showPreviewModal: false,
            previewImage: null
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "selectedInstanceId",
            "getDetailsForSelectedInstanceId",
            "nameForArchiveId",
            "dataProtectionClassForArchiveId",
            "progressNow"
        ])
    },
    watch: {
        selectedInstanceId (newValue) {
            if (newValue && !this.getDetailsForSelectedInstanceId?.primaryData) {
                this.showSpinner = true;
                this.fetchPrimarydata({archiveId: this.getDetailsForSelectedInstanceId?.archiveId, instanceId: newValue}).finally(() => {
                    this.showSpinner = false;
                });
            }
        },
        getDetailsForSelectedInstanceId: {
            handler () {
                if (this.getDetailsForSelectedInstanceId?.primaryData) {
                    this.primaryDataCount = this.getDetailsForSelectedInstanceId?.primaryData.length;
                }
            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setSelectedInstanceId"
        ]),
        ...mapActions("Modules/LzsResearchClient", [
            "fetchPrimarydata",
            "downloadPreview",
            "downloadDatafile",
            "downloadSelectedFiles"
        ]),
        returnToResultTab () {
            this.setSelectedInstanceId(null);
            this.setCurrentTab("tabResult");
        },
        returnToSearchTab () {
            this.setSelectedInstanceId(null);
            this.setCurrentTab("tabSearch");
        },
        /**
         * Returns the table headers for the result table
         * removes attributes, that are already available at dataset instance
         * @returns {String[]} - Array of strings to be used as table headers.
         */
        getTableHeaders () {
            const headers = this.getDetailsForSelectedInstanceId?.primaryData ? this.getDetailsForSelectedInstanceId?.primaryData[0].primarydataAttributes.map(p => p.key) : [],
                attributeNames = (this.getDetailsForSelectedInstanceId?.attributes || []).map(attr => attr.name),
                filteredHeaders = headers.filter(header => !attributeNames.includes(header));

            filteredHeaders.push(this.$t("additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB"));

            return filteredHeaders;
        },
        /**
         * Returns the table datasets for the result table
         * removes attributes, that are already available at dataset instance
         * adds extra lines for world files, if available
         * @returns {Object[]} - Object of data to be used as table datasets.
         */
        getTableDatasets () {
            const results = [],
                instanceAttributeNames = (this.getDetailsForSelectedInstanceId?.attributes || []).map(attr => attr.name);

            this.getDetailsForSelectedInstanceId?.primaryData?.forEach(dataset => {
                const attributes = [];

                dataset.primarydataAttributes.forEach(attribute => {
                    if (!instanceAttributeNames.includes(attribute.key)) {
                        attributes.push({
                            name: attribute.key,
                            value: attribute.value
                        });
                    }
                });

                attributes.push({
                    name: this.$t("additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB"),
                    value: (dataset.contentFileSize / 1000000).toFixed(2)
                });

                results.push(
                    {
                        attributes: attributes,
                        instanceId: dataset.primaryDataId,
                        hasPreview: ["TIFF", "JP2"].includes(dataset.geoFileFormat) // are there other formats, that allow a preview?
                    }
                );

                // This part is currently included as long as we cannot download several files as zip compressed folder
                // later the world file and the dossiers / metadata shall be downloaded automatically when downloading a dataset
                if (dataset.georeferencePrimarydata) {
                    const worldFileAttributes = [];

                    dataset.georeferencePrimarydata.primarydataAttributes?.forEach(attribute => {
                        if (!instanceAttributeNames.includes(attribute.key)) {
                            worldFileAttributes.push({
                                name: attribute.key,
                                value: attribute.value
                            });
                        }
                    });

                    worldFileAttributes.push({
                        name: this.$t("additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB"),
                        value: (dataset.georeferencePrimarydata.contentFileSize / 1000000).toFixed(2)
                    });

                    results.push(
                        {
                            attributes: worldFileAttributes,
                            instanceId: dataset.georeferencePrimarydata.primaryDataId,
                            hasPreview: dataset.georeferencePrimarydata.geoFileFormat === "TIFF" // are there other formats, that allow a preview?
                        }
                    );
                }
            });

            return results;
        },
        /**
         * Downloads the preview picture from the server and opens the modal to show the preview if there is one available
         * @param {String} - Primary data identifier to request preview for.
         */
        async showPreview (primaryDatasetId) {
            this.showSpinner = true;
            this.previewImage = await this.downloadPreview({archiveId: this.getDetailsForSelectedInstanceId?.archiveId, instanceId: this.selectedInstanceId, primaryDataId: primaryDatasetId});
            this.showSpinner = false;

            if (this.previewImage) {
                this.showPreviewModal = true;
            }
        },
        /**
         * Downloads the dataset from the server
         * @param {String} - Primary data identifier to download the dataset for.
         */
        downloadDataset (primaryDatasetId) {
            this.showSpinner = true;
            this.downloadDatafile({archiveId: this.getDetailsForSelectedInstanceId?.archiveId, instanceId: this.selectedInstanceId, primaryDataId: primaryDatasetId});

            // Hide spinner with timeout because the download is made with a fake link. There is no possibility to 'wait' for it.
            setTimeout(() => {
                this.showSpinner = false;
            }, 4000);
        },
        download () {
            this.downloadSelectedFiles(this.getDetailsForSelectedInstanceId);
        }
    }
};
</script>

<template>
    <div id="TabDetails">
        <h4> {{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.title") }} </h4>

        <table
            v-if="getDetailsForSelectedInstanceId"
            class="datasetInfoTable"
        >
            <tbody>
                <tr>
                    <td>{{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.datasetInfoTable.archive") }}</td>

                    <td>{{ nameForArchiveId(getDetailsForSelectedInstanceId?.archiveId) }}</td>
                </tr>

                <tr>
                    <td>{{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.datasetInfoTable.datasetProtectionClass") }}</td>

                    <td>{{ dataProtectionClassForArchiveId(getDetailsForSelectedInstanceId?.archiveId)?.name }}</td>
                </tr>

                <tr
                    v-for="(attribute, index) in getDetailsForSelectedInstanceId?.attributes"
                    :id="`detail-tablerow-${index}`"
                    :key="index"
                >
                    <td>{{ attribute.name }}</td>

                    <td>{{ attribute.value }}</td>
                </tr>
            </tbody>
        </table>

        <hr>

        <p class="numberOfResults">
            {{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.numberOfResults") }}

            <span>{{ primaryDataCount }}</span>
        </p>

        <div class="contentDetailsTableContainer">
            <div
                v-if="showSpinner"
                class="loadingDetailsSpinner"
            >
                <SpinnerItem
                    custom-class="spinner"
                    class="ms-3"
                />

                <p>{{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.loading") }}</p>
            </div>

            <TabResultTable
                v-if="primaryDataCount > 0"
                :table-index="`details-table-${selectedInstanceId}`"
                :table-header="getTableHeaders()"
                :table-datasets="getTableDatasets()"
                :show-buttons="showTableButtons"
                :show-checkboxes="false"
                @showPreview="showPreview"
                @download="downloadDataset"
            />
        </div>

        <FlatButton
            v-if="primaryDataCount > 0"
            :disabled="progressNow >= 0"
            :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonAriaLabel')"
            :text="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonText')"
            @click="download()"
        />

        <FlatButton
            id="backToListButton"
            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabDetails.backButtonLabel')"
            :text="$t('additional:modules.lzsResearchClient.tabs.tabDetails.backButtonLabel')"
            @click="returnToResultTab()"
        />

        <FlatButton
            :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
            :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
            @click="returnToSearchTab()"
        />

        <ModalItem
            :show-modal="showPreviewModal"
            @modalHid="showPreviewModal = false"
        >
            <template #default>
                <img
                    v-if="previewImage"
                    class="screenshotPreviewArea"
                    :src="previewImage"
                    :alt="$t('additional:modules.lzsResearchClient.tabs.tabDetail.previewAltText')"
                >
            </template>
        </ModalItem>
    </div>
</template>

<style lang="scss" scoped>
//@import "~variables";

#TabDetails {
    margin-top: 1rem;

    table.datasetInfoTable {
        width: 100%;
    }

    p.numberOfResults {
        margin-top: 1rem;

        span {
            display: inline-block;
            padding: 0.1rem 1rem;
            border: 2px solid $secondary;
            border-radius: 999px;
            background: #fff;
            font-weight: bold;
            margin-left: 1rem;
        }
    }

    div.TabResultTable {
        margin-bottom: 2rem;
    }

    div.loadingDetailsSpinner {
        position: absolute;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        background: rgba(255,255,255,0.7);
        padding-top: 2rem;
        z-index: 3;

        div.spinner {
            width: 3rem;
            height: 3rem;
        }

        p {
            background-color: white;
            white-space: pre-line;
            padding: 1.5rem;
        }
    }
}

div#modal-1-container {
    img.screenshotPreviewArea {
        max-width: 100%;
        max-height: 75vh;
    }

    div#modal-1-inner-wrapper > div:first-child {
        display: flex;
        justify-content: end;
    }
}

</style>
