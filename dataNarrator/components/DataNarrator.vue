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
            "storyConfJson"
        ]),
        ...mapGetters([
            "uiStyle",
            "configJs"
        ]),
        ...mapGetters("Menu", [
            "secondaryExpanded"
        ]),
        storyMode () {
            return this.storyConf?.displayType ? this.storyConf.displayType : "dipas";
        }
    },
    watch: {
        secondaryExpanded (expanded) {
            if (!expanded && this.isActive) {
                document.getElementById("secondaryMenu-toggle-button")?.firstChild?.classList?.replace("bi-tools", "bi-book");
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
        <StoryPlayer />
    </div>
</template>

