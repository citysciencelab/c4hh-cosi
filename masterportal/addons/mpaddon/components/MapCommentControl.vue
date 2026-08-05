<script>
import axios from "axios";
import Overlay from "ol/Overlay.js";
import {transform} from "ol/proj.js";
import {mapActions, mapGetters, mapState} from "vuex";
import {keyOfCollection} from "../js/collectionKey.js";

// Bootstrap Icons "chat-dots-fill" (MIT), white on a coloured teardrop — the
// same pin glyph the menu composer uses (CommentComposer.vue PIN_SVG).
const PIN_SVG =
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" style=\"width:16px;height:16px;fill:#fff;display:block\">" +
    "<path d=\"M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z\"/>" +
    "</svg>";

/**
 * MapCommentControl (MP-12) — a floating "Kommentare" control pinned to the
 * top-right of the Masterportal map, mirroring the c4hh-app's COM-1
 * MapComments.client.vue. It is mounted as a standalone Vue app onto the map
 * container (see js/mountMapCommentControl.js) so it lives on the map
 * independent of the addon menu being open, and it shares the addon's Vuex
 * store.
 *
 * It is shown only while the addon is authenticated, and offers — without
 * opening the addon menu:
 *  - a chat-bubble toggle with a comment-count badge,
 *  - a popup listing the use case's free-placed comments (click → fly-to + an
 *    inline thread with replies),
 *  - a "+ Kommentar auf der Karte" place-on-map flow that reuses the store's
 *    createComment OAF Part-4 plumbing.
 *
 * Comments are read from the readable primary comment collections
 * (`c4hh:isPrimaryComment`, COM-8) across every dataset group; the place flow
 * targets the writable ones. The Authorization header is added by the
 * backendAuth axios interceptor (installed in actionsMpAddon.js).
 */
