import axios from "axios";
import {transform} from "ol/proj.js";
import {Style, Icon} from "ol/style.js";
import store from "../../../src/app-store/index.js";
import {treeSubjectsKey} from "../../../src/shared/js/utils/constants.js";
import installBackendAuth from "../js/backendAuth.js";
import {collectionKey, keyOfCollection, portalLayerIdFor} from "../js/collectionKey.js";
import {buildStyleFor} from "../js/styleSpecRender.js";

const FOLDER_ID = "mpbackend_layers",
    FOLDER_NAME = "mpbackend",
    // COSI's "Fachdaten - Analyse / Simulation" subject-data folder (its id is set
    // in portal/cosi config.json). We nest our layers inside it because the
    // FeaturesList tool ("Fachdaten einsehen") only scans subjectlayer.elements[0]
    // — this folder — via getVectorlayerMapping. If the id is absent (e.g. a
    // re-vendored config that dropped it) we fall back to the subject-data root.
    FACHDATEN_FOLDER_ID = "fachdaten_analyse",
    // Masterportal's OAF default + Hamburg's CRS. Our backend reprojects the
    // (4326-stored) geometry to this on the fly and announces it via Content-Crs.
    OAF_CRS = "http://www.opengis.net/def/crs/EPSG/0/25832";

// Install the auth interceptor once at module load. It reads the current token
// from localStorage on every request, refreshes it transparently before expiry,
// and keeps Masterportal's native OAF layer authenticated without the addon
// touching the layer's data requests itself. On a fresh access token we mirror
// it into the store; if the refresh token is dead we log out so the UI returns
// to the login form.
installBackendAuth({
    onTokensRefreshed: (accessToken) => store.commit("Modules/Mpaddon/setToken", accessToken),
    onAuthLost: () => store.dispatch("Modules/Mpaddon/logout")
});

// MP-9: comment OAF layers must render as the c4hh-app's chat-bubble pin, not
// Masterportal's default blue circle. A comment collection ships no styleId, so
// MP's createStyle hits its `wrongStyleId` path and sets no style at all — the OL
// built-in default point is what we see. We mirror the app's on-map marker
// (app `/icons/comment.svg`: a blue Lucide "message-circle" with a white outline,
// anchored at the bubble's tail tip) as an inline-SVG OL Icon and set it directly
// on the native OL layer — the same "reach the native OL object and operate on
// it" pattern MP-8 uses for the source's load events. Because MP never applies a
// style to a styleId-less layer, ours is not clobbered on later bbox loads.
const COMMENT_PIN_SVG =
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\">" +
    "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\" fill=\"#2563eb\" stroke=\"#ffffff\" " +
    "stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></svg>",
    // anchor matches the app (PIN_ANCHOR [0.15, 0.95], fraction units) so the
    // bubble's tail sits on the comment coordinate.
    COMMENT_STYLE = new Style({
        image: new Icon({
            src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(COMMENT_PIN_SVG),
            anchor: [0.15, 0.95]
        })
    });

/**
 * Builds the absolute URL for a backend path.
 * @param {string} baseUrl backend base URL (no trailing slash required)
 * @param {string} path path like "/api/oaf/collections"
 * @returns {string} absolute URL
 */
