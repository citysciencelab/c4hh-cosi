<script>
import {mapGetters} from "vuex";
import {getHumanReadableFileSize} from "../utils/zipHelpers.js";

export default {
    name: "SumOfCheckedFiles",
    props: {
        checkedDatasets: {
            type: Array,
            required: true
        }
    },
    emits: ["update:progressPercentage"],
    data () {
        return {
            bytesForMetadata: 50000
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "maxDownloadMB",
            "getDossierIdsForArchiveId",
            "isFetchingPrimaryData"
        ]),
        maxDownloadBytes () {
            return this.maxDownloadMB * 1e6;
        },
        progressPercentage () {
            if (this.maxDownloadMB > 0) {
                return this.sumOfFileSizes / this.maxDownloadBytes * 100;
            }
            return 0;
        },
        progressBarCss () {
            let backgroundColor = "#3C5F94";

            if (this.progressPercentage > 100) {
                backgroundColor = "#E10019";
            }

            return {
                "--maxValueReached": backgroundColor,
                "width": `${this.progressPercentage}%`
            };
        },
        currentProgressInformation () {
            if (this.progressPercentage > 100) {
                return this.$t("additional:modules.lzsResearchClient.sumOfCheckedFiles.sumTooHigh", {
                    currentFileSize: getHumanReadableFileSize(this.sumOfFileSizes)
                });
            }

            return this.$t("additional:modules.lzsResearchClient.sumOfCheckedFiles.sumOk", {
                currentFileSize: getHumanReadableFileSize(this.sumOfFileSizes),
                maxFileSize: getHumanReadableFileSize(this.maxDownloadBytes)
            });
        },
        sumOfFileSizes () {
            let sumOfFiles = 0;

            this.checkedDatasets?.forEach(dataset => {
                dataset.primaryData?.forEach(primaryData => {
                    sumOfFiles += primaryData.contentFileSize;

                    if (primaryData.georeferencePrimarydata) {
                        sumOfFiles += primaryData.georeferencePrimarydata.contentFileSize;
                    }
                });

                // add some extra file size for metadata since there is no content file size given for metadata
                const dossierIds = this.getDossierIdsForArchiveId(dataset.archiveId);

                if (dossierIds) {
                    sumOfFiles += this.bytesForMetadata * dossierIds.length;
                }
            });

            return sumOfFiles;
        }
    },
    watch: {
        progressPercentage (val) {
            this.$emit("update:progressPercentage", val);
        }
    }
};
</script>

<template>
    <div id="SumOfCheckedFiles">
        <div
            v-if="sumOfFileSizes >= 0 && maxDownloadMB > -1"
            class="progress"
            role="progressbar"
            :aria-label="$t('additional:modules.lzsResearchClient.sumOfCheckedFiles.progressAriaLabel', {percent: progressPercentage})"
            :aria-valuenow="progressPercentage"
            aria-valuemin="0"
            aria-valuemax="100"
        >
            <div
                class="progress-bar"
                :class="[isFetchingPrimaryData ? 'progress-bar-striped progress-bar-animated' : '']"
                :style="progressBarCss"
            />
        </div>

        <p
            v-if="sumOfFileSizes >= 0 && maxDownloadMB > -1"
            id="result"
        >
            {{ currentProgressInformation }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "bootstrap/scss/progress";

    #SumOfCheckedFiles {
        margin-top: 1rem;

        div.progress-bar {
            background-color: var(--maxValueReached);
        }
    }
</style>
