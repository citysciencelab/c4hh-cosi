<script>
import axios from "axios";
import {transform} from "ol/proj.js";
import {getCenter} from "ol/extent.js";
import GeoJSON from "ol/format/GeoJSON.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import {Style, Stroke, Fill, Circle as CircleStyle} from "ol/style.js";

// Attribute keys never worth showing in the properties table. Masterportal
// filters these via config.js `ignoredKeys`, but that list is optional and the
// portal we ship doesn't set one — with `gfiAttributes: "showAll"` and an empty
// ignore list, getMappedProperties() hands back the RAW OL properties, geometry
// column included. Filtering here keeps the fix inside the addon (MP-14).
const IGNORED_PROPERTY_KEYS = [
        "BOUNDEDBY", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA", "OBJECTID",
        "GLOBALID", "GEOMETRY", "GEOM", "SHP", "SHP_AREA", "SHP_LENGTH"
    ],
    // Id of the throwaway OL layer that highlights a comment's referenced feature.
    HIGHLIGHT_LAYER_ID = "mpaddon-about-highlight",
    // Amber outline + translucent fill; a circle for point geometries. Reads as
    // "this is the object that comment is about" without clobbering layer styles.
    HIGHLIGHT_STYLE = new Style({
        stroke: new Stroke({color: "#f59e0b", width: 3}),
        fill: new Fill({color: "rgba(245, 158, 11, 0.25)"}),
        image: new CircleStyle({
            radius: 9,
            stroke: new Stroke({color: "#f59e0b", width: 3}),
            fill: new Fill({color: "rgba(245, 158, 11, 0.4)"})
        })
    });

/**
 * mpAddonGfi — gfiTheme for the c4hh backend's OAF layers.
 *
 * COMMENT collections (layer config carries gfiTheme: "mpAddonGfi"): a clicked
 * pin is a comment feature; this theme shows its whole thread (root + replies),
 * lets the author (or an admin) edit/delete entries via the OAF Part-4 endpoints
 * and — when the collection grants the `comment` action — reply. If the thread
 * root references a feature via a `rel:"about"` web link (COM-15a / COM-11), it
 * can be dereferenced and highlighted on the map.
 *
 * DATA collections use this theme too (buildOafLayerConfig sets it for both
 * kinds): a clicked data feature shows a plain properties table AND — if the
 * layer's use case has a primary comment collection the user may write to — a
 * "comment on this feature" composer that authors a top-level comment carrying
 * the clicked feature's `rel:"about"` OGC item URL (COM-11).
 *
 * The Authorization header comes from the backendAuth axios interceptor.
 */
