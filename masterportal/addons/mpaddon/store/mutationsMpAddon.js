import {generateSimpleMutations} from "../../../src/shared/js/utils/generators.js";
import stateMpAddon from "./stateMpAddon";

const mutations = {
    ...generateSimpleMutations(stateMpAddon),
    // MP-13: `key` is the collection's (group, id) key; the entry keeps the bare
    // `collectionId` because that — not the key — is the OAF URL segment.
    markLayerAdded (state, {key, collectionId, portalLayerId, group, isComments, canComment}) {
        state.addedLayers = {
            ...state.addedLayers,
            [key]: {collectionId, portalLayerId, group, isComments, canComment, addedAt: Date.now()}
        };
    },
    clearAddedLayers (state) {
        state.addedLayers = {};
        state.loadingLayers = {};
    },
    // MP-8: a bbox load started — bump the in-flight count for this collection.
    // The argument is the collection's (group, id) key (MP-13).
    incLayerLoading (state, key) {
        const current = state.loadingLayers[key] || 0;

        state.loadingLayers = {...state.loadingLayers, [key]: current + 1};
    },
    // MP-8: a bbox load finished/errored — drop the count, clamped at 0 (a late
    // event after logout/clear must not produce a phantom negative). At 0 we
    // remove the key so the object stays small.
    decLayerLoading (state, key) {
        const next = Math.max(0, (state.loadingLayers[key] || 0) - 1),
            updated = {...state.loadingLayers};

        if (next === 0) {
            delete updated[key];
        }
        else {
            updated[key] = next;
        }
        state.loadingLayers = updated;
    }
};

export default mutations;
