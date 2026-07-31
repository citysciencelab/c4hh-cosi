<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import TabResultTable from "./TabResultTable.vue";
import SumOfCheckedFiles from "./SumOfCheckedFiles.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import {roundFileSizeToFixed} from "../utils/zipHelpers";
import {getTranslationForAttribute, capitalizeString} from "../utils/translationHelpers";

export default {
    name: "TabDetails",
    components: {
        TabResultTable,
        SumOfCheckedFiles,
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
            showSpinner: false,
            showPreviewModal: false,
            previewImage: null,
            sumOfCheckedFilesProgress: 0
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "selectedDetail",
            "findDatasetInAttributes",
            "getNameForArchiveId",
            "getDataProtectionClassForArchiveId",
            "progressNow",
            "placeholderDataClassList"
        ]),
        /**
         * Returns the table datasets for the result table
         * removes attributes, that are already available at dataset instance
         * adds extra lines for world files, if available
         * @returns {Object[]} - Object of data to be used as table datasets.
         */
        tableDatasets () {
            const results = [],
                  details = this.getDetailsForSelectedDetail,
                  instanceAttributeNames = (details?.attributes || []).map(attr => attr.name);

            details?.primaryData?.forEach(dataset => {
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
                    value: roundFileSizeToFixed(dataset.fileSizeBytes / 1e6, true)
                });

                results.push(
                    {
                        attributes: attributes,
                        instanceId: details?.instanceId,
                        primaryDataId: dataset.primaryDataId,
                        hasPreview: ["TIFF", "JP2"].includes(dataset.geoFileFormat), // are there other formats, that allow a preview?
                        checked: dataset.checked
                    }
                );
            });

            return results;
        },
        showTableButtons () {
            return {
                georef: false,
                details: false,
                preview: this.tableDatasets.some(d => d.hasPreview),
                download: true
            };
        },
        primaryDataCount () {
            return this.getDetailsForSelectedDetail?.primaryData?.length ?? 0;
        },
        getDetailsForSelectedDetail () {
            return this.findDatasetInAttributes(this.selectedDetail.instanceId, this.selectedDetail.primaryDataId);
        },
        somethingCheckedForDownload () {
            return this.getDetailsForSelectedDetail?.primaryData?.some(p => p.checked);
        }
    },
    watch: {
        async selectedDetail (newValue) {
            if (newValue?.instanceId && !this.getDetailsForSelectedDetail?.primaryData) {
                this.showSpinner = true;
                try {
                    await this.fetchPrimarydata({
                        archiveId: this.getDetailsForSelectedDetail?.archiveId,
                        instanceId: newValue.instanceId
                    });
                }
                catch (error) {
                    this.setErrorMessage(this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.loadErrors.details"));
                }
                finally {
                    this.showSpinner = false;
                }
            }
        }
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setSelectedDetail",
            "setErrorMessage"
        ]),
        ...mapActions("Modules/LzsResearchClient", [
            "fetchPrimarydata",
            "downloadPreview",
            "downloadSelectedFiles"
        ]),
        returnToResultTab () {
            this.setSelectedDetail({
                instanceId: null,
                primaryDataId: null
            });
            this.setCurrentTab("tabResult");
        },
        returnToSearchTab () {
            this.setSelectedDetail({
                instanceId: null,
                primaryDataId: null
            });
            this.setCurrentTab("tabSearch");
        },
        /**
         * Returns the table headers for the result table
         * removes attributes, that are already available at dataset instance
         * @returns {String[]} - Array of strings to be used as table headers.
         */
        getTableHeaders () {
            const details = this.getDetailsForSelectedDetail,
                  headers = details?.primaryData ? details?.primaryData[0].primarydataAttributes.map(p => p.key) : [],
                  attributeNames = (details?.attributes || []).map(attr => attr.name),
                  filteredHeaders = headers
                      .filter(header => !attributeNames.includes(header))
                      .map((header) => {
                          return capitalizeString(getTranslationForAttribute(`additional:modules.lzsResearchClient.tabs.tabDetails.${header.toLowerCase()}`, header));
                      });

            filteredHeaders.push(this.$t("additional:modules.lzsResearchClient.tabs.tabDetails.fileSizeMB"));

            if (this.showTableButtons.preview) {
                filteredHeaders.push(this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.preview"));
            }

            if (this.showTableButtons.download) {
                filteredHeaders.push(this.$t("additional:modules.lzsResearchClient.tabs.archiveList.table.headers.download"));
            }

            return filteredHeaders;
        },
        /**
         * Downloads the preview picture from the server and opens the modal to show the preview if there is one available
         * @param {String} selectedDetail - The selected detail object containing instanceId and primaryDataId of the detail to request preview for.
         */
        async showPreview (selectedDetail) {
            this.showSpinner = true;
            this.previewImage = await this.downloadPreview({archiveId: this.getDetailsForSelectedDetail?.archiveId, instanceId: selectedDetail.instanceId, primaryDataId: selectedDetail.primaryDataId});
            this.showSpinner = false;

            if (this.previewImage) {
                this.showPreviewModal = true;
            }
        },
        /**
         * Returns all datasets that are checked or match the given primaryDataId,
         *  adds datasets contained in "filenamesToAddToDownload" and calculates fileSizeBytes for the selected primaryData only.
         * @param {String} primaryDataId - Primary data identifier to download the dataset for.
         * @returns {Object} The dataset object containing all datasets relevant for download.
         */
        getAllFilesForDownload (primaryDataId) {
            const onlySelectedPrimaryData = JSON.parse(JSON.stringify(this.getDetailsForSelectedDetail || {})),
                  filenamesToAddToDownload = this.placeholderDataClassList?.[onlySelectedPrimaryData?.archiveId]?.FILES_TO_ADD_TO_SINGLE_DOWNLOAD;

            onlySelectedPrimaryData.primaryData = (onlySelectedPrimaryData.primaryData || []).filter(p => {
                if (primaryDataId) {
                    return p.primaryDataId === primaryDataId ||
                        (filenamesToAddToDownload && filenamesToAddToDownload.includes(p.contentFilename));
                }

                return p.checked ||
                    (filenamesToAddToDownload && filenamesToAddToDownload.includes(p.contentFilename));
            });
            onlySelectedPrimaryData.fileSizeBytes = onlySelectedPrimaryData.primaryData.reduce(
                (sum, p) => sum + (p.fileSizeBytes ?? 0), 0
            );

            return onlySelectedPrimaryData;
        },
        /**
         * Downloads the dataset from the server
         * @param {String} primaryDataId - Primary data identifier to download the dataset for.
         * @returns {void}
         */
        downloadDataset (primaryDataId) {
            this.showSpinner = true;

            this.downloadSelectedFiles(this.getAllFilesForDownload(primaryDataId));

            // Hide spinner with timeout because the download is made with a fake link. There is no possibility to 'wait' for it.
            setTimeout(() => {
                this.showSpinner = false;
            }, 4000);
        },
        /**
         * Downloads all checked datasets from the server
         * @returns {void}
         */
        downloadChecked () {
            this.downloadSelectedFiles(this.getAllFilesForDownload());
        },
        /**
         * Returns the translated label for an attribute key, falling back to the raw attribute name if no translation exists.
         * @param {String} key - The attribute key to translate.
         * @param {String} fallback - The raw attribute name to use if no translation is found.
         * @returns {String} The translated label or the fallback value.
         */
        getTranslationForAttributeWrapper (key, fallback) {
            return capitalizeString(getTranslationForAttribute(key, fallback));
        }
    }
};
</script>

