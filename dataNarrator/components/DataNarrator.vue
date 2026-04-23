<script>
import {mapGetters, mapMutations} from "vuex";
import StoryPlayer from "./storyPlayer/StoryPlayer.vue";

export default {
    name: "DataNarrator",
    components: {
        StoryPlayer
    },
    data () {
        return {
            storyList: {},
            toolBodyScrollTop: 0,
            isActive: false
        };
    },
    computed: {
        ...mapGetters("Modules/DataNarrator", [
            "autoplay",
            "storyConfJson",
            "icon"
        ]),
        ...mapGetters([
            "uiStyle",
            "configJs",
            "isMobile"
        ]),
        ...mapGetters("Menu", [
            "secondaryExpanded"
        ]),
        storyMode () {
            return this.storyConf?.displayType ? this.storyConf.displayType : "dipas";
        },
        isMobileDevice () {
            const userAgentCheck = (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i).test(navigator.userAgent),
                touchCheck = "ontouchstart" in window || navigator.maxTouchPoints > 0,
                screenSizeCheck = this.isMobile,
                orientationCheck = screen.orientation?.type.startsWith("portrait");

            return userAgentCheck || (touchCheck && screenSizeCheck && orientationCheck);
        },
        isMobilePortrait () {
            return this.isMobileDevice && screen.orientation?.type.startsWith("portrait");
        }
    },
    watch: {
        secondaryExpanded (expanded) {
            if (!expanded && this.isActive) {
                document.getElementById("secondaryMenu-toggle-button")?.firstChild?.classList?.replace("bi-tools", this.icon);
            }
        }
    },
    /**
     * KeepAlive: This addon uses the Masterportal module caching feature,
     * see docs/Dev/vueComponents/ModuleCaching.md
     * The activated and deactivated hooks are called, when the component is
     * shown or closed via "menu" link.
     */
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
        this.isActive = true;
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
        this.isActive = false;
    },
    mounted () {
        if (this.isMobilePortrait) {
            if (!this.secondaryExpanded) {
                document.getElementById("secondaryMenu-toggle-button")?.firstChild?.classList?.replace("bi-tools", this.icon);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/DataNarrator", [
            "setStoryConf",
            "setMode"
        ])
    }
};
</script>

<template lang="html">
    <div id="dataNarrator">
        <StoryPlayer
            :is-mobile-device="isMobileDevice"
        />
    </div>
</template>