export default {
    name: "MapCommentControl",
    data () {
        return {
            open: false,
            loading: false,
            error: null,
            // map<"{group}/{id}", comment[]> of fetched comment features. Keyed
            // on the collection key, not the bare id — every use case's primary
            // comment collection is advertised at the same id `comments`, so
            // id-keyed caches overwrote each other (MP-13).
            itemsByCollection: {},

            // Open thread (a selected root comment).
            selectedRootId: null,
            selectedCollectionKey: null,
            replyBody: "",
            replyPosting: false,
            replyError: null,
            voting: false,

            // Place-on-map flow.
            placing: false,
            target: null,
            draftCoord: null,
            draftBody: "",
            sending: false,
            postError: null,

            // OL overlays we own.
            draftOverlay: null,
            focusOverlay: null
        };
    },
    computed: {
        ...mapState("Modules/Mpaddon", ["availableLayers", "backendUrl", "composeFor"]),
        ...mapGetters("Modules/Mpaddon", ["isAuthenticated"]),
        ...mapGetters("Maps", ["clickCoordinate"]),
        // The readable comment collections; primary ones (COM-8) if any are
        // flagged, else every comment collection (older backend without the
        // flag still works).
        commentCollections () {
            return (this.availableLayers || []).filter((c) => c.kind === "comments");
        },
        primaryCollections () {
            const primaries = this.commentCollections.filter((c) => c.isPrimary);

            return primaries.length > 0 ? primaries : this.commentCollections;
        },
        // Comment collections the user may write to — the place-on-map targets.
        writableTargets () {
            return this.primaryCollections.filter((c) => c.canComment);
        },
        // The collection a new comment is placed into (`target` holds a key).
        selectedTarget () {
            return this.writableTargets.find((c) => keyOfCollection(c) === this.target) || this.writableTargets[0] || null;
        },
        // Top-level, newest-first comments across all primary collections, each
        // tagged with its source collection (for fly-to, threads and grouping).
        roots () {
            const list = [];

            this.primaryCollections.forEach((coll) => {
                (this.itemsByCollection[keyOfCollection(coll)] || [])
                    .filter((c) => c.parentId === null)
                    .forEach((c) => list.push({
                        ...c,
                        collectionKey: keyOfCollection(coll),
                        collectionId: coll.id,
                        group: coll.group,
                        groupTitle: coll.groupTitle,
                        canComment: Boolean(coll.canComment)
                    }));
            });
            return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        },
        count () {
            return this.roots.length;
        },
        // Whether to show the source-group tag on each list row (only useful when
        // more than one group contributes comments).
        showGroupTag () {
            return new Set(this.roots.map((c) => c.group)).size > 1;
        },
        // The selected collection's comment cache (for the open thread).
        selectedItems () {
            return this.itemsByCollection[this.selectedCollectionKey] || [];
        },
        // The open thread's root comment.
        threadRoot () {
            return this.selectedItems.find((c) => c.id === this.selectedRootId) || null;
        },
        // The open thread's replies, oldest first (walks parentId chains up to
        // the root, like the gfiTheme thread).
        threadReplies () {
            if (!this.threadRoot) {
                return [];
            }
            const byId = new Map(this.selectedItems.map((c) => [c.id, c]));

            return this.selectedItems
                .filter((c) => c.id !== this.threadRoot.id && this.rootOf(c, byId)?.id === this.threadRoot.id)
                .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        },
        // The collection metadata of the open thread (for the reply permission).
        threadCollection () {
            return this.primaryCollections.find((c) => keyOfCollection(c) === this.selectedCollectionKey) || null;
        }
    },
    watch: {
        isAuthenticated (value) {
            if (value) {
                this.loadAll();
            }
            else {
                this.open = false;
                this.cancelPlace();
                this.backToList();
                this.itemsByCollection = {};
            }
        },
        availableLayers () {
            // Keep the target valid as collections (re)load, and refresh counts.
            if (!this.writableTargets.some((c) => keyOfCollection(c) === this.target)) {
                this.target = keyOfCollection(this.writableTargets[0]);
            }
            if (this.isAuthenticated) {
                this.loadAll();
            }
        },
        clickCoordinate (value) {
            if (this.placing && Array.isArray(value)) {
                this.draftCoord = [...value];
                this.syncDraftPin(value);
            }
        },
        // If the menu composer takes over (sets composeFor), abandon our own
        // place flow so the two never fight over the map clicks.
        composeFor (value) {
            if (value && this.placing) {
                this.cancelPlace();
            }
        }
    },
    mounted () {
        if (this.isAuthenticated) {
            this.loadAll();
        }
    },
    beforeUnmount () {
        this.syncDraftPin(null);
        this.removeFocusOverlay();
        if (this.placing) {
            this.releaseMapClicks();
        }
    },
    methods: {
        ...mapActions("Modules/Mpaddon", ["createComment", "cancelCompose", "refreshLayer", "voteComment"]),
        map () {
            return mapCollection?.getMap("2D") || null;
        },
        // MP-13: the (group, id) key of a collection — the `target` select's
        // option value and the comment cache's key.
        collectionKeyOf (collection) {
            return keyOfCollection(collection);
        },
        itemsUrl (collection, fid) {
            const base = `${this.backendUrl.replace(/\/+$/, "")}/api/oaf/${encodeURIComponent(collection.group)}/collections/${encodeURIComponent(collection.id)}/items`;

            return fid === undefined ? base : `${base}/${fid}`;
        },
        // PDS comment feature → flat record (cf. the gfiTheme's toComment).
        // Content is `contributionContent` (root) / `commentContent` (reply); the
        // author is a nested block; the create timestamp is `dateCreated`
        // (ADR-019, c4hh docs/PDS.md §6).
        toComment (f) {
            const p = f.properties || {};

            return {
                id: Number(f.id),
                body: p.contributionContent ?? p.commentContent,
                authorName: p.author?.nickname,
                parentId: p.parentId === undefined || p.parentId === null
                    ? null
                    : Number(p.parentId),
                createdAt: p.dateCreated,
                geometry: f.geometry,
                // PDS pro/contra tally + the caller's own vote (COM-19c).
                votingPro: Number(p.votingPro ?? 0),
                votingContra: Number(p.votingContra ?? 0),
                myVote: p["c4hh:myVote"] === "pro" || p["c4hh:myVote"] === "contra" ? p["c4hh:myVote"] : null
            };
        },
        rootOf (comment, byId) {
            let current = comment;

            while (current && current.parentId !== null && byId.has(current.parentId)) {
                current = byId.get(current.parentId);
            }
            return current || null;
        },
        // Fetches the comment features of every readable primary collection in
        // parallel; failure-tolerant per collection (like fetchCollections).
        async loadAll () {
            const collections = this.primaryCollections;

            if (collections.length === 0) {
                this.itemsByCollection = {};
                return;
            }
            this.loading = true;
            this.error = null;
            try {
                const entries = await Promise.all(collections.map(async (coll) => {
                    try {
                        const {data} = await axios.get(this.itemsUrl(coll), {params: {limit: 10000}, timeout: 30000});

                        return [keyOfCollection(coll), (data?.features || []).map(this.toComment)];
                    }
                    catch (e) {
                        return [keyOfCollection(coll), []];
                    }
                }));

                this.itemsByCollection = Object.fromEntries(entries);
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.loading = false;
            }
        },
        async loadCollection (collection) {
            try {
                const {data} = await axios.get(this.itemsUrl(collection), {params: {limit: 10000}, timeout: 30000});

                this.itemsByCollection = {
                    ...this.itemsByCollection,
                    [keyOfCollection(collection)]: (data?.features || []).map(this.toComment)
                };
            }
            catch (e) {
                // Leave the stale cache in place on a refresh error.
            }
        },
        toggleOpen () {
            this.open = !this.open;
            if (this.open) {
                this.loadAll();
            }
            else {
                this.cancelPlace();
                this.backToList();
            }
        },

        // ── List / thread ───────────────────────────────────────────────
        selectComment (c) {
            this.selectedRootId = c.id;
            this.selectedCollectionKey = c.collectionKey;
            this.replyBody = "";
            this.replyError = null;
            this.flyTo(c.geometry);
            this.drawFocusOverlay(c.geometry);
        },
        backToList () {
            this.selectedRootId = null;
            this.selectedCollectionKey = null;
            this.replyBody = "";
            this.replyError = null;
            this.removeFocusOverlay();
        },
        canReply () {
            return Boolean(this.threadCollection?.canComment);
        },
        async postReply () {
            const text = this.replyBody.trim(),
                root = this.threadRoot,
                collection = this.threadCollection;

            if (!text || !root || !collection) {
                return;
            }
            this.replyPosting = true;
            this.replyError = null;
            try {
                // Replies pin to the root's position and inherit the thread (COM-6).
                // A reply is a PDS "Comment" → `commentContent` (docs/PDS.md §6).
                await axios.post(this.itemsUrl(collection), {
                    type: "Feature",
                    geometry: root.geometry,
                    properties: {commentContent: text, parentId: root.id}
                }, {timeout: 30000});
                this.replyBody = "";
                await this.loadCollection(collection);
                this.refreshLayer({group: collection.group, collectionId: collection.id});
            }
            catch (err) {
                this.replyError = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.replyPosting = false;
            }
        },
        // Whether the caller may vote in the open thread (COM-19c): authenticated
        // and the collection resolves to a comment dataset id. The backend still
        // enforces the fine `comment` grant.
        canVote () {
            return Boolean(this.isAuthenticated && this.threadCollection?.commentDatasetId !== null && this.threadCollection?.commentDatasetId !== undefined);
        },
        // Cast/switch or (active side again) withdraw the caller's pro/contra vote
        // on a thread comment, then reload the collection + refresh the map layer.
        async vote (c, value) {
            const collection = this.threadCollection;

            if (!this.canVote() || this.voting || !collection) {
                return;
            }
            this.voting = true;
            this.replyError = null;
            try {
                await this.voteComment({
                    commentDatasetId: collection.commentDatasetId,
                    commentId: c.id,
                    value: c.myVote === value ? null : value
                });
                await this.loadCollection(collection);
                this.refreshLayer({group: collection.group, collectionId: collection.id});
            }
            catch (err) {
                this.replyError = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.voting = false;
            }
        },

        // ── Place a new comment on the map ──────────────────────────────
        startPlace () {
            if (!this.selectedTarget) {
                return;
            }
            // One active compose flow at a time: drop any menu composer state.
            this.cancelCompose();
            this.backToList();
            this.postError = null;
            this.draftBody = "";
            this.draftCoord = null;
            this.placing = true;
            this.claimMapClicks();
        },
        cancelPlace () {
            if (!this.placing && this.draftCoord === null) {
                return;
            }
            this.placing = false;
            this.draftCoord = null;
            this.draftBody = "";
            this.postError = null;
            this.syncDraftPin(null);
            this.releaseMapClicks();
        },
        async submitPlace () {
            const text = this.draftBody.trim(),
                target = this.selectedTarget;

            if (!text || !this.draftCoord || !target) {
                return;
            }
            this.sending = true;
            this.postError = null;
            try {
                await this.createComment({
                    group: target.group,
                    collectionId: target.id,
                    coordinate: this.draftCoord,
                    body: text
                });
                this.cancelPlace();
                await this.loadCollection(target);
            }
            catch (err) {
                this.postError = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.sending = false;
            }
        },
        // Claims the map's mouse interactions (suspends GFI) so the next click
        // places the pin — same mechanism as the menu composer's startCompose.
        claimMapClicks () {
            this.$store.commit("Menu/setCurrentMouseMapInteractionsComponent", "mpaddon");
        },
        releaseMapClicks () {
            this.$store.commit("Menu/setCurrentMouseMapInteractionsComponent", "getFeatureInfo");
        },

        // ── OL overlays (draft pin + selected-comment marker) ───────────
        buildPinElement (background) {
            const el = document.createElement("div");

            el.style.cssText = "width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
                `background:${background};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);` +
                "display:flex;align-items:center;justify-content:center";
            el.innerHTML = `<span style="transform:rotate(45deg);display:block">${PIN_SVG}</span>`;
            return el;
        },
        syncDraftPin (coordinate) {
            const map = this.map();

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
                this.draftOverlay = new Overlay({
                    element: this.buildPinElement("#0d6efd"),
                    positioning: "bottom-left",
                    offset: [-4, 4],
                    stopEvent: false
                });
                map.addOverlay(this.draftOverlay);
            }
            this.draftOverlay.setPosition(coordinate);
        },
        // Map-projection coordinate of a comment's CRS84 point geometry.
        toMapCoord (geometry) {
            const map = this.map();

            if (!map || geometry?.type !== "Point" || !Array.isArray(geometry.coordinates)) {
                return null;
            }
            return transform(geometry.coordinates, "EPSG:4326", map.getView().getProjection());
        },
        flyTo (geometry) {
            const map = this.map(),
                coord = this.toMapCoord(geometry);

            if (!map || !coord) {
                return;
            }
            const view = map.getView();

            view.animate({
                center: coord,
                zoom: Math.max(view.getZoom() || 0, 16),
                duration: 500
            });
        },
        drawFocusOverlay (geometry) {
            const map = this.map(),
                coord = this.toMapCoord(geometry);

            if (!map || !coord) {
                return;
            }
            if (!this.focusOverlay) {
                this.focusOverlay = new Overlay({
                    element: this.buildPinElement("#f59e0b"),
                    positioning: "bottom-left",
                    offset: [-4, 4],
                    stopEvent: false
                });
                map.addOverlay(this.focusOverlay);
            }
            this.focusOverlay.setPosition(coord);
        },
        removeFocusOverlay () {
            const map = this.map();

            if (map && this.focusOverlay) {
                map.removeOverlay(this.focusOverlay);
            }
            this.focusOverlay = null;
        },

        // ── Formatting helpers ──────────────────────────────────────────
        authorName (c) {
            return c.authorName || this.$t("additional:modules.mpaddon.mapControlUnknownAuthor");
        },
        fmt (ts) {
            try {
                return new Date(ts).toLocaleString(i18next.language, {dateStyle: "short", timeStyle: "short"});
            }
            catch (e) {
                return ts;
            }
        },
        snippet (body) {
            const s = String(body || "").trim().replace(/\s+/g, " ");

            return s.length > 90 ? `${s.slice(0, 89)}…` : s;
        }
    }
};
</script>

