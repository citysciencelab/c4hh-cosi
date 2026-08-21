 <script>
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {mapGetters} from "vuex";
import Toast from "../../shared/toasts/components/ToastsElement.vue";

export default {
    name: "StoryPlayerToolbar",
    components: {
        IconButton,
        Toast
    },
    data () {
        return {
            isFullScreen: false,
            linkCopied: false
        };
    },
    computed: {
        ...mapGetters("Modules/ShareView", ["url"]),
        ...mapGetters("Modules/StoryPlayer", ["fixedStoryPath"])
    },
    watch: {
        /**
         * Auto-hides the copied hint after 5 seconds.
         * @param {Boolean} val - The newly saved story index.
         * @returns {void}
         */
        linkCopied (val) {
            if (val) {
                setTimeout(() => {
                    this.linkCopied = false;
                }, 5000);
            }
        }
    },
    mounted () {
        document.addEventListener("fullscreenchange", this.fullScreenChangeHandler);
        document.addEventListener("webkitfullscreenchange", this.fullScreenChangeHandler);
        document.addEventListener("mozfullscreenchange", this.fullScreenChangeHandler);
        document.addEventListener("MSFullscreenChange", this.fullScreenChangeHandler);
    },
    unmounted () {
        document.removeEventListener("fullscreenchange", this.fullScreenChangeHandler);
        document.removeEventListener("webkitfullscreenchange", this.fullScreenChangeHandler);
        document.removeEventListener("mozfullscreenchange", this.fullScreenChangeHandler);
        document.removeEventListener("MSFullscreenChange", this.fullScreenChangeHandler);
    },
    methods: {
        /**
         * Copies the current shareable URL (including the active story) to the clipboard.
         * @returns {void}
         */
        copyToClipboard () {
            if (window.isSecureContext) {
                navigator.clipboard.writeText(this.url + "#");
                this.linkCopied = true;
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: this.$t("common:modules.shareView.copyErrorAlert", {url: this.url})
                });
            }
        },

        /**
         * Handles fullscreen state changes (e.g. when user presses ESC).
         * @returns {void}
         */
        fullScreenChangeHandler () {
            this.isFullScreen = Boolean(
                document.fullscreenElement
                    || document.webkitFullscreenElement
                    || document.mozFullScreenElement
                    || document.msFullscreenElement
            );
        },

        /**
         * Toggles fullscreen mode using the browser Fullscreen API.
         * @returns {void}
         */
        toggleFullScreen () {
            const elem = document.documentElement;

            if (this.isFullScreen && document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (this.isFullScreen && document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            else if (this.isFullScreen && document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (this.isFullScreen && document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            else if (elem.requestFullscreen) {
                elem.requestFullscreen();
            }
            else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            }
            else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }
    }
};
</script>

<template lang="html">
    <div class="d-flex flex-column align-items-end">
        <div class="d-flex">
            <IconButton
                :class-array="['btn-light']"
                :aria="$t('additional:modules.storyPlayer.fullscreen')"
                :icon="isFullScreen ? 'bi bi-fullscreen-exit fs-4' : 'bi bi-fullscreen fs-4'"
                :label="$t('additional:modules.storyPlayer.fullscreen')"
                :title="$t('additional:modules.storyPlayer.fullscreen')"
                :interaction="toggleFullScreen"
            />
            <IconButton
                v-if="fixedStoryPath"
                :class-array="['btn-light']"
                :aria="$t('additional:modules.storyPlayer.copyLink')"
                icon="bi bi-share fs-4"
                :label="$t('additional:modules.storyPlayer.copyLink')"
                :title="$t('additional:modules.storyPlayer.copyLink')"
                :interaction="copyToClipboard"
            />
        </div>
        <Toast
            v-if="linkCopied"
            class="toast"
            type="success"
            :text="$t('additional:modules.storyPlayer.copyStoryLinkSuccess')"
        />
    </div>
</template>

<style lang="scss" scoped>
    .badge {
        background-color: $secondary;
        font-family: $font_family_accent;
    }
</style>

