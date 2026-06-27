const VM_SHIM_ID = "\0vm-shim";

/**
 * Shim for the Node.js "vm" module to avoid Vite build warnings/errors.
 * Some dependencies reference "vm", which is not available in the browser.
 * This replaces the module with an empty stub, as it is not used at runtime.
 * @returns {void}
 */
export default function vmShimPlugin () {
    return {
        name: "vm-shim",
        enforce: "pre",
        resolveId (source) {
            if (source === "vm") {
                return VM_SHIM_ID;
            }
            return null;
        },
        load (id) {
            if (id !== VM_SHIM_ID) {
                return null;
            }
            return "export default {};";
        }
    };
}