<template>
    <div
        v-if="isAuthenticated"
        class="mcc"
    >
        <button
            class="mcc-toggle btn"
            :class="{active: open}"
            type="button"
            :title="open ? $t('additional:modules.mpaddon.mapControlClose') : $t('additional:modules.mpaddon.mapControlTitle')"
            @click="toggleOpen()"
        >
            <i class="bi-chat-dots" />
            <span
                v-if="count"
                class="mcc-badge"
            >{{ count }}</span>
        </button>

        <div
            v-if="open"
            class="mcc-panel"
        >
            <div class="mcc-head">
                <strong>{{ $t("additional:modules.mpaddon.mapControlTitle") }}</strong>
                <button
                    class="btn btn-sm btn-link p-0 text-muted"
                    type="button"
                    @click="open = false"
                >
                    <i class="bi-x-lg" />
                </button>
            </div>

            <p
                v-if="error"
                class="small text-danger mb-2"
            >
                {{ error }}
            </p>
            <p
                v-else-if="primaryCollections.length === 0"
                class="small text-muted mb-0"
            >
                {{ $t("additional:modules.mpaddon.mapControlNoPrimary") }}
            </p>

            <template v-else>
                <!-- Inline thread for a selected comment -->
                <section v-if="threadRoot">
                    <button
                        class="btn btn-sm btn-link p-0 mb-2"
                        type="button"
                        @click="backToList()"
                    >
                        <i class="bi-chevron-left me-1" />{{ $t("additional:modules.mpaddon.mapControlBack") }}
                    </button>
                    <ul class="mcc-thread list-unstyled mb-2">
                        <li
                            v-for="c in [threadRoot, ...threadReplies]"
                            :key="c.id"
                            class="border-bottom py-2"
                            :class="{'ps-3': c.id !== threadRoot.id}"
                        >
                            <div class="d-flex justify-content-between align-items-baseline">
                                <span class="small fw-semibold">{{ authorName(c) }}</span>
                                <span class="small text-muted">{{ fmt(c.createdAt) }}</span>
                            </div>
                            <p class="mb-0 mt-1 small">
                                {{ c.body }}
                            </p>
                            <!-- COM-19c: pro/contra tally; the active side withdraws. -->
                            <div class="mcc-vote mt-1">
                                <button
                                    type="button"
                                    class="btn btn-sm py-0 px-1 me-1"
                                    :class="c.myVote === 'pro' ? 'btn-success' : 'btn-outline-secondary'"
                                    :disabled="!canVote() || voting"
                                    :title="$t('additional:modules.mpaddon.voteUp')"
                                    @click="vote(c, 'pro')"
                                >
                                    👍 {{ c.votingPro }}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-sm py-0 px-1"
                                    :class="c.myVote === 'contra' ? 'btn-danger' : 'btn-outline-secondary'"
                                    :disabled="!canVote() || voting"
                                    :title="$t('additional:modules.mpaddon.voteDown')"
                                    @click="vote(c, 'contra')"
                                >
                                    👎 {{ c.votingContra }}
                                </button>
                            </div>
                        </li>
                    </ul>
                    <form
                        v-if="canReply()"
                        @submit.prevent="postReply()"
                    >
                        <textarea
                            v-model="replyBody"
                            rows="2"
                            class="form-control form-control-sm mb-2"
                            :placeholder="$t('additional:modules.mpaddon.mapControlReplyPlaceholder')"
                            :disabled="replyPosting"
                        />
                        <p
                            v-if="replyError"
                            class="small text-danger mb-1"
                        >
                            {{ replyError }}
                        </p>
                        <button
                            type="submit"
                            class="btn btn-primary btn-sm"
                            :disabled="replyPosting || !replyBody.trim()"
                        >
                            {{ replyPosting ? $t("additional:modules.mpaddon.composeSending") : $t("additional:modules.mpaddon.composeSend") }}
                        </button>
                    </form>
                    <p
                        v-else
                        class="small text-muted mb-0"
                    >
                        {{ $t("additional:modules.mpaddon.mapControlReadOnly") }}
                    </p>
                </section>

                <!-- List + place-on-map -->
                <template v-else>
                    <div class="mcc-add mb-2">
                        <div
                            v-if="placing && !draftCoord"
                            class="mcc-placing"
                        >
                            <span class="small">{{ $t("additional:modules.mpaddon.mapControlPlacing") }}</span>
                            <button
                                class="btn btn-sm btn-link p-0"
                                type="button"
                                @click="cancelPlace()"
                            >
                                {{ $t("additional:modules.mpaddon.composeCancel") }}
                            </button>
                        </div>
                        <div v-else-if="placing && draftCoord">
                            <textarea
                                v-model="draftBody"
                                rows="3"
                                class="form-control form-control-sm mb-2"
                                :placeholder="$t('additional:modules.mpaddon.composePlaceholder')"
                                :disabled="sending"
                            />
                            <p
                                v-if="postError"
                                class="small text-danger mb-1"
                            >
                                {{ postError }}
                            </p>
                            <div class="d-flex gap-2 justify-content-end">
                                <button
                                    class="btn btn-sm btn-link p-0"
                                    type="button"
                                    :disabled="sending"
                                    @click="cancelPlace()"
                                >
                                    {{ $t("additional:modules.mpaddon.composeCancel") }}
                                </button>
                                <button
                                    class="btn btn-primary btn-sm"
                                    type="button"
                                    :disabled="sending || !draftBody.trim()"
                                    @click="submitPlace()"
                                >
                                    {{ sending ? $t("additional:modules.mpaddon.composeSending") : $t("additional:modules.mpaddon.composeSend") }}
                                </button>
                            </div>
                        </div>
                        <div v-else-if="writableTargets.length">
                            <select
                                v-if="writableTargets.length > 1"
                                v-model="target"
                                class="form-select form-select-sm mb-2"
                            >
                                <option
                                    v-for="t in writableTargets"
                                    :key="collectionKeyOf(t)"
                                    :value="collectionKeyOf(t)"
                                >
                                    {{ t.groupTitle }} — {{ t.title }}
                                </option>
                            </select>
                            <button
                                class="btn btn-primary btn-sm w-100"
                                type="button"
                                @click="startPlace()"
                            >
                                <i class="bi-plus-circle me-1" />{{ $t("additional:modules.mpaddon.mapControlPlace") }}
                            </button>
                        </div>
                    </div>

                    <p
                        v-if="loading"
                        class="small text-muted mb-0"
                    >
                        {{ $t("additional:modules.mpaddon.loading") }}
                    </p>
                    <ul
                        v-else-if="roots.length"
                        class="mcc-list list-unstyled mb-0"
                    >
                        <li
                            v-for="c in roots"
                            :key="c.collectionKey + ':' + c.id"
                        >
                            <button
                                class="mcc-item"
                                type="button"
                                :title="c.body"
                                @click="selectComment(c)"
                            >
                                <span class="mcc-item-head">
                                    <span class="mcc-item-author">{{ authorName(c) }}</span>
                                    <span
                                        v-if="showGroupTag"
                                        class="mcc-item-tag"
                                    >{{ c.groupTitle }}</span>
                                    <time class="mcc-item-time">{{ fmt(c.createdAt) }}</time>
                                </span>
                                <span class="mcc-item-body">{{ snippet(c.body) }}</span>
                            </button>
                        </li>
                    </ul>
                    <p
                        v-else-if="!placing"
                        class="small text-muted mb-0"
                    >
                        {{ $t("additional:modules.mpaddon.mapControlEmpty") }}
                    </p>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped>
