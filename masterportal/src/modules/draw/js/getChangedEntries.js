/**
 * Checks if two values are equal. Arrays are compared element-wise.
 * @param {*} a The first value.
 * @param {*} b The second value.
 * @returns {Boolean} Only true if both values are equal.
 */
export function isSameValue (a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((entry, index) => isSameValue(entry, b[index]));
    }

    return a === b;
}

/**
 * Reduces the options to the entries that differ from the current state.
 * @param {Object} currentState The current state object.
 * @param {Object} options The options that are about to be applied to the state.
 * @returns {Object|null} The changed entries or null if nothing changes.
 */
export function getChangedEntries (currentState, options) {
    const changes = Object.entries(options ?? {}).filter(([key, value]) => !isSameValue(currentState?.[key], value));

    return changes.length > 0 ? Object.fromEntries(changes) : null;
}
