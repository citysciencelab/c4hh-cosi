import {generateSimpleGetters} from "../../../src/shared/js/utils/generators.js";
import {keyOfCollection} from "../js/collectionKey.js";
import stateMpAddon from "./stateMpAddon";

// MP-13: these three take a COLLECTION OBJECT ({id, group, …}), not a bare id —
// the id alone is ambiguous across groups (see js/collectionKey.js).
const getters = {
    ...generateSimpleGetters(stateMpAddon),
    isAuthenticated: (state) => Boolean(state.token && state.user),
    isLayerAdded: (state) => (collection) => Boolean(state.addedLayers[keyOfCollection(collection)]),
    // Real map visibility of an added collection — read from the SAME source the
    // native layer tree reads (the root layerConfig's `visibility`), so the addon,
    // the map and Masterportal's own sidebar stay in sync both directions: our
    // hideLayer and a native-tree checkbox toggle both go through
    // replaceByIdInLayerConfig, which reassigns the reactive layerConfig (MP-6).
    // false when the collection was never added OR was removed from the tree.
    isLayerVisible: (state, moduleGetters, rootState, rootGetters) => (collection) => {
        const entry = state.addedLayers[keyOfCollection(collection)],
            conf = entry ? rootGetters.layerConfigById(entry.portalLayerId) : null;

        return Boolean(conf && conf.visibility);
    },
    // MP-8: true while the collection's OL source is fetching features for the
    // current bbox (featuresloadstart outstanding). Function getter, re-read on
    // each loadingLayers reassignment (same pattern as isLayerVisible).
    isLayerLoading: (state) => (collection) => (state.loadingLayers[keyOfCollection(collection)] || 0) > 0,
    // The backend's PublicUser carries globalRole (not role). Admins may edit/
    // delete any comment; everyone else only their own (userId match).
    isAdmin: (state) => state.user?.globalRole === "admin",
    userId: (state) => {
        const id = state.user?.id;

        return id === undefined || id === null ? null : Number(id);
    }
};

export default getters;