.mcc {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-size: 13px;
}
.mcc-toggle {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    color: #2b6cb0;
}
.mcc-toggle:hover,
.mcc-toggle.active {
    border-color: #2b6cb0;
}
.mcc-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: #2b6cb0;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.mcc-panel {
    width: 320px;
    max-width: 80vw;
    max-height: 70vh;
    overflow: hidden auto;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
    padding: 12px 14px;
}
.mcc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.mcc-head strong {
    font-size: 14px;
    font-weight: 900;
}
.mcc-placing {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 7px;
    background: #f3f5f8;
    border: 1px dashed #2b6cb0;
    color: #2b6cb0;
}
.mcc-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.mcc-item {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 7px 9px;
    border-radius: 6px;
    cursor: pointer;
    color: inherit;
    background: #f3f5f8;
    border: 1px solid #eee;
}
.mcc-item:hover {
    border-color: #2b6cb0;
}
.mcc-item-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.mcc-item-author {
    font-weight: 700;
    font-size: 12px;
}
.mcc-item-tag {
    font-size: 10px;
    font-weight: 700;
    color: #0d9488;
    background: rgba(13, 148, 136, 0.1);
    border-radius: 4px;
    padding: 1px 5px;
    flex-shrink: 0;
}
.mcc-item-time {
    font-size: 10px;
    color: #888;
    flex-shrink: 0;
    margin-left: auto;
}
.mcc-item-body {
    font-size: 12px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
