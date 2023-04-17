<script>
import Vue from "vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutationsObliqueViewer from "../store/mutationsVcOblique";
import iframeResize from "../node_modules/iframe-resizer/js/iframeResizer";

Vue?.directive("resize", {
    beforeMount: function (el, {value = {}}) {
        el.addEventListener("load", () => iframeResize(value, el));
    },
    beforeUnmount: function (el) {
        el?.iFrameResizer?.removeListeners();
    }
});

export default {
    name: "VcOblique",
    computed: {
        ...mapGetters("Modules/VcOblique", [
            "active",
            "defaultMapMarkerStyleId",
            "icon",
            "name",
            "obliqueViewerURL"
        ]),
        ...mapGetters("Maps", ["clickCoordinate", "initialCenter"])
    },
    watch: {
        active (value) {
            if (value) {
                this.$nextTick(() => {
                    this.setObliqueViewerURL(this.initialCenter);
                    this.initObliqueView();
                });
            }
        },
        clickCoordinate: {
            handler(value) {
                if (this.active === true) {
                    this.setObliqueView(value);
                }
            },
            deep: true
        }
    },
    /**
     * Put initialize functions here after mounting
     * @returns {void}
     */
    mounted () {
        this.setActive(true);
    },
    beforeUnmount () {
        this.setActive(false);
        this.resetObliqueViewer();
    },
    methods: {
        ...mapMutations("Modules/VcOblique", Object.keys(mutationsObliqueViewer)),
        ...mapActions("Modules/VcOblique", [
            "initObliqueView",
            "resetObliqueViewer",
            "rotatePointMarkerIn3D",
            "setObliqueView",
            "setObliqueViewerURL"])
    }
};

</script>

<template lang="html">
    <div
        v-if="active"
        id="obliqueViewer"
    >
        <iframe
            id="obliqueIframe"
            ref="iframeContent"
            v-resize="{}"
            title="ObliqueIframe"
            width="100%"
            height="100%"
            frameboarder="0"
            :src="obliqueViewerURL"
        />
    </div>
</template>

<style lang="scss" scoped>
#obliqueViewer{
    height: 84vh;
}
</style>

