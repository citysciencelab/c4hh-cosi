import {getChangedEntries} from "./getChangedEntries.js";

/**
 * Creates component methods that commit a mutation only if the value differs from the getter of the same name.
 * @param {String[]} names Getter names, e.g. "currentLayout"; mutation and method are named "set" + capitalized name.
 * @param {Function} getPayload Receives (currentValue, newValue) and returns the payload to commit or null.
 * @returns {Object} Methods to be spread into the component's methods.
 */
function createGuardedSetters (names, getPayload) {
    return Object.fromEntries(names.map(name => {
        const mutation = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;

        return [mutation, function (value) {
            const payload = getPayload(this[name], value);

            if (payload !== null) {
                this.$store.commit(`Modules/Draw/${mutation}`, payload);
            }
        }];
    }));
}

/**
 * Creates setters for object-valued getters that commit only changed entries.
 * @param {String[]} names Getter names used to derive the setter and mutation names.
 * @returns {Object} Component methods that commit changed object entries.
 */
export function createObjectSetters (names) {
    return createGuardedSetters(names, getChangedEntries);
}

/**
 * Creates setters that commit only when the new value differs from the current value.
 * @param {String[]} names Getter names used to derive the setter and mutation names.
 * @returns {Object} Component methods that commit changed values.
 */
export function createValueSetters (names) {
    return createGuardedSetters(names, (current, value) => current !== value ? value : null);
}
