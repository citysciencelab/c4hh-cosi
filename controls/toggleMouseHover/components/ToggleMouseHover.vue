<script>
import {mapGetters, mapMutations} from "vuex";
import ControlIcon from "@modules/controls/components/ControlIcon.vue";

/**
 * The ToggleMouseHover control simply toggles the mouse hover state.
 * @module modules/controls/ToggleMouseHover
 */
export default {
    name: "ToggleMouseHover",
    components: {
        ControlIcon
    },
    data () {
        return {
            mouseHoverConfig: null
        };
    },
    computed: {
        ...mapGetters("Controls/ToggleMouseHover", ["icon", "iconFill"]),
        ...mapGetters(["mouseHover"])
    },
    created () {
        this.mouseHoverConfig = this.mouseHover;
    },
    methods: {
        ...mapMutations(["setMouseHover"]),

        /**
         * Toggles mouseHover on and off.
         * If it is currently inactive, it will be set to the configured value for mouseHover.
         * @returns {void}
         */
        toggleMouseHover () {
            if (Object.keys(this.mouseHover).length > 0) {
                this.setMouseHover(false);
            }
            else {
                this.setMouseHover(this.mouseHoverConfig);
            }
        }
    }
};
</script>

<template>
    <div
        id="toggle-mousehover-button"
    >
        <ControlIcon
            :title="$t('additional:modules.controls.toggleMouseHover.iconTitle')"
            :icon-name="Object.keys(mouseHover).length > 0 ? iconFill : icon"
            :on-click="toggleMouseHover"
        />
    </div>
</template>
