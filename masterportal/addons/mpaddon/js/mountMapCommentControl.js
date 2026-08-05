import {createApp} from "vue";
import store from "../../../src/app-store/index.js";
import {initiateVueI18Next} from "../../../src/plugins/i18next.js";
import MapCommentControl from "../components/MapCommentControl.vue";

// MP-12: the floating "Kommentare" map control must live on the map regardless
// of whether the addon menu is open. Masterportal only mounts a menu module's
// component while that module is the menu's current component, so a control
// rendered inside MpAddon.vue would vanish the moment the user navigates away.
// Instead we mount MapCommentControl as its own little Vue app onto the
// Masterportal container, sharing the addon's Vuex store (so it sees the same
// auth/collection state) and the i18next instance (so $t works).

const CONTAINER_ID = "mpaddon-map-comment-control",
    HOST_ID = "masterportal-container",
    POLL_MS = 250,
    MAX_ATTEMPTS = 200;

let mounted = false;

/**
 * Polls for the Masterportal container (created after the config loads and the
 * map initialises), then mounts the floating control exactly once. Idempotent
 * and failure-tolerant: if the container never appears it simply gives up.
 * @param {number} [attempt] internal retry counter
 * @returns {void}
 */
function mountMapCommentControl (attempt = 0) {
    if (mounted || typeof document === "undefined" || typeof window === "undefined") {
        return;
    }
    const host = document.getElementById(HOST_ID),
        // Masterportal's addon loader (loadToolAddons) registers this addon's Vuex
        // store module AFTER the side-effect import that starts this poll. In
        // portals where the map container already exists at addon-load time (e.g.
        // COSI), mounting before registration binds MapCommentControl's
        // mapState/mapGetters to a not-yet-present "Modules/Mpaddon" namespace
        // (the "module namespace not found" console errors, and a permanently
        // unbound control). Wait for the store module as well as the host element.
        storeReady = store.hasModule(["Modules", "Mpaddon"]);

    if (!host || !storeReady) {
        if (attempt < MAX_ATTEMPTS) {
            setTimeout(() => mountMapCommentControl(attempt + 1), POLL_MS);
        }
        return;
    }
    if (document.getElementById(CONTAINER_ID)) {
        mounted = true;
        return;
    }
    try {
        const el = document.createElement("div");

        el.id = CONTAINER_ID;
        host.appendChild(el);

        const app = createApp(MapCommentControl);

        app.use(store);
        initiateVueI18Next(app);
        app.mount(el);
        mounted = true;
    }
    catch (e) {
        // Non-fatal: the control is an enhancement, the menu flow still works.
        console.warn("[mpaddon] failed to mount the map comment control", e);
    }
}

mountMapCommentControl();

export default mountMapCommentControl;
