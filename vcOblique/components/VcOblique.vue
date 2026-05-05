<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutationsObliqueViewer from "../store/mutationsVcOblique.js";

export default {
    name: "VcOblique",
        data () {
        return {
            resizeObserver: null
        };
    },
    computed: {
        ...mapGetters("Modules/VcOblique", [
            "active",
            "currentImageName",
            "defaultMapMarkerStyleId",
            "icon",
            "name",
            "obliqueViewerURL"
        ]),
        ...mapGetters("Maps", ["center", "clickCoordinate", "initialCenter"])
    },
    watch: {
        clickCoordinate: {
            handler (value) {
                if (this.active === true) {
                    this.obliqueView(value);
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
        this.$nextTick(() => {
            this.createObliqueViewerURL(this.center || this.initialCenter);
            this.initObliqueView();

            this.initializeResizer();
        });
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
            "obliqueView",
            "createObliqueViewerURL"
        ]),

        /**
         * Initialize the iframe resizer for the oblique viewer iframe.
         * @returns {void}
         */
        initializeResizer () {
                        const container = document.getElementById("obliqueViewer"),
                iframe = this.$refs.iframeContent;

            if (container && iframe) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const {height, width} = entry.contentRect;

                        iframe.style.height = `${height}px`;
                        iframe.style.width = `${width}px`;
                    }
                });

                this.resizeObserver.observe(container);
            }
        }
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
            title="ObliqueIframe"
            style="border: 0; display: block;"
            :src="obliqueViewerURL"
        />
        <div
            v-if="currentImageName"
            id="oblique-footer"
        >
            {{ currentImageName }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
#obliqueViewer{
    height: 84vh;
    container-type: inline-size;
}

#oblique-footer {
    display: none;
    padding: 4px 8px;
    font-size: 0.8rem;
    color: #333;
    background: rgba(255, 255, 255, 0.85);
    text-align: left;
}

@container (min-width: 605px) {
    #oblique-footer {
        display: block;
    }
}
</style>
