/**
 * The style of an OL vector layer as a stack of two independent parts, so that the
 * LayerStyler ("Darstellung (neu)") and the LayerFilter ("Filter (neu)") can both
 * change a layer without overwriting each other:
 *
 *   original style (captured when the layer is first touched)
 *     └ base: a custom style function of the LayerStyler — or the original
 *         └ filter: a wrapper of the LayerFilter around whatever the base is
 *
 * When neither part is set, the original style is put back and the layer forgotten.
 */
import {createDefaultStyle} from "ol/style/Style.js";

const stacks = new Map();

/**
 * The stack of a layer, created on first use.
 * @param {Object} layer Masterportal layer.
 * @returns {Object} The stack.
 */
function stackOf (layer) {
    const id = layer.get("id");
    let stack = stacks.get(id);

    if (!stack) {
        stack = {original: layer.getLayer().getStyle(), base: null, filter: null};
        stacks.set(id, stack);
    }
    return stack;
}

/**
 * A style (function, Style, array or null) as a function.
 * @param {Function|Object|null} style The style.
 * @returns {Function} (feature, resolution) => style
 */
function asFunction (style) {
    if (typeof style === "function") {
        return style;
    }
    return style ? () => style : createDefaultStyle;
}

/**
 * Puts the composed style onto the OL layer.
 * @param {Object} layer Masterportal layer.
 * @returns {void}
 */
function compose (layer) {
    const id = layer.get("id"),
        stack = stacks.get(id);

    if (!stack) {
        return;
    }
    const base = stack.base ?? stack.original;

    if (stack.filter) {
        layer.getLayer().setStyle(stack.filter(asFunction(base)));
    }
    else {
        layer.getLayer().setStyle(base);
        if (!stack.base) {
            stacks.delete(id);
        }
    }
}

/**
 * Sets the custom base style of a layer (LayerStyler); null brings back the original.
 * @param {Object} layer Masterportal layer.
 * @param {Function|null} styleFn (feature, resolution) => style
 * @returns {void}
 */
export function setBaseStyle (layer, styleFn) {
    if (!styleFn && !stacks.has(layer.get("id"))) {
        return;
    }
    stackOf(layer).base = styleFn;
    compose(layer);
}

/**
 * Sets the filter wrapper of a layer (LayerFilter); null removes it.
 * @param {Object} layer Masterportal layer.
 * @param {Function|null} wrap (baseFn) => (feature, resolution) => style
 * @returns {void}
 */
export function setFilterStyle (layer, wrap) {
    if (!wrap && !stacks.has(layer.get("id"))) {
        return;
    }
    stackOf(layer).filter = wrap;
    compose(layer);
}

/**
 * Whether the LayerStyler has a custom base style on the layer.
 * @param {String} layerId Layer id.
 * @returns {Boolean} True if styled.
 */
export function hasBaseStyle (layerId) {
    return Boolean(stacks.get(layerId)?.base);
}

/**
 * Only for tests: forget every stack.
 * @returns {void}
 */
export function resetStyleStacks () {
    stacks.clear();
}
