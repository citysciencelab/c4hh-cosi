/**
 * Returns a shallow copy of the given payload with an added "_source" property
 * set to the component name of the provided Vue component context.
 * The "_source" value is used by the userTracking addon to identify which component
 * triggered a store action.
 * @param {Object} context The Vue component instance (typically `this`).
 * @param {String} context.$options.name The name of the component.
 * @param {Object} payload The original action payload to extend.
 * @returns {Object} A new object containing all payload properties plus `_source`.
 */
export function addSourceToPayload (context, payload) {
    return {...payload, _source: context.$options.name};
}
