/**
 * MP-13: the identity of an OAF collection is the PAIR (group, id) — never the
 * id on its own.
 *
 * Every use case's canonical comment dataset is advertised at the same stable
 * `comments` collection id (COM-8), so `energiegerechtigkeit/comments` and
 * `isochronen/comments` are two different collections sharing one id. Keying the
 * addon's per-collection maps (addedLayers, loadingLayers, the map control's
 * comment cache) on the bare id therefore merged them: adding one comment layer
 * made EVERY comment row report "added/visible" (offering "Ausblenden" for
 * layers that were never on the map), the two layers fought over one portal
 * layer id, and their comment caches overwrote each other.
 *
 * Everything the addon keys per collection goes through these helpers instead.
 */

/**
 * The addon-wide key of a collection.
 * @param {string} group dataset group id
 * @param {string} collectionId backend collection id (= layer_name or `comments`)
 * @returns {string} the composite key
 */
export function collectionKey (group, collectionId) {
    return `${group}/${collectionId}`;
}

/**
 * The addon-wide key of a collection object from availableLayers.
 * @param {object} collection {id, group, …} or null
 * @returns {string|null} the composite key, null without a collection
 */
export function keyOfCollection (collection) {
    return collection ? collectionKey(collection.group, collection.id) : null;
}

/**
 * The Masterportal layer-tree id for a collection. Derived from the same pair,
 * so two groups' `comments` collections get two distinct portal layers.
 * @param {object} collection {id, group, …}
 * @returns {string} portal layer id
 */
export function portalLayerIdFor (collection) {
    return `mpbackend_oaf_${collection.group}__${collection.id}`;
}

export default {collectionKey, keyOfCollection, portalLayerIdFor};
