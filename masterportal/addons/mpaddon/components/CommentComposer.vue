<script>
import Overlay from "ol/Overlay.js";
import {mapActions, mapGetters, mapState} from "vuex";

// Inline SVG — Bootstrap Icons "chat-dots-fill" (MIT), self-contained pin for
// the not-yet-saved comment position.
const PIN_SVG =
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" style=\"width:18px;height:18px;fill:#fff;display:block\">" +
    "<path d=\"M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z\"/>" +
    "</svg>";

/**
 * CommentComposer — the "add comment" flow for a comment collection. While
 * active the addon owns the map clicks (startCompose claimed them): the first
 * click places a draft pin (re-clicking moves it), then the text form posts the
 * comment via the OAF Part-4 create endpoint.
 */
export default {
    name: "CommentComposer",
    data () {
        return {
            body: "",
            sending: false,
            error: null,
            draftOverlay: null
        };
    },
    computed: {
        ...mapState("Modules/Mpaddon", ["composeFor", "composeCoordinate"]),
        ...mapGetters("Maps", ["clickCoordinate"])
    },
    watch: {
        clickCoordinate (value) {
            if (this.composeFor && Array.isArray(value)) {
                this.$store.commit("Modules/Mpaddon/setComposeCoordinate", [...value]);
            }
        },
        composeCoordinate (value) {
            this.syncDraftPin(value);
            // Placing the pin reveals the textarea (the v-else branch). The
            // composer sits at the bottom of a long, scrollable addon panel, so
            // without help the form is off-screen and the user "can't type after
            // placing the pin" (MP-10). Bring it on screen and focus the textarea.
            if (value) {
                this.$nextTick(() => this.revealComposer(true));
            }
        },
        composeFor (value) {
            if (value) {
                // Entering compose mode: surface the (sticky) composer so the
                // "click the map" prompt is visible even with a long layer list.
                this.$nextTick(() => this.revealComposer(false));
            }
            else {
                this.body = "";
                this.error = null;
                this.syncDraftPin(null);
            }
        }
    },
    beforeUnmount () {
        this.syncDraftPin(null);
    },
    methods: {
        ...mapActions("Modules/Mpaddon", ["cancelCompose", "submitCompose"]),
        /**
         * Scrolls the composer into view within the scrollable addon panel and,
         * once the textarea exists, moves keyboard focus to it so the user can
         * type straight away (MP-10).
         * @param {boolean} focusInput whether to focus the comment textarea
         * @returns {void}
         */
        revealComposer (focusInput) {
            this.$el?.scrollIntoView?.({block: "nearest"});
            if (focusInput) {
                this.$refs.bodyInput?.focus();
            }
        },
        /**
         * Shows/moves/removes the draft pin overlay for the picked coordinate.
         * @param {number[]|null} coordinate map coordinate or null to remove
         * @returns {void}
         */
        syncDraftPin (coordinate) {
            const map = mapCollection?.getMap("2D");

            if (!map) {
                return;
            }
            if (!coordinate) {
                if (this.draftOverlay) {
                    map.removeOverlay(this.draftOverlay);
                    this.draftOverlay = null;
                }
                return;
            }
            if (!this.draftOverlay) {
                const el = document.createElement("div");

                el.style.cssText = "width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
                    "background:#0d6efd;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);" +
                    "display:flex;align-items:center;justify-content:center";
                el.innerHTML = `<span style="transform:rotate(45deg);display:block">${PIN_SVG}</span>`;
                this.draftOverlay = new Overlay({
                    element: el,
                    positioning: "bottom-left",
                    offset: [-4, 4],
                    stopEvent: false
                });
                map.addOverlay(this.draftOverlay);
            }
            this.draftOverlay.setPosition(coordinate);
        },
        async onSubmit () {
            const text = this.body.trim();

            if (!text || !this.composeCoordinate) {
                return;
            }
            this.sending = true;
            this.error = null;
            try {
                await this.submitCompose({body: text});
                this.body = "";
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.sending = false;
            }
        }
    }
};
</script>

<template>
    <div
        v-if="composeFor"
        class="mp-comment-composer border rounded p-2 mt-2"
    >
        <div class="d-flex align-items-center justify-content-between mb-1">
            <strong class="small">
                <i class="bi-chat-dots me-1" />
                {{ $t("additional:modules.mpaddon.composeTitle", {name: composeFor.title}) }}
            </strong>
            <button
                class="btn btn-sm btn-link p-0 text-muted"
                type="button"
                @click="cancelCompose()"
            >
                {{ $t("additional:modules.mpaddon.composeCancel") }}
            </button>
        </div>
        <p
            v-if="!composeCoordinate"
            class="small text-muted mb-0"
        >
            {{ $t("additional:modules.mpaddon.composeClickMap") }}
        </p>
        <form
            v-else
            @submit.prevent="onSubmit"
        >
            <p class="small text-muted mb-1">
                {{ $t("additional:modules.mpaddon.composeMovePin") }}
            </p>
            <textarea
                ref="bodyInput"
                v-model="body"
                rows="3"
                class="form-control form-control-sm mb-2"
                :placeholder="$t('additional:modules.mpaddon.composePlaceholder')"
                :disabled="sending"
            />
            <p
                v-if="error"
                class="small text-danger mb-1"
            >
                {{ error }}
            </p>
            <button
                type="submit"
                class="btn btn-primary btn-sm"
                :disabled="sending || !body.trim()"
            >
                {{ sending ? $t("additional:modules.mpaddon.composeSending") : $t("additional:modules.mpaddon.composeSend") }}
            </button>
        </form>
    </div>
</template>

<style scoped>
/* Pin the composer to the bottom of the scrollable addon panel so it stays on
   screen while composing — even when the layer list above it is long and the
   panel is scrolled away (MP-10). */
.mp-comment-composer {
    background: #f8f9fa;
    position: sticky;
    bottom: 0;
    z-index: 2;
    box-shadow: 0 -4px 8px -4px rgba(0, 0, 0, 0.25);
}
</style>
