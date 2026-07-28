<script>
import {mapGetters, mapMutations} from "vuex";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "DownloadProgressBar",
    components: {
        ModalItem,
        FlatButton
    },
    data () {
        return {
            closeTimer: null,
            progressBarIsMoving: false
        };
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
                this.closeTimer = setTimeout(() => {
                    this.closeModal();
                }, 1000);
            }
        }
    },
    beforeUnmount () {
        clearTimeout(this.closeTimer);
    },
    methods: {
        ...mapMutations("Modules/LzsResearchClient", [
            "setProgressNow",
            "setProgressCurrent",
            "setProgressTotal",
            "setProgressPhase"
        ]),
        /**
         * Closes the progress modal and aborts the download if it is still running.
         * @returns {void}
         */
        closeModal () {
            if (this.progressNow === -1) {
                return;
            }

            this.downloadAbortController?.abort();

            this.setProgressNow(-1);
            this.setProgressPhase("");
            this.setProgressCurrent(-1);
            this.setProgressTotal(-1);
        },
        /**
         * Handles the transitionstart event for the progress bar.
         * Sets the progressBarIsMoving flag to true when the width property is transitioning.
         *
         * @param {TransitionEvent} event - The transitionstart event object.
         */
        handleTransitionStart (event) {
            if (event.propertyName === "width") {
                this.progressBarIsMoving = true;
            }
        },
        /**
         * Handles the transitionend event for the progress bar.
         * Sets the progressBarIsMoving flag to false when the width property has finished transitioning.
         *
         * @param {TransitionEvent} event - The transitionend event object.
         */
        handleTransitionEnd (event) {
            if (event.propertyName === "width") {
                this.progressBarIsMoving = false;
            }
        }
    }
};
</script>

<template>
    <div id="DownloadProgressBar">
        <ModalItem
            :show-modal="progressModalIsOpen"
            modal-inner-wrapper-style="min-width: 400px; width: 50%;"
            :force-click-to-close="true"
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
                            class="progress-bar"
                            :class="[(progressPhase !== 'done' && progressPhase !== 'error') || progressBarIsMoving ? 'progress-bar-striped progress-bar-animated' : '']"
                            :style="progressBarCss"
                            @transitionstart="handleTransitionStart"
                            @transitionend="handleTransitionEnd"
                        />
                    </div>
                    <p id="result">
                        {{ currentProgressValue }}
                    </p>
                </div>

                <div class="cancel-button-wrapper">
                    <FlatButton
                        :aria-label="$t('additional:modules.lzsResearchClient.zipAndDownload.cancelDownloadButtonLabel')"
                        :text="$t('additional:modules.lzsResearchClient.zipAndDownload.cancelDownloadButtonLabel')"
                        @click="closeModal()"
                    />
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
        padding-top: 2rem;

        div.progress-bar {
            background-color: var(--progressBarColor);
        }
    }

    div.cancel-button-wrapper {
        display: flex;
        justify-content: end;
        padding: 0 1rem;
    }

    :deep(div[titel="discard"]) {
        display: none;
    }
}
</style>