<template>
    <div
        id="TabDetails"
        class="InnerLayoutFrame"
    >
        <div class="FixedContent top-header details-header">
            <div class="tableHeaderDetailsTable">
                <p class="numberOfResults">
                    {{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.numberOfResults") }}

                    <span>{{ primaryDataCount }}</span>
                </p>

                <FlatButton
                    v-if="primaryDataCount > 0"
                    id="tabDetailsDownloadButton"
                    :disabled="progressNow >= 0 || !somethingCheckedForDownload || sumOfCheckedFilesProgress > 100"
                    :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonAriaLabel')"
                    :text="$t('additional:modules.lzsResearchClient.zipAndDownload.buttonText')"
                    @click="downloadChecked()"
                />
            </div>

            <SumOfCheckedFiles
                v-if="somethingCheckedForDownload"
                :checked-datasets="[getAllFilesForDownload()]"
                @update:progress-percentage="sumOfCheckedFilesProgress = $event"
            />
        </div>

        <div class="ScrollableContent">
            <h4> {{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.title") }} </h4>

            <table
                v-if="getDetailsForSelectedDetail"
                class="datasetInfoTable"
            >
                <tbody>
                    <tr>
                        <td>{{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.datasetInfoTable.archive") }}</td>

                        <td>{{ getNameForArchiveId(getDetailsForSelectedDetail?.archiveId) }}</td>
                    </tr>

                    <tr>
                        <td>{{ $t("additional:modules.lzsResearchClient.tabs.tabDetails.datasetInfoTable.datasetProtectionClass") }}</td>

                        <td>{{ getDataProtectionClassForArchiveId(getDetailsForSelectedDetail?.archiveId)?.name }}</td>
                    </tr>

                    <tr
                        v-for="(attribute, index) in (getDetailsForSelectedDetail?.attributes || [])"
                        :id="`detail-tablerow-${index}`"
                        :key="index"
                    >
                        <td>{{ getTranslationForAttributeWrapper(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`, attribute.name) }}</td>

                        <td>{{ attribute.value }}</td>
                    </tr>
                </tbody>
            </table>

            <hr>

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
                    :table-index="`details-table-${selectedDetail.primaryDataId || selectedDetail.instanceId}`"
                    :table-header="getTableHeaders()"
                    :table-datasets="tableDatasets"
                    :show-buttons="showTableButtons"
                    @showPreview="showPreview"
                    @download="downloadDataset"
                />
            </div>
        </div>

        <div class="FixedContent buttons-footer">
            <FlatButton
                id="backToListButton"
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabDetails.backButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.tabDetails.backButtonLabel')"
                :secondary="true"
                @click="returnToResultTab()"
            />

            <FlatButton
                :aria-label="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                :text="$t('additional:modules.lzsResearchClient.tabs.backToSearchButtonLabel')"
                :secondary="true"
                @click="returnToSearchTab()"
            />
        </div>
    </div>

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
</template>

<style lang="scss" scoped>

#TabDetails {
    height: 100%;

    .details-header {
        flex-direction: column;

        div.tableHeaderDetailsTable {
            display: flex;
            gap: 1rem;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0.5rem;

            p.numberOfResults {
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;

                span {
                    display: inline-block;
                    padding: 0.1rem 1rem;
                    border: 2px solid $secondary;
                    border-radius: 999px;
                    background: #fff;
                    font-weight: bold;
                    font-family: $font_family_accent;
                    margin-left: 1rem;
                }
            }
        }
    }

    table.datasetInfoTable {
        width: 100%;
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
