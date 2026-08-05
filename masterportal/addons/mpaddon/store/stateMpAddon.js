/**
 * State for the mpaddon Masterportal addon.
 *
 * Connection state plus the OAF collections the user may read and which of them
 * we've added to the layer tree (as native Masterportal OAF layers).
 * Every per-collection map here is keyed by the collection's "{group}/{id}" key
 * (js/collectionKey.js) — the bare id is not unique across groups (MP-13).
 */
const state = {
    description: "additional:modules.mpaddon.description",
    icon: "bi-cloud-arrow-down",
    name: "additional:modules.mpaddon.title",
    type: "mpaddon",

    // Connection
    backendUrl: localStorage.getItem("mpaddon.backendUrl") || "",
    token: localStorage.getItem("mpaddon.token") || null,
    user: JSON.parse(localStorage.getItem("mpaddon.user") || "null"),

    // UI
    loginBusy: false,
    loginError: null,
    layersLoading: false,
    layersError: null,

    // Data: OAF collections
    // [{id, title, description, group, kind, canComment, isPrimary, featureCount, styleUrl}]
    // styleUrl (MP-15): absolute URL to the collection's OAF StyleSpec (DATA-25)
    //   from the collection's links array (rel=styles). Null when the backend
    //   omits it or the collection has no style (e.g. comment collections).
    availableLayers: [],
    // map<"{group}/{id}", {collectionId, portalLayerId, group, isComments, canComment, addedAt}>
    addedLayers: {},
    // MP-8: in-flight feature-load count per collection id. A native OAF layer
    // loads features per bbox asynchronously; we count featuresloadstart minus
    // featuresloadend/error so a slow/large layer's row can show a spinner. A
    // counter (not a flag) tolerates overlapping bbox loads.
    // map<"{group}/{id}", number>
    loadingLayers: {},

    // Comment composer: the comment collection a new comment is being written
    // for (or null) and the picked map coordinate (in map projection). While
    // composeFor is set the addon claims the map clicks (GFI is suspended).
    composeFor: null,
    composeCoordinate: null
};

export default state;