function absUrl (baseUrl, path) {
    return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

/**
 * Constructs a NATIVE Masterportal OAF layer config. Masterportal fetches,
 * reprojects, styles and renders the data itself (with the Bearer token added
 * by backendAuth) — the addon contributes no GeoJSON handling. Geodata is
 * read-only by design; comment collections are the one write exception and get
 * the addon's comment gfiTheme (thread view + edit/delete + reply).
 *
 * @param {string} backendUrl backend base URL
 * @param {object} collection {id, title, description, group, kind}
 * @returns {object} layer config for addLayerToLayerConfig
 */
function buildOafLayerConfig (backendUrl, collection) {
    // Data collections become COSI "facilities" (Fachdaten): listed in the
    // FeaturesList tool and scoped to the selected Gebiet. Comment collections
    // are neither — they keep the lightweight viewport-only behaviour.
    const isData = collection.kind === "data",
        // DistrictSelector's setBBoxToGeom only re-scopes layers on a selection
        // *change*, so a layer added while a Gebiet is already selected would load
        // unscoped until the next change. Seed the first load with the current
        // bounding geometry so it is district-scoped from the start; later changes
        // are handled by COSI over every OAF layer in the map.
        boundingGeometry = isData ? store.getters["Modules/DistrictSelector/boundingGeometry"] : undefined;

    return {
        type: "layer",
        id: portalLayerIdFor(collection),
        name: collection.title || collection.id,
        parentId: FOLDER_ID,
        typ: "OAF",
        // Datasets are grouped Hamburg-style into one OAF instance per group:
        // /api/oaf/{group}. The native layer points at that group's base url.
        url: absUrl(backendUrl, `/api/oaf/${encodeURIComponent(collection.group)}`),
        collection: collection.id,
        crs: OAF_CRS,
        bboxCrs: OAF_CRS,
        // Data layers load "all" so FeaturesList sees the whole set and the
        // DistrictSelector can constrain them: under "all", masterportalapi uses
        // loadingParams.bbox (derived from the layer's bboxGeometry = the selected
        // Gebiet's extent) as the actual OAF request bbox and pages via nextLink —
        // so a Gebiet selection limits the fetch to that district, not the whole
        // (possibly huge) dataset. Comment layers stay viewport-only ("bbox").
        loadingStrategy: isData ? "all" : "bbox",
        // OAF page size for nextLink pagination — not a hard cap under "all".
        limit: 400,
        // FeaturesList ("Fachdaten einsehen") only lists layers flagged isFacility
        // (and located under the Fachdaten folder). Comments are not facilities.
        isFacility: isData,
        // undefined unless a Gebiet is already selected for a data layer; harmless
        // otherwise (featuresFilter/loadingParams both guard for it).
        bboxGeometry: boundingGeometry,
        transparent: true,
        gfiAttributes: "showAll",
        // "mpAddonGfi" resolves to the registered MpAddonGfi theme component
        // (getTheme upperFirsts the configured name). BOTH kinds use it now:
        // comment collections render the thread; data collections render a
        // properties table PLUS a "comment on this feature" composer (COM-11) —
        // unreachable while data layers stayed on the "default" theme.
        gfiTheme: "mpAddonGfi",
        isBaseLayer: false,
        isSelected: true,
        visibility: true,
        showInLayerTree: true,
        isVisibleInTree: true
    };
}

/**
 * Finds the native OL layer of a portal layer.
 * @param {string} portalLayerId portal layer id
 * @returns {object|null} the OL layer or null
 */
function findLayer (portalLayerId) {
    const map = mapCollection?.getMap("2D");

    return map?.getLayers().getArray().find((l) => l.get("id") === portalLayerId) || null;
}

/**
 * Finds the OL vector source of a portal layer (unwraps cluster sources).
 * @param {string} portalLayerId portal layer id
 * @returns {object|null} the OL source or null
 */
function findLayerSource (portalLayerId) {
    const rawSource = findLayer(portalLayerId)?.getSource();

    return rawSource?.getSource ? rawSource.getSource() : rawSource || null;
}

/**
 * MP-8: wires a per-layer loading indicator. Subscribes to the OL vector
 * source's featuresloadstart / featuresloadend / featuresloaderror events and
 * mirrors the in-flight count into the store, so the collection's row can show a
 * spinner while a slow/large bbox load is running. Masterportal creates the
 * native OAF source asynchronously after addLayerToLayerConfig, so we poll
 * findLayerSource a few times before giving up — failure-tolerant: no source ⇒
 * no indicator (cf. the MP-7 count probe). A flag on the source guards against
 * double-binding when a hidden layer is re-shown.
 *
 * @param {Function} commit Vuex commit
 * @param {string} key the collection's (group, id) key (loadingLayers key)
 * @param {string} portalLayerId portal layer id
 * @param {number} [attempt] internal retry counter
 * @returns {void}
 */
function wireLoadingListeners (commit, key, portalLayerId, attempt = 0) {
    const source = findLayerSource(portalLayerId);

    if (!source) {
        if (attempt < 40) {
            setTimeout(() => wireLoadingListeners(commit, key, portalLayerId, attempt + 1), 150);
        }
        return;
    }
    if (source.get("mpaddonLoadingWired")) {
        return;
    }
    source.set("mpaddonLoadingWired", true);
    source.on("featuresloadstart", () => commit("incLayerLoading", key));
    source.on("featuresloadend", () => commit("decLayerLoading", key));
    source.on("featuresloaderror", () => commit("decLayerLoading", key));
}

/**
 * MP-9: paints a comment OAF layer with the c4hh-app chat-bubble pin instead of
 * Masterportal's default blue circle. Comment collections carry no styleId, so MP
 * applies no style of its own — we set the OL layer style directly once MP has
 * created the native layer. Masterportal creates that layer asynchronously after
 * addLayerToLayerConfig, so (like wireLoadingListeners) we poll a few times before
 * giving up — failure-tolerant: no layer ⇒ no custom style (MP's default shows,
 * same as before). A flag on the layer guards against re-styling on a re-show.
 *
 * @param {string} portalLayerId portal layer id
 * @param {number} [attempt] internal retry counter
 * @returns {void}
 */
function wireCommentStyle (portalLayerId, attempt = 0) {
    const layer = findLayer(portalLayerId);

    if (!layer) {
        if (attempt < 40) {
            setTimeout(() => wireCommentStyle(portalLayerId, attempt + 1), 150);
        }
        return;
    }
    if (layer.get("mpaddonCommentStyled")) {
        return;
    }
    layer.set("mpaddonCommentStyled", true);
    layer.setStyle(COMMENT_STYLE);
}

/**
 * MP-15: applies the collection's OAF StyleSpec to the native OL layer.
 * Analog to wireCommentStyle: polls findLayer until MP has created the native
 * layer, then fetches the style spec from the collection's styleUrl, builds
 * an OL style function via buildStyleFor, and sets it on the layer.
 * Failure-tolerant: fetch errors or invalid specs result in console.warn and
 * fall back to Masterportal's default rendering (no throw).
 * A guard flag on the layer prevents double-styling on re-show.
 *
 * @param {object} collection - the collection object with styleUrl
 * @param {string} portalLayerId - portal layer id
 * @param {number} [attempt] - internal retry counter
 * @returns {void}
 */
function wireCollectionStyle (collection, portalLayerId, attempt = 0) {
    // Only data collections carry a styleUrl; comment collections do not.
    if (!collection?.styleUrl) {
        return;
    }

    const layer = findLayer(portalLayerId);

    if (!layer) {
        if (attempt < 40) {
            setTimeout(() => wireCollectionStyle(collection, portalLayerId, attempt + 1), 150);
        }
        return;
    }
    // Guard against re-styling on re-show: same semantics as wireCommentStyle.
    // When the layer is the same object the flag is set; if MP re-creates the
    // layer on re-show the flag is absent and we style the new layer.
    if (layer.get("mpaddonCollectionStyled")) {
        return;
    }
    layer.set("mpaddonCollectionStyled", true);

    // Fetch the style spec from the backend (Bearer via axios interceptor in
    // backendAuth.js). Timeout 30s matches the collections fetch.
    axios.get(collection.styleUrl, {timeout: 30000})
        .then(({data: spec}) => {
            // spec may be unresolved (controls-only) — buildStyleFor handles
            // that by falling back to static defaults, matching AppMap behaviour.
            const styleFn = buildStyleFor(spec);

            layer.setStyle(styleFn);
        })
        .catch((err) => {
            // Network error, timeout, non-200: log and keep MP default rendering.
            console.warn("MP-15: failed to load style for collection", collection.id, "from", collection.styleUrl, err);
            // Do NOT throw — leave MP's default style in place.
        });
}

export default {
    /**
     * Logs into the backend, stores the session, and loads the collection list.
     *
     * @param {object} context Vuex context
     * @param {object} payload {backendUrl, email, password}
     * @returns {Promise<void>}
     */
    async login ({commit, dispatch}, {backendUrl, email, password}) {
        commit("setLoginBusy", true);
        commit("setLoginError", null);
        try {
            const url = absUrl(backendUrl, "/api/auth/login"),
                // X-Auth-Mode: token ⇒ the backend also returns the refresh token
                // in the body (a cross-origin client can't read the httpOnly
                // cookie). __mpaddonSkipAuth ⇒ don't attach/refresh a stale token.
                {data} = await axios.post(url, {email, password}, {
                    headers: {"X-Auth-Mode": "token"},
                    __mpaddonSkipAuth: true,
                    timeout: 30000
                });

            commit("setBackendUrl", backendUrl);
            commit("setToken", data.accessToken);
            commit("setUser", data.user);

            localStorage.setItem("mpaddon.backendUrl", backendUrl);
            localStorage.setItem("mpaddon.token", data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem("mpaddon.refreshToken", data.refreshToken);
            }
            localStorage.setItem("mpaddon.user", JSON.stringify(data.user));

            await dispatch("fetchCollections");
        }
        catch (err) {
            const msg = err.response?.data?.statusMessage
                || err.response?.statusText
                || err.message
                || "Login failed";

            commit("setLoginError", msg);
            throw err;
        }
        finally {
            commit("setLoginBusy", false);
        }
    },

    /**
     * Clears the local session and hides the layers we added.
     *
     * @param {object} context Vuex context
     * @returns {void}
     */
    logout ({state, commit, dispatch}) {
        dispatch("cancelCompose");
        // Hide our layers so they stop trying to load once the token is gone.
        Object.values(state.addedLayers).forEach(({portalLayerId}) => {
            store.dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{id: portalLayerId, layer: {visibility: false, isSelected: false}}]
            }, {root: true});
        });
        commit("setToken", null);
        commit("setUser", null);
        commit("setAvailableLayers", []);
        commit("clearAddedLayers");
        localStorage.removeItem("mpaddon.token");
        localStorage.removeItem("mpaddon.refreshToken");
        localStorage.removeItem("mpaddon.user");
    },

    /**
     * Fetches the OAF catalogue (/api/oaf) — the dataset groups the user may
     * read — then each group's collections, tagging every collection with its
     * group so it can be added as a native OAF layer and shown grouped.
     * The Authorization header is attached + kept fresh by the backendAuth
     * axios interceptor.
     *
     * @param {object} context Vuex context
     * @returns {Promise<void>}
     */
    async fetchCollections ({state, commit}) {
        commit("setLayersLoading", true);
        commit("setLayersError", null);
        try {
            const {data: catalogue} = await axios.get(absUrl(state.backendUrl, "/api/oaf"), {timeout: 30000}),
                groups = Array.isArray(catalogue?.datasets) ? catalogue.datasets : [],
                perGroup = await Promise.all(groups.map(async (g) => {
                    try {
                        const {data} = await axios.get(
                            absUrl(state.backendUrl, `/api/oaf/${encodeURIComponent(g.id)}/collections`),
                            {timeout: 30000}
                        );

                        return (data?.collections || []).map((c) => ({
                            id: c.id,
                            title: c.title || c.id,
                            description: c.description || "",
                            group: g.id,
                            groupTitle: g.title || g.id,
                            internal: Boolean(g.internal),
                            // c4hh vendor tags: comment collections are writable
                            // (Part-4 POST/PUT/DELETE), data collections read-only.
                            kind: c["c4hh:kind"] === "comments" ? "comments" : "data",
                            canComment: Boolean(c["c4hh:canComment"]),
                            // MP-7: exact feature count for the muted badge; null
                            // when an older backend omits it (no badge shown).
                            featureCount: typeof c["c4hh:featureCount"] === "number" ? c["c4hh:featureCount"] : null,
                            // The use case's canonical (primary) comment collection —
                            // advertised at the stable `comments` id (COM-8). The data-
                            // layer GFI authors feature comments into this one (COM-11).
                            isPrimary: Boolean(c["c4hh:isPrimaryComment"]),
                            // The underlying comment dataset id (COM-19c) — the key for
                            // the SPA vote endpoint (/api/comment-datasets/{id}/votes);
                            // null on a data collection or an older backend.
                            commentDatasetId: typeof c["c4hh:commentDatasetId"] === "number" ? c["c4hh:commentDatasetId"] : null,
                            // MP-15: DATA-25 OAF Styles surface — the rel=styles link from
                            // the collection's links array. Null when the backend omits it
                            // or the collection has no style (e.g. comment collections).
                            styleUrl: (c.links || []).find((l) => l?.rel === "styles")?.href ?? null
                        }));
                    }
                    catch (e) {
                        return [];
                    }
                }));

            commit("setAvailableLayers", perGroup.flat());
        }
        catch (err) {
            const msg = err.response?.data?.statusMessage || err.message || "Failed to load collections";

            commit("setLayersError", msg);
        }
        finally {
            commit("setLayersLoading", false);
        }
    },

    /**
     * Adds a collection to the map as a native OAF layer (or re-shows it if it
     * was hidden).
     *
     * @param {object} context Vuex context
     * @param {object} payload {collection}
     * @returns {Promise<void>}
     */
    async addLayer ({state, commit}, {collection}) {
        // MP-13: keyed on (group, id) — every group's primary comment collection
        // shares the id `comments`, so the bare id is not unique (collectionKey.js).
        const key = keyOfCollection(collection),
            existing = state.addedLayers[key];

        // Re-show only if the layer is still in the tree. If the user removed it
        // via Masterportal's native layer tree the config is gone and a re-show
        // would be a silent no-op, so fall through to a fresh add (MP-6).
        if (existing && store.getters.layerConfigById(existing.portalLayerId)) {
            store.dispatch("replaceByIdInLayerConfig", {
                layerConfigs: [{id: existing.portalLayerId, layer: {visibility: true, isSelected: true}}]
            }, {root: true});
            // Re-shown: the source persisted across the hide and may already be
            // wired (guarded), but re-wire in case it was re-created (MP-8).
            wireLoadingListeners(commit, key, existing.portalLayerId);
            if (collection.kind === "comments") {
                wireCommentStyle(existing.portalLayerId);
            }
            // MP-15: apply OAF StyleSpec for data collections
            if (collection.kind === "data") {
                wireCollectionStyle(collection, existing.portalLayerId);
            }
            return;
        }

        const layerConfig = buildOafLayerConfig(state.backendUrl, collection);
        let folderToAdd = layerConfig,
            parentKey = FOLDER_ID;

        // First add: wrap in the mpbackend folder if it doesn't exist yet. Nest it
        // inside COSI's Fachdaten folder so FeaturesList discovers our layers; if
        // that folder/id is absent (e.g. a re-vendored config that dropped the id)
        // fall back to the subject-data root so the addon still works — the layers
        // just won't appear in "Fachdaten einsehen".
        if (!(store.getters.folderById && store.getters.folderById(FOLDER_ID))) {
            parentKey = store.getters.folderById?.(FACHDATEN_FOLDER_ID)
                ? FACHDATEN_FOLDER_ID
                : treeSubjectsKey;
            folderToAdd = {
                type: "folder",
                name: FOLDER_NAME,
                id: FOLDER_ID,
                elements: [layerConfig]
            };
        }

        await store.dispatch("addLayerToLayerConfig", {layerConfig: folderToAdd, parentKey}, {root: true});
        commit("markLayerAdded", {
            key,
            collectionId: collection.id,
            portalLayerId: layerConfig.id,
            group: collection.group,
            isComments: collection.kind === "comments",
            canComment: Boolean(collection.canComment)
        });
        // MP-8: hook the just-created source's load events for the row spinner.
        wireLoadingListeners(commit, key, layerConfig.id);
        // MP-9: paint comment layers with the c4hh-app chat-bubble pin.
        if (collection.kind === "comments") {
            wireCommentStyle(layerConfig.id);
        }
        // MP-15: apply OAF StyleSpec for data collections
        if (collection.kind === "data") {
            wireCollectionStyle(collection, layerConfig.id);
        }
    },

    /**
     * Hides a previously-added layer (keeps it in the tree).
     *
     * @param {object} context Vuex context
     * @param {object} payload {collection}
     * @returns {void}
     */
    hideLayer ({state, dispatch}, {collection}) {
        const key = keyOfCollection(collection),
            existing = state.addedLayers[key];

        if (!existing) {
            return;
        }
        if (keyOfCollection(state.composeFor) === key) {
            dispatch("cancelCompose");
        }
        store.dispatch("replaceByIdInLayerConfig", {
            layerConfigs: [{id: existing.portalLayerId, layer: {visibility: false, isSelected: false}}]
        }, {root: true});
    },

    /**
     * Enters "add comment" mode for a comment collection: the addon claims the
     * map's mouse interactions (suspending GFI) so the next click places the
     * pin. The CommentComposer component watches Maps/clickCoordinate.
     *
     * @param {object} context Vuex context
     * @param {object} payload {collection}
     * @returns {void}
     */
    startCompose ({commit}, {collection}) {
        commit("setComposeCoordinate", null);
        commit("setComposeFor", collection);
        commit("Menu/setCurrentMouseMapInteractionsComponent", "mpaddon", {root: true});
    },

    /**
     * Leaves "add comment" mode and gives the map clicks back to the GFI.
     *
     * @param {object} context Vuex context
     * @returns {void}
     */
    cancelCompose ({state, commit}) {
        if (state.composeFor === null && state.composeCoordinate === null) {
            return;
        }
        commit("setComposeFor", null);
        commit("setComposeCoordinate", null);
        commit("Menu/setCurrentMouseMapInteractionsComponent", "getFeatureInfo", {root: true});
    },

    /**
     * POSTs a comment as a GeoJSON feature (OAF Part-4-shaped create) into a
     * comment collection. The picked map coordinate is transformed to lon/lat
     * client-side, so no Content-Crs negotiation is needed; on success the
     * layer source is refreshed so a new pin shows at once. Shared OAF-create
     * plumbing used by both the menu composer (submitCompose) and the floating
     * map comment control (MP-12).
     *
     * @param {object} context Vuex context
     * @param {object} payload {group, collectionId, coordinate, body}
     * @returns {Promise<void>}
     */
    async createComment ({state, dispatch}, {group, collectionId, coordinate, body}) {
        const map = mapCollection?.getMap("2D");

        if (!group || !collectionId || !coordinate || !map || !body) {
            return;
        }
        const lonLat = transform(coordinate, map.getView().getProjection(), "EPSG:4326");

        await axios.post(
            absUrl(state.backendUrl, `/api/oaf/${encodeURIComponent(group)}/collections/${encodeURIComponent(collectionId)}/items`),
            {
                type: "Feature",
                geometry: {type: "Point", coordinates: lonLat},
                // A placed comment is a PDS "Contribution" → `contributionContent`
                // (ADR-019, c4hh docs/PDS.md §6); the server stores it in `body`.
                properties: {contributionContent: body}
            },
            {timeout: 30000}
        );
        dispatch("refreshLayer", {group, collectionId});
    },

    /**
     * POSTs the composed comment for the active compose collection, then leaves
     * compose mode. Delegates the OAF create to createComment.
     *
     * @param {object} context Vuex context
     * @param {object} payload {body} the comment text
     * @returns {Promise<void>}
     */
    async submitCompose ({state, dispatch}, {body}) {
        const collection = state.composeFor,
            coordinate = state.composeCoordinate;

        if (!collection || !coordinate) {
            return;
        }
        await dispatch("createComment", {group: collection.group, collectionId: collection.id, coordinate, body});
        dispatch("cancelCompose");
    },

    /**
     * Re-fetches a layer's features (e.g. after a comment was written) by
     * refreshing the underlying OL vector source.
     *
     * @param {object} context Vuex context
     * @param {object} payload {group, collectionId}
     * @returns {void}
     */
    refreshLayer ({state}, {group, collectionId}) {
        const entry = state.addedLayers[collectionKey(group, collectionId)],
            source = entry ? findLayerSource(entry.portalLayerId) : null;

        source?.refresh?.();
    },

    /**
     * Casts/switches (value "pro"|"contra") or withdraws (value null) the user's
     * pro/contra vote on a comment (COM-19c). Voting reuses the generic votes
     * table, exposed on the SPA path /api/comment-datasets/{id}/votes (NOT the OAF
     * surface) — the OAF Feature carries the aggregate tally + the caller's own
     * `c4hh:myVote` for display. The Authorization header is added by the
     * backendAuth axios interceptor (our origin). The caller reloads its own
     * comment cache afterwards to pick up the new tally.
     *
     * @param {object} context Vuex context
     * @param {object} payload {commentDatasetId, commentId, value}
     * @returns {Promise<void>}
     */
    async voteComment ({state}, {commentDatasetId, commentId, value}) {
        if (commentDatasetId === null || commentDatasetId === undefined || commentId === null || commentId === undefined) {
            return;
        }
        const base = absUrl(state.backendUrl, `/api/comment-datasets/${encodeURIComponent(commentDatasetId)}/votes`);

        if (value === null) {
            await axios.delete(base, {params: {commentId}, timeout: 30000});
        }
        else {
            await axios.post(base, {commentId, value}, {timeout: 30000});
        }
    }
};
