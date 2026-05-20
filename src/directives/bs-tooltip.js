import {Tooltip} from "bootstrap";

/**
 * Vue directive that manages the lifecycle of a Bootstrap Tooltip in sync with
 * the Vue component lifecycle.
 *
 * Usage: v-bs-tooltip="{ placement: 'bottom', customClass: 'my-tooltip' }"
 *
 * The directive handles three lifecycle phases:
 * - mounted:       creates the Bootstrap Tooltip instance with the given options.
 * - updated:       merges changed binding options into the existing Tooltip config.
 * - beforeUnmount: safely tears down the Tooltip instance.
 *
 * @module directives/bs-tooltip
 */
export default {
    /**
     * Creates a Bootstrap Tooltip instance on the element when it is mounted.
     * @param {HTMLElement} element - The element the directive is bound to.
     * @param {Object} binding - Vue directive binding.
     * @param {Object} binding.value - Tooltip options from "v-bs-tooltip".
     * @returns {void}
     */
    mounted (element, binding) {
        new Tooltip(element, binding.value ?? {});
    },

    /**
     * Updates the Tooltip configuration when the binding value changes.
     * @param {HTMLElement} element - The element the directive is bound to.
     * @param {Object} binding - Vue directive binding.
     * @param {Object} binding.value - Updated tooltip options from "v-bs-tooltip".
     * @returns {void}
     */
    updated (element, binding) {
        if (Tooltip.getInstance(element)?._config) {
            Object.assign(Tooltip.getInstance(element)._config, binding.value ?? {});
        }
    },

    /**
     * Tears down the Bootstrap Tooltip instance before the element is unmounted.
     *
     * Bootstrap's hide animation runs asynchronously and its "complete"-callback
     * accesses the element (e.g. to call removeAttribute), which dispose()
     * would nullify if called synchronously. To avoid this:
     *   - The tooltip DOM element is removed immediately.
     *   - The instance is disabled to suppress further triggers.
     *   - dispose() is deferred via setTimeout to let all pending callbacks finish.
     *
     * @param {HTMLElement} element - The element the directive is bound to.
     * @returns {void}
     */
    beforeUnmount (element) {
        const tooltipId = element.getAttribute("aria-describedby");

        if (tooltipId) {
            document.getElementById(tooltipId)?.remove();
        }

        const instance = Tooltip.getInstance(element);

        if (instance) {
            instance.disable();
            setTimeout(() => {
                instance.dispose();
            }, 2000);
        }
    }
};
