<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import mutationsObliqueViewer from "../store/mutationsVcOblique.js";

export default {
    name: "VcOblique",
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
        ])
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
            title="ObliqueIframe"
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
#obliqueViewer {
    height: 84vh;
    display: flex;
    flex-direction: column;
    min-height: 0;
    container-type: inline-size;
}

#obliqueIframe {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    border: 0;
    display: block;
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