export default {
    name: "MpAddonGfi",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            items: [],
            loading: false,
            error: null,
            replyBody: "",
            posting: false,
            editingId: null,
            editBody: "",
            savingEdit: false,
            confirmDeleteId: null,
            deleting: false,
            voting: false,
            // rel:"about" highlight (comment layer)
            aboutBusy: false,
            aboutError: null,
            aboutShown: false,
            // "comment on this feature" composer (data layer)
            composingComment: false,
            commentBody: "",
            commentBusy: false,
            commentError: null,
            commentDone: false
        };
    },
    computed: {
        backendUrl () {
            return this.$store.state?.Modules?.Mpaddon?.backendUrl || "";
        },
        user () {
            return this.$store.state?.Modules?.Mpaddon?.user || null;
        },
        isAdmin () {
            return this.$store.getters["Modules/Mpaddon/isAdmin"];
        },
        userId () {
            return this.$store.getters["Modules/Mpaddon/userId"];
        },
        // Our own portable author ref, matching the backend's author_ref
        // ("local:<userId>"). Comment ownership is decided on this: since
        // COM-15a's dual author block, a comment's authorId is that portable
        // STRING, not the numeric user id.
        myAuthorId () {
            return this.userId === null ? null : `local:${this.userId}`;
        },
        layerId () {
            return this.feature?.getLayerId?.() || null;
        },
        // {collectionId, portalLayerId, group, isComments, canComment} of the
        // clicked layer, looked up in the addon's addedLayers registry. The
        // registry key is "{group}/{id}" (MP-13), so the OAF collection segment
        // has to come from the entry's own `collectionId` — not from the key.
        layerEntry () {
            const added = this.$store.state?.Modules?.Mpaddon?.addedLayers || {},
                hit = Object.values(added).find((e) => e.portalLayerId === this.layerId);

            return hit || null;
        },
        isCommentLayer () {
            return Boolean(this.layerEntry?.isComments);
        },
        canComment () {
            return Boolean(this.layerEntry?.canComment);
        },
        // The comment dataset id of the clicked comment layer — the key for the
        // SPA vote endpoint (COM-19c). Looked up in availableLayers by group +
        // collection (the addedLayers entry doesn't carry it).
        commentDatasetId () {
            if (!this.layerEntry) {
                return null;
            }
            const layers = this.$store.state?.Modules?.Mpaddon?.availableLayers || [],
                hit = layers.find((c) => c.group === this.layerEntry.group && c.id === this.layerEntry.collectionId);

            return hit?.commentDatasetId ?? null;
        },
        // Any signed-in user may vote; the backend still enforces the fine
        // `comment` grant. Anonymous readers see counts but disabled buttons.
        canVote () {
            return Boolean(this.user) && this.commentDatasetId !== null;
        },
        clickedId () {
            const raw = this.feature?.getOlFeature?.()?.getId?.();

            return raw === undefined || raw === null ? null : Number(raw);
        },
        // Raw (un-coerced) feature id of the clicked feature — for DATA features
        // this is the geodata PK the OAF surface keys items on, used verbatim in
        // the rel:"about" OGC item URL (COM-11).
        clickedRawId () {
            const raw = this.feature?.getOlFeature?.()?.getId?.();

            return raw === undefined ? null : raw;
        },
        // Generic fallback (non-comment layer): the feature's mapped properties,
        // minus the geometry (MP-14). getMappedProperties() passes the OL
        // feature's properties through unchanged for a "showAll" layer, and those
        // include the geometry under the feature's geometry name — an OL Geometry
        // object that stringifies to a screenful of flatCoordinates and buried
        // every real attribute below it. We drop the geometry column by name, by
        // the conventional geometry key names, and by duck-typing the value, so a
        // renamed geometry column can't slip through either.
        properties () {
            const raw = typeof this.feature?.getMappedProperties === "function"
                    ? this.feature.getMappedProperties()
                    : {},
                geometryName = this.feature?.getOlFeature?.()?.getGeometryName?.();

            return Object.fromEntries(Object.entries(raw).filter(([key, value]) => !key.startsWith("__mpaddon")
                && key !== geometryName
                && !IGNORED_PROPERTY_KEYS.includes(key.toUpperCase())
                && !this.isGeometryValue(value)));
        },
        hasProperties () {
            return Object.keys(this.properties).length > 0;
        },
        // The thread root: walk up parentId links from the clicked comment.
        root () {
            const byId = new Map(this.items.map((c) => [c.id, c]));

            return this.rootOf(byId.get(this.clickedId), byId);
        },
        // All descendants of the root, oldest first.
        replies () {
            if (!this.root) {
                return [];
            }
            const byId = new Map(this.items.map((c) => [c.id, c]));

            return this.items
                .filter((c) => c.id !== this.root.id && this.rootOf(c, byId)?.id === this.root.id)
                .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        },
        // The use case's primary comment collection in the clicked feature's group
        // (the stable `comments` alias, COM-8). The data-layer GFI authors feature
        // comments into it; null when the user can't read one in this group.
        primaryComment () {
            if (!this.layerEntry) {
                return null;
            }
            const layers = this.$store.state?.Modules?.Mpaddon?.availableLayers || [];

            return layers.find((c) => c.group === this.layerEntry.group && c.kind === "comments" && c.isPrimary) || null;
        },
        // rel:"about" OGC item URL of the clicked DATA feature (host-relative, like
        // the SPA's ownAboutUrl — the backend absolutizes it on read). Dereferences
        // via the data items GET (keyed on the geodata PK).
        aboutUrlForClicked () {
            if (!this.layerEntry || this.clickedRawId === null) {
                return null;
            }
            const g = encodeURIComponent(this.layerEntry.group),
                coll = encodeURIComponent(this.layerEntry.collectionId),
                fid = encodeURIComponent(String(this.clickedRawId));

            return `/api/oaf/${g}/collections/${coll}/items/${fid}`;
        },
        // Whether to offer "comment on this feature" on a data-layer GFI: a primary
        // comment collection exists, the user may write to it, and we have a feature.
        canCommentOnFeature () {
            return Boolean(this.primaryComment?.canComment && this.aboutUrlForClicked);
        }
    },
    watch: {
        clickedId () {
            this.resetUi();
            this.loadItems();
        }
    },
    mounted () {
        this.loadItems();
    },
    beforeUnmount () {
        this.removeHighlight();
    },
    methods: {
        itemsUrl (fid) {
            const base = `${this.backendUrl.replace(/\/+$/, "")}/api/oaf/${encodeURIComponent(this.layerEntry.group)}/collections/${encodeURIComponent(this.layerEntry.collectionId)}/items`;

            return fid === undefined ? base : `${base}/${fid}`;
        },
        resetUi () {
            this.replyBody = "";
            this.editingId = null;
            this.confirmDeleteId = null;
            this.error = null;
            this.composingComment = false;
            this.commentBody = "";
            this.commentError = null;
            this.commentDone = false;
            this.aboutError = null;
            this.removeHighlight();
        },
        // null-or-Number normalization for ids coming from feature properties.
        numOrNull (value) {
            return value === undefined || value === null ? null : Number(value);
        },
        /**
         * MP-14: is this property value an OL geometry? Duck-typed rather than
         * `instanceof Geometry` so it also holds for a geometry created by
         * masterportalapi's own copy of OpenLayers.
         * @param {*} value a raw property value
         * @returns {boolean} true for an OL geometry
         */
        isGeometryValue (value) {
            return Boolean(value)
                && typeof value === "object"
                && typeof value.getType === "function"
                && typeof value.getExtent === "function";
        },
        /**
         * MP-14: renders a property value for the table. Plain values print as
         * they are; a nested object/array (the backend's JSONB attributes can
         * hold them) prints as compact JSON instead of "[object Object]".
         * @param {*} value a property value
         * @returns {string} the display string
         */
        formatValue (value) {
            if (value === null || value === undefined) {
                return "";
            }
            if (typeof value === "object") {
                try {
                    return JSON.stringify(value);
                }
                catch (e) {
                    return String(value);
                }
            }
            return String(value);
        },
        // Walks up parentId links to a comment's thread root.
        rootOf (comment, byId) {
            let current = comment;

            while (current && current.parentId !== null && byId.has(current.parentId)) {
                current = byId.get(current.parentId);
            }
            return current || null;
        },
        // Maps a PDS comment Feature (ADR-019, c4hh docs/PDS.md §6) to a flat
        // comment record. A root is a "Contribution" (content in
        // `contributionContent`), a reply a "Comment" (`commentContent`); the
        // portable STRING author id + display name live in a nested `author` block;
        // timestamps are `dateCreated`/`dateEdited` (the latter null until edited);
        // a rel:"about" web link may reference the feature the comment is about.
        toComment (f) {
            const aboutLink = Array.isArray(f.links) ? f.links.find((l) => l && l.rel === "about") : null,
                p = f.properties || {},
                author = p.author || {},
                parentId = this.numOrNull(p.parentId);

            return {
                id: Number(f.id),
                pdsClass: p.pdsClass || (parentId === null ? "Contribution" : "Comment"),
                body: p.contributionContent ?? p.commentContent,
                authorId: author.id ?? null,
                authorName: author.nickname,
                parentId,
                aboutUrl: aboutLink?.href ?? null,
                createdAt: p.dateCreated,
                updatedAt: p.dateEdited,
                geometry: f.geometry,
                // PDS pro/contra tally + the caller's own vote (COM-19c). The
                // aggregate counts are normative fields; `c4hh:myVote` is the
                // vendor tag driving the toggle state.
                votingPro: Number(p.votingPro ?? 0),
                votingContra: Number(p.votingContra ?? 0),
                myVote: p["c4hh:myVote"] === "pro" || p["c4hh:myVote"] === "contra" ? p["c4hh:myVote"] : null
            };
        },
        async loadItems () {
            if (!this.isCommentLayer || this.clickedId === null) {
                this.items = [];
                return;
            }
            this.loading = true;
            this.error = null;
            try {
                const {data} = await axios.get(this.itemsUrl(), {params: {limit: 10000}, timeout: 30000});

                this.items = (data?.features || []).map(this.toComment);
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.loading = false;
            }
        },
        canModify (c) {
            return this.isAdmin || (this.myAuthorId !== null && c.authorId === this.myAuthorId);
        },
        isEdited (c) {
            return c.updatedAt && c.createdAt && String(c.updatedAt) !== String(c.createdAt);
        },
        refreshMapLayer () {
            this.$store.dispatch("Modules/Mpaddon/refreshLayer", {
                group: this.layerEntry.group,
                collectionId: this.layerEntry.collectionId
            });
        },
        async postReply () {
            const text = this.replyBody.trim();

            if (!text || !this.root) {
                return;
            }
            this.posting = true;
            this.error = null;
            try {
                // Replies pin to the thread root's position (CRS84, as fetched). A
                // reply is a PDS "Comment" → `commentContent` (docs/PDS.md §6).
                await axios.post(this.itemsUrl(), {
                    type: "Feature",
                    geometry: this.root.geometry,
                    properties: {commentContent: text, parentId: this.root.id}
                }, {timeout: 30000});
                this.replyBody = "";
                await this.loadItems();
                this.refreshMapLayer();
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.posting = false;
            }
        },
        startEdit (c) {
            this.editingId = c.id;
            this.editBody = c.body;
            this.confirmDeleteId = null;
        },
        async saveEdit (c) {
            const text = this.editBody.trim();

            if (!text) {
                return;
            }
            this.savingEdit = true;
            this.error = null;
            try {
                // Part-4 replace; geometry omitted ⇒ the pin stays where it is.
                // Send the PDS content field matching the comment's class (root =
                // Contribution, reply = Comment); the server stores both in `body`.
                await axios.put(this.itemsUrl(c.id), {
                    type: "Feature",
                    properties: c.parentId === null ? {contributionContent: text} : {commentContent: text}
                }, {timeout: 30000});
                this.editingId = null;
                await this.loadItems();
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.savingEdit = false;
            }
        },
        async doDelete (c) {
            this.deleting = true;
            this.error = null;
            try {
                await axios.delete(this.itemsUrl(c.id), {timeout: 30000});
                this.confirmDeleteId = null;
                await this.loadItems();
                this.refreshMapLayer();
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.deleting = false;
            }
        },
        // Cast/switch or (clicking the active side again) withdraw the caller's
        // pro/contra vote, then reload the thread + refresh the map layer so the
        // updated tally and `c4hh:myVote` show (COM-19c).
        async vote (c, value) {
            if (!this.canVote || this.voting) {
                return;
            }
            this.voting = true;
            this.error = null;
            try {
                await this.$store.dispatch("Modules/Mpaddon/voteComment", {
                    commentDatasetId: this.commentDatasetId,
                    commentId: c.id,
                    value: c.myVote === value ? null : value
                });
                await this.loadItems();
                this.refreshMapLayer();
            }
            catch (err) {
                this.error = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.voting = false;
            }
        },
        // --- rel:"about" referenced-feature highlight (COM-11) -----------------
        /**
         * Removes the throwaway highlight layer for the referenced feature.
         * @returns {void}
         */
        removeHighlight () {
            const map = mapCollection?.getMap("2D");

            if (map) {
                map.getLayers().getArray()
                    .filter((l) => l.get("id") === HIGHLIGHT_LAYER_ID)
                    .forEach((l) => map.removeLayer(l));
            }
            this.aboutShown = false;
        },
        /**
         * Dereferences the thread root's rel:"about" item URL, draws the returned
         * feature on a dedicated highlight layer, and zooms the map to it. The
         * Authorization header is added by the backendAuth interceptor (our origin).
         * @returns {Promise<void>}
         */
        async showAboutFeature () {
            const url = this.root?.aboutUrl,
                map = mapCollection?.getMap("2D");

            if (!url || !map) {
                return;
            }
            this.aboutBusy = true;
            this.aboutError = null;
            try {
                // Fetch in CRS84 (the items default) and reproject to the map.
                const {data} = await axios.get(url, {timeout: 30000});

                if (!data?.geometry) {
                    throw new Error("no geometry");
                }
                const olFeature = new GeoJSON().readFeature(data, {
                        dataProjection: "EPSG:4326",
                        featureProjection: map.getView().getProjection()
                    }),
                    layer = new VectorLayer({
                        source: new VectorSource({features: [olFeature]}),
                        style: HIGHLIGHT_STYLE,
                        zIndex: 9999
                    });

                this.removeHighlight();
                layer.set("id", HIGHLIGHT_LAYER_ID);
                map.addLayer(layer);
                map.getView().fit(olFeature.getGeometry().getExtent(), {
                    padding: [60, 60, 60, 60],
                    maxZoom: 17,
                    duration: 400
                });
                this.aboutShown = true;
            }
            catch (err) {
                this.aboutError = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.aboutBusy = false;
            }
        },
        // --- "comment on this feature" composer (COM-11, data-layer GFI) -------
        startComment () {
            this.composingComment = true;
            this.commentBody = "";
            this.commentError = null;
            this.commentDone = false;
        },
        cancelComment () {
            this.composingComment = false;
            this.commentBody = "";
            this.commentError = null;
        },
        /**
         * A representative point ON/INSIDE the clicked feature's geometry — the
         * comment's stored position. Computed client-side from the already-loaded
         * geometry (the backend's snap-to-centre keys on feature_id, which the OAF
         * surface's PK item URL doesn't carry — so we send geometry explicitly).
         * @param {module:ol/geom/Geometry} geom the clicked feature geometry
         * @returns {number[]} a coordinate in the map projection
         */
        representativePoint (geom) {
            const type = geom.getType();

            if (type === "Point") {
                return geom.getCoordinates();
            }
            if (type === "Polygon") {
                return geom.getInteriorPoint().getCoordinates().slice(0, 2);
            }
            if (type === "MultiPolygon") {
                return geom.getInteriorPoints().getCoordinates()[0].slice(0, 2);
            }
            // Lines / collections: the closest point to the extent centre lands on
            // the geometry.
            return geom.getClosestPoint(getCenter(geom.getExtent()));
        },
        /**
         * Authors a top-level comment about the clicked data feature: posts to the
         * use case's primary comment collection with the feature's rel:"about" OGC
         * item URL and an explicit point at the feature's centre (CRS84).
         * @returns {Promise<void>}
         */
        async postFeatureComment () {
            const text = this.commentBody.trim(),
                primary = this.primaryComment,
                aboutUrl = this.aboutUrlForClicked,
                map = mapCollection?.getMap("2D"),
                olFeature = this.feature?.getOlFeature?.();

            if (!text || !primary || !aboutUrl || !map || !olFeature?.getGeometry?.()) {
                return;
            }
            this.commentBusy = true;
            this.commentError = null;
            try {
                const point = this.representativePoint(olFeature.getGeometry()),
                    lonLat = transform(point, map.getView().getProjection(), "EPSG:4326"),
                    url = `${this.backendUrl.replace(/\/+$/, "")}/api/oaf/${encodeURIComponent(primary.group)}/collections/${encodeURIComponent(primary.id)}/items`;

                // A top-level feature comment is a PDS "Contribution" →
                // `contributionContent` (docs/PDS.md §6).
                await axios.post(url, {
                    type: "Feature",
                    geometry: {type: "Point", coordinates: lonLat},
                    properties: {contributionContent: text},
                    links: [{rel: "about", href: aboutUrl}]
                }, {timeout: 30000});
                this.commentBody = "";
                this.composingComment = false;
                this.commentDone = true;
                // If the comment layer is on the map, show the new pin at once.
                this.$store.dispatch("Modules/Mpaddon/refreshLayer", {group: primary.group, collectionId: primary.id});
            }
            catch (err) {
                this.commentError = err.response?.data?.statusMessage || err.message || "Fehler";
            }
            finally {
                this.commentBusy = false;
            }
        },
        formatTime (iso) {
            try {
                return new Date(iso).toLocaleString();
            }
            catch (e) {
                return iso;
            }
        }
    }
};
</script>

