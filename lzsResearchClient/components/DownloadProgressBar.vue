<script>
import {mapGetters, mapMutations} from "vuex";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";


export default {
    name: "DownloadProgressBar",
    components: {
        ModalItem
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "progressNow",
            "progressPhase",
            "progressCurrent",
            "progressTotal",
            "errorMessage",
            "downloadAbortController"
        ]),
        currentProgressValue () {
            switch (this.progressPhase) {
                case "start": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.start");
                case "fetch": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.fetchPrimaryData", {current: this.progressCurrent, total: this.progressTotal});
                case "dossier": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.fetchDossierData");
                case "download": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.downloadingFile", {current: this.progressCurrent, total: this.progressTotal});
                case "zip": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.zipping");
                case "done": return this.$t("additional:modules.lzsResearchClient.zipAndDownload.progress.done");
                case "error": return this.errorMessage;
                default: return "";
            }
        },
        progressModalIsOpen () {
            return this.progressNow >= 0;
        },
        progressBarCss () {
            let backgroundColor = "#3C5F94";

            if (this.errorMessage !== "") {
                backgroundColor = "#E10019";
            }

            return {
                "--progressBarColor": backgroundColor,
                "width": `${this.progressNow}%`
            };
        }
    },
    watch: {
        progressNow (val) {
            if (val === 100) {
                setTimeout(() => {
                    this.closeModal();
                }, 1000);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setProgressNow",
            "setProgressPhase"
        ]),
        /**
         * Closes the progress modal and aborts the download if it is still running.
         * @returns {void}
         */
        closeModal () {
            this.downloadAbortController?.abort();
            this.setProgressNow(-1);
            this.setProgressPhase("");
        }
    }
};
</script>

<template>
    <div id="DownloadProgressBar">
        <ModalItem
            :show-modal="progressModalIsOpen"
            modal-inner-wrapper-style="min-width: 400px; width: 50%; height: 150px;"
            @modalHid="closeModal()"
        >
            <template #default>
                <div class="DownloadProgressBarElement">
                    <div
                        class="progress"
                        role="progressbar"
                        :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.progressAriaLabel', {percent: progressNow})"
                        :aria-valuenow="progressNow"
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        <div
                            class="progress-bar progress-bar-striped progress-bar-animated"
                            :style="progressBarCss"
                        />
                    </div>
                    <p id="result">
                        {{ currentProgressValue }}
                    </p>
                </div>
            </template>
        </ModalItem>
    </div>
</template>

<style lang="scss">
    @import "bootstrap/scss/progress";
</style>

<style lang="scss" scoped>

div#modal-1-container {
    div.DownloadProgressBarElement {
        div.progress-bar {
            background-color: var(--progressBarColor);
        }
    }
}
</style>