<template>
    <div class="mpaddon-gfi p-2">
        <!-- Fallback: not a comment layer (theme misassigned or a data layer) →
             properties table + an optional "comment on this feature" composer. -->
        <section
            v-if="!isCommentLayer"
            class="mb-2"
        >
            <h6 class="mb-2">
                {{ $t("additional:modules.mpaddonGfi.properties") }}
            </h6>
            <table
                v-if="hasProperties"
                class="table table-sm mb-0"
            >
                <tbody>
                    <tr
                        v-for="(value, key) in properties"
                        :key="key"
                    >
                        <th
                            class="text-muted small fw-normal"
                            style="width:40%"
                        >
                            {{ key }}
                        </th>
                        <td class="small mpaddon-value">
                            {{ formatValue(value) }}
                        </td>
                    </tr>
                </tbody>
            </table>
            <p
                v-else
                class="small text-muted mb-0"
            >
                {{ $t("additional:modules.mpaddonGfi.noProperties") }}
            </p>

            <section
                v-if="canCommentOnFeature"
                class="mt-3 pt-2 border-top"
            >
                <button
                    v-if="!composingComment"
                    class="btn btn-outline-primary btn-sm"
                    @click="startComment"
                >
                    <i class="bi-chat-dots me-1" />{{ $t("additional:modules.mpaddonGfi.commentOnFeature") }}
                </button>
                <form
                    v-else
                    @submit.prevent="postFeatureComment"
                >
                    <textarea
                        v-model="commentBody"
                        rows="2"
                        :placeholder="$t('additional:modules.mpaddonGfi.commentPlaceholder')"
                        class="form-control form-control-sm mb-2"
                        :disabled="commentBusy"
                    />
                    <button
                        type="submit"
                        class="btn btn-primary btn-sm me-1"
                        :disabled="commentBusy || !commentBody.trim()"
                    >
                        {{ commentBusy ? $t("additional:modules.mpaddonGfi.posting") : $t("additional:modules.mpaddonGfi.post") }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        :disabled="commentBusy"
                        @click="cancelComment"
                    >
                        {{ $t("additional:modules.mpaddonGfi.cancel") }}
                    </button>
                </form>
                <p
                    v-if="commentError"
                    class="small text-danger mt-1 mb-0"
                >
                    {{ commentError }}
                </p>
                <p
                    v-if="commentDone"
                    class="small text-success mt-1 mb-0"
                >
                    {{ $t("additional:modules.mpaddonGfi.commentSaved") }}
                </p>
            </section>
        </section>

        <section v-else>
            <h6 class="mb-2">
                <i class="bi-chat-dots me-1" />{{ $t("additional:modules.mpaddonGfi.comments") }}
            </h6>
            <p
                v-if="loading"
                class="small text-muted"
            >
                {{ $t("additional:modules.mpaddonGfi.loading") }}
            </p>
            <p
                v-if="error"
                class="small text-danger"
            >
                {{ error }}
            </p>
            <p
                v-if="!loading && !root"
                class="small text-muted"
            >
                {{ $t("additional:modules.mpaddonGfi.noComments") }}
            </p>

            <!-- rel:"about" referenced feature (COM-11): dereference + highlight. -->
            <div
                v-if="root && root.aboutUrl"
                class="mb-2 small"
            >
                <button
                    class="btn btn-link btn-sm p-0 me-2"
                    :disabled="aboutBusy"
                    @click="aboutShown ? removeHighlight() : showAboutFeature()"
                >
                    <i class="bi-geo-alt me-1" />{{
                        aboutBusy
                            ? $t("additional:modules.mpaddonGfi.featureLoading")
                            : (aboutShown
                                ? $t("additional:modules.mpaddonGfi.hideFeature")
                                : $t("additional:modules.mpaddonGfi.showFeature"))
                    }}
                </button>
                <span
                    v-if="aboutError"
                    class="text-danger"
                >{{ aboutError }}</span>
            </div>

            <ul
                v-if="root"
                class="list-unstyled mb-2"
            >
                <li
                    v-for="c in [root, ...replies]"
                    :key="c.id"
                    class="border-bottom py-2"
                    :class="{'ps-3': c.id !== root.id}"
                >
                    <div class="d-flex justify-content-between align-items-baseline">
                        <span class="small fw-semibold">{{ c.authorName || "?" }}</span>
                        <span class="small text-muted">
                            {{ formatTime(c.createdAt) }}
                            <em v-if="isEdited(c)">· {{ $t("additional:modules.mpaddonGfi.edited") }}</em>
                        </span>
                    </div>

                    <template v-if="editingId === c.id">
                        <textarea
                            v-model="editBody"
                            rows="2"
                            class="form-control form-control-sm my-1"
                            :disabled="savingEdit"
                        />
                        <button
                            class="btn btn-primary btn-sm me-1"
                            :disabled="savingEdit || !editBody.trim()"
                            @click="saveEdit(c)"
                        >
                            {{ $t("additional:modules.mpaddonGfi.save") }}
                        </button>
                        <button
                            class="btn btn-outline-secondary btn-sm"
                            :disabled="savingEdit"
                            @click="editingId = null"
                        >
                            {{ $t("additional:modules.mpaddonGfi.cancel") }}
                        </button>
                    </template>
                    <template v-else>
                        <p class="mb-1 mt-1">
                            {{ c.body }}
                        </p>
                        <!-- COM-19c: pro/contra tally. Counts always show; buttons
                             toggle the caller's own vote (active side withdraws). -->
                        <div class="mpaddon-vote mb-1">
                            <button
                                type="button"
                                class="btn btn-sm py-0 px-1 me-1"
                                :class="c.myVote === 'pro' ? 'btn-success' : 'btn-outline-secondary'"
                                :disabled="!canVote || voting"
                                :title="$t('additional:modules.mpaddonGfi.voteUp')"
                                @click="vote(c, 'pro')"
                            >
                                👍 {{ c.votingPro }}
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm py-0 px-1"
                                :class="c.myVote === 'contra' ? 'btn-danger' : 'btn-outline-secondary'"
                                :disabled="!canVote || voting"
                                :title="$t('additional:modules.mpaddonGfi.voteDown')"
                                @click="vote(c, 'contra')"
                            >
                                👎 {{ c.votingContra }}
                            </button>
                        </div>
                        <div v-if="canModify(c)">
                            <template v-if="confirmDeleteId === c.id">
                                <button
                                    class="btn btn-danger btn-sm me-1"
                                    :disabled="deleting"
                                    @click="doDelete(c)"
                                >
                                    {{ $t("additional:modules.mpaddonGfi.confirmDelete") }}
                                </button>
                                <button
                                    class="btn btn-outline-secondary btn-sm"
                                    :disabled="deleting"
                                    @click="confirmDeleteId = null"
                                >
                                    {{ $t("additional:modules.mpaddonGfi.cancel") }}
                                </button>
                            </template>
                            <template v-else>
                                <button
                                    class="btn btn-link btn-sm p-0 me-2"
                                    @click="startEdit(c)"
                                >
                                    {{ $t("additional:modules.mpaddonGfi.edit") }}
                                </button>
                                <button
                                    class="btn btn-link btn-sm p-0 text-danger"
                                    @click="confirmDeleteId = c.id"
                                >
                                    {{ $t("additional:modules.mpaddonGfi.delete") }}
                                </button>
                            </template>
                        </div>
                    </template>
                </li>
            </ul>

            <form
                v-if="canComment && root"
                @submit.prevent="postReply"
            >
                <textarea
                    v-model="replyBody"
                    rows="2"
                    :placeholder="$t('additional:modules.mpaddonGfi.replyPlaceholder')"
                    class="form-control form-control-sm mb-2"
                    :disabled="posting"
                />
                <button
                    type="submit"
                    class="btn btn-primary btn-sm"
                    :disabled="posting || !replyBody.trim()"
                >
                    {{ posting ? $t("additional:modules.mpaddonGfi.posting") : $t("additional:modules.mpaddonGfi.post") }}
                </button>
            </form>
            <p
                v-else-if="root"
                class="small text-muted mt-2"
            >
                {{ $t("additional:modules.mpaddonGfi.readOnly") }}
            </p>
        </section>
    </div>
</template>

<style scoped>
/* MP-14: long attribute values (URLs, JSON blobs) wrap instead of stretching
   the GFI panel. */
.mpaddon-value {
    word-break: break-word;
}
</style>
